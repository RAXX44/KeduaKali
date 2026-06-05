import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatRp } from '../data/products';
import {
  ArrowLeft, ShoppingBag, Trash2, Plus, Minus,
  ArrowRight, Leaf, Receipt, ImageOff, Store, MapPin
} from 'lucide-react';

export default function Keranjang() {
  const navigate = useNavigate();
  const { cart, changeQty, total } = useCart();

  // Ongkir dihapus total karena model bisnisnya Self-Pickup
  const biayaPenanganan = 0;

  // Hitung total item fisik
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  // Ambil nama toko dari item pertama (karena sudah dikunci 1 toko oleh Context)
  const activeStore = cart.length > 0 ? cart[0].nama_toko : null;

  // Ambil ID toko untuk navigasi balik mengeksplor menu lain
  const activeStoreId = cart.length > 0 ? cart[0].store_id : null;

  return (
    <div className="flex-1 bg-gray-50 min-h-screen w-full flex flex-col font-sans pb-24 md:pb-12">

      {/* ── STICKY HEADER (Super App Style) ── */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center text-gray-700 active:scale-95 transition-all flex-shrink-0"
            >
              <ArrowLeft size={20} strokeWidth={2.5} />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-black text-gray-900 tracking-tight leading-none">Keranjang</h1>
              <p className="text-[10px] md:text-xs font-bold text-emerald-600 uppercase tracking-wider mt-0.5">
                {totalItems > 0 ? `${totalItems} Porsi Siap Diambil` : 'Keranjang Masih Kosong'}
              </p>
            </div>
          </div>

          {/* Tombol Kosongkan */}
          {cart.length > 0 && (
            <button
              onClick={() => {
                if(window.confirm('Yakin ingin membatalkan semua porsi ini?')) {
                  cart.forEach(item => changeQty(item.id, -item.qty));
                }
              }}
              className="w-10 h-10 bg-red-50 hover:bg-red-100 text-red-500 rounded-full flex items-center justify-center transition-colors shadow-sm flex-shrink-0"
              title="Kosongkan Keranjang"
            >
              <Trash2 size={18} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-6 md:py-8 flex-1">

        {/* ── EMPTY STATE ── */}
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 md:py-32 text-center bg-white rounded-[2rem] shadow-sm border border-gray-100 mt-2 mx-2 md:mx-0">
            <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner border border-gray-100">
              <ShoppingBag size={40} className="text-gray-300" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-gray-800 mb-2 tracking-tight">Keranjangmu Masih Kosong</h2>
            <p className="text-sm md:text-base text-gray-500 mb-8 max-w-sm px-4 leading-relaxed">
              Porsi makanan lezat di luar sana sedang menunggu pahlawan untuk menyelamatkannya!
            </p>
            <button
              onClick={() => navigate('/katalog')}
              className="bg-[#047857] text-white font-bold px-8 py-4 rounded-full hover:bg-[#064E3B] transition-all shadow-[0_8px_20px_rgba(4,120,87,0.25)] active:scale-95 flex items-center gap-2"
            >
              Cari Makanan Sekarang <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

            {/* ── BAGIAN KIRI: DAFTAR PRODUK ── */}
            <div className="w-full lg:w-2/3 space-y-4">

              {/* Indikator Lokasi Pengambilan (Single Store) */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-4 flex items-center gap-4 shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-100/50 rounded-full blur-2xl pointer-events-none"></div>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm flex-shrink-0 relative z-10">
                  <MapPin size={22} strokeWidth={2.5} />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Lokasi Pengambilan</p>
                  <p className="text-sm md:text-base font-black text-gray-900">{activeStore}</p>
                </div>
              </div>

              {cart.map((item) => (
                <div key={item.id} className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 md:p-5 border border-gray-100 bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-emerald-100 transition-all relative">

                  {/* ── Gambar Produk dengan Fallback ── */}
                  <div className="relative w-full sm:w-28 h-36 sm:h-28 rounded-2xl md:rounded-3xl bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100">
                    {item.gambar_produk ? (
                      <img
                        src={item.gambar_produk}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}

                    {/* Fallback jika gambar kosong / error */}
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-gray-50"
                      style={{ display: item.gambar_produk ? 'none' : 'flex' }}
                    >
                      <ImageOff size={22} strokeWidth={1.5} className="text-gray-300" />
                    </div>
                  </div>

                  {/* Detail & Kontrol */}
                  <div className="flex-1 w-full min-w-0 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div>
                        <h3 className="text-base md:text-lg font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-emerald-700 transition-colors">
                          {item.name}
                        </h3>
                        <p className="text-sm md:text-base font-black text-emerald-600 mt-1">
                          {formatRp(item.price)}
                        </p>
                      </div>

                      {/* Tombol Hapus Individual (Desktop) */}
                      <button
                        onClick={() => changeQty(item.id, -item.qty)}
                        className="hidden sm:flex text-gray-300 hover:text-red-500 p-2.5 transition-colors bg-gray-50 hover:bg-red-50 rounded-xl flex-shrink-0"
                        title="Hapus porsi"
                      >
                        <Trash2 size={18} strokeWidth={2} />
                      </button>
                    </div>

                    {/* Stepper Control */}
                    <div className="flex items-center justify-between sm:justify-start w-full gap-4 pt-3 border-t border-gray-50">
                      <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200/60 p-1">
                        <button
                          onClick={() => changeQty(item.id, -1)}
                          className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-emerald-700 hover:bg-white rounded-lg transition-all shadow-sm active:scale-95"
                        >
                          {item.qty === 1 ? <Trash2 size={16} className="text-red-500"/> : <Minus size={16} strokeWidth={2.5}/>}
                        </button>
                        <span className="text-sm md:text-base font-black w-10 text-center text-gray-900">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => changeQty(item.id, 1)}
                          className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-emerald-700 hover:bg-white rounded-lg transition-all shadow-sm active:scale-95"
                        >
                          <Plus size={16} strokeWidth={2.5}/>
                        </button>
                      </div>

                      {/* Tombol Hapus Individual (Mobile) */}
                      <button
                        onClick={() => changeQty(item.id, -item.qty)}
                        className="sm:hidden text-gray-400 hover:text-red-500 p-2 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* ── TOMBOL TAMBAH MENU LAIN ── */}
              {activeStoreId && (
                <button
                  onClick={() => navigate(`/toko/${activeStoreId}`)}
                  className="w-full mt-2 bg-white border-2 border-dashed border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 rounded-[1.5rem] md:rounded-[2rem] py-4 text-sm md:text-base font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm group"
                >
                  <Plus size={18} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                  Tambah Menu Lain dari Toko Ini
                </button>
              )}

            </div>

            {/* ── BAGIAN KANAN: RINGKASAN RESERVASI (Sticky) ── */}
            <div className="w-full lg:w-1/3 lg:sticky lg:top-28">
              <div className="bg-white rounded-[2rem] border border-gray-100 p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)] relative overflow-hidden">

                {/* Aksen Background */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>

                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                  <Receipt size={20} className="text-emerald-600" />
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">Ringkasan Reservasi</h3>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center text-sm md:text-base text-gray-600">
                    <span className="font-medium">Total Harga ({totalItems} porsi)</span>
                    <span className="font-bold text-gray-900">{formatRp(total)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm md:text-base text-gray-600">
                    <span className="font-medium">Biaya Penanganan</span>
                    <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs uppercase tracking-wider">Gratis</span>
                  </div>
                </div>

                {/* Eco Impact Gamification Badge */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6 flex items-start gap-3">
                  <Leaf className="text-emerald-500 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-[11px] md:text-xs font-black text-emerald-800 uppercase tracking-widest mb-1">Misi Hampir Selesai!</h4>
                    <p className="text-[10px] md:text-xs text-emerald-600 font-medium leading-relaxed">
                      Dengan mereservasi porsi ini, kamu berhasil mencegah makanan berkualitas terbuang sia-sia hari ini.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center py-5 border-t border-dashed border-gray-200 mb-6">
                  <span className="text-sm md:text-base font-bold text-gray-500 uppercase tracking-widest">Total Tagihan</span>
                  <span className="text-2xl md:text-3xl font-black text-emerald-600 tracking-tight">
                    {formatRp(total + biayaPenanganan)}
                  </span>
                </div>

                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-gradient-to-r from-[#047857] to-[#10B981] hover:from-[#064E3B] hover:to-[#047857] active:scale-[0.98] transition-all shadow-[0_8px_25px_rgba(16,185,129,0.3)] text-white rounded-2xl py-4 text-sm md:text-base font-bold flex items-center justify-center gap-2 group"
                >
                  Konfirmasi Reservasi <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}