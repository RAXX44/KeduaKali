const pool = require('../config/db');

// Fungsi untuk membuat transaksi baru (Checkout)
const createTransaction = async (user_id, product_id, total_harga, quantity = 1) => {
    // Cek stok
    const stockCheck = await pool.query(
        'SELECT stok FROM products WHERE id = $1',
        [product_id]
    );

    if (stockCheck.rows.length === 0) throw new Error('Produk tidak ditemukan');
    if (stockCheck.rows[0].stok < quantity) throw new Error('Stok produk tidak cukup');

    // Buat transaksi (💡 UBAH DI SINI: Tambahkan quantity dan $4)
    const result = await pool.query(`
        INSERT INTO transactions (user_id, product_id, total_harga, quantity, status)
        VALUES ($1, $2, $3, $4, 'Sedang Diproses')
        RETURNING *;
    `, [user_id, product_id, total_harga, quantity]);

    // Kurangi stok sesuai quantity
    await pool.query(
        'UPDATE products SET stok = stok - $1 WHERE id = $2',
        [quantity, product_id]
    );

    return result.rows[0];
};

// Fungsi untuk melihat riwayat belanja user
const getTransactionsByUser = async (user_id) => {
    // 💡 UBAH DI SINI: Tambahkan t.quantity
    const query = `
        SELECT
            t.id,
            t.user_id,
            t.product_id,
            t.total_harga,
            t.quantity,
            t.status,
            t.created_at,
            p.nama_produk,
            s.nama_toko,
            s.waktu_tutup,
            p.gambar_produk
        FROM transactions t
        INNER JOIN products p ON t.product_id = p.id
        LEFT JOIN stores s ON p.store_id = s.id
        WHERE t.user_id = $1
        ORDER BY t.created_at DESC;
    `;
    const result = await pool.query(query, [user_id]);
    return result.rows;
};

const getAllTransactionsData = async () => {
    // 💡 UBAH DI SINI: Tambahkan t.quantity
    const query = `
        SELECT
            t.id,
            t.user_id,
            t.product_id,
            t.total_harga,
            t.quantity,
            t.status,
            t.created_at,
            p.nama_produk,
            u.name AS nama_user
        FROM transactions t
        INNER JOIN products p ON t.product_id = p.id
        INNER JOIN users u ON t.user_id = u.id
        ORDER BY t.id DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
};

// Fungsi untuk mengubah status transaksi (Admin)
const updateTransactionStatus = async (id, status) => {
    const query = `
        UPDATE transactions
        SET status = $1
        WHERE id = $2
        RETURNING *;
    `;
    const values = [status, id];
    const result = await pool.query(query, values);
    return result.rows[0];
};

module.exports = { createTransaction, getTransactionsByUser, getAllTransactionsData, updateTransactionStatus };