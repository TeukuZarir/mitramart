import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Settings,
  Menu,
  ChevronLeft,
  Store,
  LogOut,
  ShoppingCart,
  X
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ViewState } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;

interface NavItemProps {
  view: ViewState;
  icon: any;
  label: string;
  isActive: boolean;
  collapsed: boolean;
  onClick: (view: ViewState) => void;
}

const NavItem = ({ view, icon: Icon, label, isActive, collapsed, onClick }: NavItemProps) => {
  return (
    <button
      onClick={() => onClick(view)}
      className={`w-full relative flex items-center p-3 my-1 rounded-lg transition-all duration-300 ease-out group outline-none
        ${isActive
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 dark:shadow-emerald-500/15 scale-[1.02]'
          : 'text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-slate-700 hover:text-emerald-600 dark:hover:text-emerald-400'
        }`}
    >
      <div className="relative z-10 flex items-center w-full">
        <Icon size={22} className={`${collapsed ? 'mx-auto' : 'mr-3'} transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
        {!collapsed && <span className="font-medium">{label}</span>}
      </div>
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
          {label}
        </div>
      )}
    </button>
  );
};

const Sidebar = () => {
  const { currentView, setView, currentUser, logout, setSettingsTab } = useStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const canAccess = (view: ViewState): boolean => {
    if (!currentUser) return false;
    const role = currentUser.role;
    if (role === 'ADMIN' || role === 'OWNER') return true;
    if (role === 'CASHIER') return ['POS', 'DASHBOARD'].includes(view);
    if (role === 'WAREHOUSE') return ['INVENTORY', 'DASHBOARD'].includes(view);
    return false;
  };

  const canAccessSystem = () => {
    if (!currentUser) return false;
    return ['ADMIN', 'OWNER'].includes(currentUser.role);
  };

  const handleNavClick = (view: ViewState) => {
    if (view === 'SETTINGS') setSettingsTab('INVENTORY');
    setView(view);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
  };

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-slate-700">
        {(!collapsed || isMobile) && (
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
            <Store size={28} />
            <span className="font-brand font-bold text-xl tracking-tight">MitraMart</span>
          </div>
        )}
        {isMobile ? (
          <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500">
            <X size={20} />
          </button>
        ) : (
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500">
            {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
        )}
      </div>

      <div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
        <div className="mb-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {(!collapsed || isMobile) && 'Main Menu'}
        </div>

        {canAccess('DASHBOARD') && (
          <NavItem view="DASHBOARD" icon={LayoutDashboard} label="Dashboard" isActive={currentView === 'DASHBOARD'} collapsed={collapsed && !isMobile} onClick={handleNavClick} />
        )}
        {canAccess('POS') && (
          <NavItem view="POS" icon={ShoppingCart} label="Kasir" isActive={currentView === 'POS'} collapsed={collapsed && !isMobile} onClick={handleNavClick} />
        )}
        {canAccess('INVENTORY') && (
          <NavItem view="INVENTORY" icon={Package} label="Inventaris" isActive={currentView === 'INVENTORY'} collapsed={collapsed && !isMobile} onClick={handleNavClick} />
        )}
        {canAccess('REPORTS') && (
          <NavItem view="REPORTS" icon={BarChart3} label="Laporan" isActive={currentView === 'REPORTS'} collapsed={collapsed && !isMobile} onClick={handleNavClick} />
        )}

        {canAccessSystem() && (
          <>
            <div className="mt-8 mb-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {(!collapsed || isMobile) && 'Sistem'}
            </div>
            <NavItem view="SETTINGS" icon={Settings} label="Pengaturan" isActive={currentView === 'SETTINGS'} collapsed={collapsed && !isMobile} onClick={handleNavClick} />
          </>
        )}
      </div>

      <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800">
        <div className={`flex items-center ${(collapsed && !isMobile) ? 'justify-center' : 'justify-between'}`}>
          {(!collapsed || isMobile) && (
            <div className="flex-1 overflow-hidden mr-2">
              <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{currentUser?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize font-medium">{currentUser?.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-center ${(collapsed && !isMobile) ? 'p-3 w-full bg-gray-100 dark:bg-slate-700' : 'p-2'}`}
            title="Keluar Sistem"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button - Centered with h-16 header */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3.5 left-4 z-50 p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-100 dark:border-slate-700 hover:shadow-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-all active:scale-95"
        aria-label="Open menu"
      >
        <Menu size={20} className="text-gray-700 dark:text-gray-200" />
      </button>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 bg-black/50 z-40"
            />
            <MotionDiv
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="md:hidden fixed left-0 top-0 h-screen w-[280px] bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col z-50"
            >
              <SidebarContent isMobile />
            </MotionDiv>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex h-screen bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 transition-all duration-300 flex-col z-50 ${collapsed ? 'w-20' : 'w-64'}`}>
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;