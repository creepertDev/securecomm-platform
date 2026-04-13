import { WS_URL, DEVICE_KEY } from './constants.js';

let ws = null;
let listeners = [];
let reconnectTimer = null;

export function getWs() { return ws; }

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

export function send(obj) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
}

export function disconnect() {
  clearTimeout(reconnectTimer);
  ws?.close();
  ws = null;
}
