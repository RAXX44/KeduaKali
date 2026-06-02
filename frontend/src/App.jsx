import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { BottomNav } from './admin/components';

import { Loader2, ShieldCheck } from 'lucide-react';

import Beranda from './pages/Beranda';
import Katalog from './pages/Katalog';
import DetailProduk from './pages/DetailProduk';
import Keranjang from './pages/Keranjang';
import Checkout from './pages/Checkout';
import Success from './pages/Success';
import Akun from './pages/Akun';
import Login from './pages/Login';
import Register from './pages/Register';
import Pesanan from './pages/Pesanan';
import DetailToko from './pages/DetailToko';

import AdminLogin from './admin/pages/AdminLogin';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminProduk from './admin/pages/AdminProduk';
import AdminPesanan from './admin/pages/AdminPesanan';
import AdminPrediksi from './admin/pages/AdminPrediksi';
import AdminToko from './admin/pages/AdminToko';
import AdminLaporan from './admin/pages/AdminLaporan';
import AdminPengaturan from './admin/pages/AdminPengaturan';
import AdminMitra from './admin/pages/AdminMitra';
import AdminDaftarPengguna from './admin/pages/AdminDaftarPengguna';

const HIDE_NAV_ROUTES = ['/checkout', '/success', '/login', '/register', '/pesanan'];

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex flex-col items-center justify-center text-emerald-600">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
          <Loader2 className="animate-spin" size={32} strokeWidth={2.5} />
        </div>
        <div className="text-sm font-bold text-gray-500 animate-pulse tracking-widest uppercase">Memuat Sesi...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// 🛡️ SATPAM ADMIN: Mengizinkan superadmin DAN mitra
function AdminRoute({ children }) {
  const { admin, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-emerald-500 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <ShieldCheck className="animate-pulse mb-4 relative z-10" size={48} strokeWidth={1.5} />
        <div className="text-xs font-mono text-emerald-500/70 animate-pulse tracking-widest relative z-10">MEMBACA ENKRIPSI SESI...</div>
      </div>
    );
  }

  if (!admin || !['superadmin', 'mitra'].includes(admin.role)) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

// 🔒 SATPAM SUPERADMIN: Hanya superadmin yang bisa akses
function SuperAdminRoute({ children }) {
  const { admin } = useAdminAuth();

  if (admin?.role !== 'superadmin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return children;
}

// 🎨 LAYOUT KONSUMEN
function CustomerLayout() {
  const location = useLocation();

  const hideNav =
    HIDE_NAV_ROUTES.includes(location.pathname) ||
    location.pathname.startsWith('/produk/') ||
    location.pathname.startsWith('/toko/');

  return (
    <div className="w-full min-h-screen bg-white md:bg-gray-50 flex flex-col relative font-sans">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Beranda />} />
        <Route path="/katalog" element={<Katalog />} />
        <Route path="/produk/:id" element={<DetailProduk />} />
        <Route path="/keranjang" element={<Keranjang />} />
        <Route path="/toko/:id" element={<DetailToko />} />

        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/success" element={<ProtectedRoute><Success /></ProtectedRoute>} />
        <Route path="/akun" element={<ProtectedRoute><Akun /></ProtectedRoute>} />
        <Route path="/pesanan" element={<ProtectedRoute><Pesanan /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!hideNav && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
          <BottomNav />
        </div>
      )}
    </div>
  );
}

// ⚙️ LAYOUT ADMIN
function AdminRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/produk" element={<AdminRoute><AdminProduk /></AdminRoute>} />
      <Route path="/pesanan" element={<AdminRoute><AdminPesanan /></AdminRoute>} />
      <Route path="/prediksi" element={<AdminRoute><AdminPrediksi /></AdminRoute>} />
      <Route path="/laporan" element={<AdminRoute><AdminLaporan /></AdminRoute>} />
      <Route path="/pengaturan" element={<AdminRoute><AdminPengaturan /></AdminRoute>} />

      {/* ✅ FIX: Cabut SuperAdminRoute dari /toko agar Mitra bisa masuk! */}
      <Route path="/toko" element={<AdminRoute><AdminToko /></AdminRoute>} />

      {/* 🔒 Khusus superadmin */}
      <Route path="/mitra" element={<AdminRoute><SuperAdminRoute><AdminMitra /></SuperAdminRoute></AdminRoute>} />
      <Route path="/users" element={<AdminRoute><SuperAdminRoute><AdminDaftarPengguna /></SuperAdminRoute></AdminRoute>} />

      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
}

// 🚀 ROOT APP
export default function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/admin/*" element={<AdminRoutes />} />
              <Route path="/*" element={<CustomerLayout />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}