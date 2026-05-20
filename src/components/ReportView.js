import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { db } from '../firebase';
import { ref, get, set, remove } from 'firebase/database';
import { REGION_MAP } from '../data/orgStructure';
import './ReportView.css';

const COLORS = ['#00a651', '#34c974', '#007a3d', '#22d3ee', '#3b82f6', '#f97316', '#a855f7', '#f43f5e'];
const fmt = (v) => v > 0 ? v.toLocaleString('vi-VN') + 'đ' : '0đ';

function ReportView() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [regionFilter, setRegionFilter] = useState('all');

  const monthKey = `${year}_${String(month).padStart(2, '0')}`;

  const loadReport = async () => {
    setLoading(true);
    setLoaded(false);
    try {
      const snapshot = await get(ref(db, `submissions/${monthKey}`));
      if (snapshot.exists()) {
        setSubmissions(Object.entries(snapshot.val()).map(([key, val]) => ({ ...val, _key: key })));
      } else {
        setSubmissions([]);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
    setLoaded(true);
  };

  const deleteItem = async (kv, pb, sp, ncc) => {
    if (!window.confirm(`Xóa "${sp}" khỏi báo cáo tháng ${month}/${year}?`)) return;
    const key = `${kv}|${pb}|${sp}|${ncc}`;
    setDeleting(key);
    try {
      const affected = submissions.filter(sub =>
        sub.khuVuc === kv && sub.phongBan === pb &&
        (sub.items || []).some(i => i.sp === sp && i.ncc === ncc)
      );
      for (const sub of affected) {
        const newItems = (sub.items || []).filter(i => !(i.sp === sp && i.ncc === ncc));
        if (newItems.length === 0) await remove(ref(db, `submissions/${monthKey}/${sub._key}`));
        else await set(ref(db, `submissions/${monthKey}/${sub._key}/items`), newItems);
      }
      await loadReport();
    } catch (err) { console.error(err); }
    setDeleting(null);
  };

  const deleteAllPb = async (kv, pb) => {
    if (!window.confirm(`Xóa toàn bộ đề xuất của "${pb}" trong tháng ${month}/${year}?`)) return;
    try {
      const affected = submissions.filter(sub => sub.khuVuc === kv && sub.phongBan === pb);
      for (const sub of affected) await remove(ref(db, `submissions/${monthKey}/${sub._key}`));
      await loadReport();
    } catch (err) { console.error(err); }
  };

  // Group: region → khuVuc → phongBan → { items, usernames, notes }
  const grouped = {};
  submissions.forEach(sub => {
    const region = sub.region || REGION_MAP[sub.khuVuc] || 'Không xác định';
    const kv = sub.khuVuc || 'Không xác định';
    const pb = sub.phongBan || 'Không xác định';
    if (!grouped[region]) grouped[region] = {};
    if (!grouped[region][kv]) grouped[region][kv] = {};
    if (!grouped[region][kv][pb]) grouped[region][kv][pb] = { items: [], usernames: new Set(), notes: [] };

    const g = grouped[region][kv][pb];
    if (sub.username) g.usernames.add(sub.username);
    if (sub.note && sub.note.trim()) g.notes.push({ username: sub.username, note: sub.note });

    (sub.items || []).forEach(item => {
      const existing = g.items.find(x => x.sp === item.sp && x.ncc === item.ncc);
      if (existing) { existing.qty += item.qty; existing.total += item.total; }
      else g.items.push({ ...item });
    });
  });

  // Apply region filter
  const filteredGrouped = regionFilter === 'all'
    ? grouped
    : Object.fromEntries(Object.entries(grouped).filter(([r]) => r === regionFilter));

  const grandTotal = submissions.reduce((sum, sub) =>
    sum + (sub.items || []).reduce((s, i) => s + (i.total || 0), 0), 0);

  const allRegions = Object.keys(grouped);

  // Dashboard data (always from full grouped, not filtered)
  const byVung = Object.entries(grouped).map(([region, kvs]) => ({
    name: region,
    value: Object.values(kvs).flatMap(pbs => Object.values(pbs).map(d => d.items)).flat().reduce((s, i) => s + (i.total || 0), 0),
  })).filter(d => d.value > 0);

  const byKhuVuc = [];
  Object.entries(grouped).forEach(([, kvs]) => {
    Object.entries(kvs).forEach(([kv, pbs]) => {
      const value = Object.values(pbs).flatMap(d => d.items).reduce((s, i) => s + (i.total || 0), 0);
      if (value > 0) byKhuVuc.push({ name: kv, value });
    });
  });
  byKhuVuc.sort((a, b) => b.value - a.value);

  const byCat = {};
  submissions.forEach(sub => (sub.items || []).forEach(item => {
    if (!byCat[item.cat]) byCat[item.cat] = 0;
    byCat[item.cat] += item.total || 0;
  }));
  const byCatArr = Object.entries(byCat).map(([name, value]) => ({ name, value })).filter(d => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 8);

  const byProduct = {};
  submissions.forEach(sub => (sub.items || []).forEach(item => {
    if (!byProduct[item.sp]) byProduct[item.sp] = { name: item.sp, qty: 0, total: 0 };
    byProduct[item.sp].qty += item.qty;
    byProduct[item.sp].total += item.total || 0;
  }));
  const topByQty = Object.values(byProduct).sort((a, b) => b.qty - a.qty).slice(0, 8);
  const topByValue = Object.values(byProduct).filter(d => d.total > 0).sort((a, b) => b.total - a.total).slice(0, 8);

  const exportExcel = () => {
    const rows = [['Vùng', 'Khu vực', 'Phòng ban', 'Người đề xuất', 'Tên sản phẩm', 'ĐVT', 'NCC', 'Danh mục', 'Số lượng', 'Đơn giá', 'Thành tiền', 'Ghi chú']];
    Object.entries(grouped).forEach(([region, khuVucs]) => {
      Object.entries(khuVucs).forEach(([kv, phongBans]) => {
        Object.entries(phongBans).forEach(([pb, data]) => {
          const usernames = [...data.usernames].join(', ');
          const note = data.notes.map(n => `${n.username}: ${n.note}`).join(' | ');
          data.items.forEach(item => {
            rows.push([region, kv, pb, usernames, item.sp, item.dvt, item.ncc, item.cat, item.qty, item.price, item.total, note]);
          });
          const pbTotal = data.items.reduce((s, i) => s + (i.total || 0), 0);
          rows.push([`Tổng ${pb}`, '', '', '', '', '', '', '', '', '', pbTotal, '']);
        });
      });
    });
    rows.push(['TỔNG CỘNG', '', '', '', '', '', '', '', '', '', grandTotal, '']);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 22 }, { wch: 16 }, { wch: 18 }, { wch: 20 }, { wch: 30 }, { wch: 10 }, { wch: 24 }, { wch: 20 }, { wch: 10 }, { wch: 14 }, { wch: 16 }, { wch: 30 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `BC_${monthKey}`);
    XLSX.writeFile(wb, `BaoCao_NVL_VPP_${monthKey}.xlsx`);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{payload[0].name || payload[0].payload?.name}</p>
        <p className="chart-tooltip-val">{fmt(payload[0].value)}</p>
      </div>
    );
    return null;
  };

  const QtyTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{payload[0].payload?.name}</p>
        <p className="chart-tooltip-val">SL: {payload[0].value}</p>
      </div>
    );
    return null;
  };

  return (
    <div className="report-view">
      <div className="report-toolbar">
        <div className="report-title">
          <h2>Báo cáo tổng hợp NVL & VPP</h2>
          <p>Tổng hợp đề xuất theo khu vực và phòng ban</p>
        </div>
        <div className="report-controls">
          <div className="report-picker">
            <label>Tháng</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>Tháng {m}</option>
              ))}
            </select>
          </div>
          <div className="report-picker">
            <label>Năm</label>
            <select value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button className="btn-load" onClick={loadReport} disabled={loading}>
            {loading ? 'Đang tải...' : '🔍 Xem báo cáo'}
          </button>
          {loaded && submissions.length > 0 && (
            <button className="btn-export" onClick={exportExcel}>📥 Xuất Excel</button>
          )}
        </div>
      </div>

      {!loaded && (
        <div className="report-empty">
          <div className="report-empty-icon">📊</div>
          <p>Chọn tháng/năm và nhấn <strong>"Xem báo cáo"</strong></p>
        </div>
      )}

      {loaded && submissions.length === 0 && (
        <div className="report-empty">
          <div className="report-empty-icon">📭</div>
          <p>Chưa có đề xuất nào trong tháng {month}/{year}</p>
        </div>
      )}

      {loaded && submissions.length > 0 && (
        <div className="report-content">
          <div className="report-summary-bar">
            <div className="summary-stat">
              <span className="summary-val">{submissions.length}</span>
              <span>Lượt gửi</span>
            </div>
            <div className="summary-stat">
              <span className="summary-val">{Object.keys(grouped).length}</span>
              <span>Vùng</span>
            </div>
            <div className="summary-stat">
              <span className="summary-val">{submissions.reduce((s, sub) => s + (sub.items || []).length, 0)}</span>
              <span>Sản phẩm</span>
            </div>
            <div className="summary-stat highlight">
              <span className="summary-val">{grandTotal.toLocaleString('vi-VN')}đ</span>
              <span>Tổng giá trị</span>
            </div>
            <div className="view-toggle">
              <button className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>📋 Bảng</button>
              <button className={`toggle-btn ${viewMode === 'dashboard' ? 'active' : ''}`} onClick={() => setViewMode('dashboard')}>📊 Dashboard</button>
            </div>
          </div>

          {/* Region filter */}
          {viewMode === 'table' && allRegions.length > 1 && (
            <div className="region-filter-bar">
              <span className="region-filter-label">Lọc vùng:</span>
              <button className={`region-filter-btn ${regionFilter === 'all' ? 'active' : ''}`} onClick={() => setRegionFilter('all')}>Tất cả</button>
              {allRegions.map(r => (
                <button key={r} className={`region-filter-btn ${regionFilter === r ? 'active' : ''}`} onClick={() => setRegionFilter(r)}>{r}</button>
              ))}
            </div>
          )}

          {/* TABLE VIEW */}
          {viewMode === 'table' && (
            <>
              {Object.entries(filteredGrouped).map(([region, khuVucs]) => {
                const regionTotal = Object.values(khuVucs).flatMap(pbs => Object.values(pbs)).reduce((s, d) => s + d.items.reduce((a, i) => a + (i.total || 0), 0), 0);
                return (
                  <div key={region} className="report-region-block">
                    <div className="report-region-header">
                      <span>{region}</span>
                      <span>{regionTotal.toLocaleString('vi-VN')}đ</span>
                    </div>
                    {Object.entries(khuVucs).map(([kv, phongBans]) => {
                      const kvTotal = Object.values(phongBans).reduce((s, d) => s + d.items.reduce((a, i) => a + (i.total || 0), 0), 0);
                      return (
                        <div key={kv} className="report-kv-block">
                          <div className="report-kv-header">
                            <span className="kv-name">{kv}</span>
                            <span className="kv-total">{kvTotal.toLocaleString('vi-VN')}đ</span>
                          </div>
                          {Object.entries(phongBans).map(([pb, data]) => {
                            const pbTotal = data.items.reduce((s, i) => s + (i.total || 0), 0);
                            const usernames = [...data.usernames].join(', ');
                            return (
                              <div key={pb} className="report-pb-block">
                                <div className="report-pb-header">
                                  <div className="pb-header-left">
                                    <span className="pb-name">{pb}</span>
                                    {usernames && <span className="pb-users">👤 {usernames}</span>}
                                  </div>
                                  <div className="pb-header-right">
                                    <span>{pbTotal.toLocaleString('vi-VN')}đ</span>
                                    <button className="btn-delete-all-pb" onClick={() => deleteAllPb(kv, pb)} title="Xóa toàn bộ phòng ban này">🗑 Xóa tất cả</button>
                                  </div>
                                </div>
                                <table className="report-table">
                                  <thead>
                                    <tr>
                                      <th>STT</th>
                                      <th>Tên sản phẩm</th>
                                      <th>ĐVT</th>
                                      <th>NCC</th>
                                      <th>Danh mục</th>
                                      <th>SL</th>
                                      <th>Đơn giá</th>
                                      <th>Thành tiền</th>
                                      <th></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {data.items.map((item, idx) => {
                                      const dk = `${kv}|${pb}|${item.sp}|${item.ncc}`;
                                      return (
                                        <tr key={idx}>
                                          <td className="td-center">{idx + 1}</td>
                                          <td className="td-name">{item.sp}</td>
                                          <td className="td-center">{item.dvt}</td>
                                          <td>{item.ncc}</td>
                                          <td>{item.cat}</td>
                                          <td className="td-center">{item.qty}</td>
                                          <td className="td-right">{item.price > 0 ? item.price.toLocaleString('vi-VN') : '—'}</td>
                                          <td className="td-right td-total">{item.total > 0 ? item.total.toLocaleString('vi-VN') : '—'}</td>
                                          <td className="td-center">
                                            <button className="btn-delete-row" onClick={() => deleteItem(kv, pb, item.sp, item.ncc)} disabled={deleting === dk} title="Xóa dòng này">
                                              {deleting === dk ? '...' : '🗑'}
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                                {data.notes.length > 0 && (
                                  <div className="pb-notes">
                                    {data.notes.map((n, i) => (
                                      <div key={i} className="pb-note-item">
                                        <span className="pb-note-user">📝 {n.username}:</span>
                                        <span className="pb-note-text">{n.note}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              <div className="report-grand-total">
                <span>TỔNG CỘNG TOÀN BỘ</span>
                <span>{grandTotal.toLocaleString('vi-VN')}đ</span>
              </div>
            </>
          )}

          {/* DASHBOARD VIEW */}
          {viewMode === 'dashboard' && (
            <div className="dashboard-grid">
              <div className="dash-card">
                <h3 className="dash-card-title">Chi phí theo Vùng</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={byVung} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                      {byVung.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={(v) => <span style={{ color: 'var(--text2)', fontSize: 12 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="dash-card">
                <h3 className="dash-card-title">Chi phí theo Khu vực</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={byKhuVuc} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: 'var(--text3)', fontSize: 10 }} tickFormatter={v => v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text2)', fontSize: 11 }} width={130} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#00a651" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="dash-card">
                <h3 className="dash-card-title">Top sản phẩm theo giá trị</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topByValue} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: 'var(--text3)', fontSize: 10 }} tickFormatter={v => v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text2)', fontSize: 10 }} width={140} tickFormatter={v => v.length > 18 ? v.slice(0, 18) + '…' : v} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="total" fill="#34c974" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="dash-card">
                <h3 className="dash-card-title">Top sản phẩm theo số lượng</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topByQty} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: 'var(--text3)', fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text2)', fontSize: 10 }} width={140} tickFormatter={v => v.length > 18 ? v.slice(0, 18) + '…' : v} />
                    <Tooltip content={<QtyTooltip />} />
                    <Bar dataKey="qty" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="dash-card dash-card-full">
                <h3 className="dash-card-title">Chi phí theo Danh mục</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={byCatArr} margin={{ left: 10, right: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: 'var(--text2)', fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} tickFormatter={v => v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {byCatArr.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ReportView;
