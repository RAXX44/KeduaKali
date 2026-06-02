const express = require('express');
const router = express.Router();
const {
  checkout, myTransactions, getAllTransactions, changeTransactionStatus
} = require('../controllers/transactionController');
const { verifyToken, verifyMitra } = require('../middlewares/authMiddleware');

// Konsumen: buat transaksi
router.post('/checkout', verifyToken, checkout);

// Konsumen: lihat riwayat sendiri
router.get('/history', verifyToken, myTransactions);

// ✅ Admin/Mitra: lihat semua transaksi — wajib login
// Filter by store dilakukan di controller berdasarkan role
router.get('/', verifyToken, verifyMitra, getAllTransactions);

// Admin/Mitra: ubah status pesanan
router.put('/:id/status', verifyToken, verifyMitra, changeTransactionStatus);

module.exports = router;