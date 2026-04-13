import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// ── Background shield overlay (must exist in DOM before React mounts) ─────────
// A solid black div that covers everything instantly — faster than CSS blur.
// iOS takes the app-switcher screenshot synchronously on pagehide/blur,
// so we show this overlay BEFORE yielding to the event loop.
const shield = document.createElement('div');
Object.assign(shield.style, {
  position: 'fixed', inset: '0', zIndex: '999999',
  background: '#0D0D0D', display: 'none',
  alignItems: 'center', justifyContent: 'center',
  flexDirection: 'column', gap: '16px',
});
shield.innerHTML = `
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1B5E20" stroke-width="1.5">
    <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z"/>
  </svg>
  <div style="color:#1B5E20;font-family:-apple-system,sans-serif;font-size:13px;letter-spacing:3px;font-weight:700">SECURED</div>
`;
document.body.appendChild(shield);

function showShield()  { shield.style.display = 'flex'; }
function hideShield()  { shield.style.display = 'none'; }

// Fire synchronously on all relevant events — covers iOS PWA, Safari, Chrome
document.addEventListener('visibilitychange', () =>
  document.visibilityState === 'hidden' ? showShield() : hideShield()
);
window.addEventListener('pagehide',  showShield);
window.addEventListener('pageshow',  hideShield);
window.addEventListener('blur',      showShield);
window.addEventListener('focus',     hideShield);

// ── Copy-paste protection ─────────────────────────────────────────────────────
// 1. Block copy/cut/contextmenu events
document.addEventListener('copy',        blockIfNotInput, true);
document.addEventListener('cut',         blockIfNotInput, true);
document.addEventListener('contextmenu', blockIfNotInput, true);

// 2. Kill any selection that forms outside inputs (iOS long-press)
document.addEventListener('selectionchange', () => {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) return;
  const node = sel.anchorNode?.parentElement;
  if (!node) return;
  const tag = node.closest('input, textarea');
  if (!tag) sel.removeAllRanges();
});

// 3. Block keyboard shortcuts outside inputs
document.addEventListener('keydown', (e) => {
  const tag = document.activeElement?.tagName;
  const isInput = tag === 'INPUT' || tag === 'TEXTAREA';
  if (!isInput && (e.metaKey || e.ctrlKey) && ['c','x','a'].includes(e.key)) {
    e.preventDefault();
  }
}, true);

function blockIfNotInput(e) {
  const node = e.target?.closest?.('input, textarea');
  if (!node) {
    e.preventDefault();
    e.stopPropagation();
  }
}

// ── Mount app ─────────────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')).render(<App />)
