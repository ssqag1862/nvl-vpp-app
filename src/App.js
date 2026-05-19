import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './App.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Table from './components/Table';
import CartPanel from './components/CartPanel';
import Toast from './components/Toast';
import LoginScreen from './components/LoginScreen';
// DropZone removed — catalogue is hardcoded
import ReportView from './components/ReportView';
import RAW_DATA from './data/masterData.json';
import { REGION_MAP } from './data/orgStructure';
import { db } from './firebase';
import { ref, set, get, push } from 'firebase/database';

const safeKey = (name) => name.replace(/[.#$/[\]\s]/g, '_');

// Transform JSON fields to app format once at startup
const CATALOGUE = RAW_DATA.map(d => ({
  vc:  d.vung_code || '',
  tv:  d.ten_vung || '',
  ncc: d.ncc || '',
  sp:  d.ten_san_pham || '',
  dvt: d.don_vi_tinh || '',
  cat: d.category || '',
  mac: d.material_area_code || '',
  man: d.material_area_name || '',
  mgc: d.material_group_code || '',
  mgn: d.material_group_name || '',
  moc: d.material_object_code || '',
  mon: d.material_object_name || '',
  price: d.price_per_unit || 0,
})).filter(d => d.sp);

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nvl_user')) || null; } catch { return null; }
  });
  const [filtered, setFiltered] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartInitialized, setCartInitialized] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ regions: [], categories: [], nccs: [] });
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showReport, setShowReport] = useState(false);
  const [orderHistory, setOrderHistory] = useState({});

  const PAGE_SIZE = 30;

  // Load last 3 months of this branch's order history for the catalogue indicator
  useEffect(() => {
    if (!user) { setOrderHistory({}); return; }
    const now = new Date();
    const monthKeys = Array.from({ length: 3 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return `${d.getFullYear()}_${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const history = {};
    Promise.all(monthKeys.map(mk => get(ref(db, `submissions/${mk}`)))).then(snaps => {
      snaps.forEach((snap, idx) => {
        if (!snap.exists()) return;
        Object.values(snap.val()).forEach(sub => {
          if (sub.khuVuc !== user.khuVuc || sub.phongBan !== user.phongBan) return;
          const [y, m] = monthKeys[idx].split('_');
          const label = `Tháng ${parseInt(m)}/${y}`;
          (sub.items || []).forEach(item => {
            const key = `${item.sp}|${item.ncc}`;
            if (!history[key]) history[key] = { label, qty: item.qty };
          });
        });
      });
      setOrderHistory(history);
    }).catch(() => {});
  }, [user]);

  // Catalogue is hardcoded — no Firebase needed for products

  // Load this user's cart
  useEffect(() => {
    if (!user) {
      setCart([]);
      setCartInitialized(false);
      return;
    }
    setCartInitialized(false);
    const cartKey = safeKey(`${user.khuVuc}_${user.phongBan}_${user.username}`);
    get(ref(db, `carts/${cartKey}`))
      .then((snapshot) => {
        setCart(snapshot.exists() ? (snapshot.val().items || []) : []);
        setCartInitialized(true);
      })
      .catch(() => setCartInitialized(true));
  }, [user]);

  // Save cart (debounced)
  useEffect(() => {
    if (!user || !cartInitialized) return;
    const cartKey = safeKey(`${user.khuVuc}_${user.phongBan}_${user.username}`);
    const timer = setTimeout(() => {
      set(ref(db, `carts/${cartKey}`), { items: cart, updatedAt: Date.now() })
        .catch(err => console.error('Cart save error:', err));
    }, 500);
    return () => clearTimeout(timer);
  }, [cart, user, cartInitialized]);

  // Apply filters and search against fixed catalogue
  useEffect(() => {
    let result = CATALOGUE;
    if (filters.regions.length > 0) result = result.filter(d => filters.regions.includes(d.vc));
    if (filters.categories.length > 0) result = result.filter(d => filters.categories.includes(d.cat));
    if (filters.nccs.length > 0) result = result.filter(d => filters.nccs.includes(d.ncc));
    if (search.trim()) {
      const words = search.toLowerCase().trim().split(/\s+/);
      result = result.filter(d => {
        const text = `${d.sp} ${d.ncc} ${d.cat} ${d.mon} ${d.tv}`.toLowerCase();
        return words.every(w => text.includes(w));
      });
    }
    setFiltered(result);
    setCurrentPage(1);
  }, [search, filters]);


  const handleSubmitRequest = async () => {
    if (cart.length === 0) {
      showToast('⚠️ Chưa có sản phẩm để gửi');
      return;
    }
    const now = new Date();
    const monthKey = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;

    const submission = {
      username: user.username,
      region: user.vung || REGION_MAP[user.khuVuc] || user.khuVuc,
      khuVuc: user.khuVuc,
      phongBan: user.phongBan,
      items: cart.map(c => ({
        sp: c.sp,
        dvt: c.dvt,
        ncc: c.ncc || '',
        cat: c.cat || '',
        price: c.price || 0,
        qty: c.qty,
        total: (c.price || 0) * c.qty,
      })),
      submittedAt: Date.now(),
      month: monthKey,
    };

    try {
      await push(ref(db, `submissions/${monthKey}`), submission);
      setCart([]);
      showToast(`✅ Đã gửi đề xuất tháng ${now.getMonth() + 1}/${now.getFullYear()}`);
      setCartOpen(false);
    } catch (err) {
      showToast(`❌ Lỗi gửi đề xuất: ${err.message}`);
    }
  };

  const handleLogin = (userInfo) => {
    localStorage.setItem('nvl_user', JSON.stringify(userInfo));
    setUser(userInfo);
  };

  const handleLogout = () => {
    localStorage.removeItem('nvl_user');
    setUser(null);
    setCart([]);
    setCartInitialized(false);
    setShowReport(false);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const toggleFilter = (type, value) => {
    setFilters(prev => {
      const arr = [...prev[type]];
      const idx = arr.indexOf(value);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(value);
      return { ...prev, [type]: arr };
    });
  };

  const clearFilters = () => {
    setSearch('');
    setFilters({ regions: [], categories: [], nccs: [] });
  };

  const addToCart = (item) => {
    const existing = cart.findIndex(c => c.sp === item.sp && c.vc === item.vc && c.ncc === item.ncc);
    if (existing >= 0) {
      const newCart = [...cart];
      newCart.splice(existing, 1);
      setCart(newCart);
      showToast(`🗑 Đã xóa: ${item.sp}`);
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
      showToast(`✅ Đã thêm: ${item.sp}`);
    }
  };

  const removeFromCart = (idx) => {
    const newCart = [...cart];
    const name = newCart[idx].sp;
    newCart.splice(idx, 1);
    setCart(newCart);
    showToast(`🗑 Đã xóa: ${name}`);
  };

  const updateQty = (idx, qty) => {
    const newCart = [...cart];
    newCart[idx].qty = Math.max(1, parseInt(qty) || 1);
    setCart(newCart);
  };

  const clearCart = () => {
    setCart([]);
    showToast('🗑 Đã xóa tất cả');
  };

  const exportCart = () => {
    if (cart.length === 0) {
      showToast('⚠️ Chưa có sản phẩm để xuất');
      return;
    }
    const today = new Date();
    const dateStr = today.toLocaleDateString('vi-VN');
    const headers = [
      'STT', 'Ngày', 'Khu vực', 'Phòng ban', 'Người đề xuất',
      'Tên Vùng', 'NCC', 'Tên sản phẩm', 'Đơn vị tính',
      'Số Lượng', 'Đơn giá (VND)', 'VAT', 'Tổng tiền', 'Category',
    ];
    const rows = cart.map((c, i) => [
      i + 1, dateStr,
      user?.khuVuc || '', user?.phongBan || '', user?.username || '',
      c.tv, c.ncc, c.sp, c.dvt,
      c.qty, c.price || '',
      c.price > 0 ? 0.08 : '',
      c.price > 0 ? c.price * c.qty * 1.08 : '',
      c.cat,
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [
      { wch: 5 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 18 },
      { wch: 14 }, { wch: 30 }, { wch: 30 }, { wch: 12 },
      { wch: 10 }, { wch: 14 }, { wch: 6 }, { wch: 16 }, { wch: 20 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Đề xuất mua hàng');
    const outFile = `De_xuat_${user?.khuVuc || ''}_${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}.xlsx`;
    XLSX.writeFile(wb, outFile);
    showToast(`📥 Đã xuất: ${outFile}`);
  };

  const regions = [...new Set(CATALOGUE.map(d => d.vc).filter(Boolean))].sort();
  const categories = [...new Set(CATALOGUE.map(d => d.cat).filter(Boolean))].sort();
  const nccs = [...new Set(CATALOGUE.map(d => d.ncc).filter(Boolean))].sort();

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  if (showReport) {
    return (
      <div className="app">
        <Header
          catalogue={CATALOGUE}
          user={user}
          onLogout={handleLogout}
          showReport={showReport}
          onToggleReport={() => setShowReport(false)}
        />
        <ReportView />
        <Toast message={toast} />
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        catalogue={CATALOGUE}
        user={user}
        onLogout={handleLogout}
        showReport={showReport}
        onToggleReport={() => setShowReport(true)}
      />

      <div className="main">
        <Sidebar
          search={search}
          onSearchChange={setSearch}
          filters={filters}
          onToggleFilter={toggleFilter}
          onClearFilters={clearFilters}
          regions={regions}
          categories={categories}
          nccs={nccs}
          hasData={true}
        />

        <div className="content">
          <Table
            filtered={filtered}
            cart={cart}
            onAddToCart={addToCart}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            pageSize={PAGE_SIZE}
            orderHistory={orderHistory}
          />
        </div>
      </div>

      {(
        <>
          <button className="cart-fab" onClick={() => setCartOpen(true)}>
            🛒
            {cart.length > 0 && <span className="fab-badge">{cart.length}</span>}
          </button>

          <CartPanel
            isOpen={cartOpen}
            onClose={() => setCartOpen(false)}
            cart={cart}
            onRemove={removeFromCart}
            onUpdateQty={updateQty}
            onClear={clearCart}
            onExport={exportCart}
            onSubmitRequest={handleSubmitRequest}
            user={user}
          />
        </>
      )}

      <Toast message={toast} />
    </div>
  );
}

export default App;
