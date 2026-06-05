import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../components/AdminLayout';
import { formatRp } from '../../data/products';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  Search, RefreshCw, X, FileText, Clock, Package,
  CheckCircle2, XCircle, ShoppingBag, TrendingUp, AlertCircle,
  Printer, ShieldCheck, User, Calendar, MapPin, Download, Zap,
  CreditCard, Wallet, Building, Hash, Store
} from 'lucide-react';

const STATUS_OPTIONS = ['Semua', 'Sedang Diproses', 'Dikemas', 'Dikirim', 'Selesai', 'Dibatalkan'];

const STATUS_CONFIG = {
  'Sedang Diproses': { color: 'text-amber-700 bg-amber-50 border-amber-200', icon: Clock },
  'Dikemas':         { color: 'text-blue-700 bg-blue-50 border-blue-200',   icon: Package },
  'Dikirim':         { color: 'text-purple-700 bg-purple-50 border-purple-200', icon: ShoppingBag },
  'Selesai':         { color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  'sukses':          { color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  'Dibatalkan':      { color: 'text-red-700 bg-red-50 border-red-200',      icon: XCircle },
};

// Peta metode pembayaran dari ID ke label tampilan yang detail
const PAYMENT_DISPLAY = {
  'ewallet':        { label: 'QRIS / E-Wallet',      sub: 'GoPay, OVO, Dana, ShopeePay', icon: Wallet,   color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  'bank':           { label: 'Virtual Account',      sub: 'BCA, Mandiri, BNI, BRI',      icon: Building, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  'qris':           { label: 'QRIS',                 sub: 'Scan QR Pembayaran',           icon: Wallet,   color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  'virtual_account':{ label: 'Virtual Account',      sub: 'Transfer Bank',                icon: Building, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  'cash':           { label: 'Tunai (Cash)',         sub: 'Bayar di Tempat',              icon: CreditCard, color: 'text-slate-700 bg-slate-50 border-slate-200' },
};

const getPaymentDisplay = (raw) => {
  if (!raw) return { label: 'Tidak Diketahui', sub: '-', icon: CreditCard, color: 'text-slate-700 bg-slate-50 border-slate-200' };
  const key = raw.toLowerCase().replace(/\s+/g, '_');
  return PAYMENT_DISPLAY[key] || PAYMENT_DISPLAY[raw.toLowerCase()] || {
    label: raw,
    sub: 'Metode Pembayaran Lainnya',
    icon: CreditCard,
    color: 'text-slate-700 bg-slate-50 border-slate-200',
  };
};

const generatePremiumInvoice = (id, dateString) => {
  if (!dateString) return `INV-X999-0000`;
  const timeHash = new Date(dateString).getTime().toString(36).toUpperCase().slice(-4);
  const idHash = (Number(id) * 8191).toString(36).toUpperCase().padStart(4, '0');
  return `INV-${timeHash}-${idHash}`;
};

export default function AdminPesanan() {
  const [filterStatus, setFilterStatus]     = useState('Semua');
  const [search, setSearch]                 = useState('');
  const [pesananList, setPesananList]       = useState([]);
  const [loading, setLoading]               = useState(true);
  const [isRefreshing, setIsRefreshing]     = useState(false);
  const [selectedOrder, setSelectedOrder]   = useState(null);

  const { adminToken, admin } = useAdminAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const isSuperAdmin = admin?.role === 'superadmin';

  const fetchPesanan = async (showSync = false) => {
    if (showSync) setIsRefreshing(true);
    try {
      const token = adminToken || localStorage.getItem('kk_token');
      const [resTx, resStores] = await Promise.all([
        fetch(`${API_URL}/transactions`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/stores`)
      ]);
      const dataTx     = await resTx.json();
      const dataStores = await resStores.json();

      let currentMitraStore = null;
      if (!isSuperAdmin && dataStores.status === 'success') {
        currentMitraStore =
          dataStores.data.find(t => t.id === admin?.store_id) ||
          dataStores.data.find(t => t.mitra_user_id === admin?.id);
      }

      if (dataTx.status === 'success') {
        let rawTransactions = dataTx.data;
        if (!isSuperAdmin && currentMitraStore) {
          rawTransactions = rawTransactions.filter(p => p.store_id === currentMitraStore.id);
        } else if (!isSuperAdmin && !currentMitraStore) {
          rawTransactions = [];
        }

        const formatted = rawTransactions.map(p => ({
          rawId:             p.id,
          id:                generatePremiumInvoice(p.id, p.created_at || new Date()),
          pelanggan:         p.nama_user || `Customer #${p.user_id}`,
          telepon:           p.telepon || p.phone || null,
          nama_produk:       p.nama_produk || `Produk #${p.product_id}`,
          items:             p.quantity || p.items || 1,
          total:             Number(p.total_harga || 0),
          tanggal:           new Date(p.created_at || Date.now()).toLocaleDateString('id-ID', {
                               day: 'numeric', month: 'short', year: 'numeric',
                               hour: '2-digit', minute: '2-digit'
                             }),
          nama_toko:         p.nama_toko || '-',
          // ✅ Ambil metode pembayaran dari backend, fallback ke null
          metode_pembayaran: p.payment_method || p.metode_pembayaran || null,
          status:            p.status === 'sukses' ? 'Selesai' : (p.status || 'Sedang Diproses'),
          shipping_address:  p.shipping_address || 'Ambil di Toko (Self-Pickup)',
        }));
        setPesananList(formatted);
      }
    } catch (error) {
      console.error('Error Fetching Orders:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { fetchPesanan(); }, [admin]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      setPesananList(prev => prev.map(p => p.rawId === id ? { ...p, status: newStatus } : p));
      const token = adminToken || localStorage.getItem('kk_token');
      const res = await fetch(`${API_URL}/transactions/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) { alert('Gagal memperbarui status di server!'); fetchPesanan(); }
    } catch (error) {
      console.error('Error Updating Status:', error);
    }
  };

  const handleExportCSV = () => {
    const headers = 'No. Invoice,Pelanggan,Item,Jumlah,Total Tagihan,Waktu Masuk,Status,Metode Bayar\n';
    const csvContent = filtered.map(p =>
      `${p.id},"${p.pelanggan}","${p.nama_produk}",${p.items},${p.total},"${p.tanggal}",${p.status},"${p.metode_pembayaran || '-'}"`
    ).join('\n');
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Data_Manifes_KeduaKali_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statsSummary = useMemo(() => {
    const counts = { Semua: pesananList.length, 'Sedang Diproses': 0, Dikemas: 0, Dikirim: 0, Selesai: 0, Dibatalkan: 0 };
    let totalRevenue = 0;
    let pendingAction = 0;
    pesananList.forEach(p => {
      if (counts[p.status] !== undefined) counts[p.status]++;
      if (p.status === 'Selesai') totalRevenue += p.total;
      if (p.status === 'Sedang Diproses' || p.status === 'Dikemas') pendingAction++;
    });
    return { counts, totalRevenue, pendingAction };
  }, [pesananList]);

  const filtered = pesananList.filter(p => {
    const matchStatus = filterStatus === 'Semua' || p.status === filterStatus;
    const matchSearch = p.pelanggan.toLowerCase().includes(search.toLowerCase()) ||
                        p.id.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <AdminLayout title="Manajemen Pesanan">
      <div className="space-y-6 font-sans text-slate-800 animate-in fade-in duration-300">

        {/* ── STAT CARDS ── */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                <TrendingUp size={22} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Pendapatan</p>
                <p className="text-xl font-black text-slate-900 tracking-tight">{formatRp(statsSummary.totalRevenue)}</p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0 relative">
                {statsSummary.pendingAction > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white"></span>
                )}
                <AlertCircle size={22} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Perlu Tindakan</p>
                <p className="text-xl font-black text-slate-900 tracking-tight">{statsSummary.pendingAction} Pesanan</p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Integritas Data</p>
                <p className="text-xl font-black text-slate-900 tracking-tight">Terlindungi</p>
              </div>
            </div>
          </div>
        )}

        {/* ── FILTER & SEARCH BAR ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all placeholder:text-slate-400"
                placeholder="Cari Invoice atau Pelanggan..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => fetchPesanan(true)}
              className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-colors shadow-sm shrink-0"
            >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleExportCSV}
              className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-white hover:bg-slate-800 transition-colors shadow-sm shrink-0 active:scale-95"
              title="Download Laporan CSV"
            >
              <Download size={18} />
            </button>
          </div>

          <div className="flex gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 w-full lg:w-auto overflow-x-auto">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 flex-1 lg:flex-none justify-center whitespace-nowrap ${
                  filterStatus === s
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {s}
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${filterStatus === s ? 'bg-slate-100 text-slate-700' : 'bg-slate-200/50'}`}>
                  {statsSummary.counts[s] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── TABEL PESANAN ── */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['Invoice', 'Pelanggan & Item', 'Waktu Masuk', 'Total Tagihan', 'Status', 'Detail'].map(h => (
                    <th key={h} className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-16 text-slate-400 font-medium animate-pulse">Memuat data pesanan...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-16 text-slate-500 font-medium">Tidak ada antrean pesanan di toko ini.</td></tr>
                ) : (
                  filtered.map(p => {
                    const statusData = STATUS_CONFIG[p.status] || STATUS_CONFIG['Sedang Diproses'];
                    const isUrgent   = p.status === 'Sedang Diproses';
                    return (
                      <tr key={p.rawId} className={`transition-colors group ${isUrgent ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-slate-50/70'}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {isUrgent && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0"></div>}
                            <div className="text-xs font-mono font-bold text-slate-600 border border-slate-200 bg-white px-2 py-1 rounded w-fit shadow-sm">{p.id}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-slate-900 mb-1">{p.pelanggan}</div>
                          <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 font-bold">{p.items}x</span>
                            <span className="truncate max-w-[150px]">{p.nama_produk}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 font-medium">{p.tanggal}</td>
                        <td className="px-6 py-4 text-sm font-black text-slate-900">{formatRp(p.total)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={p.status}
                              onChange={e => handleStatusChange(p.rawId, e.target.value)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg outline-none cursor-pointer border shadow-sm transition-colors w-36 appearance-none text-center ${statusData.color}`}
                            >
                              <option value="Sedang Diproses">Sedang Diproses</option>
                              <option value="Dikemas">Dikemas</option>
                              <option value="Dikirim">Dikirim</option>
                              <option value="Selesai">Selesai</option>
                              <option value="Dibatalkan">Dibatalkan</option>
                            </select>
                            {isUrgent && (
                              <button
                                onClick={() => handleStatusChange(p.rawId, 'Dikemas')}
                                className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                                title="Tandai Dikemas"
                              >
                                <Zap size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedOrder(p)}
                            className="p-2 bg-white hover:bg-slate-50 text-slate-500 hover:text-emerald-600 rounded-lg transition-colors border border-slate-200 shadow-sm group-hover:border-emerald-200"
                          >
                            <FileText size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── MODAL DETAIL PESANAN ── */}
      {selectedOrder && (() => {
        const payment = getPaymentDisplay(selectedOrder.metode_pembayaran);
        const PaymentIcon = payment.icon;
        const statusData = STATUS_CONFIG[selectedOrder.status] || STATUS_CONFIG['Sedang Diproses'];
        const StatusIcon = statusData.icon;
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">

              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 shadow-sm">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Detail Pesanan</h3>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">{selectedOrder.id}</div>
                  </div>
                </div>
                {/* ✅ Hanya satu tombol close — X di pojok kanan atas */}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">

                {/* Info Pelanggan & Tanggal */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1.5"><User size={11} /> Pelanggan</p>
                    <p className="font-bold text-sm text-slate-900">{selectedOrder.pelanggan}</p>
                    {selectedOrder.telepon && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{selectedOrder.telepon}</p>
                    )}
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1.5"><Calendar size={11} /> Waktu Masuk</p>
                    <p className="font-bold text-sm text-slate-900">{selectedOrder.tanggal}</p>
                  </div>
                </div>

                {/* Toko & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1.5"><Store size={11} /> Toko</p>
                    <p className="font-bold text-sm text-slate-900">{selectedOrder.nama_toko}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1.5"><MapPin size={11} /> Status</p>
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md border ${statusData.color}`}>
                      <StatusIcon size={11} />
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>

                {/* Item Pesanan */}
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase mb-2.5 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <Hash size={11} /> Item Pesanan
                  </p>
                  <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200">{selectedOrder.items}x</div>
                      <span className="text-sm font-bold text-slate-800">{selectedOrder.nama_produk}</span>
                    </div>
                    <span className="font-black text-slate-900 text-sm">{formatRp(selectedOrder.total)}</span>
                  </div>
                </div>

                {/* Alamat Pengambilan */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 flex items-start gap-3">
                  <MapPin size={15} className="text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Metode Pengambilan</p>
                    <p className="text-sm font-semibold text-slate-700">{selectedOrder.shipping_address}</p>
                  </div>
                </div>

                {/* ✅ Metode Pembayaran — DINAMIS & DETAIL */}
                <div className={`rounded-xl p-4 border flex items-center gap-4 ${payment.color}`}>
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-white/80">
                    <PaymentIcon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-0.5">Metode Pembayaran</p>
                    <p className="font-black text-sm">{payment.label}</p>
                    <p className="text-[11px] font-medium opacity-70 mt-0.5">{payment.sub}</p>
                  </div>
                </div>

                {/* Total */}
                <div className="pt-3 border-t border-dashed border-slate-200 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">No. Invoice</p>
                    <p className="text-xs font-mono font-bold text-slate-600">{selectedOrder.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Total Tagihan</p>
                    <p className="font-black text-2xl text-slate-900 tracking-tight">{formatRp(selectedOrder.total)}</p>
                  </div>
                </div>
              </div>

              {/* Footer — ✅ Hanya Cetak Bukti, full width, tidak ada Tutup Jendela */}
              <div className="p-4 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={() => window.print()}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-95"
                >
                  <Printer size={16} /> Cetak Bukti Pembayaran
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </AdminLayout>
  );
}