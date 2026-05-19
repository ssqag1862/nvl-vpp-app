import React, { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { auth, db } from '../firebase';
import { VUNG_LIST, VUNG_STRUCTURE, ORG_STRUCTURE } from '../data/orgStructure';
import './LoginScreen.css';

function LoginScreen({ onLogin }) {
  const [step, setStep] = useState('signin'); // 'signin' | 'setup'
  const [googleUser, setGoogleUser] = useState(null);
  const [vung, setVung] = useState('');
  const [khuVuc, setKhuVuc] = useState('');
  const [phongBan, setPhongBan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const khuVucList = vung ? VUNG_STRUCTURE[vung] : [];
  const phongBanList = khuVuc ? (ORG_STRUCTURE[khuVuc] || []) : [];
  const hasPhongBan = phongBanList.length > 0;
  const canSubmit = vung && khuVuc && (!hasPhongBan || phongBan);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      // Check if profile exists
      const snap = await get(ref(db, `users/${fbUser.uid}`));
      if (snap.exists()) {
        const p = snap.val();
        onLogin({ uid: fbUser.uid, username: p.displayName, vung: p.vung, khuVuc: p.khuVuc, phongBan: p.phongBan, email: fbUser.email });
      } else {
        setGoogleUser(fbUser);
        setStep('setup');
      }
    } catch (err) {
      setError('Đăng nhập thất bại. Vui lòng thử lại.');
      console.error(err);
    }
    setLoading(false);
  };

  const handleProfileSetup = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const pb = hasPhongBan ? phongBan : khuVuc;
      const profile = {
        displayName: googleUser.displayName,
        email: googleUser.email,
        vung,
        khuVuc,
        phongBan: pb,
        createdAt: Date.now(),
      };
      await set(ref(db, `users/${googleUser.uid}`), profile);
      onLogin({ uid: googleUser.uid, username: googleUser.displayName, vung, khuVuc, phongBan: pb, email: googleUser.email });
    } catch (err) {
      setError('Lỗi lưu thông tin. Vui lòng thử lại.');
    }
    setLoading(false);
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-logo">NVL</div>
        <h1>Catalogue <span>NVL & VPP</span></h1>

        {step === 'signin' && (
          <>
            <p>Đăng nhập để vào hệ thống</p>
            {error && <div className="login-error">{error}</div>}
            <button className="btn-google" onClick={handleGoogleSignIn} disabled={loading}>
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập với Google'}
            </button>
          </>
        )}

        {step === 'setup' && (
          <>
            <p>Xin chào <strong>{googleUser?.displayName}</strong>! Chọn đơn vị của bạn</p>
            {error && <div className="login-error">{error}</div>}
            <form onSubmit={handleProfileSetup}>
              <div className="login-field">
                <label>Vùng</label>
                <select value={vung} onChange={e => { setVung(e.target.value); setKhuVuc(''); setPhongBan(''); }}>
                  <option value="">-- Chọn vùng --</option>
                  {VUNG_LIST.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="login-field">
                <label>Khu vực / Tỉnh thành</label>
                <select value={khuVuc} onChange={e => { setKhuVuc(e.target.value); setPhongBan(''); }} disabled={!vung}>
                  <option value="">-- Chọn khu vực --</option>
                  {khuVucList.map(kv => <option key={kv} value={kv}>{kv}</option>)}
                </select>
              </div>
              {hasPhongBan && (
                <div className="login-field">
                  <label>Phòng ban / Bộ phận</label>
                  <select value={phongBan} onChange={e => setPhongBan(e.target.value)} disabled={!khuVuc}>
                    <option value="">-- Chọn phòng ban --</option>
                    {phongBanList.map(pb => <option key={pb} value={pb}>{pb}</option>)}
                  </select>
                </div>
              )}
              <button type="submit" disabled={!canSubmit || loading}>
                {loading ? 'Đang lưu...' : 'Vào hệ thống →'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default LoginScreen;
