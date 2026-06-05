import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatRp } from '../data/products';
import {
  ArrowLeft, Clock, Package, CheckCircle2, XCircle,
  Store, Receipt, Ticket, QrCode, ImageOff, Lock, AlertTriangle,
  MapPin, CreditCard, Wallet, Building2, Banknote
} from 'lucide-react';

const STATUS_CONFIG = {
  'Sedang Diproses':  { color: 'text-amber-700 bg-amber-50 border-amber-200',     icon: <Clock size={12} strokeWidth={2.5} /> },
  'Dikemas':          { color: 'text-blue-700 bg-blue-50 border-blue-200',         icon: <Package size={12} strokeWidth={2.5} /> },
  'Menunggu Diambil': { color: 'text-purple-700 bg-purple-50 border-purple-200',   icon: <Store size={12} strokeWidth={2.5} /> },
  'Dikirim':          { color: 'text-purple-700 bg-purple-50 border-purple-200',   icon: <Store size={12} strokeWidth={2.5} /> },
  'Selesai':          { color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: <CheckCircle2 size={12} strokeWidth={2.5} /> },
  'Dibatalkan':       { color: 'text-red-700 bg-red-50 border-red-200',            icon: <XCircle size={12} strokeWidth={2.5} /> },
};

// ✅ Sinkron dengan PAYMENT_DISPLAY di AdminPesanan.jsx
const PAYMENT_DISPLAY = {
  ewallet:         { label: 'QRIS / E-Wallet',  sub: 'GoPay · OVO · Dana · ShopeePay', Icon: Wallet,    color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  qris:            { label: 'QRIS',             sub: 'Scan QR Code',                   Icon: Wallet,    color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  bank:            { label: 'Virtual Account',  sub: 'BCA · Mandiri · BNI · BRI',      Icon: Building2, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  virtual_account: { label: 'Virtual Account',  sub: 'BCA · Mandiri · BNI · BRI',      Icon: Building2, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  transfer:        { label: 'Transfer Bank',    sub: 'Transfer Antar Rekening',        Icon: Banknote,  color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  cash:            { label: 'Tunai / COD',      sub: 'Bayar di Tempat',                Icon: Banknote,  color: 'text-gray-700 bg-gray-50 border-gray-200' },
};

const getPaymentDisplay = (raw) => {
  if (!raw) return { label: 'Tidak Diketahui', sub: 'Data tidak tersedia', Icon: CreditCard, color: 'text-slate-500 bg-slate-50 border-slate-200' };
  const key = raw.toLowerCase().replace(/[\s-]+/g, '_');
  return PAYMENT_DISPLAY[key] || PAYMENT_DISPLAY[raw.toLowerCase()] || {
    label: raw,
    sub:   'Metode Pembayaran',
    Icon:  CreditCard,
    color: 'text-slate-700 bg-slate-50 border-slate-200',
  };
};

const generatePremiumInvoice = (id, dateString) => {
  if (!dateString) return 'INV-X999-0000';
  const timeHash = new Date(dateString).getTime().toString(36).toUpperCase().slice(-4);
  const idHash   = (Number(id) * 8191).toString(36).toUpperCase().padStart(4, '0');
  return `INV-${timeHash}-${idHash}`;
};

// ✅ Normalisasi status dari backend agar konsisten di seluruh UI
const normalizeStatus = (raw) => {
  if (!raw) return 'Sedang Diproses';
  const map = { sukses: 'Selesai', success: 'Selesai', completed: 'Selesai', cancelled: 'Dibatalkan', canceled: 'Dibatalkan' };
  return map[raw.toLowerCase()] || raw;
};

export default function Pesanan() {
  const navigate = useNavigate();
  const { user, authFetch } = useAuth();
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (!user) return;
    const fetchMyOrders = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res    = await authFetch(`${API_URL}/transactions/history`);
        const result = await res.json();

        if (result.status === 'success') {
          const formattedOrders = result.data.map(order => {
            const dateObj      = order.created_at ? new Date(order.created_at) : new Date();
            const formattedDate = dateObj.toLocaleDateString('id-ID', {
              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
            });

            // ✅ Normalisasi status sekali di sini, tidak perlu cek ganda di JSX
            const cleanStatus = normalizeStatus(order.status);

            // Defensif: backend flat row atau nested items
            const orderItems = order.items || [{
              name:          order.nama_produk || 'Item Penyelamatan',
              qty:           order.quantity || 1,
              price:         order.total_harga / (order.quantity || 1),
              gambar_produk: order.gambar_produk,
            }];

            return {
              id:                generatePremiumInvoice(order.id, order.created_at || new Date()),
              date:              formattedDate.replace('pukul', '•'),
              status:            cleanStatus,
              total:             order.total_harga,
              nama_toko:         order.nama_toko || 'Mitra Penyelamat',
              batas_waktu:       order.waktu_tutup ? order.waktu_tutup.substring(0, 5) : '22:00',
              // ✅ Simpan metode pembayaran asli dari backend
              metode_pembayaran: order.payment_method || order.metode_pembayaran || '',
              items:             orderItems,
            };
          });
          setOrders(formattedOrders);
        }
      } catch (error) {
        console.error('Gagal menarik riwayat pesanan:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyOrders();
  }, [user, authFetch]);

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-32 px-5 text-center bg-gray-50 min-h-screen">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-2">
          <Lock size={40} className="text-gray-300" />
        </div>
        <div className="text-xl font-black text-gray-800 tracking-tight">Akses Terkunci</div>
        <p className="text-sm text-gray-500 mb-6 max-w-xs leading-relaxed">
          Silakan masuk ke akun Anda untuk melacak porsi makanan dan membuka tiket reservasi.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="bg-[#047857] hover:bg-[#064E3B] transition-colors shadow-lg active:scale-95 text-white font-bold px-8 py-3.5 rounded-full text-sm w-full max-w-xs"
        >
          Masuk Sekarang
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 min-h-screen w-full font-sans pb-24 md:pb-12">

      {/* ── STICKY HEADER ── */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center text-gray-700 active:scale-95 transition-all flex-shrink-0"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-black text-gray-900 tracking-tight leading-none">Pesanan Saya</h1>
            <p className="text-[10px] md:text-xs font-bold text-emerald-600 uppercase tracking-wider mt-0.5">Riwayat Penyelamatanmu</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-sm animate-pulse">
            <Receipt size={48} className="mb-4 text-gray-200" />
            <div className="w-48 h-4 bg-gray-200 rounded-full mb-2" />
            <div className="w-32 h-3 bg-gray-100 rounded-full" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 md:py-32 text-center bg-white rounded-[2rem] shadow-sm border border-gray-100">
            <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner border border-gray-100">
              <Ticket size={40} className="text-gray-300" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-gray-800 mb-2 tracking-tight">Belum Ada Tiket</h2>
            <p className="text-sm md:text-base text-gray-500 mb-8 max-w-sm px-4 leading-relaxed">
              Mulai selamatkan makanan surplus pertama Anda hari ini dan kumpulkan tiketnya.
            </p>
            <button
              onClick={() => navigate('/katalog')}
              className="bg-[#047857] hover:bg-[#064E3B] active:scale-95 transition-all shadow-[0_8px_20px_rgba(4,120,87,0.25)] text-white font-bold px-8 py-3.5 rounded-full text-sm"
            >
              Cari Makanan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {orders.map((order) => {
              const status         = STATUS_CONFIG[order.status] || STATUS_CONFIG['Sedang Diproses'];
              const isDone         = order.status === 'Selesai';
              const isPendingPickup = order.status === 'Menunggu Diambil' || order.status === 'Sedang Diproses';

              return (
                <div
                  key={order.id}
                  className={`relative overflow-hidden flex flex-col transition-all duration-300 ${
                    isPendingPickup
                      ? 'bg-white rounded-[1.5rem] border-2 border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.15)] hover:-translate-y-1'
                      : 'bg-white rounded-[1.5rem] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1'
                  }`}
                >
                  {isPendingPickup && <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400 animate-pulse" />}

                  {/* Header */}
                  <div className={`px-5 py-4 border-b flex justify-between items-center ${isPendingPickup ? 'bg-amber-50/30 border-amber-100' : 'bg-gray-50/50 border-gray-50'}`}>
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">No. Tiket</div>
                      <div className="text-sm font-black text-gray-900">{order.id}</div>
                    </div>
                    <span className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg border shadow-sm uppercase tracking-wider ${status.color}`}>
                      {status.icon}
                      {order.status}
                    </span>
                  </div>

                  {isPendingPickup && (
                    <div className="px-5 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 flex items-center gap-2">
                      <AlertTriangle size={14} className="text-amber-600 animate-pulse" />
                      <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Segera Ambil Sebelum Tutup!</span>
                    </div>
                  )}

                  {/* Body */}
                  <div className="p-5 flex-1 bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-[10px] font-semibold text-gray-400 flex items-center gap-1.5">
                        <Clock size={12} /> Dipesan: {order.date}
                      </div>
                      <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                        <MapPin size={10} /> {order.nama_toko}
                      </div>
                    </div>
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-4 mt-2 first:mt-0">
                        <div className="relative w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center flex-shrink-0 border border-gray-100 overflow-hidden">
                          {item.gambar_produk && (
                            <img
                              src={item.gambar_produk}
                              alt={item.name}
                              className="absolute inset-0 w-full h-full object-cover z-20"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10">
                            <ImageOff size={18} strokeWidth={1.5} className="text-gray-300" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-gray-900 line-clamp-1 mb-1">{item.name}</div>
                          <div className="text-xs font-semibold text-gray-500">
                            {item.qty} Porsi <span className="mx-1">·</span>
                            <span className="text-emerald-700 font-bold">{formatRp(item.price)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-4 border-t border-gray-50 flex justify-between items-center bg-white mt-auto">
                    <div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Total Bayar</div>
                      <div className="font-black text-base text-gray-900">{formatRp(order.total)}</div>
                    </div>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className={`text-xs font-bold flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-colors shadow-sm ${
                        isPendingPickup
                          ? 'text-white bg-[#0A2E1E] hover:bg-emerald-900 animate-[bounce_2s_infinite]'
                          : 'text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100'
                      }`}
                    >
                      <Ticket size={14} /> Lihat Tiket QR
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── MODAL E-TICKET ── */}
        {selectedOrder && (() => {
          const payInfo   = getPaymentDisplay(selectedOrder.metode_pembayaran);
          const { Icon: PayIcon } = payInfo;
          const isDone    = selectedOrder.status === 'Selesai';

          return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl relative">

                {/* Header Tiket */}
                <div className="p-6 text-center border-b-[2px] border-dashed border-gray-200 bg-emerald-600 relative">
                  <div className="w-12 h-12 bg-white text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                    <Store size={24} strokeWidth={2.5} />
                  </div>
                  <h3 className="font-black text-xl text-white tracking-tight">Tiket Reservasi</h3>
                  <p className="text-[10px] text-emerald-100 mt-1 font-bold uppercase tracking-widest">Tunjukkan ke Kasir Mitra</p>
                  <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-black/70 rounded-full" />
                  <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-black/70 rounded-full" />
                </div>

                <div className="p-6 bg-white">

                  {/* Lokasi & Batas Waktu */}
                  <div className="bg-gray-50 rounded-2xl p-4 mb-5 border border-gray-100 flex flex-col gap-3">
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex-shrink-0">Lokasi</span>
                      <span className="text-sm font-bold text-gray-900 text-right">{selectedOrder.nama_toko}</span>
                    </div>
                    <div className="border-t border-dashed border-gray-200" />
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Batas Ambil</span>
                      <span className="text-sm font-black text-red-600 flex items-center gap-1">
                        <Clock size={12} strokeWidth={3} /> {selectedOrder.batas_waktu} WIB
                      </span>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center mb-5">
                    <div className="relative p-4 bg-white border-2 border-gray-100 rounded-3xl shadow-sm mb-3 overflow-hidden">
                      <QrCode size={120} strokeWidth={1.2} className="text-gray-800 relative z-10" />
                      {!isDone && (
                        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-emerald-500 shadow-[0_0_15px_#10B981] z-20 animate-[ping_2s_ease-in-out_infinite] opacity-70" />
                      )}
                    </div>
                    <span className="bg-gray-100 text-gray-800 text-[10px] font-black px-4 py-1.5 rounded-lg tracking-widest uppercase">
                      {selectedOrder.id}
                    </span>
                  </div>

                  {/* Rincian Porsi */}
                  <div className="space-y-3 mb-5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Rincian Porsi</p>
                    {selectedOrder.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-start text-sm">
                        <div className="flex gap-2">
                          <span className="text-emerald-600 font-black">{item.qty}x</span>
                          <span className="text-gray-800 font-bold leading-tight max-w-[150px]">{item.name}</span>
                        </div>
                        <span className="font-black text-gray-900">{formatRp(item.price * item.qty)}</span>
                      </div>
                    ))}
                  </div>

                  {/* ✅ Metode Pembayaran — DINAMIS dengan ikon & sub-label */}
                  <div className="mb-5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-3">Metode Pembayaran</p>
                    <div className={`flex items-center gap-3 p-3 rounded-xl border ${payInfo.color}`}>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${payInfo.color} bg-white/60 shrink-0`}>
                        <PayIcon size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold leading-tight">{payInfo.label}</p>
                        <p className="text-[11px] font-medium opacity-70 mt-0.5">{payInfo.sub}</p>
                      </div>
                    </div>
                  </div>

                  {/* Total & Status */}
                  <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Total Bayar</p>
                      <p className="font-black text-lg text-emerald-700">{formatRp(selectedOrder.total)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Status Tiket</p>
                      <p className={`font-bold text-xs uppercase ${isDone ? 'text-gray-400' : 'text-amber-600'}`}>
                        {isDone ? 'Telah Digunakan' : 'Aktif (Siap Scan)'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white border-t border-gray-100">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="w-full py-3.5 bg-gray-900 hover:bg-black active:scale-95 text-white rounded-xl font-bold text-sm shadow-md transition-all"
                  >
                    Tutup Tiket
                  </button>
                </div>

              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}