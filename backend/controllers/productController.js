const { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../models/productModel');
const pool = require('../config/db');

const getProducts = async (req, res) => {
  try {
    const products = await getAllProducts();
    res.status(200).json({ status: 'success', data: products });
  } catch (error) {
    console.error('Error saat mengambil produk:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const getProductDetail = async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan!' });
    res.status(200).json({ status: 'success', data: product });
  } catch (error) {
    console.error('Error saat mengambil detail produk:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const addProduct = async (req, res) => {
  try {
    const { role, store_id: jwtStoreId } = req.user;
    const {
      store_id, name, category, type, price, original_price,
      description, stok, emoji, gambar_produk, batas_konsumsi
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: 'Nama dan Harga wajib diisi!' });
    }

    const finalStoreId = role === 'mitra' ? jwtStoreId : store_id;

    if (!finalStoreId) {
      return res.status(400).json({ message: 'Toko wajib diisi!' });
    }

    if (role === 'mitra' && Number(store_id) !== Number(jwtStoreId)) {
      return res.status(403).json({ message: 'Akses ditolak! Hanya bisa tambah produk ke toko Anda.' });
    }

    let diskon = 0;
    if (original_price && original_price > price) {
      diskon = Math.round((1 - (price / original_price)) * 100);
    }

    const newProduct = await createProduct(
      finalStoreId, name, category, type, price, original_price || null,
      diskon, description || '', stok, emoji || '📦',
      gambar_produk || '', batas_konsumsi || '22:00'
    );

    res.status(201).json({ status: 'success', data: newProduct });
  } catch (error) {
    console.error('Error saat menambah produk:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, store_id: jwtStoreId } = req.user;

    if (role === 'mitra') {
      const check = await pool.query(
        'SELECT id FROM products WHERE id = $1 AND store_id = $2',
        [id, jwtStoreId]
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ message: 'Akses ditolak! Bukan produk toko Anda.' });
      }
    }

    const {
      store_id, name, category, type, price, original_price,
      description, stok, emoji, gambar_produk, batas_konsumsi
    } = req.body;

    let diskon = 0;
    if (original_price && original_price > price) {
      diskon = Math.round((1 - (price / original_price)) * 100);
    }

    const finalStoreId = role === 'mitra' ? jwtStoreId : store_id;

    const updated = await updateProduct(
      id, finalStoreId, name, category, type, price, original_price || null,
      diskon, description || '', stok, emoji || '📦',
      gambar_produk || '', batas_konsumsi || '22:00'
    );

    if (!updated) return res.status(404).json({ message: 'Produk tidak ditemukan!' });
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    console.error('Error saat update produk:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const removeProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, store_id: jwtStoreId } = req.user;

    if (role === 'mitra') {
      const check = await pool.query(
        'SELECT id FROM products WHERE id = $1 AND store_id = $2',
        [id, jwtStoreId]
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ message: 'Akses ditolak! Bukan produk toko Anda.' });
      }
    }

    const deleted = await deleteProduct(id);
    if (!deleted) return res.status(404).json({ message: 'Produk tidak ditemukan!' });
    res.status(200).json({ status: 'success', message: 'Produk dihapus!' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

const applyAIDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, store_id: jwtStoreId } = req.user;
    const { predicted_stock, discount_percentage } = req.body;

    if (role === 'mitra') {
      const check = await pool.query(
        'SELECT id FROM products WHERE id = $1 AND store_id = $2',
        [id, jwtStoreId]
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ message: 'Akses ditolak! Bukan produk toko Anda.' });
      }
    }

    const diskonAngka = Math.round(Number(discount_percentage));
    const stokBulat = Math.round(Number(predicted_stock));

    const existing = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Produk tidak ditemukan!' });
    }

    const produk = existing.rows[0];
    const hargaAsli = produk.harga_asli && produk.harga_asli > 0
      ? produk.harga_asli
      : produk.harga;

    const hargaBaru = Math.round(hargaAsli * (1 - diskonAngka / 100));

    const result = await pool.query(
      `UPDATE products SET harga = $1, harga_asli = $2, diskon = $3, stok = $4
       WHERE id = $5 RETURNING *`,
      [hargaBaru, hargaAsli, diskonAngka, stokBulat, id]
    );

    res.status(200).json({
      status: 'success',
      message: `Diskon ${diskonAngka}% berhasil! Harga ${produk.nama_produk} turun dari Rp${hargaAsli} menjadi Rp${hargaBaru}`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error applyAIDiscount:', error);
    res.status(500).json({ message: 'Gagal menerapkan diskon' });
  }
};

module.exports = { getProducts, getProductDetail, addProduct, editProduct, removeProduct, applyAIDiscount };