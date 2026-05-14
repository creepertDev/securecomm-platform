import { WS_URL, DEVICE_KEY } from './constants.js';

let ws = null;
let reconnectTimer = null;

// ── Persistent device ID ──────────────────────────────────────────────────────
// Generated once on first app load, stored in localStorage forever.
// Bound to the user's account on first successful login.
function getDeviceId() {
  let id = localStorage.getItem('sc_device_id');
  if (!id) {
    id = 'sc-' + Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem('sc_device_id', id);
  }
  return id;
}

export const deviceId = getDeviceId();

export function connect(onMessage, onStatus) {
  if (ws && ws.readyState === WebSocket.OPEN) return;
  clearTimeout(reconnectTimer);

  ws = new WebSocket(`${WS_URL}?dk=${encodeURIComponent(DEVICE_KEY)}`);

  ws.onopen  = () => onStatus('connected');
  ws.onclose = () => {
    onStatus('disconnected');
    reconnectTimer = setTimeout(() => connect(onMessage, onStatus), 3000);
  };
  ws.onerror = () => onStatus('error');
  ws.onmessage = (e) => {
    try { onMessage(JSON.parse(e.data)); } catch (_) {}
  };
}

// Auto-injects deviceId into every outgoing message
export function send(obj) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ ...obj, deviceId }));
  }
}

export function disconnect() {
  clearTimeout(reconnectTimer);
  ws?.close();
  ws = null;
}
