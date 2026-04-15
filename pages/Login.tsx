import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Store, Lock, Mail, ArrowRight, AlertCircle, Boxes, FileBarChart, Eye, EyeOff, Wifi, WifiOff } from 'lucide-react';

const ForgotPasswordModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { showToast } = useStore();
  const [step, setStep] = useState<'EMAIL' | 'VERIFY' | 'NEW_PASS'>('EMAIL');

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [newPass, setNewPass] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('EMAIL');
      setEmail('');
      setOtp('');
      setInputOtp('');
      setNewPass('');
      setIsLoading(false);
    }
  }, [isOpen]);

  const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim kode');
      showToast('Kode verifikasi telah dikirim ke email Anda', 'success');
      setStep('VERIFY');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengirim kode verifikasi', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: inputOtp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kode verifikasi salah');
      showToast('Verifikasi Berhasil!', 'success');
      setStep('NEW_PASS');
    } catch (err: any) {
      showToast(err.message || 'Kode verifikasi salah', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 6) {
      showToast('Password minimal 6 karakter', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: newPass, otp: inputOtp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mereset password');
      showToast('Password berhasil direset. Silakan login.', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Gagal mereset password', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-800 dark:text-white">Atur Ulang Kata Sandi</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">✕</button>
        </div>

        <div className="p-6">
          {step === 'EMAIL' && (
            <form onSubmit={handleCheckEmail} className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">Masukkan email akun Anda untuk memulai proses atur ulang kata sandi.</p>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="nama@email.com"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-70"
              >
                {isLoading ? 'Mengirim...' : 'Kirim Kode Verifikasi'}
              </button>
            </form>
          )}

          {step === 'VERIFY' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500">Kode verifikasi telah dikirim ke <span className="font-bold">{email}</span></p>
                <p className="text-xs text-gray-400 mt-1">Masukkan 6 digit kode unik</p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={inputOtp}
                  onChange={e => setInputOtp(e.target.value)}
                  className="w-full p-4 text-center text-2xl font-mono tracking-widest bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none uppercase"
                  placeholder="XXXXXX"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-70"
              >
                {isLoading ? 'Memverifikasi...' : 'Verifikasi Kode'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleCheckEmail}
                  className="text-xs text-emerald-600 hover:underline mt-2"
                  disabled={isLoading}
                >
                  Kirim Ulang Kode
                </button>
              </div>

              <button type="button" onClick={() => setStep('EMAIL')} className="w-full text-xs text-gray-500 hover:text-emerald-600 underline mt-2">
                Ganti Email
              </button>
            </form>
          )}

          {step === 'NEW_PASS' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800 mb-4">
                <p className="text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                  <Lock size={14} /> Verifikasi Sukses. Silakan buat kata sandi baru.
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kata Sandi Baru</label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-70"
              >
                {isLoading ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const Login = () => {
  const { login, showToast, isApiConnected } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login(email, password);
      if (!success) {
        setError('Email atau password salah. Silakan coba lagi.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillEmail = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white dark:bg-slate-900 overflow-x-hidden font-sans">

      {/* Left Panel - Branding & Visuals (Static) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative flex-col justify-between p-12 overflow-hidden">

        {/* Base Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900" />

        {/* Static Aurora Effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-slate-900" />
          <div
            className="absolute -top-[10%] -left-[10%] w-[90%] h-[150%] bg-gradient-to-b from-emerald-400/40 via-emerald-600/20 to-transparent blur-[80px] mix-blend-screen"
            style={{ borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%' }}
          />
          <div
            className="absolute top-[20%] right-[0%] w-[80%] h-[120%] bg-gradient-to-b from-teal-400/30 via-teal-800/20 to-transparent blur-[90px] mix-blend-screen"
            style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }}
          />
          <div
            className="absolute top-[40%] left-[20%] w-[60%] h-[80%] bg-gradient-to-tr from-green-400/30 via-emerald-500/20 to-transparent blur-[60px] mix-blend-screen"
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-[50%] bg-gradient-to-t from-emerald-900/60 via-emerald-800/20 to-transparent blur-[100px]"
          />
        </div>

        {/* Noise Texture Overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Gradient Overlay for Better Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/40 z-10" />

        {/* Brand Header */}
        <div className="relative z-30 flex items-center gap-3">
          <div className="p-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl shadow-emerald-500/20">
            <Store className="text-emerald-300" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-brand font-bold text-white tracking-tight drop-shadow-md">MitraMart</h1>
            <div className="flex items-center gap-2">
              <span
                className="h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                style={{ width: '32px' }}
              />
              <p className="text-emerald-100 text-xs font-bold tracking-widest uppercase">Enterprise System</p>
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-30 max-w-lg space-y-8 my-auto">
          <h2 className="text-5xl font-extrabold text-white leading-[1.1] font-brand drop-shadow-lg">
            Solusi Cerdas <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-200">
              Manajemen Ritel
            </span>
          </h2>

          <p className="text-emerald-50/90 text-lg leading-relaxed font-light">
            Tingkatkan efisiensi operasional toko Anda dengan sistem inventaris yang terintegrasi, real-time, dan mudah digunakan.
          </p>

          {/* Feature Highlights */}
          <div className="grid gap-4 pt-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-lg shadow-emerald-500/5 group">
              <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-300 ring-1 ring-emerald-500/30">
                <Boxes size={24} />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Kontrol Stok Real-time</h3>
                <p className="text-emerald-100/70 text-xs mt-0.5">Pantau pergerakan barang masuk & keluar akurat.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-lg shadow-blue-500/5 group">
              <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-300 ring-1 ring-blue-500/30">
                <FileBarChart size={24} />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Laporan Analitik Lengkap</h3>
                <p className="text-emerald-100/70 text-xs mt-0.5">Data visual untuk keputusan bisnis yang lebih baik.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Copyright */}
        <div className="relative z-30 flex justify-between items-end text-emerald-200/60 text-[10px] font-medium tracking-wider uppercase">
          <p>© 2026 MITRAMART</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            <p>v1.0.0 (Demo)</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center px-4 py-12 sm:p-6 lg:p-12 relative bg-gray-50/50 dark:bg-slate-900">

        {/* Mobile Header */}
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-2">
          <div className="p-1.5 bg-emerald-600 rounded-lg text-white">
            <Store size={20} />
          </div>
          <span className="font-brand font-bold text-xl text-gray-900 dark:text-white tracking-tight">MitraMart</span>
        </div>

        <div className="w-full max-w-[420px] space-y-6 sm:space-y-8 relative z-10 pt-16 lg:pt-0">
          <div className="text-center lg:text-left space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight font-brand">
              Selamat Datang Kembali
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Masuk untuk mengakses dashboard Anda.</p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 flex items-start gap-3 text-sm">
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Alamat Email</label>
              <div className="relative group">
                <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-emerald-600 transition-colors pointer-events-none">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none dark:text-white font-medium placeholder:text-gray-400 shadow-sm"
                  placeholder="nama@perusahaan.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Kata Sandi</label>
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(true)}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  Lupa Kata Sandi?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-emerald-600 transition-colors pointer-events-none">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-12 pr-12 py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none dark:text-white font-medium placeholder:text-gray-400 shadow-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-emerald-600 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Masuk Sistem</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Forgot Password Modal */}
          <ForgotPasswordModal
            isOpen={forgotPasswordOpen}
            onClose={() => setForgotPasswordOpen(false)}
          />

          <p className="text-center text-[10px] text-gray-400 pt-6">
            Dilindungi oleh sistem keamanan dan tunduk pada Kebijakan Privasi serta Syarat Layanan.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;