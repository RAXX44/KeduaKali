import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { formatRp } from '../data/products';
import { useCart } from '../context/CartContext';
import {
  Check, Ticket, Sparkles, ChevronRight,
  Store, QrCode, MapPin, Smartphone, ShoppingBag
} from 'lucide-react';

const PAYMENT_LABELS = {
  bank: 'Virtual Account (Otomatis)',
  ewallet: 'QRIS / E-Wallet',
};

export default function Success() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { clearCart } = useCart();
  const [animate, setAnimate] = useState(false);

  // Mencegah infinite loop dan memicu animasi masuk
  useEffect(() => {
    if (clearCart) {
      clearCart();
    }
    // Timeout kecil untuk memicu transisi CSS setelah komponen di-render
    setTimeout(() => setAnimate(true), 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Perlindungan URL (Bouncer)
  if (!state) {
    return <Navigate to="/" replace />;
  }

  const payment = state.payment || 'ewallet';
  const total = state.total || 0;

  const invoiceNo = state.invoiceId
    ? `INV-${String(state.invoiceId).padStart(4, '0')}`
    : `INV-${Math.floor(1000 + Math.random() * 9000)}`;

  // Dummy PIN Pengambilan (4 Digit)
  const pickupPin = Math.floor(1000 + Math.random() * 9000);

  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' • ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex-1 min-h-screen bg-gray-50/80 w-full flex items-center justify-center p-5 md:p-8 font-sans overflow-hidden">

      {/* ── KARTU TIKET DIGITAL ── */}
      <div
        className={`bg-white max-w-md w-full rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-gray-100 text-center relative flex flex-col transition-all duration-700 ease-out transform ${
          animate ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'
        }`}
      >

        {/* Dekorasi Latar Glowing */}
        <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[20%] left-[-30px] w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* ── HEADER TIKET (Sukses Animasi) ── */}
        <div className="p-8 pb-6 relative overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-t-[2rem] text-white">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/food.png')] opacity-10"></div>

          {/* Animated Success Icon */}
          <div className="relative inline-block mb-5">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] relative z-10">
              <Check size={40} strokeWidth={3} className="text-emerald-500" />
            </div>
            {/* Ping effect behind the check */}
            <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-30"></div>
          </div>

          <h1 className="text-2xl font-black mb-2 tracking-tight flex items-center justify-center gap-2">
            Reservasi Berhasil! <Sparkles size={24} className="text-yellow-300" />
          </h1>
          <p className="text-sm text-emerald-100 leading-relaxed font-medium px-2">
            Porsi makananmu telah diamankan. Jangan lupa diambil sebelum toko tutup ya!
          </p>
        </div>

        {/* ── BODY TIKET (Detail Order) ── */}
        <div className="p-6 md:p-8 relative bg-white">
          {/* Aksen bolongan tiket (Kiri Kanan) */}
          <div className="absolute -top-4 -left-4 w-8 h-8 bg-gray-50 rounded-full border-b border-r border-gray-100 shadow-inner"></div>
          <div className="absolute -top-4 -right-4 w-8 h-8 bg-gray-50 rounded-full border-b border-l border-gray-100 shadow-inner"></div>
          {/* Garis putus-putus pemisah tiket */}
          <div className="absolute top-0 left-6 right-6 border-t-2 border-dashed border-gray-200"></div>

          {/* PIN PENGAMBILAN (Wow Factor) */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 flex items-center justify-between shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-5">
              <QrCode size={100} />
            </div>
            <div className="text-left relative z-10">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">PIN Pengambilan</p>
              <p className="text-3xl font-black text-emerald-800 tracking-[0.2em]">{pickupPin}</p>
            </div>
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm relative z-10">
              <QrCode size={24} className="text-emerald-600" />
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-3">
              <span className="text-gray-500 font-medium">No. Referensi</span>
              <span className="font-bold text-gray-900">{invoiceNo}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-3">
              <span className="text-gray-500 font-medium">Waktu Transaksi</span>
              <span className="font-bold text-gray-900">{dateStr}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-3">
              <span className="text-gray-500 font-medium">Pembayaran</span>
              <span className="font-bold text-gray-900 text-right max-w-[150px] truncate">
                {PAYMENT_LABELS[payment] || 'Lunas'}
              </span>
            </div>

            {/* Total Block */}
            <div className="flex justify-between items-center pt-2">
              <span className="font-bold text-gray-500 uppercase text-[10px] tracking-widest">Total Dibayar</span>
              <span className="font-black text-emerald-600 text-2xl">{formatRp(total)}</span>
            </div>
          </div>

          {/* Langkah Selanjutnya Mini-Timeline */}
          <div className="mt-6 pt-5 border-t border-dashed border-gray-200 text-left">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Langkah Selanjutnya</p>
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><MapPin size={12} strokeWidth={3} /></div>
                <div className="w-0.5 h-6 bg-gray-100"></div>
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><Smartphone size={12} strokeWidth={3} /></div>
                <div className="w-0.5 h-6 bg-gray-100"></div>
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><ShoppingBag size={12} strokeWidth={3} /></div>
              </div>
              <div className="flex flex-col gap-5 pt-0.5">
                <div>
                  <p className="text-xs font-bold text-gray-800">Kunjungi Mitra</p>
                  <p className="text-[10px] text-gray-500 font-medium">Datang ke lokasi toko sebelum jam tutup.</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">Tunjukkan PIN / QR</p>
                  <p className="text-[10px] text-gray-500 font-medium">Buka menu Tiket dan tunjukkan ke kasir.</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">Selamatkan Makanan</p>
                  <p className="text-[10px] text-gray-500 font-medium">Bawa pulang makanan lezatmu!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER TIKET (Action Buttons) ── */}
        <div className="px-8 pb-8 pt-4 bg-white rounded-b-[2rem] space-y-3">
          <button
            onClick={() => navigate('/pesanan')}
            className="w-full bg-[#047857] hover:bg-[#064E3B] active:scale-[0.98] transition-all text-white font-bold px-8 py-4 rounded-2xl text-sm shadow-[0_8px_20px_rgba(4,120,87,0.25)] flex items-center justify-center gap-2 group"
          >
            Buka Tiket Saya <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-transparent text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 active:scale-[0.98] transition-all font-bold px-8 py-4 rounded-2xl text-sm"
          >
            Kembali ke Beranda
          </button>
        </div>

      </div>
    </div>
  );
}