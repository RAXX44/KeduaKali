import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../components/AdminLayout';
import { userAdminApi } from '../../services/api';
import {
  Users, Mail, Shield, ShieldCheck, User,
  Search, Filter, X, Ban, CheckCircle2, AlertTriangle
} from 'lucide-react';

export default function AdminDaftarPengguna() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Fitur Pencarian & Filter
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('semua');

  // State untuk Modal Detail
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await userAdminApi.getAllUsers();
        if (response.status === 'success') {
          // Simulasi field is_active jika dari backend belum ada
          const mappedUsers = response.data.map(u => ({
            ...u,
            is_active: u.is_active !== undefined ? u.is_active : true
          }));
          setUsers(mappedUsers);
        }
      } catch (err) {
        console.error("Gagal mengambil data user:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Logika Pencarian dan Filter
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (u.email || '').toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'semua' || (u.role || 'konsumen') === roleFilter;
      return matchSearch && matchRole;
    });
  }, [search, roleFilter, users]);

  // Fungsi Simulasi Soft Delete (Hanya UI untuk saat ini)
  const toggleUserStatus = () => {
    if (!selectedUser) return;
    if (selectedUser.role === 'superadmin') {
      alert("Peringatan: Anda tidak dapat menonaktifkan sesama Super Admin!");
      return;
    }

    // Update state lokal untuk demonstrasi UI
    const updatedStatus = !selectedUser.is_active;
    setUsers(users.map(u => u.id === selectedUser.id ? { ...u, is_active: updatedStatus } : u));
    setSelectedUser({ ...selectedUser, is_active: updatedStatus });

    // TODO: Nanti sambungkan ke API PUT /api/users/:id/status
    console.log(`User ${selectedUser.id} status diubah menjadi: ${updatedStatus ? 'Aktif' : 'Banned'}`);
  };

  return (
    <AdminLayout title="Manajemen Pengguna">
      <div className="space-y-6 animate-in fade-in duration-500">

        {/* ── HEADER & STATISTIK ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <Users size={24} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Daftar Pengguna Sistem</h2>
              <p className="text-sm text-gray-500 font-medium mt-0.5">Pantau dan kelola entitas yang terdaftar di ekosistem.</p>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl text-center flex-1 md:flex-none">
              <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Aktif</span>
              <span className="block text-xl font-black text-emerald-700">{users.filter(u => u.is_active).length}</span>
            </div>
            <div className="bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl text-center flex-1 md:flex-none">
              <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total User</span>
              <span className="block text-xl font-black text-gray-900">{users.length}</span>
            </div>
          </div>
        </div>

        {/* ── TOOLBAR PENCARIAN & FILTER ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama atau email pengguna..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>
          <div className="relative sm:w-48 shrink-0">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-gray-700 outline-none focus:border-emerald-500 cursor-pointer appearance-none"
            >
              <option value="semua">Semua Peran</option>
              <option value="konsumen">Konsumen</option>
              <option value="mitra">Mitra Toko</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>
        </div>

        {/* ── TABEL DATA ── */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px] border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Informasi Pengguna</th>
                  <th className="px-6 py-4">Peran Akses</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-16 text-gray-400 font-bold animate-pulse">Menarik data pengguna...</td></tr>
                ) : error ? (
                  <tr><td colSpan="5" className="text-center py-16 text-red-500 font-bold">Gagal memuat data. Periksa koneksi backend.</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-16 text-gray-400 font-bold">Tidak ada pengguna yang cocok dengan pencarian.</td></tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className={`transition-colors ${u.is_active ? 'hover:bg-gray-50' : 'bg-red-50/30 opacity-75'}`}>
                      <td className="px-6 py-4 font-mono font-bold text-gray-400 text-xs">#{String(u.id).padStart(4, '0')}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black border shrink-0 ${
                            u.is_active ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-red-100 text-red-600 border-red-200'
                          }`}>
                            {u.name ? u.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <div className={`font-bold ${u.is_active ? 'text-gray-900' : 'text-red-700'}`}>{u.name || 'Tanpa Nama'}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Mail size={12} /> {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          u.role === 'superadmin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          u.role === 'mitra' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-sky-50 text-sky-700 border-sky-200'
                        }`}>
                          {u.role === 'superadmin' ? <ShieldCheck size={12} /> : u.role === 'mitra' ? <Shield size={12} /> : <User size={12} />}
                          {u.role || 'konsumen'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {u.is_active ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-1 rounded-md font-bold uppercase flex items-center justify-center gap-1 w-fit mx-auto">
                            <CheckCircle2 size={12} /> Aktif
                          </span>
                        ) : (
                          <span className="text-[10px] bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-md font-bold uppercase flex items-center justify-center gap-1 w-fit mx-auto">
                            <Ban size={12} /> Banned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="text-xs font-bold text-gray-600 hover:text-emerald-700 bg-white border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 px-4 py-2 rounded-lg transition-all shadow-sm active:scale-95"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── MODAL DETAIL PENGGUNA ── */}
        {selectedUser && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">

              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-black text-gray-900 flex items-center gap-2">
                  <User size={18} className="text-emerald-600"/> Detail Akun
                </h3>
                <button onClick={() => setSelectedUser(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4 border-b border-dashed border-gray-200 pb-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black border-2 shrink-0 ${
                    selectedUser.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                  }`}>
                    {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 leading-tight">{selectedUser.name || 'Tanpa Nama'}</h2>
                    <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5 mt-1">
                      <Mail size={14} /> {selectedUser.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">ID Sistem</p>
                    <p className="font-mono text-sm font-bold text-gray-700">#{String(selectedUser.id).padStart(4, '0')}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Hak Akses</p>
                    <p className="text-sm font-bold text-gray-900 capitalize">{selectedUser.role || 'Konsumen'}</p>
                  </div>
                </div>

                {/* Zona Bahaya: Soft Delete Toggle */}
                <div className="bg-red-50/50 border border-red-100 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-black text-red-800 mb-1 flex items-center gap-1.5">
                        <AlertTriangle size={16}/> Zona Keamanan
                      </h4>
                      <p className="text-xs text-red-600 font-medium leading-relaxed">
                        Membekukan akun akan mencegah pengguna ini untuk login. Data riwayat transaksi mereka akan tetap aman di database.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1 shadow-sm rounded-full">
                      <input type="checkbox" className="sr-only peer" checked={!selectedUser.is_active} onChange={toggleUserStatus} />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>
                </div>

              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                <button onClick={() => setSelectedUser(null)} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors shadow-md active:scale-[0.98]">
                  Tutup Panel
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}