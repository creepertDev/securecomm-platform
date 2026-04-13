import { useState } from 'react';
import s from './screens.module.css';

export default function LoginScreen({ onLogin, onGoRegister, wsStatus }) {
  const [name, setName] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = () => {
    if (!name.trim() || !pass) return;
    setLoading(true);
    onLogin(name.trim(), pass);
    setTimeout(() => setLoading(false), 6000);
  };

  return (
    <div className={`${s.screen} safe-top safe-bottom`}>
      <div className={s.authWrap}>
        <div className={s.authIcon}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1B5E20" strokeWidth="1.5">
            <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z"/>
          </svg>
        </div>
        <h1 className={s.authTitle}>SECURECOMM</h1>
        <p className={s.authSub}>AUTHENTICATION REQUIRED</p>

        <div className={s.wsIndicator} data-status={wsStatus} />

        <div className={s.fieldGroup}>
          <label className={s.label}>Call Sign / Name</label>
          <input
            className={s.input}
            placeholder="Enter your call sign"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>
        <div className={s.fieldGroup}>
          <label className={s.label}>Password</label>
          <input
            className={s.input}
            type="password"
            placeholder="Enter password"
            value={pass}
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
          />
        </div>

        <button className={s.btn} onClick={submit} disabled={loading}>
          {loading ? <span className={s.btnSpinner} /> : 'LOGIN'}
        </button>

        <button className={s.linkBtn} onClick={onGoRegister}>
          New personnel? Request access
        </button>
      </div>
    </div>
  );
}
