import s from './screens.module.css';

export default function PendingScreen({ reqId }) {
  return (
    <div className={`${s.screen} safe-top safe-bottom`} style={{justifyContent:'center', alignItems:'center', display:'flex', flexDirection:'column', gap:20, padding:32}}>
      <div className={s.pendingOrb}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
        </svg>
      </div>
      <h2 style={{fontSize:20, fontWeight:700, letterSpacing:2}}>AWAITING CLEARANCE</h2>
      <p style={{color:'var(--muted)', fontSize:13, textAlign:'center', lineHeight:1.7}}>
        Your access request has been submitted.<br/>HQ will review and approve your credentials.
      </p>
      {reqId && (
        <div style={{background:'var(--surface)', borderRadius:8, padding:'10px 16px', fontSize:11, color:'var(--muted)', fontFamily:'monospace'}}>
          REF: {reqId.toUpperCase()}
        </div>
      )}
      <div className={s.pendingDots}>
        <span/><span/><span/>
      </div>
    </div>
  );
}
