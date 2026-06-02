import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatRp } from '../data/products';
import { useCart } from '../context/CartContext';
import RekomendasiAI from '../components/RekomendasiAI';
import {
  ArrowLeft, Store, Clock, ImageOff, Tag,
  Info, AlertCircle, CheckCircle2, MapPin,
  Share2, Leaf, ShoppingBag, ChevronRight
} from 'lucide-react';

// Konfigurasi visual untuk kondisi barang
const KONDISI_CONFIG = {
  'leftover': { label: 'Sisa Etalase', style: 'bg-amber-100 text-amber-700 border-amber-200' },
  'imperfect': { label: 'Kurang Sempurna', style: 'bg-sky-100 text-sky-700 border-sky-200' },
  'near-expired': { label: 'Mendekati Kedaluwarsa', style: 'bg-orange-100 text-orange-700 border-orange-200' },
  'canceled': { label: 'Pesanan Batal', style: 'bg-purple-100 text-purple-700 border-purple-200' },
};

export default function DetailProduk() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // ⏱️ State untuk mengecek apakah toko sudah tutup
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/products/${id}`);
        const result = await response.json();

        if (result.status === 'success') {
          const item = result.data;

          setProduct({
            id: item.id,
            store_id: item.store_id,
            nama_toko: item.nama_toko || 'Mitra KeduaKali',
            // 💡 UPGRADE: Ambil waktu_buka juga (dengan fallback)
            waktu_buka: item.waktu_buka || '08:00:00',
            waktu_tutup: item.waktu_tutup || '22:00:00',
            name: item.nama_produk || item.name || 'Produk Penyelamatan',
            category: item.kategori || item.category || 'Umum',
            price: Number(item.harga || item.price || 0),
            originalPrice: item.harga_asli || null,
            discount: item.diskon || null,
            description: item.deskripsi || item.description || 'Produk surplus berkualitas tinggi yang siap diselamatkan. Kondisi 100% layak guna dan sesuai standar mitra kami.',
            stok: item.stok || 0,
            stok_awal: item.stok_awal || null,
            type: item.kondisi || item.type || 'leftover',
            gambar_produk: item.gambar_produk,
            rating: item.rating || (Math.random() * (5.0 - 4.5) + 4.5).toFixed(1),
            reviews: item.reviews || Math.floor(Math.random() * 50) + 5,
          });
        }
      } catch (error) {
        console.error("Gagal menarik detail produk:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
  }, [id]);

  // ⏱️ LOGIKA WAKTU CROSS-MIDNIGHT (SINKRON DENGAN DETAIL TOKO)
  useEffect(() => {
    if (!product?.waktu_tutup || !product?.waktu_buka) return;

    const checkStoreStatus = () => {
      const now = new Date();
      // Format jam saat ini ke format "HH:MM" (misal: "14:30")
      const currentStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      // Ambil 5 karakter pertama ("08:00:00" -> "08:00")
      const openStr = product.waktu_buka.substring(0, 5);
      const closeStr = product.waktu_tutup.substring(0, 5);

      let isOpen = false;

      if (openStr <= closeStr) {
        // Kasus Normal: Buka pagi, Tutup malam (misal 08:00 - 22:00)
        if (currentStr >= openStr && currentStr < closeStr) {
          isOpen = true;
        }
      } else {
        // Kasus Lintas Hari: Buka sore, Tutup dini hari (misal 18:00 - 02:00)
        if (currentStr >= openStr || currentStr < closeStr) {
          isOpen = true;
        }
      }

      setIsClosed(!isOpen); // Jika isOpen false, berarti isClosed true
    };

    checkStoreStatus(); // Jalankan sekali saat komponen dimuat
    const timer = setInterval(checkStoreStatus, 1000); // Cek setiap detik
    return () => clearInterval(timer);
  }, [product]);

  const handleAddToCart = () => {
    if (isClosed || product.stok <= 0) return;
    addToCart(product);
    navigate('/keranjang');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // ── SKELETON LOADING ──
  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 min-h-screen w-full flex flex-col animate-pulse">
        <div className="h-72 md:h-96 w-full bg-gray-200" />
        <div className="max-w-2xl mx-auto w-full px-5 pb-24 relative z-10 -mt-10">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
            <div className="w-20 h-6 bg-gray-200 rounded-lg mb-4" />
            <div className="w-3/4 h-8 bg-gray-200 rounded-xl mb-3" />
            <div className="w-1/3 h-10 bg-gray-200 rounded-xl mb-6" />
            <div className="w-full h-20 bg-gray-100 rounded-2xl mb-6" />
          </div>
        </div>
      </div>
    );
  }

  // ── ERROR STATE ──
  if (!product) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50 px-5 text-center">
        <div className="w-24 h-24 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center mb-5">
          <ImageOff size={36} className="text-gray-300" />
        </div>
        <h1 className="text-xl font-black text-gray-800 tracking-tight mb-2">Produk Tidak Ditemukan</h1>
        <p className="text-sm text-gray-500 max-w-xs mb-6">Item ini mungkin sudah habis diselamatkan atau ditarik oleh mitra.</p>
        <button
          onClick={() => navigate('/katalog')}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-8 py-3 rounded-full transition-all active:scale-95 shadow-md"
        >
          Cari Produk Lain
        </button>
      </div>
    );
  }

  // 💡 UPGRADE LOGIKA BAR STOK DINAMIS
  const isLowStock = product.stok <= 5 && product.stok > 0;
  const maxStok = product.stok_awal || Math.max(20, product.stok + (product.stok > 5 ? 10 : 5));
  const stockPercentage = Math.max(0, Math.min((product.stok / maxStok) * 100, 100));

  const kondisiData = KONDISI_CONFIG[product.type] || KONDISI_CONFIG['leftover'];
  const isButtonDisabled = product.stok <= 0 || isClosed;

  return (
    <div className="flex-1 bg-gray-50 min-h-screen w-full flex flex-col font-sans pb-28">

      {/* ── TOAST NOTIFICATION COPY LINK ── */}
      <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-5 py-2.5 rounded-full shadow-xl text-xs font-bold transition-all duration-300 ${showToast ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        Tautan berhasil disalin!
      </div>

      {/* ── FLOATING TOP NAV ── */}
      <div className="fixed top-4 md:top-6 left-0 right-0 z-50 px-4 md:px-8 max-w-2xl mx-auto w-full flex justify-between items-center pointer-events-none">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors border border-white/20 shadow-lg pointer-events-auto"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <button
          onClick={handleShare}
          className="w-10 h-10 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors border border-white/20 shadow-lg pointer-events-auto"
        >
          <Share2 size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* ── HERO BANNER (Gambar Produk) ── */}
      <div className="w-full h-72 md:h-[420px] bg-gray-200 relative overflow-hidden flex items-center justify-center flex-shrink-0">
        {product.gambar_produk && !imgError ? (
          <img
            src={product.gambar_produk}
            alt={product.name}
            className={`w-full h-full object-cover transition-opacity duration-500 ${isClosed ? 'opacity-50 grayscale' : 'opacity-100'}`}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-100">
            <ImageOff size={48} strokeWidth={1.5} className="text-gray-300" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Visual Tidak Tersedia</span>
          </div>
        )}

        {/* Overlay Jika Toko Tutup */}
        {isClosed && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <span className="bg-red-500/90 backdrop-blur-sm text-white text-sm font-black px-6 py-2 rounded-xl uppercase tracking-widest shadow-lg border border-red-400">
              Toko Telah Tutup
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-gray-900/20 to-transparent opacity-90" />
      </div>

      {/* ── KONTEN UTAMA ── */}
      <div className="max-w-2xl mx-auto w-full px-4 md:px-0 relative z-10 -mt-12 md:-mt-16">
        <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.05)] border border-gray-100">

          {/* Badge Kategori & Kondisi */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-[10px] md:text-xs font-black px-3 py-1.5 rounded-lg uppercase tracking-wider border ${kondisiData.style}`}>
                {kondisiData.label}
              </span>
              <span className="text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 uppercase tracking-wider">
                {product.category}
              </span>
            </div>
            <span className="text-xs font-bold text-gray-400 flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
              ⭐ {product.rating} ({product.reviews})
            </span>
          </div>

          {/* Judul & Harga */}
          <h1 className="text-2xl md:text-3xl font-black mb-2 text-gray-900 leading-tight tracking-tight">
            {product.name}
          </h1>

          <div className="flex items-end gap-3 mb-6">
            <span className={`text-3xl md:text-4xl font-black tracking-tight ${isClosed ? 'text-gray-400' : 'text-emerald-600'}`}>
              {formatRp(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-sm md:text-base text-gray-400 line-through mb-1.5 font-medium">
                {formatRp(product.originalPrice)}
              </span>
            )}
            {product.discount > 0 && !isClosed && (
              <span className="flex items-center gap-1 bg-red-50 text-red-500 text-xs font-black px-2.5 py-1 rounded-lg mb-1.5 border border-red-100">
                <Tag size={12} strokeWidth={2.5}/> -{product.discount}%
              </span>
            )}
          </div>

          {/* ── ECO-IMPACT BANNER ── */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 mb-8 flex items-start gap-3 shadow-sm">
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600 flex-shrink-0 mt-0.5">
              <Leaf size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-1">Dampak Positif</h4>
              <p className="text-xs text-emerald-700/80 font-medium leading-relaxed">
                Membeli produk ini berarti Anda membantu mencegah penumpukan limbah komersial dan menekan emisi gas rumah kaca.
              </p>
            </div>
          </div>

          {/* ── INFO MITRA ── */}
          <div className="mb-8">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
              <MapPin size={16} className="text-gray-400"/> Informasi Pengambilan
            </h2>
            <div
              onClick={() => navigate(`/toko/${product.store_id}`)}
              className="p-1 pl-1 pr-4 bg-white rounded-2xl border border-gray-200 flex items-center justify-between cursor-pointer transition-all hover:border-emerald-300 hover:shadow-md active:scale-[0.98] group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${isClosed ? 'bg-red-50 text-red-400' : 'bg-gray-50 text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600'}`}>
                  <Store size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <div className="text-sm md:text-base font-bold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-1">{product.nama_toko}</div>
                  <div className="text-[10px] text-gray-500 font-semibold mt-0.5 flex items-center gap-1">
                    Batas Ambil: <span className={`${isClosed ? 'text-gray-400 line-through' : 'text-red-500'} font-black`}>{product.waktu_tutup.substring(0, 5)} WIB</span>
                  </div>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
            </div>
          </div>

          {/* ── DESKRIPSI PRODUK ── */}
          <div className="mb-8">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Info size={16} className="text-gray-400"/> Deskripsi Item
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed font-medium">
              {product.description}
            </p>
          </div>

          {/* ── DYNAMIC STOCK BAR YANG SUDAH DI-FIX ── */}
          <div className={`p-5 rounded-2xl border ${isClosed ? 'bg-gray-50 border-gray-200 opacity-70' : isLowStock ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
            <div className="flex justify-between items-center mb-3">
              <div className={`flex items-center gap-2 text-sm font-bold ${isClosed ? 'text-gray-500' : isLowStock ? 'text-red-600' : 'text-emerald-700'}`}>
                {isClosed ? <Store size={18} /> : isLowStock ? <AlertCircle size={18} className="animate-pulse" /> : <CheckCircle2 size={18} />}
                {isClosed ? 'Etalase Ditutup' : isLowStock ? 'Hampir Habis!' : 'Stok Tersedia'}
              </div>
              <div className={`text-xl font-black tracking-tight ${isClosed ? 'text-gray-400' : isLowStock ? 'text-red-600' : 'text-emerald-700'}`}>
                {product.stok} <span className="text-xs font-bold opacity-70 tracking-normal">Item</span>
              </div>
            </div>

            {/* Visualisasi Bar Stok */}
            <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-gray-200/50 shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${isClosed ? 'bg-gray-300' : isLowStock ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'}`}
                style={{ width: `${isClosed || product.stok <= 0 ? 0 : stockPercentage}%` }}
              />
            </div>
          </div>

        </div>

        {/* ── REKOMENDASI AI ── */}
        <div className="mt-8 px-2 md:px-0">
          <RekomendasiAI productId={product.id} title="Kurasi AI: Rekomendasi Terkait ✨" />
        </div>
      </div>

      {/* ── STICKY FLOATING CTA (Tombol Aksi) ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 p-4 pb-6 md:pb-4 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="max-w-2xl mx-auto w-full flex items-center justify-between gap-4">
          <div className="hidden sm:block">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Total Harga</div>
            <div className={`text-2xl font-black tracking-tight ${isClosed ? 'text-gray-400' : 'text-emerald-600'}`}>{formatRp(product.price)}</div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isButtonDisabled}
            className={`flex-1 w-full text-white rounded-2xl py-4 text-sm md:text-base font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
              !isButtonDisabled
                ? 'bg-[#047857] hover:bg-[#064E3B] active:scale-[0.98] shadow-emerald-500/25'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
            }`}
          >
            {isClosed ? (
              'Toko Telah Tutup'
            ) : product.stok > 0 ? (
              <>
                <ShoppingBag size={18} strokeWidth={2.5}/>
                Amankan Sekarang
              </>
            ) : (
              'Stok Habis'
            )}
          </button>
        </div>
      </div>

    </div>
  );
}