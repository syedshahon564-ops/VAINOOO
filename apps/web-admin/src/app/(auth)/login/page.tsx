import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trophy, Phone, Lock, User, Mail, Check, AlertCircle, Shield, Eye, EyeOff, Clipboard } from 'lucide-react';
import { loginUser, registerUser } from '@/lib/user-store';
import { readClipboardText } from '@/lib/clipboard';

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

        // Maximum 3 accounts per device limitation
        if (typeof window !== 'undefined') {
          try {
            const regRaw = localStorage.getItem('ff_device_registered_accounts');
            let registeredList: string[] = [];
            if (regRaw) {
              try {
                const parsed = JSON.parse(regRaw);
                if (Array.isArray(parsed)) registeredList = parsed;
              } catch {
                registeredList = [regRaw];
              }
            } else {
              const legacy = localStorage.getItem('ff_device_registered_account');
              if (legacy) registeredList = [legacy];
            }
            if (registeredList.length >= 3) {
              throw new Error('ডিভাইস লিমিট পূর্ণ হয়েছে! একটি ডিভাইসে সর্বোচ্চ ৩টি অ্যাকাউন্ট খোলা যাবে (Maximum 3 accounts allowed per device).');
            }
          } catch (e: any) {
            if (e.message?.includes('ডিভাইস লিমিট') || e.message?.includes('3 accounts')) throw e;
          }
        }

        const localRes = await registerUser({
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

        const localRes = await loginUser(identifier, password);
        if (!localRes.success) {
          throw new Error(localRes.error || 'Login failed. Please verify your credentials.');
        }

        const redirect = searchParams.get('redirect') || '/';
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          if (localRes.user?.role === 'ADMIN' && redirect === '/') {
            router.push('/admin');
          } else {
            router.push(redirect);
          }
        }, 800);
      }
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#07070a] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#12121a] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-white/10 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-red-600/10 border border-red-600/20 text-red-600 flex items-center justify-center mx-auto shadow-lg shadow-red-600/10">
            <Trophy className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">
            {mode === 'LOGIN' ? 'Welcome Back!' : 'Create Esports Account'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {mode === 'LOGIN'
              ? 'Log in to join Free Fire tournaments & claim prizes'
              : 'Register in seconds and start competing live'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5">
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
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {mode === 'LOGIN' ? 'Username or Email' : '1. Username'}
              </label>
              <button
                type="button"
                onClick={async () => {
                  const text = await readClipboardText();
                  if (text) setUsername(text.trim());
                }}
                className="text-[10px] text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Paste from clipboard"
              >
                <Clipboard className="w-3 h-3" />
                <span>পেস্ট</span>
              </button>
            </div>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                autoComplete="username"
                placeholder={mode === 'LOGIN' ? 'Enter username or email' : 'e.g. shadow_hunter'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onPaste={(e) => {
                  const pasted = e.clipboardData?.getData('text');
                  if (pasted) {
                    e.preventDefault();
                    setUsername(pasted.trim());
                  }
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs font-bold focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          {mode === 'REGISTER' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  2. Gmail ID (Email)
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    const text = await readClipboardText();
                    if (text) setEmail(text.trim());
                  }}
                  className="text-[10px] text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Paste from clipboard"
                >
                  <Clipboard className="w-3 h-3" />
                  <span>পেস্ট</span>
                </button>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="e.g. yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onPaste={(e) => {
                    const pasted = e.clipboardData?.getData('text');
                    if (pasted) {
                      e.preventDefault();
                      setEmail(pasted.trim());
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {mode === 'REGISTER' ? '3. Password' : 'Password'}
              </label>
              <button
                type="button"
                onClick={async () => {
                  const text = await readClipboardText();
                  if (text) setPassword(text.trim());
                }}
                className="text-[10px] text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Paste password"
              >
                <Clipboard className="w-3 h-3" />
                <span>পেস্ট</span>
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete={mode === 'LOGIN' ? 'current-password' : 'new-password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onPaste={(e) => {
                  const pasted = e.clipboardData?.getData('text');
                  if (pasted) {
                    e.preventDefault();
                    setPassword(pasted.trim());
                  }
                }}
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
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  4. Confirm Password
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    const text = await readClipboardText();
                    if (text) setConfirmPassword(text.trim());
                  }}
                  className="text-[10px] text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Paste confirm password"
                >
                  <Clipboard className="w-3 h-3" />
                  <span>পেস্ট</span>
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onPaste={(e) => {
                    const pasted = e.clipboardData?.getData('text');
                    if (pasted) {
                      e.preventDefault();
                      setConfirmPassword(pasted.trim());
                    }
                  }}
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
