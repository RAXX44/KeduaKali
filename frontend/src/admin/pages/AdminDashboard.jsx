import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { formatRp } from '../../data/products';
import { useAdminAuth } from '../../context/AdminAuthContext'; // ✅ TAMBAH INI
import {
  TrendingUp, Leaf, ShoppingBag, Clock,
  ArrowRight, BrainCircuit, Timer, ShieldCheck, CheckCircle2
} from 'lucide-react';

const STATUS_COLOR = {
  'Sedang Diproses': 'bg-amber-50 text-amber-700 border-amber-200',
  'Dikemas': 'bg-blue-50 text-blue-700 border-blue-200',
  'Dikirim': 'bg-purple-50 text-purple-700 border-purple-200',
  'Selesai': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Dibatalkan': 'bg-red-50 text-red-700 border-red-200',
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { admin, adminToken } = useAdminAuth(); // ✅ AMBIL DATA ADMIN
  const [loading, setLoading] = useState(true);

  const [pesananBaru, setPesananBaru] = useState([]);
  const [topSisa, setTopSisa] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [realStats, setRealStats] = useState({
    pendapatan: 0, terjual: 0, pesananPending: 0, activeListings: 0
  });

  const isSuperAdmin = admin?.role === 'superadmin'; // ✅ ROLE YANG BENAR

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = adminToken || localStorage.getItem('kk_token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

        // ✅ TAMBAH fetch stores untuk filter mitra
        const [resTrx, resProd, resStores] = await Promise.all([
          fetch(`${API_URL}/transactions`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/products`),
          fetch(`${API_URL}/stores`)
        ]);

        const dataTrx = await resTrx.json();
        const dataProd = await resProd.json();
        const dataStores = await resStores.json();

        if (dataTrx.status === 'success' && dataProd.status === 'success') {
          let transaksi = dataTrx.data;
          let produk = dataProd.data;

          // ✅ FILTER DATA BERDASARKAN ROLE
          if (!isSuperAdmin && dataStores.status === 'success') {
            const myStore = dataStores.data.find(t => t.id === admin?.store_id)
              || dataStores.data.find(t => t.mitra_user_id === admin?.id);

            if (myStore) {
              transaksi = transaksi.filter(t => t.store_id === myStore.id);
              produk = produk.filter(p => p.store_id === myStore.id);
            } else {
              // Mitra belum punya toko — kosongkan semua data
              transaksi = [];
              produk = [];
            }
          }

          const trxSukses = transaksi.filter(t => t.status === 'sukses' || t.status === 'Selesai');
          const trxPending = transaksi.filter(t => t.status === 'Sedang Diproses');
          const activeProducts = produk.filter(p => p.stok > 0);

          setRealStats({
            pendapatan: trxSukses.reduce((sum, t) => sum + t.total_harga, 0),
            terjual: trxSukses.length,
            pesananPending: trxPending.length,
            activeListings: activeProducts.length
          });

          setPesananBaru(transaksi.slice(0, 5).map(trx => ({
            id: `#INV-${String(trx.id).padStart(4, '0')}`,
            pelanggan: trx.nama_user || `Customer #${trx.user_id}`,
            total: trx.total_harga,
            status: trx.status === 'sukses' ? 'Selesai' : (trx.status || 'Sedang Diproses')
          })));

          const sortedProduk = [...activeProducts].sort((a, b) => b.stok - a.stok).slice(0, 3);
          setTopSisa(sortedProduk.map(p => ({
            id: p.id,
            name: p.nama_produk || p.name,
            jumlah: p.stok,
            hargaNormal: p.harga_asli || (p.harga + 5000),
            hargaDiskon: p.harga,
            waktuTayang: p.batas_konsumsi || '20:00'
          })));

          const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
          });

          const revenuePerDay = last7Days.map(dateStr => {
            const totalHariIni = trxSukses
              .filter(t => {
                const trxDate = new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                return trxDate === dateStr;
              })
              .reduce((sum, t) => sum + t.total_harga, 0);
            return { tanggal: dateStr, value: totalHariIni };
          });

          setChartData(revenuePerDay);
        }
      } catch (error) {
        console.error("Gagal menarik data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [admin]); // ✅ RE-FETCH SAAT ADMIN BERUBAH

  const DYNAMIC_STATS = [
    { label: 'Revenue Recovered', value: formatRp(realStats.pendapatan), desc: 'Kerugian berhasil dicegah', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Food Waste Prevented', value: `${realStats.terjual} Porsi`, desc: 'Kebaikan untuk lingkungan', icon: Leaf, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Active Listings', value: `${realStats.activeListings} Item`, desc: 'Siap diselamatkan di katalog', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Orders', value: realStats.pesananPending, desc: 'Harus segera diproses', icon: Clock, color: realStats.pesananPending > 0 ? 'text-amber-600' : 'text-slate-400', bg: realStats.pesananPending > 0 ? 'bg-amber-50' : 'bg-slate-50' },
  ];

  return (
    <AdminLayout title="Operational Dashboard">
      <div className="space-y-6">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-slate-900 text-2xl font-black tracking-tight">Kinerja KeduaKali 🚀</h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">Pantau pemulihan pendapatan dan cegah kanibalisasi penjualan.</p>
          </div>
          <button
            onClick={() => navigate('/admin/laporan')}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2"
          >
            <ShieldCheck size={18} className="text-emerald-600" />
            Laporan ESG
          </button>
        </div>

        {!loading && topSisa.length > 0 && (
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-700 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 flex-shrink-0">
                <BrainCircuit className="text-emerald-400" size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  Peringatan Surplus AI{' '}
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </h3>
                <p className="text-slate-300 text-sm mt-1 max-w-xl">
                  Model Time-Series mendeteksi <strong>{topSisa[0]?.jumlah} porsi {topSisa[0]?.name}</strong> berisiko menjadi limbah malam ini.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/prediksi')}
              className="w-full md:w-auto whitespace-nowrap bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95"
            >
              Automatisasi Diskon (AI)
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {DYNAMIC_STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2.5 rounded-xl ${s.bg} border border-white/50 group-hover:scale-110 transition-transform`}>
                    <Icon size={20} className={s.color} />
                  </div>
                </div>
                <div>
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{s.label}</h3>
                  <div className="text-slate-900 text-2xl font-black tracking-tight">{loading ? '...' : s.value}</div>
                  <div className="text-slate-400 text-xs font-medium mt-2">{s.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-slate-900 font-bold text-lg">Manajemen Inventaris Time-Gated</h3>
                <p className="text-slate-500 text-xs font-medium mt-1">Cegah kanibalisasi: Jual surplus hanya pada jam tertentu.</p>
              </div>
            </div>
            <div className="p-6 flex-1">
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center text-slate-400 py-10 animate-pulse">Memuat proyeksi...</div>
                ) : topSisa.length === 0 ? (
                  <div className="text-center text-slate-500 py-10">
                    <CheckCircle2 size={40} className="mx-auto text-emerald-200 mb-3" />
                    Inventaris sangat sehat. Tidak ada potensi limbah hari ini.
                  </div>
                ) : (
                  topSisa.map((p, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center font-black text-lg border border-red-100">
                          {p.jumlah}
                        </div>
                        <div>
                          <h4 className="text-slate-900 font-bold text-sm">{p.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-slate-400 text-xs line-through">{formatRp(p.hargaNormal)}</span>
                            <span className="text-emerald-600 text-xs font-bold">{formatRp(p.hargaDiskon)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:w-auto w-full">
                        <div className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap border border-slate-200">
                          <Timer size={14} /> Tayang: {p.waktuTayang}
                        </div>
                        <button
                          onClick={() => navigate('/admin/prediksi')}
                          className="bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 text-slate-600 p-2 rounded-lg transition-colors"
                        >
                          <BrainCircuit size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
            <h3 className="text-slate-900 font-bold text-lg mb-1">Tren Pemulihan Finansial</h3>
            <p className="text-slate-500 text-xs font-medium mb-4">Pendapatan diselamatkan 7 hari terakhir.</p>

            {loading ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 animate-pulse">Memuat grafik...</div>
            ) : (
              <>
                <div className="mb-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Total 7 Hari</p>
                  <p className="text-xl font-black text-emerald-700">
                    {formatRp(chartData.reduce((sum, d) => sum + d.value, 0))}
                  </p>
                </div>
                <div className="flex items-end justify-between gap-2 h-40 border-b border-slate-100 pb-2 relative">
                  {chartData.map((d, i) => {
                    const maxVal = Math.max(...chartData.map(x => x.value), 1);
                    const heightPct = d.value > 0 ? Math.max((d.value / maxVal) * 100, 12) : 4;
                    const isToday = i === chartData.length - 1;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative" style={{ height: '100%' }}>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[9px] font-bold px-2 py-1 rounded-lg whitespace-nowrap z-20 pointer-events-none">
                          {d.value > 0 ? formatRp(d.value) : 'Rp 0'}
                        </div>
                        <div className="w-full flex items-end justify-center" style={{ height: '100%' }}>
                          <div
                            className={`w-full rounded-t-lg transition-all duration-500 ${
                              isToday
                                ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                                : d.value > 0
                                  ? 'bg-emerald-300 group-hover:bg-emerald-400'
                                  : 'bg-slate-100'
                            }`}
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between gap-2 mt-2">
                  {chartData.map((d, i) => (
                    <div key={i} className="flex-1 text-center">
                      <span className={`text-[9px] font-bold ${i === chartData.length - 1 ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {d.tanggal.split(' ')[0]}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
                    <span className="text-[10px] text-slate-500 font-medium">Hari ini</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-emerald-300"></div>
                    <span className="text-[10px] text-slate-500 font-medium">Hari lalu</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-slate-900 font-bold text-lg">Log Transaksi Penyelamatan</h3>
            <button
              onClick={() => navigate('/admin/pesanan')}
              className="text-emerald-600 hover:text-emerald-700 text-sm font-bold flex items-center gap-1 transition-colors"
            >
              Manajemen Penuh <ArrowRight size={16} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider bg-white">No. Invoice</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider bg-white">Pelanggan</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider bg-white">Total Tagihan</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider bg-white">Status Operasional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="4" className="text-center py-10 text-slate-400 text-sm">Menarik data dari database...</td></tr>
                ) : pesananBaru.length === 0 ? (
                  <tr><td colSpan="4" className="text-center py-10 text-slate-500 text-sm">Belum ada pesanan masuk.</td></tr>
                ) : (
                  pesananBaru.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6 text-sm text-slate-500 font-mono font-medium">{p.id}</td>
                      <td className="py-4 px-6 text-sm text-slate-900 font-bold">{p.pelanggan}</td>
                      <td className="py-4 px-6 text-sm text-emerald-600 font-black">{formatRp(p.total)}</td>
                      <td className="py-4 px-6">
                        <span className={`text-[10px] font-bold px-3 py-1.5 border rounded-lg uppercase tracking-wide ${STATUS_COLOR[p.status] || STATUS_COLOR['Sedang Diproses']}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}