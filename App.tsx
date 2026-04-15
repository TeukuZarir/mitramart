import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Login from './pages/Login';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import POS from './pages/POS';
import { X, CheckCircle, AlertCircle, Info, Lock } from 'lucide-react';
import { ViewState } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import ToastContainer from './components/ToastContainer';

const MotionDiv = motion.div as any;

const Unauthorized = () => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8">
    <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
      <Lock size={40} className="text-gray-400" />
    </div>
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Akses Ditolak</h2>
    <p className="text-gray-500 mt-2 max-w-md">Anda tidak memiliki izin untuk mengakses halaman ini. Silakan hubungi Administrator jika ini adalah kesalahan.</p>
  </div>
);

const MainContent = () => {
  const { currentView, currentUser, isLoading } = useStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Memuat MitraMart...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  const role = currentUser.role;
  const allowedViews: Record<string, ViewState[]> = {
    'ADMIN': ['DASHBOARD', 'POS', 'INVENTORY', 'REPORTS', 'SETTINGS'],
    'OWNER': ['DASHBOARD', 'POS', 'INVENTORY', 'REPORTS', 'SETTINGS'],
    'CASHIER': ['DASHBOARD', 'POS', 'SETTINGS'],
    'WAREHOUSE': ['DASHBOARD', 'INVENTORY', 'SETTINGS']
  };

  const isAllowed = allowedViews[role]?.includes(currentView);

  const renderView = () => {
    if (!isAllowed) {
      return <Unauthorized />;
    }

    let Component;

    switch (currentView) {
      case 'DASHBOARD':
        Component = <Dashboard />;
        break;
      case 'INVENTORY':
        Component = <Inventory />;
        break;
      case 'REPORTS':
        Component = <Reports />;
        break;
      case 'SETTINGS':
        Component = <Settings />;
        break;
      case 'POS':
        Component = <POS />;
        break;
      default:
        Component = <Dashboard />;
        break;
    }

    return (
      <MotionDiv
        key={currentView}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full h-full flex flex-col"
      >
        {Component}
      </MotionDiv>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
          <AnimatePresence mode="wait">
            {renderView()}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <StoreProvider>
      <MainContent />
      <ToastContainer />
    </StoreProvider>
  );
}

export default App;