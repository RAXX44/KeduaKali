import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatRp } from '../data/products';
import { useAuth } from '../context/AuthContext';
import { transactionApi } from '../services/api';
import {
  ArrowLeft, User, Phone, ShoppingBag,
  Building, Wallet, CheckCircle2, ShieldCheck, Loader2,
  MapPin, Clock, Ticket, Sparkles
} from 'lucide-react';

const PAYMENT_OPTIONS = [
  { id: 'ewallet', icon: <Wallet size={24} className="text-emerald-600" />, label: 'QRIS / E-Wallet', sub: 'GoPay, OVO, Dana, ShopeePay' },
  { id: 'bank', icon: <Building size={24} className="text-emerald-600" />, label: 'Virtual Account', sub: 'BCA, Mandiri, BNI, BRI' },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, total } = useCart();
  const { authFetch } = useAuth();

  const [selectedPayment, setSelectedPayment] = useState('ewallet');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nama: '',
    telepon: '',
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Mengambil info toko dari item pertama di keranjang
  const namaToko = cart.length > 0 ? cart[0].nama_toko : 'Mitra KeduaKali';
  const batasWaktu = cart.length > 0 && cart[0].waktu_tutup ? cart[0].waktu_tutup.substring(0, 5) : '22:00';

  const handleSubmit = async () => {
    if (!form.nama || !form.telepon) {
      alert('Mohon lengkapi identitas pengambilan terlebih dahulu.');
      return;
    }

    if (!cart || cart.length === 0) {
      alert('Tas Penyelamatan kamu kosong! Silakan pilih makanan dulu di Katalog.');
      navigate('/katalog');
      return;
    }

    setLoading(true);

   try {
      // HAPUS blok const res = await authFetch(...) dan ganti dengan INI:

      const checkoutData = {
          product_id: cart[0].id,
          total_harga: total,
          quantity: cart[0].qty || 1,
          payment_method: selectedPayment,
          shipping_address: 'Ambil di Toko (Self-Pickup)',
          items: cart
      };

      // Tembak menggunakan jalan tol api.js
      const data = await transactionApi.checkout(checkoutData);

      // Langsung pindah halaman
      navigate('/success', {
        state: {
          payment: selectedPayment,
          total: total,
          invoiceId: data.data?.id || data.transaction_id || Date.now()
        }
      });

    } catch (error) {
      console.error("Error Checkout:", error);
      alert(error.message || "Transaksi gagal diproses sistem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 min-h-screen w-full font-sans pb-24 md:pb-12">

      {/* ── STICKY HEADER ── */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-100 transition-all">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center text-gray-700 active:scale-95 transition-all flex-shrink-0"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg md:text-xl font-black text-gray-900 tracking-tight leading-none">Konfirmasi Reservasi</h1>
            <p className="text-[10px] md:text-xs font-bold text-emerald-600 uppercase tracking-wider mt-0.5">
              Langkah Terakhir Misi
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full px-4 md:px-0 mt-6 space-y-6">

        {/* ── DETAIL PENGAMBILAN (SELF-PICKUP) ── */}
        <div className="bg-white rounded-[2rem] border border-emerald-100 p-5 md:p-8 shadow-[0_4px_20px_rgba(16,185,129,0.05)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[100px] -z-0"></div>

          <h2 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-5 flex items-center gap-2 relative z-10">
            <Ticket size={16} /> Detail Reservasi (Ambil Sendiri)
          </h2>

          <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 mb-5 relative z-10">
            <div className="flex items-start gap-3 mb-3">
              <MapPin size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Lokasi Pengambilan</div>
                <div className="text-sm font-bold text-gray-900">{namaToko}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Batas Pengambilan</div>
                <div className="text-sm font-bold text-red-600">Hari ini, sebelum jam {batasWaktu} WIB</div>
              </div>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1">Nama Pengambil</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-gray-800 font-medium"
                  placeholder="Nama yang akan ditunjukkan ke kasir"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1">Nomor WhatsApp</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-gray-800 font-medium"
                  placeholder="0812-xxxx-xxxx"
                  type="tel"
                  value={form.telepon}
                  onChange={(e) => setForm({ ...form, telepon: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── RINGKASAN ITEM (Penting untuk Trust) ── */}
        <div className="bg-white rounded-[2rem] border border-gray-100 p-5 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <ShoppingBag size={16} className="text-emerald-500" /> Rincian Porsi
          </h2>

          <div className="space-y-3">
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                <div className="flex gap-3">
                  <span className="text-emerald-600 font-black">{item.qty}x</span>
                  <span className="text-sm font-bold text-gray-800">{item.name}</span>
                </div>
                <span className="text-sm font-black text-gray-900">{formatRp(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── METODE PEMBAYARAN ── */}
        <div className="bg-white rounded-[2rem] border border-gray-100 p-5 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
            <Wallet size={16} className="text-emerald-500" /> Metode Pembayaran (Simulasi)
          </h2>

          <div className="space-y-3">
            {PAYMENT_OPTIONS.map((opt) => {
              const isSelected = selectedPayment === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedPayment(opt.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                    {opt.icon}
                  </div>

                  <div className="flex-1">
                    <div className={`text-sm font-bold ${isSelected ? 'text-emerald-900' : 'text-gray-900'}`}>
                      {opt.label}
                    </div>
                    <div className="text-[11px] md:text-xs text-gray-500 font-medium mt-0.5">
                      {opt.sub}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <CheckCircle2
                      size={24}
                      className={`transition-all ${isSelected ? 'text-emerald-500 scale-100 opacity-100' : 'text-gray-300 scale-90 opacity-0'}`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── RINGKASAN TAGIHAN & CTA ── */}
        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)]">

          <div className="flex justify-between items-center py-5 border-b border-dashed border-gray-200 mb-6">
            <div>
              <span className="text-sm md:text-base font-bold text-gray-500 uppercase tracking-widest block">Total Tagihan</span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md mt-1.5 w-fit">
                <Sparkles size={12} /> Bebas Biaya Penanganan
              </span>
            </div>
            <span className="text-3xl md:text-4xl font-black text-emerald-600 tracking-tight">
              {formatRp(total)}
            </span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full text-white rounded-2xl py-4 md:py-4 text-sm md:text-base font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
              loading
                ? 'bg-gray-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 active:scale-[0.98] shadow-emerald-500/30'
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Memproses Tiket...
              </>
            ) : (
              <>
                <ShieldCheck size={20} /> Konfirmasi & Bayar
              </>
            )}
          </button>

          <p className="text-center text-[10px] text-gray-400 font-medium mt-5 flex items-center justify-center gap-1.5">
            <ShieldCheck size={12} /> Transaksi aman. Tiket QR akan diberikan setelah ini.
          </p>
        </div>

      </div>
    </div>
  );
}