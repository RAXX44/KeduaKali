const pool = require('../config/db');
const {
  createTransaction,
  getTransactionsByUser,
  getAllTransactionsData,
  updateTransactionStatus
} = require('../models/transactionModel');

const checkout = async (req, res) => {
  try {
    const { product_id, total_harga, quantity } = req.body;
    const user_id = req.user.id;

    if (!product_id || total_harga === undefined) {
      return res.status(400).json({ message: 'Product ID dan Total Harga wajib diisi!' });
    }

    const qty = Number(quantity) || 1;
    const hargaFinal = Number(total_harga);

    if (qty <= 0) {
      return res.status(400).json({ message: 'Kuantitas pesanan tidak valid (harus lebih dari 0)!' });
    }
    if (hargaFinal < 0) {
      return res.status(400).json({ message: 'Total harga tidak valid!' });
    }

    const newTransaction = await createTransaction(user_id, product_id, hargaFinal, qty);

    res.status(201).json({
      status: 'success',
      message: 'Yeay! Checkout makanan sisa berhasil.',
      data: newTransaction
    });
  } catch (error) {
    console.error('Error saat checkout:', error);
    if (error.message === 'Stok produk tidak cukup') {
      return res.status(400).json({ message: 'Stok produk tidak mencukupi!' });
    }
    if (error.message === 'Produk tidak ditemukan') {
      return res.status(404).json({ message: 'Produk tidak ditemukan!' });
    }
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const myTransactions = async (req, res) => {
  try {
    const user_id = req.user.id;
    const transactions = await getTransactionsByUser(user_id);
    res.status(200).json({ status: 'success', data: transactions });
  } catch (error) {
    console.error('Error mengambil riwayat transaksi:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const getAllTransactions = async (req, res) => {
  try {
    const { id: userId, role, store_id } = req.user; // ✅ Ambil dari JWT

    let query;
    let params = [];

    if (role === 'superadmin') {
      // ✅ Superadmin: lihat SEMUA transaksi
      query = `
        SELECT
          t.id, t.user_id, t.product_id, t.total_harga, t.quantity,
          t.status, t.created_at,
          u.name AS nama_user,
          p.nama_produk, p.gambar_produk,
          s.id AS store_id, s.nama_toko, s.waktu_tutup
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        JOIN products p ON t.product_id = p.id
        LEFT JOIN stores s ON p.store_id = s.id
        ORDER BY t.created_at DESC
      `;
    } else {
      // ✅ Mitra: hanya lihat transaksi toko MEREKA
      // store_id diambil dari JWT (disimpan saat login)
      if (!store_id) {
        return res.status(200).json({ status: 'success', data: [] });
      }
      query = `
        SELECT
          t.id, t.user_id, t.product_id, t.total_harga, t.quantity,
          t.status, t.created_at,
          u.name AS nama_user,
          p.nama_produk, p.gambar_produk,
          s.id AS store_id, s.nama_toko, s.waktu_tutup
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        JOIN products p ON t.product_id = p.id
        LEFT JOIN stores s ON p.store_id = s.id
        WHERE s.id = $1
        ORDER BY t.created_at DESC
      `;
      params = [store_id];
    }

    const { rows } = await pool.query(query, params);
    res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('Error mengambil semua transaksi:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const changeTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { role, store_id } = req.user;

    if (!status) {
      return res.status(400).json({ message: 'Status pesanan wajib diisi!' });
    }

    // ✅ Mitra hanya bisa ubah status transaksi toko mereka
    if (role === 'mitra' && store_id) {
      const check = await pool.query(
        `SELECT t.id FROM transactions t
         JOIN products p ON t.product_id = p.id
         WHERE t.id = $1 AND p.store_id = $2`,
        [id, store_id]
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ message: 'Akses ditolak! Bukan transaksi toko Anda.' });
      }
    }

    const updatedTrx = await updateTransactionStatus(id, status);
    if (!updatedTrx) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan!' });
    }

    res.status(200).json({
      status: 'success',
      message: `Status pesanan berhasil diubah menjadi ${status}`,
      data: updatedTrx
    });
  } catch (error) {
    console.error('Error saat update status transaksi:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

module.exports = { checkout, myTransactions, getAllTransactions, changeTransactionStatus };