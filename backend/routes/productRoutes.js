const express = require('express');
const router = express.Router();
const {
  getProducts, getProductDetail, addProduct,
  editProduct, removeProduct, applyAIDiscount
} = require('../controllers/productController');
const { verifyToken, verifyMitra } = require('../middlewares/authMiddleware');

// Publik — siapa saja bisa lihat katalog
router.get('/', getProducts);
router.get('/:id', getProductDetail);

// ✅ Mitra/superadmin — wajib login, controller cek kepemilikan toko
router.post('/', verifyToken, verifyMitra, addProduct);
router.put('/:id/apply-discount', verifyToken, verifyMitra, applyAIDiscount);
router.put('/:id', verifyToken, verifyMitra, editProduct);
router.delete('/:id', verifyToken, verifyMitra, removeProduct);

module.exports = router;