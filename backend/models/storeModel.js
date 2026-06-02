const pool = require('../config/db');

const getAllStores = async () => {
    const query = 'SELECT * FROM stores ORDER BY id DESC';
    const result = await pool.query(query);
    return result.rows;
};

const getStoreById = async (id) => {
    const query = 'SELECT * FROM stores WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

// 💡 DITAMBAHKAN: kontak_toko
const createStore = async (nama_toko, kategori, deskripsi, alamat, kontak_toko, waktu_buka, waktu_tutup, gambar_toko, is_active) => {
    const query = `
        INSERT INTO stores (nama_toko, kategori, deskripsi, alamat, kontak_toko, waktu_buka, waktu_tutup, gambar_toko, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
    `;
    const values = [nama_toko, kategori, deskripsi, alamat, kontak_toko, waktu_buka, waktu_tutup, gambar_toko, is_active];
    const result = await pool.query(query, values);
    return result.rows[0];
};

// 💡 DITAMBAHKAN: kontak_toko
const updateStore = async (id, nama_toko, kategori, deskripsi, alamat, kontak_toko, waktu_buka, waktu_tutup, gambar_toko, is_active) => {
    const query = `
        UPDATE stores 
        SET nama_toko = $1, kategori = $2, deskripsi = $3, alamat = $4, 
            kontak_toko = $5, waktu_buka = $6, waktu_tutup = $7, gambar_toko = $8, is_active = $9
        WHERE id = $10
        RETURNING *;
    `;
    const values = [nama_toko, kategori, deskripsi, alamat, kontak_toko, waktu_buka, waktu_tutup, gambar_toko, is_active, id];
    const result = await pool.query(query, values);
    return result.rows[0];
};

const deleteStore = async (id) => {
    const query = 'DELETE FROM stores WHERE id = $1 RETURNING *;';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

module.exports = { getAllStores, getStoreById, createStore, updateStore, deleteStore };