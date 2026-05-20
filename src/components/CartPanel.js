import React, { useState } from 'react';
import './CartPanel.css';

function CartPanel({ isOpen, onClose, cart, onRemove, onUpdateQty, onClear, onExport, onSubmitRequest, user }) {
  const [note, setNote] = useState('');
  const now = new Date();
  const monthLabel = `${now.getMonth() + 1}/${now.getFullYear()}`;
  const total = cart.reduce((sum, c) => sum + (c.price || 0) * c.qty, 0);

  const handleSubmit = () => {
    onSubmitRequest(note);
    setNote('');
  };

  return (
    <>
      <div className={`cart-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <div className={`cart-panel ${isOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <div>
            <h2>
              Đề xuất mua hàng
              <span className="cart-badge">{cart.length}</span>
            </h2>
            {user && (
              <div className="cart-user-info">
                {user.khuVuc} · {user.phongBan} · {user.username}
              </div>
            )}
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '6px 12px' }}>✕</button>
        </div>

        <div className="cart-body">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-icon">🛒</div>
              <p>Chưa có sản phẩm nào<br />Nhấn <strong>+</strong> để thêm vào đề xuất</p>
            </div>
          ) : (
            cart.map((c, i) => (
              <div key={i} className="cart-item">
                <button className="cart-item-remove" onClick={() => onRemove(i)}>✕</button>
                <div className="cart-item-name">{c.sp}</div>
                <div className="cart-item-meta">
                  <span className={`region-badge ${c.vc}`} style={{ fontSize: '10px', padding: '2px 8px' }}>{c.vc}</span>
                  <span>{c.cat}</span>
                  <span>•</span>
                  <span>{c.dvt}</span>
                </div>
                <div className="cart-item-qty">
                  <label>Số lượng:</label>
                  <input
                    type="number" min="1" value={c.qty}
                    onChange={(e) => onUpdateQty(i, e.target.value)}
                  />
                  {c.price > 0 && (
                    <span style={{ fontSize: '12px', color: 'var(--accent2)', marginLeft: 'auto' }}>
                      {(c.price * c.qty).toLocaleString('vi-VN')}đ
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && total > 0 && (
          <div className="cart-total">
            <span>Tổng cộng</span>
            <span className="cart-total-val">{total.toLocaleString('vi-VN')}đ</span>
          </div>
        )}

        {cart.length > 0 && (
          <div className="cart-note-wrap">
            <label className="cart-note-label">Lý do / Ghi chú đặt hàng</label>
            <textarea
              className="cart-note-input"
              placeholder="Vd: Bổ sung văn phòng phẩm cho tháng mới, hàng cũ đã hết..."
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
            />
          </div>
        )}

        <div className="cart-footer">
          <button className="btn btn-danger" onClick={onClear} style={{ flex: 1 }}>🗑 Xóa tất cả</button>
          <button className="btn btn-ghost" onClick={onExport} style={{ flex: 1 }}>📥 Excel</button>
          <button className="btn btn-primary" onClick={handleSubmit} style={{ flex: 2 }}>
            📤 Gửi tháng {monthLabel}
          </button>
        </div>
      </div>
    </>
  );
}

export default CartPanel;
