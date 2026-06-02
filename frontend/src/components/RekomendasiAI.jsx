import { useState, useEffect } from 'react';
import { ProductCard } from '../admin/components/index';
import { recommendApi } from '../services/api';
import { Sparkles, Wand2, RefreshCcw } from 'lucide-react';

export default function RekomendasiAI({ userId, productId, title = 'Kurasi Cerdas Untukmu', icon }) {
  const [rekomendasi, setRekomendasi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 1. Deklarasikan satu fungsi fetch utama agar bisa dipakai di useEffect maupun tombol "Coba Ulangi"
  const fetchRekomendasi = async () => {
    setLoading(true);
    setError(false);
    try {
      let aiData = [];

      // Minta Rekomendasi Murni dari AI Backend via Express
      if (productId) {
        aiData = await recommendApi.getByProduct(productId);
      } else if (userId) {
        aiData = await recommendApi.getByUser(userId);
      } else {
        aiData = await recommendApi.getColdStart();
      }

      // Ambil array data dari response
      const rawData = Array.isArray(aiData) ? aiData : (aiData?.data || []);

      // 2. 💡 PERBAIKAN UTAMA: Ambil langsung 4 terbaik tanpa filter stok ulang di frontend
      // Karena PostgreSQL di Express sudah menyaring p.stok > 0, langsung potong di sini.
      const validAiData = rawData.slice(0, 4);

      // 3. Mapping data ke properti yang dibutuhkan ProductCard
      const formattedProducts = validAiData.map((item) => ({
        id: item.id,
        store_id: item.store_id,
        category: item.kategori || item.category || 'Umum',
        name: item.nama_produk || item.name || 'Produk Penyelamatan',
        price: Number(item.harga || item.price || 0),
        originalPrice: item.harga_asli || null,
        discount: item.diskon || 0,
        type: item.kondisi || 'leftover',
        batas_konsumsi: item.waktu_tutup || item.batas_konsumsi || '22:00',
        stok: item.stok || 0,
        stok_awal: item.stok_awal || null,
        gambar_produk: item.gambar_produk
      }));

      setRekomendasi(formattedProducts);
    } catch (err) {
      console.error('❌ Gagal merender rekomendasi di frontend:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Panggil fungsi utama setiap kali parameter userId atau productId berubah
  useEffect(() => {
    fetchRekomendasi();
  }, [userId, productId]);

  // --- UI SKELETON LOADING ---
  if (loading) {
    return (
      <div className="w-full relative animate-pulse">
        <div className="flex items-center gap-2 mb-6">
          {icon || <Wand2 size={24} className="text-amber-500 animate-pulse" strokeWidth={2.5} />}
          <div className="h-8 w-48 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-[1.5rem] border border-gray-100 p-3 h-64 md:h-80 flex flex-col relative overflow-hidden shadow-sm">
              <div className="w-full h-32 md:h-40 bg-gray-100 rounded-2xl mb-4"></div>
              <div className="w-3/4 h-4 bg-gray-200 rounded-full mb-2"></div>
              <div className="w-1/2 h-4 bg-gray-200 rounded-full mb-auto"></div>
              <div className="w-full h-10 bg-amber-50/50 rounded-xl mt-4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- UI ERROR / KOSONG ---
  if (error || rekomendasi.length === 0) {
    return (
      <div className="p-8 md:p-12 border-2 border-dashed border-emerald-100 bg-emerald-50/30 rounded-[2rem] text-center transition-all">
        <p className="text-emerald-800/60 font-bold mb-4 text-sm md:text-base">
          Belum ada kurasi produk penyelamatan saat ini.
        </p>
        <button
          onClick={fetchRekomendasi}
          className="bg-white text-emerald-600 border border-emerald-200 font-bold px-6 py-2 rounded-full flex items-center justify-center gap-2 mx-auto hover:bg-emerald-50 active:scale-95 transition-all shadow-sm"
        >
          <RefreshCcw size={16} /> Coba Ulangi
        </button>
      </div>
    );
  }

  // --- UI UTAMA (TAMPIL PRODUK) ---
  return (
    <div className="w-full relative">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div className="flex items-center gap-2 md:gap-3">
          {icon || <Wand2 size={24} className="text-amber-500" />}
          <h2 className="text-lg md:text-2xl font-black text-gray-900 tracking-tight">{title}</h2>
        </div>

        <span className="flex items-center gap-1.5 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 text-[10px] md:text-xs font-black px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-amber-200 uppercase tracking-widest shadow-sm">
          <Sparkles size={14} className="text-amber-500" strokeWidth={2.5} />
          <span className="hidden md:inline">AI Curated</span>
          <span className="md:hidden">Kurasi AI</span>
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 relative z-10">
        {rekomendasi.map((p) => (
          <div key={p.id} className="relative group">
            <div className="absolute inset-0 bg-amber-400/20 rounded-[1.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}