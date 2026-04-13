import { useEffect, useRef } from 'react';
import s from './screens.module.css';

export default function SplashScreen() {
  return (
    <div className={s.splash}>
      <div className={s.splashOrb}>
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#1B5E20" strokeWidth="1.5">
          <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z"/>
        </svg>
      </div>
      <div className={s.splashTitle}>SECURECOMM</div>
      <div className={s.splashSub}>SECURE COMMUNICATIONS</div>
      <div className={s.splashSpinner} />
    </div>
  );
}
