import { useState } from 'react';
import s from './screens.module.css';

export default function NetworkScreen({ deviceId, wgConfig, onBack }) {
  const [copied, setCopied] = useState(false);

  function copyId() {
    navigator.clipboard?.writeText(deviceId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function downloadConfig() {
    const blob = new Blob([wgConfig], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'securecomm.conf';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={`${s.screen} safe-top safe-bottom`} style={{ overflowY: 'auto' }}>
      <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Icon + title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(245,124,0,0.08)', border: '1px solid rgba(245,124,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                 stroke="#F57C00" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 6s4-2 11-2 11 2 11 2"/>
              <path d="M5 10s3-1.5 7-1.5S19 10 19 10"/>
              <path d="M9 14s1.5-1 3-1 3 1 3 1"/>
              <line x1="12" y1="20" x2="12" y2="20" strokeWidth="2.5"/>
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2, color: '#F57C00', marginBottom: 6 }}>
              NOT ON SECURE NETWORK
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.8, maxWidth: 300 }}>
              {wgConfig
                ? 'Download your VPN config, import it into WireGuard, activate the tunnel, then retry.'
                : 'You need to connect to the secure VPN before accessing SecureComm.'}
            </p>
          </div>
        </div>

        {/* Download config — shown if user has a WireGuard config */}
        {wgConfig ? (
          <>
            <button
              onClick={downloadConfig}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                width: '100%', padding: '16px 0', borderRadius: 12,
                background: 'rgba(27,94,32,0.2)', border: '1px solid rgba(27,94,32,0.5)',
                color: '#4CAF50', fontSize: 15, fontWeight: 700, letterSpacing: 1,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              DOWNLOAD VPN CONFIG
            </button>

            {/* Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['1', 'Download WireGuard', 'Install from the App Store or Google Play if needed.'],
                ['2', 'Download the config above', 'Saves securecomm.conf to your device.'],
                ['3', 'Import into WireGuard', 'Open WireGuard → tap + → Import from file → select securecomm.conf'],
                ['4', 'Activate & retry', 'Toggle the tunnel ON, then tap Retry below.'],
              ].map(([n, title, sub]) => (
                <div key={n} style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  background: 'var(--card)', borderRadius: 10, padding: 14,
                  border: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(27,94,32,0.2)', border: '1px solid rgba(27,94,32,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#1B5E20',
                  }}>{n}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{title}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3, lineHeight: 1.6 }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* No config yet — contact HQ */
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '20px 24px', textAlign: 'center',
          }}>
            <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.8 }}>
              No VPN config on file.<br/>Contact HQ and provide your Device ID below.
            </p>
          </div>
        )}

        {/* Device ID */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '16px 20px',
        }}>
          <p style={{ fontSize: 11, letterSpacing: 3, color: 'var(--muted)', marginBottom: 10, fontWeight: 700 }}>
            YOUR DEVICE ID
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <code style={{
              flex: 1, fontSize: 11, color: '#81C784', wordBreak: 'break-all',
              fontFamily: 'monospace', letterSpacing: 1,
            }}>
              {deviceId || 'Generating…'}
            </code>
            <button
              onClick={copyId}
              style={{
                flexShrink: 0, padding: '6px 12px', borderRadius: 6,
                background: copied ? 'rgba(27,94,32,0.2)' : 'var(--surface)',
                border: '1px solid var(--border)', color: copied ? '#4CAF50' : 'var(--muted)',
                fontSize: 11, fontWeight: 600, letterSpacing: 1,
              }}
            >
              {copied ? 'COPIED' : 'COPY'}
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, lineHeight: 1.6 }}>
            Provide this to HQ if asked to verify your device.
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onBack}
            style={{
              flex: 1, padding: '13px 0', borderRadius: 10,
              background: 'var(--surface)', border: '1px solid var(--border)',
              color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, letterSpacing: 1,
            }}
          >
            BACK
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              flex: 2, padding: '13px 0', borderRadius: 10,
              background: 'rgba(27,94,32,0.2)', border: '1px solid rgba(27,94,32,0.4)',
              color: '#4CAF50', fontSize: 13, fontWeight: 700, letterSpacing: 1,
            }}
          >
            RETRY
          </button>
        </div>

      </div>
    </div>
  );
}
