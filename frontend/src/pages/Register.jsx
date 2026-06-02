import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Leaf, User, Mail, Lock, ShieldCheck,
  Eye, EyeOff, AlertCircle, Loader2, ArrowLeft
} from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({ nama: '', email: '', password: '', konfirmasi: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama || !form.email || !form.password || !form.konfirmasi) {
      setError('Semua form isian wajib dilengkapi');
      return;
    }
    if (form.password !== form.konfirmasi) {
      setError('Password dan konfirmasi password tidak cocok');
      return;
    }
    if (form.password.length < 8) {
      setError('Keamanan kurang: Password minimal 8 karakter');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(form.nama, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Pendaftaran gagal, silakan coba beberapa saat lagi');
    } finally {
      setLoading(false);
    }
  };

  // Simulasi SSO Loading
  const [googleLoading, setGoogleLoading] = useState(false);
  const handleGoogleRegister = () => {
    setGoogleLoading(true);
    setTimeout(() => {
      setGoogleLoading(false);
      alert('Integrasi Google Auth akan segera hadir!');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative overflow-hidden">

      {/* ── FLOATING BACK BUTTON ── */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 z-50 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors shadow-sm"
      >
        <ArrowLeft size={20} strokeWidth={2.5} />
      </button>

      {/* ── HERO HEADER ── */}
      <div className="relative bg-gradient-to-br from-[#064E3B] via-[#047857] to-[#10B981] pt-20 pb-28 px-6 text-center text-white overflow-hidden">
        {/* Dekorasi Latar Glowing */}
        <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center">
          {/* Efek Floating pada Logo */}
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md border border-white/30 rounded-[1.25rem] flex items-center justify-center shadow-inner mb-4 animate-[bounce_3s_ease-in-out_infinite]">
            <Leaf size={32} className="text-white" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-1">Bergabung Bersama</h1>
          <p className="text-sm text-emerald-100 font-medium max-w-xs leading-relaxed">
            Jadilah bagian dari gerakan menyelamatkan makanan dan bumi kita.
          </p>
        </div>
      </div>

      {/* ── FORM CARD ── */}
      <div className="flex-1 w-full max-w-md mx-auto px-5 relative z-20 -mt-16 pb-10">
        <div className="bg-white rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-gray-100 p-6 md:p-8">

          <div className="mb-6">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Buat Akun Baru</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Isi data diri kamu</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-xl px-4 py-3 mb-5 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ── SSO REGISTER (Wow Factor) ── */}
          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={googleLoading}
            className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-3 transition-all shadow-sm active:scale-95 mb-6"
          >
            {googleLoading ? (
              <Loader2 size={20} className="animate-spin text-emerald-600" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Daftar dengan Google
              </>
            )}
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-100"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Atau gunakan email</span>
            <div className="flex-1 h-px bg-gray-100"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Input Nama */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Nama Lengkap</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input
                  type="text"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-gray-800 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                  placeholder="Nama pahlawanmu"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                />
              </div>
            </div>

            {/* Input Email */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input
                  type="email"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-gray-800 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                  placeholder="email@contoh.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-12 py-3.5 text-sm text-gray-800 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                  placeholder="Minimal 8 karakter"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors p-1"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Input Konfirmasi Password */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Konfirmasi Password</label>
              <div className="relative group">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-12 py-3.5 text-sm text-gray-800 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                  placeholder="Ulangi password di atas"
                  value={form.konfirmasi}
                  onChange={(e) => setForm({ ...form, konfirmasi: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors p-1"
                >
                  {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-[#047857] to-[#10B981] hover:from-[#064E3B] hover:to-[#047857] active:scale-[0.98] shadow-emerald-500/30'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Menyiapkan Akun...
                  </>
                ) : (
                  'Mulai Misi Penyelamatan'
                )}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500 font-medium">
              Sudah memiliki akun KeduaKali?{' '}
              <Link to="/login" className="text-emerald-600 font-black hover:text-emerald-800 transition-colors">
                Masuk di sini
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}