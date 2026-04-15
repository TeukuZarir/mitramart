import React, { useMemo, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, Package, AlertTriangle, DollarSign, Clock, CheckCircle, Wallet, ArrowRight, ChevronRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const KPICard = ({ title, value, subtext, icon: Icon, color, trend }: any) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-start justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{title}</p>
      <h3 className="text-3xl font-brand font-bold text-gray-800 dark:text-white mb-2 tracking-tight">{value}</h3>
      <div className={`flex items-center text-xs font-medium ${trend === 'up' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400'} w-fit px-2 py-1 rounded-full`}>
        <TrendingUp size={14} className={`mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
        <span>{subtext}</span>
      </div>
    </div>
    <div className={`p-3.5 rounded-xl ${color} shadow-lg shadow-gray-200 dark:shadow-none group-hover:scale-110 transition-transform`}>
      <Icon size={24} className="text-white" />
    </div>
  </div>
);

const Dashboard = () => {
  const { products, sales, setView, setSearch, setViewAndSearch } = useStore();

  const totalStock = products.reduce((acc, curr) => acc + curr.stock, 0);
  const lowStockList = products.filter(p => p.stock <= p.minStock);
  const lowStockCount = lowStockList.length;

  const totalAssetValue = products.reduce((acc, curr) => acc + (curr.cost * curr.stock), 0);

  const monthlySalesData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();

    const thisMonthSales = sales
      .filter(s => {
        const d = new Date(s.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((acc, s) => acc + s.total, 0);

    const lastMonthSales = sales
      .filter(s => {
        const d = new Date(s.date);
        return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
      })
      .reduce((acc, s) => acc + s.total, 0);

    const percentChange = lastMonthSales > 0
      ? ((thisMonthSales - lastMonthSales) / lastMonthSales) * 100
      : thisMonthSales > 0 ? 100 : 0;

    return { thisMonthSales, percentChange };
  }, [sales]);

  const recentSales = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const categoryData = useMemo(() => {
    const categoryCount: Record<string, number> = {};
    products.forEach(p => {
      let location = p.location || 'Lainnya';
      if (location.toLowerCase().startsWith('rak')) {
        const match = location.match(/rak\s*([a-zA-Z])/i);
        location = match ? `Rak ${match[1].toUpperCase()}` : 'Rak Lain';
      } else if (location.toLowerCase().includes('kulkas')) {
        location = 'Kulkas';
      } else {
        location = 'Lainnya';
      }
      categoryCount[location] = (categoryCount[location] || 0) + p.stock;
    });

    const total = Object.values(categoryCount).reduce((a, b) => a + b, 0);
    return Object.entries(categoryCount)
      .map(([name, count]) => ({
        name,
        value: total > 0 ? Math.round((count / total) * 100) : 0,
        count
      }))
      .sort((a, b) => b.count - a.count);
  }, [products]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const [chartPeriod, setChartPeriod] = useState<7 | 30>(7);

  const salesData = useMemo(() => {
    const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const salesByDay: Record<string, number> = {};
    days.forEach(d => salesByDay[d] = 0);

    const periodAgo = new Date();
    periodAgo.setDate(periodAgo.getDate() - (chartPeriod - 1));
    periodAgo.setHours(0, 0, 0, 0);

    sales.forEach(sale => {
      const saleDate = new Date(sale.date);
      if (saleDate >= periodAgo) {
        const dayIndex = saleDate.getDay();
        const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1]; // Adjust for Monday start
        salesByDay[dayName] = (salesByDay[dayName] || 0) + sale.total;
      }
    });

    return days.map(name => ({
      name,
      sales: salesByDay[name] || 0
    }));
  }, [sales, chartPeriod]);

  const handleProductClick = (productName: string) => {
    setViewAndSearch('INVENTORY', productName);
  };

  const handleTransactionClick = () => {
    setView('REPORTS');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-brand font-bold text-gray-900 dark:text-white">Ringkasan Operasional</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Pantau kesehatan inventaris dan performa penjualan hari ini.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm">
          <Clock size={14} className="text-emerald-500" />
          <span>Terakhir diperbarui: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* FIX #1: Gunakan data penjualan nyata dari bulan ini */}
        <KPICard
          title="Total Penjualan (Bulan Ini)"
          value={`Rp ${monthlySalesData.thisMonthSales >= 1000000
            ? (monthlySalesData.thisMonthSales / 1000000).toFixed(1) + 'jt'
            : monthlySalesData.thisMonthSales.toLocaleString('id-ID')}`}
          subtext={`${monthlySalesData.percentChange >= 0 ? '+' : ''}${monthlySalesData.percentChange.toFixed(1)}% vs bulan lalu`}
          icon={DollarSign}
          color="bg-emerald-500"
          trend={monthlySalesData.percentChange >= 0 ? 'up' : 'down'}
        />
        {/* FIX #4: Judul diperjelas agar tidak membingungkan antara SKU vs unit stok */}
        <KPICard
          title="Total Unit Stok"
          value={totalStock.toLocaleString()}
          subtext={`${products.length} SKU Produk Aktif`}
          icon={Package}
          color="bg-blue-500"
          trend="up"
        />
        <KPICard
          title="Estimasi Nilai Aset"
          value={`Rp ${(totalAssetValue / 1000000).toFixed(1)}jt`}
          subtext="Modal tertanam di gudang"
          icon={Wallet}
          color="bg-indigo-500"
          trend="up"
        />
        <KPICard
          title="Perlu Restock"
          value={lowStockCount}
          subtext="Produk di bawah batas minimum"
          icon={AlertTriangle}
          color="bg-rose-500"
          trend="down"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Sales Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Tren Pendapatan</h3>
            <select
              value={chartPeriod}
              onChange={(e) => setChartPeriod(Number(e.target.value) as 7 | 30)}
              className="text-xs border-none bg-gray-100 dark:bg-slate-700 rounded-lg px-2 py-1 text-gray-600 dark:text-gray-300 focus:ring-0 cursor-pointer"
            >
              <option value={7}>7 Hari Terakhir</option>
              <option value={30}>30 Hari Terakhir</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(value) => `${value / 1000000}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: number) => `Rp ${value.toLocaleString()}`}
                />
                <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Komposisi Stok</h3>
          <p className="text-xs text-gray-400 mb-6">Distribusi kategori barang di gudang</p>
          <div className="flex-1 min-h-[200px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <span className="text-2xl font-bold text-gray-800 dark:text-white">{categoryData.length}</span>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Kategori</p>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {categoryData.slice(0, 4).map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className="w-2.5 h-2.5 rounded-full mr-3" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-gray-600 dark:text-gray-300 font-medium">{entry.name}</span>
                </div>
                <span className="text-gray-400">{entry.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800">
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <CheckCircle size={20} className="text-emerald-500" />
                Transaksi Terakhir
              </h3>
            </div>
            <button
              onClick={() => setView('REPORTS')}
              className="text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-3 py-1.5 rounded-lg transition-all font-medium flex items-center group"
            >
              Lihat Semua <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider text-gray-400">ID TRX</th>
                  <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider text-gray-400">Total</th>
                  <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider text-gray-400">Metode</th>
                  <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider text-gray-400 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {recentSales.map((sale) => (
                  <tr
                    key={sale.id}
                    onClick={handleTransactionClick}
                    className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-mono font-medium text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">{sale.id}</div>
                      <div className="text-xs text-gray-400">{new Date(sale.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">Rp {sale.total.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${sale.paymentMethod === 'QRIS' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800' :
                        sale.paymentMethod === 'DEBIT' ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800' :
                          'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800'
                        }`}>
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight size={16} className="ml-auto text-gray-300 group-hover:text-emerald-500" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Alert Table (Fixing Empty State and Interactions) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800">
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <AlertTriangle size={20} className="text-rose-500" />
                Perlu Perhatian
              </h3>
            </div>
            <button
              onClick={() => setView('INVENTORY')}
              className="text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-3 py-1.5 rounded-lg transition-all font-medium flex items-center group"
            >
              Lihat Semua <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider text-gray-400">Produk</th>
                  <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider text-gray-400">Stok Fisik</th>
                  <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider text-gray-400 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {lowStockList.slice(0, 5).map(product => (
                  <tr
                    key={product.id}
                    onClick={() => handleProductClick(product.name)}
                    className="hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white group-hover:text-rose-600 transition-colors">{product.name}</div>
                      <div className="text-xs text-gray-400">Rak: {product.location}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-rose-600 font-bold">{product.stock} <span className="text-xs font-normal text-gray-500">{product.unit}</span></div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-rose-100 text-rose-600 border border-rose-200 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-300">
                        Restock
                      </span>
                    </td>
                  </tr>
                ))}
                {lowStockList.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-3">
                          <CheckCircle size={24} className="text-emerald-500" />
                        </div>
                        <p className="text-gray-800 dark:text-white font-medium">Semua stok aman</p>
                        <p className="text-xs text-gray-400 mt-1">Tidak ada produk di bawah batas minimum.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;