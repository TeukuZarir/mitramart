import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Search, Plus, Minus, Trash2, CreditCard, Banknote, QrCode,
  ShoppingCart, Archive, X, Calculator, ArrowRight, Printer, CheckCircle, RotateCcw,
  Store, Clock, Calendar
} from 'lucide-react';
import { CATEGORIES } from '../constants';
import { Sale } from '../types';

const POS = () => {
  const { products, cart, addToCart, removeFromCart, updateCartQty, clearCart, processCheckout, currentUser, storeSettings } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [activePayment, setActivePayment] = useState<'CASH' | 'QRIS' | 'DEBIT'>('CASH');

  const [mobileView, setMobileView] = useState<'PRODUCTS' | 'CART'>('PRODUCTS');

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [cashReceived, setCashReceived] = useState<string>('');

  const [successData, setSuccessData] = useState<{
    sale: Sale | null;
    change: number;
    cashGiven: number;
  }>({
    sale: null,
    change: 0,
    cashGiven: 0
  });

  const receiptRef = useRef<HTMLDivElement>(null);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = Math.round(cartTotal * 0.11); // 11% PPN, rounded to match receipt
  const grandTotal = cartTotal + tax;

  const cashValue = parseFloat(cashReceived) || 0;
  const change = cashValue - grandTotal;
  const isPaymentValid = activePayment !== 'CASH' || cashValue >= grandTotal;

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode.includes(searchTerm) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setIsPaymentModalOpen(true);
    setCashReceived('');
  };

  const handleQuickCash = (amount: number) => {
    setCashReceived(amount.toString());
  };

  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcessTransaction = async () => {
    if (!isPaymentValid || isProcessing) return;
    setIsProcessing(true);

    const currentCashValue = cashValue;
    const currentChange = change;

    try {
      const saleResult = await processCheckout(activePayment);

      if (saleResult) {
        setSuccessData({
          sale: saleResult,
          change: currentChange,
          cashGiven: currentCashValue
        });

        setIsPaymentModalOpen(false);
        setIsSuccessModalOpen(true);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewTransaction = () => {
    setIsSuccessModalOpen(false);
    setCashReceived('');
    setActivePayment('CASH');
    setSuccessData({ sale: null, change: 0, cashGiven: 0 });
  };

  const handlePrint = () => {
    window.print();
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative print:h-auto print:overflow-visible">

      {/* --- HIDDEN RECEIPT TEMPLATE (VISIBLE ONLY ON PRINT) --- */}
      <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:z-[9999] print:p-8">
        <div className="max-w-[80mm] mx-auto font-mono text-xs text-black">
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold uppercase mb-1">{storeSettings.storeName}</h1>
            {storeSettings.storeAddress.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
            <p>Telp: {storeSettings.storePhone}</p>
          </div>

          <div className="border-b-2 border-dashed border-black pb-2 mb-2">
            <div className="flex justify-between">
              <span>Tgl : {successData.sale ? new Date(successData.sale.date).toLocaleDateString('id-ID') : ''}</span>
              <span>Jam : {successData.sale ? new Date(successData.sale.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
            </div>
            <div className="flex justify-between">
              <span>No  : {successData.sale?.id}</span>
              <span>Kasir: {successData.sale?.cashier}</span>
            </div>
          </div>

          <div className="mb-2">
            {successData.sale?.items.map((item, idx) => (
              <div key={idx} className="mb-1">
                <div className="font-bold">{item.name}</div>
                <div className="flex justify-between">
                  <span>{item.qty} x {item.price.toLocaleString()}</span>
                  <span>{(item.qty * item.price).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t-2 border-dashed border-black pt-2 mb-2">
            {/* FIX #2: Use stored subtotal and tax instead of reverse-calculating */}
            <div className="flex justify-between font-bold">
              <span>Subtotal</span>
              <span>{successData.sale ? successData.sale.subtotal.toLocaleString() : 0}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>PPN (11%)</span>
              <span>{successData.sale ? successData.sale.tax.toLocaleString() : 0}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-black pt-1 mt-1">
              <span>TOTAL</span>
              <span>{successData.sale ? successData.sale.total.toLocaleString() : 0}</span>
            </div>
          </div>

          {/* FIX #4: Use successData.sale.paymentMethod instead of mutable activePayment */}
          <div className="mb-4">
            <div className="flex justify-between">
              <span>Bayar ({successData.sale?.paymentMethod})</span>
              <span>{successData.sale?.paymentMethod === 'CASH' ? successData.cashGiven.toLocaleString() : successData.sale?.total.toLocaleString()}</span>
            </div>
            {successData.sale?.paymentMethod === 'CASH' && (
              <div className="flex justify-between">
                <span>Kembali</span>
                <span>{successData.change.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="text-center border-t border-black pt-4">
            {storeSettings.invoiceFooter.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
            <p className="mt-2 text-[10px]">* Layanan Konsumen: {storeSettings.serviceContact} *</p>
          </div>
        </div>
      </div>

      {/* --- NORMAL UI (HIDDEN ON PRINT) --- */}
      <div className="contents print:hidden">

        {/* Mobile Tab Toggle - Only visible on mobile */}
        <div className="lg:hidden flex gap-2 mb-4 p-1 bg-gray-100 dark:bg-slate-700 rounded-xl">
          <button
            onClick={() => setMobileView('PRODUCTS')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${mobileView === 'PRODUCTS'
              ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
              }`}
          >
            <Archive size={18} />
            Produk
          </button>
          <button
            onClick={() => setMobileView('CART')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all relative ${mobileView === 'CART'
              ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
              }`}
          >
            <ShoppingCart size={18} />
            Keranjang
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {cart.reduce((acc, item) => acc + item.qty, 0)}
              </span>
            )}
          </button>
        </div>

        {/* Left: Product Grid - Hidden on mobile when viewing cart */}
        <div className={`flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden ${mobileView === 'CART' ? 'hidden lg:flex' : 'flex'}`}>
          {/* Filter Bar */}
          <div className="p-4 border-b border-gray-100 dark:border-slate-700 space-y-4">
            <div className="relative">
              <input
                autoFocus
                type="text"
                placeholder="Scan barcode, ketik nama produk, atau SKU..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                      ${selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200 dark:shadow-none'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-slate-900/50">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => {
                    const isExpired = product.expiryDate && new Date(product.expiryDate) < new Date();
                    if (isExpired) {
                      return; // Don't add expired products
                    }
                    if (product.stock > 0) addToCart(product);
                  }}
                  className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-3 flex flex-col group relative overflow-hidden transition-all duration-200
                    ${(product.stock > 0 && !(product.expiryDate && new Date(product.expiryDate) < new Date())) ? 'cursor-pointer hover:shadow-md hover:border-emerald-400 hover:-translate-y-1' : 'opacity-60 cursor-not-allowed grayscale'}
                  `}
                >
                  <div className="aspect-square bg-gray-100 dark:bg-slate-700 rounded-lg mb-3 overflow-hidden relative">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    {product.stock > 0 && product.stock <= product.minStock && (
                      <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        Sisa {product.stock}
                      </div>
                    )}
                    {/* FIX M2: Show expired badge */}
                    {product.expiryDate && new Date(product.expiryDate) < new Date() && (
                      <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        Expired
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-gray-800 dark:text-white line-clamp-2 leading-tight min-h-[2.5rem] mb-1">{product.name}</h4>
                  <p className="text-xs text-gray-400 mb-2">{product.sku}</p>
                  <div className="mt-auto flex justify-between items-end">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">Rp {product.price.toLocaleString()}</span>
                  </div>
                  {product.stock <= 0 && (
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/70 flex flex-col items-center justify-center text-red-600 dark:text-white font-bold backdrop-blur-[1px]">
                      <Archive size={24} className="mb-1" />
                      <span className="text-sm">Stok Habis</span>
                    </div>
                  )}
                  {/* FIX M2: Expired product overlay */}
                  {product.stock > 0 && product.expiryDate && new Date(product.expiryDate) < new Date() && (
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/70 flex flex-col items-center justify-center text-red-600 dark:text-white font-bold backdrop-blur-[1px]">
                      <Archive size={24} className="mb-1" />
                      <span className="text-sm">Kedaluwarsa</span>
                    </div>
                  )}
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center text-gray-400 py-12">
                  <Search size={48} className="mb-2 opacity-20" />
                  <p>Produk tidak ditemukan</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Cart & Checkout - Hidden on mobile when viewing products */}
        <div className={`w-full lg:w-[400px] bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 flex flex-col h-full z-10 ${mobileView === 'PRODUCTS' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
            <h2 className="font-bold text-lg flex items-center gap-2 text-gray-800 dark:text-white">
              <ShoppingCart size={20} className="text-emerald-600" />
              Keranjang
            </h2>
            <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full">
              {cart.reduce((acc, item) => acc + item.qty, 0)} items
            </span>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white dark:bg-slate-800">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                  <ShoppingCart size={40} />
                </div>
                <p className="font-medium">Keranjang masih kosong</p>
                <p className="text-xs">Pilih produk di sebelah kiri</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex gap-3 bg-gray-50 dark:bg-slate-700/30 p-2.5 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-slate-600 transition-colors group">
                  <div className="w-14 h-14 bg-gray-200 dark:bg-slate-600 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.name}</h4>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">@ Rp {item.price.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <p className="text-sm font-bold text-gray-800 dark:text-white">
                      Rp {(item.price * item.qty).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-600 rounded-lg p-0.5 shadow-sm border border-gray-200 dark:border-slate-500">
                      <button
                        onClick={() => updateCartQty(item.id, item.qty - 1)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-slate-500 rounded-md text-gray-600 dark:text-gray-200 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-xs font-bold w-6 text-center tabular-nums">{item.qty}</span>
                      <button
                        onClick={() => updateCartQty(item.id, item.qty + 1)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-slate-500 rounded-md text-gray-600 dark:text-gray-200 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary Area */}
          <div className="p-5 bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700">
            <div className="space-y-2 text-sm mb-5">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>{formatRupiah(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>PPN (11%)</span>
                <span>{formatRupiah(tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-xl text-gray-900 dark:text-white pt-3 border-t border-gray-200 dark:border-slate-600">
                <span>Total</span>
                <span>{formatRupiah(grandTotal)}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 mt-5">
              <button onClick={clearCart} disabled={cart.length === 0} className="col-span-1 py-3.5 border border-red-200 bg-red-50 text-red-600 dark:bg-red-900/20 dark:border-red-900 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Trash2 size={20} />
              </button>
              <button
                disabled={cart.length === 0}
                onClick={handleOpenPayment}
                className="col-span-3 py-3.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-lg shadow-emerald-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <span>Bayar</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* --- PAYMENT MODAL --- */}
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Konfirmasi Pembayaran</h3>
                <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Total Display */}
                <div className="text-center space-y-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Tagihan</p>
                  <h2 className="text-4xl font-brand font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                    {formatRupiah(grandTotal)}
                  </h2>
                </div>

                {/* Payment Method Toggle */}
                <div className="grid grid-cols-3 gap-3 p-1 bg-gray-100 dark:bg-slate-700 rounded-xl">
                  {(['CASH', 'QRIS', 'DEBIT'] as const).map((method) => (
                    <button
                      key={method}
                      onClick={() => setActivePayment(method)}
                      className={`flex flex-col items-center justify-center py-3 rounded-lg text-xs font-bold transition-all ${activePayment === method
                        ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                        }`}
                    >
                      {method === 'CASH' && <Banknote size={20} className="mb-1" />}
                      {method === 'QRIS' && <QrCode size={20} className="mb-1" />}
                      {method === 'DEBIT' && <CreditCard size={20} className="mb-1" />}
                      {method}
                    </button>
                  ))}
                </div>

                {/* Cash Input Section */}
                {activePayment === 'CASH' && (
                  <div className="space-y-4 animate-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Uang Diterima (Tunai)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-3.5 text-gray-400 font-bold">Rp</span>
                        <input
                          type="number"
                          autoFocus
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl text-lg font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Quick Amounts */}
                    <div className="grid grid-cols-4 gap-2">
                      <button onClick={() => handleQuickCash(grandTotal)} className="px-2 py-2 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100">Uang Pas</button>
                      <button onClick={() => handleQuickCash(20000)} className="px-2 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-slate-700">20.000</button>
                      <button onClick={() => handleQuickCash(50000)} className="px-2 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-slate-700">50.000</button>
                      <button onClick={() => handleQuickCash(100000)} className="px-2 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-slate-700">100.000</button>
                    </div>

                    {/* Change Display */}
                    <div className={`p-4 rounded-xl border flex justify-between items-center ${change >= 0
                      ? 'bg-blue-50 border-blue-100 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200'
                      : 'bg-red-50 border-red-100 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
                      }`}>
                      <span className="text-sm font-bold">Kembalian</span>
                      <span className="text-xl font-mono font-bold">{formatRupiah(change >= 0 ? change : 0)}</span>
                    </div>

                    {change < 0 && cashValue > 0 && (
                      <p className="text-xs text-red-500 font-medium text-center">Uang pembayaran kurang Rp {formatRupiah(Math.abs(change))}</p>
                    )}
                  </div>
                )}

                {/* Non-Cash Instructions */}
                {activePayment !== 'CASH' && (
                  <div className="p-6 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-700 text-center space-y-3 animate-in slide-in-from-top-2">
                    {activePayment === 'QRIS' ? <QrCode size={48} className="mx-auto text-gray-400" /> : <CreditCard size={48} className="mx-auto text-gray-400" />}
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Silakan selesaikan pembayaran senilai <strong className="text-emerald-600 dark:text-emerald-400">{formatRupiah(grandTotal)}</strong> melalui mesin EDC atau scan QR Code.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex gap-3">
                <button onClick={() => setIsPaymentModalOpen(false)} className="flex-1 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors">
                  Batal
                </button>
                <button
                  onClick={handleProcessTransaction}
                  disabled={!isPaymentValid || isProcessing}
                  className="flex-[2] py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200/50 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span>{isProcessing ? 'Memproses...' : 'Selesaikan Transaksi'}</span>
                  {!isProcessing && <CheckCircle size={18} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- SUCCESS MODAL --- */}
        {isSuccessModalOpen && successData.sale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
              <div className="w-full h-2 bg-emerald-500"></div>
              <div className="p-8 space-y-6">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle size={40} />
                </div>

                <div>
                  <h2 className="text-2xl font-brand font-bold text-gray-900 dark:text-white">Pembayaran Berhasil!</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    {new Date(successData.sale.date).toLocaleDateString()} • {new Date(successData.sale.date).toLocaleTimeString()}
                  </p>
                </div>

                {/* Receipt Summary */}
                <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-700 text-sm w-full">
                  <div className="flex justify-between text-gray-500 dark:text-gray-400 mb-2 border-b border-gray-200 dark:border-slate-700 pb-2">
                    <span>ID Transaksi</span>
                    <span className="font-mono text-gray-800 dark:text-white">{successData.sale.id}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Total Tagihan</span>
                    <span className="font-bold text-gray-900 dark:text-white">{formatRupiah(successData.sale.total)}</span>
                  </div>
                  {successData.sale.paymentMethod === 'CASH' && (
                    <>
                      <div className="flex justify-between mb-1 text-xs">
                        <span className="text-gray-500">Tunai</span>
                        <span>{formatRupiah(successData.cashGiven)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                        <span>Kembalian</span>
                        <span>{formatRupiah(successData.change)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-3 w-full">
                  <button
                    onClick={handlePrint}
                    className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <Printer size={18} />
                    Cetak Struk
                  </button>
                  <button
                    onClick={handleNewTransaction}
                    className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200/50 dark:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={18} />
                    Transaksi Baru
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default POS;