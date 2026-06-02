const pool = require('../config/db');

// Fungsi simpan user baru
const createUser = async (name, email, hashedPassword, role) => {
    const query = `
        INSERT INTO users (name, email, password, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, role;
    `;
    const values = [name, email, hashedPassword, role];
    const result = await pool.query(query, values);
    return result.rows[0]; // Mengembalikan data user yang baru dibuat
};

// Fungsi cari user (nanti dipakai buat cek email ganda & login)
const getUserByEmail = async (email) => {
    const query = `SELECT * FROM users WHERE email = $1`;
    const result = await pool.query(query, [email]);
    return result.rows[0];
};

module.exports = { createUser, getUserByEmail };