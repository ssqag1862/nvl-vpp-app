import React, { useState, useMemo } from 'react';
import { ref, set, remove } from 'firebase/database';
import { db } from '../firebase';
import './AdminPanel.css';

const safeKey = (name) => name.replace(/[.#$/[\]\s]/g, '_');
const overrideKey = (item) => safeKey(`${item.vc}|${item.sp}|${item.ncc}`);

function AdminPanel({ catalogue, overrides, onClose }) {
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return catalogue;
    const q = search.toLowerCase();
    return catalogue.filter(d =>
      d.sp.toLowerCase().includes(q) ||
      d.ncc.toLowerCase().includes(q) ||
      d.cat.toLowerCase().includes(q) ||
      d.vc.toLowerCase().includes(q)
    );
  }, [catalogue, search]);

  const handleEdit = async (item, field, value) => {
    const key = overrideKey(item);
    setSaving(key);
    try {
      const current = overrides[key] || {};
      const updated = {
        ...current,
        [field]: field === 'price' ? (parseFloat(value) || 0) : value,
        editedAt: Date.now(),
      };
      await set(ref(db, `catalogueOverrides/${key}`), updated);
    } catch (err) {
      console.error('Override save error:', err);
    }
    setSaving(null);
  };

  const handleReset = async (item) => {
    const key = overrideKey(item);
    setSaving(key);
    try {
      await remove(ref(db, `catalogueOverrides/${key}`));
    } catch (err) {
      console.error('Override reset error:', err);
    }
    setSaving(null);
  };

  const overriddenCount = Object.keys(overrides).length;

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="admin-header-left">
          <h2>Quản lý Catalogue</h2>
          <p>Chỉnh sửa tên, đơn vị, giá — click vào ô để sửa trực tiếp. Thay đổi có hiệu lực ngay.</p>
          {overriddenCount > 0 && (
            <span className="admin-override-badge">{overriddenCount} sản phẩm đã chỉnh sửa</span>
          )}
        </div>
        <button className="admin-close-btn" onClick={onClose}>← Quay lại Catalogue</button>
      </div>

      <div className="admin-toolbar">
        <input
          className="admin-search"
          placeholder="Tìm sản phẩm, NCC, danh mục, vùng..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span className="admin-count">{filtered.length} / {catalogue.length} sản phẩm</span>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Vùng</th>
              <th>NCC</th>
              <th className="col-sp">Tên sản phẩm</th>
              <th>Đơn vị</th>
              <th>Giá (VND)</th>
              <th>Danh mục</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => {
              const key = overrideKey(item);
              return (
                <AdminRow
                  key={key}
                  item={item}
                  override={overrides[key] || null}
                  isSaving={saving === key}
                  onEdit={handleEdit}
                  onReset={handleReset}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminRow({ item, override, isSaving, onEdit, onReset }) {
  const [editField, setEditField] = useState(null);
  const [editVal, setEditVal] = useState('');

  const startEdit = (field, current) => {
    setEditField(field);
    setEditVal(String(current ?? ''));
  };

  const commitEdit = (field) => {
    if (editField === field) {
      onEdit(item, field, editVal);
      setEditField(null);
    }
  };

  const cancelEdit = () => setEditField(null);

  const renderCell = (field, value, isNumeric) => {
    const isOverridden = override && override[field] !== undefined;
    if (editField === field) {
      return (
        <input
          className="admin-cell-input"
          type={isNumeric ? 'number' : 'text'}
          value={editVal}
          onChange={e => setEditVal(e.target.value)}
          onBlur={() => commitEdit(field)}
          onKeyDown={e => {
            if (e.key === 'Enter') commitEdit(field);
            if (e.key === 'Escape') cancelEdit();
          }}
          autoFocus
        />
      );
    }
    return (
      <span
        className={`admin-cell-val${isOverridden ? ' is-overridden' : ''}`}
        onClick={() => startEdit(field, value)}
        title="Click để chỉnh sửa"
      >
        {isNumeric && value ? Number(value).toLocaleString('vi-VN') : (value || '—')}
      </span>
    );
  };

  return (
    <tr className={override ? 'row-modified' : ''}>
      <td><span className={`vc-tag vc-${item.vc.toLowerCase()}`}>{item.vc}</span></td>
      <td className="td-ncc">{item.ncc}</td>
      <td className="td-sp">{renderCell('sp', item.sp, false)}</td>
      <td className="td-dvt">{renderCell('dvt', item.dvt, false)}</td>
      <td className="td-price">{renderCell('price', item.price, true)}</td>
      <td className="td-cat">{item.cat}</td>
      <td className="td-actions">
        {override && (
          <button
            className="btn-reset"
            onClick={() => onReset(item)}
            disabled={isSaving}
            title="Hoàn tác về giá trị gốc"
          >
            ↺
          </button>
        )}
      </td>
    </tr>
  );
}

export default AdminPanel;
