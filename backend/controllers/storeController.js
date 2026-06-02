const { getAllStores, getStoreById, createStore, updateStore, deleteStore } = require('../models/storeModel');
const pool = require('../config/db');

const getStores = async (req, res) => {
  try {
    const stores = await getAllStores();
    res.status(200).json({ status: 'success', data: stores });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const getStoreDetail = async (req, res) => {
  try {
    const store = await getStoreById(req.params.id);
    if (!store) return res.status(404).json({ message: 'Toko tidak ditemukan!' });
    res.status(200).json({ status: 'success', data: store });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const addStore = async (req, res) => {
  try {
    const { nama_toko, kategori, deskripsi, alamat, kontak_toko, waktu_buka, waktu_tutup, gambar_toko, is_active } = req.body;
    if (!nama_toko || !waktu_buka || !waktu_tutup) {
      return res.status(400).json({ message: 'Nama Toko, Waktu Buka, dan Waktu Tutup wajib diisi!' });
    }
    const newStore = await createStore(
      nama_toko, kategori || 'F&B', deskripsi || '', alamat || '',
      kontak_toko || '', waktu_buka, waktu_tutup, gambar_toko || '', is_active ?? true
    );
    res.status(201).json({ status: 'success', message: 'Toko berhasil ditambahkan!', data: newStore });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const editStore = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_toko, kategori, deskripsi, alamat, kontak_toko, waktu_buka, waktu_tutup, gambar_toko, is_active } = req.body;
    const updated = await updateStore(id, nama_toko, kategori, deskripsi, alamat, kontak_toko || '', waktu_buka, waktu_tutup, gambar_toko, is_active);
    if (!updated) return res.status(404).json({ message: 'Toko tidak ditemukan!' });
    res.status(200).json({ status: 'success', message: 'Data toko diperbarui!', data: updated });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const removeStore = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteStore(id);
    if (!deleted) return res.status(404).json({ message: 'Toko tidak ditemukan!' });
    res.status(200).json({ status: 'success', message: 'Toko berhasil dihapus!' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

// ── BARU: Admin assign toko ke mitra ──
const assignStoreToMitra = async (req, res) => {
  try {
    const { mitra_user_id, store_id } = req.body;
    if (!mitra_user_id || !store_id) {
      return res.status(400).json({ message: 'mitra_user_id dan store_id wajib diisi!' });
    }

    // Cek mitra valid
    const mitraCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND role = $2',
      [mitra_user_id, 'mitra']
    );
    if (mitraCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User mitra tidak ditemukan!' });
    }

    // Assign toko ke mitra
    const result = await pool.query(
      'UPDATE stores SET user_id = $1 WHERE id = $2 RETURNING *',
      [mitra_user_id, store_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Toko tidak ditemukan!' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Toko berhasil di-assign ke mitra!',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error assign store:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

// ── BARU: Mitra lihat & edit toko MILIKNYA SENDIRI ──
const getMitraStore = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM stores WHERE user_id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Anda belum memiliki toko. Hubungi admin.' });
    }
    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const editMitraStore = async (req, res) => {
  try {
    const userId = req.user.id;

    // Cek apakah toko ini milik mitra yang login
    const storeCheck = await pool.query(
      'SELECT id FROM stores WHERE id = $1 AND user_id = $2',
      [req.params.id, userId]
    );
    if (storeCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Anda tidak punya akses ke toko ini!' });
    }

    const { nama_toko, kategori, deskripsi, alamat, kontak_toko, waktu_buka, waktu_tutup, gambar_toko } = req.body;
    const result = await pool.query(
      `UPDATE stores SET nama_toko=$1, kategori=$2, deskripsi=$3, alamat=$4,
       kontak_toko=$5, waktu_buka=$6, waktu_tutup=$7, gambar_toko=$8
       WHERE id=$9 RETURNING *`,
      [nama_toko, kategori, deskripsi, alamat, kontak_toko, waktu_buka, waktu_tutup, gambar_toko, req.params.id]
    );

    res.status(200).json({ status: 'success', message: 'Toko berhasil diupdate!', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

// Di backend/controllers/storeController.js
const unassignMitra = async (req, res) => {
  try {
    const { store_id } = req.body;
    // Hapus kepemilikan tanpa menghapus tokonya
    await pool.query('UPDATE stores SET user_id = NULL WHERE id = $1', [store_id]);
    res.status(200).json({ status: 'success', message: 'Delegasi toko berhasil diputus' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Gagal memutus delegasi toko' });
  }
};

module.exports = { getStores, getStoreDetail, addStore, editStore, removeStore, assignStoreToMitra, getMitraStore, editMitraStore, unassignMitra };