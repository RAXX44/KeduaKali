import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  Search, Edit, Trash2, Store, X, MapPin,
  Phone, Clock, FileText, Plus, AlertCircle, Image as ImageIcon,
  Building2, Tags, ShieldAlert
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const KATEGORI_MITRA = [
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

export default function AdminToko() {
  const [tokoList, setTokoList] = useState([]);
  const [loading, setLoading] = useState(true);

  // 💡 AMBIL DATA ADMIN & TOKEN
  const { admin, adminToken } = useAdminAuth();
  const isSuperAdmin = admin?.role === 'superadmin';

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState({
    nama_toko: '', kategori: 'Restoran & F&B', deskripsi: '', alamat: '', kontak_toko: '',
    waktu_buka: '08:00', waktu_tutup: '22:00', gambar_toko: '', is_active: true
  });

  const fetchStores = async () => {
    try {
      const token = adminToken || localStorage.getItem('kk_token');
      const res = await fetch(`${API_URL}/stores`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.status === 'success') {
        let stores = data.data;

        // 🔒 FILTER MITRA: Jika bukan superadmin, hanya tampilkan toko miliknya
        if (!isSuperAdmin && admin?.id) {
          stores = stores.filter(t => t.user_id === admin.id);
        }

        setTokoList(stores);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admin) fetchStores();
  }, [admin]);

  const openAdd = () => {
    setEditItem(null);
    setFormError('');
    setForm({ nama_toko: '', kategori: 'Restoran & F&B', deskripsi: '', alamat: '', kontak_toko: '', waktu_buka: '08:00', waktu_tutup: '22:00', gambar_toko: '', is_active: true });
    setShowModal(true);
  };

  const openEdit = (t) => {
    setEditItem(t);
    setFormError('');
    const formatWaktu = (w) => w ? w.substring(0, 5) : '00:00';
    setForm({
      nama_toko: t.nama_toko || '', kategori: t.kategori || 'Restoran & F&B', deskripsi: t.deskripsi || '',
      alamat: t.alamat || '', kontak_toko: t.kontak_toko || '', waktu_buka: formatWaktu(t.waktu_buka),
      waktu_tutup: formatWaktu(t.waktu_tutup), gambar_toko: t.gambar_toko || '', is_active: t.is_active ?? true
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.nama_toko.trim()) {
      setFormError("Nama Toko wajib diisi untuk menyimpan data.");
      return;
    }

    const safeWaktuBuka = form.waktu_buka.length === 5 ? `${form.waktu_buka}:00` : form.waktu_buka;
    const safeWaktuTutup = form.waktu_tutup.length === 5 ? `${form.waktu_tutup}:00` : form.waktu_tutup;

    try {
      const method = editItem ? 'PUT' : 'POST';
      const url = editItem ? `${API_URL}/stores/${editItem.id}` : `${API_URL}/stores`;
      const token = adminToken || localStorage.getItem('kk_token');

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...form, waktu_buka: safeWaktuBuka, waktu_tutup: safeWaktuTutup })
      });

      if (res.ok) {
        fetchStores();
        setShowModal(false);
      } else {
        setFormError("Terjadi kesalahan sistem. Gagal menyimpan data ke database.");
      }
    } catch (e) {
      setFormError("Koneksi ke server terputus.");
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    // 🔒 PROTEKSI EKSTRA: Pastikan fungsi hapus hanya bisa dipanggil Superadmin
    if (!isSuperAdmin) return;

    if (window.confirm('Peringatan: Apakah Anda yakin ingin memutus kemitraan dan menghapus toko ini secara permanen?')) {
      const token = adminToken || localStorage.getItem('kk_token');
      await fetch(`${API_URL}/stores/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchStores();
    }
  };

  const filtered = tokoList.filter((t) => (t.nama_toko || '').toLowerCase().includes(search.toLowerCase()));
  const activeCount = tokoList.filter(t => t.is_active).length;

  return (
    <AdminLayout title={isSuperAdmin ? "Manajemen Mitra Toko" : "Profil Toko Saya"}>
      <div className="space-y-6 animate-in fade-in">

        {/* ℹ️ Peringatan untuk Mitra */}
        {!isSuperAdmin && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
            <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="text-sm font-bold text-amber-800">Akses Terbatas (Mode Mitra)</h4>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">Anda hanya dapat melihat dan mengubah profil toko milik Anda sendiri. Jika ada kesalahan data yang tidak bisa diubah, silakan hubungi Superadmin.</p>
            </div>
          </div>
        )}

        {/* Header & Toolbar */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex flex-col gap-1 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-gray-400"
                placeholder={isSuperAdmin ? "Cari berdasarkan nama mitra..." : "Cari data toko..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">{isSuperAdmin ? 'Mitra Aktif' : 'Status Toko'}</span>
              <span className="text-gray-900 font-black text-lg">{loading ? '-' : activeCount} <span className="text-gray-400 text-sm font-medium">/ {tokoList.length}</span></span>
            </div>

            {/* 🔒 HANYA SUPERADMIN YANG BISA TAMBAH TOKO */}
            {isSuperAdmin && (
              <button
                onClick={openAdd}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Tambah Mitra
              </button>
            )}
          </div>
        </div>

        {/* Tabel Data */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Profil Mitra', 'Kategori Bisnis', 'Kontak Operasional', 'Status Kemitraan', 'Tindakan'].map(h =>
                    <th key={h} className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-16 text-gray-400 font-medium animate-pulse">Sinkronisasi data mitra...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-16">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400 border border-gray-100">
                        <Store size={32} />
                      </div>
                      <div className="text-gray-900 font-bold mb-1">{isSuperAdmin ? 'Tidak ada mitra ditemukan' : 'Toko Anda belum dikonfigurasi'}</div>
                      <div className="text-gray-500 text-sm">{isSuperAdmin ? 'Coba gunakan kata kunci pencarian yang lain.' : 'Silakan hubungi Superadmin untuk mengaitkan akun Anda dengan Toko.'}</div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4 flex items-center gap-4">
                        {t.gambar_toko ? (
                          <img src={t.gambar_toko} className="w-12 h-12 rounded-xl object-contain bg-white border border-gray-200 shadow-sm p-1" alt={t.nama_toko} />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl flex items-center justify-center border border-emerald-200 shadow-sm text-emerald-700 font-black text-xl">
                            {t.nama_toko.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-bold text-gray-900 mb-0.5">{t.nama_toko}</div>
                          <div className="text-[10px] text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded w-fit border border-gray-200">ID: #{String(t.id).padStart(4, '0')}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium whitespace-nowrap">{t.kategori}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-gray-400" /> {t.kontak_toko || <span className="text-gray-400 italic">Belum diatur</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wide border flex items-center justify-center w-fit gap-1.5 ${
                          t.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${t.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                          {t.is_active ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(t)} title="Edit Data" className="p-2 text-gray-500 hover:text-emerald-600 bg-white hover:bg-emerald-50 rounded-lg border border-gray-200 transition-colors shadow-sm"><Edit size={16} /></button>

                          {/* 🔒 HANYA SUPERADMIN YANG BISA HAPUS TOKO */}
                          {isSuperAdmin && (
                            <button onClick={() => handleDelete(t.id)} title="Hapus Permanen" className="p-2 text-gray-500 hover:text-red-600 bg-white hover:bg-red-50 rounded-lg border border-gray-200 transition-colors shadow-sm"><Trash2 size={16} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">

            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 tracking-tight">{editItem ? 'Edit Profil Mitra' : 'Pendaftaran Mitra Baru'}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Lengkapi profil bisnis untuk bergabung di ekosistem KeduaKali.</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:bg-gray-200 p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm font-bold flex items-start gap-3 animate-in slide-in-from-top-2">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p>{formError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Nama Bisnis / Toko <span className="text-red-500">*</span></label>
                  <input className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-gray-400" placeholder="Cth: Kopi Kenangan Senja" value={form.nama_toko} onChange={(e) => setForm({...form, nama_toko: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide flex items-center gap-1.5"><Tags size={14}/> Kategori Industri</label>
                  <select className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all cursor-pointer" value={form.kategori} onChange={(e) => setForm({...form, kategori: e.target.value})}>
                    {KATEGORI_MITRA.map(kat => (
                      <option key={kat} value={kat}>{kat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide flex items-center gap-1.5"><ImageIcon size={14}/> URL Logo / Foto Toko (Opsional)</label>
                <input className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-gray-400" placeholder="https://link-gambar.com/logo-toko.jpg" value={form.gambar_toko} onChange={(e) => setForm({...form, gambar_toko: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide flex items-center gap-1.5"><Phone size={14}/> Nomor Kontak / WA</label>
                  <input className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-gray-400" placeholder="0812-xxxx-xxxx" value={form.kontak_toko} onChange={(e) => setForm({...form, kontak_toko: e.target.value})} />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest flex items-center gap-1"><Clock size={12}/> Jam Buka</label>
                    <input type="time" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-900 font-bold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all" value={form.waktu_buka} onChange={(e) => setForm({...form, waktu_buka: e.target.value})} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-red-500 mb-2 uppercase tracking-widest flex items-center gap-1"><Clock size={12}/> Jam Tutup</label>
                    <input type="time" className="w-full bg-red-50 border border-red-200 rounded-xl px-4 py-3.5 text-sm text-red-700 font-bold focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all" value={form.waktu_tutup} onChange={(e) => setForm({...form, waktu_tutup: e.target.value})} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide flex items-center gap-1.5"><MapPin size={14}/> Detail Alamat Pengambilan</label>
                <textarea rows="2" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-gray-400 resize-none" placeholder="Alamat lengkap beserta patokan..." value={form.alamat} onChange={(e) => setForm({...form, alamat: e.target.value})} />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide flex items-center gap-1.5"><FileText size={14}/> Deskripsi & Nilai Bisnis</label>
                <textarea rows="2" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-gray-400 resize-none" placeholder="Misi toko terkait sustainability..." value={form.deskripsi} onChange={(e) => setForm({...form, deskripsi: e.target.value})} />
              </div>

              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-0.5">Status Kemitraan</h4>
                  <p className="text-xs text-gray-500 max-w-[250px]">Matikan jika mitra sedang tutup sementara agar tidak muncul di katalog.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shadow-sm rounded-full">
                  <input type="checkbox" className="sr-only peer" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                  <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-4 shrink-0">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-white border border-gray-200 text-gray-700 py-3.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm">
                Batal
              </button>
              <button onClick={handleSave} className="flex-1 bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-emerald-700 shadow-md active:scale-95 transition-all">
                {editItem ? 'Simpan Perubahan Data' : 'Daftarkan Mitra Baru'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}