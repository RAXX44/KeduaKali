import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Package, MapPin, Bell, Lock, HelpCircle,
  FileText, LogOut, ChevronRight, Leaf,
  ShieldCheck, ArrowLeft, UserCircle2, Share2, X
} from 'lucide-react';

const MENU_AKTIVITAS = [
  { icon: <Package size={20} className="text-emerald-600" />, label: 'Pesanan Saya', path: '/pesanan' },
  { icon: <MapPin size={20} className="text-emerald-600" />, label: 'Lokasi Pengambilan', path: '#' },
  { icon: <Bell size={20} className="text-emerald-600" />, label: 'Notifikasi', path: '#' },
];

const MENU_PENGATURAN = [
  { icon: <Lock size={20} className="text-gray-500" />, label: 'Keamanan & Password', path: '#' },
  { icon: <HelpCircle size={20} className="text-gray-500" />, label: 'Bantuan & FAQ', path: '#' },
  { icon: <FileText size={20} className="text-gray-500" />, label: 'Syarat & Ketentuan', path: '#' },
];

export default function Akun() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showShareModal, setShowShareModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ── STATE: BELUM LOGIN ──
  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-5 py-32 px-5 text-center bg-gray-50 min-h-screen">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
          <UserCircle2 size={48} className="text-gray-300" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Belum Masuk</h2>
          <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto leading-relaxed">
            Masuk ke akunmu untuk melihat rapor penyelamatan dan melacak pesanan.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-[#047857] hover:bg-[#064E3B] text-white font-bold py-3.5 rounded-full shadow-[0_8px_20px_rgba(4,120,87,0.25)] transition-all active:scale-95"
          >
            Masuk Sekarang
          </button>
          <button
            onClick={() => navigate('/register')}
            className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold py-3.5 rounded-full transition-colors"
          >
            Daftar Akun Baru
          </button>
        </div>
      </div>
    );
  }

  // Pengamanan Variabel User
  const safeUserName = user?.name || user?.nama || 'Pahlawan Lingkungan';
  const userInitial = safeUserName.charAt(0).toUpperCase();

  return (
    <div className="flex-1 bg-gray-50 min-h-screen w-full font-sans pb-24 md:pb-12">

      {/* ── STICKY HEADER (Posisi Paling Atas Kiri) ── */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-100 transition-all">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center text-gray-700 active:scale-95 transition-all flex-shrink-0"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg md:text-xl font-black text-gray-900 tracking-tight leading-none">Profil Saya</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full px-4 md:px-0 mt-6 space-y-6">

        {/* ── PROFILE CARD (Premium Gradient) ── */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(4,120,87,0.2)] text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white flex items-center justify-center text-emerald-700 text-2xl md:text-3xl font-black flex-shrink-0 shadow-inner border-4 border-emerald-400/30">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-lg md:text-xl truncate">{safeUserName}</div>
              <div className="text-xs md:text-sm text-emerald-100 truncate mt-0.5">{user?.email || 'email@belum-diatur.com'}</div>
              <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-lg mt-2 text-[10px] font-bold uppercase tracking-wider border border-white/20">
                <ShieldCheck size={12} /> Member Aktif
              </div>
            </div>
            <button className="hidden md:block bg-white/10 hover:bg-white/20 border border-white/30 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
              Edit Profil
            </button>
          </div>
        </div>

        {/* ── IMPACT TRACKER (Gamification Stats) ── */}
        <div
          onClick={() => setShowShareModal(true)}
          className="grid grid-cols-3 gap-3 md:gap-4 relative group cursor-pointer"
        >
          {/* Overlay Share Hint (Muncul saat hover) */}
          <div className="absolute -top-3 right-0 bg-gray-900 text-white text-[10px] font-bold px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center gap-1 shadow-md">
            <Share2 size={12} /> Bagikan Rapor
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-4 text-center shadow-sm flex flex-col items-center justify-center group-hover:border-emerald-200 transition-colors">
            <Leaf size={24} className="text-emerald-500 mb-2" strokeWidth={1.5} />
            <div className="text-xl md:text-2xl font-black text-gray-900 leading-none">12.5</div>
            <div className="text-[10px] md:text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">Kg Emisi</div>
          </div>
          <div className="bg-white rounded-3xl border border-gray-100 p-4 text-center shadow-sm flex flex-col items-center justify-center group-hover:border-emerald-200 transition-colors">
            <Package size={24} className="text-amber-500 mb-2" strokeWidth={1.5} />
            <div className="text-xl md:text-2xl font-black text-gray-900 leading-none">8</div>
            <div className="text-[10px] md:text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">Porsi Diselamatkan</div>
          </div>
          <div className="bg-white rounded-3xl border border-gray-100 p-4 text-center shadow-sm flex flex-col items-center justify-center group-hover:border-emerald-200 transition-colors">
            <ShieldCheck size={24} className="text-blue-500 mb-2" strokeWidth={1.5} />
            <div className="text-xl md:text-2xl font-black text-gray-900 leading-none">Lv.2</div>
            <div className="text-[10px] md:text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">Eco-Hero</div>
          </div>
        </div>

        {/* ── MENU AKTIVITAS ── */}
        <div>
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Aktivitas</h3>
          <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            {MENU_AKTIVITAS.map((item, i) => (
              <button
                key={item.label}
                onClick={() => item.path !== '#' && navigate(item.path)}
                className={`w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors ${
                  i < MENU_AKTIVITAS.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                <span className="flex-1 text-sm font-bold text-gray-800">{item.label}</span>
                <ChevronRight size={18} className="text-gray-300" />
              </button>
            ))}
          </div>
        </div>

        {/* ── MENU PENGATURAN ── */}
        <div>
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Pengaturan</h3>
          <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            {MENU_PENGATURAN.map((item, i) => (
              <button
                key={item.label}
                onClick={() => item.path !== '#' && navigate(item.path)}
                className={`w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors ${
                  i < MENU_PENGATURAN.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                <span className="flex-1 text-sm font-bold text-gray-700">{item.label}</span>
                <ChevronRight size={18} className="text-gray-300" />
              </button>
            ))}
          </div>
        </div>

        {/* ── LOGOUT BUTTON ── */}
        <div className="pt-4 pb-8">
          <button
            onClick={handleLogout}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-4 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={18} strokeWidth={2.5} />
            Keluar dari Akun
          </button>
          <p className="text-center text-[10px] text-gray-400 font-medium mt-6">
            KeduaKali App v1.0.0
          </p>
        </div>

      </div>

      {/* ── MODAL SHARE IMPACT (Gamifikasi) ── */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-5 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl relative">

            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-black/10 hover:bg-black/20 rounded-full flex items-center justify-center text-white z-20 transition-colors"
            >
              <X size={16} strokeWidth={2.5} />
            </button>

            {/* Area yang bisa di-screenshot (Story Template) */}
            <div className="bg-gradient-to-br from-emerald-600 to-[#0A2E1E] p-8 text-center text-white relative">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/food.png')] opacity-10"></div>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-[1.25rem] border border-white/30 flex items-center justify-center mx-auto mb-6 relative z-10 shadow-inner">
                <Leaf size={32} className="text-emerald-300" />
              </div>
              <h3 className="font-black text-2xl tracking-tight relative z-10">{safeUserName}</h3>
              <p className="text-emerald-200 text-xs font-bold uppercase tracking-widest mt-1 mb-8 relative z-10">Eco-Hero Level 2</p>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 grid grid-cols-2 gap-4 relative z-10">
                <div>
                  <div className="text-3xl font-black text-amber-300 tracking-tight">8</div>
                  <div className="text-[9px] font-bold text-emerald-100 uppercase tracking-widest mt-1">Porsi Aman</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-emerald-300 tracking-tight">12.5</div>
                  <div className="text-[9px] font-bold text-emerald-100 uppercase tracking-widest mt-1">Kg CO₂ Turun</div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/20 relative z-10">
                <p className="text-[10px] font-bold tracking-widest text-emerald-300 uppercase">Bergabunglah dengan Misi Ini</p>
                <p className="text-sm font-black tracking-wide mt-1">KEDUAKALI.APP</p>
              </div>
            </div>

            <div className="p-5">
              <button
                onClick={() => {
                  alert('Rapor disalin ke clipboard! Siap ditempel di Instagram Story.');
                  setShowShareModal(false);
                }}
                className="w-full bg-[#047857] hover:bg-[#064E3B] text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
              >
                <Share2 size={18} /> Bagikan ke IG Story
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}