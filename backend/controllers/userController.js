const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, getUserByEmail } = require('../models/userModel');
const pool = require('../config/db');

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email sudah terdaftar!' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role || 'konsumen';
    const newUser = await createUser(name, email, hashedPassword, userRole);
    res.status(201).json({ status: 'success', message: 'Registrasi berhasil!', data: newUser });
  } catch (error) {
    console.error('Error register:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await getUserByEmail(email);
    if (!user) return res.status(401).json({ message: 'Email tidak ditemukan!' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Password salah!' });

    // ✅ Ambil store_id jika user adalah mitra
    let store_id = null;
    if (user.role === 'mitra') {
      const storeResult = await pool.query(
        'SELECT id FROM stores WHERE user_id = $1 LIMIT 1',
        [user.id]
      );
      if (storeResult.rows.length > 0) {
        store_id = storeResult.rows[0].id;
      }
    }

    // ✅ Simpan store_id di JWT payload
    const token = jwt.sign(
      { id: user.id, role: user.role, store_id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // ✅ FIX: response pakai 'user' bukan 'data' agar frontend bisa baca data.user
    res.status(200).json({
      status: 'success',
      message: 'Login berhasil!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        store_id  // ✅ ikut dikirim ke frontend
      }
    });
  } catch (error) {
    console.error('Error login:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

// Hanya superadmin yang bisa daftarkan mitra
const registerMitra = async (req, res) => {
  try {
    const { name, email, password, kontak } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nama, email, dan password wajib diisi!' });
    }
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email sudah terdaftar!' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      'INSERT INTO users(name, email, password, role, kontak) VALUES($1,$2,$3,$4,$5) RETURNING id, name, email, role',
      [name, email, hashedPassword, 'mitra', kontak || '']
    );
    res.status(201).json({
      status: 'success',
      message: 'Pendaftaran mitra berhasil!',
      data: newUser.rows[0]
    });
  } catch (error) {
    console.error('Error register mitra:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const getAllMitras = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (u.id)
        u.id, u.name, u.email, u.role, u.kontak,
        s.id AS store_id, s.nama_toko, s.is_active AS store_active
      FROM users u
      LEFT JOIN stores s ON s.user_id = u.id
      WHERE u.role = 'mitra'
      ORDER BY u.id DESC
    `);
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    console.error('Error get mitras:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userCheck = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan!' });
    }
    if (userCheck.rows[0].role === 'superadmin') {
      return res.status(403).json({ message: 'Superadmin tidak bisa dihapus!' });
    }
    await pool.query('UPDATE stores SET user_id = NULL WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.status(200).json({ status: 'success', message: 'Mitra berhasil dihapus.' });
  } catch (error) {
    console.error('Error delete user:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

// Mengambil semua data pengguna (Hanya untuk Superadmin)
const getAllUsers = async (req, res) => {
  try {
    // Ambil data penting saja (Jangan kirim password ke frontend!)
    const result = await pool.query(
      'SELECT id, name, email, role FROM users ORDER BY id ASC'
    );

    return res.status(200).json({
      status: 'success',
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Error mengambil data users:', error.message);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data pengguna.' });
  }
};


module.exports = { registerUser, loginUser, registerMitra, getAllMitras, deleteUser, getAllUsers };