import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <p className="footer-copy">
          © {new Date().getFullYear()} <strong>Netco Post</strong> — Hệ thống Quản lý Đề xuất NVL & VPP được phát triển và vận hành bởi <strong>Phòng Mua Hàng Netco Post</strong>. Toàn quyền sở hữu nội dung thuộc về Netco Post.
        </p>
        <p className="footer-contact">
          Liên hệ hỗ trợ:&nbsp;
          <a href="mailto:quang.nguyen@netco.com.vn">quang.nguyen@netco.com.vn</a>
          &nbsp;·&nbsp;
          <a href="tel:+84903015975">+84 903 015 975</a>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
