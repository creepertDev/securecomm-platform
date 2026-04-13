import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// ── Background shield overlay ──────────────────────────────────────────────────
// Injected before React mounts so it exists the moment the page loads.
// Shows a solid black screen whenever the app is backgrounded / goes to
// app-switcher — iOS grabs the recents thumbnail synchronously, so we must
// cover content *before* yielding to the event loop.
const shield = document.createElement('div');
Object.assign(shield.style, {
  position:        'fixed',
  inset:           '0',
  zIndex:          '2147483647',   // max z-index
  background:      '#0D0D0D',
  display:         'none',
  alignItems:      'center',
  justifyContent:  'center',
  flexDirection:   'column',
  gap:             '16px',
  pointerEvents:   'none',
});
shield.innerHTML = `
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
       stroke="#1B5E20" stroke-width="1.5">
    <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z"/>
  </svg>
  <div style="color:#1B5E20;font-family:-apple-system,sans-serif;
              font-size:13px;letter-spacing:3px;font-weight:700">SECURED</div>
`;
document.body.appendChild(shield);

// Show/hide helpers — also hide/unhide root for belt-and-suspenders
function showShield() {
  shield.style.display = 'flex';
  const root = document.getElementById('root');
  if (root) root.style.visibility = 'hidden';
}
function hideShield() {
  shield.style.display = 'none';
  const root = document.getElementById('root');
  if (root) root.style.visibility = '';
}

// visibilitychange — fires when tab/PWA goes to background (most reliable)
document.addEventListener('visibilitychange', () => {
  document.visibilityState === 'hidden' ? showShield() : hideShield();
});

// pagehide — fires on iOS PWA when home-button / swipe-up dismisses app
window.addEventListener('pagehide', showShield);
window.addEventListener('pageshow', hideShield);

// Page Lifecycle "freeze" — fired by Chrome/Android when page is frozen
document.addEventListener('freeze', showShield);
document.addEventListener('resume', hideShield);

// NOTE: window.blur is intentionally omitted — it fires for every focus
// shift (keyboard, notifications, alerts) and would black out the app
// constantly on mobile. visibilitychange + pagehide is sufficient.

// ── Screen-capture detection (Chrome 94+, desktop only) ──────────────────────
// No iOS support exists; this is a best-effort extra layer on Chrome/Android.
if (navigator.mediaDevices?.addEventListener) {
  try {
    // Fires when the user starts/stops screen capture
    navigator.mediaDevices.addEventListener('devicechange', () => {});
  } catch (_) {}
}

// ── Copy / paste / selection protection ───────────────────────────────────────
// 1. Intercept copy, cut, and context-menu at capture phase
document.addEventListener('copy',        blockIfNotInput, true);
document.addEventListener('cut',         blockIfNotInput, true);
document.addEventListener('contextmenu', blockIfNotInput, true);

// 2. Collapse any text selection that forms outside an input/textarea
//    (handles iOS long-press "Select All" on message bubbles)
document.addEventListener('selectionchange', () => {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) return;
  if (!sel.anchorNode?.parentElement?.closest('input, textarea')) {
    sel.removeAllRanges();
  }
});

// 3. Block keyboard copy shortcuts outside text inputs
document.addEventListener('keydown', (e) => {
  const tag = document.activeElement?.tagName;
  const isInput = tag === 'INPUT' || tag === 'TEXTAREA';
  if (!isInput && (e.metaKey || e.ctrlKey) && ['c', 'x', 'a'].includes(e.key)) {
    e.preventDefault();
  }
}, true);

function blockIfNotInput(e) {
  if (!e.target?.closest?.('input, textarea')) {
    e.preventDefault();
    e.stopPropagation();
  }
}

// ── Mount app ─────────────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')).render(<App />)
