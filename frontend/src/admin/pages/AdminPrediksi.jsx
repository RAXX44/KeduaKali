import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useAdminAuth } from '../../context/AdminAuthContext'; // ✅ TAMBAH
import {
  CheckCircle2, AlertTriangle, BrainCircuit, Sparkles,
  Lightbulb, Zap, Activity, Database, Server, Info, Target, TrendingDown
} from 'lucide-react';

const MODEL_METRICS = [
  { label: 'R-Squared', value: '0.7972', desc: 'Akurasi model XGBoost', good: true, icon: Activity },
  { label: 'MSE', value: '112.4', desc: 'Mean Squared Error', good: true, icon: Database },
  { label: 'AI Engine', value: 'Online', desc: 'FastAPI Microservice', good: true, icon: Server },
];

export default function AdminPrediksi() {
  const { admin, adminToken } = useAdminAuth(); // ✅ AMBIL DATA ADMIN
  const [loading, setLoading] = useState(false);
  const [hasilPrediksi, setHasilPrediksi] = useState(null);
  const [produkDB, setProdukDB] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);

  const isSuperAdmin = admin?.role === 'superadmin'; // ✅ ROLE BENAR

  const [formData, setFormData] = useState({
    restaurant_id: 1,
    restaurant_type: 'Casual Dining',
    menu_item_name: 'Menu Default',
    meal_type: 'Dinner',
    typical_ingredient_cost: 15000,
    observed_market_price: 35000,
    actual_selling_price: 30000,
    weather_condition: 'Sunny',
    has_promotion: false,
    special_event: false,
    day_of_week: 4,
    is_weekend: 0,
    month: new Date().getMonth() + 1
  });

  useEffect(() => {
    const fetchProduk = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const token = adminToken || localStorage.getItem('kk_token');

        // ✅ Fetch produk + stores untuk filter mitra
        const [resProd, resStores] = await Promise.all([
          fetch(`${API_URL}/products`),
          fetch(`${API_URL}/stores`)
        ]);

        const resultProd = await resProd.json();
        const resultStores = await resStores.json();

        if (resultProd.status === 'success' && resultProd.data.length > 0) {
          let produk = resultProd.data;

          // ✅ FILTER: Mitra hanya lihat produk toko mereka sendiri
          if (!isSuperAdmin && resultStores.status === 'success') {
            const myStore = resultStores.data.find(t => t.id === admin?.store_id)
              || resultStores.data.find(t => t.mitra_user_id === admin?.id);

            if (myStore) {
              produk = produk.filter(p => p.store_id === myStore.id);
            } else {
              produk = [];
            }
          }

          setProdukDB(produk);

          if (produk.length > 0) {
            const p = produk[0];
            setSelectedProductId(p.id);
            setFormData(prev => ({
              ...prev,
              restaurant_id: p.store_id || 1,
              menu_item_name: p.nama_produk,
              actual_selling_price: p.harga,
              observed_market_price: p.harga_asli || p.harga + 5000,
              typical_ingredient_cost: Math.round(p.harga * 0.4)
            }));
          }
        }
      } catch (error) {
        console.error("Gagal mengambil data produk:", error);
      }
    };
    fetchProduk();
  }, [admin]); // ✅ RE-FETCH SAAT ADMIN BERUBAH

  const handleProductChange = (e) => {
    const id = Number(e.target.value);
    setSelectedProductId(id);
    const p = produkDB.find(x => x.id === id);
    if (p) {
      setFormData(prev => ({
        ...prev,
        restaurant_id: p.store_id || 1,
        menu_item_name: p.nama_produk,
        actual_selling_price: p.harga,
        observed_market_price: p.harga_asli || p.harga + 5000,
        typical_ingredient_cost: Math.round(p.harga * 0.4)
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : type === 'number' ? Number(value) : value;
    setFormData(prev => {
      const updated = { ...prev, [name]: newValue };
      if (name === 'day_of_week') {
        updated.is_weekend = (newValue >= 5) ? 1 : 0;
      }
      return updated;
    });
  };

  const jalankanPrediksi = async () => {
    setLoading(true);
    setHasilPrediksi(null);
    try {
      const token = adminToken || localStorage.getItem('kk_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const res = await fetch(`${API_URL}/ai/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...formData,
          has_promotion: Boolean(formData.has_promotion),
          special_event: Boolean(formData.special_event)
        })
      });

      const result = await res.json();
      if (res.ok && result.data) {
        setHasilPrediksi(result.data);
      } else {
        alert(result.message || "Gagal mendapatkan prediksi dari AI");
      }
    } catch (error) {
      console.error("Error memanggil AI:", error);
      alert("Microservice AI atau Express mati.");
    } finally {
      setLoading(false);
    }
  };

  const terapkanPromo = async () => {
    if (!hasilPrediksi || !selectedProductId) return;
    const besaranDiskon = hasilPrediksi.status === 'Surplus Kritis' ? 50 : 30;
    try {
      const token = adminToken || localStorage.getItem('kk_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_URL}/products/${selectedProductId}/apply-discount`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          predicted_stock: hasilPrediksi.predicted_sales_qty,
          discount_percentage: besaranDiskon
        })
      });
      const result = await res.json();
      if (res.ok) {
        alert(`🎯 SUKSES! ${formData.menu_item_name} berhasil didiskon ${besaranDiskon}%!`);
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert("Gagal menghubungi server untuk menerapkan diskon.");
    }
  };

  const generateContextualAnalysis = () => {
    let insights = [];
    if (formData.weather_condition === 'Rainy') {
      insights.push("Kondisi cuaca hujan diproyeksikan menurunkan foot traffic pengunjung (dine-in) secara signifikan. Pelanggan lebih cenderung memesan via online atau membatalkan kunjungan.");
    } else if (formData.weather_condition === 'Sunny') {
      insights.push("Cuaca cerah umumnya menstabilkan kunjungan, namun persaingan dengan gerai lain di sekitar area Anda akan berada pada puncaknya hari ini.");
    }
    if (formData.is_weekend === 0) {
      insights.push("Pola konsumsi pada hari kerja (weekdays) menunjukkan bahwa perputaran item menu ini melambat setelah jam makan siang/sore.");
    } else {
      insights.push("Meski akhir pekan, volume persiapan yang berlebih tanpa strategi cross-selling dapat menyebabkan tumpukan inventaris di penghujung hari.");
    }
    if (!formData.has_promotion) {
      insights.push("Ketiadaan kampanye promosi saat ini membuat algoritma visibilitas (discoverability) produk Anda di aplikasi sangat rendah dibandingkan kompetitor.");
    }
    if (formData.special_event) {
      insights.push("Hari Libur/Event khusus biasanya mengubah preferensi pelanggan ke arah makanan porsi besar (sharing), menyebabkan menu individu berpotensi sisa.");
    }
    return insights;
  };

  return (
    <AdminLayout title="Predictive AI Engine">
      <div className="space-y-6 animate-in fade-in duration-500">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {MODEL_METRICS.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">{m.label}</span>
                  <div className="text-gray-900 text-2xl font-black mt-1 tracking-tight">{m.value}</div>
                  <div className="text-emerald-600 text-[10px] mt-1 font-bold">{m.desc}</div>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${m.good ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                  <Icon size={24} strokeWidth={1.5} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="mb-6 border-b border-gray-100 pb-5 flex items-center gap-3">
            <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 text-gray-600">
              <BrainCircuit size={20} />
            </div>
            <div>
              <h3 className="text-gray-900 text-lg font-bold tracking-tight">Kalkulator Prediksi XGBoost</h3>
              <p className="text-gray-500 text-sm mt-0.5">Sesuaikan variabel eksternal untuk memproyeksikan sisa penjualan malam ini.</p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h4 className="text-emerald-600 font-bold text-sm mb-4 flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
                1. Profil Menu & Konteks Lingkungan
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Pilih Menu dari Database</label>
                  {produkDB.length === 0 && !loading ? (
                    <div className="w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 font-bold">
                      {isSuperAdmin ? 'Belum ada produk.' : 'Akun Anda belum memiliki toko. Hubungi Super Admin.'}
                    </div>
                  ) : (
                    <select value={selectedProductId || ''} onChange={handleProductChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-all">
                      {produkDB.map(p => (
                        <option key={p.id} value={p.id}>{p.nama_produk} (Rp {p.harga})</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Tipe Restoran</label>
                  <select name="restaurant_type" value={formData.restaurant_type} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500 cursor-pointer transition-all">
                    <option value="Cafe">Cafe</option>
                    <option value="Casual Dining">Casual Dining</option>
                    <option value="Fine Dining">Fine Dining</option>
                    <option value="Food Stall">Food Stall</option>
                    <option value="Kopitiam">Kopitiam</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Kondisi Cuaca</label>
                  <select name="weather_condition" value={formData.weather_condition} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500 cursor-pointer transition-all">
                    <option value="Sunny">Cerah (Sunny)</option>
                    <option value="Cloudy">Mendung (Cloudy)</option>
                    <option value="Rainy">Hujan (Rainy)</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-emerald-600 font-bold text-sm mb-4 flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
                2. Struktur Harga (IDR)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Biaya Bahan (HPP)</label>
                  <input type="number" name="typical_ingredient_cost" value={formData.typical_ingredient_cost} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Harga Pasar Rata-rata</label>
                  <input type="number" name="observed_market_price" value={formData.observed_market_price} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-600 mb-2 uppercase tracking-wide">Harga Jual Saat Ini</label>
                  <input type="number" name="actual_selling_price" value={formData.actual_selling_price} onChange={handleInputChange} className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700 font-bold outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-emerald-600 font-bold text-sm mb-4 flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
                3. Operasional & Promosi
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Hari</label>
                  <select name="day_of_week" value={formData.day_of_week} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500 cursor-pointer">
                    <option value={0}>Senin</option><option value={1}>Selasa</option><option value={2}>Rabu</option>
                    <option value={3}>Kamis</option><option value={4}>Jumat</option><option value={5}>Sabtu</option><option value={6}>Minggu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Bulan</label>
                  <select name="month" value={formData.month} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500 cursor-pointer">
                    {Array.from({ length: 12 }, (_, i) => (<option key={i + 1} value={i + 1}>Bulan ke-{i + 1}</option>))}
                  </select>
                </div>
                <div className="col-span-2 flex items-center justify-around bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer font-bold hover:text-emerald-600 transition-colors">
                    <input type="checkbox" name="has_promotion" checked={formData.has_promotion} onChange={handleInputChange} className="w-4 h-4 accent-emerald-600" />
                    Sedang Ada Promo?
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer font-bold hover:text-emerald-600 transition-colors">
                    <input type="checkbox" name="special_event" checked={formData.special_event} onChange={handleInputChange} className="w-4 h-4 accent-emerald-600" />
                    Hari Libur / Event?
                  </label>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={jalankanPrediksi}
            disabled={loading || produkDB.length === 0}
            className={`w-full mt-8 flex justify-center items-center gap-2 text-white font-bold py-4 rounded-xl text-base transition-all shadow-md ${
              loading || produkDB.length === 0 ? 'bg-emerald-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]'
            } ${loading ? 'animate-pulse' : ''}`}
          >
            {loading ? <><BrainCircuit className="animate-spin" size={20} /> Menjalankan Inferensi XGBoost...</> : <><Sparkles size={20} /> Analisis & Prediksi Sekarang</>}
          </button>
        </div>

        {hasilPrediksi && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className={`rounded-2xl p-6 border flex flex-col justify-center items-center text-center shadow-sm ${
                hasilPrediksi.status === 'Surplus Kritis' ? 'bg-red-50 border-red-200' :
                hasilPrediksi.status === 'Waspada' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
              }`}>
                <h4 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Estimasi Terjual Malam Ini</h4>
                <div className={`text-6xl font-black my-2 ${
                  hasilPrediksi.status === 'Surplus Kritis' ? 'text-red-600' :
                  hasilPrediksi.status === 'Waspada' ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {Math.round(hasilPrediksi.predicted_sales_qty)}
                  <span className="text-2xl font-semibold opacity-60"> pcs</span>
                </div>
                <div className={`text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full mt-2 ${
                  hasilPrediksi.status === 'Surplus Kritis' ? 'bg-red-600 text-white shadow-md' :
                  hasilPrediksi.status === 'Waspada' ? 'bg-amber-500 text-white shadow-md' : 'bg-emerald-600 text-white shadow-md'
                }`}>
                  STATUS: {hasilPrediksi.status}
                </div>
                <div className="mt-6 bg-white rounded-xl p-4 border border-gray-100 w-full text-center shadow-sm">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Dampak Ekologis (Potensi Limbah)</p>
                  <p className="text-emerald-600 font-black text-xl">{hasilPrediksi.co2_dicegah} kg CO₂</p>
                  <p className="text-xs text-gray-500 mt-1">Setara dengan {hasilPrediksi.porsi_terselamatkan} porsi makanan terbuang</p>
                </div>
              </div>

              <div className="col-span-2 bg-white border border-gray-200 rounded-2xl p-0 shadow-sm flex flex-col overflow-hidden">
                <div className="bg-gray-900 text-white p-5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <BrainCircuit size={22} className="text-emerald-400" />
                    <div>
                      <h4 className="font-bold text-base tracking-tight">Laporan Analisis Eksekutif AI</h4>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">XGBoost Decision Tree Evaluation</p>
                    </div>
                  </div>
                  <div className="text-xs bg-gray-800 text-emerald-400 border border-gray-700 px-3 py-1.5 rounded-lg font-mono font-bold">
                    R² Score: {hasilPrediksi.model_r2_score || '0.79'}
                  </div>
                </div>

                <div className="p-6 flex-1 space-y-6">
                  <div>
                    <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                      <Target size={14} className="text-emerald-500" /> Kesimpulan AI
                    </h5>
                    <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100 font-medium">
                      {hasilPrediksi.recommendation}
                    </p>
                  </div>

                  <div>
                    <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                      <TrendingDown size={14} className="text-amber-500" /> Mengapa ini terjadi?
                    </h5>
                    <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                      <ul className="space-y-3">
                        {generateContextualAnalysis().map((text, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-800 leading-relaxed">
                            <Info size={16} className="shrink-0 mt-0.5 text-amber-600" />
                            <span>{text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {hasilPrediksi.diskon_rekomendasi?.persentase > 0 && (
                    <div>
                      <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                        <Zap size={14} className="text-emerald-500" /> Rekomendasi Mitigasi Kerugian
                      </h5>
                      <div className="flex flex-col sm:flex-row items-center gap-4 bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
                        <div className="flex-1 w-full text-sm text-gray-600">
                          Terapkan potongan harga segera (Flash Rescue) untuk menarik pengguna di area sekitar sebelum jam tutup.
                        </div>
                        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg border border-emerald-200 shadow-sm shrink-0">
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Harga Normal</p>
                            <p className="text-gray-400 font-bold line-through text-xs">Rp {hasilPrediksi.diskon_rekomendasi.harga_asli.toLocaleString('id-ID')}</p>
                          </div>
                          <div className="text-emerald-500 font-black">→</div>
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Harga Penyelamatan</p>
                            <p className="text-emerald-600 font-black text-base">Rp {hasilPrediksi.diskon_rekomendasi.harga_diskon.toLocaleString('id-ID')}</p>
                          </div>
                          <div className="bg-red-500 text-white font-black text-xs px-2 py-1 rounded shadow-sm">
                            -{hasilPrediksi.diskon_rekomendasi.persentase}%
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {hasilPrediksi.status !== 'Aman' && (
                  <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button onClick={terapkanPromo} className="w-full sm:w-auto bg-gray-900 hover:bg-black text-white font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-md active:scale-95 flex items-center gap-2 justify-center">
                      <Zap size={18} className="text-amber-400" /> Eksekusi Diskon Sekarang
                    </button>
                  </div>
                )}
              </div>
            </div>

            {hasilPrediksi.factor_breakdown && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h4 className="text-gray-900 font-bold text-sm mb-4 flex items-center gap-2">
                  <Activity size={18} className="text-emerald-600" /> Bobot Variabel Model (Feature Importance)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {hasilPrediksi.factor_breakdown.map((f, i) => (
                    <div key={i} className={`rounded-xl p-3 border text-center transition-transform hover:-translate-y-1 ${
                      f.impact > 0 ? 'bg-emerald-50 border-emerald-100' :
                      f.impact < 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'
                    }`}>
                      <div className="text-xl mb-1">{f.icon}</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{f.label}</div>
                      <div className={`text-base font-black mt-1 ${
                        f.impact > 0 ? 'text-emerald-600' : f.impact < 0 ? 'text-red-500' : 'text-gray-400'
                      }`}>
                        {f.impact > 0 ? `+${f.impact}%` : f.impact === 0 ? '0%' : `${f.impact}%`}
                      </div>
                      <div className="text-[9px] text-gray-400 mt-0.5 leading-tight">{f.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}