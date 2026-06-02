// Semua komunikasi ke backend terpusat di sini
// Arsitektur: React (Front-End) -> Express.js (Port 5000) -> FastAPI (Port 8000)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── Helper (Otomatis bawa Token JWT) ──────────────────────────
const request = async (url, options = {}) => {
  // Front-End Customer biasanya menyimpan token dengan nama 'kk_token'
  // (Pastikan namanya sesuai dengan yang diset saat login)
  const token = localStorage.getItem('kk_token');
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }
  return res.json();
};

// ─── Products ─────────────────────────────────────────────
export const productApi = {
  getAll: () => request(`${API_URL}/products`),
  getById: (id) => request(`${API_URL}/products/${id}`),
  getByCategory: (category) => request(`${API_URL}/products?category=${category}`),
};

// ─── Rekomendasi AI (Via Jembatan Express.js) ─────────────
export const recommendApi = {
  getByProduct: async (productId) => {
    const result = await request(`${API_URL}/ai/recommendations?type=product&id=${productId}`);
    return result.data;
  },
  getByUser: async (userId) => {
    const result = await request(`${API_URL}/ai/recommendations?type=user&id=${userId}`);
    return result.data;
  },
  getColdStart: async () => {
    const result = await request(`${API_URL}/ai/recommendations?type=cold`);
    return result.data;
  }
};

// ─── Prediksi Surplus (Via Jembatan Express.js) ───────────
export const surplusApi = {
  // Untuk dijalankan di halaman Admin (Simulator XGBoost)
  predictSurplus: (restaurantData) =>
    request(`${API_URL}/ai/predict`, {
      method: 'POST',
      body: JSON.stringify(restaurantData)
    }),
};

// ─── Transactions / Orders ────────────────────────────────
export const transactionApi = {
  checkout: (checkoutData) =>
    request(`${API_URL}/transactions/checkout`, {
      method: 'POST',
      body: JSON.stringify(checkoutData)
    }),
  getHistory: () =>
    request(`${API_URL}/transactions/history`),
  getById: (id) =>
    request(`${API_URL}/transactions/${id}`),
};

// ─── Auth ─────────────────────────────────────────────────
export const authApi = {
  login: (email, password) =>
    request(`${API_URL}/users/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (nama, email, password) =>
    request(`${API_URL}/users/register`, {
      method: 'POST',
      body: JSON.stringify({ nama, email, password }),
    }),
  getProfile: () => request(`${API_URL}/users/profile`),
};

// ─── User Management (Admin) ──────────────────────────────
export const userAdminApi = {
  getAllUsers: () => request(`${API_URL}/users`, { method: 'GET' }),
};

// ─── Store / Toko Management (Admin & Mitra) ──────────────
export const storeApi = {
  getAllStores: () => request(`${API_URL}/stores`, { method: 'GET' }),
  assignMitra: (mitraUserId, storeId) =>
    request(`${API_URL}/stores/assign-mitra`, {
      method: 'POST',
      body: JSON.stringify({ mitra_user_id: mitraUserId, store_id: storeId })
    }),
  unassignMitra: (storeId) =>
    request(`${API_URL}/stores/unassign-mitra`, {
      method: 'POST',
      body: JSON.stringify({ store_id: storeId })
    })
};