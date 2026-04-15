import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Calendar, Download, TrendingUp, DollarSign, Package, Filter, ChevronDown, Printer, FileText, Loader2, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import XLSX from 'xlsx-js-style';

const Reports = () => {
  const { sales, products } = useStore();
  const [activeTab, setActiveTab] = useState<'SALES' | 'STOCK'>('SALES');
  const [dateRange, setDateRange] = useState('Semua Periode');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales.filter(sale => {
      const saleDate = new Date(sale.date);

      switch (dateRange) {
        case 'Hari Ini':
          return saleDate.toDateString() === now.toDateString();
        case '7 Hari Terakhir':
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(now.getDate() - 7);
          return saleDate >= oneWeekAgo;
        case 'Bulan Ini':
          return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
        case 'Tahun Ini':
          return saleDate.getFullYear() === now.getFullYear();
        case 'Semua Periode':
        default:
          return true;
      }
    });
  }, [sales, dateRange]);

  const totalRevenue = filteredSales.reduce((acc, sale) => acc + sale.total, 0);
  const totalTransactions = filteredSales.length;
  const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  const trendData = useMemo(() => {
    const now = new Date();
    let previousSales: typeof sales = [];

    switch (dateRange) {
      case 'Hari Ini': {
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        previousSales = sales.filter(s => new Date(s.date).toDateString() === yesterday.toDateString());
        break;
      }
      case '7 Hari Terakhir': {
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(now.getDate() - 14);
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        previousSales = sales.filter(s => {
          const d = new Date(s.date);
          return d >= twoWeeksAgo && d < oneWeekAgo;
        });
        break;
      }
      case 'Bulan Ini': {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        previousSales = sales.filter(s => {
          const d = new Date(s.date);
          return d >= lastMonth && d <= lastMonthEnd;
        });
        break;
      }
      case 'Tahun Ini': {
        previousSales = sales.filter(s => new Date(s.date).getFullYear() === now.getFullYear() - 1);
        break;
      }
      default:
        previousSales = [];
    }

    const prevRevenue = previousSales.reduce((acc, s) => acc + s.total, 0);
    const prevTransactions = previousSales.length;
    const prevAvg = prevTransactions > 0 ? prevRevenue / prevTransactions : 0;

    const calcTrend = (current: number, previous: number) => {
      if (previous === 0) return { direction: current > 0 ? 'up' as const : null, value: current > 0 ? '+100%' : '--' };
      const pct = ((current - previous) / previous) * 100;
      return {
        direction: pct >= 0 ? 'up' as const : 'down' as const,
        value: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
      };
    };

    return {
      revenue: calcTrend(totalRevenue, prevRevenue),
      transactions: calcTrend(totalTransactions, prevTransactions),
      avg: calcTrend(avgTransaction, prevAvg)
    };
  }, [sales, filteredSales, dateRange, totalRevenue, totalTransactions, avgTransaction]);

  const chartData = useMemo(() => {
    const data = filteredSales.reduce((acc: any[], sale) => {
      const dateObj = new Date(sale.date);
      const date = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      const timestamp = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime();

      const existing = acc.find(item => item.name === date);
      if (existing) {
        existing.total += sale.total;
      } else {
        acc.push({ name: date, total: sale.total, timestamp });
      }
      return acc;
    }, []);

    return data.sort((a, b) => a.timestamp - b.timestamp);
  }, [filteredSales]);

  const totalStockValue = products.reduce((acc, p) => acc + (p.cost * p.stock), 0);
  const totalPotentialRevenue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
  const potentialProfit = totalPotentialRevenue - totalStockValue;

  const handleDateSelect = (range: string) => {
    setDateRange(range);
    setIsDateDropdownOpen(false);
  };

  const handleExport = () => {
    setIsExporting(true);

    setTimeout(() => {
      const headers = ['ID Transaksi', 'Tanggal', 'Waktu', 'Kasir', 'Metode Bayar', 'Nama Produk', 'Qty', 'Harga Satuan', 'Subtotal Item', 'Subtotal', 'PPN', 'Total'];

      const rows: string[][] = [];
      filteredSales.forEach(sale => {
        sale.items.forEach((item, idx) => {
          rows.push([
            idx === 0 ? sale.id : '',
            idx === 0 ? new Date(sale.date).toLocaleDateString('id-ID') : '',
            idx === 0 ? new Date(sale.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '',
            idx === 0 ? sale.cashier : '',
            idx === 0 ? sale.paymentMethod : '',
            item.name,
            item.qty.toString(),
            item.price.toString(),
            (item.qty * item.price).toString(),
            idx === 0 ? (sale.subtotal ?? '').toString() : '',
            idx === 0 ? (sale.tax ?? '').toString() : '',
            idx === 0 ? sale.total.toString() : ''
          ]);
        });
      });

      const escapeCSV = (val: string) => `"${val.replace(/"/g, '""')}"`;

      const csvContent = [
        headers.map(escapeCSV).join(','),
        ...rows.map(e => e.map(escapeCSV).join(','))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Laporan_Penjualan_${dateRange.replace(/ /g, '_')}_${new Date().getTime()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsExporting(false);
    }, 500);
  };

  const handleExportStock = () => {
    try {
      const headerStyle = {
        font: { name: 'Arial', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '059669' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      };

      const cellStyle = {
        font: { name: 'Arial', sz: 9 },
        border: {
          top: { style: 'thin', color: { rgb: 'D1D5DB' } },
          bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
          left: { style: 'thin', color: { rgb: 'D1D5DB' } },
          right: { style: 'thin', color: { rgb: 'D1D5DB' } }
        }
      };

      const numStyle = { ...cellStyle, alignment: { horizontal: 'right' }, numFmt: '#,##0' };

      const wsData: any[][] = [];
      wsData.push([
        { v: 'Produk', s: headerStyle },
        { v: 'SKU', s: headerStyle },
        { v: 'Stok', s: headerStyle },
        { v: 'Satuan', s: headerStyle },
        { v: 'HPP (Modal)', s: headerStyle },
        { v: 'Harga Jual', s: headerStyle },
        { v: 'Total Aset', s: headerStyle },
        { v: 'Potensi Omset', s: headerStyle }
      ]);

      products.forEach(p => {
        wsData.push([
          { v: p.name, s: cellStyle },
          { v: p.sku, s: cellStyle },
          { v: p.stock, s: { ...cellStyle, alignment: { horizontal: 'center' } } },
          { v: p.unit, s: { ...cellStyle, alignment: { horizontal: 'center' } } },
          { v: p.cost, s: numStyle },
          { v: p.price, s: numStyle },
          { v: p.cost * p.stock, s: numStyle },
          { v: p.price * p.stock, s: numStyle }
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [
        { wch: 30 }, { wch: 12 }, { wch: 8 }, { wch: 8 },
        { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 16 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Valuasi Stok');
      XLSX.writeFile(wb, `Valuasi_Stok_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Export stock error:', err);
    }
  };

  const KPICard = ({ title, value, icon: Icon, colorClass, trend, trendValue }: any) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden group hover:shadow-md transition-all duration-300">
      <div className="flex justify-between items-start z-10 relative">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-2xl font-brand font-bold text-gray-900 dark:text-white">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 dark:bg-opacity-20`}>
          <Icon size={24} className={colorClass.replace('bg-', 'text-').replace('100', '600')} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-xs font-medium">
          <span className={`flex items-center ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'} bg-gray-50 dark:bg-slate-700/50 px-2 py-1 rounded-lg`}>
            {trend === 'up' ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
            {trendValue}
          </span>
          <span className="text-gray-400 ml-2">vs periode lalu</span>
        </div>
      )}
    </div>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs">
          <p className="font-bold mb-1">{label}</p>
          <p className="text-emerald-400 font-mono">Rp {payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div>
          <h2 className="text-2xl font-brand font-bold text-gray-900 dark:text-white">Laporan & Analitik</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Analisis performa bisnis dan audit aset secara mendalam.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Date Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
              className="flex items-center px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors min-w-[160px] justify-between"
            >
              <span className="flex items-center"><Calendar size={16} className="mr-2 text-gray-400" /> {dateRange}</span>
              <ChevronDown size={14} className={`ml-2 transition-transform ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDateDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsDateDropdownOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  {['Hari Ini', '7 Hari Terakhir', 'Bulan Ini', 'Tahun Ini', 'Semua Periode'].map((item) => (
                    <button
                      key={item}
                      onClick={() => handleDateSelect(item)}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 transition-colors ${dateRange === item ? 'font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={isExporting || filteredSales.length === 0}
            className="flex items-center px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200/50 dark:shadow-none active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isExporting ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <Download size={16} className="mr-2" />
            )}
            {isExporting ? 'Memproses...' : 'Export Laporan'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex p-1 bg-gray-100 dark:bg-slate-900/50 rounded-xl w-fit border border-gray-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('SALES')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'SALES'
            ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
        >
          Penjualan
        </button>
        <button
          onClick={() => setActiveTab('STOCK')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'STOCK'
            ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
        >
          Stok & Aset
        </button>
      </div>

      {activeTab === 'SALES' ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KPICard
              title="Pendapatan (Terfilter)"
              value={`Rp ${totalRevenue.toLocaleString()}`}
              icon={DollarSign}
              colorClass="bg-emerald-100"
              trend={trendData.revenue.direction}
              trendValue={trendData.revenue.value}
            />
            <KPICard
              title="Transaksi (Terfilter)"
              value={totalTransactions}
              icon={Printer}
              colorClass="bg-blue-100"
              trend={trendData.transactions.direction}
              trendValue={trendData.transactions.value}
            />
            <KPICard
              title="Rata-rata Keranjang"
              value={`Rp ${avgTransaction.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              icon={Package}
              colorClass="bg-purple-100"
              trend={trendData.avg.direction}
              trendValue={trendData.avg.value}
            />
          </div>

          {/* Chart */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Tren Penjualan</h3>
                <p className="text-xs text-gray-500">Performa penjualan harian dalam periode: <span className="font-semibold text-emerald-600">{dateRange}</span></p>
              </div>
            </div>
            {/* FIX #6: Added 'relative' so absolute overlay positions correctly */}
            <div className="h-[350px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.length > 0 ? chartData : [{ name: 'No Data', total: 0 }]}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickFormatter={(val) => `${val / 1000}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#059669' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              {filteredSales.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center bg-white/80 dark:bg-slate-800/80 p-4 rounded-xl">
                    <p className="text-gray-500 font-medium">Tidak ada data pada periode ini</p>
                    <p className="text-xs text-gray-400">Coba ubah filter tanggal ke "Semua Periode"</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800">
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Riwayat Transaksi</h3>
                <p className="text-xs text-gray-500">Daftar transaksi untuk periode: {dateRange}</p>
              </div>
              <div className="text-xs font-mono text-gray-400">
                Menampilkan {filteredSales.length} data
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-gray-400">ID TRX</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-gray-400">Waktu</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-gray-400">Kasir</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-gray-400">Metode</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-gray-400 text-center">Item</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-gray-400 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {/* FIX #2: Sort transactions by date descending (newest first) */}
                  {[...filteredSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(sale => (
                    <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-gray-800 dark:text-white">{sale.id}</td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900 dark:text-white font-medium">{new Date(sale.date).toLocaleDateString('id-ID')}</div>
                        <div className="text-xs text-gray-400">{new Date(sale.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="px-6 py-4">{sale.cashier}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${sale.paymentMethod === 'QRIS' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800' :
                          sale.paymentMethod === 'DEBIT' ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800' :
                            'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800'
                          }`}>
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-full text-xs font-bold text-gray-600 dark:text-gray-300">{sale.items.length}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">Rp {sale.total.toLocaleString()}</td>
                    </tr>
                  ))}
                  {filteredSales.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                        <FileText size={48} className="mx-auto mb-3 opacity-20" />
                        <p>Belum ada data penjualan pada periode ini.</p>
                        <button onClick={() => setDateRange('Semua Periode')} className="text-emerald-500 hover:underline mt-2 text-xs">Lihat Semua Periode</button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          {/* Stock Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KPICard
              title="Nilai Aset (Modal)"
              value={`Rp ${totalStockValue.toLocaleString()}`}
              icon={Layers}
              colorClass="bg-blue-100"
            />
            <KPICard
              title="Potensi Omset (Jual)"
              value={`Rp ${totalPotentialRevenue.toLocaleString()}`}
              icon={TrendingUp}
              colorClass="bg-emerald-100"
            />
            <KPICard
              title="Estimasi Laba Kotor"
              value={`Rp ${potentialProfit.toLocaleString()}`}
              icon={DollarSign}
              colorClass="bg-purple-100"
            />
          </div>

          {/* Stock Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800">
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Valuasi Stok Produk</h3>
                <p className="text-xs text-gray-500">Detail nilai aset berdasarkan stok saat ini.</p>
              </div>
              {/* FIX #4: Wired up onClick handler for stock export */}
              <button
                onClick={handleExportStock}
                className="flex items-center text-sm text-emerald-600 hover:text-emerald-700 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Download size={14} className="mr-2" /> Export XLSX
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-gray-400">Produk</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-gray-400 text-center">Stok Fisik</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-gray-400 text-right">HPP (Modal)</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-gray-400 text-right">Harga Jual</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-gray-400 text-right">Total Aset</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                        <div className="text-xs text-gray-400">{product.sku}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${product.stock <= product.minStock ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300'}`}>
                          {product.stock} {product.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">Rp {product.cost.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">Rp {product.price.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                        Rp {(product.stock * product.cost).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;