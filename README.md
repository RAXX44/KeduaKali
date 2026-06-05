<div align="center">

<img src="frontend/src/public/logo1.png" alt="KeduaKali Logo" width="120" height="120" />

# KeduaKali 

### *Platform Cerdas Penyelamat Makanan Leftover*

**Menghubungkan surplus F&B dengan konsumen melalui kecerdasan buatan —**  
**mengurangi food waste, memulihkan pendapatan mitra, menjaga bumi.**

<br/>

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-kedua--kali.vercel.app-22c55e?style=for-the-badge&labelColor=14532d)](https://kedua-kali.vercel.app)
[![Backend API](https://img.shields.io/badge/⚡_Backend_API-Railway-6366f1?style=for-the-badge&labelColor=312e81)](https://keduakali-production.up.railway.app)
[![AI Service](https://img.shields.io/badge/🤖_AI_Service-Swagger_Docs-f59e0b?style=for-the-badge&labelColor=78350f)](https://hearty-mindfulness-production-70b9.up.railway.app/docs)
[![GitHub](https://img.shields.io/badge/📁_Repository-GitHub-24292e?style=for-the-badge&logo=github)](https://github.com/paranroman/KeduaKali)

<br/>

![React](https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=flat-square&logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000000?style=flat-square&logo=express&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![TensorFlow](https://img.shields.io/badge/TensorFlow-FF6F00?style=flat-square&logo=tensorflow&logoColor=white)
![XGBoost](https://img.shields.io/badge/XGBoost-0080FF?style=flat-square&logoColor=white)

</div>

---

## 📌 Tentang KeduaKali

Indonesia membuang **23–48 juta ton makanan** setiap tahun, menyebabkan kerugian ekonomi sebesar **Rp551 triliun** dan menyumbang **7,29% emisi gas rumah kaca nasional** *(Bappenas)*.

Di balik angka itu, ada restoran dan katering yang kehilangan pendapatan setiap hari dari makanan yang tidak terjual — karena tidak ada sistem yang membantu mereka memprediksi surplus lebih awal, dan tidak ada saluran distribusi sekunder yang cukup cepat.

**KeduaKali** hadir sebagai solusi *painkiller*: platform web yang menghubungkan makanan surplus dari pelaku usaha F&B dengan konsumen, sebelum makanan tersebut benar-benar terbuang. Sistem menggunakan **prediksi surplus berbasis XGBoost** dan **rekomendasi produk hybrid (NCF + content-based)** untuk memastikan distribusi yang tepat sasaran.

> *Karena setiap produk yang terbuang adalah kerugian ganda — bagi bisnis yang kehilangan pendapatan, dan bagi lingkungan yang menanggung beban emisinya.*

---

## ✨ Fitur Utama

### 👤 Konsumen
| Fitur | Deskripsi |
|-------|-----------|
| 🔐 Autentikasi | Registrasi & login dengan JWT |
| 🛍️ Katalog Surplus | Jelajahi produk dengan filter kategori & pencarian |
| 🤖 Rekomendasi AI | Produk personal berbasis NCF + content-based filtering |
| 🛒 Keranjang | Keranjang persisten dengan validasi single-store |
| 📦 Checkout | Self-pickup dengan mock QRIS/VA |
| 📜 Riwayat | Lacak semua pesanan kamu |

### 🏪 Mitra & Admin
| Fitur | Deskripsi |
|-------|-----------|
| 📊 Dashboard | Statistik pendapatan, pesanan, & listing real-time |
| 🔮 Prediksi Surplus | Simulator XGBoost — status Kritis/Waspada/Aman + rekomendasi diskon otomatis |
| 📦 Manajemen Produk | CRUD produk surplus dengan apply-discount dari prediksi AI |
| 👥 Kelola Mitra | Superadmin: daftarkan & kelola akun mitra (RBAC penuh) |

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                    LAPISAN FRONTEND                      │
│              React + Vite  (Vercel)                      │
│         [Konsumen App]  +  [Admin/Mitra Panel]           │
└──────────────────────┬──────────────────────────────────┘
                       │  HTTP + JWT Bearer
┌──────────────────────▼──────────────────────────────────┐
│                   LAPISAN BACKEND                        │
│              Express.js REST API  (Railway)              │
│   Auth │ Products │ Transactions │ Stores │ AI Proxy     │
│                         │                                │
│                    PostgreSQL                            │
│                    (Supabase)                            │
└──────────────────────┬──────────────────────────────────┘
                       │  axios POST (server-side only)
┌──────────────────────▼──────────────────────────────────┐
│                   LAPISAN AI SERVICE                     │
│                FastAPI  (Railway)                        │
│   ┌─────────────────┐    ┌───────────────────────────┐  │
│   │  XGBoost Model  │    │  Hybrid NCF Recommender   │  │
│   │  Surplus Pred.  │    │  (Neural CF + Content)    │  │
│   └─────────────────┘    └───────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

> **Prinsip keamanan:** Frontend tidak pernah memanggil FastAPI secara langsung. Semua request AI melalui Express sebagai gateway — kredensial AI terisolasi di server.

---

## 🔄 Alur Data — Rekomendasi AI

```
Konsumen buka Beranda
        │
        ▼
React: GET /api/ai/recommendations?type=user&id=...
        │
        ▼
Express: aiController.getRecommendations()
        │
        ▼
FastAPI: POST /api/recommend  ← payload konteks (cuaca, hari, meal type, dsb.)
        │
        ▼
Hybrid Score: hybrid_similarity (60%) + NCF (35%) + surplus boost (5%)
        │
        ▼
Express: SELECT products WHERE id = ANY([12, 5, 8...]) AND stok > 0
        │
        ▼
React: Render ProductCard — Rekomendasi Ditampilkan ✨
```

---

## 🤖 Model AI

| Model | Teknologi | Fungsi | Output |
|-------|-----------|--------|--------|
| **Surplus Predictor** | XGBoost + scikit-learn | Prediksi volume penjualan & status surplus berdasarkan cuaca, hari, promo, event, harga | `Kritis` / `Waspada` / `Aman` + rekomendasi diskon % |
| **Hybrid Recommender** | Neural CF (Keras/TF) + Content-Based | Rekomendasi produk personal dengan skor gabungan | Array `product_id` terurut |

**Bobot Hybrid Recommender:**
```
Final Score = (hybrid_similarity × 0.60) + (ncf_score × 0.35) + (surplus_boost × 0.05)
```

---

## 🛠️ Tech Stack

| Lapisan | Teknologi |
|---------|-----------|
| **Frontend** | React 18, React Router v6, Vite 5, Tailwind CSS 3, Lucide React |
| **Backend** | Node.js, Express 5, PostgreSQL (`pg`), bcrypt, jsonwebtoken, axios |
| **AI Service** | Python, FastAPI, Uvicorn, XGBoost, TensorFlow/Keras, scikit-learn, pandas, NumPy, joblib |
| **Database** | PostgreSQL (Supabase — Transaction Pooler) |
| **Auth** | JWT Bearer Token, Role-Based Access Control (RBAC) |
| **Deployment** | Vercel (frontend) · Railway (backend + AI) · Supabase (database) |

---

## 🔗 Link Penting

| Layanan | URL |
|---------|-----|
| 🌐 **Frontend (Konsumen & Admin)** | https://kedua-kali.vercel.app |
| ⚡ **Backend API** | https://keduakali-production.up.railway.app |
| 🤖 **AI Service (Swagger Docs)** | https://hearty-mindfulness-production-70b9.up.railway.app/docs |
| 🤖 **Tautan Model** | [(link Model)](https://drive.google.com/drive/folders/1zS_OCQPg44pEz1S6QI9I6a-ZxcB2-5um) |
| 📊 **Dashboard Streamlit** | *[(link Streamlit)](https://dashboard-keduakali.streamlit.app/)* |
| 📓 **Main Notebook** | *[(link Colab)](https://colab.research.google.com/drive/1PlE1cknDO4sFTSZrOTNILOp2Nn2AVXCK?usp=sharing)* |
| 📋 **A/B Testing** | *[(link)](https://colab.research.google.com/drive/1xQw_ZA_2lLn0PBI94LFR9FMHV3LfzoM1?usp=sharing)* |

**Demo Admin Panel:**
```
URL      : https://kedua-kali.vercel.app/admin/login
Email    : bos@keduakali.com
Password : keduakali
```

---

## 👤 Role & Akses

```
┌─────────────────┬──────────────────────────────────────────────┐
│      Role       │                   Akses                      │
├─────────────────┼──────────────────────────────────────────────┤
│  superadmin     │  Akses penuh: CRUD semua toko, produk,       │
│                 │  mitra, pengguna, dan seluruh transaksi       │
├─────────────────┼──────────────────────────────────────────────┤
│  mitra          │  Akses terbatas pada toko sendiri:           │
│                 │  produk, pesanan, prediksi AI, laporan ESG   │
├─────────────────┼──────────────────────────────────────────────┤
│  konsumen       │  Akses katalog, checkout, riwayat pesanan    │
└─────────────────┴──────────────────────────────────────────────┘
```

---

## 🚀 Setup Lokal

### Prasyarat
- Node.js 18+
- Python 3.10+
- PostgreSQL 14+ (atau gunakan Supabase)

### 1. Clone Repository

```bash
git clone https://github.com/paranroman/KeduaKali.git
cd KeduaKali
```

### 2. Backend (Express.js)

```bash
cd backend
cp .env.example .env   # isi environment variables
npm install
npm run migrate        # setup skema database
npm run dev            # → http://localhost:5000
```

**`backend/.env`:**
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret_panjang_dan_kuat
DATABASE_URL=postgresql://user:password@localhost:5432/keduakali_db
AI_SERVICE_URL=http://localhost:8000
```

### 3. AI Service (FastAPI)

```bash
cd keduakali_ai
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
# source venv/bin/activate

pip install -r requirements.txt
python sync_db_to_ai.py     # sinkron katalog produk ke metadata AI (opsional)
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
# → http://localhost:8000/docs
```

> ⚠️ Pastikan file artefak model (`.pkl`, `.keras`, folder `artifacts_hybrid_recommender/`) sudah tersedia di `keduakali_ai/` sebelum menjalankan.

### 4. Frontend (React + Vite)

```bash
cd frontend
echo "VITE_API_URL=http://localhost:5000/api" > .env
npm install
npm run dev    # → http://localhost:5173
```

### ▶️ Urutan Menjalankan

```
1. PostgreSQL
2. Backend Express  → http://localhost:5000
3. FastAPI AI       → http://localhost:8000
4. Frontend Vite    → http://localhost:5173
```

> 💡 Jalankan `sync_db_to_ai.py` setelah menambah/mengubah produk agar rekomendasi AI memakai katalog terbaru.

---

## 📡 API Endpoints

### Auth & Users `/api/users`
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `POST` | `/register` | Publik | Registrasi konsumen |
| `POST` | `/login` | Publik | Login, return JWT |
| `POST` | `/register-mitra` | Superadmin | Buat akun mitra |
| `GET` | `/` | Superadmin | Daftar semua user |
| `DELETE` | `/:id` | Superadmin | Hapus user mitra |

### Products `/api/products`
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/` | Publik | Semua produk surplus |
| `GET` | `/:id` | Publik | Detail produk |
| `POST` | `/` | Mitra/Superadmin | Tambah produk |
| `PUT` | `/:id` | Mitra/Superadmin | Edit produk |
| `PUT` | `/:id/apply-discount` | Mitra/Superadmin | Terapkan diskon dari prediksi AI |
| `DELETE` | `/:id` | Mitra/Superadmin | Hapus produk |

### Transactions `/api/transactions`
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `POST` | `/checkout` | Konsumen | Buat pesanan, kurangi stok |
| `GET` | `/history` | Konsumen | Riwayat pesanan user |
| `GET` | `/` | Mitra/Superadmin | Semua transaksi |
| `PUT` | `/:id/status` | Mitra/Superadmin | Update status pesanan |

### AI `/api/ai`
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `POST` | `/predict` | JWT | Prediksi surplus XGBoost |
| `GET` | `/recommendations` | Publik | Rekomendasi produk hybrid |

**Query params `/recommendations`:** `type` · `id` · `restaurant_type` · `meal_type` · `weather_condition` · `day_of_week` · `is_weekend` · `has_promotion` · `special_event` · `top_k`

---

## 📁 Struktur Repositori

```
KeduaKali/
│
├── frontend/                    # React + Vite (konsumen & admin)
│   └── src/
│       ├── pages/               # Beranda, Katalog, Detail, Keranjang, dll.
│       ├── admin/pages/         # Dashboard, Prediksi, Produk, ESG, dll.
│       ├── components/          # RekomendasiAI, SurplusBanner
│       ├── context/             # AuthContext, AdminAuthContext, CartContext
│       └── services/api.js      # HTTP client terpusat (auto-inject JWT)
│
├── backend/                     # Express.js REST API
│   ├── controllers/             # Business logic per resource
│   ├── routes/                  # userRoutes, productRoutes, aiRoutes, dll.
│   ├── middlewares/             # verifyToken, verifyMitra, verifySuperAdmin
│   ├── models/                  # DB query models
│   └── database/setup.sql       # Skema awal PostgreSQL
│
├── keduakali_ai/                # FastAPI + ML Models
│   ├── app.py                   # Endpoints: /predict & /api/recommend
│   ├── xgboost_surplus_model.pkl
│   ├── scaler_numeric.pkl
│   ├── encoders_dict.pkl
│   ├── artifacts_hybrid_recommender/   # NCF model + metadata CSV
│   └── sync_db_to_ai.py         # Sinkronisasi katalog DB → AI metadata
│
├── README.md
└── ARCHITECTURE.md              # Diagram arsitektur & alur JWT lengkap
```

---

## ☁️ Deployment

| Komponen | Platform | Konfigurasi |
|----------|----------|-------------|
| **Frontend** | Vercel | Root: `frontend/` · Env: `VITE_API_URL` |
| **Backend** | Railway | Root: `backend/` · Start: `node index.js` |
| **AI Service** | Railway | Root: `keduakali_ai/` · Start: `uvicorn app:app --host 0.0.0.0 --port $PORT` |
| **Database** | Supabase | Transaction pooler port 6543, SSL aktif otomatis |

---

## 👥 Tim CC26-PSU226

**Coding Camp 2026 powered by DBS Foundation**

| Nama | Role | Learning Path |
|------|------|---------------|
| **Cantyka Laily Sabila** | AI Engineer | Artificial Intelligence |
| **Farhan Ar Rahman** | AI Engineer | Artificial Intelligence |
| **Alissya Humairah Martiasaputri** | Data Scientist | Data Science |
| **Chyntia Claudia** | Data Scientist | Data Science |
| **Abrar Naufal Fadhillah Cut** | Full-Stack Web Developer | Web Development |
| **Sabrina Filda Fannisda** | Full-Stack Web Developer | Web Development |

**Advisor:**
- [RC26-353] Muhammad Nanda Setiawan
- [RC26-308] Marthin Satrya Pasaribu

---

## 📄 Lisensi

ISC — Coding Camp 2026 powered by DBS Foundation

---

<div align="center">

Made with 💚 to reduce food waste in Indonesia

*KeduaKali — karena setiap makanan berhak mendapat kesempatan kedua.*

</div>
