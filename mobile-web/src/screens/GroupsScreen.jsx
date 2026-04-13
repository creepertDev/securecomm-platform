import s from './screens.module.css';

export default function GroupsScreen({ user, groups, onlineUsers, wsStatus, onOpenChat, onLogout, onShowVpn }) {
  const uid = user?.userId || '';

  return (
    <div className={`${s.screen} safe-top`}>
      {/* Header */}
      <div className={s.header}>
        <div className={s.headerLeft}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1B5E20" strokeWidth="2">
            <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z"/>
          </svg>
          <span className={s.headerTitle}>SECURECOMM</span>
        </div>
        <div className={s.headerRight}>
          {onShowVpn && (
            <button className={s.iconBtn} onClick={onShowVpn} title="VPN Setup">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1B5E20" strokeWidth="2"><path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z"/></svg>
            </button>
          )}
          <span className={s.dot} data-on={wsStatus === 'connected'} />
          <button className={s.iconBtn} onClick={onLogout} title="Logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* User card */}
      <div className={s.userCard}>
        <span style={{fontSize:32}}>{user?.avatar || '👤'}</span>
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontWeight:700, fontSize:15}}>{user?.name}</div>
          <div style={{fontSize:11, color:'var(--muted)', letterSpacing:1.5, textTransform:'uppercase'}}>{user?.role}</div>
          <div
            className={s.userId}
            onClick={() => { navigator.clipboard?.writeText(uid); }}
            title="Tap to copy ID"
          >
            ID: {uid.slice(0, 16)}… <span style={{fontSize:10}}>⎘</span>
          </div>
        </div>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:22, fontWeight:800, color:'#1B5E20'}}>{onlineUsers.length}</div>
          <div style={{fontSize:10, color:'var(--muted)'}}>online</div>
        </div>
      </div>

      {/* Section header */}
      <div className={s.sectionHeader}>
        <span>SECURE CHANNELS</span>
        <span>{groups.length} assigned</span>
      </div>

      {/* Groups list */}
      <div className={s.list} style={{flex:1, overflowY:'auto'}}>
        {groups.length === 0 ? (
          <div className={s.empty}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <p>No channels assigned</p>
            <p style={{fontSize:12, color:'rgba(255,255,255,0.2)'}}>HQ will assign you to channels after verifying your credentials.</p>
          </div>
        ) : groups.map(g => (
          <button key={g.groupId} className={s.groupTile} onClick={() => onOpenChat(g)}>
            <div className={s.groupIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B5E20" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div style={{flex:1, minWidth:0, textAlign:'left'}}>
              <div style={{fontWeight:600, fontSize:15}}>{g.name}</div>
              {g.description && <div style={{fontSize:12, color:'var(--muted)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{g.description}</div>}
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
