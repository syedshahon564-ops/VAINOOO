'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trophy, Phone, Lock, User, Mail, Check, AlertCircle, Shield, Eye, EyeOff } from 'lucide-react';
import { loginUser, registerUser } from '@/lib/user-store';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'REGISTER' : 'LOGIN';

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Quick fill demo credentials
  const fillDemo = (demoIdentifier: string, demoPass: string) => {
    setMode('LOGIN');
    setUsername(demoIdentifier);
    setPassword(demoPass);
    setError(null);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'REGISTER') {
        const uName = username.trim();
        const mail = email.trim();

        if (!uName) throw new Error('Please enter a username');
        if (uName.length < 3) throw new Error('Username must be at least 3 characters');
        if (!mail) throw new Error('Please enter your email address (Gmail)');
        if (!mail.includes('@')) throw new Error('Please enter a valid email address');
        if (!password) throw new Error('Please enter a password');
        if (password.length < 6) throw new Error('Password must be at least 6 characters');
        if (password !== confirmPassword) throw new Error('Passwords do not match');

        // 1 Account per device limitation
        if (typeof window !== 'undefined') {
          const registered = localStorage.getItem('ff_device_registered_account');
          if (registered) {
            throw new Error('Only 1 account is permitted per device. An account is already registered on this device.');
          }
        }

        const localRes = registerUser({
          username: uName,
          email: mail.toLowerCase(),
          password,
        });

        if (!localRes.success) {
          throw new Error(localRes.error || 'Registration failed');
        }

        setSuccess(`Registration successful! Welcome, ${localRes.user?.username || localRes.user?.ign}!`);
        setTimeout(() => {
          router.push('/');
        }, 1000);
      } else {
        // Mode === LOGIN
        const identifier = username.trim();
        if (!identifier || !password) {
          throw new Error('Please enter your username or email and password');
        }

        const localRes = loginUser(identifier, password);
        if (!localRes.success) {
          throw new Error(localRes.error || 'Login failed. Please verify your credentials.');
        }

        setSuccess(`Login successful! Welcome, ${localRes.user?.username || localRes.user?.ign}!`);
        setTimeout(() => {
          if (localRes.user?.role === 'ADMIN' || localRes.user?.role === 'SUPERVISOR') {
            router.push('/admin');
          } else {
            router.push('/');
          }
        }, 800);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-8 sm:p-10 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-red-600 mx-auto flex items-center justify-center shadow-lg shadow-red-600/30 text-white">
            <Trophy className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">
            {mode === 'LOGIN' ? 'Account Login' : 'Create Account'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {mode === 'LOGIN'
              ? 'Enter your username or email and password to enter'
              : 'Register your account with username and email'}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/5">
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN');
              setError(null);
              setSuccess(null);
            }}
            className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              mode === 'LOGIN'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('REGISTER');
              setError(null);
              setSuccess(null);
            }}
            className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              mode === 'REGISTER'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              {mode === 'LOGIN' ? 'Username or Email' : '1. Username'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder={mode === 'LOGIN' ? 'Enter username or email' : 'e.g. shadow_hunter'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs font-bold focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          {mode === 'REGISTER' && (
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                2. Gmail ID (Email)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="e.g. yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              {mode === 'REGISTER' ? '3. Password' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs focus:border-red-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'REGISTER' && (
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                4. Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs focus:border-red-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === 'REGISTER' && (
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] flex items-center gap-1.5 font-medium">
              <Shield className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Device Security: Only 1 account is permitted per device.</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl btn-red text-xs font-black disabled:opacity-50 mt-4 shadow-lg shadow-red-600/30 cursor-pointer"
          >
            {loading
              ? 'Please wait...'
              : mode === 'LOGIN'
              ? 'Login'
              : 'Create Account'}
          </button>
        </form>

        {/* 1-Click Quick Demo & Owner Credentials */}
        <div className="pt-4 border-t border-gray-200 dark:border-white/10 space-y-3">
          <div>
            <span className="text-[10px] uppercase font-black text-amber-500 block tracking-wider text-center mb-1.5 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3 text-amber-500" /> Official Owner / Admin Accounts (1-Click Login)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {[
                { label: 'ওনার ১', phone: '01700000001', pass: 'admin@owner1', ign: 'OWNER_BOSS_1' },
                { label: 'ওনার ২', phone: '01700000002', pass: 'admin@owner2', ign: 'OWNER_BOSS_2' },
                { label: 'ওনার ৩', phone: '01700000003', pass: 'admin@owner3', ign: 'OWNER_BOSS_3' },
                { label: 'ওনার ৪', phone: '01700000004', pass: 'admin@owner4', ign: 'OWNER_BOSS_4' },
                { label: 'ওনার ৫', phone: '01700000005', pass: 'admin@owner5', ign: 'OWNER_BOSS_5' },
                { label: 'মাস্টার অ্যাডমিন', phone: '01700000000', pass: 'admin123', ign: 'ADMIN_MASTER' },
              ].map((adm) => (
                <button
                  key={adm.phone}
                  type="button"
                  onClick={() => fillDemo(adm.phone, adm.pass)}
                  className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-left transition-all group"
                >
                  <div className="text-[10px] font-black text-amber-600 dark:text-amber-400 group-hover:underline">
                    {adm.label}
                  </div>
                  <div className="text-[9px] text-gray-400 font-mono">{adm.phone}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-black text-gray-400 block tracking-wider text-center mb-1.5">
              🎮 প্লেয়ার অ্যাকাউন্ট ডেমো
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => fillDemo('01712345678', 'striker@2026')}
                className="p-1.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-red-500 text-left transition-all"
              >
                <div className="text-[10px] font-black text-gray-900 dark:text-white">
                  BDX_STRIKER
                </div>
                <div className="text-[9px] text-emerald-500 font-bold">ব্যালেন্স: ৳1450.00</div>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('01899887766', 'tanvir#ff99')}
                className="p-1.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-red-500 text-left transition-all"
              >
                <div className="text-[10px] font-black text-gray-900 dark:text-white">
                  TANVIR_FF
                </div>
                <div className="text-[9px] text-emerald-500 font-bold">ব্যালেন্স: ৳820.00</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#07070a] flex items-center justify-center text-white text-xs font-bold">
          লোড হচ্ছে...
        </div>
      }
    >
      <AuthContent />
    </React.Suspense>
  );
}
