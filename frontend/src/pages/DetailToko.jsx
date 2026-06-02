import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProductCard } from '../admin/components';
import {
  MapPin, Clock, ArrowLeft, Store,
  Info, ImageOff, UtensilsCrossed, Leaf, Search, Filter, LayoutGrid, Timer, AlertCircle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const KATEGORI_OPTIONS = [
  'Roti & Kue', 'Nasi & Lauk', 'Minuman',
  'Sayur & Buah', 'Camilan', 'Bahan Baku', 'Lainnya'
];

const KONDISI_OPTIONS = [
  { value: 'Semua', label: 'Semua Kondisi' },
  { value: 'leftover', label: 'Sisa Etalase' },
  { value: 'imperfect', label: 'Kurang Sempurna' },
  { value: 'near-expired', label: 'Mendekati Kedaluwarsa' },
  { value: 'canceled', label: 'Pesanan Batal' }
];

export default function DetailToko() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [toko, setToko] = useState(null);
  const [produkToko, setProdukToko] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imgBannerError, setImgBannerError] = useState(false);
  const [imgLogoError, setImgLogoError] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterKondisi, setFilterKondisi] = useState('Semua');

  // ⏱️ State Live Countdown
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    const fetchTokoData = async () => {
      try {
        const [resToko, resProd] = await Promise.all([
          fetch(`${API_URL}/stores/${id}`),
          fetch(`${API_URL}/products`)
        ]);

        const dataToko = await resToko.json();
        const dataProd = await resProd.json();

        if (dataToko.status === 'success') {
          setToko(dataToko.data);

          if (dataProd.status === 'success') {
            // ✅ FIX 1: Pastikan store_id dikonversi ke Number agar tidak salah baca teks vs angka
            const filterProduk = dataProd.data.filter(p => Number(p.store_id) === Number(id));

            const formattedProduk = filterProduk.map(p => {
              // ✅ FIX 2: Jika kategori dari database tidak ada di KATEGORI_OPTIONS, masukkan ke 'Lainnya'
              const rawCategory = p.kategori || p.category || 'Lainnya';
              const finalCategory = KATEGORI_OPTIONS.includes(rawCategory) ? rawCategory : 'Lainnya';

              return {
                id: p.id,
                store_id: p.store_id,
                name: p.nama_produk || p.name,
                category: finalCategory, // Gunakan kategori yang sudah divalidasi
                price: p.harga || p.price,
                originalPrice: p.harga_asli || p.originalPrice,
                discount: p.diskon || 0,
                type: p.kondisi || p.type || 'leftover',
                stok: p.stok || 0,
                batas_konsumsi: p.batas_konsumsi || p.waktu_tutup || dataToko.data.waktu_tutup || '22:00',
                gambar_produk: p.gambar_produk,
                rating: 5.0,
                reviews: Math.floor(Math.random() * 30) + 5
              };
            });
            setProdukToko(formattedProduk);
          }
        }
      } catch (error) {
        console.error("Gagal menarik data detail toko:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTokoData();
  }, [id]);

  // ⏱️ LOGIKA TIMER CROSS-MIDNIGHT (Super Akurat)
  useEffect(() => {
    if (!toko?.waktu_tutup || !toko?.waktu_buka) return;

    let timerInterval;

    const calculateTimeLeft = () => {
      const now = new Date();
      const currentStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const openStr = toko.waktu_buka.substring(0, 5);
      const closeStr = toko.waktu_tutup.substring(0, 5);

      let isOpen = false;
      let nextCloseDate = new Date();

      if (openStr <= closeStr) {
        if (currentStr >= openStr && currentStr < closeStr) {
          isOpen = true;
          const [ch, cm] = closeStr.split(':');
          nextCloseDate.setHours(parseInt(ch), parseInt(cm), 0, 0);
        }
      } else {
        if (currentStr >= openStr || currentStr < closeStr) {
          isOpen = true;
          const [ch, cm] = closeStr.split(':');
          nextCloseDate.setHours(parseInt(ch), parseInt(cm), 0, 0);

          if (currentStr >= openStr) {
            nextCloseDate.setDate(nextCloseDate.getDate() + 1);
          }
        }
      }

      if (!toko.is_active || !isOpen) {
        setIsClosed(true);
        setIsUrgent(false);
        if (timerInterval) clearInterval(timerInterval);
        return "Telah Tutup";
      }

      setIsClosed(false);
      const diff = nextCloseDate - now;

      setIsUrgent(diff <= 3600000);

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    setTimeLeft(calculateTimeLeft());
    timerInterval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [toko]);

  const filteredProduk = useMemo(() => {
    return produkToko.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchKondisi = filterKondisi === 'Semua' || p.type === filterKondisi;
      return matchSearch && matchKondisi;
    });
  }, [searchQuery, filterKondisi, produkToko]);

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-gray-50 flex flex-col w-full animate-pulse">
        <div className="h-48 md:h-64 bg-gray-200 w-full" />
        <div className="max-w-7xl mx-auto w-full px-5 -mt-12 md:-mt-16 relative z-10">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-300 rounded-2xl md:rounded-3xl border-4 border-gray-50 mb-4" />
          <div className="h-6 w-1/2 md:w-1/3 bg-gray-300 rounded-lg mb-3" />
          <div className="h-4 w-3/4 md:w-1/2 bg-gray-200 rounded-lg mb-6" />
        </div>
      </div>
    );
  }

  if (!toko) {
    return (
      <div className="flex-1 min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-5">
        <div className="w-24 h-24 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center mb-5">
          <Store size={40} className="text-gray-300" />
        </div>
        <h1 className="text-xl font-black text-gray-800 tracking-tight mb-2">Toko Tidak Ditemukan</h1>
        <p className="text-sm text-gray-500 max-w-xs mb-6">Mitra yang kamu cari mungkin sudah tidak aktif atau tautan tidak valid.</p>
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-900 hover:bg-black text-white font-bold px-8 py-3 rounded-full transition-all active:scale-95 flex items-center gap-2 shadow-md"
        >
          <ArrowLeft size={18} /> Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-gray-50 pb-20 md:pb-12 font-sans w-full">

      <button
        onClick={() => navigate(-1)}
        className="fixed top-4 left-4 md:top-6 md:left-8 z-50 w-10 h-10 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors border border-white/20 shadow-lg"
      >
        <ArrowLeft size={20} strokeWidth={2.5} />
      </button>

      {/* ── HERO BANNER ── */}
      <div className="w-full h-48 md:h-64 lg:h-72 bg-gray-900 relative overflow-hidden flex items-center justify-center flex-shrink-0">
        {toko.gambar_toko && !imgBannerError ? (
          <img
            src={toko.gambar_toko}
            alt={`Banner ${toko.nama_toko}`}
            className={`w-full h-full object-cover transition-all duration-500 ${isClosed ? 'opacity-40 grayscale' : 'opacity-80 mix-blend-overlay'}`}
            onError={() => setImgBannerError(true)}
          />
        ) : (
          <div className={`absolute inset-0 flex items-center justify-center ${isClosed ? 'bg-gray-700' : 'bg-gradient-to-br from-[#064E3B] to-[#10B981] opacity-80'}`}>
            <Store size={64} className="text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-gray-900/30 to-transparent opacity-95" />
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 lg:px-12 -mt-20 relative z-10">

        {/* ── PROFIL TOKO ── */}
        <div className="bg-white rounded-[2rem] p-5 md:p-8 shadow-[0_15px_50px_rgba(0,0,0,0.06)] border border-gray-100 mb-6 md:mb-8 flex flex-col md:flex-row gap-5 md:gap-8 items-start">

          <div className={`w-24 h-24 md:w-32 md:h-32 bg-white rounded-2xl md:rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border-[4px] border-white flex-shrink-0 flex items-center justify-center overflow-hidden -mt-12 md:-mt-16 relative z-20 p-2 md:p-3 transition-all ${isClosed ? 'grayscale opacity-80' : ''}`}>
            {toko.gambar_toko && !imgLogoError ? (
              <img
                src={toko.gambar_toko}
                alt={`Logo ${toko.nama_toko}`}
                className="w-full h-full object-contain drop-shadow-sm"
                onError={() => setImgLogoError(true)}
              />
            ) : (
              <Store size={32} strokeWidth={1.5} className="text-gray-300" />
            )}
          </div>

          <div className="flex-1 w-full">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 leading-tight tracking-tight mb-2">
                  {toko.nama_toko}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-[10px] md:text-xs font-bold px-3 py-1 bg-gray-100 text-gray-600 rounded-lg uppercase tracking-wider border border-gray-200">
                    {toko.kategori || 'Mitra Penyelamat'}
                  </span>

                  <span className={`text-[10px] md:text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1.5 border ${
                    !toko.is_active ? 'bg-red-50 text-red-700 border-red-200' : isClosed ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${!toko.is_active || isClosed ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></span>
                    {!toko.is_active ? 'Tutup Sementara' : isClosed ? 'Di Luar Jam Buka' : 'Siap Melayani'}
                  </span>
                </div>
              </div>

              <div className={`flex items-center gap-4 p-3.5 md:p-4 rounded-2xl border flex-shrink-0 shadow-lg transition-colors ${
                isClosed
                  ? 'bg-red-50 border-red-100 text-red-700 shadow-none'
                  : isUrgent
                    ? 'bg-red-500 border-red-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse'
                    : 'bg-slate-900 border-slate-800 text-white'
              }`}>
                <div className={`p-2.5 rounded-xl ${isClosed ? 'bg-red-100' : isUrgent ? 'bg-white/20' : 'bg-white/10'}`}>
                  {isClosed || isUrgent ? <AlertCircle size={20} strokeWidth={2.5} /> : <Timer size={20} strokeWidth={2.5} />}
                </div>
                <div>
                  <div className={`text-[10px] font-black uppercase tracking-widest mb-0.5 opacity-80`}>
                    {isClosed ? 'Status Waktu' : 'Sisa Waktu Buka'}
                  </div>
                  <div className="text-xl md:text-2xl font-black tracking-widest font-mono tabular-nums leading-none">
                    {timeLeft}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-500 leading-relaxed max-w-3xl flex items-start gap-2 mt-4 md:mt-2">
              <Info size={16} className="flex-shrink-0 mt-0.5 text-gray-400" />
              {toko.deskripsi || 'Mitra resmi KeduaKali. Bergabung dalam misi menyelamatkan produk layak guna dan mengurangi limbah komersial.'}
            </p>
          </div>
        </div>

        {/* ── INFO ALAMAT & JADWAL ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 md:mb-12">
          <div className="bg-white p-4 md:p-5 rounded-2xl md:rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <MapPin size={20} className="text-emerald-600" strokeWidth={2.5} />
            </div>
            <div className="overflow-hidden">
              <div className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Lokasi Pengambilan</div>
              <div className="text-xs md:text-sm font-semibold text-gray-800 line-clamp-2 leading-tight">{toko.alamat || 'Alamat lengkap belum tersedia'}</div>
            </div>
          </div>

          <div className="bg-white p-4 md:p-5 rounded-2xl md:rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock size={20} className="text-blue-500" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Jadwal Operasional</div>
              <div className="text-base md:text-lg font-black text-gray-900 tracking-tight">
                {toko.waktu_buka ? toko.waktu_buka.substring(0, 5) : '08:00'} - {toko.waktu_tutup ? toko.waktu_tutup.substring(0, 5) : '22:00'} WIB
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6 md:mb-10">
            <div>
              <h2 className="text-lg md:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                Etalase Penyelamatan <Leaf size={20} className="text-emerald-500" />
              </h2>
              <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium">
                Ada <strong className="text-emerald-600">{produkToko.length} item</strong> yang butuh diselamatkan.
              </p>
            </div>

            {produkToko.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-auto">
                  <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <select
                    value={filterKondisi}
                    onChange={(e) => setFilterKondisi(e.target.value)}
                    className="w-full sm:w-48 bg-white border border-gray-200 rounded-xl md:rounded-full pl-10 pr-4 py-2.5 md:py-3 text-sm text-gray-700 font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer shadow-sm"
                  >
                    {KONDISI_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="relative w-full sm:w-56 md:w-64">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Cari menu di sini..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl md:rounded-full pl-10 pr-4 py-2.5 md:py-3 text-sm text-gray-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium shadow-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* RENDER ETALASE */}
          {isClosed ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-5 border border-red-100">
                <Store size={32} strokeWidth={2} className="text-red-400" />
              </div>
              <div className="text-lg md:text-xl font-black text-gray-800 mb-2">Toko Sedang Tutup</div>
              <div className="text-sm font-medium text-gray-500 max-w-sm px-4 leading-relaxed mb-6">
                Maaf, Anda tidak dapat melihat dan memesan produk karena toko sedang di luar jam operasional. Silakan kembali besok!
              </div>
            </div>
          ) : produkToko.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-5 shadow-inner">
                <UtensilsCrossed size={32} strokeWidth={1.5} className="text-gray-300" />
              </div>
              <div className="text-lg md:text-xl font-black text-gray-800 mb-2">Etalase Kosong</div>
              <div className="text-sm font-medium text-gray-500 max-w-sm px-4 leading-relaxed mb-6">
                Semua produk di mitra ini telah berhasil diselamatkan hari ini.
              </div>
            </div>
          ) : filteredProduk.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search size={32} strokeWidth={1.5} className="text-gray-300 mb-3" />
              <div className="text-base font-bold text-gray-700 mb-1">Item tidak ditemukan</div>
              <div className="text-sm text-gray-500">Pencarian atau filter kondisi tidak cocok dengan etalase ini.</div>
            </div>
          ) : (
            <div className="space-y-10">
              {KATEGORI_OPTIONS.map((kategoriNama) => {
                const produkDiKategoriIni = filteredProduk.filter(p => p.category === kategoriNama);

                if (produkDiKategoriIni.length === 0) return null;

                return (
                  <div key={kategoriNama}>
                    <h3 className="text-xs md:text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <LayoutGrid size={16} /> {kategoriNama}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                      {produkDiKategoriIni.map((p) => (
                        <ProductCard key={p.id} product={p} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}