import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  LayoutDashboard, Sparkles, Store, Package, Receipt,
  LineChart, Settings, LogOut, Bell, Menu, X, UserCheck, Users
} from 'lucide-react';
import logo1 from '../../public/logo1.png';

// 💡 KONFIGURASI MENU BAWAAN
const NAV_ITEMS = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', adminOnly: false },
  { path: '/admin/prediksi', icon: Sparkles, label: 'Prediksi AI', adminOnly: false },
  { path: '/admin/toko', icon: Store, label: 'Manajemen Toko', adminOnly: false },
  { path: '/admin/produk', icon: Package, label: 'Produk Saya', adminOnly: false },
  { path: '/admin/pesanan', icon: Receipt, label: 'Pesanan Masuk', adminOnly: false },
  { path: '/admin/laporan', icon: LineChart, label: 'Laporan ESG', adminOnly: false },
  { path: '/admin/users', icon: Users, label: 'Pengguna Sistem', adminOnly: true },
  { path: '/admin/mitra', icon: UserCheck, label: 'Verifikasi Mitra', adminOnly: true },
  { path: '/admin/pengaturan', icon: Settings, label: 'Pengaturan', adminOnly: false },
];

export default function AdminLayout({ children, title }) {
  const navigate = useNavigate();
  const location = useLocation();

  const { admin, adminToken, adminLogout } = useAdminAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // 🔔 STATE UNTUK NOTIFIKASI LONCENG
  const [unreadCount, setUnreadCount] = useState(0);

  // 🚪 STATE UNTUK POP-UP LOGOUT
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const isSuperAdmin = admin?.role === 'superadmin';
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // 🔄 EFFECT: Fetch data transaksi untuk menghitung badge lonceng secara real-time
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const token = adminToken || localStorage.getItem('kk_token');
        if (!token) return;

        const [resTx, resStores] = await Promise.all([
          fetch(`${API_URL}/transactions`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/stores`)
        ]);

        const dataTx = await resTx.json();
        const dataStores = await resStores.json();

        if (dataTx.status === 'success') {
          let rawTransactions = dataTx.data;

          if (!isSuperAdmin && dataStores.status === 'success') {
            const currentMitraStore = dataStores.data.find(t => t.id === admin?.store_id)
              || dataStores.data.find(t => t.mitra_user_id === admin?.id);
            
            if (currentMitraStore) {
              rawTransactions = rawTransactions.filter(p => p.store_id === currentMitraStore.id);
            } else {
              rawTransactions = [];
            }
          }

          const processingOrders = rawTransactions.filter(p => !p.status || p.status === 'Sedang Diproses');
          const currentCount = processingOrders.length;
          const lastClearedCount = Number(localStorage.getItem('kk_cleared_order_count') || 0);

          if (currentCount < lastClearedCount) {
            localStorage.setItem('kk_cleared_order_count', currentCount.toString());
            setUnreadCount(0);
          } else {
            setUnreadCount(currentCount - lastClearedCount);
          }

          localStorage.setItem('kk_current_processing_count', currentCount.toString());
        }
      } catch (error) {
        console.error("Error fetching bell notifications:", error);
      }
    };

    fetchNotificationCount();
    
    const interval = setInterval(fetchNotificationCount, 15000);
    return () => clearInterval(interval);
  }, [admin, adminToken, isSuperAdmin, API_URL]);

  // 🖱️ HANDLE CLICK LONCENG: Reset badge ke 0 dan arahkan ke halaman pesanan
  const handleBellClick = () => {
    const currentCount = localStorage.getItem('kk_current_processing_count') || '0';
    localStorage.setItem('kk_cleared_order_count', currentCount);
    setUnreadCount(0);
    navigate('/admin/pesanan');
  };

  // 🚪 EKSEKUSI LOGOUT SEBENARNYA
  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    adminLogout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex text-sm font-sans selection:bg-emerald-500/30">

      {/* 📱 MOBILE OVERLAY */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-30 lg:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* 🧭 SIDEBAR */}
      <aside className={`w-64 bg-[#111827] border-r border-gray-800 flex flex-col fixed h-full z-40 shadow-2xl transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-20 px-6 flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl shadow-lg shadow-emerald-500/20 overflow-hidden bg-[#037841] flex items-center justify-center">
              <img src={logo1} alt="Logo KeduaKali" className="w-full h-full object-contain p-0.5" />
            </div>
            <div>
              <div className="text-white font-black tracking-wide text-lg leading-tight">KeduaKali</div>
              {!isSuperAdmin && <div className="text-[9px] font-bold text-amber-400 uppercase tracking-widest bg-amber-400/10 w-fit px-1.5 rounded">Mitra Toko</div>}
            </div>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="lg:hidden text-gray-400 hover:text-white"><X size={20} /></button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            if (item.adminOnly && !isSuperAdmin) return null;
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                  active ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                }`}
              >
                <span className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
                  <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 🔒 TOMBOL LOGOUT: Membuka Pop-up Konfirmasi */}
        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={() => {
              setIsMobileOpen(false);
              setShowLogoutModal(true);
            }} 
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* 🖥️ MAIN CONTENT */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen w-full">
        <header className="h-20 bg-white border-b border-gray-200 px-5 lg:px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4 lg:gap-8 flex-1">
            <button onClick={() => setIsMobileOpen(true)} className="lg:hidden text-gray-600 hover:text-gray-900">
              <Menu size={24} />
            </button>
            <h1 className="text-gray-900 font-black text-xl lg:text-2xl tracking-tight truncate">{title || 'Dashboard'}</h1>
          </div>

          <div className="flex items-center gap-5 lg:gap-6">
            
            {/* 🔔 TOMBOL LONCENG NOTIFIKASI DINAMIS */}
            <button 
              onClick={handleBellClick}
              className="relative text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-50 outline-none"
              title="Notifikasi Pesanan Masuk"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 rounded-full border border-white text-[9px] font-black text-white flex items-center justify-center px-1 shadow-sm animate-bounce">
                  {unreadCount > 100 ? '100+' : unreadCount}
                </span>
              )}
            </button>

            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
            
            {/* AREA USER PROFILE */}
            <div 
              onClick={() => navigate('/admin/pengaturan')}
              className="flex items-center gap-3 cursor-pointer hover:opacity-85 active:scale-[0.98] transition-all group select-none"
              title="Buka Pengaturan Akun"
            >
              <div className="text-right hidden sm:block">
                <div className="text-gray-900 text-sm font-bold truncate max-w-[120px] group-hover:text-emerald-600 transition-colors">
                  {admin?.nama || admin?.name || 'Administrator'}
                </div>
                <div className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                  {isSuperAdmin ? 'Super Admin' : 'Mitra Aktif'}
                </div>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-700 font-black border border-emerald-100 flex-shrink-0 group-hover:border-emerald-300 group-hover:bg-emerald-100 transition-all shadow-sm">
                {(admin?.nama || admin?.name || 'A').charAt(0).toUpperCase()}
              </div>
            </div>

          </div>
        </header>

        <main className="flex-1 p-5 lg:p-8 bg-gray-50/50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* 🛑 POP-UP MODAL KONFIRMASI LOGOUT */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 transform scale-100 transition-all duration-200"
            onClick={(e) => e.stopPropagation()} // Supaya tidak tertutup tidak sengaja saat klik area dalam putih
          >
            <div className="flex flex-col items-center text-center">
              {/* Icon Peringatan Merah */}
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4 animate-pulse">
                <LogOut size={22} />
              </div>
              
              <h3 className="text-gray-900 text-base font-black tracking-tight mb-1">Konfirmasi Sesi Keluar</h3>
              <p className="text-gray-500 text-xs leading-relaxed mb-6">
                Apakah Anda yakin ingin keluar dari sistem? Anda harus memasukkan kredensial login kembali untuk mengakses dashboard KeduaKali.
              </p>
              
              {/* Tombol Aksi */}
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors outline-none"
                >
                  Batal
                </button>
                <button 
                  onClick={handleConfirmLogout}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-md shadow-red-600/10 transition-all active:scale-[0.97] outline-none"
                >
                  Ya, Keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}