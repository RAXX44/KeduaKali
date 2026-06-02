import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Search, MapPin, Clock, ChevronRight,
  ArrowLeft, ShoppingCart, Store, X,
  ArrowUpDown, ImageOff, Recycle, Package, Filter
} from 'lucide-react';

const FILTERS = [
  'Semua',
  'Restoran & F&B',
  'Bakery & Pastry',
  'Kafe & Roastery',
  'Supermarket & Ritel',
  'Hotel & Buffet',
  'Pasar Tradisional',
  'Grosir Pangan',
  'Fashion & Gaya Hidup',
  'Lainnya'
];

const SORTS = [
  { label: 'Terbaru', value: 'newest' },
  { label: 'Nama (A - Z)', value: 'az' },
  { label: 'Nama (Z - A)', value: 'za' },
  { label: 'Segera Tutup', value: 'closing_soon' },
  { label: 'Tutup Terakhir', value: 'closing_late' },
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Fungsi Pengecek Waktu Real-Time ──
const checkIsOpenRealtime = (store) => {
  if (!store.is_active) return false;
  if (!store.waktu_tutup) return true;

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

  const openTime = store.waktu_buka ? store.waktu_buka.substring(0, 5) : '00:00';
  const closeTime = store.waktu_tutup.substring(0, 5);

  if (openTime <= closeTime) {
    return currentTimeStr >= openTime && currentTimeStr < closeTime;
  } else {
    // Jika toko buka melewati tengah malam (misal 18:00 - 02:00)
    return currentTimeStr >= openTime || currentTimeStr < closeTime;
  }
};

// ── Skeleton Loading ──
const SkeletonStoreCard = () => (
  <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden animate-pulse">
    <div className="h-44 bg-gray-100" />
    <div className="p-5 space-y-3">
      <div className="h-5 bg-gray-200 rounded-lg w-2/3" />
      <div className="h-3 bg-gray-100 rounded-full w-full" />
      <div className="h-3 bg-gray-100 rounded-full w-4/5" />
      <div className="h-4 bg-gray-200 rounded-lg w-1/2 mt-4" />
    </div>
  </div>
);

// ── Store Card ──
const StoreCard = ({ store, onClick }) => {
  const [imgError, setImgError] = useState(false);
  const isRetail = store.kategori?.includes('Ritel') || store.kategori?.includes('Fashion');

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-[2rem] border overflow-hidden cursor-pointer group transition-all duration-300 flex flex-col relative ${
        store.isOpenRealtime
          ? 'border-gray-100 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:border-emerald-200'
          : 'border-gray-200 opacity-80 hover:opacity-100 grayscale-[0.3]'
      }`}
    >
      <div className="h-40 md:h-48 bg-gray-50 relative overflow-hidden flex items-center justify-center flex-shrink-0 p-2 md:p-3">
        {store.gambar_toko && !imgError ? (
          <img
            src={store.gambar_toko}
            alt={store.nama_toko}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out drop-shadow-sm"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 z-0 text-gray-300">
            {isRetail ? <Package size={32} strokeWidth={1.5} /> : <Store size={32} strokeWidth={1.5} />}
            <span className="text-[10px] text-gray-400 font-medium">Visual tidak tersedia</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent pointer-events-none transition-opacity duration-300 group-hover:opacity-80" />

        {/* Indikator Tutup Berdasarkan Waktu Nyata */}
        {!store.isOpenRealtime && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="bg-red-500 text-white text-xs font-black px-5 py-2 rounded-xl uppercase tracking-widest shadow-lg border border-red-400/50">
              Telah Tutup
            </span>
          </div>
        )}

        {store.isOpenRealtime && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none hidden md:flex">
             <span className="bg-white/95 backdrop-blur-sm text-emerald-700 font-bold text-xs px-5 py-2.5 rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.15)] flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                Kunjungi Etalase <ChevronRight size={16} />
             </span>
          </div>
        )}

        <span className="absolute top-4 left-4 bg-white/95 backdrop-blur-md text-gray-800 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider z-20 shadow-sm max-w-[75%] truncate">
          {store.kategori || 'Kategori Umum'}
        </span>

        <span className={`absolute bottom-4 left-4 flex items-center gap-1.5 backdrop-blur-md border text-white text-[10px] font-bold px-3 py-1.5 rounded-lg z-20 shadow-md ${
          store.isOpenRealtime ? 'bg-red-500/90 border-red-400/50' : 'bg-gray-800/90 border-gray-600/50'
        }`}>
          <Clock size={12} strokeWidth={2.5} />
          {store.isOpenRealtime ? 'Tutup' : 'Buka'} {store.isOpenRealtime ? (store.waktu_tutup ? store.waktu_tutup.substring(0, 5) : '22:00') : (store.waktu_buka ? store.waktu_buka.substring(0, 5) : '08:00')}
        </span>
      </div>

      <div className="p-5 flex flex-col flex-1 bg-white relative z-20">
        <h3 className={`text-lg md:text-xl font-bold line-clamp-1 mb-1.5 transition-colors ${store.isOpenRealtime ? 'text-gray-900 group-hover:text-emerald-700' : 'text-gray-600'}`}>
          {store.nama_toko}
        </h3>
        <p className="text-xs md:text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4 flex-1">
          {store.deskripsi || 'Mitra resmi penyalur produk surplus dan barang imperfect layak guna. Berbelanja di sini berarti mendukung pengurangan limbah komersial.'}
        </p>
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium truncate max-w-[70%]">
            <MapPin size={14} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{store.alamat || 'Lokasi tersedia'}</span>
          </span>
          <span className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-1.5 ${
            store.isOpenRealtime ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
          }`}>
            {store.isOpenRealtime && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
            {store.isOpenRealtime ? 'Buka' : 'Tutup'}
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function Katalog() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [activeFilter, setActiveFilter] = useState('Semua');
  const [activeSort, setActiveSort] = useState('newest');
  const [statusFilter, setStatusFilter] = useState('Semua'); // 'Semua' atau 'Buka'
  const [showSort, setShowSort] = useState(false);
  const [search, setSearch] = useState(location.state?.searchQuery || '');
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Mouse Drag-to-Scroll Refs & States ──
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await fetch(`${API_URL}/stores`);
        const result = await res.json();
        if (result.status === 'success') setStores(result.data);
      } catch (err) {
        console.error('Gagal menarik data toko:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();

    // Re-render setiap 1 menit untuk update status Buka/Tutup secara otomatis
    const interval = setInterval(() => setStores(s => [...s]), 60000);
    return () => clearInterval(interval);
  }, []);

  // ── Drag-to-Scroll Handlers ──
  const onMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };
  const onMouseLeave = () => setIsDragging(false);
  const onMouseUp = () => setIsDragging(false);
  const onMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Kecepatan scroll
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // 💡 LOGIKA SORTIR BERDASARKAN KODE ASLI YANG BERFUNGSI
  const processed = stores
    // 0. Set Status Realtime
    .map(s => ({ ...s, isOpenRealtime: checkIsOpenRealtime(s) }))
    // 1. FILTERING KATEGORI
    .filter((s) => {
      if (activeFilter === 'Semua') return true;
      const storeCat = (s.kategori || 'Lainnya').trim().toLowerCase();
      return storeCat === activeFilter.toLowerCase();
    })
    // 2. FILTERING STATUS BUKA
    .filter((s) => {
      if (statusFilter === 'Buka') return s.isOpenRealtime;
      return true;
    })
    // 3. SEARCHING
    .filter((s) =>
      search.trim() === '' ||
      (s.nama_toko || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.kategori || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.deskripsi || '').toLowerCase().includes(search.toLowerCase())
    )
    // 4. SORTING
    .sort((a, b) => {
      if (activeSort === 'az') {
        return (a.nama_toko || '').localeCompare(b.nama_toko || '');
      }
      if (activeSort === 'za') {
        return (b.nama_toko || '').localeCompare(a.nama_toko || '');
      }
      if (activeSort === 'closing_soon') {
        const ta = a.waktu_tutup || '23:59';
        const tb = b.waktu_tutup || '23:59';
        return ta.localeCompare(tb);
      }
      if (activeSort === 'closing_late') {
        const ta = a.waktu_tutup || '00:00';
        const tb = b.waktu_tutup || '00:00';
        return tb.localeCompare(ta);
      }
      // Default 'newest' (ID Tertinggi)
      return b.id - a.id;
    });

  // 💡 PISAHKAN AKTIF DAN NON-AKTIF AGAR YANG TUTUP SELALU DI BAWAH (Seperti Kode Aslimu)
  const activeStores = processed.filter((s) => s.isOpenRealtime);
  const inactiveStores = processed.filter((s) => !s.isOpenRealtime);
  const sortedAll = [...activeStores, ...inactiveStores];

  const safeUserName = user?.name || user?.nama || 'Pengguna';
  const userInitial = safeUserName.charAt(0).toUpperCase();

  return (
    <div className="flex-1 bg-gray-50 min-h-screen w-full flex flex-col pb-24 md:pb-12 font-sans overflow-x-hidden">

      {/* 🚀 PREMIUM HERO SECTION DENGAN BACKGROUND IMAGE & NEW LOGO */}
      <div className="relative w-full pt-6 md:pt-10 pb-20 md:pb-28 shadow-lg overflow-hidden bg-[#047857]">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047&auto=format&fit=crop"
            alt="Retail Background"
            className="w-full h-full object-cover opacity-20 mix-blend-overlay pointer-events-none"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#064E3B] via-[#047857]/90 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#047857] via-transparent to-transparent md:hidden"></div>

        <div className="max-w-7xl mx-auto px-5 md:px-12 relative z-10 text-white">
          <div className="flex justify-between items-center mb-10 md:mb-16">
            <button
              onClick={() => navigate(-1)}
              className="md:hidden w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white active:scale-95 shadow-sm transition-transform"
            >
              <ArrowLeft size={18} strokeWidth={2} />
            </button>

            <div className="hidden md:flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden group-hover:scale-105 transition-transform">
                <div className="absolute inset-0 bg-emerald-50 opacity-50"></div>
                <Recycle size={22} strokeWidth={2.5} className="text-emerald-600 relative z-10" />
              </div>
              <span className="text-xl font-black text-white tracking-wide">KeduaKali</span>
            </div>

            <h1 className="md:hidden text-lg font-bold text-white">Katalog Mitra</h1>

            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
              <button onClick={() => navigate('/')} className="text-emerald-100 hover:text-white transition-colors">Beranda</button>
              <button className="text-white border-b-2 border-emerald-400 pb-1">Katalog Mitra</button>
              <button onClick={() => navigate('/pesanan')} className="text-emerald-100 hover:text-white transition-colors">Pesanan Saya</button>
              <button
                onClick={() => navigate('/keranjang')}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white px-5 py-2.5 rounded-full transition-all active:scale-95 shadow-sm"
              >
                <ShoppingCart size={18} strokeWidth={2.5} /> Keranjang
              </button>
              <button onClick={() => navigate('/akun')} className="w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center font-bold text-white hover:bg-white/30 transition-colors shadow-inner">
                {userInitial}
              </button>
            </nav>

            <button
              onClick={() => navigate('/keranjang')}
              className="md:hidden w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white active:scale-95 shadow-sm transition-transform"
            >
              <ShoppingCart size={18} strokeWidth={2} />
            </button>
          </div>

          <div className="md:max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-md rounded-full px-3 py-1.5 mb-4 shadow-sm">
              <Store size={14} strokeWidth={2.5} className="text-emerald-300" />
              <span className="text-[10px] md:text-xs font-bold text-emerald-50 tracking-wider uppercase">Direktori Penyelamat</span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight mb-4 drop-shadow-md">
              Jelajahi Mitra <br className="hidden md:block" />Penyelamat Bumi
            </h1>
            <p className="text-xs md:text-base text-emerald-50/90 font-medium leading-relaxed max-w-xl">
              Temukan berbagai restoran, kafe, hingga toko ritel yang menyediakan produk surplus dan barang imperfect berkualitas dengan harga miring.
            </p>
          </div>
        </div>
      </div>

      {/* ── SEARCH BAR floating ── */}
      <div className="w-full px-5 md:px-12 -mt-7 md:-mt-9 relative z-20">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-full flex items-center gap-3 pl-5 pr-2 py-2 md:py-3 shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-gray-100 focus-within:ring-4 focus-within:ring-emerald-500/20 transition-all">
            <Search size={22} className="text-gray-400 flex-shrink-0" strokeWidth={2} />
            <input
              className="flex-1 text-sm md:text-lg text-gray-800 outline-none bg-transparent placeholder:text-gray-400 font-medium py-2"
              placeholder="Cari nama mitra atau kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-1">
                <X size={18} className="text-gray-400" strokeWidth={2} />
              </button>
            )}
            <button className="bg-[#047857] hover:bg-[#064E3B] text-white px-6 md:px-8 py-2.5 md:py-3 rounded-full font-bold text-sm md:text-base transition-colors shadow-md active:scale-95 flex-shrink-0">
              Cari
            </button>
          </div>
        </div>
      </div>

      {/* ── FILTER KATEGORI (DRAGGABLE) & SORT BAR ── */}
      <div className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-xl border-b border-gray-200 mt-5 md:mt-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] select-none">
        <div className="max-w-7xl mx-auto px-5 md:px-12 py-3 md:py-4 flex flex-col md:flex-row items-center justify-between gap-4">

          {/* Mouse Drag-to-Scroll Container */}
          <div
            ref={scrollRef}
            onMouseDown={onMouseDown}
            onMouseLeave={onMouseLeave}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
            className={`flex gap-2.5 overflow-x-auto scrollbar-hide flex-1 pb-1 w-full flex-nowrap items-center ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
          >
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => !isDragging && setActiveFilter(f)}
                className={`flex-shrink-0 px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-bold transition-all duration-300 ${
                  activeFilter === f
                    ? 'bg-[#047857] text-white shadow-md ring-2 ring-emerald-500/30'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 shadow-sm pointer-events-auto'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

{/* Action Filters (Status Buka & Sortir) */}
<div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto flex-wrap flex-shrink-0">            {/* Filter Status Buka/Tutup */}
            <div className="flex bg-gray-100 p-1 rounded-full border border-gray-200 flex-shrink-0 pointer-events-auto">
              <button
                onClick={() => setStatusFilter('Semua')}
                className={`px-4 py-1.5 md:py-2 text-xs md:text-sm font-bold rounded-full transition-all ${statusFilter === 'Semua' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Semua
              </button>
              <button
                onClick={() => setStatusFilter('Buka')}
                className={`px-4 py-1.5 md:py-2 text-xs md:text-sm font-bold rounded-full transition-all flex items-center gap-1.5 ${statusFilter === 'Buka' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'Buka' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
                Buka Saja
              </button>
            </div>

            {/* Tombol Sortir */}
            <div className="relative flex-shrink-0 pointer-events-auto">
              <button
                onClick={() => setShowSort(!showSort)}
                className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-white border border-gray-200 rounded-full text-xs md:text-sm font-bold text-gray-800 hover:bg-gray-50 shadow-sm transition-colors active:scale-95"
              >
                <ArrowUpDown size={16} strokeWidth={2.5} />
                <span className="truncate max-w-[120px] md:max-w-none">{SORTS.find((s) => s.value === activeSort)?.label}</span>
              </button>

              {/* Dropdown Sortir */}
              {showSort && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSort(false)}></div>
                  <div className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.12)] overflow-hidden w-52 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-5 py-3.5 border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">
                      Urutkan Berdasarkan
                    </div>
                    <div className="flex flex-col p-2">
                      {SORTS.map((s) => (
                        <button
                          key={s.value}
                          onClick={() => { setActiveSort(s.value); setShowSort(false); }}
                          className={`w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-colors ${
                            activeSort === s.value
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto w-full px-5 md:px-12 mt-8 md:mt-10 flex-1">

        <div className="flex justify-between items-end mb-6 md:mb-8">
          <div>
            <h2 className="text-lg md:text-2xl font-black text-gray-900 tracking-tight">
              {activeFilter === 'Semua' ? 'Semua Mitra Tersedia' : `Mitra ${activeFilter}`}
              {search && <span className="text-gray-400 font-medium ml-2 text-sm md:text-base">— "{search}"</span>}
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium">
              Bantu selamatkan produk berkualitas mereka hari ini.
            </p>
          </div>
          {!loading && (
            <span className="hidden md:inline-block text-sm font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 shadow-sm">
              {sortedAll.length} Mitra Ditemukan
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6 lg:gap-8">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonStoreCard key={i} />)
          ) : sortedAll.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-24 text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-5 border border-gray-100">
                <Store size={36} strokeWidth={1.5} className="text-gray-300" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-700 mb-2">Mitra tidak ditemukan</h3>
              <p className="text-sm font-medium text-center max-w-sm px-4">
                {search ? `Tidak ada toko yang cocok dengan pencarian "${search}".` : statusFilter === 'Buka' ? 'Semua mitra di kategori ini telah tutup.' : 'Belum ada mitra di kategori ini.'}
              </p>
              {(search || statusFilter !== 'Semua') && (
                <button
                  onClick={() => { setSearch(''); setStatusFilter('Semua'); }}
                  className="mt-6 text-sm font-bold text-white bg-[#047857] hover:bg-[#064E3B] px-6 py-3 rounded-full transition-all active:scale-95 shadow-md"
                >
                  Reset Filter
                </button>
              )}
            </div>
          ) : (
            sortedAll.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                onClick={() => navigate(`/toko/${store.id}`)}
              />
            ))
          )}
        </div>

      </div>
    </div>
  );
}