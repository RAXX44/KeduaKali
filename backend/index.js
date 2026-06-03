require('dotenv').config();
require('./config/db');
const express = require('express');
const cors = require('cors');

const userRoutes = require('./routes/userRoutes');
const aiRoutes = require('./routes/aiRoutes');
const productRoutes = require('./routes/productRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const storeRoutes = require('./routes/storeRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/stores', storeRoutes);

app.get('/', (req, res) => {
  res.send('Backend KeduaKali API is running...');
});

const PORT = process.env.PORT || 5000;

// Cek apakah kode berjalan di Vercel atau di komputer lokal
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// 👇 INI WAJIB DITAMBAHKAN AGAR VERCEL BISA MEMBACA EXPRESS-MU
module.exports = app;