require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import koneksi database (Sesuaikan dengan path aslimu jika perlu)
const pool = require('./config/db'); // 👈 Buka komen ini jika kamu menginisiasi DB di sini

// Import rute kita
const productRoutes = require('./routes/productRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const aiRoutes = require('./routes/aiRoutes');
const userRoutes = require('./routes/userRoutes');
const storeRoutes = require('./routes/storeRoutes');

const app = express();

// Middleware CORS (Versi Aman untuk Production)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Ambil dari .env atau localhost
  credentials: true
}));
app.use(express.json());

// Pendaftaran Rute (Jalur Tol)
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stores', storeRoutes);

// Route ngetes server
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Backend KeduaKali API is running...' });
});

// Mock API AI (Tetap dibiarkan sesuai permintaanmu)
app.get('/api/recommendations', (req, res) => {
    res.json({
        status: "success",
        data: [
            { id: 1, nama: "Roti Tawar Hampir Exp", harga: 5000, diskon: "50%" },
            { id: 2, nama: "Apel Cacat Minor", harga: 10000, diskon: "30%" }
        ]
    });
});

// 👈 GLOBAL ERROR HANDLER (WAJIB ADA)
// Jika ada rute yang tidak ditemukan (404)
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: "Endpoint tidak ditemukan" });
});

// Jika ada error internal di server (500) agar server tidak mati (crash)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
        error: process.env.NODE_ENV === 'development' ? err.message : {} // Sembunyikan detail error dari publik saat deploy
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});