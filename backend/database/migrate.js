const fs = require('fs');
const path = require('path');
const pool = require('../config/db'); // Mengambil koneksi database kamu

const runMigration = async () => {
    try {
        console.log('⏳ Memulai proses migration...');
        
        // Membaca isi file setup.sql
        const sqlPath = path.join(__dirname, 'setup.sql');
        const sqlQuery = fs.readFileSync(sqlPath, { encoding: 'utf-8' });

        // Mengeksekusi query ke PostgreSQL
        await pool.query(sqlQuery);
        
        console.log('✅ Migration sukses! Semua tabel (users, products, transactions) berhasil dibuat.');
        
        // Menutup koneksi setelah selesai
        process.exit(0);
    } catch (error) {
        console.error('❌ Gagal melakukan migration:', error.message);
        process.exit(1);
    }
};

runMigration();