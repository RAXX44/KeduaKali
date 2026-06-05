const pool = require('../config/db');

// ──────────────────────────────────────────────────────────────
// Buat transaksi baru (Checkout)
// ✅ Sekarang menerima payment_method & shipping_address
// ──────────────────────────────────────────────────────────────
const createTransaction = async (
    user_id,
    product_id,
    total_harga,
    quantity = 1,
    payment_method = null,
    shipping_address = null
) => {
    // Cek stok
    const stockCheck = await pool.query(
        'SELECT stok FROM products WHERE id = $1',
        [product_id]
    );

    if (stockCheck.rows.length === 0) throw new Error('Produk tidak ditemukan');
    if (stockCheck.rows[0].stok < quantity) throw new Error('Stok produk tidak cukup');

    // ✅ Simpan payment_method & shipping_address ke DB
    const result = await pool.query(`
        INSERT INTO transactions
            (user_id, product_id, total_harga, quantity, status, payment_method, shipping_address)
        VALUES
            ($1, $2, $3, $4, 'Sedang Diproses', $5, $6)
        RETURNING *;
    `, [user_id, product_id, total_harga, quantity, payment_method, shipping_address]);

    // Kurangi stok sesuai quantity
    await pool.query(
        'UPDATE products SET stok = stok - $1 WHERE id = $2',
        [quantity, product_id]
    );

    return result.rows[0];
};

// ──────────────────────────────────────────────────────────────
// Riwayat transaksi milik user (halaman Pesanan.jsx)
// ✅ Sekarang ikut SELECT payment_method & shipping_address
// ──────────────────────────────────────────────────────────────
const getTransactionsByUser = async (user_id) => {
    const query = `
        SELECT
            t.id,
            t.user_id,
            t.product_id,
            t.total_harga,
            t.quantity,
            t.status,
            t.payment_method,
            t.shipping_address,
            t.created_at,
            p.nama_produk,
            p.gambar_produk,
            s.nama_toko,
            s.waktu_tutup
        FROM transactions t
        INNER JOIN products p ON t.product_id = p.id
        LEFT JOIN stores s ON p.store_id = s.id
        WHERE t.user_id = $1
        ORDER BY t.created_at DESC;
    `;
    const result = await pool.query(query, [user_id]);
    return result.rows;
};

// ──────────────────────────────────────────────────────────────
// Semua transaksi (AdminPesanan.jsx — superadmin & mitra)
// ✅ Sekarang ikut SELECT payment_method, store_id & nama_toko
// ──────────────────────────────────────────────────────────────
const getAllTransactionsData = async () => {
    const query = `
        SELECT
            t.id,
            t.user_id,
            t.product_id,
            t.total_harga,
            t.quantity,
            t.status,
            t.payment_method,
            t.shipping_address,
            t.created_at,
            p.nama_produk,
            p.store_id,
            s.nama_toko,
            u.name AS nama_user
        FROM transactions t
        INNER JOIN products p ON t.product_id = p.id
        INNER JOIN users u ON t.user_id = u.id
        LEFT JOIN stores s ON p.store_id = s.id
        ORDER BY t.id DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
};

// ──────────────────────────────────────────────────────────────
// Update status transaksi (Admin)
// ──────────────────────────────────────────────────────────────
const updateTransactionStatus = async (id, status) => {
    const result = await pool.query(`
        UPDATE transactions
        SET status = $1
        WHERE id = $2
        RETURNING *;
    `, [status, id]);
    return result.rows[0];
};

module.exports = {
    createTransaction,
    getTransactionsByUser,
    getAllTransactionsData,
    updateTransactionStatus,
};