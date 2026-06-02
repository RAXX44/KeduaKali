// file: controllers/recommendationController.js (Di Express.js Anda)
const axios = require('axios');
const pool = require('../config/database'); // Untuk ambil detail produk dari DB

const FASTAPI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

exports.getRecommendations = async (req, res) => {
    try {
        const { type, id } = req.query; // type bisa 'user' atau 'product'
        let aiResponse;

        // 1. Tembak ke FastAPI sesuai tipe rekomendasi
        if (type === 'user' && id) {
            aiResponse = await axios.post(`${FASTAPI_URL}/api/recommend`, { user_id: parseInt(id) });
        } else if (type === 'product' && id) {
            // Jika AI Anda mendukung item-based recommendation
            aiResponse = await axios.post(`${FASTAPI_URL}/api/recommend/item`, { item_id: parseInt(id) });
        } else {
            // Fallback (Cold Start): Ambil produk sisa dengan stok terbanyak / terpopuler
            const coldStart = await pool.query('SELECT * FROM products WHERE stok > 0 ORDER BY stok DESC LIMIT 4');
            return res.json({ status: 'success', data: coldStart.rows });
        }

        // 2. FastAPI mengembalikan daftar ID produk: [12, 5, 8, 22]
        const recommendedIds = aiResponse.data.recommendations;

        if (!recommendedIds || recommendedIds.length === 0) {
             return res.json({ status: 'success', data: [] });
        }

        // 3. Tarik detail produk (nama, harga, gambar) dari PostgreSQL berdasarkan ID dari AI
        const productsQuery = await pool.query(
            `SELECT * FROM products WHERE id = ANY($1::int[])`,
            [recommendedIds]
        );

        res.json({ status: 'success', data: productsQuery.rows });

    } catch (error) {
        console.error("Gagal menjembatani Rekomendasi AI:", error.message);
        res.status(500).json({ message: "Sistem Rekomendasi sedang sibuk." });
    }
};