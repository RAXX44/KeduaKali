import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Mengambil URL Backend dari file .env (http://localhost:5000/api)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('kk_token') || null);
  const [loading, setLoading] = useState(true);

  // Cek token saat app pertama load (Biar user gak perlu login ulang tiap refresh)
  useEffect(() => {
    const savedToken = localStorage.getItem('kk_token');
    const savedUser = localStorage.getItem('kk_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Tembak API Login beneran ke Express.js (Port 5000)
    const res = await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await res.json();

    if (!res.ok || data.status === 'error') {
      throw new Error(data.message || 'Email atau password salah');
    }

    // Kalau sukses, simpan Token JWT dan data user dari database
    const loggedInUser = data.user || { email }; 
    setUser(loggedInUser);
    setToken(data.token);
    
    // Simpan di browser agar token tidak hilang
    localStorage.setItem('kk_token', data.token);
    localStorage.setItem('kk_user', JSON.stringify(loggedInUser));
  };

  const register = async (nama, email, password) => {
    // Tembak API Register beneran ke Express.js
    const res = await fetch(`${BASE_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // UBAH BARIS DI BAWAH INI: Kita kirimkan 'name' (diisi dari variabel nama)
      body: JSON.stringify({ name: nama, email, password }), 
    });
        
    const data = await res.json();

    if (!res.ok || data.status === 'error') {
      throw new Error(data.message || 'Registrasi gagal');
    }

    // Setelah register berhasil, langsung otomatis loginkan usernya
    await login(email, password);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('kk_token');
    localStorage.removeItem('kk_user');
  };

  // Helper Ajaib: Nanti dipakai waktu Checkout biar Token JWT otomatis nempel
  const authFetch = (url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
        ...options.headers,
      },
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);