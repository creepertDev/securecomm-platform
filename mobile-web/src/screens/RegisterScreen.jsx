import { useState } from 'react';
import s from './screens.module.css';

const ROLES = ['Officer', 'Soldier', 'Intelligence', 'Medic', 'Engineer', 'Support'];
const AVATARS = ['🎖️','⚔️','🛡️','🔭','🔧','📡','🚁','🎯'];

export default function RegisterScreen({ onRegister, onBack }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState(ROLES[0]);
  const [pass, setPass] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [loading, setLoading] = useState(false);

  const submit = () => {
    if (!name.trim() || !pass) return;
    setLoading(true);
    onRegister(name.trim(), role, pass);
  };

  return (
    <div className={`${s.screen} safe-top safe-bottom`}>
      <div className={s.authWrap}>
        <button className={s.backBtn} onClick={onBack}>← Back</button>
        <h1 className={s.authTitle} style={{marginTop: 12}}>REQUEST ACCESS</h1>
        <p className={s.authSub}>PENDING HQ APPROVAL</p>

        <div className={s.avatarRow}>
          {AVATARS.map(a => (
            <button
              key={a}
              className={`${s.avatarBtn} ${a === avatar ? s.avatarBtnActive : ''}`}
              onClick={() => setAvatar(a)}
            >{a}</button>
          ))}
        </div>

        <div className={s.fieldGroup}>
          <label className={s.label}>Call Sign / Name</label>
          <input className={s.input} placeholder="Enter your call sign" value={name}
            onChange={e => setName(e.target.value)} autoCapitalize="none" autoCorrect="off" />
        </div>

        <div className={s.fieldGroup}>
          <label className={s.label}>Role</label>
          <select className={s.input} value={role} onChange={e => setRole(e.target.value)}
            style={{appearance:'none', WebkitAppearance:'none'}}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className={s.fieldGroup}>
          <label className={s.label}>Password</label>
          <input className={s.input} type="password" placeholder="Choose a password"
            value={pass} onChange={e => setPass(e.target.value)} />
        </div>

        <button className={s.btn} onClick={submit} disabled={loading}>
          {loading ? <span className={s.btnSpinner} /> : 'SUBMIT REQUEST'}
        </button>
      </div>
    </div>
  );
}
