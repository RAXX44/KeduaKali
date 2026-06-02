const express = require('express');
const router = express.Router();
const {
  getStores,
  getStoreDetail,
  addStore,
  editStore,
  removeStore,
  assignStoreToMitra,
  getMitraStore,
  editMitraStore,
  unassignMitra // ✅ BARU: Pastikan ini di-import dari controller
} = require('../controllers/storeController');

const { verifyToken, verifySuperAdmin } = require('../middlewares/authMiddleware');

// ── RUTE PUBLIK ──
router.get('/', getStores);
router.get('/:id', getStoreDetail);

// ── RUTE KHUSUS MITRA ──
router.get('/my-store', verifyToken, getMitraStore);
router.put('/my-store/:id', verifyToken, editMitraStore);

// ── RUTE KHUSUS SUPERADMIN ──
router.post('/', verifyToken, verifySuperAdmin, addStore);
router.put('/:id', verifyToken, verifySuperAdmin, editStore);
router.delete('/:id', verifyToken, verifySuperAdmin, removeStore);

// Delegasi & Pemutusan Toko (Superadmin)
router.post('/assign-mitra', verifyToken, verifySuperAdmin, assignStoreToMitra);
router.post('/unassign-mitra', verifyToken, verifySuperAdmin, unassignMitra); // ✅ BARU: Daftarkan rutenya di sini!

module.exports = router;