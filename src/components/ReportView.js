import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { db } from '../firebase';
import { ref, get, set, remove } from 'firebase/database';
import { REGION_MAP } from '../data/orgStructure';
import './ReportView.css';

function ReportView() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const monthKey = `${year}_${String(month).padStart(2, '0')}`;

  const loadReport = async () => {
    setLoading(true);
    setLoaded(false);
    try {
      const snapshot = await get(ref(db, `submissions/${monthKey}`));
      if (snapshot.exists()) {
        const raw = snapshot.val();
        setSubmissions(Object.entries(raw).map(([key, val]) => ({ ...val, _key: key })));
      } else {
        setSubmissions([]);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
    setLoaded(true);
  };

  // Delete a specific item (sp+ncc) from all submissions in a phong ban
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
        if (newItems.length === 0) {
          await remove(ref(db, `submissions/${monthKey}/${sub._key}`));
        } else {
          await set(ref(db, `submissions/${monthKey}/${sub._key}/items`), newItems);
        }
      }
      await loadReport();
    } catch (err) {
      console.error(err);
    }
    setDeleting(null);
  };

  // Group: region → khuVuc → phongBan → [items]
  const grouped = {};
  submissions.forEach(sub => {
    const region = sub.region || REGION_MAP[sub.khuVuc] || 'Không xác định';
    const kv = sub.khuVuc || 'Không xác định';
    const pb = sub.phongBan || 'Không xác định';
    if (!grouped[region]) grouped[region] = {};
    if (!grouped[region][kv]) grouped[region][kv] = {};
    if (!grouped[region][kv][pb]) grouped[region][kv][pb] = [];
    (sub.items || []).forEach(item => {
      const existing = grouped[region][kv][pb].find(x => x.sp === item.sp && x.ncc === item.ncc);
      if (existing) {
        existing.qty += item.qty;
        existing.total += item.total;
      } else {
        grouped[region][kv][pb].push({ ...item });
      }
    });
  });

  const grandTotal = submissions.reduce((sum, sub) =>
    sum + (sub.items || []).reduce((s, i) => s + (i.total || 0), 0), 0
  );

  const exportExcel = () => {
    const rows = [['Vùng', 'Khu vực', 'Phòng ban', 'Tên sản phẩm', 'ĐVT', 'NCC', 'Danh mục', 'Số lượng', 'Đơn giá', 'Thành tiền']];
    Object.entries(grouped).forEach(([region, khuVucs]) => {
      Object.entries(khuVucs).forEach(([kv, phongBans]) => {
        Object.entries(phongBans).forEach(([pb, items]) => {
          items.forEach(item => {
            rows.push([region, kv, pb, item.sp, item.dvt, item.ncc, item.cat, item.qty, item.price, item.total]);
          });
          const pbTotal = items.reduce((s, i) => s + (i.total || 0), 0);
          rows.push([`Tổng ${kv} - ${pb}`, '', '', '', '', '', '', '', '', pbTotal]);
        });
      });
    });
    rows.push(['TỔNG CỘNG', '', '', '', '', '', '', '', '', grandTotal]);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 22 }, { wch: 16 }, { wch: 18 }, { wch: 32 }, { wch: 10 },
      { wch: 24 }, { wch: 20 }, { wch: 10 }, { wch: 14 }, { wch: 16 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `BC_${monthKey}`);
    XLSX.writeFile(wb, `BaoCao_NVL_VPP_${monthKey}.xlsx`);
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
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button className="btn-load" onClick={loadReport} disabled={loading}>
            {loading ? 'Đang tải...' : '🔍 Xem báo cáo'}
          </button>
          {loaded && submissions.length > 0 && (
            <button className="btn-export" onClick={exportExcel}>
              📥 Xuất Excel
            </button>
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
              <span>Khu vực</span>
            </div>
            <div className="summary-stat">
              <span className="summary-val">
                {submissions.reduce((s, sub) => s + (sub.items || []).length, 0)}
              </span>
              <span>Sản phẩm</span>
            </div>
            <div className="summary-stat highlight">
              <span className="summary-val">{grandTotal.toLocaleString('vi-VN')}đ</span>
              <span>Tổng giá trị</span>
            </div>
          </div>

          {Object.entries(grouped).map(([region, khuVucs]) => {
            const regionTotal = Object.values(khuVucs)
              .flatMap(pbs => Object.values(pbs).flat())
              .reduce((s, i) => s + (i.total || 0), 0);
            return (
              <div key={region} className="report-region-block">
                <div className="report-region-header">
                  <span>{region}</span>
                  <span>{regionTotal.toLocaleString('vi-VN')}đ</span>
                </div>

                {Object.entries(khuVucs).map(([kv, phongBans]) => {
                  const kvTotal = Object.values(phongBans).flat().reduce((s, i) => s + (i.total || 0), 0);
                  return (
                    <div key={kv} className="report-kv-block">
                      <div className="report-kv-header">
                        <span className="kv-name">{kv}</span>
                        <span className="kv-total">{kvTotal.toLocaleString('vi-VN')}đ</span>
                      </div>

                      {Object.entries(phongBans).map(([pb, items]) => {
                        const pbTotal = items.reduce((s, i) => s + (i.total || 0), 0);
                        return (
                          <div key={pb} className="report-pb-block">
                            <div className="report-pb-header">
                              <span>{pb}</span>
                              <span>{pbTotal.toLocaleString('vi-VN')}đ</span>
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
                                {items.map((item, idx) => {
                                  const dk = `${kv}|${pb}|${item.sp}|${item.ncc}`;
                                  return (
                                    <tr key={idx}>
                                      <td className="td-center">{idx + 1}</td>
                                      <td className="td-name">{item.sp}</td>
                                      <td className="td-center">{item.dvt}</td>
                                      <td>{item.ncc}</td>
                                      <td>{item.cat}</td>
                                      <td className="td-center">{item.qty}</td>
                                      <td className="td-right">
                                        {item.price > 0 ? item.price.toLocaleString('vi-VN') : '—'}
                                      </td>
                                      <td className="td-right td-total">
                                        {item.total > 0 ? item.total.toLocaleString('vi-VN') : '—'}
                                      </td>
                                      <td className="td-center">
                                        <button
                                          className="btn-delete-row"
                                          onClick={() => deleteItem(kv, pb, item.sp, item.ncc)}
                                          disabled={deleting === dk}
                                          title="Xóa dòng này"
                                        >
                                          {deleting === dk ? '...' : '🗑'}
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
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
        </div>
      )}
    </div>
  );
}

export default ReportView;
