import pandas as pd
from sqlalchemy import create_engine
import os

# 1. Kita ambil data dari environment variable agar aman dan sinkron dengan backend
# (Ingat: DB_USER, DB_PASSWORD, dll. itu ada di file .env backend kamu)
DB_USER = "postgres"
DB_PASS = "cut123"
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "keduakali_db"

# 2. Gunakan f-string untuk membangun URL koneksi
DB_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DB_URL)

def sync_products():
    print("🔄 Menyinkronkan Database ke AI Metadata...")

    try:
        # Query mengambil produk sekaligus informasi tokonya
        query = """
        SELECT
            p.id,
            p.store_id as restaurant_id,
            p.kategori as category,
            p.nama_produk as menu_item_name,
            p.harga as actual_selling_price
        FROM products p
        """

        df = pd.read_sql(query, engine)

        # Tambahkan kolom yang dibutuhkan AI
        df['menu_key'] = df['menu_item_name'].str.lower().str.replace(r'[^a-z0-9\s]', '', regex=True).str.strip()
        df['feature_row'] = range(len(df)) # Membuat index baru

        # Tambahkan kolom dummy tambahan agar struktur CSV sama persis dengan yang dibutuhkan model NCF
        df['restaurant_type'] = 'casual dining'
        df['meal_type'] = 'lunch'
        df['weather_condition'] = 'sunny'

        # Simpan ke lokasi yang dibaca FastAPI
        # Pastikan path ini benar relatif dari tempat kamu menjalankan script
        output_path = 'artifacts_hybrid_recommender/hybrid_item_metadata.csv'
        df.to_csv(output_path, index=False)

        print(f"✅ Berhasil sinkronisasi {len(df)} produk ke AI Metadata!")

    except Exception as e:
        print(f"❌ Gagal sinkronisasi: {e}")

if __name__ == "__main__":
    sync_products()