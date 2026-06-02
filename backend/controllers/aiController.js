const axios = require('axios');
const pool = require('../config/db');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || process.env.FASTAPI_URL || 'http://localhost:8000';

// ===============================================
// 1. PREDIKSI SURPLUS (XGBoost)
// ===============================================
const getSurplusPrediction = async (req, res) => {
  try {
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/predict`, {
      ...req.body,
      has_promotion: Boolean(req.body.has_promotion),
      special_event: Boolean(req.body.special_event)
    }, {
      timeout: 5000 // Timeout 5 detik
    });

    if (aiResponse.data.error) {
      return res.status(500).json({ message: aiResponse.data.error });
    }

    return res.status(200).json({
      status: 'success',
      data: aiResponse.data
    });
  } catch (error) {
    console.error('❌ FastAPI predict error:', error.message);
    res.status(503).json({
      message: 'AI Service tidak tersedia. Pastikan FastAPI berjalan di port 8000.'
    });
  }
};

// ===============================================
// 2. REKOMENDASI PRODUK (Hybrid NCF)
// ===============================================
const getRecommendations = async (req, res) => {
  try {
    const { type, id, restaurant_type, meal_type, weather_condition } = req.query;

    const payload = {
      user_id: type === 'user' ? parseInt(id) : null,
      item_id: type === 'product' ? parseInt(id) : null,
      restaurant_type: restaurant_type || 'Casual Dining',
      meal_type: meal_type || 'Dinner',
      weather_condition: weather_condition || 'Sunny',
      day_of_week: parseInt(req.query.day_of_week) || new Date().getDay(),
      is_weekend: parseInt(req.query.is_weekend) || (new Date().getDay() % 6 === 0 ? 1 : 0),
      has_promotion: parseInt(req.query.has_promotion) || 0,
      special_event: parseInt(req.query.special_event) || 0,
      extra_preferences: req.query.extra_preferences || '',
      top_k: parseInt(req.query.top_k) || 4
    };

    // 1. Minta rekomendasi ke layanan FastAPI
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/recommend`, payload);

    // Pastikan menangkap data dari struktur properti yang benar (aiResponse.data.recommendations)
    let recommendedIds = aiResponse.data.recommendations || aiResponse.data;

    // --- LOG DETEKTIF UNTUK TRACKING DI TERMINAL EXPRESS ---
    console.log("🔍 AI FastAPI mengirim ID:", recommendedIds);

    // Cek jika API FastAPI mengembalikan data kosong atau format salah
    if (!recommendedIds || !Array.isArray(recommendedIds) || recommendedIds.length === 0) {
      console.log('ℹ️ AI mengembalikan array kosong.');
      return res.status(200).json({ status: 'success', data: [] });
    }

    // Memastikan isi array adalah nomor integer murni sebelum dilempar ke query SQL
    const cleanIds = recommendedIds.map(num => parseInt(num)).filter(num => !isNaN(num));

    // 2. Tarik data lengkap dari PostgreSQL menggunakan "id"
    const result = await pool.query(
      `SELECT p.*, s.nama_toko
       FROM products p
       LEFT JOIN stores s ON p.store_id = s.id
       WHERE p.id = ANY($1::int[]) AND p.stok > 0`,
      [cleanIds]
    );

    console.log(`🔍 DB PostgreSQL menemukan ${result.rows.length} produk yang cocok & punya stok.`);

    // 3. Urutkan hasil dari DB agar sesuai dengan ranking prioritas ID dari AI
    const sortedData = result.rows.sort((a, b) => {
      return cleanIds.indexOf(a.id) - cleanIds.indexOf(b.id);
    });

    return res.status(200).json({
      status: 'success',
      data: sortedData
    });

  } catch (error) {
    console.error('❌ ERROR di getRecommendations:', error.message);
    res.status(503).json({
      status: 'error',
      message: 'Sistem Rekomendasi AI sedang tidak tersedia.'
    });
  }
};

module.exports = { getSurplusPrediction, getRecommendations };