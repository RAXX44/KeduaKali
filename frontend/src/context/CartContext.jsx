import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // 1. Inisialisasi awal: Cek apakah ada keranjang yang tersimpan di localStorage
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('kk_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Gagal memuat keranjang:", error);
      return [];
    }
  });

  const [activeStoreId, setActiveStoreId] = useState(() => {
    try {
      const savedStore = localStorage.getItem('kk_active_store');
      return savedStore ? JSON.parse(savedStore) : null;
    } catch (error) {
      return null;
    }
  });

  // 2. Efek Otomatis: Setiap kali 'cart' atau 'activeStoreId' berubah, simpan ke localStorage
  useEffect(() => {
    localStorage.setItem('kk_cart', JSON.stringify(cart));
    localStorage.setItem('kk_active_store', JSON.stringify(activeStoreId));
  }, [cart, activeStoreId]);

  // ── FUNGSI TAMBAH KE KERANJANG DENGAN VALIDASI STOK ──
  const addToCart = (product) => {
    setCart((prev) => {
      // PENGECEKAN KEBIJAKAN "SINGLE STORE" (KHUSUS SELF-PICKUP)
      if (prev.length > 0) {
        const existingStoreId = prev[0].store_id;

        // Jika produk baru berasal dari toko yang BERBEDA
        if (product.store_id !== existingStoreId) {
          const confirmGantiToko = window.confirm(
            "Kamu hanya bisa melakukan reservasi/self-pickup dari 1 Mitra yang sama dalam satu pesanan. Kosongkan keranjang sebelumnya dan mulai belanja dari mitra ini?"
          );

          if (confirmGantiToko) {
            // Kosongkan keranjang lama, masukkan produk baru (Pastikan stok > 0)
            if (product.stok <= 0) {
              alert('Maaf, stok item ini sudah habis.');
              return prev; // Tetap kembalikan keranjang lama karena gagal tambah
            }
            setActiveStoreId(product.store_id);
            return [{ ...product, qty: 1 }];
          } else {
            // Batal tambah, kembalikan keranjang lama
            return prev;
          }
        }
      } else {
        // Jika keranjang kosong, set toko aktif
        setActiveStoreId(product.store_id);
      }

      // Jika dari toko yang sama, lakukan penambahan normal
      const existing = prev.find((c) => c.id === product.id);

      if (existing) {
        // 💡 UPGRADE: VALIDASI STOK MAKSIMAL
        if (existing.qty >= product.stok) {
          alert(`Batas maksimal tercapai! Sisa stok untuk ${product.name} hanya ${product.stok} item.`);
          return prev;
        }

        return prev.map((c) =>
          c.id === product.id ? { ...c, qty: c.qty + 1 } : c
        );
      }

      // 💡 UPGRADE: VALIDASI STOK AWAL
      if (product.stok <= 0) {
        alert('Maaf, stok item ini baru saja habis.');
        return prev;
      }

      return [...prev, { ...product, qty: 1 }];
    });
  };

  // ── FUNGSI UBAH KUANTITAS DENGAN VALIDASI STOK ──
  const changeQty = (id, delta) => {
    setCart((prev) => {
      const productToChange = prev.find(c => c.id === id);
      if (!productToChange) return prev;

      const newQty = productToChange.qty + delta;

      // 💡 UPGRADE: VALIDASI STOK SAAT DITAMBAH DARI HALAMAN KERANJANG
      if (delta > 0 && newQty > productToChange.stok) {
        alert(`Batas maksimal tercapai! Sisa stok hanya ${productToChange.stok} item.`);
        return prev;
      }

      const newCart = prev
        .map((c) => (c.id === id ? { ...c, qty: newQty } : c))
        .filter((c) => c.qty > 0); // Otomatis hapus jika qty menjadi 0

      // Jika keranjang menjadi kosong setelah qty dikurangi
      if (newCart.length === 0) {
        setActiveStoreId(null);
      }

      return newCart;
    });
  };

  // ── FUNGSI BARU: HAPUS LANGSUNG DARI KERANJANG ──
  const removeFromCart = (id) => {
    setCart((prev) => {
      const newCart = prev.filter(c => c.id !== id);
      if (newCart.length === 0) {
        setActiveStoreId(null);
      }
      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    setActiveStoreId(null);
  };

  // 💡 UPGRADE: MEMOIZATION UNTUK PERFORMA & FITUR "TOTAL PENGHEMATAN"
  const { total, count, totalOriginal, totalSavings } = useMemo(() => {
    let t = 0; // Total Harga Diskon (Yang dibayar user)
    let c = 0; // Total Kuantitas Item
    let o = 0; // Total Harga Asli (Sebelum Diskon)

    cart.forEach(item => {
      t += item.price * item.qty;
      c += item.qty;

      // Ambil harga asli, jika tidak ada, asumsikan sama dengan harga jual (price)
      const origPrice = item.originalPrice || item.harga_asli || item.price;
      o += origPrice * item.qty;
    });

    return {
      total: t,
      count: c,
      totalOriginal: o,
      totalSavings: o - t // Menghitung total uang yang berhasil dihemat
    };
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        changeQty,
        removeFromCart, // Diekspos agar bisa dipakai untuk tombol "Hapus" (Tong Sampah)
        clearCart,
        total,
        count,
        totalOriginal, // Total harga sebelum diskon
        totalSavings,  // Total uang yang dihemat (Bisa dipakai untuk UI gamifikasi)
        activeStoreId
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);