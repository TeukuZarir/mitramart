import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Building2,
  ShieldCheck,
  BellRing,
  Save,
  PackageSearch,
  User,
  Lock,
  Key,
  Users,
  Plus,
  Clock,
  Trash2,
  FileText,
  CreditCard,
  Smartphone,
  Mail,
  ArrowLeft,
  Edit2,
  ChevronRight,
  Settings as SettingsIcon,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Role, User as UserType } from '../types';
import { ConfirmDialog, PasswordDialog } from '../components/Modal';

const TAB_ORDER = ['PROFILE', 'ACCOUNTS', 'INVENTORY', 'BRANDING', 'SECURITY', 'NOTIFICATIONS'];

const TAB_CONFIG = [
  { id: 'PROFILE', icon: User, label: 'Profil Saya', desc: 'Informasi akun & keamanan' },
  { id: 'ACCOUNTS', icon: Users, label: 'Manajemen Akun', desc: 'Kelola akses staff', adminOnly: true },
  { id: 'INVENTORY', icon: PackageSearch, label: 'Parameter Gudang', desc: 'Aturan stok & valuasi' },
  { id: 'BRANDING', icon: Building2, label: 'Identitas Toko', desc: 'Kop surat & info toko' },
  { id: 'SECURITY', icon: ShieldCheck, label: 'Keamanan', desc: 'Sesi & otentikasi' },
  { id: 'NOTIFICATIONS', icon: BellRing, label: 'Notifikasi', desc: 'Alert & email' },
];

const InputField = ({ label, type = "text", value, onChange, disabled = false, placeholder = "", icon: Icon }: any) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Icon size={18} />
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full ${Icon ? 'pl-10' : 'px-4'} pr-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${disabled ? 'cursor-not-allowed bg-gray-50 dark:bg-slate-900 text-gray-400' : 'hover:border-gray-300 dark:hover:border-slate-500'}`}
      />
    </div>
  </div>
);

const TextAreaField = ({ label, value, onChange, placeholder = "", rows = 3 }: any) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</label>
    <textarea
      rows={rows}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none hover:border-gray-300 dark:hover:border-slate-500"
    />
  </div>
);

const ToggleSwitch = ({ title, description, checked, onChange }: any) => (
  <div
    onClick={onChange}
    className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all cursor-pointer group"
  >
    <div className="flex-1 pr-4">
      <p className={`font-medium text-sm ${checked ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>{title}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
    </div>
    <div className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-slate-600'}`}>
      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
    </div>
  </div>
);

const SectionCard = ({ title, icon: Icon, children, className = "" }: any) => (
  <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden ${className}`}>
    {title && (
      <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800">
        <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          {Icon && <Icon size={18} className="text-emerald-500" />}
          {title}
        </h4>
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

const SaveButton = ({ text = "Simpan Perubahan", onClick, disabled = false }: any) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-200/50 dark:shadow-none transition-all active:scale-[0.98] ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <Save size={18} className="mr-2" />
    {text}
  </button>
);

const Settings = () => {
  const { currentUser, activeSettingsTab, setSettingsTab, users, updateUserPassword, updateUserProfile, addUser, deleteUser, showToast, storeSettings, updateStoreSettings, logout } = useStore();

  const activeTab = activeSettingsTab;
  const handleTabChange = (newTabId: string) => {
    setSettingsTab(newTabId);
    setMobileShowContent(true);
  };

  const [mobileShowContent, setMobileShowContent] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);

  const [minStockGlobal, setMinStockGlobal] = useState(() => {
    const saved = localStorage.getItem('settings_minStockGlobal');
    return saved ? parseInt(saved, 10) : 10;
  });
  const [expiryWarningDays, setExpiryWarningDays] = useState(() => {
    const saved = localStorage.getItem('settings_expiryWarningDays');
    return saved ? parseInt(saved, 10) : 30;
  });

  const [storeName, setStoreName] = useState(storeSettings.storeName);
  const [taxId, setTaxId] = useState(storeSettings.taxId);
  const [invoiceFooter, setInvoiceFooter] = useState(storeSettings.invoiceFooter);
  const [storeAddress, setStoreAddress] = useState(storeSettings.storeAddress);
  const [storePhone, setStorePhone] = useState(storeSettings.storePhone);
  const [serviceContact, setServiceContact] = useState(storeSettings.serviceContact);

  const loadNotifSetting = (key: string, defaultValue: boolean) => {
    const saved = localStorage.getItem(key);
    return saved !== null ? saved === 'true' : defaultValue;
  };
  const [notifLowStock, setNotifLowStock] = useState(() => loadNotifSetting('notif_lowStock', true));
  const [notifExpiry, setNotifExpiry] = useState(() => loadNotifSetting('notif_expiry', true));
  const [notifDailyReport, setNotifDailyReport] = useState(() => loadNotifSetting('notif_dailyReport', false));
  const [notifNewLogin, setNotifNewLogin] = useState(() => loadNotifSetting('notif_newLogin', true));
  const [notifHighValue, setNotifHighValue] = useState(() => loadNotifSetting('notif_highValue', true));
  const [notifVoid, setNotifVoid] = useState(() => loadNotifSetting('notif_void', false));
  const [notifBackupFailed, setNotifBackupFailed] = useState(() => loadNotifSetting('notif_backupFailed', true));
  const [notifShiftChange, setNotifShiftChange] = useState(() => loadNotifSetting('notif_shiftChange', false));
  const [notifEmail, setNotifEmail] = useState(() => localStorage.getItem('notif_email') || currentUser?.email || '');
  const [notifWhatsapp, setNotifWhatsapp] = useState(() => localStorage.getItem('notif_whatsapp') || '');

  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'CASHIER' as Role,
    password: ''
  });

  const handleSaveStoreSettings = () => {
    updateStoreSettings({ storeName, storeAddress, storePhone, taxId, invoiceFooter, serviceContact });
  };

  const handleSaveProfile = () => {
    if (currentUser) {
      if (newPassword) {
        if (!oldPassword) {
          showToast('Password lama wajib diisi', 'error');
          return;
        }
        if (newPassword.length < 6) {
          showToast('Kata sandi minimal 6 karakter', 'error');
          return;
        }
        if (newPassword !== confirmPassword) {
          showToast('Konfirmasi kata sandi tidak cocok!', 'error');
          return;
        }
      }

      updateUserProfile(currentUser.id, { name: profileName, email: profileEmail, phone: profilePhone });
      if (newPassword) {
        updateUserPassword(currentUser.id, newPassword, oldPassword);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    }
  };

  const handleSaveNotifications = () => {
    localStorage.setItem('settings_minStockGlobal', minStockGlobal.toString());
    localStorage.setItem('settings_expiryWarningDays', expiryWarningDays.toString());
    localStorage.setItem('notif_lowStock', notifLowStock.toString());
    localStorage.setItem('notif_expiry', notifExpiry.toString());
    localStorage.setItem('notif_dailyReport', notifDailyReport.toString());
    localStorage.setItem('notif_newLogin', notifNewLogin.toString());
    localStorage.setItem('notif_highValue', notifHighValue.toString());
    localStorage.setItem('notif_void', notifVoid.toString());
    localStorage.setItem('notif_backupFailed', notifBackupFailed.toString());
    localStorage.setItem('notif_shiftChange', notifShiftChange.toString());
    localStorage.setItem('notif_email', notifEmail);
    localStorage.setItem('notif_whatsapp', notifWhatsapp);
    showToast('Preferensi berhasil disimpan!', 'success');
  };

  const handleToggle2FA = () => {
    if (!currentUser) return;
    if (!currentUser.phone) {
      showToast('Mohon lengkapi nomor HP di Profil terlebih dahulu', 'error');
      setSettingsTab('PROFILE');
      return;
    }
    const indoPhoneRegex = /^(\+?62|08)\d{8,13}$/;
    if (!indoPhoneRegex.test(currentUser.phone)) {
      showToast('Nomor HP wajib format Indonesia (08... atau 62...)', 'error');
      setSettingsTab('PROFILE');
      return;
    }
    const newState = !currentUser.is2faEnabled;
    updateUserProfile(currentUser.id, { is2faEnabled: newState });
    showToast(`2FA berhasil ${newState ? 'diaktifkan' : 'dinonaktifkan'}`, 'success');
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      showToast('Mohon lengkapi semua data', 'error');
      return;
    }
    const newUserObj: UserType = {
      id: Date.now().toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      password: newUser.password,
      avatar: `https://ui-avatars.com/api/?name=${newUser.name}&background=random&color=fff`
    };
    addUser(newUserObj);
    setNewUser({ name: '', email: '', role: 'CASHIER', password: '' });
  };

  const filteredTabs = TAB_CONFIG.filter(tab => !tab.adminOnly || currentUser?.role === 'ADMIN');

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-brand font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <SettingsIcon size={24} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            Pengaturan
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Kelola profil akun dan konfigurasi sistem toko Anda.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
            <User size={16} className="text-blue-500" />
            <span>{currentUser?.name}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${currentUser?.role === 'ADMIN' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : currentUser?.role === 'CASHIER' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'}`}>
              {currentUser?.role}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Sidebar Navigation */}
        <div className={`w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-24 ${mobileShowContent ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu Pengaturan</p>
            </div>
            <div className="p-2">
              {filteredTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all mb-1 group ${isActive
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                      }`}
                  >
                    <div className={`p-2 rounded-lg transition-colors ${isActive
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 group-hover:bg-emerald-100 group-hover:text-emerald-600'
                      }`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-200'}`}>{tab.label}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{tab.desc}</p>
                    </div>
                    <ChevronRight size={16} className={`text-gray-300 transition-transform ${isActive ? 'text-emerald-500 translate-x-1' : ''}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className={`flex-1 min-w-0 w-full ${mobileShowContent ? 'block' : 'hidden lg:block'}`}>
          {/* Mobile Back Button */}
          <button
            type="button"
            onClick={() => setMobileShowContent(false)}
            className="lg:hidden flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-4 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Kembali ke Menu</span>
          </button>

          {/* PROFILE TAB */}
          {activeTab === 'PROFILE' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="Informasi Akun" icon={CreditCard}>
                  <div className="space-y-4">
                    <InputField label="Nama Lengkap" icon={User} value={profileName} onChange={(e: any) => setProfileName(e.target.value)} />
                    <InputField label="Alamat Email" icon={Mail} type="email" value={profileEmail} onChange={(e: any) => setProfileEmail(e.target.value)} />
                    <InputField label="Nomor HP" icon={Smartphone} value={profilePhone} onChange={(e: any) => setProfilePhone(e.target.value)} placeholder="08xx-xxxx-xxxx" />
                    <InputField label="Role / Jabatan" value={currentUser?.role} disabled />
                  </div>
                </SectionCard>

                <SectionCard title="Ganti Kata Sandi" icon={Lock}>
                  <div className="space-y-4">
                    <InputField label="Kata Sandi Lama" type="password" icon={Key} value={oldPassword} onChange={(e: any) => setOldPassword(e.target.value)} placeholder="Kata sandi saat ini" />
                    <InputField label="Kata Sandi Baru" type="password" icon={Key} value={newPassword} onChange={(e: any) => setNewPassword(e.target.value)} placeholder="Min. 6 karakter" />
                    <InputField label="Konfirmasi Kata Sandi" type="password" icon={Key} value={confirmPassword} onChange={(e: any) => setConfirmPassword(e.target.value)} placeholder="Ulangi kata sandi baru" />
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-slate-900 p-3 rounded-lg">
                      Kata sandi minimal 6 karakter. Gunakan kombinasi huruf dan angka untuk keamanan lebih baik.
                    </p>
                  </div>
                </SectionCard>
              </div>
              <div className="flex justify-end">
                <SaveButton text="Simpan Profil" onClick={handleSaveProfile} />
              </div>
            </div>
          )}

          {/* ACCOUNTS TAB */}
          {activeTab === 'ACCOUNTS' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2">
                  <SectionCard title="Buat Akun Baru" icon={Plus}>
                    <div className="space-y-4">
                      <InputField label="Nama Lengkap" placeholder="Contoh: Ahmad Staff" value={newUser.name} onChange={(e: any) => setNewUser({ ...newUser, name: e.target.value })} />
                      <InputField label="Email Login" placeholder="staff@mitramart.com" value={newUser.email} onChange={(e: any) => setNewUser({ ...newUser, email: e.target.value })} />
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Role</label>
                        <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value as Role })} className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none">
                          <option value="CASHIER">CASHIER (Kasir)</option>
                          <option value="WAREHOUSE">WAREHOUSE (Gudang)</option>
                          <option value="ADMIN">ADMIN (Full Access)</option>
                        </select>
                      </div>
                      <InputField label="Kata Sandi Awal" type="password" placeholder="Minimal 4 karakter" value={newUser.password} onChange={(e: any) => setNewUser({ ...newUser, password: e.target.value })} />
                      <button type="button" onClick={handleCreateUser} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200/50 dark:shadow-none">
                        <Plus size={18} /> Buat Akun
                      </button>
                    </div>
                  </SectionCard>
                </div>

                <div className="lg:col-span-3">
                  <SectionCard title={`Akun Terdaftar (${users.length})`} icon={Users}>
                    <div className="space-y-3">
                      {users.map(u => (
                        <div key={u.id} className="p-4 border border-gray-100 dark:border-slate-700 rounded-xl flex items-center gap-4 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all group bg-gray-50/50 dark:bg-slate-900/50">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${u.role === 'ADMIN' ? 'bg-emerald-500' : u.role === 'CASHIER' ? 'bg-blue-500' : 'bg-orange-500'}`}>
                            {u.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">{u.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${u.role === 'ADMIN' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : u.role === 'CASHIER' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'}`}>
                            {u.role}
                          </span>
                          {u.id !== currentUser?.id && (
                            <div className="flex items-center gap-1">
                              <button onClick={() => { setSelectedUser(u); setPasswordModalOpen(true); }} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Ubah Kata Sandi">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => { setSelectedUser(u); setDeleteModalOpen(true); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Hapus User">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                </div>
              </div>

              <ConfirmDialog isOpen={deleteModalOpen} onClose={() => { setDeleteModalOpen(false); setSelectedUser(null); }} onConfirm={() => { if (selectedUser) deleteUser(selectedUser.id); }} title="Hapus Akun" message={`Apakah Anda yakin ingin menghapus akun "${selectedUser?.name}"? Tindakan ini tidak dapat dibatalkan.`} confirmText="Ya, Hapus" cancelText="Batal" />
              <PasswordDialog isOpen={passwordModalOpen} onClose={() => { setPasswordModalOpen(false); setSelectedUser(null); }} onSubmit={(pass) => { if (selectedUser) updateUserPassword(selectedUser.id, pass); }} userName={selectedUser?.name || ''} />
            </div>
          )}

          {/* INVENTORY TAB */}
          {activeTab === 'INVENTORY' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="Stok Minimum Global" icon={AlertTriangle}>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">Ambang Batas</span>
                      <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-sm font-bold px-3 py-1 rounded-full">{minStockGlobal} Unit</span>
                    </div>
                    <input type="range" min="1" max="100" value={minStockGlobal} onChange={(e) => setMinStockGlobal(Number(e.target.value))} className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-slate-900 p-3 rounded-lg">
                      Produk dengan kuantitas di bawah ambang batas ini akan ditandai <span className="font-bold text-red-500">Stok Rendah</span> di dashboard.
                    </p>
                  </div>
                </SectionCard>

                <SectionCard title="Peringatan Kedaluwarsa" icon={Clock}>
                  <div className="space-y-4">
                    <InputField label="Peringatan Dini (Hari)" type="number" value={expiryWarningDays} onChange={(e: any) => setExpiryWarningDays(Number(e.target.value))} />
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-slate-900 p-3 rounded-lg">
                      Sistem akan mengirim notifikasi <span className="font-bold">{expiryWarningDays} hari</span> sebelum tanggal kedaluwarsa produk tercapai.
                    </p>
                  </div>
                </SectionCard>
              </div>
              <div className="flex justify-end">
                <SaveButton onClick={handleSaveNotifications} />
              </div>
            </div>
          )}

          {/* BRANDING TAB */}
          {activeTab === 'BRANDING' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="Informasi Struk" icon={FileText}>
                  <div className="space-y-4">
                    <TextAreaField label="Alamat Toko" value={storeAddress} onChange={(e: any) => setStoreAddress(e.target.value)} placeholder="Alamat lengkap toko" />
                    <InputField label="Telepon Toko" value={storePhone} onChange={(e: any) => setStorePhone(e.target.value)} placeholder="(021) xxx-xxxx" />
                    <InputField label="Layanan Konsumen" value={serviceContact} onChange={(e: any) => setServiceContact(e.target.value)} placeholder="08xx-xxxx-xxxx" />
                  </div>
                </SectionCard>

                <SectionCard title="Informasi Legal" icon={Building2}>
                  <div className="space-y-4">
                    <InputField label="Nama Bisnis Legal" value={storeName} onChange={(e: any) => setStoreName(e.target.value)} />
                    <InputField label="NPWP / Tax ID" value={taxId} onChange={(e: any) => setTaxId(e.target.value)} />
                    <TextAreaField label="Footer Invoice" value={invoiceFooter} onChange={(e: any) => setInvoiceFooter(e.target.value)} rows={4} />
                  </div>
                </SectionCard>
              </div>
              <div className="flex justify-end">
                <SaveButton onClick={handleSaveStoreSettings} />
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'NOTIFICATIONS' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="Notifikasi Operasional" icon={PackageSearch}>
                  <div className="space-y-3">
                    <ToggleSwitch title="Stok Kritis" description="Notifikasi saat stok < minimum" checked={notifLowStock} onChange={() => setNotifLowStock(!notifLowStock)} />
                    <ToggleSwitch title="Barang Kedaluwarsa" description={`Peringatan H-${expiryWarningDays} ED`} checked={notifExpiry} onChange={() => setNotifExpiry(!notifExpiry)} />
                    <ToggleSwitch title="Transaksi Besar" description="Alert jika transaksi > Rp 1jt" checked={notifHighValue} onChange={() => setNotifHighValue(!notifHighValue)} />
                    <ToggleSwitch title="Void & Retur" description="Notifikasi pembatalan item kasir" checked={notifVoid} onChange={() => setNotifVoid(!notifVoid)} />
                  </div>
                </SectionCard>

                <SectionCard title="Notifikasi Sistem" icon={ShieldCheck}>
                  <div className="space-y-3">
                    <ToggleSwitch title="Login Baru" description="Email saat perangkat baru login" checked={notifNewLogin} onChange={() => setNotifNewLogin(!notifNewLogin)} />
                    <ToggleSwitch title="Rekap Harian" description="Email laporan jam 23:59" checked={notifDailyReport} onChange={() => setNotifDailyReport(!notifDailyReport)} />
                    <ToggleSwitch title="Backup Gagal" description="Peringatan jika auto-backup error" checked={notifBackupFailed} onChange={() => setNotifBackupFailed(!notifBackupFailed)} />
                    <ToggleSwitch title="Shift Kasir" description="Laporan saat pergantian shift" checked={notifShiftChange} onChange={() => setNotifShiftChange(!notifShiftChange)} />
                  </div>
                </SectionCard>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="Email Alerts" icon={Mail}>
                  <InputField label="Email Penerima" type="email" icon={Mail} value={notifEmail} onChange={(e: any) => setNotifEmail(e.target.value)} placeholder="admin@mitramart.com" />
                  <p className="text-xs text-gray-400 mt-3">Digunakan untuk laporan harian & alert keamanan.</p>
                </SectionCard>

                <SectionCard title="WhatsApp Channel" icon={Smartphone}>
                  <InputField label="Nomor WhatsApp" icon={Smartphone} value={notifWhatsapp} onChange={(e: any) => setNotifWhatsapp(e.target.value)} placeholder="081234567890" />
                  <p className="text-xs text-gray-400 mt-3">Pastikan nomor terdaftar di WhatsApp Business API.</p>
                </SectionCard>
              </div>

              <div className="flex justify-end">
                <SaveButton onClick={handleSaveNotifications} />
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'SECURITY' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="Two-Factor Authentication" icon={ShieldCheck} className="flex flex-col">
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-6">
                      <div className={`p-3 rounded-xl ${currentUser?.is2faEnabled ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-slate-700'}`}>
                        <ShieldCheck size={24} className={currentUser?.is2faEnabled ? 'text-emerald-600' : 'text-gray-400'} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">Status: {currentUser?.is2faEnabled ? 'Aktif' : 'Nonaktif'}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tambahkan lapisan keamanan ekstra dengan 2FA.</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                      Kami akan meminta kode verifikasi setiap kali login baru terdeteksi dari perangkat yang tidak dikenal.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggle2FA}
                    className={`w-full py-3 border font-semibold rounded-xl transition-colors ${currentUser?.is2faEnabled
                      ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100'
                      : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                      }`}
                  >
                    {currentUser?.is2faEnabled ? 'Nonaktifkan 2FA' : 'Aktifkan 2FA'}
                  </button>
                </SectionCard>

                <SectionCard title="Manajemen Sesi" icon={Key} className="flex flex-col">
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                        <CheckCircle size={24} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">Sesi Aktif</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Perangkat ini - {new Date().toLocaleDateString('id-ID')}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                      Jika Anda merasa akun diakses orang lain atau lupa logout di perangkat umum, segera akhiri semua sesi aktif.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      showToast('Semua sesi telah diakhiri. Anda akan logout.', 'info');
                      setTimeout(() => logout(), 1500);
                    }}
                    className="w-full py-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-semibold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    Logout Semua Perangkat
                  </button>
                </SectionCard>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;