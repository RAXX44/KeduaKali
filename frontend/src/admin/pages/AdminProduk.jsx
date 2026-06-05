import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { formatRp } from '../../data/products';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  Search, Edit, Trash2, Package, X, Clock,
  Plus, AlertCircle, Image as ImageIcon, Store,
  AlertTriangle, TrendingDown, Tag, ChevronUp, ChevronDown, ArrowUpDown
} from 'lucide-react';

const KATEGORI_OPTIONS = [
  'Roti & Kue', 'Nasi & Lauk', 'Minuman',
  'Sayur & Buah', 'Camilan', 'Lainnya'
];
const KATEGORI_FILTER = ['Semua', ...KATEGORI_OPTIONS];

const TYPE_CONFIG = {
  'leftover': { label: 'Sisa Etalase', style: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  'imperfect': { label: 'Kurang Sempurna', style: 'bg-sky-50 text-sky-700 border-sky-200' },
  'near-expired': { label: 'Mendekati Jam Tutup Toko', style: 'bg-orange-50 text-orange-700 border-orange-200' },
  'canceled': { label: 'Pesanan Batal', style: 'bg-purple-50 text-purple-700 border-purple-200' },
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AdminProduk() {
  const { adminToken, admin } = useAdminAuth();
  const [produkList, setProdukList] = useState([]);
  const [tokoList, setTokoList] = useState([]);
  const [myStore, setMyStore] = useState(null);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState('Semua');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formError, setFormError] = useState('');
  
  // State untuk Delete Modal Custom
  const [deleteItem, setDeleteItem] = useState(null);

  // State untuk Sorting
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const [form, setForm] = useState({
    storeId: '', name: '', category: KATEGORI_OPTIONS[0], type: 'leftover',
    price: '', originalPrice: '', stok: '', description: '',
    gambar_produk: '', batas_konsumsi: '22:00'
  });

  const isSuperAdmin = admin?.role === 'superadmin';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resProd, resToko] = await Promise.all([
        fetch(`${API_URL}/products`),
        fetch(`${API_URL}/stores`)
      ]);
      const dataProd = await resProd.json();
      const dataToko = await resToko.json();

      let activeStores = [];
      let currentMitraStore = null;

      if (dataToko.status === 'success') {
        activeStores = dataToko.data.filter(t => t.is_active);
        setTokoList(activeStores);

        if (!isSuperAdmin) {
          currentMitraStore = activeStores.find(t => t.mitra_user_id === admin?.id) || activeStores.find(t => t.id === admin?.store_id);
          setMyStore(currentMitraStore);
        }
      }

      if (dataProd.status === 'success') {
        let rawProducts = dataProd.data;

        if (!isSuperAdmin && currentMitraStore) {
          rawProducts = rawProducts.filter(p => p.store_id === currentMitraStore.id);
        } else if (!isSuperAdmin && !currentMitraStore) {
          rawProducts = [];
        }

        setProdukList(rawProducts.map(p => {
          const validCategory = KATEGORI_OPTIONS.includes(p.kategori || p.category)
            ? (p.kategori || p.category)
            : 'Lainnya';

          return {
            id: p.id, store_id: p.store_id, nama_toko: p.nama_toko || 'Toko Belum Diatur',
            name: p.nama_produk || p.name || 'Produk Baru',
            price: Number(p.harga || p.price || 0),
            originalPrice: p.harga_asli || '',
            stok: p.stok || 0,
            category: validCategory,
            type: p.kondisi || p.type || 'leftover',
            gambar_produk: p.gambar_produk || '',
            batas_konsumsi: p.batas_konsumsi ? p.batas_konsumsi.substring(0, 5) : '22:00'
          };
        }));
      }
    } catch (error) {
      console.error("Gagal menarik data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [admin]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const processedProdukList = [...produkList].filter(p => {
    const matchCat = filter === 'Semua' || p.category === filter;
    const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }).sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalStok = produkList.reduce((s, p) => s + p.stok, 0);
  const stokKritis = produkList.filter(p => p.stok <= 5 && p.stok > 0).length;
  const stokHabis = produkList.filter(p => p.stok === 0).length;

  const openAdd = () => {
    setEditItem(null); setFormError('');
    setForm({
      storeId: !isSuperAdmin && myStore ? myStore.id : '',
      name: '', category: KATEGORI_OPTIONS[0], type: 'leftover',
      price: '', originalPrice: '', stok: '', description: '',
      gambar_produk: '', batas_konsumsi: '22:00'
    });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditItem(p); setFormError('');
    setForm({
      storeId: p.store_id || (!isSuperAdmin && myStore ? myStore.id : ''),
      name: p.name, category: p.category,
      type: p.type, price: p.price, originalPrice: p.originalPrice || '',
      stok: p.stok, description: p.description || '',
      gambar_produk: p.gambar_produk || '', batas_konsumsi: p.batas_konsumsi || '22:00'
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.name || !form.price || form.stok === '' || !form.storeId || !form.batas_konsumsi) {
      setFormError("Nama, Harga, Stok, Batas Aman, dan Mitra Toko wajib diisi!"); return;
    }
    try {
      const method = editItem ? 'PUT' : 'POST';
      const url = editItem ? `${API_URL}/products/${editItem.id}` : `${API_URL}/products`;
      const token = adminToken || localStorage.getItem('kk_token');

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          store_id: Number(form.storeId), name: form.name, category: form.category,
          type: form.type, price: Number(form.price),
          original_price: form.originalPrice ? Number(form.originalPrice) : null,
          stok: Number(form.stok), description: form.description,
          gambar_produk: form.gambar_produk, batas_konsumsi: form.batas_konsumsi
        })
      });
      if (res.ok) { fetchData(); setShowModal(false); }
      else setFormError("Gagal menyimpan produk. Cek koneksi server.");
    } catch (error) {
      setFormError("Terjadi kesalahan teknis."); console.error(error);
    }
  };

  const executeDelete = async () => {
    if (!deleteItem) return;
    try {
      const token = adminToken || localStorage.getItem('kk_token');
      const res = await fetch(`${API_URL}/products/${deleteItem.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
        setDeleteItem(null);
      }
    } catch (error) { 
      console.error(error); 
    }
  };

  // ✅ MEMISAHKAN INFO PRODUK DAN HARGA MENJADI SLOT TERPISAH
  const TABLE_HEADERS = [
    { label: 'Info Produk', key: 'name' },
    { label: 'Harga', key: 'price' }, // Slot Filter & Tampilan Baru!
    { label: 'Mitra / Toko', key: 'nama_toko' },
    { label: 'Batas Aman', key: 'batas_konsumsi' },
    { label: 'Stok', key: 'stok' },
    { label: 'Kondisi', key: 'type' },
    { label: 'Aksi', key: null }
  ];

  return (
    <AdminLayout title="Kelola Katalog Produk">
      <div className="space-y-5 animate-in fade-in">

        {!loading && !isSuperAdmin && !myStore && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-2xl flex items-center gap-3 font-bold shadow-sm">
            <AlertTriangle size={20} />
            Akun Anda belum didelegasikan ke entitas toko manapun. Harap hubungi Super Admin.
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Produk', value: produkList.length, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
              { label: 'Total Stok', value: `${totalStok} pcs`, icon: Tag, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
              { label: 'Stok Kritis (≤5)', value: stokKritis, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
              { label: 'Stok Habis', value: stokHabis, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className={`bg-white border ${s.border} rounded-2xl p-4 flex items-center gap-4 shadow-sm`}>
                  <div className={`p-2.5 ${s.bg} rounded-xl`}>
                    <Icon size={18} className={s.color} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                    <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full overflow-hidden">
            <div className="relative w-full sm:max-w-xs shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-gray-400" placeholder="Cari produk..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200 overflow-x-auto custom-scrollbar">
              {KATEGORI_FILTER.map(k => (
                <button key={k} onClick={() => setFilter(k)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filter === k ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>{k}</button>
              ))}
            </div>
          </div>
          <button
            onClick={openAdd}
            disabled={!isSuperAdmin && !myStore}
            className={`w-full sm:w-auto text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 shrink-0 ${!isSuperAdmin && !myStore ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'}`}
          >
            <Plus size={18} /> Tambah Produk
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200 select-none">
                <tr>
                  {TABLE_HEADERS.map((h, i) => (
                    <th 
                      key={i} 
                      onClick={() => h.key && handleSort(h.key)}
                      className={`px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap transition-colors ${h.key ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        {h.label}
                        {h.key && (
                          <div className="text-gray-400">
                            {sortConfig.key === h.key ? (
                              sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-emerald-600" /> : <ChevronDown size={14} className="text-emerald-600" />
                            ) : (
                              <ArrowUpDown size={14} className="opacity-50 hover:opacity-100" />
                            )}
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="7" className="text-center py-16 text-gray-400 animate-pulse">Menyiapkan Etalase...</td></tr>
                ) : processedProdukList.length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-16">
                    <Package size={32} className="mx-auto text-gray-300 mb-3" />
                    <div className="text-gray-900 font-bold mb-1">Katalog Kosong</div>
                    <div className="text-gray-500 text-sm">Tidak ada produk yang sesuai.</div>
                  </td></tr>
                ) : processedProdukList.map(p => {
                  const diskonPct = p.originalPrice && p.originalPrice > p.price
                    ? Math.round((1 - p.price / p.originalPrice) * 100) : null;
                  const isKritis = p.stok <= 5 && p.stok > 0;
                  const isHabis = p.stok === 0;
                  const typeData = TYPE_CONFIG[p.type] || TYPE_CONFIG['leftover'];

                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      {/* SLOT 1: INFO PRODUK (Nama & Gambar Saja) */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {p.gambar_produk ? (
                            <img src={p.gambar_produk} alt={p.name} className="w-12 h-12 rounded-xl object-cover border border-gray-200 shadow-sm" onError={e => e.target.style.display='none'} />
                          ) : (
                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200 text-gray-400">
                              <Package size={22} />
                            </div>
                          )}
                          <div>
                            <div className="text-gray-900 text-sm font-bold truncate max-w-[200px]">{p.name}</div>
                          </div>
                        </div>
                      </td>

                      {/* SLOT 2: HARGA (Terpisah, Bersih, dan Bisa Disortir) */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col justify-center">
                          <span className="text-emerald-600 text-sm font-black">{formatRp(p.price)}</span>
                          {p.originalPrice && (
                            <span className="text-gray-400 text-xs line-through mt-0.5">{formatRp(p.originalPrice)}</span>
                          )}
                          {diskonPct && (
                            <span className="text-[10px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded font-bold w-fit mt-1">
                              -{diskonPct}%
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 font-medium flex items-center gap-2">
                          <Store size={14} className="text-gray-400" /> {p.nama_toko}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-red-50 text-red-600 px-2.5 py-1 rounded-md border border-red-100 font-bold flex items-center gap-1.5 w-fit">
                          <Clock size={12} /> {p.batas_konsumsi}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-black ${isHabis ? 'text-red-500' : isKritis ? 'text-amber-500' : 'text-gray-900'}`}>{p.stok}</span>
                          {isHabis && <span className="text-[9px] bg-red-50 text-red-500 border border-red-100 px-1.5 py-0.5 rounded font-bold uppercase">Habis</span>}
                          {isKritis && !isHabis && <span className="text-[9px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded font-bold uppercase">Kritis</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] px-2.5 py-1.5 rounded-lg font-bold tracking-wide border flex w-fit ${typeData.style}`}>
                          {typeData.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(p)} className="p-2 text-gray-500 hover:text-emerald-600 bg-white hover:bg-emerald-50 border border-gray-200 rounded-lg transition-colors shadow-sm"><Edit size={16} /></button>
                          <button onClick={() => setDeleteItem(p)} className="p-2 text-gray-500 hover:text-red-600 bg-white hover:bg-red-50 border border-gray-200 rounded-lg transition-colors shadow-sm"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL FORM TAMBAH/EDIT PRODUK */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Package size={20} /></div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">{editItem ? 'Edit Data Produk' : 'Upload Produk Baru'}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Atur kategori, kondisi barang, harga, dan batas aman.</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:bg-gray-200 p-2 rounded-full transition-colors"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm font-bold flex items-start gap-3">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p>{formError}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2 tracking-wide flex items-center gap-1.5"><ImageIcon size={14} /> URL Gambar (Opsional)</label>
                <input type="text" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-gray-400" placeholder="https://link-gambar.com/foto.jpg" value={form.gambar_produk} onChange={e => setForm({ ...form, gambar_produk: e.target.value })} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2 tracking-wide">Nama Produk <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-gray-400" placeholder="Contoh: Roti Croissant Sisa" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2 tracking-wide">Kategori Makanan</label>
                  <select className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 cursor-pointer transition-all" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {KATEGORI_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2 tracking-wide flex items-center gap-1.5"><Store size={14} /> Mitra Toko <span className="text-red-500">*</span></label>
                  {isSuperAdmin ? (
                    <select className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none cursor-pointer focus:border-emerald-500 transition-all" value={form.storeId} onChange={e => setForm({ ...form, storeId: e.target.value })}>
                      <option value="" disabled>-- Pilih Mitra --</option>
                      {tokoList.map(t => <option key={t.id} value={t.id}>{t.nama_toko}</option>)}
                    </select>
                  ) : (
                    <div className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 font-bold cursor-not-allowed">
                      {myStore?.nama_toko || 'Toko Anda'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2 tracking-wide">Kondisi Barang</label>
                  <select className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none cursor-pointer focus:border-emerald-500 transition-all" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="leftover">Leftover (Sisa Etalase)</option>
                    <option value="imperfect">Imperfect (Bentuk Kurang Rapi)</option>
                    <option value="closing-stock">Mendekati Jam Tutup Toko</option>
                    <option value="canceled">Pesanan Dibatalkan (Masih Hangat)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-wider">Stok <span className="text-red-500">*</span></label>
                  <input type="number" min="0" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" placeholder="0" value={form.stok} onChange={e => setForm({ ...form, stok: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-emerald-600 uppercase mb-2 tracking-wider">Harga Jual <span className="text-red-500">*</span></label>
                  <input type="number" min="0" className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700 font-bold outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" placeholder="Rp" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-wider">Harga Asli</label>
                  <input type="number" min="0" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" placeholder="Rp" value={form.originalPrice} onChange={e => setForm({ ...form, originalPrice: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-red-500 uppercase mb-2 tracking-wider flex items-center gap-1"><Clock size={11} /> Batas Aman <span className="text-red-500">*</span></label>
                  <input type="time" className="w-full bg-red-50 border border-red-200 rounded-xl px-3 py-3 text-sm text-red-700 font-bold outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all" value={form.batas_konsumsi} onChange={e => setForm({ ...form, batas_konsumsi: e.target.value })} />
                </div>
              </div>

              {form.price && form.originalPrice && Number(form.originalPrice) > Number(form.price) && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-3">
                  <Tag size={16} className="text-emerald-600" />
                  <span className="text-sm text-emerald-700 font-bold">
                    Diskon {Math.round((1 - Number(form.price) / Number(form.originalPrice)) * 100)}% dari harga asli
                  </span>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-4 shrink-0">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-3.5 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm">Batal</button>
              <button onClick={handleSave} className="flex-1 bg-emerald-600 text-white font-bold py-3.5 rounded-xl text-sm hover:bg-emerald-700 shadow-md active:scale-95 transition-all">
                {editItem ? 'Simpan Perubahan' : 'Upload ke Etalase'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {deleteItem && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden transform transition-all scale-100">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <Trash2 size={32} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Hapus Produk?</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Kamu yakin ingin menghapus <strong>{deleteItem.name}</strong> dari etalase? Tindakan ini tidak bisa dibatalkan.
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button 
                onClick={() => setDeleteItem(null)} 
                className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-sm hover:bg-gray-100 transition-colors shadow-sm"
              >
                Batal
              </button>
              <button 
                onClick={executeDelete} 
                className="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-red-600 shadow-md active:scale-95 transition-all"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}