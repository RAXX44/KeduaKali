const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // 1. Tangkap token dari header request
    const token = req.header('Authorization');

    // 2. Kalau gak ada token, tolak aksesnya
    if (!token) {
        return res.status(401).json({ message: 'Akses ditolak! Kamu harus login dulu.' });
    }

    try {
        // 3. Cek apakah tokennya asli dan belum kedaluwarsa
        // Token biasanya dikirim dengan format "Bearer eyJhb..." jadi kita pisahkan dulu
        const tokenClean = token.replace('Bearer ', '');
        const verified = jwt.verify(tokenClean, process.env.JWT_SECRET);

        // 4. Kalau asli, simpan data user (id & role) biar bisa dipakai di controller
        req.user = verified;

        // 5. Silakan masuk (lanjut ke controller berikutnya)
        next();
    } catch (error) {
        res.status(400).json({ message: 'Token tidak valid atau sudah kedaluwarsa!' });
    }
};
// middleware/authMiddleware.js — tambah fungsi ini

const verifySuperAdmin = (req, res, next) => {
    if (req.user?.role !== 'superadmin') {
        return res.status(403).json({ message: 'Hanya superadmin yang bisa akses.' });
    }
    next();
};

const verifyMitra = (req, res, next) => {
    if (!['superadmin', 'mitra'].includes(req.user?.role)) {
        return res.status(403).json({ message: 'Akses ditolak.' });
    }
    next();
};

module.exports = { verifyToken, verifySuperAdmin, verifyMitra };