import s from './screens.module.css';

export default function VpnScreen({ config, onContinue }) {

  function downloadConfig() {
    const blob = new Blob([config], { type: 'text/plain' });
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

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(27,94,32,0.15)', border: '1px solid rgba(27,94,32,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1B5E20" strokeWidth="1.5">
              <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>VPN Setup</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 1.5 }}>WIREGUARD TUNNEL</div>
          </div>
        </div>

        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8 }}>
          Your personal VPN config has been generated. Download it and import it into WireGuard to activate your secure tunnel.
        </p>

        {config ? (
          <>
            {/* Primary action — download */}
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
              DOWNLOAD CONFIG
            </button>

            {/* Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['1', 'Download WireGuard', 'Install from the App Store or Google Play.'],
                ['2', 'Download the config above', 'Tap the button — saves securecomm.conf to your device.'],
                ['3', 'Import into WireGuard', 'Open WireGuard → tap + → Import from file → select securecomm.conf'],
                ['4', 'Activate the tunnel', 'Toggle it ON, then come back and tap Continue.'],
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
          <div style={{
            background: 'var(--surface)', borderRadius: 12, padding: 32,
            textAlign: 'center', color: 'var(--muted)', fontSize: 13,
          }}>
            No VPN config yet — contact HQ.
          </div>
        )}

        <button className={s.btn} onClick={onContinue}>
          CONTINUE TO APP
        </button>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: -12 }}>
          You can download the config again from the network screen if needed
        </p>
      </div>
    </div>
  );
}
