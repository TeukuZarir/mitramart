import React, { useState, useEffect, useRef } from 'react';
import {
  Bell, Search, Moon, Sun, User, Command,
  LayoutDashboard, Package, BarChart3, Settings,
  ArrowRight, LogOut, Box, AlertTriangle, CheckCircle, ChevronDown
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product, ViewState } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

const Header = () => {
  const { 
    darkMode, toggleDarkMode, setView,
    products, setSearch, logout, currentUser, setSettingsTab,
    notifications, markAllNotificationsAsRead,
    setViewAndSearch
  } = useStore();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [query, setQuery] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    if (isNotificationsOpen || isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationsOpen, isProfileOpen]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isSearchOpen) {
      setQuery('');
    }
  }, [isSearchOpen]);

  const getPageTitle = () => {
    const path = window.location.pathname; // Just kidding, we use state
    return 'MitraMart'; // Fallback or dynamic based on `currentView` from store if needed
  };

  const getTitle = () => {
    return "MitraMart Enterprise";
  };

  const filteredProducts = query
    ? products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.includes(query))
    : [];

  const handleNavigate = (view: ViewState) => {
    if (view === 'SETTINGS') setSettingsTab('INVENTORY');
    setView(view);
    setIsSearchOpen(false);
  };

  const handleProductClick = (productName: string) => {
    setViewAndSearch('INVENTORY', productName);
    setIsSearchOpen(false);
    setIsNotificationsOpen(false);
  };

  const handleProfileSettings = () => {
    setSettingsTab('PROFILE');
    setView('SETTINGS');
    setIsProfileOpen(false);
  };

  const canAccessSettings = true;

  const iconButtonVariants = {
    hover: { scale: 1.1, backgroundColor: "rgba(16, 185, 129, 0.1)" },
    tap: { scale: 0.9 }
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95, filter: "blur(5px)" },
    visible: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, y: 10, scale: 0.95, filter: "blur(5px)" }
  };

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-6 sticky top-0 z-40 transition-colors duration-300">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-brand font-bold text-gray-800 dark:text-white hidden md:block tracking-tight">
            {/* Using a simpler static title or retrieving from store if needed. 
                 Since I missed destructuring currentView in the top, let's grab it now. 
             */}
            <PageTitle />
          </h1>
        </div>

        <div className="flex-1 flex justify-end items-center space-x-4">
          {/* Global Command Search Trigger */}
          <MotionButton
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsSearchOpen(true)}
            className="hidden md:flex items-center w-64 lg:w-96 px-4 py-2 bg-gray-100 dark:bg-slate-700/50 hover:bg-gray-200 dark:hover:bg-slate-700 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-900 rounded-xl text-sm text-gray-500 dark:text-gray-400 transition-all group"
          >
            <Search size={16} className="mr-3 text-gray-400 group-hover:text-emerald-500 transition-colors" />
            <span className="flex-1 text-left">Cari sesuatu...</span>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-[10px] font-bold text-gray-400">
              <span className="text-xs">⌘</span> K
            </div>
          </MotionButton>

          {/* Mobile Search Icon */}
          <MotionButton
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"
          >
            <Search size={20} />
          </MotionButton>

          {/* Actions */}
          <div className="flex items-center space-x-2 lg:space-x-3">

            {/* Dark Mode Toggle */}
            <MotionButton
              variants={iconButtonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 overflow-hidden"
            >
              <MotionDiv
                key={darkMode ? 'dark' : 'light'}
                initial={{ y: -20, opacity: 0, rotate: -90 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                exit={{ y: 20, opacity: 0, rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </MotionDiv>
            </MotionButton>

            {/* Notification Dropdown */}
            <div className="relative" ref={notificationRef}>
              <MotionButton
                variants={iconButtonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`relative p-2 rounded-full transition-colors ${isNotificationsOpen ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-300'}`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full animate-pulse ring-2 ring-white dark:ring-slate-800"></span>
                )}
              </MotionButton>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <MotionDiv
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50 origin-top-right"
                  >
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800">
                      <h3 className="font-bold text-gray-800 dark:text-white text-sm">Notifikasi</h3>
                      {unreadCount > 0 && (
                        <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount} Baru</span>
                      )}
                    </div>

                    <div className="max-h-[350px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-xs">
                          <Bell size={32} className="mx-auto mb-2 opacity-20" />
                          <p>Tidak ada notifikasi baru</p>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => n.relatedId && handleProductClick(n.title.replace('Stok Kritis: ', ''))}
                            className={`p-4 border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors flex gap-3 group ${!n.isRead ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : ''}`}
                          >
                            <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${n.type === 'ALERT' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                              n.type === 'SYSTEM' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                                'bg-gray-100 dark:bg-slate-700 text-gray-600'
                              }`}>
                              {n.type === 'ALERT' ? <AlertTriangle size={16} /> :
                                n.type === 'SYSTEM' ? <CheckCircle size={16} /> :
                                  <Bell size={16} />}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <p className={`text-sm font-bold ${!n.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                  {n.title}
                                </p>
                                <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                  {new Date(n.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                                {n.message}
                              </p>
                            </div>
                            {!n.isRead && (
                              <div className="self-center">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2 bg-gray-50 dark:bg-slate-900/50 text-center border-t border-gray-100 dark:border-slate-700">
                      <button
                        onClick={markAllNotificationsAsRead}
                        disabled={unreadCount === 0}
                        className="text-xs font-medium text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 w-full py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Tandai semua sudah dibaca
                      </button>
                    </div>
                  </MotionDiv>
                )}
              </AnimatePresence>
            </div>

            <div className="h-8 w-px bg-gray-200 dark:bg-slate-600 mx-2 hidden lg:block"></div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <MotionButton
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 text-gray-700 dark:text-gray-200 hover:text-emerald-600 transition-colors outline-none p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50"
              >
                <span className="text-sm font-semibold hidden md:block">{currentUser?.name}</span>
                <div className="p-1.5 bg-gray-100 dark:bg-slate-700 rounded-full">
                  <User size={18} />
                </div>
                <MotionDiv animate={{ rotate: isProfileOpen ? 180 : 0 }}>
                  <ChevronDown size={14} className="hidden md:block text-gray-400" />
                </MotionDiv>
              </MotionButton>

              <AnimatePresence>
                {isProfileOpen && (
                  <MotionDiv
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50 origin-top-right"
                  >
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{currentUser?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{currentUser?.role}</p>
                    </div>

                    <div className="p-1">
                      {canAccessSettings && (
                        <button
                          onClick={handleProfileSettings}
                          className="w-full text-left flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors mb-1"
                        >
                          <Settings size={16} className="mr-3 text-gray-400" />
                          Pengaturan Akun
                        </button>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setIsProfileOpen(false);
                        }}
                        className="w-full text-left flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <LogOut size={16} className="mr-3" />
                        Keluar Sistem
                      </button>
                    </div>
                  </MotionDiv>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </header>

      {/* Command Palette Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/20 dark:bg-black/60 backdrop-blur-sm"
              onClick={() => setIsSearchOpen(false)}
            />

            <MotionDiv
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col"
            >
              {/* Search Input */}
              <div className="flex items-center px-4 py-4 border-b border-gray-100 dark:border-slate-800">
                <Search className="text-emerald-500 mr-3" size={24} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Ketik untuk mencari produk, menu, atau perintah..."
                  className="flex-1 bg-transparent text-lg text-gray-800 dark:text-white placeholder:text-gray-400 outline-none"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="px-2 py-1 text-xs font-medium text-gray-400 bg-gray-100 dark:bg-slate-800 rounded hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  ESC
                </button>
              </div>

              {/* Search Results */}
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {query === '' && (
                  <div className="px-2 py-3">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Navigasi Cepat</h3>
                    <div className="space-y-1">
                      <button onClick={() => handleNavigate('DASHBOARD')} className="w-full flex items-center px-3 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200 transition-colors group">
                        <LayoutDashboard className="mr-3 text-gray-400 group-hover:text-emerald-500" size={18} />
                        Dashboard
                      </button>
                      <button onClick={() => handleNavigate('INVENTORY')} className="w-full flex items-center px-3 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200 transition-colors group">
                        <Package className="mr-3 text-gray-400 group-hover:text-emerald-500" size={18} />
                        Inventaris
                      </button>
                      <button onClick={() => handleNavigate('REPORTS')} className="w-full flex items-center px-3 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200 transition-colors group">
                        <BarChart3 className="mr-3 text-gray-400 group-hover:text-emerald-500" size={18} />
                        Laporan
                      </button>
                      <button onClick={() => handleNavigate('SETTINGS')} className="w-full flex items-center px-3 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200 transition-colors group">
                        <Settings className="mr-3 text-gray-400 group-hover:text-emerald-500" size={18} />
                        Pengaturan
                      </button>
                    </div>
                  </div>
                )}

                {filteredProducts.length > 0 && (
                  <div className="px-2 py-2 border-t border-gray-100 dark:border-slate-800">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Produk Ditemukan</h3>
                    <div className="space-y-1">
                      {filteredProducts.map(product => (
                        <button
                          key={product.id}
                          onClick={() => handleProductClick(product.name)}
                          className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-200 border border-transparent transition-all group"
                        >
                          <div className="flex items-center">
                            <Box className="mr-3 text-emerald-500" size={18} />
                            <div className="text-left">
                              <p className="font-medium text-gray-800 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{product.name}</p>
                              <p className="text-xs text-gray-400">Stok: {product.stock} {product.unit} • {product.location}</p>
                            </div>
                          </div>
                          <ArrowRight size={16} className="text-gray-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {query !== '' && filteredProducts.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <p>Tidak ditemukan hasil untuk "{query}"</p>
                  </div>
                )}

                <div className="px-2 py-2 border-t border-gray-100 dark:border-slate-800 mt-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Sistem</h3>
                  <button onClick={toggleDarkMode} className="w-full flex items-center px-3 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200 transition-colors">
                    {darkMode ? <Sun size={18} className="mr-3 text-gray-400" /> : <Moon size={18} className="mr-3 text-gray-400" />}
                    Ganti Tema {darkMode ? 'Terang' : 'Gelap'}
                  </button>
                  <button onClick={() => { logout(); setIsSearchOpen(false) }} className="w-full flex items-center px-3 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors">
                    <LogOut size={18} className="mr-3" />
                    Keluar Sistem
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 dark:bg-slate-800 px-4 py-3 text-xs text-gray-400 flex justify-between items-center border-t border-gray-100 dark:border-slate-700">
                <div className="flex gap-4">
                  <span className="flex items-center"><Command size={12} className="mr-1" /> Pilih</span>
                  <span className="flex items-center"><ArrowRight size={12} className="mr-1" /> Navigasi</span>
                </div>
                <span>MitraMart Enterprise Search</span>
              </div>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

const PageTitle = () => {
  const { currentView } = useStore();
  switch (currentView) {
    case 'DASHBOARD': return <>Dashboard Overview</>;
    case 'INVENTORY': return <>Manajemen Inventaris</>;
    case 'REPORTS': return <>Laporan & Analitik</>;
    case 'SETTINGS': return <>Pengaturan</>;
    case 'POS': return <>Point of Sale (Kasir)</>;
    default: return <>MitraMart</>;
  }
}

export default Header;