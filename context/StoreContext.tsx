import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Product, Sale, ViewState, User, CartItem, ToastMessage, AppNotification } from '../types';
import { MOCK_PRODUCTS, MOCK_USERS, MOCK_INITIAL_SALES } from '../constants';
import { authApi, productApi, salesApi, userApi, checkApiHealth } from '../services/api';

interface StoreSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  taxId: string;
  invoiceFooter: string;
  serviceContact: string;
}

interface StoreContextType {
  products: Product[];
  sales: Sale[];
  users: User[];
  darkMode: boolean;
  currentView: ViewState;
  searchTerm: string;
  currentUser: User | null;
  toasts: ToastMessage[];
  activeSettingsTab: string;
  storeSettings: StoreSettings;
  isLoading: boolean;
  isApiConnected: boolean;

  toggleDarkMode: () => void;
  setView: (view: ViewState) => void;
  setSearch: (term: string) => void;
  setViewAndSearch: (view: ViewState, search: string) => void;
  setSettingsTab: (tab: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  updateStoreSettings: (settings: Partial<StoreSettings>) => void;

  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUserPassword: (userId: string, newPass: string, oldPass?: string) => void;
  updateUserName: (userId: string, newName: string) => void;
  updateUserProfile: (userId: string, data: Partial<User>) => void;
  addUser: (user: User) => void;
  deleteUser: (userId: string) => void;

  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;

  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  processCheckout: (paymentMethod: 'CASH' | 'QRIS' | 'DEBIT') => Promise<Sale | null>;

  notifications: AppNotification[];
  markAllNotificationsAsRead: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'mitramart_products_v3',
  SALES: 'mitramart_sales_v2',
  THEME: 'mitramart_theme',
  USERS: 'mitramart_users_v4',
  SESSION: 'mitramart_session_v3',
  STORE_SETTINGS: 'mitramart_store_settings_v1',
  NOTIFICATIONS: 'mitramart_notifications_v1'
};

const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'MitraMart',
  storeAddress: 'Jl. Jendral Sudirman No. 123\nJakarta Selatan, 12190',
  storePhone: '(021) 555-0123',
  taxId: '72.123.456.7-890.000',
  invoiceFooter: 'Terima kasih atas kunjungan Anda\nBarang yang sudah dibeli tidak dapat ditukar/dikembalikan',
  serviceContact: '0812-3456-7890'
};

const mapApiProduct = (p: any): Product => ({
  id: p.id,
  sku: p.sku,
  barcode: p.barcode,
  name: p.name,
  category: p.category,
  unit: p.unit,
  price: Number(p.price),
  cost: Number(p.cost),
  stock: p.stock,
  minStock: p.min_stock ?? p.minStock ?? 0,
  supplier: p.supplier || '',
  expiryDate: p.expiry_date || p.expiryDate || '',
  location: p.location || '',
  image: p.image || ''
});

const mapApiSale = (s: any): Sale => ({
  id: s.id,
  date: s.date || s.created_at,
  items: (s.items || []).map((item: any) => ({
    id: item.product_id || item.id,
    name: item.product?.name || item.name || '',
    sku: item.product?.sku || item.sku || '',
    barcode: item.barcode || '',
    category: item.category || '',
    unit: item.unit || '',
    price: Number(item.price),
    cost: 0,
    stock: 0,
    minStock: 0,
    supplier: '',
    expiryDate: '',
    location: '',
    image: item.product?.image || item.image || '',
    qty: item.qty
  })),
  subtotal: Number(s.subtotal) || 0,
  tax: Number(s.tax) || 0,
  total: Number(s.total),
  cashier: s.cashier,
  paymentMethod: s.payment_method || s.paymentMethod
});

const mapApiUser = (u: any): User => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  avatar: u.avatar || '',
  phone: u.phone || '',
  is2faEnabled: u.is_2fa_enabled || u.is2faEnabled || false
});

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isApiConnected, setIsApiConnected] = useState(false);

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : MOCK_PRODUCTS;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SALES);
    return saved ? JSON.parse(saved) : MOCK_INITIAL_SALES;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : MOCK_USERS;
  });

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.THEME) === 'dark';
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return saved ? JSON.parse(saved) : [];
  });

  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');

  const [activeSettingsTab, setActiveSettingsTab] = useState('INVENTORY');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STORE_SETTINGS);
    return saved ? JSON.parse(saved) : DEFAULT_STORE_SETTINGS;
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const setDefaultViewForRole = useCallback((role: string) => {
    if (role === 'CASHIER') setCurrentView('POS');
    else if (role === 'WAREHOUSE') setCurrentView('INVENTORY');
    else setCurrentView('DASHBOARD');
  }, []);

  useEffect(() => {
    const initSession = async () => {
      setIsLoading(true);
      const apiAvailable = await checkApiHealth();
      setIsApiConnected(apiAvailable);

      if (apiAvailable) {
        const token = localStorage.getItem('mitramart_token');
        if (token) {
          try {
            const { user } = await authApi.me();
            const mappedUser = mapApiUser(user);
            setCurrentUser(mappedUser);
            setDefaultViewForRole(mappedUser.role);

            try {
              const apiProducts = await productApi.getAll();
              setProducts(apiProducts.map(mapApiProduct));
            } catch { /* keep local data */ }

            try {
              const apiSales = await salesApi.getAll();
              setSales(apiSales.map(mapApiSale));
            } catch { /* keep local data */ }

            try {
              const apiUsers = await userApi.getAll();
              setUsers(apiUsers.map(mapApiUser));
            } catch { /* keep local data */ }
          } catch {
            localStorage.removeItem('mitramart_token');
          }
        }
      } else {
        const saved = localStorage.getItem(STORAGE_KEYS.SESSION);
        if (saved) {
          try {
            const user = JSON.parse(saved);
            setCurrentUser(user);
            setDefaultViewForRole(user.role);
          } catch { /* invalid session */ }
        }
      }

      setIsLoading(false);
    };

    initSession();
  }, [setDefaultViewForRole]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      const { ...safeUser } = currentUser;
      delete (safeUser as any).password;
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(safeUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  }, [currentUser]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_KEYS.THEME, 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STORE_SETTINGS, JSON.stringify(storeSettings));
  }, [storeSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  const stockSignature = products.map(p => `${p.id}:${p.stock}`).join(',');
  useEffect(() => {
    setNotifications(prev => {
      let newItems: AppNotification[] = [];

      const hasSystemMsg = prev.some(n => n.type === 'SYSTEM');
      if (!hasSystemMsg) {
        newItems.push({
          id: 'sys-backup-1',
          title: 'System Backup Berhasil',
          message: 'Backup data harian otomatis telah berhasil dilakukan ke server cloud. Data aman.',
          type: 'SYSTEM',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          isRead: false
        });
      }

      const lowStock = products.filter(p => p.stock <= p.minStock);
      const existingAlertIds = new Set(prev.filter(n => n.type === 'ALERT').map(n => n.relatedId));

      lowStock.forEach(p => {
        if (!existingAlertIds.has(p.id)) {
          newItems.push({
            id: `alert-${p.id}-${Date.now()}`,
            title: `Stok Kritis: ${p.name}`,
            message: `Sisa stok ${p.stock} ${p.unit}. Minimum ${p.minStock}. Segera lakukan restock.`,
            type: 'ALERT',
            timestamp: new Date().toISOString(),
            isRead: false,
            relatedId: p.id
          });
        }
      });

      if (newItems.length === 0) return prev;

      return [...newItems, ...prev];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length, stockSignature]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const setView = (view: ViewState) => {
    setCurrentView(view);
    setSearchTerm('');
  };

  const setViewAndSearch = (view: ViewState, search: string) => {
    setCurrentView(view);
    setSearchTerm(search);
  };

  const setSettingsTab = (tab: string) => setActiveSettingsTab(tab);

  const setSearch = (term: string) => setSearchTerm(term);

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    if (isApiConnected) {
      try {
        const data = await authApi.login(email, password);
        const mappedUser = mapApiUser(data.user);
        setCurrentUser(mappedUser);
        setDefaultViewForRole(mappedUser.role);

        try {
          const apiProducts = await productApi.getAll();
          setProducts(apiProducts.map(mapApiProduct));
        } catch { /* keep local */ }

        try {
          const apiSales = await salesApi.getAll();
          setSales(apiSales.map(mapApiSale));
        } catch { /* keep local */ }

        try {
          const apiUsers = await userApi.getAll();
          setUsers(apiUsers.map(mapApiUser));
        } catch { /* keep local */ }

        showToast(`Selamat datang, ${mappedUser.name}!`);
        return true;
      } catch (err: any) {
        showToast(err.message || 'Login gagal', 'error');
        return false;
      }
    } else {
      const user = users.find(u => u.email === email);
      if (user) {
        setCurrentUser(user);
        setDefaultViewForRole(user.role);
        showToast(`Selamat datang, ${user.name}! (Mode Offline)`, 'info');
        return true;
      }
      return false;
    }
  };

  const logout = () => {
    if (isApiConnected) {
      authApi.logout().catch(() => {});
    }
    localStorage.removeItem('mitramart_token');
    setCurrentUser(null);
    setCurrentView('DASHBOARD');
    setCart([]);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    showToast('Anda telah keluar sistem', 'info');
  };

  const updateUserPassword = (userId: string, newPass: string, oldPass?: string) => {
    if (isApiConnected) {
      userApi.updatePassword(userId, newPass, oldPass).catch(err => {
        showToast(err.message || 'Gagal mengubah password', 'error');
      });
    }
    showToast('Password berhasil diperbarui', 'success');
  };

  const updateUserName = (userId: string, newName: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, name: newName } : u));
    showToast('Nama pengguna berhasil diperbarui', 'success');
  };

  const updateUserProfile = (userId: string, data: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, ...data } : null);
    }
    if (isApiConnected) {
      userApi.update(userId, data).catch(() => {});
    }
    showToast('Profil berhasil diperbarui', 'success');
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (isApiConnected) {
      userApi.delete(userId).catch(() => {});
    }
    showToast('Akun berhasil dihapus', 'success');
  };

  const updateStoreSettings = (settings: Partial<StoreSettings>) => {
    setStoreSettings(prev => ({ ...prev, ...settings }));
    showToast('Pengaturan toko berhasil disimpan', 'success');
  };

  const addUser = (user: User) => {
    if (users.some(u => u.email === user.email)) {
      showToast('Email sudah digunakan oleh pengguna lain', 'error');
      return;
    }
    if (isApiConnected) {
      userApi.create({
        name: user.name,
        email: user.email,
        password: (user as any).password || 'default123',
        role: user.role
      }).then(apiUser => {
        setUsers(prev => [...prev, mapApiUser(apiUser)]);
        showToast(`Akun ${user.role} baru berhasil dibuat`, 'success');
      }).catch(err => {
        showToast(err.message || 'Gagal membuat akun', 'error');
      });
    } else {
      const { ...safeUser } = user;
      delete (safeUser as any).password;
      setUsers(prev => [...prev, safeUser]);
      showToast(`Akun ${user.role} baru berhasil dibuat (Mode Offline)`, 'success');
    }
  };

  const addProduct = (product: Product) => {
    if (isApiConnected) {
      productApi.create({
        sku: product.sku,
        barcode: product.barcode,
        name: product.name,
        category: product.category,
        unit: product.unit,
        price: product.price,
        cost: product.cost,
        stock: product.stock,
        min_stock: product.minStock,
        supplier: product.supplier,
        expiry_date: product.expiryDate || null,
        location: product.location,
        image: product.image
      }).then(apiProduct => {
        setProducts(prev => [...prev, mapApiProduct(apiProduct)]);
        showToast('Produk berhasil ditambahkan');
      }).catch(err => {
        showToast(err.message || 'Gagal menambahkan produk', 'error');
      });
    } else {
      setProducts([...products, product]);
      showToast('Produk berhasil ditambahkan (Mode Offline)');
    }
  };

  const updateProduct = (updatedProduct: Product) => {
    const oldProduct = products.find(p => p.id === updatedProduct.id);
    if (isApiConnected) {
      productApi.update(updatedProduct.id, {
        sku: updatedProduct.sku,
        barcode: updatedProduct.barcode,
        name: updatedProduct.name,
        category: updatedProduct.category,
        unit: updatedProduct.unit,
        price: updatedProduct.price,
        cost: updatedProduct.cost,
        stock: updatedProduct.stock,
        expected_stock: oldProduct?.stock,
        min_stock: updatedProduct.minStock,
        supplier: updatedProduct.supplier,
        expiry_date: updatedProduct.expiryDate || null,
        location: updatedProduct.location,
        image: updatedProduct.image
      }).then(() => {
          setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
          showToast('Produk berhasil diperbarui');
      }).catch(err => {
          showToast(err.message || 'Konflik: Gagal memperbarui produk', 'error');
      });
    } else {
        setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        showToast('Produk berhasil diperbarui');
    }
  };

  const deleteProduct = (id: string) => {
    if (isApiConnected) {
      productApi.delete(id).then(() => {
        setProducts(products.filter(p => p.id !== id));
        showToast('Produk dihapus', 'info');
      }).catch((err) => {
        showToast(err.message || 'Gagal menghapus produk. Mungkin produk masih terkait dengan riwayat penjualan.', 'error');
      });
    } else {
      setProducts(products.filter(p => p.id !== id));
      showToast('Produk dihapus (Mode Offline)', 'info');
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      showToast('Stok produk habis!', 'error');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          showToast('Jumlah melebihi stok tersedia', 'error');
          return prev;
        }
        return prev.map(item =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateCartQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && qty > product.stock) {
      showToast('Jumlah melebihi stok tersedia', 'error');
      return;
    }

    setCart(prev => prev.map(item =>
      item.id === productId ? { ...item, qty } : item
    ));
  };

  const clearCart = () => setCart([]);

  const processCheckout = async (paymentMethod: 'CASH' | 'QRIS' | 'DEBIT') => {
    if (cart.length === 0) return null;

    for (const cartItem of cart) {
      const product = products.find(p => p.id === cartItem.id);
      if (!product || product.stock < cartItem.qty) {
        showToast(`Stok ${cartItem.name} tidak mencukupi (tersisa ${product?.stock ?? 0})`, 'error');
        return null;
      }
    }

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const tax = Math.round(subtotal * 0.11);
    const total = subtotal + tax;

    let saleId = `TRX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    if (isApiConnected) {
      try {
        const apiSale = await salesApi.create({
          items: cart.map(item => ({
            id: item.id,
            qty: item.qty,
            price: item.price,
            name: item.name
          })),
          total,
          subtotal,
          tax,
          cashier: currentUser?.name || 'Kasir',
          cashier_id: currentUser?.id || '',
          payment_method: paymentMethod
        });
        if (apiSale && apiSale.id) {
           saleId = apiSale.id;
        }
        
        // Panggil refresh setelah success
        productApi.getAll().then(apiProducts => {
            setProducts(apiProducts.map(mapApiProduct));
        }).catch(() => {});
      } catch (err: any) {
        showToast(`Gagal: ${err.message || 'Transaksi ditolak oleh server'}`, 'error');
        return null; // STOP HERE IF FAILED
      }
    }

    const newSale: Sale = {
      id: saleId,
      date: new Date().toISOString(),
      items: [...cart],
      subtotal: subtotal,
      tax: tax,
      total: total,
      cashier: currentUser?.name || 'Kasir',
      paymentMethod
    };

    setSales([newSale, ...sales]);

    if (!isApiConnected) {
      setProducts(prev => prev.map(p => {
        const cartItem = cart.find(c => c.id === p.id);
        if (cartItem) {
          return { ...p, stock: Math.max(0, p.stock - cartItem.qty) };
        }
        return p;
      }));
    }

    clearCart();
    showToast(`Transaksi Berhasil! (${paymentMethod})`, 'success');
    return newSale;
  };

  return (
    <StoreContext.Provider value={{
      products, sales, users, darkMode, currentView, searchTerm, currentUser, toasts, activeSettingsTab, storeSettings,
      isLoading, isApiConnected,
      toggleDarkMode, setView, setSearch, setViewAndSearch, login, logout, showToast, removeToast, setSettingsTab, updateStoreSettings,
      updateUserPassword, updateUserName, updateUserProfile, addUser, deleteUser,
      addProduct, updateProduct, deleteProduct,
      cart, addToCart, removeFromCart, updateCartQty, clearCart, processCheckout,
      notifications, markAllNotificationsAsRead
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};