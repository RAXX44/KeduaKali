# KeduaKali

**KeduaKali** adalah platform surplus makanan berbasis AI yang menghubungkan mitra F&B/ritel dengan konsumen. Mitra memasarkan stok sisa (leftover) dengan harga diskon; konsumen memesan dan mengambil sendiri (self-pickup). Sistem memakai prediksi surplus (XGBoost) dan rekomendasi hybrid (Neural Collaborative Filtering + content-based) untuk mengurangi food waste dan meningkatkan penjualan.

---

## Fitur Frontend

Aplikasi konsumen dan panel admin dibangun dengan **React 18 + Vite + Tailwind CSS**. Routing diatur di `frontend/src/App.jsx`.

### Aplikasi Konsumen (`/`)

| Halaman | Rute | Deskripsi |
|---------|------|-----------|
| **Beranda** | `/` | Banner promo, kategori (F&B, ritel, bakery, dll.), daftar toko dengan status buka/tutup real-time, produk unggulan, dan widget **Rekomendasi AI** (`RekomendasiAI`). |
| **Katalog** | `/katalog` | Daftar produk surplus dengan filter kategori dan pencarian. |
| **Detail Produk** | `/produk/:id` | Informasi produk, harga diskon, stok, batas konsumsi; tambah ke keranjang. |
| **Detail Toko** | `/toko/:id` | Profil mitra, jam operasional, produk per toko. |
| **Keranjang** | `/keranjang` | Keranjang persisten (`localStorage`), kebijakan **single-store** (satu toko per checkout self-pickup), validasi stok. |
| **Checkout** | `/checkout` | Form identitas pengambilan, pilihan metode pembayaran (mock QRIS/VA), checkout ke API (wajib login). |
| **Sukses** | `/success` | Konfirmasi pesanan berhasil. |
| **Pesanan** | `/pesanan` | Riwayat transaksi konsumen. |
| **Akun** | `/akun` | Profil pengguna dan logout. |
| **Login / Register** | `/login`, `/register` | Autentikasi konsumen via JWT. |

Navigasi bawah mobile (`BottomNav`) disembunyikan di checkout, success, login, register, pesanan, detail produk, dan detail toko.

### Panel Admin & Mitra (`/admin/*`)

| Halaman | Rute | Akses | Deskripsi |
|---------|------|-------|-----------|
| **Admin Login** | `/admin/login` | Publik | Login untuk `superadmin` dan `mitra`. |
| **Dashboard** | `/admin/dashboard` | Superadmin, Mitra | Statistik pendapatan, pesanan pending, listing aktif, grafik; mitra hanya melihat data tokonya. |
| **Prediksi AI** | `/admin/prediksi` | Superadmin, Mitra | Simulator prediksi surplus XGBoost; terapkan diskon otomatis ke produk (`apply-discount`). |
| **Manajemen Toko** | `/admin/toko` | Superadmin, Mitra | Superadmin: CRUD toko & assign mitra. Mitra: edit profil toko sendiri. |
| **Produk Saya** | `/admin/produk` | Superadmin, Mitra | CRUD produk surplus; mitra terbatas pada `store_id` JWT. |
| **Pesanan Masuk** | `/admin/pesanan` | Superadmin, Mitra | Daftar transaksi & ubah status pesanan. |
| **Laporan ESG** | `/admin/laporan` | Superadmin, Mitra | Dampak lingkungan (makanan diselamatkan, emisi, air, dana). |
| **Verifikasi Mitra** | `/admin/mitra` | Superadmin saja | Daftar, daftarkan, dan hapus akun mitra. |
| **Pengguna Sistem** | `/admin/users` | Superadmin saja | Daftar semua pengguna. |
| **Pengaturan** | `/admin/pengaturan` | Superadmin, Mitra | Preferensi panel admin. |

---

## Fitur Backend

API REST **Express.js** (entry point: `backend/index.js`, port default **5000**). Prefix semua rute: `/api`.

### `GET /` (root)

Health check — respons teks/JSON bahwa API berjalan.

### `/api/users`

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/register` | Publik | Registrasi pengguna (default role: `konsumen`). |
| POST | `/login` | Publik | Login; mengembalikan JWT + data user (`store_id` untuk mitra). |
| GET | `/` | Superadmin | Daftar semua pengguna. |
| POST | `/register-mitra` | Superadmin | Buat akun mitra baru. |
| GET | `/mitras` | Superadmin | Daftar mitra beserta info toko terkait. |
| DELETE | `/:id` | Superadmin | Hapus user (mitra; superadmin tidak bisa dihapus). |

### `/api/products`

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/` | Publik | Semua produk (join info toko). |
| GET | `/:id` | Publik | Detail produk. |
| POST | `/` | Mitra / Superadmin | Tambah produk. |
| PUT | `/:id` | Mitra / Superadmin | Edit produk (mitra: hanya toko sendiri). |
| PUT | `/:id/apply-discount` | Mitra / Superadmin | Terapkan diskon & stok dari hasil prediksi AI. |
| DELETE | `/:id` | Mitra / Superadmin | Hapus produk. |

### `/api/transactions`

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/checkout` | Konsumen (JWT) | Buat pesanan, kurangi stok. |
| GET | `/history` | Konsumen (JWT) | Riwayat pesanan user. |
| GET | `/` | Mitra / Superadmin | Semua transaksi (mitra: filter per toko). |
| PUT | `/:id/status` | Mitra / Superadmin | Ubah status pesanan. |

### `/api/stores`

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/` | Publik | Daftar toko. |
| GET | `/:id` | Publik | Detail toko. |
| GET | `/my-store` | Mitra (JWT) | Toko milik mitra yang login. |
| PUT | `/my-store/:id` | Mitra (JWT) | Edit toko sendiri. |
| POST | `/` | Superadmin | Buat toko baru. |
| PUT | `/:id` | Superadmin | Edit toko. |
| DELETE | `/:id` | Superadmin | Hapus toko. |
| POST | `/assign-mitra` | Superadmin | Assign mitra ke toko. |
| POST | `/unassign-mitra` | Superadmin | Lepas mitra dari toko. |

### `/api/ai`

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/predict` | JWT | Proxy ke FastAPI `/predict` (prediksi surplus). |
| GET | `/recommendations` | Publik | Proxy ke FastAPI `/api/recommend`, enrich dengan data produk PostgreSQL. |

Query rekomendasi: `type` (`user` | `product` | `cold`), `id`, `restaurant_type`, `meal_type`, `weather_condition`, `day_of_week`, `is_weekend`, `has_promotion`, `special_event`, `extra_preferences`, `top_k`.

### Catatan

- File `backend/server.js` adalah alternatif entry dengan CORS terkonfigurasi dan mock `GET /api/recommendations`; untuk development standar gunakan `npm run dev` yang menjalankan `index.js`.
- Database: PostgreSQL via `pg` pool (`backend/config/db.js`).

---

## Fitur AI (`keduakali_ai/`)

Microservice **FastAPI** (port default **8000**) — `keduakali_ai/app.py`.

### Model & artefak

| Komponen | File / folder | Fungsi |
|----------|---------------|--------|
| **XGBoost Surplus** | `xgboost_surplus_model.pkl`, `scaler_numeric.pkl`, `encoders_dict.pkl` | Prediksi volume penjualan & status surplus (Kritis / Waspada / Aman). |
| **Hybrid Recommender** | `artifacts_hybrid_recommender/` (`.keras`, `.joblib`, `.npy`, `.csv`) | NCF + content similarity + surplus boost. |

> Artefak model (`.pkl`, `.keras`) tidak disertakan di repositori. Siapkan file tersebut di folder `keduakali_ai/` sebelum menjalankan layanan.

### Endpoint FastAPI

| Method | Path | Deskripsi |
|--------|------|-----------|
| POST | `/predict` | Prediksi surplus: status, rekomendasi diskon, breakdown faktor (cuaca, hari, promo, event, harga), estimasi CO₂ & porsi terselamatkan. |
| POST | `/api/recommend` | Rekomendasi produk hybrid (`top_k` ID produk); skor gabungan similarity (50%), NCF (30%), surplus boost (20%). |

### Utilitas

| Script | Deskripsi |
|--------|-----------|
| `sync_db_to_ai.py` | Sinkronkan produk PostgreSQL → `artifacts_hybrid_recommender/hybrid_item_metadata.csv` agar rekomendasi selaras dengan katalog live. |

---

## Tech Stack

| Lapisan | Teknologi |
|---------|-----------|
| **Frontend** | React 18, React Router v6, Vite 5, Tailwind CSS 3, Lucide React |
| **Backend** | Node.js, Express 5, PostgreSQL (`pg`), bcrypt, jsonwebtoken, axios, cors, dotenv |
| **AI** | Python, FastAPI, Uvicorn, XGBoost, scikit-learn, TensorFlow/Keras, pandas, NumPy, joblib |
| **Database** | PostgreSQL |
| **Auth** | JWT (Bearer), role-based access control |
| **DevOps (opsional)** | Vercel-ready export di `backend/index.js` (`NODE_ENV=production`) |

---

## Environment Variables

Buat file `.env` di folder masing-masing (jangan di-commit; sudah ada di `.gitignore`).

### `backend/.env`

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=ubah_dengan_string_rahasia_panjang

# PostgreSQL (pilih connection string ATAU parameter terpisah)
DATABASE_URL=postgresql://user:password@localhost:5432/keduakali_db
DB_USER=postgres
DB_HOST=localhost
DB_NAME=keduakali_db
DB_PASSWORD=your_password
DB_PORT=5432

# AI Microservice
AI_SERVICE_URL=http://localhost:8000
# alias yang juga didukung:
# FASTAPI_URL=http://localhost:8000
```

SSL database: otomatis **nonaktif** jika `DB_HOST=localhost`, selain itu SSL dengan `rejectUnauthorized: false`.

### `frontend/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

### `keduakali_ai/` (sinkronisasi DB)

Sesuaikan kredensial di `sync_db_to_ai.py` dengan database backend Anda, atau refactor ke variabel lingkungan:

```env
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=keduakali_db
```

---

## Cara Setup & Menjalankan Project

### Prasyarat

- **Node.js** 18+
- **PostgreSQL** 14+
- **Python** 3.10+ (untuk layanan AI)
- Artefak model AI (lihat bagian Fitur AI)

### 1. Database

```bash
# Buat database di PostgreSQL
createdb keduakali_db

# Jalankan migrasi skema awal
cd backend
npm install
npm run migrate
```

Skema dasar ada di `backend/database/setup.sql`. Untuk produksi, tambahkan kolom yang dipakai kode (mis. `stores.user_id`, `users.kontak`, `transactions.quantity`, `products.gambar_produk`) jika belum ada setelah migrasi awal.

Buat akun **superadmin** secara manual di tabel `users` (password di-hash bcrypt) atau lewat registrasi lalu ubah `role` di database.

### 2. Backend (Express)

```bash
cd backend
cp .env.example .env   # jika ada; atau buat .env manual
npm install
npm run dev            # nodemon → http://localhost:5000
```

Verifikasi: buka `http://localhost:5000` — harus menampilkan pesan API running.

### 3. AI Service (FastAPI)

```bash
cd keduakali_ai
python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt

# Pastikan file model .pkl dan folder artifacts_hybrid_recommender lengkap
python sync_db_to_ai.py   # opsional: sinkron katalog ke metadata AI

uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

Dokumentasi interaktif API: `http://localhost:8000/docs`

### 4. Frontend (React)

```bash
cd frontend
# buat .env dengan VITE_API_URL
npm install
npm run dev            # http://localhost:5173
```

| URL | Peran |
|-----|-------|
| http://localhost:5173 | Aplikasi konsumen |
| http://localhost:5173/admin/login | Panel admin / mitra |
| http://localhost:5000/api | REST API |
| http://localhost:8000 | AI microservice |

### Urutan menjalankan (disarankan)

1. PostgreSQL  
2. Backend Express  
3. FastAPI AI  
4. Frontend Vite  

Jalankan `sync_db_to_ai.py` setelah menambah/mengubah produk agar rekomendasi AI memakai katalog terbaru.

### Build production (frontend)

```bash
cd frontend
npm run build
npm run preview
```

---

## Struktur Repositori (ringkas)

```
keduakali_app/
├── frontend/          # React + Vite (konsumen & admin)
├── backend/           # Express API + PostgreSQL
├── keduakali_ai/      # FastAPI + model ML
├── README.md
└── ARCHITECTURE.md    # Diagram arsitektur & alur JWT
```

Detail arsitektur, alur data, peran pengguna, dan autentikasi JWT: lihat **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

---

## Lisensi

ISC (sesuai `package.json` backend). Sesuaikan jika proyek dipublikasikan secara resmi.
