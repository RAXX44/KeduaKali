DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'konsumen'
);

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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
    emoji VARCHAR(10) DEFAULT '📦'
);

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    total_harga INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);