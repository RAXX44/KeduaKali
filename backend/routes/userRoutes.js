const express = require('express');
const router = express.Router();

// 💡 UPGRADE: Import dijadikan satu baris agar rapi
const {
  registerUser,
  loginUser,
  registerMitra,
  getAllMitras,
  deleteUser,
  getAllUsers
} = require('../controllers/userController');

const { verifyToken, verifySuperAdmin } = require('../middlewares/authMiddleware');

// ─── RUTE PUBLIK ───
router.post('/register', registerUser);
router.post('/login', loginUser);

// ─── RUTE SUPERADMIN ───
// ✅ FIX: Ubah '/users' menjadi '/' agar URL-nya pas menjadi http://localhost:5000/api/users
router.get('/', verifyToken, verifySuperAdmin, getAllUsers);

// Hanya superadmin yang bisa daftarkan dan kelola mitra
router.post('/register-mitra', verifyToken, verifySuperAdmin, registerMitra);
router.get('/mitras', verifyToken, verifySuperAdmin, getAllMitras);
router.delete('/:id', verifyToken, verifySuperAdmin, deleteUser); // Hapus mitra

module.exports = router;