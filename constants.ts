import { Product, Supplier, Sale, User, CartItem } from './types';

export const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'T.R.Zarir Rizqullah',
    email: 'admin@mitramart.com',
    role: 'ADMIN',
    avatar: 'https://ui-avatars.com/api/?name=Zarir+Rizqullah&background=10b981&color=fff',
    phone: '08123456789'
  },
  {
    id: '2',
    name: 'Riska Permata Sari',
    email: 'kasir@mitramart.com',
    role: 'CASHIER',
    avatar: 'https://ui-avatars.com/api/?name=Riska+Permata+Sari&background=3b82f6&color=fff',
    phone: '08129876543'
  },
  {
    id: '3',
    name: 'Joko Gudang',
    email: 'gudang@mitramart.com',
    role: 'WAREHOUSE',
    avatar: 'https://ui-avatars.com/api/?name=Joko+Gudang&background=f59e0b&color=fff',
    phone: '081355556666'
  }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    sku: 'BV-001',
    barcode: '89999090901',
    name: 'Indomie Goreng Original',
    category: 'Makanan',
    unit: 'Pcs',
    price: 3500,
    cost: 2800,
    stock: 150,
    minStock: 50,
    supplier: 'PT Indofood',
    expiryDate: '2024-12-30',
    location: 'Rak A1-02',
    image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: '2',
    sku: 'BV-002',
    barcode: '89999090902',
    name: 'Aqua Botol 600ml',
    category: 'Minuman',
    unit: 'Botol',
    price: 4000,
    cost: 2500,
    stock: 85,
    minStock: 24,
    supplier: 'PT Tirta Investama',
    expiryDate: '2025-05-20',
    location: 'Kulkas 1',
    image: 'https://images.unsplash.com/photo-1602143407151-0111419500be?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: '3',
    sku: 'HH-001',
    barcode: '89999090903',
    name: 'Lifebuoy Body Wash 450ml',
    category: 'Kebersihan',
    unit: 'Pcs',
    price: 28000,
    cost: 22000,
    stock: 12,
    minStock: 10,
    supplier: 'Unilever',
    expiryDate: '2026-01-10',
    location: 'Rak B2-01',
    image: 'https://images.unsplash.com/photo-1600139199276-88045e75d40a?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: '4',
    sku: 'SN-001',
    barcode: '89999090904',
    name: 'Chitato Sapi Panggang 68g',
    category: 'Snack',
    unit: 'Bungkus',
    price: 11500,
    cost: 9500,
    stock: 40,
    minStock: 20,
    supplier: 'Indofood',
    expiryDate: '2024-08-15',
    location: 'Rak C1-05',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: '5',
    sku: 'BV-003',
    barcode: '89999090905',
    name: 'Teh Pucuk Harum 350ml',
    category: 'Minuman',
    unit: 'Botol',
    price: 3500,
    cost: 2700,
    stock: 200,
    minStock: 48,
    supplier: 'Mayora',
    expiryDate: '2025-02-28',
    location: 'Kulkas 2',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: '6',
    sku: 'HH-002',
    barcode: '89999090906',
    name: 'Pepsodent Pencegah Gigi Berlubang',
    category: 'Kebersihan',
    unit: 'Tube',
    price: 15000,
    cost: 11000,
    stock: 5,
    minStock: 15,
    supplier: 'Unilever',
    expiryDate: '2026-06-01',
    location: 'Rak B1-03',
    image: 'https://images.unsplash.com/photo-1559599189-fe84dea4eb79?w=500&auto=format&fit=crop&q=60'
  }
];

export const MOCK_SALES_DATA = [
  { name: 'Senin', sales: 4000000 },
  { name: 'Selasa', sales: 3000000 },
  { name: 'Rabu', sales: 5000000 },
  { name: 'Kamis', sales: 4500000 },
  { name: 'Jumat', sales: 6000000 },
  { name: 'Sabtu', sales: 8500000 },
  { name: 'Minggu', sales: 9000000 },
];

export const MOCK_CATEGORY_DATA = [
  { name: 'Makanan', value: 45 },
  { name: 'Minuman', value: 30 },
  { name: 'Kebersihan', value: 15 },
  { name: 'Lainnya', value: 10 },
];

const mockItem = (prodIndex: number, qty: number): CartItem => ({
  ...MOCK_PRODUCTS[prodIndex],
  qty
});

export const MOCK_INITIAL_SALES: Sale[] = [
  {
    id: 'TRX-1715401',
    date: '2024-03-10T08:30:00',
    items: [mockItem(0, 5), mockItem(1, 2)],
    subtotal: 25500,    // (3500*5)+(4000*2)
    tax: 2805,          // 25500 * 0.11
    total: 28305,       // subtotal + tax
    cashier: 'Riska Permata Sari',
    paymentMethod: 'CASH'
  },
  {
    id: 'TRX-1715402',
    date: '2024-03-10T09:15:00',
    items: [mockItem(2, 1), mockItem(3, 2)],
    subtotal: 51000,    // (28000*1)+(11500*2)
    tax: 5610,          // 51000 * 0.11
    total: 56610,       // subtotal + tax
    cashier: 'Riska Permata Sari',
    paymentMethod: 'QRIS'
  },
  {
    id: 'TRX-1715403',
    date: '2024-03-10T10:00:00',
    items: [mockItem(4, 10)],
    subtotal: 35000,    // 3500*10
    tax: 3850,          // 35000 * 0.11
    total: 38850,       // subtotal + tax
    cashier: 'T.R.Zarir Rizqullah',
    paymentMethod: 'DEBIT'
  },
  {
    id: 'TRX-1715404',
    date: '2024-03-10T11:45:00',
    items: [mockItem(0, 2), mockItem(3, 1), mockItem(1, 1)],
    subtotal: 22500,    // (3500*2)+(11500*1)+(4000*1)
    tax: 2475,          // 22500 * 0.11
    total: 24975,       // subtotal + tax
    cashier: 'Riska Permata Sari',
    paymentMethod: 'CASH'
  },
  {
    id: 'TRX-1715405',
    date: '2024-03-10T13:20:00',
    items: [mockItem(5, 2), mockItem(2, 1)],
    subtotal: 58000,    // (15000*2)+(28000*1)
    tax: 6380,          // 58000 * 0.11
    total: 64380,       // subtotal + tax
    cashier: 'Riska Permata Sari',
    paymentMethod: 'QRIS'
  }
];

export const CATEGORIES = ['Semua', 'Makanan', 'Minuman', 'Kebersihan', 'Snack', 'ATK'];