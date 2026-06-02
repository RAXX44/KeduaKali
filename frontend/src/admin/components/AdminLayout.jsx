import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  LayoutDashboard, Sparkles, Store, Package, Receipt,
  LineChart, Settings, LogOut, Bell, Menu, X, Leaf, UserCheck, Users
} from 'lucide-react';

// 💡 KONFIGURASI MENU BAWAAN:
// adminOnly: true -> HANYA SUPERADMIN
// adminOnly: false -> SUPERADMIN & MITRA BISA LIHAT
const NAV_ITEMS = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', adminOnly: false },
  { path: '/admin/prediksi', icon: Sparkles, label: 'Prediksi AI', adminOnly: false },

  // ✅ UBAH JADI FALSE: Agar Mitra bisa masuk ke halaman toko untuk mengedit tokonya sendiri
  { path: '/admin/toko', icon: Store, label: 'Manajemen Toko', adminOnly: false },

  { path: '/admin/produk', icon: Package, label: 'Produk Saya', adminOnly: false },
  { path: '/admin/pesanan', icon: Receipt, label: 'Pesanan Masuk', adminOnly: false },
  { path: '/admin/laporan', icon: LineChart, label: 'Laporan ESG', adminOnly: false },

  // 🔒 KHUSUS SUPERADMIN:
  { path: '/admin/users', icon: Users, label: 'Pengguna Sistem', adminOnly: true }, // ✅ MENU BARU
  { path: '/admin/mitra', icon: UserCheck, label: 'Verifikasi Mitra', adminOnly: true },

  { path: '/admin/pengaturan', icon: Settings, label: 'Pengaturan', adminOnly: false },
];

export default function AdminLayout({ children, title }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Ambil data admin dari context untuk mengecek role-nya
  const { admin, adminLogout } = useAdminAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Variabel untuk mengecek apakah yang login adalah super admin
  const isSuperAdmin = admin?.role === 'superadmin';

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex text-sm font-sans selection:bg-emerald-500/30">

      {/* 📱 MOBILE OVERLAY */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-30 lg:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* 🧭 SIDEBAR (Dark Mode) */}
      <aside className={`w-64 bg-[#111827] border-r border-gray-800 flex flex-col fixed h-full z-40 shadow-2xl transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-20 px-6 flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Leaf size={20} className="text-white" />
            </div>
            <div>
              <div className="text-white font-black tracking-wide text-lg leading-tight">KeduaKali</div>
              {/* Badge khusus untuk Mitra */}
              {!isSuperAdmin && <div className="text-[9px] font-bold text-amber-400 uppercase tracking-widest bg-amber-400/10 w-fit px-1.5 rounded">Mitra Toko</div>}
            </div>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="lg:hidden text-gray-400 hover:text-white"><X size={20} /></button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            // 💡 FILTER: Jika menu ini khusus admin (true), dan yang login BUKAN superadmin, hilangkan dari layar!
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

        <div className="p-4 border-t border-gray-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors">
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
            <button className="relative text-gray-400 hover:text-gray-600 transition-colors">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="text-right hidden sm:block">
                <div className="text-gray-900 text-sm font-bold truncate max-w-[120px]">{admin?.nama || admin?.name || 'Administrator'}</div>
                <div className="text-emerald-600 text-[10px] font-bold uppercase">{isSuperAdmin ? 'Super Admin' : 'Mitra Aktif'}</div>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-700 font-black border border-emerald-100 flex-shrink-0">
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
    </div>
  );
}