import s from './screens.module.css';

export default function RejectedScreen({ onBack }) {
  return (
    <div className={`${s.screen} safe-top safe-bottom`} style={{justifyContent:'center', alignItems:'center', display:'flex', flexDirection:'column', gap:20, padding:32, textAlign:'center'}}>
      <div style={{
        width:72, height:72, borderRadius:'50%',
        background:'rgba(183,28,28,0.1)', border:'1px solid rgba(183,28,28,0.3)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#B71C1C" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <h2 style={{fontSize:20, fontWeight:700, letterSpacing:2, color:'#EF5350'}}>ACCESS DENIED</h2>
      <p style={{color:'var(--muted)', fontSize:13, lineHeight:1.7, maxWidth:280}}>
        Your access request was not approved by HQ.<br/>Contact your commanding officer for assistance.
      </p>
      <button
        onClick={onBack}
        style={{
          marginTop:8, padding:'12px 32px', borderRadius:8,
          background:'var(--surface)', border:'1px solid var(--border)',
          color:'rgba(255,255,255,0.6)', fontSize:13, fontWeight:600, letterSpacing:1,
        }}
      >
        BACK TO LOGIN
      </button>
    </div>
  );
}
