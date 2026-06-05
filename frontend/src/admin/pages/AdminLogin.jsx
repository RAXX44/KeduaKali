import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { authApi } from '../../services/api';
import { Mail, Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react';
// ── IMPORT LOGO BERSAMA ──
import logo1 from '../../public/logo1.png';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { adminLogin } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await authApi.login(email, password);

      // ✅ Hanya superadmin dan mitra yang boleh masuk
      if (!data.user || !['superadmin', 'mitra'].includes(data.user.role)) {
        throw new Error('Akses Ditolak! Hanya Super Admin dan Mitra yang diizinkan.');
      }

      // ✅ Simpan ke localStorage
      localStorage.setItem('kk_token', data.token);
      localStorage.setItem('kk_admin', JSON.stringify(data.user));

      // ✅ Simpan ke context — hanya dipanggil SEKALI
      adminLogin(data.user, data.token);

      navigate('/admin/dashboard');

    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || 'Kredensial tidak valid. Periksa email dan sandi Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    /* ✅ KEMBALI KE ASLI: Background gelap asli Workspace */
    <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* ✅ KEMBALI KE ASLI: Card gelap transparan */}
      <div className="w-full max-w-md bg-[#11141A]/80 backdrop-blur-xl border border-gray-800 rounded-[2rem] p-8 md:p-10 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          
          {/* ✅ REVISI: Menggunakan warna background gradien yang sebelumnya dengan logo1 */}
          <div className="w-16 h-16 bg-[#047857] rounded-2xl mx-auto flex items-center justify-center shadow-[0_8px_25px_rgba(4,120,87,0.4)] mb-4 border border-emerald-500/30 p-1">
            <img 
              src={logo1} 
              alt="Logo KeduaKali" 
              className="w-full h-full object-contain" 
            />
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight mb-1">KeduaKali Workspace</h1>
          <p className="text-sm text-gray-500 font-medium">Platform Operasional & Prediksi AI</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-bold flex items-start gap-2 animate-in slide-in-from-top-2">
            <ShieldAlert size={18} className="flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0B0E14] border border-gray-800 rounded-xl pl-11 pr-4 py-3.5 text-white text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-gray-600"
                placeholder="admin@keduakali.com"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0B0E14] border border-gray-800 rounded-xl pl-11 pr-12 py-3.5 text-white text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-gray-600"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-emerald-400 transition-colors p-1 outline-none"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full font-bold py-4 rounded-xl text-sm transition-all shadow-lg mt-4 ${
              loading
                ? 'bg-emerald-900 text-emerald-500 cursor-not-allowed animate-pulse'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 active:scale-[0.98] shadow-[0_4px_20px_rgba(16,185,129,0.3)]'
            }`}
          >
            {loading ? 'Mengautentikasi...' : 'Masuk ke Workspace'}
          </button>
        </form>
      </div>
    </div>
  );
}