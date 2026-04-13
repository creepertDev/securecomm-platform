/**
 * WireGuard provisioning via wg-easy REST API
 * Creates/deletes client configs when users are approved/rejected.
 */
const http = require('http');

const WG_HOST     = process.env.WG_HOST     || 'localhost';
const WG_PORT     = parseInt(process.env.WG_UI_PORT || '51821', 10);
const WG_PASSWORD = process.env.WG_PASSWORD || 'hq@admin123';

let _sessionCookie = null;

// ── Internal helpers ──────────────────────────────────────────────────────────

function _request(method, path, body = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const data    = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (data)   headers['Content-Length'] = Buffer.byteLength(data);
    if (cookie) headers['Cookie']         = cookie;

    const req = http.request(
      { hostname: 'localhost', port: WG_PORT, path, method, headers },
      res => {
        let buf = '';
        res.on('data', d => buf += d);
        res.on('end', () => {
          const setCookie = res.headers['set-cookie'];
          resolve({
            status: res.statusCode,
            headers: res.headers,
            cookie: setCookie ? setCookie[0].split(';')[0] : null,
            body: buf ? (() => { try { return JSON.parse(buf); } catch { return buf; } })() : null,
          });
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function _getSession() {
  if (_sessionCookie) {
    // Verify still valid
    const check = await _request('GET', '/api/wireguard/client', null, _sessionCookie);
    if (check.status === 200) return _sessionCookie;
  }
  const res = await _request('POST', '/api/session', { password: WG_PASSWORD });
  if (res.status !== 200 || !res.body?.success) throw new Error('wg-easy auth failed');
  _sessionCookie = res.cookie;
  return _sessionCookie;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Create a WireGuard client for a user.
 * Returns the client config as a string (wg0.conf format) and the client ID.
 */
async function createClient(name) {
  const session = await _getSession();
  const res     = await _request('POST', '/api/wireguard/client', { name }, session);
  if (res.status !== 200) throw new Error(`wg-easy create failed: ${res.status}`);
  const clientId = res.body.id;

  // Fetch the config file
  const confRes = await _request('GET', `/api/wireguard/client/${clientId}/configuration`, null, session);
  if (confRes.status !== 200) throw new Error('wg-easy config fetch failed');
  const config = confRes.body; // raw .conf string

  // Also get QR code SVG URL (useful for future dashboard display)
  const qrUrl = `http://${WG_HOST}:${WG_PORT}/api/wireguard/client/${clientId}/qrcode.svg`;

  return { clientId, config, qrUrl };
}

/**
 * Delete a WireGuard client by ID.
 */
async function deleteClient(clientId) {
  const session = await _getSession();
  const res     = await _request('DELETE', `/api/wireguard/client/${clientId}`, null, session);
  return res.status === 204 || res.status === 200;
}

/**
 * List all clients.
 */
async function listClients() {
  const session = await _getSession();
  const res     = await _request('GET', '/api/wireguard/client', null, session);
  return res.status === 200 ? res.body : [];
}

module.exports = { createClient, deleteClient, listClients };
