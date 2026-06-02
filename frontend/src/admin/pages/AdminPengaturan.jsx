import { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useAdminAuth } from '../../context/AdminAuthContext';
// 💡 PERBAIKAN: Menambahkan 'Settings' ke dalam daftar import lucide-react
import { User, Bell, Clock, Smartphone, Shield, Edit3, Settings } from 'lucide-react';

export default function AdminPengaturan() {
  const { admin } = useAdminAuth();

  // State untuk membuat toggle benar-benar interaktif
  const [settings, setSettings] = useState({
    notifSound: true,
    autoReject: false,
    dataSaver: false,
    twoFactorAuth: true
  });

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AdminLayout title="Pengaturan Sistem">
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
        
        {/* Profile Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 text-3xl font-black border border-emerald-100 shrink-0 shadow-sm">
            {admin?.nama?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-gray-900 text-2xl font-black tracking-tight">{admin?.nama || 'Administrator'}</h2>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-1 mb-4">
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                Superadmin Role
              </span>
              <span className="text-gray-500 text-sm font-medium">{admin?.email || 'admin@keduakali.com'}</span>
            </div>
          </div>
          <button className="w-full md:w-auto bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm">
            <Edit3 size={16} /> Edit Profil
          </button>
        </div>

        {/* Operational Preferences */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-gray-900 font-bold text-lg flex items-center gap-2">
              <Settings size={20} className="text-emerald-600" /> Preferensi Operasional
            </h3>
            <p className="text-gray-500 text-xs mt-1">Atur bagaimana sistem menangani pesanan dan antarmuka.</p>
          </div>
          
          <div className="divide-y divide-gray-100">
            {/* Setting 1 */}
            <div className="p-6 flex justify-between items-center hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0"><Bell size={20} /></div>
                <div>
                  <div className="text-gray-900 font-bold text-sm">Notifikasi Suara Pesanan</div>
                  <div className="text-gray-500 text-xs mt-1">Bunyikan nada 'ding' saat ada pesanan baru masuk di dashboard.</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                <input type="checkbox" className="sr-only peer" checked={settings.notifSound} onChange={() => toggleSetting('notifSound')} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Setting 2 */}
            <div className="p-6 flex justify-between items-center hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0"><Clock size={20} /></div>
                <div>
                  <div className="text-gray-900 font-bold text-sm">Auto-Reject Lewat Jam Operasional</div>
                  <div className="text-gray-500 text-xs mt-1">Sistem akan menolak pesanan otomatis jika masuk saat toko mitra sudah tutup.</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                <input type="checkbox" className="sr-only peer" checked={settings.autoReject} onChange={() => toggleSetting('autoReject')} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Setting 3 */}
            <div className="p-6 flex justify-between items-center hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg shrink-0"><Smartphone size={20} /></div>
                <div>
                  <div className="text-gray-900 font-bold text-sm">Mode Hemat Data</div>
                  <div className="text-gray-500 text-xs mt-1">Matikan load gambar produk di tabel untuk performa aplikasi yang lebih cepat.</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                <input type="checkbox" className="sr-only peer" checked={settings.dataSaver} onChange={() => toggleSetting('dataSaver')} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Security Preferences */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-gray-900 font-bold text-lg flex items-center gap-2">
              <Shield size={20} className="text-emerald-600" /> Keamanan & Akses
            </h3>
          </div>
          <div className="p-6 flex justify-between items-center hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-gray-100 text-gray-600 rounded-lg shrink-0"><User size={20} /></div>
              <div>
                <div className="text-gray-900 font-bold text-sm">Autentikasi Dua Faktor (2FA)</div>
                <div className="text-gray-500 text-xs mt-1">Amankan akun administrator Anda dengan verifikasi langkah ganda.</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
              <input type="checkbox" className="sr-only peer" checked={settings.twoFactorAuth} onChange={() => toggleSetting('twoFactorAuth')} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}