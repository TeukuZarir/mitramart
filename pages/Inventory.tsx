import React, { useState, useRef, useEffect } from 'react';
import { Plus, Filter, Download, Edit2, Trash2, Search, X, Upload, Image as ImageIcon, CheckCircle, Package, DollarSign, Calendar, AlertTriangle, Save, Loader2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CATEGORIES } from '../constants';
import { Product } from '../types';
import XLSX from 'xlsx-js-style';

const UNIT_OPTIONS = ['Pcs', 'Botol', 'Kg', 'Gram', 'Liter', 'Dus', 'Pack', 'Box', 'Sachet', 'Kaleng', 'Bungkus', 'Lainnya'];

const Inventory = () => {
  const { products, searchTerm, setSearch, deleteProduct, addProduct, updateProduct, showToast } = useStore();
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const [previewImage, setPreviewImage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedUnit, setSelectedUnit] = useState<string>('Pcs');
  const [customUnit, setCustomUnit] = useState<string>('');

  const [isExporting, setIsExporting] = useState(false);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleExport = () => {
    if (filteredProducts.length === 0) {
      showToast('Tidak ada data untuk diekspor', 'error');
      return;
    }

    setIsExporting(true);

    try {
      const today = new Date();
      const dateStr = today.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
      const timeStr = today.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

      const titleStyle = {
        font: { name: 'Arial', sz: 18, bold: true, color: { rgb: '1F4E3D' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };

      const subtitleStyle = {
        font: { name: 'Arial', sz: 12, bold: true, color: { rgb: '4A5568' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };

      const infoLabelStyle = {
        font: { name: 'Arial', sz: 10, bold: true, color: { rgb: '374151' } },
        alignment: { horizontal: 'left' }
      };

      const infoValueStyle = {
        font: { name: 'Arial', sz: 10, color: { rgb: '374151' } },
        alignment: { horizontal: 'left' }
      };

      const tableHeaderStyle = {
        font: { name: 'Arial', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '059669' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      };

      const tableCellStyle = {
        font: { name: 'Arial', sz: 9, color: { rgb: '374151' } },
        alignment: { vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'D1D5DB' } },
          bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
          left: { style: 'thin', color: { rgb: 'D1D5DB' } },
          right: { style: 'thin', color: { rgb: 'D1D5DB' } }
        }
      };

      const tableCellNumberStyle = {
        ...tableCellStyle,
        alignment: { horizontal: 'right', vertical: 'center' },
        numFmt: '#,##0'
      };

      const tableCellCenterStyle = {
        ...tableCellStyle,
        alignment: { horizontal: 'center', vertical: 'center' }
      };

      const lowStockStyle = {
        ...tableCellCenterStyle,
        font: { name: 'Arial', sz: 9, bold: true, color: { rgb: 'DC2626' } },
        fill: { fgColor: { rgb: 'FEE2E2' } }
      };

      const normalStockStyle = {
        ...tableCellCenterStyle,
        font: { name: 'Arial', sz: 9, color: { rgb: '059669' } },
        fill: { fgColor: { rgb: 'D1FAE5' } }
      };

      const summaryLabelStyle = {
        font: { name: 'Arial', sz: 10, bold: true, color: { rgb: '1F2937' } },
        fill: { fgColor: { rgb: 'F3F4F6' } },
        alignment: { horizontal: 'left' },
        border: {
          top: { style: 'thin', color: { rgb: 'D1D5DB' } },
          bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
          left: { style: 'thin', color: { rgb: 'D1D5DB' } },
          right: { style: 'thin', color: { rgb: 'D1D5DB' } }
        }
      };

      const summaryValueStyle = {
        font: { name: 'Arial', sz: 10, bold: true, color: { rgb: '059669' } },
        fill: { fgColor: { rgb: 'F3F4F6' } },
        alignment: { horizontal: 'left' },
        border: {
          top: { style: 'thin', color: { rgb: 'D1D5DB' } },
          bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
          left: { style: 'thin', color: { rgb: 'D1D5DB' } },
          right: { style: 'thin', color: { rgb: 'D1D5DB' } }
        }
      };

      const footerStyle = {
        font: { name: 'Arial', sz: 8, italic: true, color: { rgb: '6B7280' } },
        alignment: { horizontal: 'left' }
      };

      const wsData: any[][] = [];

      wsData.push([{ v: 'MITRAMART ENTERPRISE', s: titleStyle }]);
      wsData.push([{ v: 'LAPORAN DATA INVENTARIS', s: subtitleStyle }]);
      wsData.push([]);
      wsData.push([
        { v: 'Tanggal Export:', s: infoLabelStyle },
        { v: `${dateStr} - ${timeStr}`, s: infoValueStyle }
      ]);
      wsData.push([
        { v: 'Total Produk:', s: infoLabelStyle },
        { v: `${filteredProducts.length} item`, s: infoValueStyle }
      ]);
      wsData.push([
        { v: 'Filter Kategori:', s: infoLabelStyle },
        { v: selectedCategory, s: infoValueStyle }
      ]);
      wsData.push([]);

      const headerRow = [
        'No', 'SKU', 'Barcode', 'Nama Produk', 'Kategori', 'Satuan',
        'Harga Beli', 'Harga Jual', 'Margin', 'Margin %',
        'Stok', 'Min', 'Status', 'Lokasi', 'Expired', 'Supplier'
      ].map(h => ({ v: h, s: tableHeaderStyle }));
      wsData.push(headerRow);

      filteredProducts.forEach((product, index) => {
        const margin = product.price - product.cost;
        const marginPercent = product.cost > 0 ? ((margin / product.cost) * 100).toFixed(1) : '0';
        const isLowStock = product.stock <= product.minStock;

        wsData.push([
          { v: index + 1, s: tableCellCenterStyle },
          { v: product.sku, s: tableCellStyle },
          { v: product.barcode, s: tableCellStyle },
          { v: product.name, s: tableCellStyle },
          { v: product.category, s: tableCellCenterStyle },
          { v: product.unit, s: tableCellCenterStyle },
          { v: product.cost, s: tableCellNumberStyle },
          { v: product.price, s: tableCellNumberStyle },
          { v: margin, s: tableCellNumberStyle },
          { v: `${marginPercent}%`, s: tableCellCenterStyle },
          { v: product.stock, s: tableCellCenterStyle },
          { v: product.minStock, s: tableCellCenterStyle },
          { v: isLowStock ? 'LOW STOCK' : 'Normal', s: isLowStock ? lowStockStyle : normalStockStyle },
          { v: product.location, s: tableCellCenterStyle },
          { v: product.expiryDate || '-', s: tableCellCenterStyle },
          { v: product.supplier || 'Internal', s: tableCellStyle }
        ]);
      });

      const totalStock = filteredProducts.reduce((sum, p) => sum + p.stock, 0);
      const totalValue = filteredProducts.reduce((sum, p) => sum + (p.cost * p.stock), 0);
      const lowStockCount = filteredProducts.filter(p => p.stock <= p.minStock).length;

      wsData.push([]); // Empty row
      wsData.push([
        { v: 'RINGKASAN INVENTARIS', s: { ...tableHeaderStyle, fill: { fgColor: { rgb: '374151' } } } }
      ]);
      wsData.push([
        { v: 'Total Item Stok:', s: summaryLabelStyle },
        { v: totalStock.toLocaleString('id-ID'), s: summaryValueStyle }
      ]);
      wsData.push([
        { v: 'Nilai Inventaris:', s: summaryLabelStyle },
        { v: `Rp ${totalValue.toLocaleString('id-ID')}`, s: summaryValueStyle }
      ]);
      wsData.push([
        { v: 'Produk Low Stock:', s: summaryLabelStyle },
        { v: `${lowStockCount} produk`, s: { ...summaryValueStyle, font: { ...summaryValueStyle.font, color: { rgb: 'DC2626' } } } }
      ]);

      wsData.push([]);
      wsData.push([{ v: `Dicetak oleh Sistem MitraMart Enterprise | ${dateStr} pukul ${timeStr}`, s: footerStyle }]);

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      ws['!cols'] = [
        { wch: 5 },   // No
        { wch: 12 },  // SKU
        { wch: 15 },  // Barcode
        { wch: 32 },  // Nama Produk
        { wch: 12 },  // Kategori
        { wch: 8 },   // Satuan
        { wch: 13 },  // Harga Beli
        { wch: 13 },  // Harga Jual
        { wch: 11 },  // Margin
        { wch: 9 },   // Margin %
        { wch: 7 },   // Stok
        { wch: 6 },   // Min
        { wch: 12 },  // Status
        { wch: 10 },  // Lokasi
        { wch: 12 },  // Expired
        { wch: 12 },  // Supplier
      ];

      ws['!rows'] = [
        { hpt: 28 },  // Title row
        { hpt: 20 },  // Subtitle row
      ];

      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 15 } },  // Title
        { s: { r: 1, c: 0 }, e: { r: 1, c: 15 } },  // Subtitle
        { s: { r: 8 + filteredProducts.length + 1, c: 0 }, e: { r: 8 + filteredProducts.length + 1, c: 5 } }, // Summary header
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inventaris');

      const fileDate = today.toISOString().split('T')[0];
      const filename = `Inventaris_MitraMart_${fileDate}.xlsx`;

      XLSX.writeFile(wb, filename);

      showToast(`✅ Berhasil mengekspor ${filteredProducts.length} produk ke ${filename}`, 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToast('Gagal mengekspor data. Silakan coba lagi.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const promptDelete = (id: string) => {
    setProductToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete);
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setProductToDelete(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setPreviewImage(product.image || '');
    if (UNIT_OPTIONS.includes(product.unit)) {
      setSelectedUnit(product.unit);
      setCustomUnit('');
    } else {
      setSelectedUnit('Lainnya');
      setCustomUnit(product.unit);
    }
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setPreviewImage('');
    setSelectedUnit('Pcs');
    setCustomUnit('');
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        showToast('Ukuran gambar terlalu besar! Maksimal 500KB.', 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewImage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const finalImage = previewImage || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNlNWU3ZWIiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzliOWJhMyIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0Ij5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';

    const finalUnit = selectedUnit === 'Lainnya' ? customUnit : selectedUnit;

    const sku = formData.get('sku') as string;
    const barcode = formData.get('barcode') as string;
    const cost = Number(formData.get('cost'));
    const price = Number(formData.get('price'));

    if (!editingProduct || editingProduct.sku !== sku) {
      const existingSku = products.find(p => p.sku === sku && p.id !== editingProduct?.id);
      if (existingSku) {
        showToast(`SKU "${sku}" sudah digunakan oleh produk "${existingSku.name}"`, 'error');
        return;
      }
    }
    if (!editingProduct || editingProduct.barcode !== barcode) {
      const existingBarcode = products.find(p => p.barcode === barcode && p.id !== editingProduct?.id);
      if (existingBarcode) {
        showToast(`Barcode "${barcode}" sudah digunakan oleh produk "${existingBarcode.name}"`, 'error');
        return;
      }
    }

    if (price < cost) {
      showToast(`Peringatan: Harga jual (Rp ${price.toLocaleString()}) lebih rendah dari harga beli (Rp ${cost.toLocaleString()}). Margin negatif!`, 'info');
    }

    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : Date.now().toString(),
      name: formData.get('name') as string,
      sku: sku,
      barcode: barcode,
      category: formData.get('category') as string,
      stock: Number(formData.get('stock')),
      minStock: Number(formData.get('minStock')),
      price: price,
      cost: cost,
      unit: finalUnit || 'Pcs',
      supplier: (formData.get('supplier') as string) || 'Internal',
      expiryDate: formData.get('expiryDate') as string,
      location: formData.get('location') as string,
      image: finalImage
    };

    if (editingProduct) {
      updateProduct(newProduct);
    } else {
      addProduct(newProduct);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">

        {/* Search & Categories */}
        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
          {/* Local Search Input */}
          <div className="relative w-full sm:w-64 group">
            <input
              type="text"
              placeholder="Cari nama atau SKU..."
              value={searchTerm}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all dark:text-white"
            />
            <Search size={16} className="absolute left-3.5 top-3 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
            {searchTerm && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-2.5 p-0.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-full transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex space-x-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border
                  ${selectedCategory === cat
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400'
                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleExport}
            disabled={isExporting || filteredProducts.length === 0}
            className="flex items-center px-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <Download size={16} className="mr-2" />
            )}
            {isExporting ? 'Mengekspor...' : 'Export XLSX'}
          </button>
          <button
            onClick={handleAddNew}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-lg shadow-emerald-200/50 dark:shadow-none transition-all active:scale-95"
          >
            <Plus size={16} className="mr-2" />
            Tambah Produk
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold">Produk</th>
                <th className="px-6 py-4 font-semibold">SKU / Barcode</th>
                <th className="px-6 py-4 font-semibold">Kategori</th>
                <th className="px-6 py-4 font-semibold text-right">Harga Beli</th>
                <th className="px-6 py-4 font-semibold text-right">Harga Jual</th>
                <th className="px-6 py-4 font-semibold text-center">Stok</th>
                <th className="px-6 py-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-emerald-50/30 dark:hover:bg-slate-700/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <img className="h-10 w-10 rounded-lg object-cover bg-gray-200 border border-gray-100 dark:border-slate-600" src={product.image} alt="" />
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">{product.name}</div>
                        <div className="text-xs text-gray-500">{product.location}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                    <div className="font-semibold text-gray-700 dark:text-gray-200">{product.sku}</div>
                    <div className="text-gray-400">{product.barcode}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300 border border-gray-200 dark:border-slate-600">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">Rp {product.cost.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">Rp {product.price.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <div className={`font-bold inline-block px-2 py-0.5 rounded ${product.stock <= product.minStock ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {product.stock.toLocaleString('id-ID')}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{product.unit}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center space-x-2">
                      <button onClick={() => handleEdit(product)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => promptDelete(product.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 && (
          <div className="py-16 text-center text-gray-400 bg-gray-50/50 dark:bg-slate-800/50">
            <Search size={48} className="mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Tidak ada produk ditemukan</h3>
            <p className="text-sm">Coba sesuaikan kata kunci pencarian atau filter kategori Anda.</p>
            {searchTerm && (
              <button onClick={() => setSearch('')} className="mt-4 text-sm text-emerald-600 hover:underline">
                Bersihkan pencarian
              </button>
            )}
          </div>
        )}
      </div>

      {/* --- ADD/EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {editingProduct ? <Edit2 size={20} className="text-emerald-500" /> : <Plus size={20} className="text-emerald-500" />}
                  {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Lengkapi informasi detail produk di bawah ini.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="overflow-y-auto p-8">
              <form id="productForm" onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8">

                {/* Left Column: Image Upload & Preview */}
                <div className="w-full lg:w-1/3 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Foto Produk <span className="text-gray-400 font-normal">(Opsional)</span></label>
                    <div
                      onClick={triggerFileInput}
                      className={`relative aspect-square w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group
                        ${previewImage
                          ? 'border-emerald-500 bg-gray-50 dark:bg-slate-900'
                          : 'border-gray-300 dark:border-slate-600 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10'
                        }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                      />

                      {previewImage ? (
                        <>
                          <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white font-medium flex items-center"><Upload size={18} className="mr-2" /> Ganti Foto</span>
                          </div>
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-full shadow-sm hover:bg-white transition-transform hover:scale-110"
                            title="Hapus Foto"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : (
                        <div className="text-center p-6">
                          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <ImageIcon size={32} />
                          </div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Klik untuk upload foto</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG max 500KB</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="text-blue-500 mt-0.5" size={18} />
                      <div>
                        <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300">Tips Gambar</h4>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Gunakan gambar dengan rasio 1:1 (persegi). Maksimal ukuran file 500KB untuk menjaga performa aplikasi.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Form Fields */}
                <div className="flex-1 space-y-8">

                  {/* Section 1: Basic Info */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-100 dark:border-slate-700 pb-2 flex items-center gap-2">
                      <Package size={16} className="text-emerald-500" /> Informasi Dasar
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nama Produk</label>
                        <input required name="name" defaultValue={editingProduct?.name} placeholder="Contoh: Indomie Goreng Original" className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">SKU (Kode Stok)</label>
                        <input required name="sku" defaultValue={editingProduct?.sku} placeholder="Auto-generated" className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Barcode / EAN</label>
                        <input required name="barcode" defaultValue={editingProduct?.barcode} placeholder="Scan barcode..." className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kategori</label>
                        <select name="category" defaultValue={editingProduct?.category} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all">
                          {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Satuan Unit</label>
                        <select
                          value={selectedUnit}
                          onChange={(e) => setSelectedUnit(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        >
                          {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                        {selectedUnit === 'Lainnya' && (
                          <input
                            type="text"
                            value={customUnit}
                            onChange={(e) => setCustomUnit(e.target.value)}
                            placeholder="Masukkan satuan custom..."
                            className="mt-2 w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            required
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Pricing & Stock */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-100 dark:border-slate-700 pb-2 flex items-center gap-2">
                      <DollarSign size={16} className="text-emerald-500" /> Harga & Inventaris
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Harga Beli (HPP)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-400 text-sm">Rp</span>
                          {/* FIX #4: Added min="0" to prevent negative values */}
                          <input required type="number" min="0" name="cost" defaultValue={editingProduct?.cost} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Harga Jual</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-400 text-sm">Rp</span>
                          {/* FIX #4: Added min="0" to prevent negative values */}
                          <input required type="number" min="0" name="price" defaultValue={editingProduct?.price} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Stok Saat Ini</label>
                        {/* FIX #4: Added min="0" to prevent negative values */}
                        <input required type="number" min="0" name="stock" defaultValue={editingProduct?.stock} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Stok Minimum (Alert)</label>
                        {/* FIX #4: Added min="0" to prevent negative values */}
                        <input required type="number" min="0" name="minStock" defaultValue={editingProduct?.minStock} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Details */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider border-b border-gray-100 dark:border-slate-700 pb-2 flex items-center gap-2">
                      <Calendar size={16} className="text-emerald-500" /> Detail Lainnya
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Lokasi Rak</label>
                        <input required name="location" defaultValue={editingProduct?.location} placeholder="Contoh: Rak A-01" className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal Kedaluwarsa</label>
                        <input type="date" name="expiryDate" defaultValue={editingProduct?.expiryDate} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                      </div>
                      {/* FIX #1: Added Supplier input field */}
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Supplier</label>
                        <input name="supplier" defaultValue={editingProduct?.supplier || ''} placeholder="Contoh: PT Indofood" className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                      </div>
                    </div>
                  </div>

                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-5 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex justify-end space-x-3 z-10">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-white dark:text-gray-300 dark:border-slate-600 dark:hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                form="productForm"
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200/50 dark:shadow-none transition-all transform active:scale-95 flex items-center"
              >
                <Save size={18} className="mr-2" />
                Simpan Produk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Hapus Produk Ini?</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Tindakan ini tidak dapat dibatalkan. Produk akan dihapus permanen dari database inventaris.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200/50 dark:shadow-none transition-all"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Inventory;