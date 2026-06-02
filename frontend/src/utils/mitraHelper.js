/**
 * Helper: Cari toko milik mitra dari daftar stores
 * Kolom di DB: stores.user_id (bukan mitra_user_id)
 *
 * Urutan pencocokan:
 * 1. store_id dari JWT/localStorage (paling akurat)
 * 2. user_id di tabel stores cocok dengan admin.id
 */
export function findMitraStore(stores = [], admin) {
  if (!admin || !stores.length) return null;

  // Cari by store_id yang tersimpan di data admin (dari JWT)
  if (admin.store_id) {
    const found = stores.find(t => t.id === admin.store_id);
    if (found) return found;
  }

  // Fallback: cari by user_id di tabel stores
  return stores.find(t => t.user_id === admin.id) || null;
}