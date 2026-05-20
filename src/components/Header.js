import React from 'react';
import './Header.css';

function Header({ catalogue, user, onLogout, showReport, onToggleReport }) {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo-netco">
          <span className="logo-netco-main">NETCO</span>
          <span className="logo-netco-post">POST</span>
        </div>
        <div>
          <h1>Catalogue <span>NVL & VPP</span></h1>
        </div>
      </div>

      <div className="header-stats">
        <div>
          <div className="stat-val">{catalogue.length}</div>
          <div>Sản phẩm</div>
        </div>
        <div>
          <div className="stat-val">{new Set(catalogue.map(d => d.vc)).size}</div>
          <div>Khu vực</div>
        </div>
        <div>
          <div className="stat-val">{new Set(catalogue.map(d => d.cat)).size}</div>
          <div>Danh mục</div>
        </div>
        <div>
          <div className="stat-val">{new Set(catalogue.map(d => d.ncc)).size}</div>
          <div>NCC</div>
        </div>
      </div>

      <div className="header-right">
        <button
          className={`btn ${showReport ? 'btn-primary' : 'btn-report'}`}
          onClick={onToggleReport}
        >
          {showReport ? '← Catalogue' : '📊 Báo cáo'}
        </button>

        {user && (
          <div className="header-user">
            <span className="user-avatar">{user.username.charAt(0).toUpperCase()}</span>
            <div className="user-info">
              <span className="user-name">{user.username}</span>
              <span className="user-dept">{user.khuVuc} · {user.phongBan}{user.vung ? ` · ${user.vung}` : ''}</span>
            </div>
            <button className="btn-logout" onClick={onLogout} title="Đăng xuất">✕</button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
