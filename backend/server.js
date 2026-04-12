require('dotenv').config();
const express    = require('express');
const http       = require('http');
const WebSocket  = require('ws');
const path       = require('path');
const crypto     = require('crypto');
const os         = require('os');
const QRCode     = require('qrcode');
const bcrypt     = require('bcrypt');
const jwt        = require('jsonwebtoken');
const db         = require('./db');

const SALT_ROUNDS  = 10;
const JWT_SECRET   = process.env.JWT_SECRET   || 'change_me_in_production';
const HQ_PASSWORD  = process.env.HQ_PASSWORD  || 'hq@admin123';
const DEVICE_KEY   = process.env.DEVICE_KEY   || 'sc-device-key-change-in-prod';
const PORT         = process.env.PORT         || 3000;

const app    = express();
app.use(express.json());
const server = http.createServer(app);

// ── WebSocket server with device key enforcement ──────────────────────────────
const wss = new WebSocket.Server({
  server,
  verifyClient: ({ req }, done) => {
    const key = req.headers['x-device-key'];
    if (key !== DEVICE_KEY) {
      done(false, 403, 'Unauthorized device');
    } else {
      done(true);
    }
  },
});

// ── In-memory state ───────────────────────────────────────────────────────────
const pendingRequests = new Map();  // reqId → { reqId, name, role, avatar, passwordHash, ts, ws }
const activeClients   = new Map();  // ws    → { userId, name, role, avatar }

// ── Helpers ───────────────────────────────────────────────────────────────────
function getLocalIP() {
  for (const nets of Object.values(os.networkInterfaces())) {
    for (const net of nets) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return '127.0.0.1';
}

function ts() { return new Date().toTimeString().slice(0, 8); }

function send(ws, data) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
}

function broadcastToAll(data, excludeWs = null) {
  const json = JSON.stringify(data);
  wss.clients.forEach(ws => {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN && activeClients.has(ws)) ws.send(json);
  });
}

function broadcastToAdmins(data) {
  const json = JSON.stringify(data);
  wss.clients.forEach(ws => {
    const c = activeClients.get(ws);
    if (c && c.role === 'admin' && ws.readyState === WebSocket.OPEN) ws.send(json);
  });
}

function broadcastToGroup(groupId, data, excludeWs = null) {
  const json = JSON.stringify(data);
  wss.clients.forEach(ws => {
    if (ws === excludeWs || !ws.readyState === WebSocket.OPEN) return;
    const c = activeClients.get(ws);
    if (c && c.groups && c.groups.includes(groupId)) ws.send(json);
  });
}

function onlineUserList() {
  return [...activeClients.values()]
    .filter(c => c.role !== 'admin')
    .map(c => ({ userId: c.userId, name: c.name, role: c.role, avatar: c.avatar }));
}

function pendingList() {
  return [...pendingRequests.values()].map(r => ({
    reqId: r.reqId, name: r.name, role: r.role, avatar: r.avatar, ts: r.ts,
  }));
}

function issueToken(userId, name, role, avatar) {
  return jwt.sign({ userId, name, role, avatar }, JWT_SECRET, { expiresIn: '30d' });
}

function timingSafeEqual(a, b) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// ── WebSocket ─────────────────────────────────────────────────────────────────
wss.on('connection', (ws, req) => {
  console.log(`[${ts()}] [CONN] ${req.socket.remoteAddress}`);

  ws.on('message', async raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    // ── REGISTER ─────────────────────────────────────────────────────────────
    if (msg.type === 'register') {
      const name   = (msg.name || '').slice(0, 32).replace(/[<>]/g, '').trim();
      const role   = (msg.role || 'personnel').slice(0, 30);
      const avatar = msg.avatar || '🪖';
      const pass   = (msg.password || '').slice(0, 64);

      if (!name) { send(ws, { type: 'register_error', message: 'Name is required.' }); return; }
      if (!pass) { send(ws, { type: 'register_error', message: 'Password is required.' }); return; }

      const existing = await db.findUserByName(name);
      if (existing) { send(ws, { type: 'register_error', message: 'Name already taken.' }); return; }

      const passwordHash = await bcrypt.hash(pass, SALT_ROUNDS);
      const reqId = crypto.randomBytes(5).toString('hex');

      pendingRequests.set(reqId, { reqId, name, role, avatar, passwordHash, ts: Date.now(), ws });
      await db.addPendingRequest(reqId, name, role, avatar, passwordHash);
      console.log(`[${ts()}] [REG]  ${name} (${role}) reqId:${reqId}`);

      send(ws, { type: 'register_pending', reqId, message: 'Request sent to HQ. Awaiting approval…' });
      broadcastToAdmins({ type: 'new_request', request: { reqId, name, role, avatar, ts: Date.now() } });
      return;
    }

    // ── LOGIN ─────────────────────────────────────────────────────────────────
    if (msg.type === 'login') {
      const name = (msg.name || '').trim();
      const pass = msg.password || '';

      const user = await db.findUserByName(name);
      if (!user) { send(ws, { type: 'login_error', message: 'Invalid credentials or not yet approved.' }); return; }

      const match = await bcrypt.compare(pass, user.password_hash);
      if (!match) { send(ws, { type: 'login_error', message: 'Invalid credentials or not yet approved.' }); return; }

      const { user_id: userId, role, avatar } = user;
      const token  = issueToken(userId, name, role, avatar);
      const groups = await db.getUserGroups(userId);
      const groupIds = groups.map(g => g.group_id);

      activeClients.set(ws, { userId, name, role, avatar, groups: groupIds });
      console.log(`[${ts()}] [IN]   ${name}`);

      const history = await db.getGlobalMessages(50);
      send(ws, {
        type: 'welcome',
        userId, name, role, avatar, token,
        history,
        users: onlineUserList(),
        groups: groups.map(g => ({ groupId: g.group_id, name: g.name, description: g.description })),
      });
      broadcastToAll({ type: 'user_joined', user: { userId, name, role, avatar }, users: onlineUserList() }, ws);
      await db.logAudit('user_joined', name);
      return;
    }

    // ── ADMIN LOGIN ───────────────────────────────────────────────────────────
    if (msg.type === 'admin_login') {
      const pass  = msg.password || '';
      const valid = timingSafeEqual(pass, HQ_PASSWORD);
      if (!valid) { send(ws, { type: 'login_error', message: 'Wrong HQ password.' }); return; }

      const userId = 'admin_' + crypto.randomBytes(3).toString('hex');
      activeClients.set(ws, { userId, name: '⚙ HQ Admin', role: 'admin', avatar: '🖥', groups: [] });
      console.log(`[${ts()}] [HQ]   Admin connected`);

      const [msgCount, allGroups, allUsers] = await Promise.all([
        db.countMessages(), db.getAllGroups(), db.getAllUsers(),
      ]);

      // Attach member counts to groups
      const groupsWithMembers = await Promise.all(allGroups.map(async g => {
        const members = await db.getGroupMembers(g.group_id);
        return { groupId: g.group_id, name: g.name, description: g.description, members };
      }));

      send(ws, {
        type: 'admin_welcome',
        userId,
        pendingRequests: pendingList(),
        users: onlineUserList(),
        messageCount: msgCount,
        groups: groupsWithMembers,
        allUsers: allUsers.map(u => ({ userId: u.user_id, name: u.name, role: u.role, avatar: u.avatar })),
      });
      return;
    }

    // ── APPROVE ───────────────────────────────────────────────────────────────
    if (msg.type === 'approve') {
      const client = activeClients.get(ws);
      if (!client || client.role !== 'admin') return;

      const req = pendingRequests.get(msg.reqId);
      if (!req) { send(ws, { type: 'error', message: 'Request expired or already handled.' }); return; }

      const userId = 'usr_' + crypto.randomBytes(4).toString('hex');
      await db.createUser(userId, req.name, req.role, req.avatar, req.passwordHash);
      await db.removePendingRequest(msg.reqId);
      pendingRequests.delete(msg.reqId);
      console.log(`[${ts()}] [OK]   Approved: ${req.name}`);

      const token = issueToken(userId, req.name, req.role, req.avatar);
      if (req.ws?.readyState === WebSocket.OPEN) {
        send(req.ws, { type: 'approved', userId, name: req.name, token, message: 'Access granted!' });
      }

      await db.logAudit('approved', client.name, req.name);
      broadcastToAdmins({
        type: 'request_resolved', reqId: msg.reqId, action: 'approved',
        name: req.name, pendingRequests: pendingList(),
        newUser: { userId, name: req.name, role: req.role, avatar: req.avatar },
      });
      send(ws, { type: 'action_ok', message: `✓ ${req.name} approved.` });
      return;
    }

    // ── REJECT ────────────────────────────────────────────────────────────────
    if (msg.type === 'reject') {
      const client = activeClients.get(ws);
      if (!client || client.role !== 'admin') return;

      const req = pendingRequests.get(msg.reqId);
      if (!req) { send(ws, { type: 'error', message: 'Request not found.' }); return; }

      await db.removePendingRequest(msg.reqId);
      pendingRequests.delete(msg.reqId);

      if (req.ws?.readyState === WebSocket.OPEN) {
        send(req.ws, { type: 'rejected', message: 'Access request denied by HQ.' });
      }

      await db.logAudit('rejected', client.name, req.name);
      broadcastToAdmins({
        type: 'request_resolved', reqId: msg.reqId, action: 'rejected',
        name: req.name, pendingRequests: pendingList(),
      });
      send(ws, { type: 'action_ok', message: `✕ ${req.name} rejected.` });
      return;
    }

    // ── CREATE GROUP (admin only) ─────────────────────────────────────────────
    if (msg.type === 'create_group') {
      const client = activeClients.get(ws);
      if (!client || client.role !== 'admin') return;

      const name = (msg.name || '').slice(0, 64).trim();
      const desc = (msg.description || '').slice(0, 256).trim();
      if (!name) { send(ws, { type: 'error', message: 'Group name required.' }); return; }

      const groupId = 'grp_' + crypto.randomBytes(4).toString('hex');
      const group   = await db.createGroup(groupId, name, desc, client.userId);
      console.log(`[${ts()}] [GRP]  Created: ${name}`);

      await db.logAudit('group_created', client.name, name);
      send(ws, { type: 'group_created', group: { groupId, name, description: desc, members: [] } });
      broadcastToAdmins({ type: 'group_created', group: { groupId, name, description: desc, members: [] } });
      return;
    }

    // ── DELETE GROUP (admin only) ─────────────────────────────────────────────
    if (msg.type === 'delete_group') {
      const client = activeClients.get(ws);
      if (!client || client.role !== 'admin') return;

      const group = await db.getGroup(msg.groupId);
      if (!group) { send(ws, { type: 'error', message: 'Group not found.' }); return; }

      await db.deleteGroup(msg.groupId);
      await db.logAudit('group_deleted', client.name, group.name);

      // Notify affected online users
      wss.clients.forEach(c => {
        const cc = activeClients.get(c);
        if (cc?.groups?.includes(msg.groupId)) {
          cc.groups = cc.groups.filter(g => g !== msg.groupId);
          send(c, { type: 'group_removed', groupId: msg.groupId });
        }
      });

      broadcastToAdmins({ type: 'group_deleted', groupId: msg.groupId });
      send(ws, { type: 'action_ok', message: `Group deleted.` });
      return;
    }

    // ── ADD MEMBER TO GROUP (admin only) ─────────────────────────────────────
    if (msg.type === 'add_member') {
      const client = activeClients.get(ws);
      if (!client || client.role !== 'admin') return;

      const { groupId, userId } = msg;
      const [group, user] = await Promise.all([db.getGroup(groupId), db.findUserById(userId)]);
      if (!group) { send(ws, { type: 'error', message: 'Group not found.' }); return; }
      if (!user)  { send(ws, { type: 'error', message: 'User not found.' }); return; }

      await db.addGroupMember(groupId, userId, client.userId);
      const members = await db.getGroupMembers(groupId);

      // Notify the user if they're online
      wss.clients.forEach(c => {
        const cc = activeClients.get(c);
        if (cc?.userId === userId) {
          if (!cc.groups.includes(groupId)) cc.groups.push(groupId);
          send(c, {
            type: 'added_to_group',
            group: { groupId, name: group.name, description: group.description },
          });
        }
      });

      await db.logAudit('member_added', client.name, `${user.name} → ${group.name}`);
      broadcastToAdmins({ type: 'group_updated', groupId, members });
      send(ws, { type: 'action_ok', message: `${user.name} added to ${group.name}.` });
      return;
    }

    // ── REMOVE MEMBER FROM GROUP (admin only) ─────────────────────────────────
    if (msg.type === 'remove_member') {
      const client = activeClients.get(ws);
      if (!client || client.role !== 'admin') return;

      const { groupId, userId } = msg;
      const [group, user] = await Promise.all([db.getGroup(groupId), db.findUserById(userId)]);
      if (!group) { send(ws, { type: 'error', message: 'Group not found.' }); return; }

      await db.removeGroupMember(groupId, userId);
      const members = await db.getGroupMembers(groupId);

      wss.clients.forEach(c => {
        const cc = activeClients.get(c);
        if (cc?.userId === userId) {
          cc.groups = cc.groups.filter(g => g !== groupId);
          send(c, { type: 'group_removed', groupId });
        }
      });

      await db.logAudit('member_removed', client.name, `${user?.name} ← ${group.name}`);
      broadcastToAdmins({ type: 'group_updated', groupId, members });
      send(ws, { type: 'action_ok', message: `User removed from ${group.name}.` });
      return;
    }

    // ── JOIN GROUP (load history) ─────────────────────────────────────────────
    if (msg.type === 'join_group') {
      const client = activeClients.get(ws);
      if (!client) return;

      const { groupId } = msg;
      const isMember = await db.isGroupMember(groupId, client.userId);
      if (!isMember) { send(ws, { type: 'error', message: 'Not a member of this group.' }); return; }

      const history = await db.getGroupMessages(groupId, 50);
      send(ws, { type: 'group_history', groupId, messages: history });
      return;
    }

    // ── MESSAGE ───────────────────────────────────────────────────────────────
    if (msg.type === 'message') {
      const client = activeClients.get(ws);
      if (!client) return;

      const text    = (msg.text || '').slice(0, 2000).replace(/</g, '&lt;').trim();
      const groupId = msg.groupId || null;
      if (!text) return;

      // If group message, verify membership
      if (groupId) {
        const isMember = await db.isGroupMember(groupId, client.userId);
        if (!isMember) { send(ws, { type: 'error', message: 'Not a member of this group.' }); return; }
      }

      const id    = crypto.randomBytes(6).toString('hex');
      const entry = {
        type: 'message',
        id,
        groupId,
        from: { userId: client.userId, name: client.name, role: client.role, avatar: client.avatar },
        text,
        ts: Date.now(),
      };

      await db.saveMessage(id, groupId, client.userId, client.name, client.role, client.avatar, text);

      if (groupId) {
        broadcastToGroup(groupId, entry);
      } else {
        const json = JSON.stringify(entry);
        wss.clients.forEach(w => {
          if (w.readyState === WebSocket.OPEN && activeClients.has(w)) w.send(json);
        });
      }
      console.log(`[${ts()}] [MSG]  ${client.name}${groupId ? ` [${groupId}]` : ''}: ${text.slice(0, 60)}`);
      return;
    }

    // ── TYPING ────────────────────────────────────────────────────────────────
    if (msg.type === 'typing') {
      const client = activeClients.get(ws);
      if (!client) return;
      const payload = { type: 'typing', user: { userId: client.userId, name: client.name }, isTyping: msg.isTyping, groupId: msg.groupId || null };
      if (msg.groupId) {
        broadcastToGroup(msg.groupId, payload, ws);
      } else {
        broadcastToAll(payload, ws);
      }
    }
  });

  ws.on('close', async () => {
    for (const [id, r] of pendingRequests) {
      if (r.ws === ws) { pendingRequests.delete(id); break; }
    }
    const client = activeClients.get(ws);
    if (client) {
      activeClients.delete(ws);
      broadcastToAll({ type: 'user_left', userId: client.userId, users: onlineUserList() });
      console.log(`[${ts()}] [OUT]  ${client.name}`);
      if (client.role !== 'admin') await db.logAudit('user_left', client.name).catch(() => {});
    }
  });

  ws.on('error', e => console.error('WS:', e.message));
});

// ── HTTP ──────────────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (_, res) => res.json({ status: 'ok', uptime: Math.floor(process.uptime()) }));

app.get('/status', async (_, res) => {
  const msgCount = await db.countMessages();
  res.json({
    online:       onlineUserList(),
    pending:      pendingList(),
    messageCount: msgCount,
    uptime:       Math.floor(process.uptime()),
  });
});

app.get('/qr', async (_, res) => {
  const ip  = getLocalIP();
  const url = `http://${ip}:${PORT}`;
  try { res.json({ url, qr: await QRCode.toDataURL(url, { width: 300, margin: 2 }) }); }
  catch { res.json({ url, qr: null }); }
});

// ── Start ─────────────────────────────────────────────────────────────────────
(async () => {
  await db.init();
  server.listen(PORT, '0.0.0.0', () => {
    const ip = getLocalIP();
    console.log(`\n╔══════════════════════════════════════════╗`);
    console.log(`║       SECURECOMM — SERVER STARTED        ║`);
    console.log(`╠══════════════════════════════════════════╣`);
    console.log(`║  Local:  http://${ip}:${PORT}`.padEnd(44) + '║');
    console.log(`║  API:    https://api.inv.works            ║`);
    console.log(`║  HQ:     https://hq.inv.works             ║`);
    console.log(`║  DevKey: ${DEVICE_KEY.slice(0, 28)}…`.padEnd(44) + '║');
    console.log(`╚══════════════════════════════════════════╝\n`);
  });
})();
