import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User, ShoppingCart, Search, ArrowRight, Flame,
  Utensils, Coffee, ShoppingBag, Shirt, Package, LayoutGrid,
  MapPin, Clock, Store, ImageOff, Sparkles, AlertCircle, Timer, MoveRight, Recycle,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { ProductCard } from '../admin/components';
import RekomendasiAI from '../components/RekomendasiAI';

// Kategori Universal disinkronkan dengan ekosistem F&B dan Ritel
const KATEGORI = [
  { label: 'Restoran & F&B', icon: <Utensils size={32} strokeWidth={1.5} />, color: 'bg-red-50 text-red-600', ring: 'hover:ring-red-200' },
  { label: 'Supermarket & Ritel', icon: <ShoppingBag size={32} strokeWidth={1.5} />, color: 'bg-blue-50 text-blue-600', ring: 'hover:ring-blue-200' },
  { label: 'Bakery & Kafe', icon: <Coffee size={32} strokeWidth={1.5} />, color: 'bg-orange-50 text-orange-600', ring: 'hover:ring-orange-200' },
  { label: 'Fashion & Lifestyle', icon: <Shirt size={32} strokeWidth={1.5} />, color: 'bg-pink-50 text-pink-600', ring: 'hover:ring-pink-200' },
  { label: 'Grosir Pangan', icon: <Package size={32} strokeWidth={1.5} />, color: 'bg-green-50 text-green-600', ring: 'hover:ring-green-200' },
  { label: 'Lainnya', icon: <LayoutGrid size={32} strokeWidth={1.5} />, color: 'bg-gray-50 text-gray-600', ring: 'hover:ring-gray-200' },
];

// Data Banner Promo
const PROMOS = [
  {
    id: 1,
    tag: 'Penawaran Spesial',
    title: 'Diskon Hingga 70%',
    desc: 'Pesan dari restoran dan swalayan lokal untuk menikmati produk berkualitas dengan harga yang jauh lebih terjangkau.',
    btnText: 'Pesan Sekarang',
    bgImg: 'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 2,
    tag: 'Cuci Gudang Ritel',
    title: 'Selamatkan Fashion',
    desc: 'Dapatkan koleksi pakaian imperfect (cacat minor) dari brand ternama sebelum berujung menjadi limbah tekstil.',
    btnText: 'Eksplor Ritel',
    bgImg: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 3,
    tag: 'Grosir Pangan',
    title: 'Bahan Baku Segar',
    desc: 'Bantu habiskan stok sayur & buah segar hari ini langsung dari pasar tradisional dan supermarket di sekitarmu.',
    btnText: 'Belanja Cerdas',
    bgImg: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1974&auto=format&fit=crop'
  }
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Fungsi Helper Pengecekan Status Buka/Tutup Real-Time (Support Cross-Midnight) ──
const checkIsOpenRealtime = (store) => {
  if (!store.is_active) return false;
  if (!store.waktu_tutup) return true;

  const now = new Date();
  const currentStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const openTime = store.waktu_buka ? store.waktu_buka.substring(0, 5) : '00:00';
  const closeTime = store.waktu_tutup.substring(0, 5);

  if (openTime <= closeTime) {
    return currentStr >= openTime && currentStr < closeTime;
  } else {
    return currentStr >= openTime || currentStr < closeTime;
  }
};

export default function Beranda() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const [rawStores, setRawStores] = useState([]);
  const [rawProducts, setRawProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 💡 UPGRADE 1: Engine Waktu Real-time (Detak setiap 1 menit)
  const [timeTick, setTimeTick] = useState(0);

  // ── State & Refs untuk Carousel Banner Promo ──
  const [currentPromo, setCurrentPromo] = useState(0);
  const dragStartX = useRef(0);
  const isDraggingPromo = useRef(false);

  // ── Refs & States untuk Drag-to-Scroll Kategori ──
  const catScrollRef = useRef(null);
  const [isDraggingCat, setIsDraggingCat] = useState(false);
  const [startCatX, setStartCatX] = useState(0);
  const [scrollCatLeft, setScrollCatLeft] = useState(0);

  // Auto-play Carousel Banner Promo & Real-time Tick
  useEffect(() => {
    const bannerTimer = setInterval(() => {
      setCurrentPromo((prev) => (prev === PROMOS.length - 1 ? 0 : prev + 1));
    }, 5000);

    // Detak jantung aplikasi agar status toko update otomatis tanpa refresh
    const tickTimer = setInterval(() => {
      setTimeTick(prev => prev + 1);
    }, 60000);

    return () => {
      clearInterval(bannerTimer);
      clearInterval(tickTimer);
    };
  }, []);

  // Handler Drag-to-Scroll Kategori
  const handleCatMouseDown = (e) => {
    setIsDraggingCat(true);
    setStartCatX(e.pageX - catScrollRef.current.offsetLeft);
    setScrollCatLeft(catScrollRef.current.scrollLeft);
  };
  const handleCatMouseLeaveOrUp = () => setIsDraggingCat(false);
  const handleCatMouseMove = (e) => {
    if (!isDraggingCat) return;
    e.preventDefault();
    const x = e.pageX - catScrollRef.current.offsetLeft;
    const walk = (x - startCatX) * 2;
    catScrollRef.current.scrollLeft = scrollCatLeft - walk;
  };

  // Handler Drag/Swipe Gesture untuk Banner Promo
  const handlePromoDragStart = (clientX) => {
    dragStartX.current = clientX;
    isDraggingPromo.current = true;
  };
  const handlePromoDragEnd = (clientX) => {
    if (!isDraggingPromo.current) return;
    const dragDistance = dragStartX.current - clientX;
    const threshold = 50;

    if (dragDistance > threshold) {
      setCurrentPromo((prev) => (prev === PROMOS.length - 1 ? 0 : prev + 1));
    } else if (dragDistance < -threshold) {
      setCurrentPromo((prev) => (prev === 0 ? PROMOS.length - 1 : prev - 1));
    }
    isDraggingPromo.current = false;
  };

  const safeUserName = user?.name || user?.nama || 'Pengguna';
  const userInitial = safeUserName.charAt(0).toUpperCase();
  const userFirstName = safeUserName.split(' ')[0];

  const currentHour = new Date().getHours();
  let greeting = 'Selamat Pagi';
  if (currentHour >= 11 && currentHour < 15) greeting = 'Selamat Siang';
  else if (currentHour >= 15 && currentHour < 18) greeting = 'Selamat Sore';
  else if (currentHour >= 18) greeting = 'Selamat Malam';

  useEffect(() => {
    const fetchBerandaData = async () => {
      try {
        const [resStores, resProducts] = await Promise.all([
          fetch(`${API_URL}/stores`),
          fetch(`${API_URL}/products`)
        ]);

        const dataStores = await resStores.json();
        const dataProducts = await resProducts.json();

        if (dataStores.status === 'success') setRawStores(dataStores.data);
        if (dataProducts.status === 'success') setRawProducts(dataProducts.data);

      } catch (error) {
        console.error("Gagal menarik data untuk beranda:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBerandaData();
  }, []);

  // 💡 UPGRADE 2: Menggunakan useMemo agar perhitungan open/close selalu segar saat timeTick berubah
  const { mitraPilihan, flashRescue } = useMemo(() => {
    if (rawStores.length === 0 || rawProducts.length === 0) {
      return { mitraPilihan: [], flashRescue: [] };
    }

    // 1. Kalkulasi Status Toko Real-Time
    const storeStatusMap = {};
    const processedStores = rawStores.map(store => {
      const isOpen = checkIsOpenRealtime(store);
      storeStatusMap[store.id] = isOpen; // Simpan status untuk dipakai oleh filter produk

      return {
        ...store,
        distance: (Math.random() * 5 + 0.5).toFixed(1),
        isOpenNow: isOpen
      };
    });

    const sortedStores = [
      ...processedStores.filter(s => s.isOpenNow),
      ...processedStores.filter(s => !s.isOpenNow)
    ];

    // 2. Format & Filter Produk
    const formattedProducts = rawProducts.map((item) => ({
      id: item.id,
      store_id: item.store_id,
      category: item.kategori || 'Lainnya',
      name: item.nama_produk || item.name || 'Produk',
      price: Number(item.harga || item.price || 0),
      originalPrice: item.harga_asli || null,
      discount: item.diskon,
      type: item.kondisi || 'leftover',
      batas_konsumsi: item.batas_konsumsi || item.waktu_tutup || '22:00',
      stok: item.stok || 0,
      stok_awal: item.stok_awal || null,
      gambar_produk: item.gambar_produk
    }));

    // 💡 KUNCI UX: Hanya tampilkan produk di Penawaran Terakhir jika Tokonya sedang BUKA
    const sortedFlash = formattedProducts
      .filter(p => p.stok > 0 && storeStatusMap[p.store_id] === true)
      .sort((a, b) => a.stok - b.stok) // Urutkan dari stok yang paling sedikit
      .slice(0, 4);

    return {
      mitraPilihan: sortedStores.slice(0, 4),
      flashRescue: sortedFlash
    };
  }, [rawStores, rawProducts, timeTick]); // Evaluasi ulang jika data masuk, atau timer berdetak!

  const handleSearch = () => {
    if (search.trim()) navigate('/katalog', { state: { searchQuery: search } });
    else navigate('/katalog');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 pb-20 md:pb-12 w-full custom-scrollbar font-sans select-none">
      {/* 🚀 PREMIUM HERO SECTION */}
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
          {/* Topbar */}
          <div className="flex justify-between items-center mb-10 md:mb-16">
            <div className="flex items-center gap-3 md:gap-3 hover:opacity-90 cursor-pointer transition-opacity" onClick={() => navigate('/akun')}>
              <div className="w-10 h-10 md:w-10 md:h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center font-black border border-white/30 shadow-inner text-base md:text-lg">
                {user ? userInitial : <User size={18} strokeWidth={2.5} />}
              </div>
              <div>
                <p className="text-[10px] md:text-[11px] text-emerald-100 font-bold tracking-widest uppercase mb-0.5">{greeting},</p>
                <p className="text-sm md:text-sm font-black tracking-tight">{userFirstName}</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
              <button className="text-white border-b-2 border-emerald-400 pb-1">Beranda</button>
              <button onClick={() => navigate('/katalog')} className="text-emerald-100 hover:text-white transition-colors">Eksplor Mitra</button>
              <button onClick={() => navigate('/pesanan')} className="text-emerald-100 hover:text-white transition-colors">Tiket Reservasi</button>
              <button onClick={() => navigate('/keranjang')} className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white px-5 py-2.5 rounded-full flex items-center gap-2 transition-all active:scale-95 shadow-sm">
                <ShoppingCart size={16} strokeWidth={2.5} /> Keranjang
              </button>
            </nav>

            <button onClick={() => navigate('/keranjang')} className="md:hidden relative w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-sm active:scale-95 transition-transform">
              <ShoppingCart size={18} strokeWidth={2.5} />
            </button>
          </div>

          <div className="md:max-w-2xl text-left">
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-md rounded-full px-3 py-1.5 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-4 shadow-sm text-emerald-50">
              <Recycle size={14} className="text-emerald-300" /> Revolusi Anti-Mubazir
            </span>
            <h1 className="text-3xl md:text-5xl font-black leading-tight md:leading-tight tracking-tight mb-4 drop-shadow-md">
              Belanja Cerdas, Hemat, <br className="hidden md:block"/> Selamatkan Bumi.
            </h1>
            <p className="text-xs md:text-base text-emerald-50/90 max-w-lg mb-2 font-medium leading-relaxed">
              Dapatkan produk surplus F&B dan barang ritel imperfect berkualitas dengan harga miring sebelum hari berganti.
            </p>
          </div>
        </div>
      </div>

      {/* 🔍 FLOATING SEARCH BAR & MARQUEE */}
      <div className="w-full px-5 md:px-12 -mt-6 md:-mt-7 relative z-20">
        <div className="max-w-3xl mx-auto bg-white rounded-full flex items-center px-4 md:px-4 py-2 md:py-2.5 gap-3 shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-gray-100 focus-within:ring-4 focus-within:ring-emerald-500/20">
          <Search className="text-gray-400 ml-2 flex-shrink-0" size={20} strokeWidth={2.5} />
          <input
            className="flex-1 text-sm md:text-base text-gray-800 outline-none bg-transparent placeholder:text-gray-400 font-medium w-full px-1"
            placeholder="Cari makanan, pakaian, atau barang ritel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} className="bg-[#047857] hover:bg-[#064E3B] text-white px-5 md:px-8 py-2 md:py-3 rounded-full font-bold text-sm transition-colors shadow-md active:scale-95 flex-shrink-0">
            Cari
          </button>
        </div>

        <style>{`
          @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
          .animate-marquee { display: inline-block; white-space: nowrap; animation: marquee 20s linear infinite; }
        `}</style>

        <div className="max-w-lg mx-auto mt-4 bg-emerald-100/50 backdrop-blur-sm border border-emerald-200 rounded-full py-1.5 px-4 flex items-center justify-center gap-2 text-[10px] md:text-xs font-medium text-emerald-800 shadow-sm overflow-hidden">
           <Flame size={14} className="text-orange-500 flex-shrink-0 z-10 bg-emerald-50 rounded-full" strokeWidth={2.5} />
           <div className="overflow-hidden w-full relative">
             <span className="animate-marquee inline-block">
                Tersedia 15 item makanan & 8 barang ritel di sekitarmu! • Lebih dari 120 kg emisi CO2 ditekan minggu ini. • Mitra swalayan baru bergabung, cek sekarang!
             </span>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-12 mt-10 md:mt-12 space-y-12 md:space-y-16">

        {/* ── KATEGORI UNIVERSAL (DRAGGABLE BY MOUSE) ── */}
        <section>
          <h2 className="text-base md:text-xl font-bold text-gray-900 mb-4 md:mb-6 px-1 tracking-tight">Jelajahi Kategori</h2>
          <div
            ref={catScrollRef}
            onMouseDown={handleCatMouseDown}
            onMouseLeave={handleCatMouseLeaveOrUp}
            onMouseUp={handleCatMouseLeaveOrUp}
            onMouseMove={handleCatMouseMove}
            className={`flex gap-4 md:gap-8 overflow-x-auto pb-4 scrollbar-hide snap-x px-1 md:flex-wrap md:justify-center ${isDraggingCat ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{ scrollBehavior: isDraggingCat ? 'auto' : 'smooth' }}
          >
            {KATEGORI.map((k) => (
              <button key={k.label} onClick={() => !isDraggingCat && navigate('/katalog')} className="flex flex-col items-center gap-3 min-w-[76px] md:min-w-[120px] snap-center group outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 rounded-2xl p-1 pointer-events-auto">
                <div className={`w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-[2rem] ${k.color} flex items-center justify-center transition-all duration-300 group-hover:-translate-y-2 group-active:scale-95 shadow-sm md:shadow-md border border-white/60 ring-2 ring-transparent ${k.ring}`}>
                  {k.icon}
                </div>
                <span className="text-[11px] md:text-base font-bold text-gray-600 whitespace-nowrap group-hover:text-gray-900 transition-colors">
                  {k.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ── PROMO BANNER CAROUSEL ── */}
        <section className="-mx-5 md:mx-0 relative overflow-hidden group">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${currentPromo * 100}%)` }}
            onTouchStart={(e) => handlePromoDragStart(e.touches[0].clientX)}
            onTouchEnd={(e) => handlePromoDragEnd(e.changedTouches[0].clientX)}
            onMouseDown={(e) => handlePromoDragStart(e.clientX)}
            onMouseUp={(e) => handlePromoDragEnd(e.clientX)}
          >
            {PROMOS.map((promo) => (
              <div key={promo.id} className="w-full flex-shrink-0 px-5 md:px-0 cursor-pointer" onClick={() => navigate('/katalog')}>
                <div
                  className="rounded-[2rem] p-6 md:p-12 flex flex-col justify-center items-start text-white shadow-xl relative overflow-hidden bg-cover bg-center h-full min-h-[260px] md:min-h-[320px]"
                  style={{ backgroundImage: `url('${promo.bgImg}')` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/70 to-transparent group-hover:scale-105 transition-transform duration-700"></div>

                  <div className="relative z-10 w-full">
                    <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 px-3 py-1.5 rounded-lg text-[10px] md:text-sm font-bold tracking-widest uppercase mb-3 backdrop-blur-md border border-emerald-400/30 text-emerald-300">
                      <AlertCircle size={14} strokeWidth={2.5} /> {promo.tag}
                    </div>
                    <div className="text-3xl md:text-5xl font-black leading-none mb-3 tracking-tight text-white drop-shadow-lg">
                      {promo.title}
                    </div>
                    <div className="text-sm md:text-lg font-medium text-gray-200 max-w-[250px] md:max-w-md leading-snug mb-6">
                      {promo.desc}
                    </div>
                    <button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs md:text-sm font-bold px-6 md:px-8 py-3.5 md:py-4 rounded-xl active:scale-95 transition-all shadow-[0_10px_30px_rgba(4,120,87,0.3)] flex items-center justify-center gap-2">
                      {promo.btnText} <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
            {PROMOS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPromo(idx)}
                className={`transition-all duration-300 rounded-full ${idx === currentPromo ? 'w-6 h-2 bg-emerald-500' : 'w-2 h-2 bg-white/50 hover:bg-white/80'}`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentPromo((prev) => (prev === 0 ? PROMOS.length - 1 : prev - 1))}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/30 backdrop-blur-md rounded-full items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all z-20 border border-white/20"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={() => setCurrentPromo((prev) => (prev === PROMOS.length - 1 ? 0 : prev + 1))}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/30 backdrop-blur-md rounded-full items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all z-20 border border-white/20"
          >
            <ChevronRight size={24} />
          </button>
        </section>

        {/* ── SISA HARI INI (PRODUK TERBATAS) ── */}
        <section>
          <div className="flex justify-between items-end mb-5 md:mb-8 px-1">
            <div>
              <div className="flex items-center gap-2 mb-1 md:mb-2">
                <h2 className="text-lg md:text-3xl font-black text-gray-900 tracking-tight">Penawaran Terakhir</h2>
                <span className="bg-red-50 text-red-600 text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-md animate-[pulse_2s_infinite] border border-red-200 tracking-wider flex items-center gap-1">
                  <Timer size={10} strokeWidth={2.5} /> TERBATAS
                </span>
              </div>
              <p className="text-xs md:text-base text-gray-500 font-medium">Dapatkan produk sisa etalase ini sebelum kehabisan.</p>
            </div>
            <button onClick={() => navigate('/katalog')} className="text-xs md:text-sm text-[#047857] font-bold flex items-center gap-1 hover:bg-emerald-50 px-4 py-2 rounded-full transition-colors active:scale-95">
              Lihat Etalase <MoveRight size={16} strokeWidth={2.5} />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {loading ? (
               Array(4).fill(0).map((_, i) => (
                 <div key={i} className="bg-white border border-gray-100 rounded-3xl p-4 h-64 md:h-80 animate-pulse flex flex-col">
                   <div className="w-full h-32 md:h-40 bg-gray-200 rounded-2xl mb-4"></div>
                   <div className="w-3/4 h-4 bg-gray-200 rounded-full mb-2"></div>
                   <div className="w-1/2 h-5 bg-gray-200 rounded-full mb-auto"></div>
                   <div className="w-full h-10 bg-gray-200 rounded-xl mt-4"></div>
                 </div>
               ))
            ) : flashRescue.length === 0 ? (
               <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-[2rem] border border-gray-100 shadow-sm text-center px-4">
                 <Store size={48} strokeWidth={1.5} className="text-gray-300 mb-4" />
                 <h3 className="text-lg font-black text-gray-800 mb-1">Semua Terjual!</h3>
                 <p className="text-sm text-gray-500 max-w-sm">Semua penawaran hari ini telah habis dipesan atau mitra sudah tutup.</p>
               </div>
            ) : (
              flashRescue.map((p) => <ProductCard key={p.id} product={p} />)
            )}
          </div>
        </section>

        {/* ── REKOMENDASI AI SECTION ── */}
        <section className="bg-gradient-to-br from-gray-50 to-white md:bg-white rounded-[2rem] md:rounded-[3rem] md:shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-gray-100 p-5 md:p-10 lg:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10">
            <RekomendasiAI
              userId={user?.id}
              title={`Rekomendasi Untuk ${userFirstName}`}
              icon={<Sparkles size={24} className="text-emerald-500" strokeWidth={2.5} />}
            />
          </div>
        </section>

        {/* ── MITRA PILIHAN TERDEKAT ── */}
        <section className="pb-10">
          <div className="flex justify-between items-end mb-5 md:mb-8 px-1">
            <div>
              <h2 className="text-lg md:text-3xl font-black text-gray-900 tracking-tight mb-1 md:mb-2">Mitra Pilihan</h2>
              <p className="text-xs md:text-base text-gray-500 font-medium">Temukan toko, restoran, dan swalayan terbaik di sekitarmu.</p>
            </div>
            <button onClick={() => navigate('/katalog')} className="text-xs md:text-sm text-[#047857] font-bold hover:bg-emerald-50 px-4 py-2 rounded-full transition-colors active:scale-95 flex items-center gap-1">
              Lihat Semua <MoveRight size={16} strokeWidth={2.5}/>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
            {loading ? (
               Array(4).fill(0).map((_, i) => (
                 <div key={i} className="bg-white border border-gray-100 rounded-3xl p-4 flex items-center gap-4 animate-pulse">
                   <div className="w-20 h-20 bg-gray-200 rounded-2xl"></div>
                   <div className="flex-1 space-y-3">
                     <div className="h-4 bg-gray-200 rounded-full w-3/4"></div>
                     <div className="h-3 bg-gray-200 rounded-full w-1/2"></div>
                   </div>
                 </div>
               ))
            ) : mitraPilihan.length === 0 ? (
               <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                 <Store size={40} strokeWidth={1.5} className="mb-3 text-gray-300" />
                 <div className="text-sm font-bold text-gray-600">Belum ada mitra yang buka saat ini.</div>
               </div>
            ) : (
              mitraPilihan.map((toko) => {
                const isRetail = toko.kategori?.includes('Ritel') || toko.kategori?.includes('Fashion');
                return (
                  <div
                    key={toko.id}
                    onClick={() => navigate(`/toko/${toko.id}`)}
                    className={`bg-white border rounded-3xl p-4 flex items-center gap-4 cursor-pointer transition-all duration-300 active:scale-[0.98] group relative overflow-hidden ${
                      toko.isOpenNow
                        ? 'border-gray-100 hover:shadow-[0_10px_40px_rgba(0,0,0,0.06)] hover:border-emerald-200'
                        : 'border-gray-200 bg-gray-50/50 opacity-75 grayscale-[0.2]'
                    }`}
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-100 relative p-1.5 md:p-2">
                      {toko.gambar_toko ? (
                        <img src={toko.gambar_toko} alt={toko.nama_toko} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                      ) : null}
                      <div className="absolute inset-0 flex-col items-center justify-center gap-1 bg-gray-50 text-gray-300" style={{ display: toko.gambar_toko ? 'none' : 'flex' }}>
                        {isRetail ? <Package size={20} /> : <Store size={20} />}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className={`font-black text-sm md:text-base truncate mb-1 transition-colors ${toko.isOpenNow ? 'text-gray-900 group-hover:text-emerald-700' : 'text-gray-500'}`}>{toko.nama_toko}</h3>
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200 font-bold text-[9px] uppercase tracking-wider">{toko.kategori || 'Mitra'}</span>
                        <span className="text-[10px] md:text-xs font-bold text-gray-400 flex items-center gap-0.5">
                            <MapPin size={12} strokeWidth={2.5} className="text-emerald-500" /> {toko.distance} km
                        </span>
                      </div>

                      <div className={`text-[9px] font-black px-2 py-0.5 rounded border flex items-center gap-1 w-fit uppercase tracking-wider ${
                        toko.isOpenNow
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${toko.isOpenNow ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                        {toko.isOpenNow ? 'Buka' : 'Tutup'} • {toko.waktu_tutup ? toko.waktu_tutup.substring(0, 5) : '22:00'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

      </div>
    </div>
  );
}