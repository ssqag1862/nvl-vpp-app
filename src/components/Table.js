import React from 'react';
import './Table.css';

function Table({ filtered, cart, onAddToCart, currentPage, onPageChange, pageSize, orderHistory = {} }) {
  const start = (currentPage - 1) * pageSize;
  const page = filtered.slice(start, start + pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  if (page.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔍</div>
        <p>Không tìm thấy sản phẩm nào</p>
      </div>
    );
  }

  const isInCart = (item) => {
    return cart.some(c => c.sp === item.sp && c.vc === item.vc && c.ncc === item.ncc);
  };

  return (
    <div className="table-wrap">
      <div className="table-toolbar">
        <div className="result-count">
          Hiển thị <strong>{filtered.length}</strong> sản phẩm
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>Vùng</th>
              <th>Tên sản phẩm</th>
              <th>ĐVT</th>
              <th>Danh mục</th>
              <th>Nhà cung cấp</th>
              <th>Material Object</th>
              <th>Đơn giá</th>
            </tr>
          </thead>
          <tbody>
            {page.map((d, i) => {
              const inCart = isInCart(d);
              const priceStr = d.price > 0 ? d.price.toLocaleString('vi-VN') + 'đ' : '—';

              return (
                <tr key={start + i}>
                  <td>
                    <button
                      className={`add-btn ${inCart ? 'added' : ''}`}
                      onClick={() => onAddToCart(d)}
                      title="Thêm vào đề xuất"
                    >
                      {inCart ? '✓' : '+'}
                    </button>
                  </td>
                  <td>
                    <span className={`region-badge ${d.vc}`}>{d.vc}</span>
                  </td>
                  <td style={{ fontWeight: '500' }}>
                    {d.sp}
                    {orderHistory[`${d.sp}|${d.ncc}`] && (
                      <div className="order-hint">
                        Đã đặt {orderHistory[`${d.sp}|${d.ncc}`].label} · SL: {orderHistory[`${d.sp}|${d.ncc}`].qty}
                      </div>
                    )}
                  </td>
                  <td style={{ color: 'var(--text3)' }}>{d.dvt}</td>
                  <td>
                    <span className="cat-tag">{d.cat}</span>
                  </td>
                  <td className="ncc-cell">{d.ncc}</td>
                  <td style={{ fontSize: '11px', color: 'var(--text3)' }}>
                    {d.moc} - {d.mon}
                  </td>
                  <td className="price-cell">{priceStr}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            ‹
          </button>

          {[...Array(totalPages)].map((_, i) => {
            const p = i + 1;
            if (p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2) {
              return (
                <button
                  key={p}
                  className={currentPage === p ? 'active' : ''}
                  onClick={() => onPageChange(p)}
                >
                  {p}
                </button>
              );
            } else if (Math.abs(p - currentPage) === 3) {
              return (
                <span key={p} className="page-info">
                  …
                </span>
              );
            }
            return null;
          })}

          <button
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

export default Table;
