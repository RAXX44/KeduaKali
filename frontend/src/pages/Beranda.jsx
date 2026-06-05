import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  User, ShoppingCart, Search, ArrowRight, Flame,
  Utensils, Coffee, ShoppingBag, Shirt, Package, LayoutGrid,
  MapPin, Store, Sparkles, AlertCircle, Timer, MoveRight, Recycle,
  ChevronLeft, ChevronRight,
  Croissant, ChefHat, Lock
} from 'lucide-react';
import { ProductCard } from '../admin/components';
import RekomendasiAI from '../components/RekomendasiAI';
import logoKeduaKali from '../public/logo2.png';

const KATEGORI = [
  { label: 'Restoran', icon: <Utensils size={26} strokeWidth={1.5} />, color: 'bg-red-50 text-red-600', ring: 'hover:ring-red-200', comingSoon: false },
  { label: 'Bakery & Roti', icon: <Croissant size={26} strokeWidth={1.5} />, color: 'bg-amber-50 text-amber-600', ring: 'hover:ring-amber-200', comingSoon: false },
  { label: 'Kafe', icon: <Coffee size={26} strokeWidth={1.5} />, color: 'bg-orange-50 text-orange-600', ring: 'hover:ring-orange-200', comingSoon: false },
  { label: 'Katering', icon: <ChefHat size={26} strokeWidth={1.5} />, color: 'bg-purple-50 text-purple-600', ring: 'hover:ring-purple-200', comingSoon: false },
  { label: 'Supermarket', icon: <ShoppingBag size={26} strokeWidth={1.5} />, color: 'bg-blue-50 text-blue-300', ring: '', comingSoon: true },
  { label: 'Fashion', icon: <Shirt size={26} strokeWidth={1.5} />, color: 'bg-pink-50 text-pink-300', ring: '', comingSoon: true },
  { label: 'Grosir', icon: <Package size={26} strokeWidth={1.5} />, color: 'bg-green-50 text-green-300', ring: '', comingSoon: true },
  { label: 'Lainnya', icon: <LayoutGrid size={26} strokeWidth={1.5} />, color: 'bg-gray-50 text-gray-600', ring: 'hover:ring-gray-200', comingSoon: false },
];

const PROMOS = [
  {
    id: 1,
    tag: '🌱 Rescued Food',
    title: 'Selamatkan Pangan Hari Ini',
    desc: 'Pesan makanan berkualitas dari restoran & kafe lokal sebelum hari berganti. Rasa autentik, harga bersahabat, bumi pun berterima kasih.',
    btnText: 'Pesan Sekarang',
    bgImg: 'https://media.istockphoto.com/id/1320987168/photo/reusable-shopping-bag-with-recycled-arrows-sign-and-vegetables-on-table.jpg?s=612x612&w=0&k=20&c=nRXDJWHMZZ0Hj8Yg4sIpWNMRINA4G7PWjtEdlg8ctGU=',
    comingSoon: false,
  },
  {
    id: 2,
    tag: '🛍️ Segera Hadir',
    title: 'Fashion & Gaya Hidup',
    desc: 'Kami sedang menyiapkan sesuatu yang istimewa. Produk fashion pilihan akan segera tersedia di KeduaKali — nantikan peluncurannya!',
    btnText: 'Segera Hadir',
    bgImg: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070&auto=format&fit=crop',
    comingSoon: true,
  },
  {
    id: 3,
    tag: '🌾 Segera Hadir',
    title: 'Bahan Baku & Grosir Pangan',
    desc: 'Sayur, buah, dan bahan segar dari sumber terpercaya akan segera hadir. Pantau terus KeduaKali untuk update terbaru!',
    btnText: 'Segera Hadir',
    bgImg: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1974&auto=format&fit=crop',
    comingSoon: true,
  },
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const checkIsOpenRealtime = (store) => {
  if (!store.is_active) return false;
  if (!store.waktu_tutup) return true;
  const now = new Date();
  const currentStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const openTime = store.waktu_buka ? store.waktu_buka.substring(0, 5) : '00:00';
  const closeTime = store.waktu_tutup.substring(0, 5);
  if (openTime <= closeTime) return currentStr >= openTime && currentStr < closeTime;
  return currentStr >= openTime || currentStr < closeTime;
};

export default function Beranda() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { count: cartCount } = useCart();
  const [search, setSearch] = useState('');
  const [rawStores, setRawStores] = useState([]);
  const [rawProducts, setRawProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeTick, setTimeTick] = useState(0);
  const [currentPromo, setCurrentPromo] = useState(0);
  

  const dragStartX = useRef(0);
  const isDraggingPromo = useRef(false);
  const catScrollRef = useRef(null);
  const [isDraggingCat, setIsDraggingCat] = useState(false);
  const [startCatX, setStartCatX] = useState(0);
  const [scrollCatLeft, setScrollCatLeft] = useState(0);

  useEffect(() => {
    const bannerTimer = setInterval(() => {
      setCurrentPromo((prev) => (prev === PROMOS.length - 1 ? 0 : prev + 1));
    }, 5000);
    const tickTimer = setInterval(() => setTimeTick(prev => prev + 1), 60000);
    return () => { clearInterval(bannerTimer); clearInterval(tickTimer); };
  }, []);

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
    catScrollRef.current.scrollLeft = scrollCatLeft - (x - startCatX) * 2;
  };

  const handlePromoDragStart = (clientX) => { dragStartX.current = clientX; isDraggingPromo.current = true; };
  const handlePromoDragEnd = (clientX) => {
    if (!isDraggingPromo.current) return;
    const d = dragStartX.current - clientX;
    if (d > 50) setCurrentPromo(p => p === PROMOS.length - 1 ? 0 : p + 1);
    else if (d < -50) setCurrentPromo(p => p === 0 ? PROMOS.length - 1 : p - 1);
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
        console.error('Gagal menarik data beranda:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBerandaData();
  }, []);

  const { mitraPilihan, flashRescue } = useMemo(() => {
    if (rawStores.length === 0 || rawProducts.length === 0) return { mitraPilihan: [], flashRescue: [] };

    const storeStatusMap = {};
    const processedStores = rawStores.map(store => {
      const isOpen = checkIsOpenRealtime(store);
      storeStatusMap[store.id] = isOpen;
      return { ...store, distance: (Math.random() * 5 + 0.5).toFixed(1), isOpenNow: isOpen };
    });
    const sortedStores = [
      ...processedStores.filter(s => s.isOpenNow),
      ...processedStores.filter(s => !s.isOpenNow)
    ];

    const formattedProducts = rawProducts.map((item) => {
      const stok = item.stok || 0;
      return {
        id: item.id,
        store_id: item.store_id,
        category: item.kategori || 'Lainnya',
        name: item.nama_produk || item.name || 'Produk',
        price: Number(item.harga || item.price || 0),
        originalPrice: item.harga_asli || null,
        discount: item.diskon,
        type: item.kondisi || 'leftover',
        batas_konsumsi: item.batas_konsumsi || item.waktu_tutup || '22:00',
        stok,
        stok_awal: item.stok_awal || null,
        gambar_produk: item.gambar_produk
      };
    });

    const sortedFlash = formattedProducts
      .filter(p => p.stok > 0 && storeStatusMap[p.store_id] === true)
      .sort((a, b) => a.stok - b.stok)
      .slice(0, 4);

    return { mitraPilihan: sortedStores.slice(0, 4), flashRescue: sortedFlash };
  }, [rawStores, rawProducts, timeTick]);

  const handleSearch = () => {
    if (search.trim()) navigate('/katalog', { state: { searchQuery: search } });
    else navigate('/katalog');
  };

  return (
    <div className="beranda-scroll-container flex-1 overflow-y-auto bg-gray-50 pb-20 md:pb-12 w-full font-sans select-none">

      {/* ── HERO SECTION ── */}
      <div className="relative w-full pt-4 md:pt-6 pb-20 md:pb-28 shadow-lg overflow-hidden bg-[#047857]">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047&auto=format&fit=crop"
            alt="Background"
            className="w-full h-full object-cover opacity-20 mix-blend-overlay pointer-events-none"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#064E3B] via-[#047857]/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#047857] via-transparent to-transparent md:hidden" />

        {/* ── DESKTOP NAVBAR (Dimasukkan kembali ke dalam Hero agar menyatu dengan latar belakang hijau) ── */}
        <div className="hidden md:block max-w-7xl mx-auto px-12 py-4 relative z-20">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => navigate('/')}
            >
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden group-hover:scale-105 transition-transform">
                <img src={logoKeduaKali} alt="Logo" className="w-full h-full object-contain p-0.5" />
              </div>
              <span className="text-xl font-black text-white tracking-wide">KeduaKali</span>
            </div>

            {/* Nav Menu Links */}
            <nav className="flex items-center gap-8 text-sm font-semibold">
              <button className="text-white border-b-2 border-emerald-400 pb-1">Beranda</button>
              <button onClick={() => navigate('/katalog')} className="text-emerald-100 hover:text-white transition-colors">Katalog Mitra</button>
              <button onClick={() => navigate('/pesanan')} className="text-emerald-100 hover:text-white transition-colors">Pesanan Saya</button>
              
              {/* Tombol Keranjang */}
              <button
                onClick={() => navigate('/keranjang')}
                className="relative flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white px-5 py-2.5 rounded-full transition-all active:scale-95 shadow-sm"
              >
                <ShoppingCart size={18} strokeWidth={2.5} /> Keranjang
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#047857] shadow-sm">
                    {cartCount}
                  </span>
                )}
              </button>
              
              {/* Inisial User */}
              <button
                onClick={() => navigate('/akun')}
                className="w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center font-bold text-white hover:bg-white/30 transition-colors shadow-inner"
              >
                {userInitial}
              </button>
            </nav>
          </div>
        </div>

        {/* ── ISI HERO CONTENT ── */}
        <div className="max-w-7xl mx-auto px-5 md:px-12 relative z-10 text-white mt-6 md:mt-10">
          {/* Mobile topbar */}
          <div className="flex items-center mb-10 md:hidden">
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => navigate('/akun')}>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center font-black border border-white/30 shadow-inner text-base">
                {user ? userInitial : <User size={18} strokeWidth={2.5} />}
              </div>
              <div>
                <p className="text-[10px] text-emerald-100 font-bold tracking-widest uppercase mb-0.5">{greeting},</p>
                <p className="text-sm font-black tracking-tight">{userFirstName}</p>
              </div>
            </div>
          </div>

          <div className="md:max-w-2xl text-left">
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-md rounded-full px-3 py-1.5 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-4 shadow-sm text-emerald-50">
              <Recycle size={14} className="text-emerald-300" /> Gerakan Anti-Mubazir
            </span>
            <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight mb-4 drop-shadow-md">
              Belanja Cerdas, Hemat, <br className="hidden md:block" /> Selamatkan Bumi.
            </h1>
            <p className="text-xs md:text-base text-emerald-50/90 max-w-lg mb-2 font-medium leading-relaxed">
              Selamatkan makanan berkualitas dari restoran & kafe favoritmu — harga miring, sebelum hari berganti.
            </p>
          </div>
        </div>
      </div>

      {/* ── FLOATING SEARCH BAR UTAMA ── */}
      <div className="w-full px-5 md:px-12 -mt-6 md:-mt-7 relative z-20">
        <div className="max-w-3xl mx-auto bg-white rounded-full flex items-center px-4 py-2 md:py-2.5 gap-3 shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-gray-100 focus-within:ring-4 focus-within:ring-emerald-500/20">
          <Search className="text-gray-400 ml-2 flex-shrink-0" size={20} strokeWidth={2.5} />
          <input
            className="flex-1 text-sm md:text-base text-gray-800 outline-none bg-transparent placeholder:text-gray-400 font-medium w-full px-1"
            placeholder="Cari makanan atau nama restoran..."
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
          .animate-marquee { display: inline-block; white-space: nowrap; animation: marquee 22s linear infinite; }
        `}</style>

        <div className="max-w-lg mx-auto mt-4 bg-emerald-100/50 backdrop-blur-sm border border-emerald-200 rounded-full py-1.5 px-4 flex items-center gap-2 text-[10px] md:text-xs font-medium text-emerald-800 shadow-sm overflow-hidden">
          <Flame size={14} className="text-orange-500 flex-shrink-0 z-10" strokeWidth={2.5} />
          <div className="overflow-hidden w-full relative">
            <span className="animate-marquee inline-block">
              Makanan segar hari ini siap diselamatkan dari mitra pilihan! &nbsp;•&nbsp; Bersama kita kurangi lebih banyak makanan dari terbuang sia-sia. &nbsp;•&nbsp; Mitra kafe & restoran baru telah bergabung — cek sekarang!
            </span>
          </div>
        </div>
      </div>

      {/* ── KONTEN UTAMA ── */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-12 mt-10 md:mt-12 space-y-12 md:space-y-16">

        {/* KATEGORI */}
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
              <button
                key={k.label}
                onClick={() => !isDraggingCat && !k.comingSoon && navigate('/katalog')}
                className={`flex flex-col items-center gap-3 min-w-[76px] md:min-w-[120px] snap-center group outline-none rounded-2xl p-1 pointer-events-auto relative ${k.comingSoon ? 'cursor-not-allowed opacity-55' : 'cursor-pointer'}`}
              >
                <div className={`w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-[2rem] ${k.color} flex items-center justify-center transition-all duration-300 shadow-sm md:shadow-md border border-white/60 ring-2 ring-transparent relative ${!k.comingSoon ? `group-hover:-translate-y-2 group-active:scale-95 ${k.ring}` : ''}`}>
                  {k.icon}
                  {k.comingSoon && (
                    <div className="absolute inset-0 rounded-2xl md:rounded-[2rem] bg-white/70 backdrop-blur-[1px] flex flex-col items-center justify-center gap-0.5">
                      <Lock size={12} className="text-gray-400" strokeWidth={2.5} />
                      <span className="text-[7px] font-black text-gray-400 uppercase tracking-wider text-center leading-tight">Segera<br />Hadir</span>
                    </div>
                  )}
                </div>
                <span className={`text-[11px] md:text-base font-bold whitespace-nowrap transition-colors ${k.comingSoon ? 'text-gray-400' : 'text-gray-600 group-hover:text-gray-900'}`}>
                  {k.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* PROMO CAROUSEL */}
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
              <div
                key={promo.id}
                className={`w-full flex-shrink-0 px-5 md:px-0 ${!promo.comingSoon ? 'cursor-pointer' : 'cursor-default'}`}
                onClick={() => !promo.comingSoon && navigate('/katalog')}
              >
                <div
                  className="rounded-[2rem] p-6 md:p-12 flex flex-col justify-center items-start text-white shadow-xl relative overflow-hidden bg-cover bg-center h-full min-h-[260px] md:min-h-[320px]"
                  style={{ backgroundImage: `url('${promo.bgImg}')` }}
                >
                  <div className={`absolute inset-0 transition-transform duration-700 ${promo.comingSoon ? 'bg-gray-900/85' : 'bg-gradient-to-r from-gray-900/90 via-gray-900/70 to-transparent group-hover:scale-105'}`} />
                  {promo.comingSoon && (
                    <div className="absolute top-5 right-5 z-20 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2 flex items-center gap-2">
                      <Lock size={14} className="text-gray-300" strokeWidth={2.5} />
                      <span className="text-xs font-black text-gray-200 uppercase tracking-widest">Coming Soon</span>
                    </div>
                  )}
                  <div className="relative z-10 w-full">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] md:text-sm font-bold tracking-widest uppercase mb-3 backdrop-blur-md border ${promo.comingSoon ? 'bg-gray-500/20 border-gray-400/30 text-gray-400' : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'}`}>
                      <AlertCircle size={14} strokeWidth={2.5} /> {promo.tag}
                    </div>
                    <div className={`text-3xl md:text-5xl font-black leading-none mb-3 tracking-tight drop-shadow-lg ${promo.comingSoon ? 'text-gray-300' : 'text-white'}`}>
                      {promo.title}
                    </div>
                    <div className="text-sm md:text-lg font-medium text-gray-300 max-w-[260px] md:max-w-md leading-snug mb-6">
                      {promo.desc}
                    </div>
                    <button
                      disabled={promo.comingSoon}
                      className={`text-white text-xs md:text-sm font-bold px-6 md:px-8 py-3.5 md:py-4 rounded-xl transition-all flex items-center justify-center gap-2 ${promo.comingSoon ? 'bg-white/10 border border-white/20 cursor-not-allowed text-gray-300' : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 shadow-[0_10px_30px_rgba(4,120,87,0.3)]'}`}
                    >
                      {promo.comingSoon ? <><Lock size={14} /> Segera Hadir</> : <>{promo.btnText} <ArrowRight size={16} /></>}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
            {PROMOS.map((_, idx) => (
              <button key={idx} onClick={() => setCurrentPromo(idx)} className={`transition-all duration-300 rounded-full ${idx === currentPromo ? 'w-6 h-2 bg-emerald-500' : 'w-2 h-2 bg-white/40 hover:bg-white/70'}`} />
            ))}
          </div>
          <button onClick={() => setCurrentPromo(p => p === 0 ? PROMOS.length - 1 : p - 1)} className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/30 backdrop-blur-md rounded-full items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all z-20 border border-white/20">
            <ChevronLeft size={24} />
          </button>
          <button onClick={() => setCurrentPromo(p => p === PROMOS.length - 1 ? 0 : p + 1)} className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/30 backdrop-blur-md rounded-full items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all z-20 border border-white/20">
            <ChevronRight size={24} />
          </button>
        </section>

        {/* PENAWARAN TERAKHIR */}
        <section>
          <div className="flex justify-between items-end mb-5 md:mb-8 px-1">
            <div>
              <div className="flex items-center gap-2 mb-1 md:mb-2">
                <h2 className="text-lg md:text-3xl font-black text-gray-900 tracking-tight">Penawaran Terakhir</h2>
                <span className="bg-red-50 text-red-600 text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-md animate-[pulse_2s_infinite] border border-red-200 tracking-wider flex items-center gap-1">
                  <Timer size={10} strokeWidth={2.5} /> TERBATAS
                </span>
              </div>
              <p className="text-xs md:text-base text-gray-500 font-medium">
                Selamatkan makanan dari mitra hari ini sebelum kehabisan.
              </p>
            </div>
            <button onClick={() => navigate('/katalog')} className="text-xs md:text-sm text-[#047857] font-bold flex items-center gap-1 hover:bg-emerald-50 px-4 py-2 rounded-full transition-colors active:scale-95">
              Lihat Semua <MoveRight size={16} strokeWidth={2.5} />
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-3xl p-4 h-64 md:h-80 animate-pulse flex flex-col">
                  <div className="w-full h-32 md:h-40 bg-gray-200 rounded-2xl mb-4" />
                  <div className="w-3/4 h-4 bg-gray-200 rounded-full mb-2" />
                  <div className="w-1/2 h-5 bg-gray-200 rounded-full mb-auto" />
                  <div className="w-full h-10 bg-gray-200 rounded-xl mt-4" />
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

        {/* REKOMENDASI AI */}
        <section className="bg-gradient-to-br from-gray-50 to-white md:bg-white rounded-[2rem] md:rounded-[3rem] md:shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-gray-100 p-5 md:p-10 lg:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <RekomendasiAI
              userId={user?.id}
              title={`Rekomendasi Untuk ${userFirstName}`}
              icon={<Sparkles size={24} className="text-emerald-500" strokeWidth={2.5} />}
            />
          </div>
        </section>

        {/* MITRA PILIHAN */}
        <section className="pb-10">
          <div className="flex justify-between items-end mb-5 md:mb-8 px-1">
            <div>
              <h2 className="text-lg md:text-3xl font-black text-gray-900 tracking-tight mb-1 md:mb-2">Mitra Pilihan</h2>
              <p className="text-xs md:text-base text-gray-500 font-medium">Temukan restoran & kafe terbaik di sekitarmu.</p>
            </div>
            <button onClick={() => navigate('/katalog')} className="text-xs md:text-sm text-[#047857] font-bold hover:bg-emerald-50 px-4 py-2 rounded-full transition-colors active:scale-95 flex items-center gap-1">
              Lihat Semua <MoveRight size={16} strokeWidth={2.5} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-3xl p-4 flex items-center gap-4 animate-pulse">
                  <div className="w-20 h-20 bg-gray-200 rounded-2xl" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded-full w-3/4" />
                    <div className="h-3 bg-gray-200 rounded-full w-1/2" />
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
                    className={`bg-white border rounded-3xl p-4 flex items-center gap-4 cursor-pointer transition-all duration-300 active:scale-[0.98] group relative overflow-hidden ${toko.isOpenNow ? 'border-gray-100 hover:shadow-[0_10px_40px_rgba(0,0,0,0.06)] hover:border-emerald-200' : 'border-gray-200 bg-gray-50/50 opacity-75 grayscale-[0.2]'}`}
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
                      <div className={`text-[9px] font-black px-2 py-0.5 rounded border flex items-center gap-1 w-fit uppercase tracking-wider ${toko.isOpenNow ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-100'}`}>
                        <span className={`w-1 h-1 rounded-full ${toko.isOpenNow ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
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