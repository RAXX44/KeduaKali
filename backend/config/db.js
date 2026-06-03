const { Pool } = require('pg');
require('dotenv').config();

// Tentukan apakah kita menggunakan database lokal atau remote
const isLocal = process.env.DB_HOST === 'localhost';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // Konfigurasi fallback
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,

  // SSL hanya aktif jika BUKAN localhost
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

pool.connect((err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Database connected successfully!');
  }
});

module.exports = pool;