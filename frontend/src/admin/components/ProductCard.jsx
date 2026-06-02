import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Clock, Tag, ImageOff } from 'lucide-react';
import { formatRp } from '../../data/products';

export default function ProductCard({ product }) {
  const navigate = useNavigate();

  const isLowStock = product.stok <= 3 && product.stok > 0;
  const stockPercentage = Math.min((product.stok / 10) * 100, 100);

  return (
    <div
      onClick={() => navigate(`/produk/${product.id}`)}
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:border-emerald-200 transition-all duration-300 flex flex-col relative group"
    >
      {/* ── Gambar Produk ── */}
      <div className="h-32 md:h-44 bg-gray-50 relative overflow-hidden flex items-center justify-center">
        {product.gambar_produk ? (
          <img
            src={product.gambar_produk}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}

        {/* Fallback jika gambar tidak ada / error */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-50"
          style={{ display: product.gambar_produk ? 'none' : 'flex' }}
        >
          <ImageOff size={28} strokeWidth={1.5} className="text-gray-300" />
          <span className="text-[10px] text-gray-300 font-medium">Belum ada foto</span>
        </div>

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Badge Kondisi */}
        <span
          className={`absolute top-2.5 left-2.5 text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wide z-10 ${
            product.type === 'leftover'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-sky-100 text-sky-700'
          }`}
        >
          {product.type === 'leftover' ? 'Leftover' : 'Imperfect'}
        </span>

        {/* Badge diskon di sudut kanan */}
        {product.discount > 0 && (
          <span className="absolute top-2.5 right-2.5 bg-red-500 text-white text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-lg z-10">
            -{product.discount}%
          </span>
        )}
      </div>

      {/* ── Info Produk ── */}
      <div className="p-3 md:p-4 flex flex-col flex-1">
        <h3 className="text-sm md:text-base font-bold text-gray-900 line-clamp-1 mb-1 group-hover:text-emerald-700 transition-colors">
          {product.name}
        </h3>

        {/* Harga */}
        <div className="flex flex-wrap items-end gap-1.5 mb-3">
          <span className="text-base md:text-lg font-black text-emerald-700">
            {formatRp(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-[10px] md:text-xs text-gray-400 line-through mb-0.5">
              {formatRp(product.originalPrice)}
            </span>
          )}
        </div>

        <div className="mt-auto space-y-2.5">
          {/* Stock Bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className={`text-[10px] font-bold ${isLowStock ? 'text-red-500' : 'text-emerald-600'}`}>
                {isLowStock ? (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                    Sisa {product.stok} porsi
                  </span>
                ) : 'Tersedia'}
              </span>
              <span className="text-[10px] text-gray-400 font-medium">Stok: {product.stok}</span>
            </div>
            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isLowStock ? 'bg-red-400' : 'bg-emerald-500'
                }`}
                style={{ width: `${stockPercentage}%` }}
              />
            </div>
          </div>

          {/* Footer: batas waktu + tombol */}
          <div className="flex items-center justify-between pt-2.5 border-t border-gray-50">
            <span className="flex items-center gap-1 text-[10px] md:text-xs font-semibold text-rose-400">
              <Clock size={11} strokeWidth={2.5} />
              {product.batas_konsumsi || '22:00'}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/produk/${product.id}`); }}
              className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1.5 rounded-xl transition-colors font-bold text-[10px] md:text-xs"
            >
              <ShoppingBag size={13} strokeWidth={2.5} />
              <span className="hidden md:inline">Amankan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}