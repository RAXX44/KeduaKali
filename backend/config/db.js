const { Pool } = require('pg');
require('dotenv').config();

// Cek apakah server sedang berjalan di cloud (production) atau di laptop (development)
const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  // 👇 SSL hanya menyala jika di-deploy ke production (untuk Supabase)
  ssl: isProduction ? { rejectUnauthorized: false } : false
});

pool.connect((err) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Database connected successfully!');
  }
});

module.exports = pool;