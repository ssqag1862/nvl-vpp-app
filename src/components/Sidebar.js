import React from 'react';
import './Sidebar.css';

function Sidebar({
  search,
  onSearchChange,
  filters,
  onToggleFilter,
  onClearFilters,
  regions,
  categories,
  nccs,
  hasData,
}) {
  if (!hasData) return null;

  const regionColors = { MB: 'mb', MT: 'mt', MN: 'mn' };

  return (
    <aside className="sidebar">
      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Tìm sản phẩm, NCC..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="filter-section">
        <div className="filter-title">Khu vực</div>
        <div className="filter-chips">
          {regions.map(r => (
            <div
              key={r}
              className={`chip ${regionColors[r] || ''} ${
                filters.regions.includes(r) ? 'active' : ''
              }`}
              onClick={() => onToggleFilter('regions', r)}
            >
              {r}
            </div>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <div className="filter-title">Danh mục</div>
        <div className="filter-chips">
          {categories.map(c => (
            <div
              key={c}
              className={`chip ${filters.categories.includes(c) ? 'active' : ''}`}
              onClick={() => onToggleFilter('categories', c)}
            >
              {c}
            </div>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <div className="filter-title">Nhà cung cấp</div>
        <div className="filter-chips">
          {nccs.map(n => {
            let short = n
              .replace(/CÔNG TY TNHH/gi, '')
              .replace(/THƯƠNG MẠI VÀ DỊCH VỤ/gi, 'TM&DV')
              .replace(/THIẾT BỊ VÀ DỊCH VỤ/gi, 'TB&DV')
              .replace(/VĂN PHÒNG/gi, 'VP')
              .replace(/SX TM DV/gi, '')
              .replace(/IN ÁN/gi, '')
              .replace(/^\s+/, '')
              .trim();

            if (short.length > 20) short = short.substring(0, 18) + '…';

            return (
              <div
                key={n}
                className={`chip ${filters.nccs.includes(n) ? 'active' : ''}`}
                onClick={() => onToggleFilter('nccs', n)}
                title={n}
              >
                {short || n}
              </div>
            );
          })}
        </div>
      </div>

      <button className="btn btn-ghost" onClick={onClearFilters} style={{ width: '100%', marginTop: '20px' }}>
        ✕ Xóa bộ lọc
      </button>
    </aside>
  );
}

export default Sidebar;
