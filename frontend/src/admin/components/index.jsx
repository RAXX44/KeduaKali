import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext'; // Pastikan path ini benar
import { formatRp } from '../../data/products'; // Pastikan path ini benar
import {
  Home, Compass, ShoppingCart, User,
  ArrowLeft, Leaf, ImageOff, Clock, ShoppingBag, Tag, ScanLine, QrCode, Ticket, X, CheckCircle2, Loader2, ScanFace
} from 'lucide-react';

/* ─── PRODUCT CARD (Premium with Fallback & Stock Bar) ─── */
export function ProductCard({ product }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  // Perhitungan stok untuk visual bar
  const isLowStock = product.stok <= 3 && product.stok > 0;
  const stockPercentage = Math.min(((product.stok || 0) / 10) * 100, 100);

  return (
    <div
      onClick={() => navigate(`/produk/${product.id}`)}
      className="bg-white rounded-[1.5rem] border border-gray-100 overflow-hidden cursor-pointer active:scale-95 hover:-translate-y-1.5 hover:shadow-[0_15px_40px_rgba(0,0,0,0.06)] hover:border-emerald-200 transition-all duration-300 flex flex-col relative group"
    >
      {/* ── Gambar Produk ── */}
      <div className="h-32 md:h-40 bg-gray-50 relative overflow-hidden flex items-center justify-center flex-shrink-0">
        {product.gambar_produk && !imgError ? (
          <img
            src={product.gambar_produk}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 text-gray-300">
            <ImageOff size={28} strokeWidth={1.5} />
            <span className="text-[9px] font-medium">Visual Tidak Tersedia</span>
          </div>
        )}

        {/* Overlay gradient untuk teks putih (jika ada) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Badge Kondisi (Kiri Atas) */}
        <span
          className={`absolute top-2.5 left-2.5 text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest z-10 shadow-sm ${
            product.type === 'leftover'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-sky-100 text-sky-700'
          }`}
        >
          {product.type === 'leftover' ? 'Leftover' : 'Imperfect'}
        </span>

        {/* Badge Diskon (Kanan Atas) */}
        {product.discount > 0 && (
          <span className="absolute top-2.5 right-2.5 flex items-center gap-0.5 bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-lg z-10 shadow-sm">
            <Tag size={10} strokeWidth={2.5} /> -{product.discount}%
          </span>
        )}
      </div>

      {/* ── Info Produk ── */}
      <div className="p-3.5 flex flex-col flex-1 bg-white">
        <h3 className="text-sm font-bold text-gray-900 line-clamp-1 mb-1 group-hover:text-emerald-700 transition-colors">
          {product.name}
        </h3>

        {/* Harga */}
        <div className="flex flex-wrap items-end gap-1.5 mb-3">
          <span className="text-base font-black text-emerald-700">
            {formatRp(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-[10px] text-gray-400 line-through mb-0.5 font-medium">
              {formatRp(product.originalPrice)}
            </span>
          )}
        </div>

        <div className="mt-auto space-y-3">
          {/* Stock Bar Dinamis */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className={isLowStock ? 'text-red-500 animate-pulse' : 'text-emerald-600'}>
                {isLowStock ? `Sisa ${product.stok} porsi!` : 'Porsi Tersedia'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isLowStock ? 'bg-red-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${stockPercentage}%` }}
              />
            </div>
          </div>

          {/* Footer Card: Batas Waktu + Tombol Beli */}
          <div className="flex items-center justify-between pt-2.5 border-t border-gray-50">
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md">
              <Clock size={10} strokeWidth={2.5} />
              {product.batas_konsumsi || '22:00'}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/produk/${product.id}`); }}
              className="flex items-center justify-center bg-[#047857] hover:bg-[#064E3B] text-white p-1.5 rounded-lg transition-colors shadow-sm"
            >
              <ShoppingBag size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart } = useCart();

  // State UI
  const [showCenterMenu, setShowCenterMenu] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanStatus, setScanStatus] = useState('scanning'); // 'scanning', 'processing', 'success'

  const cartItemsCount = cart?.reduce((sum, item) => sum + item.qty, 0) || 0;

  const navItemsLeft = [
    { path: '/', label: 'Beranda', icon: Home },
    { path: '/katalog', label: 'Eksplor', icon: Compass },
  ];

  const navItemsRight = [
    { path: '/keranjang', label: 'Keranjang', icon: ShoppingCart, badge: cartItemsCount },
    { path: '/akun', label: 'Profil', icon: User },
  ];

  // ── FUNGSI SIMULASI SCANNER ──
  const handleOpenScanner = () => {
    setShowCenterMenu(false);
    setScanStatus('scanning');
    setShowScanner(true);

    // Simulasi mendeteksi QR setelah 2.5 detik
    setTimeout(() => {
      setScanStatus('processing');
      // Simulasi validasi ke server selama 1.5 detik
      setTimeout(() => {
        setScanStatus('success');
        // Tutup otomatis setelah sukses
        setTimeout(() => {
          setShowScanner(false);
          // Arahkan ke halaman detail pesanan atau beri notif
          navigate('/pesanan');
        }, 1500);
      }, 1500);
    }, 2500);
  };

  return (
    <>
      {/* ── OVERLAY GELAP SAAT MENU TENGAH DIBUKA ── */}
      {showCenterMenu && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] animate-in fade-in duration-200 md:hidden"
          onClick={() => setShowCenterMenu(false)}
        />
      )}

      {/* ── POP-UP MENU TENGAH ── */}
      <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] w-64 md:hidden transition-all duration-300 ease-out origin-bottom ${showCenterMenu ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 translate-y-10 pointer-events-none'}`}>
        <div className="bg-white rounded-3xl p-2 shadow-2xl border border-gray-100 flex flex-col gap-2">

          <button
            onClick={handleOpenScanner}
            className="flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <ScanFace size={24} strokeWidth={2} />
            </div>
            <div className="text-left">
              <div className="text-sm font-black text-gray-900">Scan QR Kasir</div>
              <div className="text-[10px] font-medium text-gray-500 mt-0.5">Simulasi validasi porsi</div>
            </div>
          </button>

          <button
            onClick={() => { setShowCenterMenu(false); navigate('/pesanan'); }}
            className="flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <Ticket size={24} strokeWidth={2} />
            </div>
            <div className="text-left">
              <div className="text-sm font-black text-gray-900">Tiket Reservasi</div>
              <div className="text-[10px] font-medium text-gray-500 mt-0.5">Tunjukkan ke mitra toko</div>
            </div>
          </button>

        </div>
        <div className="w-4 h-4 bg-white border-b border-r border-gray-100 rotate-45 mx-auto -mt-2.5 shadow-sm"></div>
      </div>

      {/* ── MODAL DUMMY QR SCANNER ── */}
      {showScanner && (
        <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col animate-in fade-in duration-300">

          {/* Header Scanner */}
          <div className="flex items-center justify-between p-6 pb-0 z-10 text-white">
            <button
              onClick={() => setShowScanner(false)}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center transition-colors"
            >
              <X size={24} strokeWidth={2.5} />
            </button>
            <div className="text-center">
              <div className="text-sm font-black tracking-widest uppercase">Pindai QR Code</div>
              <div className="text-[10px] text-gray-400 mt-1">Arahkan kamera ke QR Kasir</div>
            </div>
            <div className="w-10"></div> {/* Spacer */}
          </div>

          {/* Viewfinder Camera Area */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            {/* Background Blur untuk mensimulasikan layar kamera */}
            <div className="absolute inset-0 bg-gray-800/50 backdrop-blur-sm -z-10"></div>

            <div className="relative w-64 h-64">
              {/* Sudut Viewfinder (Corner brackets) */}
              <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-emerald-500 rounded-tl-2xl"></div>
              <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-emerald-500 rounded-tr-2xl"></div>
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-emerald-500 rounded-bl-2xl"></div>
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-emerald-500 rounded-br-2xl"></div>

              {/* Animasi Laser Naik Turun */}
              {scanStatus === 'scanning' && (
                <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,1)] animate-[scan_2s_ease-in-out_infinite]"></div>
              )}

              {/* Animasi Processing / Success di tengah viewfinder */}
              <div className="absolute inset-0 flex items-center justify-center">
                {scanStatus === 'processing' && (
                  <div className="bg-gray-900/80 backdrop-blur-md p-4 rounded-2xl flex flex-col items-center animate-in zoom-in">
                    <Loader2 size={32} className="text-emerald-500 animate-spin mb-2" />
                    <span className="text-xs font-bold text-white tracking-widest uppercase">Memvalidasi...</span>
                  </div>
                )}
                {scanStatus === 'success' && (
                  <div className="bg-emerald-500/90 backdrop-blur-md p-4 rounded-2xl flex flex-col items-center animate-in zoom-in">
                    <CheckCircle2 size={40} className="text-white mb-2" strokeWidth={2.5} />
                    <span className="text-xs font-black text-white tracking-widest uppercase">Berhasil!</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Instruction */}
          <div className="p-8 pb-12 text-center z-10 bg-gradient-to-t from-gray-900 to-transparent">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <QrCode size={28} className="text-white" />
            </div>
            <p className="text-gray-300 text-sm font-medium">Pastikan QR Code berada di dalam bingkai.</p>
          </div>

        </div>
      )}

      {/* ── CSS KHUSUS ANIMASI LASER ── */}
      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(256px); } /* 256px = ukuran h-64 */
        }
      `}</style>

      {/* ── BOTTOM NAV BAR UTAMA ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200/60 pb-safe z-[50] shadow-[0_-10px_40px_rgba(0,0,0,0.08)] md:hidden">
        <div className="flex justify-between items-center h-16 px-2 relative">

          <div className="flex flex-1 justify-around">
            {navItemsLeft.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              const Icon = item.icon;
              return (
                <button key={item.path} onClick={() => { setShowCenterMenu(false); navigate(item.path); }} className="relative flex flex-col items-center justify-center w-full h-full group outline-none">
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={`transition-colors duration-300 ${isActive ? 'text-[#047857]' : 'text-gray-400 group-active:scale-90'}`} />
                  <span className={`text-[9px] font-bold mt-1 transition-all duration-300 ${isActive ? 'text-[#047857]' : 'text-gray-400'}`}>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative w-16 flex justify-center -top-6">
            <button
              onClick={() => setShowCenterMenu(!showCenterMenu)}
              className={`absolute flex items-center justify-center w-14 h-14 rounded-full shadow-[0_8px_20px_rgba(16,185,129,0.4)] text-white transition-all duration-300 outline-none ${
                showCenterMenu
                  ? 'bg-gray-800 rotate-180 scale-95 shadow-none'
                  : 'bg-gradient-to-tr from-emerald-700 to-emerald-400 hover:scale-105 active:scale-95'
              }`}
            >
              {showCenterMenu ? <X size={24} strokeWidth={2.5} /> : <ScanLine size={24} strokeWidth={2.5} />}
            </button>
          </div>

          <div className="flex flex-1 justify-around">
            {navItemsRight.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              const Icon = item.icon;
              return (
                <button key={item.path} onClick={() => { setShowCenterMenu(false); navigate(item.path); }} className="relative flex flex-col items-center justify-center w-full h-full group outline-none">
                  <div className="relative">
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={`transition-colors duration-300 ${isActive ? 'text-[#047857]' : 'text-gray-400 group-active:scale-90'}`} />
                    {item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[9px] font-bold mt-1 transition-all duration-300 ${isActive ? 'text-[#047857]' : 'text-gray-400'}`}>{item.label}</span>
                </button>
              );
            })}
          </div>

        </div>
      </nav>
    </>
  );
}