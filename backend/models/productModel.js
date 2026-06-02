const pool = require('../config/db');

// 1. Ambil semua produk
const getAllProducts = async () => {
    const query = `
        SELECT p.*, s.nama_toko, s.waktu_tutup 
        FROM products p
        LEFT JOIN stores s ON p.store_id = s.id
        ORDER BY p.id DESC
    `;
    const result = await pool.query(query);
    return result.rows;
};

// 2. Ambil detail satu produk
const getProductById = async (id) => {
    const query = `
        SELECT p.*, s.nama_toko, s.waktu_tutup 
        FROM products p
        LEFT JOIN stores s ON p.store_id = s.id
        WHERE p.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

// 3. Tambah produk baru (💡 DITAMBAHKAN: gambar_produk, batas_konsumsi)
const createProduct = async (store_id, nama_produk, kategori, kondisi, harga, harga_asli, diskon, deskripsi, stok, emoji, gambar_produk, batas_konsumsi) => {
    const query = `
        INSERT INTO products (store_id, nama_produk, kategori, kondisi, harga, harga_asli, diskon, deskripsi, stok, emoji, gambar_produk, batas_konsumsi)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *;
    `;
    const values = [store_id, nama_produk, kategori, kondisi, harga, harga_asli, diskon, deskripsi, stok, emoji, gambar_produk, batas_konsumsi];
    const result = await pool.query(query, values);
    return result.rows[0];
};

// 4. Update data produk (💡 DITAMBAHKAN: gambar_produk, batas_konsumsi)
const updateProduct = async (id, store_id, nama_produk, kategori, kondisi, harga, harga_asli, diskon, deskripsi, stok, emoji, gambar_produk, batas_konsumsi) => {
    const query = `
        UPDATE products 
        SET store_id = $1, nama_produk = $2, kategori = $3, kondisi = $4, 
            harga = $5, harga_asli = $6, diskon = $7, deskripsi = $8, stok = $9, 
            emoji = $10, gambar_produk = $11, batas_konsumsi = $12
        WHERE id = $13
        RETURNING *;
    `;
    const values = [store_id, nama_produk, kategori, kondisi, harga, harga_asli, diskon, deskripsi, stok, emoji, gambar_produk, batas_konsumsi, id];
    const result = await pool.query(query, values);
    return result.rows[0];
};

const deleteProduct = async (id) => {
    const query = 'DELETE FROM products WHERE id = $1 RETURNING *;';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

module.exports = { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct };