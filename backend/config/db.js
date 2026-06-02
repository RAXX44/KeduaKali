const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  // Kita coba pakai DATABASE_URL dulu (untuk production/cloud)
  // Kalau tidak ada, baru pakai variabel satuan (untuk development/laptop)
  connectionString: process.env.DATABASE_URL,

  // Konfigurasi fallback jika tidak menggunakan DATABASE_URL
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,

  // SSL tetap penting untuk Supabase
  ssl: { rejectUnauthorized: false }
});

pool.connect((err) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Database connected successfully!');
  }
});

module.exports = pool;