/**
 * Cloudflare DDNS — keeps wg.inv.works pointing to current public IP.
 * Also restarts wg-easy container if the IP has changed so WireGuard
 * configs use the correct endpoint.
 *
 * Run via PM2 alongside the backend.
 */
require('dotenv').config();
const https  = require('https');
const http   = require('http');
const { execSync } = require('child_process');

const CF_TOKEN  = process.env.CF_API_TOKEN;   // Cloudflare API token with DNS edit
const CF_ZONE   = process.env.CF_ZONE_ID;     // Zone ID for inv.works
const HOSTNAME  = 'wg.inv.works';
const CHECK_INTERVAL = 5 * 60 * 1000; // every 5 minutes

let lastIp = null;

function get(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d.trim()));
    }).on('error', reject);
  });
}

function cfRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req  = https.request({
      hostname: 'api.cloudflare.com',
      path:     `/client/v4${path}`,
      method,
      headers: {
        'Authorization': `Bearer ${CF_TOKEN}`,
        'Content-Type':  'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function getCurrentIp() {
  return get('https://api.ipify.org');
}

async function getDnsRecord() {
  if (!CF_TOKEN || !CF_ZONE) return null;
  const res = await cfRequest('GET', `/zones/${CF_ZONE}/dns_records?type=A&name=${HOSTNAME}`);
  return res.result?.[0] || null;
}

async function upsertDnsRecord(ip) {
  if (!CF_TOKEN || !CF_ZONE) {
    console.log(`[DDNS] No CF credentials — skipping DNS update (IP: ${ip})`);
    return;
  }
  const record = await getDnsRecord();
  if (record) {
    if (record.content === ip) {
      console.log(`[DDNS] ${HOSTNAME} already points to ${ip} — no change`);
      return;
    }
    await cfRequest('PATCH', `/zones/${CF_ZONE}/dns_records/${record.id}`, {
      content: ip, ttl: 60, proxied: false,
    });
    console.log(`[DDNS] Updated ${HOSTNAME}: ${record.content} → ${ip}`);
  } else {
    await cfRequest('POST', `/zones/${CF_ZONE}/dns_records`, {
      type: 'A', name: HOSTNAME, content: ip, ttl: 60, proxied: false,
    });
    console.log(`[DDNS] Created ${HOSTNAME} → ${ip}`);
  }
}

async function restartWgEasy(newIp) {
  try {
    execSync(
      `docker stop securecomm-wireguard && docker rm securecomm-wireguard && ` +
      `docker run -d --name securecomm-wireguard ` +
      `--cap-add NET_ADMIN --cap-add SYS_MODULE ` +
      `--sysctl net.ipv4.ip_forward=1 ` +
      `--sysctl net.ipv4.conf.all.src_valid_mark=1 ` +
      `-e WG_HOST=${newIp} ` +
      `-e PASSWORD_HASH='$2a$12$DAfNp7UztHyogCIHV98JK.Q20FQP310EmgGVPgMeE88vgaTQenZHG' ` +
      `-e WG_PORT=51820 ` +
      `-e WG_DEFAULT_ADDRESS=10.8.0.x ` +
      `-e WG_DEFAULT_DNS=1.1.1.1 ` +
      `-e WG_ALLOWED_IPS=10.8.0.0/24 ` +
      `-p 51820:51820/udp -p 51821:51821/tcp ` +
      `--restart unless-stopped ghcr.io/wg-easy/wg-easy`,
      { stdio: 'inherit' }
    );
    console.log(`[DDNS] Restarted wg-easy with WG_HOST=${newIp}`);
  } catch (e) {
    console.error(`[DDNS] Failed to restart wg-easy: ${e.message}`);
  }
}

async function check() {
  try {
    const ip = await getCurrentIp();
    if (ip === lastIp) return;
    console.log(`[DDNS] IP changed: ${lastIp ?? 'init'} → ${ip}`);
    lastIp = ip;
    await upsertDnsRecord(ip);
    await restartWgEasy(ip);
  } catch (e) {
    console.error(`[DDNS] Error: ${e.message}`);
  }
}

check();
setInterval(check, CHECK_INTERVAL);
console.log(`[DDNS] Watching ${HOSTNAME} — checking every 5 minutes`);
