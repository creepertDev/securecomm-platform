import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import s from './screens.module.css';

export default function VpnScreen({ config, onContinue }) {
  const canvasRef = useRef(null);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    if (config && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, config, {
        width: 260,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      }).catch(() => {});
    }
  }, [config]);

  const downloadConfig = () => {
    const blob = new Blob([config], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'securecomm-wg0.conf';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`${s.screen} safe-top safe-bottom`} style={{ overflowY: 'auto' }}>
      <div style={{ padding: '24px 24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'rgba(27,94,32,0.15)', border: '1px solid rgba(27,94,32,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B5E20" strokeWidth="1.5">
              <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Secure VPN Setup</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 1 }}>WIREGUARD TUNNEL</div>
          </div>
        </div>

        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
          Scan this QR code with the <strong style={{ color: '#fff' }}>WireGuard app</strong> to activate your encrypted tunnel. Your config is unique — do not share it.
        </p>

        {/* QR Code */}
        {config ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{
              background: '#fff', borderRadius: 16, padding: 12,
              display: 'inline-block', lineHeight: 0,
            }}>
              <canvas ref={canvasRef} />
            </div>
          </div>
        ) : (
          <div style={{
            background: 'var(--surface)', borderRadius: 12, padding: 32,
            textAlign: 'center', color: 'var(--muted)', fontSize: 13,
          }}>
            No VPN config yet — contact HQ.
          </div>
        )}

        {/* Steps */}
        {config && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['1', 'Install WireGuard', 'Download from the App Store or Google Play.'],
              ['2', 'Scan QR Code', 'Open WireGuard → tap + → Create from QR code.'],
              ['3', 'Activate Tunnel', 'Toggle the tunnel ON, then return here.'],
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
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Copy raw config toggle */}
        {config && (
          <div>
            <button
              onClick={() => setShowRaw(v => !v)}
              style={{ background: 'none', color: 'var(--muted)', fontSize: 12, padding: '4px 0', marginBottom: 6 }}
            >
              {showRaw ? '▲ Hide' : '▼ Show'} raw config (for manual import)
            </button>
            {showRaw && (
              <div style={{
                background: 'var(--surface)', borderRadius: 8, padding: 12,
                fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.6)',
                whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.6,
                userSelect: 'text', WebkitUserSelect: 'text',
              }}>
                {config}
              </div>
            )}
            <button
              onClick={downloadConfig}
              style={{
                width: '100%', height: 42, marginTop: 8, borderRadius: 8,
                background: 'var(--surface)', border: '1px solid var(--border)',
                color: 'var(--muted)', fontSize: 13, fontWeight: 600,
              }}
            >
              ↓ Download .conf file
            </button>
          </div>
        )}

        {/* Continue button */}
        <button className={s.btn} onClick={onContinue}>
          ENTER SECURE CHANNELS
        </button>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: -12 }}>
          You can set up WireGuard later from the settings
        </p>
      </div>
    </div>
  );
}
