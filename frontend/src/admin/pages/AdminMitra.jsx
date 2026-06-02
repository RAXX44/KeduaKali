import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  Search, Plus, X, AlertCircle, User, Mail, Phone,
  Lock, Store, CheckCircle2, Eye, EyeOff, UserCheck,
  Trash2, ShieldAlert, AlertTriangle, Link as LinkIcon, Unlink, Info
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AdminMitra() {
  const { adminToken } = useAdminAuth();
  const [mitraList, setMitraList] = useState([]);
  const [tokoList, setTokoList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Modal Unassign & Delete
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [mitraToDelete, setMitraToDelete] = useState(null);

  // Unassign State
  const [storeToUnassign, setStoreToUnassign] = useState(null);

  const [selectedMitra, setSelectedMitra] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', password: '', kontak: ''
  });

  const [assignForm, setAssignForm] = useState({ store_id: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = adminToken || localStorage.getItem('kk_token');
      const [resMitra, resToko] = await Promise.all([
        fetch(`${API_URL}/users/mitras`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/stores`)
      ]);
      const dataMitra = await resMitra.json();
      const dataToko = await resToko.json();

      if (dataMitra.status === 'success' && dataToko.status === 'success') {
        // 💡 UPGRADE LOGIKA: Gabungkan data toko ke masing-masing mitra (One-to-Many)
        const stores = dataToko.data;
        const mitrasWithStores = dataMitra.data.map(m => {
          // Cari semua toko yang user_id-nya cocok dengan ID mitra ini
          const managedStores = stores.filter(t => t.user_id === m.id || t.mitra_user_id === m.id);
          return { ...m, managedStores };
        });

        setTokoList(stores);
        setMitraList(mitrasWithStores);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDaftarMitra = async () => {
    setFormError(''); setFormSuccess('');
    if (!form.name || !form.email || !form.password) {
      setFormError('Nama, email, dan kredensial wajib dilengkapi!'); return;
    }
    if (form.password.length < 6) {
      setFormError('Standar keamanan: Sandi minimal 6 karakter!'); return;
    }

    try {
      const res = await fetch(`${API_URL}/users/register-mitra`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (res.ok) {
        setFormSuccess(`Kredensial mitra ${form.name} berhasil diotorisasi!`);
        setForm({ name: '', email: '', password: '', kontak: '' });
        fetchData();
        setTimeout(() => { setShowModal(false); setFormSuccess(''); }, 2000);
      } else {
        setFormError(data.message || 'Gagal meregistrasi entitas mitra.');
      }
    } catch (e) {
      setFormError('Integritas koneksi ke server terputus.');
    }
  };

  const handleAssignToko = async () => {
    setFormError('');
    if (!assignForm.store_id) {
      setFormError('Pilih lokasi operasional terlebih dahulu!'); return;
    }
    try {
      const token = adminToken || localStorage.getItem('kk_token');
      const res = await fetch(`${API_URL}/stores/assign-mitra`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          mitra_user_id: selectedMitra.id,
          store_id: Number(assignForm.store_id)
        })
      });
      if (res.ok) {
        fetchData();
        setShowAssignModal(false);
        setAssignForm({ store_id: '' });
      } else {
        const data = await res.json();
        setFormError(data.message || 'Gagal mendelegasikan otoritas toko.');
      }
    } catch (e) {
      setFormError('Integritas koneksi ke server terputus.');
    }
  };

  // 💡 FITUR BARU: Memutus Koneksi Toko Tanpa Menghapus Mitra
  const handleUnassignToko = async (store) => {
    if (window.confirm(`Yakin ingin memutus akses Mitra ini dari toko "${store.nama_toko}"?`)) {
      try {
        const token = adminToken || localStorage.getItem('kk_token');
        // Asumsi API Unassign (Lihat petunjuk Backend di bawah)
        const res = await fetch(`${API_URL}/stores/unassign-mitra`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ store_id: store.id })
        });

        if (res.ok) {
          fetchData(); // Refresh data
        } else {
          alert('Gagal memutus akses toko. Pastikan API unassign-mitra sudah tersedia.');
        }
      } catch (error) {
        console.error("Gagal unassign:", error);
      }
    }
  };

  const handleDeleteMitra = async () => {
    if (!mitraToDelete) return;
    try {
      const token = adminToken || localStorage.getItem('kk_token');
      const res = await fetch(`${API_URL}/users/${mitraToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
        setShowDeleteModal(false);
        setMitraToDelete(null);
        setDeleteStep(1);
      } else {
        alert("Gagal menghapus entitas mitra.");
      }
    } catch (error) {
      console.error("Error menghapus mitra:", error);
    }
  };

  const filtered = useMemo(() => {
    return mitraList.filter(m =>
      (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.email || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [mitraList, search]);

  // Cari toko yang belum dimiliki siapapun
  const tokoTersedia = useMemo(() => {
    return tokoList.filter(t => !t.user_id && !t.mitra_user_id);
  }, [tokoList]);

  return (
    <AdminLayout title="Manajemen Entitas Mitra">
      <div className="space-y-6 font-sans text-slate-800 animate-in fade-in duration-300">

        {/* ── STATS DASHBOARD ── */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { label: 'Total Kemitraan', value: mitraList.length, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
              { label: 'Mitra Aktif (Pegabg Toko)', value: mitraList.filter(m => m.managedStores.length > 0).length, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
              { label: 'Menunggu Delegasi', value: mitraList.filter(m => m.managedStores.length === 0).length, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
              { label: 'Toko Tak Bertuan', value: tokoTersedia.length, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
            ].map((s, i) => (
              <div key={i} className={`bg-white border ${s.border} rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow`}>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</p>
                <p className={`text-3xl font-black mt-1 tracking-tight ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── TOOLBAR ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-center gap-5">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-400 font-medium"
              placeholder="Pencarian ID atau Surel Mitra..."
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => { setShowModal(true); setFormError(''); setFormSuccess(''); }}
            className="w-full md:w-auto bg-slate-900 hover:bg-black text-white font-bold px-6 py-3 rounded-xl text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Otentikasi Mitra Baru
          </button>
        </div>

        {/* ── TABEL ENTITAS MITRA ── */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Entitas Kemitraan', 'Kontak Operasional', 'Daftar Cabang Toko', 'Tindakan Administratif'].map(h =>
                    <th key={h} className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="4" className="text-center py-20 text-slate-400 font-medium animate-pulse">Menarik data dari server otentikasi...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-20">
                      <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <UserCheck size={32} className="text-slate-300" />
                      </div>
                      <div className="text-slate-700 font-bold mb-1">Entitas Tidak Ditemukan</div>
                      <div className="text-slate-400 text-sm">Belum ada akun mitra yang terekam dalam sistem.</div>
                    </td>
                  </tr>
                ) : filtered.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 font-black text-base shadow-sm">
                          {m.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-900">{m.name}</div>
                          <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                            <Mail size={12}/> {m.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Phone size={14} className="text-slate-400"/>
                        {m.kontak || <span className="text-slate-300 font-normal italic">Tidak Disediakan</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {/* 💡 UPGRADE UI: Multi-Store Chips */}
                      {m.managedStores && m.managedStores.length > 0 ? (
                        <div className="flex flex-wrap gap-2 max-w-[300px]">
                          {m.managedStores.map(store => (
                            <div key={store.id} className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 pl-2.5 pr-1 py-1 rounded-lg text-xs font-bold shadow-sm transition-all group">
                              <Store size={12} className="text-blue-500" />
                              {store.nama_toko}
                              <button
                                onClick={() => handleUnassignToko(store)}
                                title="Cabut Akses Toko"
                                className="ml-1 p-1 bg-white hover:bg-red-50 hover:text-red-500 text-slate-400 rounded-md transition-colors border border-transparent hover:border-red-200"
                              >
                                <X size={12} strokeWidth={3} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg font-bold shadow-sm inline-flex items-center gap-1.5">
                          <Unlink size={14}/> Belum Terhubung Toko
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedMitra(m);
                            setAssignForm({ store_id: '' });
                            setFormError('');
                            setShowAssignModal(true);
                          }}
                          className="text-xs font-bold px-4 py-2 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-600 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
                        >
                          <LinkIcon size={14} /> Tambah Delegasi Toko
                        </button>
                        <button
                          onClick={() => { setMitraToDelete(m); setDeleteStep(1); setShowDeleteModal(true); }}
                          className="p-2 text-slate-400 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-xl transition-all shadow-sm"
                          title="Hapus Entitas Akun"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── MODAL OTORISASI MITRA BARU (SAMA SEPERTI SEBELUMNYA) ── */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-sm"><UserCheck size={18} /></div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">Otentikasi Kredensial Baru</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium uppercase tracking-widest">Akses Manajemen Mitra</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:bg-slate-200 p-2 rounded-full transition-colors"><X size={18} /></button>
            </div>

            <div className="p-6 space-y-5">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3.5 rounded-xl text-xs font-bold flex items-start gap-2 shadow-sm">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" /> <span className="leading-relaxed">{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm">
                  <CheckCircle2 size={16} /> {formSuccess}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2 tracking-widest flex items-center gap-1.5"><User size={12}/> Nama Entitas <span className="text-red-500">*</span></label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium text-slate-900" placeholder="Nama entitas operasional..." value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2 tracking-widest flex items-center gap-1.5"><Mail size={12}/> Surel Akses <span className="text-red-500">*</span></label>
                <input type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium text-slate-900" placeholder="admin@mitra.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2 tracking-widest flex items-center gap-1.5"><Lock size={12}/> Kata Sandi <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pr-12 text-sm outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium text-slate-900" placeholder="Enkripsi minimum 6 karakter" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2 tracking-widest flex items-center gap-1.5"><Phone size={12}/> Saluran Komunikasi</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-medium text-slate-900" placeholder="0812-xxxx-xxxx (opsional)" value={form.kontak} onChange={e => setForm({...form, kontak: e.target.value})} />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl text-sm hover:bg-slate-100 transition-colors shadow-sm">Batalkan</button>
              <button onClick={handleDaftarMitra} className="flex-1 bg-slate-900 text-white font-bold py-3.5 rounded-xl text-sm hover:bg-black shadow-md active:scale-95 transition-all">Otorisasi Akses</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ASSIGN TOKO MULTIPLE ── */}
      {showAssignModal && selectedMitra && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl shadow-sm"><Store size={18} /></div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">Delegasi Toko Baru</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium uppercase tracking-widest">Otoritas Kemitraan</p>
                </div>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:bg-slate-200 p-2 rounded-full transition-colors"><X size={18} /></button>
            </div>

            <div className="p-6 space-y-5">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3.5 rounded-xl text-xs font-bold flex items-start gap-2 shadow-sm">
                  <AlertCircle size={16} className="shrink-0 mt-0.5"/> <span className="leading-relaxed">{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Pilih Cabang Toko</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer transition-all font-medium text-slate-800"
                  value={assignForm.store_id}
                  onChange={e => setAssignForm({ store_id: e.target.value })}
                >
                  <option value="" disabled>-- Pilih Toko Yang Tersedia --</option>
                  {tokoTersedia.length === 0 && <option value="" disabled>Semua toko sudah terdelegasi</option>}
                  {tokoTersedia.map(t => (
                    <option key={t.id} value={t.id}>{t.nama_toko}</option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-700 font-medium flex gap-2 shadow-sm">
                <Info size={16} className="shrink-0 mt-0.5 text-blue-500" />
                <span className="leading-relaxed">
                  Mitra <strong>{selectedMitra.name}</strong> akan mendapatkan akses penuh untuk mengelola inventaris di cabang toko yang Anda pilih.
                </span>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button onClick={() => setShowAssignModal(false)} className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl text-sm hover:bg-slate-100 transition-colors shadow-sm">Batalkan</button>
              <button onClick={handleAssignToko} disabled={!assignForm.store_id} className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-xl text-sm hover:bg-blue-700 shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                Tambah Delegasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 🚨 MODAL HAPUS MITRA (DOUBLE CONFIRMATION) ── */}
      {showDeleteModal && mitraToDelete && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className={`p-6 text-center border-b ${deleteStep === 1 ? 'border-amber-100 bg-amber-50' : 'border-red-100 bg-red-50'} transition-colors duration-300`}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner ${deleteStep === 1 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                {deleteStep === 1 ? <ShieldAlert size={28} /> : <AlertTriangle size={28} />}
              </div>
              <h3 className={`text-lg font-black tracking-tight ${deleteStep === 1 ? 'text-amber-800' : 'text-red-700'}`}>
                {deleteStep === 1 ? 'Pencabutan Kredensial' : 'Peringatan Keamanan Kritis'}
              </h3>
            </div>

            <div className="p-6 text-center space-y-4">
              {deleteStep === 1 ? (
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  Anda akan mencabut akses otorisasi untuk <strong className="text-slate-900">{mitraToDelete.name}</strong>. Semua toko yang dikelola akan dikembalikan statusnya menjadi "Tak Bertuan". Lanjutkan?
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-red-600 font-black leading-relaxed">TINDAKAN INI BERSIFAT PERMANEN!</p>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Akun <strong>{mitraToDelete.name}</strong> akan dihapus selamanya dari database dan mereka akan kehilangan seluruh akses ke dashboard.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2.5">
              {deleteStep === 1 ? (
                <>
                  <button onClick={() => setDeleteStep(2)} className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm shadow-md transition-all">Ya, Lanjutkan Pencabutan</button>
                  <button onClick={() => { setShowDeleteModal(false); setDeleteStep(1); }} className="w-full py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors shadow-sm">Batalkan Operasi</button>
                </>
              ) : (
                <>
                  <button onClick={handleDeleteMitra} className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-sm shadow-md transition-all active:scale-95">Hapus Permanen Sekarang</button>
                  <button onClick={() => { setShowDeleteModal(false); setDeleteStep(1); }} className="w-full py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors shadow-sm">Aman, Jangan Hapus</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}