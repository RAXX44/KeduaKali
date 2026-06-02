const express = require('express');
const router = express.Router();
const { getSurplusPrediction, getRecommendations } = require('../controllers/aiController');
const { verifyToken } = require('../middlewares/authMiddleware');

// POST /api/ai/predict
router.post('/predict', verifyToken, getSurplusPrediction);

// GET /api/ai/recommendations
router.get('/recommendations', getRecommendations);

module.exports = router;