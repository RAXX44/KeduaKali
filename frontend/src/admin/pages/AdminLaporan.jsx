import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { formatRp } from '../../data/products';
import { Cloud, Utensils, Droplet, Banknote, Download, Trophy, Sparkles } from 'lucide-react';

export default function AdminLaporan() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const { admin, adminToken } = useAdminAuth(); // ✅ TAMBAH admin

  const isSuperAdmin = admin?.role === 'superadmin'; // ✅ ROLE BENAR

  const [impactData, setImpactData] = useState({
    makananDiselamatkan: 0,
    emisiDicegah: 0,
    airDihemat: 0,
    danaTerselamatkan: 0
  });

  useEffect(() => {
    const fetchImpactData = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const token = adminToken || localStorage.getItem('kk_token');

        // ✅ Fetch transaksi + stores sekaligus untuk filter mitra
        const [resTrx, resStores] = await Promise.all([
          fetch(`${API_URL}/transactions`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/stores`)
        ]);

        const result = await resTrx.json();
        const resultStores = await resStores.json();

        if (result.status === 'success') {
          let allTrx = result.data;

          // ✅ FILTER: Mitra hanya lihat data toko mereka sendiri
          if (!isSuperAdmin && resultStores.status === 'success') {
            const myStore = resultStores.data.find(t => t.id === admin?.store_id)
              || resultStores.data.find(t => t.mitra_user_id === admin?.id);

            if (myStore) {
              allTrx = allTrx.filter(t => t.store_id === myStore.id);
            } else {
              allTrx = [];
            }
          }

          const trxSukses = allTrx.filter(t => t.status === 'sukses' || t.status === 'Selesai');
          setTransactions(trxSukses);

          const totalPorsi = trxSukses.reduce((sum, t) => sum + (t.quantity || t.items || 1), 0);
          const totalDana = trxSukses.reduce((sum, t) => sum + Number(t.total_harga || 0), 0);

          setImpactData({
            makananDiselamatkan: totalPorsi,
            emisiDicegah: (totalPorsi * 0.5).toFixed(1),
            airDihemat: totalPorsi * 20,
            danaTerselamatkan: totalDana
          });
        }
      } catch (error) {
        console.error("Gagal menarik data laporan ESG:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchImpactData();
  }, [admin]); // ✅ RE-FETCH SAAT ADMIN BERUBAH

  const chartData = useMemo(() => {
    if (transactions.length === 0) return { labels: [], values: [], max: 100 };

    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    });

    const dataMap = {};
    last7Days.forEach(date => dataMap[date] = 0);

    transactions.forEach(t => {
      const trxDate = new Date(t.created_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      const porsi = t.quantity || t.items || 1;
      const emisi = porsi * 0.5;
      if (dataMap[trxDate] !== undefined) {
        dataMap[trxDate] += emisi;
      }
    });

    const values = last7Days.map(date => dataMap[date]);
    const maxValue = Math.max(...values, 5);

    return { labels: last7Days, values, max: maxValue };
  }, [transactions]);

  const esgMetrics = [
    { label: 'Emisi Karbon Dicegah', value: impactData.emisiDicegah, unit: 'Kg CO₂e', icon: Cloud, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { label: 'Makanan Diselamatkan', value: impactData.makananDiselamatkan, unit: 'Porsi', icon: Utensils, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { label: 'Jejak Air Dihemat', value: impactData.airDihemat.toLocaleString('id-ID'), unit: 'Liter', icon: Droplet, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
    { label: 'Suntikan Dana Ekonomi', value: formatRp(impactData.danaTerselamatkan), unit: '', icon: Banknote, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  ];

  return (
    <AdminLayout title="ESG & Laporan Dampak">
      <div className="space-y-6 font-sans text-slate-800 animate-in fade-in duration-500 print:bg-white print:p-0">

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-slate-900 text-xl font-black tracking-tight flex items-center gap-2">
              Laporan Keberlanjutan <Sparkles size={20} className="text-amber-400" />
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">
              {isSuperAdmin
                ? 'Laporan metrik ESG dikalkulasi dari seluruh transaksi platform.'
                : 'Laporan metrik ESG dikalkulasi dari transaksi toko Anda.'}
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="bg-slate-900 hover:bg-black text-white px-5 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-md active:scale-95 print:hidden"
          >
            <Download size={16} /> Unduh / Cetak Laporan
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {esgMetrics.map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow group">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border transition-transform group-hover:scale-110 ${m.color}`}>
                  <Icon size={26} strokeWidth={2} />
                </div>
                <div className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-1.5">{m.label}</div>
                <div className="text-slate-900 text-2xl font-black tracking-tight">
                  {loading ? '...' : m.value} <span className="text-xs font-semibold text-slate-500 ml-1">{m.unit}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between group">
            <div className="mb-8">
              <h3 className="text-slate-900 font-black tracking-tight">Tren Reduksi Emisi Karbon</h3>
              <p className="text-slate-500 text-xs mt-1 font-medium">Jejak karbon (Kg CO₂e) yang tidak jadi terlepas 7 hari terakhir.</p>
            </div>
            <div className="flex items-end justify-between gap-2 h-40 w-full relative">
              {loading ? (
                <div className="w-full text-center text-slate-400 text-sm animate-pulse pb-10">Mengkalkulasi data grafis...</div>
              ) : chartData.values.length === 0 ? (
                <div className="w-full text-center text-slate-400 text-sm pb-10">Belum ada data transaksi.</div>
              ) : (
                chartData.values.map((val, i) => {
                  const heightPercentage = (val / chartData.max) * 100;
                  return (
                    <div key={i} className="flex flex-col items-center flex-1 group/bar">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity mb-2">
                        {val.toFixed(1)}
                      </span>
                      <div
                        className="w-full bg-emerald-100 group-hover/bar:bg-emerald-500 rounded-t-md transition-colors duration-500 relative"
                        style={{ height: `${heightPercentage}%`, minHeight: '4px' }}
                      ></div>
                      <span className="text-[9px] font-bold text-slate-400 mt-2 uppercase">{chartData.labels[i]}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-center items-center text-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
            <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center text-amber-400 mb-5 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
              <Trophy size={36} strokeWidth={1.5} />
            </div>
            <h3 className="text-white text-xl font-black mb-3 tracking-tight">Sertifikat Green Initiative</h3>
            <p className="text-slate-300 text-sm max-w-sm mb-6 leading-relaxed">
              {isSuperAdmin ? 'Platform KeduaKali' : 'Toko Anda'} telah menyelamatkan cukup makanan untuk menutupi konsumsi kalori
              <strong className="text-amber-400 font-black ml-1 text-base">{loading ? '...' : Math.floor(impactData.makananDiselamatkan / 3)} Keluarga</strong>
              <br />selama sehari penuh.
            </p>
            <button
              onClick={() => alert("Metodologi: 1 Porsi = 0.5 Kg CO2e emisi dicegah & 20 Liter air jejak agrikultur dihemat. Rasio keluarga dihitung dari 3 porsi per KK/hari.")}
              className="text-slate-900 bg-emerald-400 hover:bg-emerald-300 px-6 py-3 rounded-xl text-sm font-black transition-colors active:scale-95 shadow-lg print:hidden"
            >
              Lihat Metodologi Kalkulasi
            </button>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}