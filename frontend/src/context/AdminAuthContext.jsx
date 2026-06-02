import { createContext, useContext, useState, useEffect } from 'react';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [adminToken, setAdminToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('kk_token');
    const savedAdmin = localStorage.getItem('kk_admin');

    if (savedToken && savedAdmin) {
      const parsed = JSON.parse(savedAdmin);
      // ✅ Hanya load kalau role valid
      if (['superadmin', 'mitra'].includes(parsed.role)) {
        setAdmin(parsed);
        setAdminToken(savedToken);
      } else {
        localStorage.removeItem('kk_token');
        localStorage.removeItem('kk_admin');
      }
    }
    setLoading(false);
  }, []);

  const adminLogin = (userData, token) => {
    setAdmin(userData);
    setAdminToken(token);
    localStorage.setItem('kk_admin', JSON.stringify(userData));
    // kk_token sudah disimpan di AdminLogin.jsx
  };

  const adminLogout = () => {
    setAdmin(null);
    setAdminToken(null);
    localStorage.removeItem('kk_token');
    localStorage.removeItem('kk_admin');
  };

  return (
    <AdminAuthContext.Provider value={{ admin, adminToken, loading, adminLogin, adminLogout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);