import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { products } from '../data/products';

// TODO: import { surplusApi } from '../services/api';

export default function SurplusBanner() {
  const navigate = useNavigate();
  const [surplusProducts, setSurplusProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSurplus = async () => {
      try {
        // TODO: Uncomment setelah FastAPI surplus endpoint siap
        // const data = await surplusApi.getTodaySurplus();
        // setSurplusProducts(data);

        // MOCK: tampilkan produk leftover sebagai surplus terdeteksi
        await new Promise((r) => setTimeout(r, 400));
        const surplus = products.filter((p) => p.type === 'leftover').slice(0, 3);
        setSurplusProducts(surplus);
      } catch (err) {
        console.error('Gagal mengambil data surplus:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSurplus();
  }, []);

  if (loading || surplusProducts.length === 0) return null;

  return (
    <div className="mx-4 my-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 text-white">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🔮</span>
        <div>
          <div className="text-sm font-bold">Prediksi Surplus Hari Ini</div>
          <div className="text-xs opacity-80">Berdasarkan model AI KeduaKali</div>
        </div>
      </div>
      <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-hide pb-1">
        {surplusProducts.map((p) => (
          <button
            key={p.id}
            onClick={() => navigate(`/produk/${p.id}`)}
            className="flex-shrink-0 bg-white/20 rounded-xl px-3 py-2 text-left"
          >
            <div className="text-xl mb-1">{p.emoji}</div>
            <div className="text-xs font-semibold leading-snug max-w-[80px] line-clamp-2">
              {p.name}
            </div>
            <div className="text-xs font-bold mt-1">
              Rp {(p.price / 1000).toFixed(0)}rb
            </div>
          </button>
        ))}
      </div>
      <button
        onClick={() => navigate('/katalog')}
        className="w-full mt-3 bg-white text-orange-600 font-bold text-xs py-2 rounded-xl"
      >
        Lihat Semua Produk Surplus →
      </button>
    </div>
  );
}
