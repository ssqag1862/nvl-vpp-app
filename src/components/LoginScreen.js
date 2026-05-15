import React, { useState } from 'react';
import { VUNG_LIST, VUNG_STRUCTURE, ORG_STRUCTURE } from '../data/orgStructure';
import './LoginScreen.css';

function LoginScreen({ onLogin }) {
  const [name, setName] = useState('');
  const [vung, setVung] = useState('');
  const [khuVuc, setKhuVuc] = useState('');
  const [phongBan, setPhongBan] = useState('');

  const khuVucList = vung ? VUNG_STRUCTURE[vung] : [];
  const phongBanList = khuVuc ? (ORG_STRUCTURE[khuVuc] || []) : [];
  const hasPhongBan = phongBanList.length > 0;

  const canSubmit = name.trim() && vung && khuVuc && (!hasPhongBan || phongBan);

  const handleVungChange = (e) => {
    setVung(e.target.value);
    setKhuVuc('');
    setPhongBan('');
  };

  const handleKhuVucChange = (e) => {
    setKhuVuc(e.target.value);
    setPhongBan('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (canSubmit) {
      onLogin({
        username: name.trim(),
        vung,
        khuVuc,
        phongBan: hasPhongBan ? phongBan : khuVuc,
      });
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-logo">NVL</div>
        <h1>Catalogue <span>NVL & VPP</span></h1>
        <p>Điền thông tin để vào hệ thống</p>
        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label>Họ và tên</label>
            <input
              type="text"
              placeholder="Nguyễn Văn A..."
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              maxLength={60}
            />
          </div>
          <div className="login-field">
            <label>Vùng</label>
            <select value={vung} onChange={handleVungChange}>
              <option value="">-- Chọn vùng --</option>
              {VUNG_LIST.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div className="login-field">
            <label>Khu vực / Tỉnh thành</label>
            <select value={khuVuc} onChange={handleKhuVucChange} disabled={!vung}>
              <option value="">-- Chọn khu vực --</option>
              {khuVucList.map(kv => (
                <option key={kv} value={kv}>{kv}</option>
              ))}
            </select>
          </div>
          {hasPhongBan && (
            <div className="login-field">
              <label>Phòng ban / Bộ phận</label>
              <select value={phongBan} onChange={e => setPhongBan(e.target.value)} disabled={!khuVuc}>
                <option value="">-- Chọn phòng ban --</option>
                {phongBanList.map(pb => (
                  <option key={pb} value={pb}>{pb}</option>
                ))}
              </select>
            </div>
          )}
          <button type="submit" disabled={!canSubmit}>
            Vào hệ thống →
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginScreen;
