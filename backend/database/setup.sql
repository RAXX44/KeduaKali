-- KeduaKali Database Schema
-- Skema ini sesuai dengan database aktual (di-export dari PostgreSQL lokal)
-- Gunakan file ini untuk setup database baru (Supabase, RDS, dll.)

-- Reset tabel jika ada (urutan penting karena ada foreign key)
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ──────────────────────────────────────────────
-- USERS
-- role: 'konsumen' | 'mitra' | 'superadmin'
-- ──────────────────────────────────────────────
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'konsumen',
    kontak VARCHAR(20)
);

-- ──────────────────────────────────────────────
-- STORES
-- user_id → mitra yang di-assign ke toko ini
-- ──────────────────────────────────────────────
CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    nama_toko VARCHAR(150) NOT NULL,
    kategori VARCHAR(50) DEFAULT 'F&B',
    deskripsi TEXT,
    alamat TEXT,
    waktu_buka TIME NOT NULL,
    waktu_tutup TIME NOT NULL,
    gambar_toko TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    kontak_toko VARCHAR(50),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- ──────────────────────────────────────────────
-- PRODUCTS
-- kondisi: 'leftover' | 'imperfect' | 'near-expired' | 'canceled'
-- batas_konsumsi: jam batas aman konsumsi (contoh: '22:00')
-- ──────────────────────────────────────────────
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
    nama_produk VARCHAR(150) NOT NULL,
    kategori VARCHAR(50) DEFAULT 'Makanan',
    kondisi VARCHAR(50) DEFAULT 'leftover',
    harga INTEGER NOT NULL,
    harga_asli INTEGER,
    diskon VARCHAR(10),
    deskripsi TEXT,
    stok INTEGER DEFAULT 0,
    emoji VARCHAR(10) DEFAULT '📦',
    gambar_produk TEXT,
    batas_konsumsi VARCHAR(10)
);

-- ──────────────────────────────────────────────
-- TRANSACTIONS
-- status: 'Sedang Diproses' | 'Dikemas' | 'Dikirim' | 'Selesai' | 'Dibatalkan'
-- payment_method: 'ewallet' | 'bank' | 'qris' | 'transfer' | 'cash'
-- ──────────────────────────────────────────────
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    total_harga INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'Sedang Diproses',
    payment_method VARCHAR(50) DEFAULT NULL,  
    shipping_address TEXT DEFAULT NULL,       
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ──────────────────────────────────────────────
-- SUPERADMIN SEED
-- Ganti password hash ini dengan bcrypt hash dari password kamu
-- Hash di bawah = 'keduakali' (generate ulang untuk production!)
-- Cara generate: node -e "require('bcrypt').hash('password_kamu',10).then(console.log)"
-- ──────────────────────────────────────────────
-- INSERT INTO users (name, email, password, role)
-- VALUES ('Super Admin', 'admin@keduakali.com', '$2b$10$HASH_DISINI', 'superadmin');