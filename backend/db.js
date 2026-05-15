require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Pool }         = require('pg');
const { randomBytes }  = require('crypto');

// Parse DB_URL into explicit params to avoid pg SASL password-string issues
function buildPoolConfig() {
  const url = process.env.DB_URL;
  if (url) {
    const u = new URL(url);
    return {
      host:     u.hostname,
      port:     parseInt(u.port || '5432', 10),
      database: u.pathname.replace(/^\//, ''),
      user:     u.username,
      password: u.password,
    };
  }
  // fallback to individual env vars
  return {
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME     || 'securecomm',
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || '',
  };
}

const pool = new Pool(buildPoolConfig());

async function init() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id       TEXT PRIMARY KEY,
        name          TEXT NOT NULL,
        role          TEXT NOT NULL,
        avatar        TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        wg_client_id  TEXT,
        device_id     TEXT,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS groups (
        group_id    TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        description TEXT,
        created_by  TEXT NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS group_members (
        group_id   TEXT REFERENCES groups(group_id) ON DELETE CASCADE,
        user_id    TEXT REFERENCES users(user_id) ON DELETE CASCADE,
        added_by   TEXT NOT NULL,
        added_at   TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (group_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id           TEXT PRIMARY KEY,
        group_id     TEXT REFERENCES groups(group_id) ON DELETE CASCADE,
        from_user_id TEXT NOT NULL,
        from_name    TEXT NOT NULL,
        from_role    TEXT NOT NULL,
        from_avatar  TEXT NOT NULL,
        text         TEXT NOT NULL,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS channel_keys (
        channel_id TEXT PRIMARY KEY,
        key_b64    TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS audit_log (
        id         SERIAL PRIMARY KEY,
        action     TEXT NOT NULL,
        actor      TEXT NOT NULL,
        target     TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS pending_requests (
        req_id        TEXT PRIMARY KEY,
        name          TEXT NOT NULL,
        role          TEXT NOT NULL,
        avatar        TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        device_id     TEXT,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Migrations for schema upgrades
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS group_id TEXT REFERENCES groups(group_id) ON DELETE CASCADE;
      EXCEPTION WHEN others THEN NULL;
      END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE users ADD COLUMN IF NOT EXISTS device_id TEXT;
      EXCEPTION WHEN others THEN NULL;
      END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE pending_requests ADD COLUMN IF NOT EXISTS device_id TEXT;
      EXCEPTION WHEN others THEN NULL;
      END $$;
    `);
  } finally {
    client.release();
  }
}

// ── Users ────────────────────────────────────────────────────────────────────

async function createUser(userId, name, role, avatar, passwordHash, wgClientId = null, deviceId = null) {
  const res = await pool.query(
    'INSERT INTO users (user_id, name, role, avatar, password_hash, wg_client_id, device_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [userId, name, role, avatar, passwordHash, wgClientId, deviceId]
  );
  return res.rows[0];
}

async function bindDeviceId(userId, deviceId) {
  await pool.query('UPDATE users SET device_id = $1 WHERE user_id = $2', [deviceId, userId]);
}

async function findUserByName(name) {
  const res = await pool.query('SELECT * FROM users WHERE name = $1', [name]);
  return res.rows[0] || null;
}

async function findUserById(userId) {
  const res = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]);
  return res.rows[0] || null;
}

async function getAllUsers() {
  const res = await pool.query(
    'SELECT user_id, name, role, avatar, created_at FROM users ORDER BY created_at'
  );
  return res.rows;
}

async function countUsers() {
  const res = await pool.query('SELECT COUNT(*) FROM users');
  return parseInt(res.rows[0].count, 10);
}

// ── Groups ───────────────────────────────────────────────────────────────────

async function createGroup(groupId, name, description, createdBy) {
  const res = await pool.query(
    'INSERT INTO groups (group_id, name, description, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
    [groupId, name, description || null, createdBy]
  );
  return res.rows[0];
}

async function getGroup(groupId) {
  const res = await pool.query('SELECT * FROM groups WHERE group_id = $1', [groupId]);
  return res.rows[0] || null;
}

async function getAllGroups() {
  const res = await pool.query('SELECT * FROM groups ORDER BY created_at');
  return res.rows;
}

async function deleteGroup(groupId) {
  await pool.query('DELETE FROM groups WHERE group_id = $1', [groupId]);
}

async function addGroupMember(groupId, userId, addedBy) {
  await pool.query(
    'INSERT INTO group_members (group_id, user_id, added_by) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
    [groupId, userId, addedBy]
  );
}

async function removeGroupMember(groupId, userId) {
  await pool.query(
    'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, userId]
  );
}

async function getGroupMembers(groupId) {
  const res = await pool.query(
    `SELECT u.user_id, u.name, u.role, u.avatar, gm.added_at
     FROM group_members gm
     JOIN users u ON u.user_id = gm.user_id
     WHERE gm.group_id = $1
     ORDER BY gm.added_at`,
    [groupId]
  );
  return res.rows;
}

async function getUserGroups(userId) {
  const res = await pool.query(
    `SELECT g.* FROM groups g
     JOIN group_members gm ON gm.group_id = g.group_id
     WHERE gm.user_id = $1
     ORDER BY g.created_at`,
    [userId]
  );
  return res.rows;
}

async function isGroupMember(groupId, userId) {
  const res = await pool.query(
    'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, userId]
  );
  return res.rows.length > 0;
}

// ── Messages ─────────────────────────────────────────────────────────────────

async function saveMessage(id, groupId, fromUserId, fromName, fromRole, fromAvatar, text) {
  await pool.query(
    `INSERT INTO messages (id, group_id, from_user_id, from_name, from_role, from_avatar, text)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, groupId || null, fromUserId, fromName, fromRole, fromAvatar, text]
  );
}

async function getGroupMessages(groupId, limit = 50) {
  const res = await pool.query(
    `SELECT * FROM messages WHERE group_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [groupId, limit]
  );
  return res.rows.reverse().map(_formatMessage);
}

async function getGlobalMessages(limit = 50) {
  const res = await pool.query(
    `SELECT * FROM messages WHERE group_id IS NULL ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return res.rows.reverse().map(_formatMessage);
}

function _formatMessage(m) {
  return {
    type: 'message',
    id: m.id,
    groupId: m.group_id || null,
    from: { userId: m.from_user_id, name: m.from_name, role: m.from_role, avatar: m.from_avatar },
    text: m.text,
    ts: new Date(m.created_at).getTime(),
  };
}

async function countMessages() {
  const res = await pool.query('SELECT COUNT(*) FROM messages');
  return parseInt(res.rows[0].count, 10);
}

// ── Pending requests ─────────────────────────────────────────────────────────

async function addPendingRequest(reqId, name, role, avatar, passwordHash, deviceId = null) {
  await pool.query(
    `INSERT INTO pending_requests (req_id, name, role, avatar, password_hash, device_id)
     VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (req_id) DO NOTHING`,
    [reqId, name, role, avatar, passwordHash, deviceId]
  );
}

async function removePendingRequest(reqId) {
  await pool.query('DELETE FROM pending_requests WHERE req_id = $1', [reqId]);
}

// ── Audit log ─────────────────────────────────────────────────────────────────

async function logAudit(action, actor, target = null) {
  await pool.query(
    'INSERT INTO audit_log (action, actor, target) VALUES ($1, $2, $3)',
    [action, actor, target]
  );
}

async function getAuditLog(limit = 100) {
  const res = await pool.query(
    'SELECT * FROM audit_log ORDER BY created_at DESC LIMIT $1',
    [limit]
  );
  return res.rows;
}

// ── Channel encryption keys ──────────────────────────────────────────────────

/**
 * Returns the AES-256-GCM key (base64) for a channel, creating it if needed.
 * channelId is 'global' for the global chat, or a group_id for group chats.
 */
async function getOrCreateChannelKey(channelId) {
  const res = await pool.query(
    'SELECT key_b64 FROM channel_keys WHERE channel_id = $1', [channelId]
  );
  if (res.rows.length > 0) return res.rows[0].key_b64;

  const key = randomBytes(32).toString('base64'); // 256-bit AES key
  await pool.query(
    'INSERT INTO channel_keys (channel_id, key_b64) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [channelId, key]
  );
  // Re-fetch in case of concurrent insert
  const res2 = await pool.query(
    'SELECT key_b64 FROM channel_keys WHERE channel_id = $1', [channelId]
  );
  return res2.rows[0].key_b64;
}

/**
 * Returns all channel keys a user has access to:
 * { global: 'b64', grp_xxx: 'b64', ... }
 */
async function getUserChannelKeys(userId) {
  const keys = {};
  keys['global'] = await getOrCreateChannelKey('global');

  const groups = await pool.query(
    'SELECT group_id FROM group_members WHERE user_id = $1', [userId]
  );
  for (const { group_id } of groups.rows) {
    keys[group_id] = await getOrCreateChannelKey(group_id);
  }
  return keys;
}

module.exports = {
  pool, init,
  // users
  createUser, bindDeviceId, findUserByName, findUserById, getAllUsers, countUsers,
  // groups
  createGroup, getGroup, getAllGroups, deleteGroup,
  addGroupMember, removeGroupMember, getGroupMembers, getUserGroups, isGroupMember,
  // messages
  saveMessage, getGroupMessages, getGlobalMessages, countMessages,
  // pending
  addPendingRequest, removePendingRequest,
  // audit
  logAudit, getAuditLog,
  // encryption
  getOrCreateChannelKey, getUserChannelKeys,
};
