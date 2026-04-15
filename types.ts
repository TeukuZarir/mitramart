export type Role = 'OWNER' | 'ADMIN' | 'CASHIER' | 'WAREHOUSE';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  avatar?: string;
  phone?: string;
  is2faEnabled?: boolean;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  supplier: string;
  expiryDate: string;
  location: string;
  image?: string;
}

export interface CartItem extends Product {
  qty: number;
}

export interface Sale {
  id: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  cashier: string;
  paymentMethod: 'CASH' | 'QRIS' | 'DEBIT';
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
}

export interface KPIStats {
  totalRevenue: number;
  totalProfit: number;
  totalTransactions: number;
  lowStockCount: number;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'SYSTEM' | 'ALERT' | 'INFO';
  timestamp: string;
  isRead: boolean;
  relatedId?: string;
}

export type ViewState = 'DASHBOARD' | 'INVENTORY' | 'REPORTS' | 'SETTINGS' | 'POS';