'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Trophy,
  FolderEdit,
  Users,
  FileText,
  Video,
  ShieldAlert,
  CreditCard,
  Bot,
  ArrowLeft,
  Flame,
  Lock,
  Key,
  ShieldCheck,
  LogOut,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

const ADMIN_AUTH_KEY = 'ff_admin_secret_auth_v1';
const ADMIN_PIN_KEY = 'ff_admin_custom_pin_v1';
const DEFAULT_PIN = '7860';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check existing session on load
  useEffect(() => {
    const savedAuth = sessionStorage.getItem(ADMIN_AUTH_KEY) || localStorage.getItem(ADMIN_AUTH_KEY);
    if (savedAuth === 'unlocked_owner') {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPin = localStorage.getItem(ADMIN_PIN_KEY) || DEFAULT_PIN;

    if (pinInput.trim() === storedPin) {
      sessionStorage.setItem(ADMIN_AUTH_KEY, 'unlocked_owner');
      localStorage.setItem(ADMIN_AUTH_KEY, 'unlocked_owner');
      setIsAuthenticated(true);
      setErrorMsg(null);
    } else {
      setErrorMsg('ভুল সিক্রেট পিন! শুধুমাত্র সাইট ওনার প্রবেশ করতে পারবে।');
      setPinInput('');
    }
  };

  const handleLockAdmin = () => {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    localStorage.removeItem(ADMIN_AUTH_KEY);
    setIsAuthenticated(false);
    setPinInput('');
  };

  // While checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  // If NOT authenticated, show the Secret Owner Verification Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#111118] border border-gray-200 dark:border-white/10 p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-600/20 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-600/10 text-red-600 text-[10px] font-black uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" /> Owner Secret Portal
              </span>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mt-2">
                মাস্টার অ্যাডমিন ভেরিফিকেশন
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                এই অংশটি সাধারণ ব্যবহারকারীদের জন্য সম্পূর্ণরূপে অদৃশ্য। শুধুমাত্র ওনার পিন প্রবেশ করিয়ে আনলক করুন।
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-500" /> ওনার সিক্রেট পিন (Owner PIN):
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  placeholder="সিক্রেট পিন টাইপ করুন (ডিফল্ট: 7860)"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  autoFocus
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-sm font-mono tracking-widest focus:outline-none focus:border-red-600 text-gray-900 dark:text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" /> ড্যাশবোর্ডে প্রবেশ করুন
            </button>

            <div className="text-center pt-2">
              <Link
                href="/"
                className="text-xs text-gray-500 hover:text-red-600 transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> মূল ওয়েবসাইটে ফিরে যান
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Navigation Links for Authenticated Owner
  const links = [
    { label: '📊 মাস্টার ড্যাশবোর্ড', href: '/admin', icon: LayoutDashboard },
    { label: '🎮 ম্যাচ ম্যানেজমেন্ট', href: '/admin/tournaments', icon: Trophy },
    { label: '📁 ক্যাটাগরি ও ইমেজ', href: '/admin/categories', icon: FolderEdit },
    { label: '👥 ইউজার ও ব্যালেন্স', href: '/admin/users', icon: Users },
    { label: '💳 ফাইনান্স ও লেজার', href: '/admin/finance', icon: CreditCard },
    { label: '📜 রুলস ও নোটিশ', href: '/admin/rules', icon: FileText },
    { label: '🛡️ অ্যান্টি-চিট ডেস্ক', href: '/admin/anti-cheat', icon: ShieldAlert },
    { label: '🤖 বট লাইভ মনিটর', href: '/admin/live-spectator', icon: Video },
    { label: '⚙️ বট কন্ট্রোলস', href: '/admin/bot-controls', icon: Bot },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Owner Bar */}
      <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-[#12121a] border border-gray-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-600/30">
            <Flame className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-gray-900 dark:text-white">
                মাস্টার কন্ট্রোল প্যানেল
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/20">
                ওনার আনলকড
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              শুধুমাত্র আপনি এই গোপন কন্ট্রোল প্যানেলটি দেখতে ও পরিচালনা করতে পারবেন।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-white/5 transition-all flex items-center gap-1.5 border border-gray-200 dark:border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> ওয়েবসাইটে যান
          </Link>
          <button
            onClick={handleLockAdmin}
            className="px-4 py-2 rounded-xl bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white text-xs font-black transition-all flex items-center gap-1.5 border border-red-600/20"
          >
            <LogOut className="w-3.5 h-3.5" /> লক করুন
          </button>
        </div>
      </div>

      {/* Mobile Horizontal Quick Nav (Visible only on mobile/tablet) */}
      <div className="lg:hidden mb-6 -mx-4 px-4 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex items-center gap-2 min-w-max">
          {links.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/30'
                    : 'bg-white dark:bg-[#12121a] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-red-500'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Desktop Sidebar (Hidden on mobile) */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6">
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-5 space-y-4 shadow-sm sticky top-24">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2">
              কন্ট্রোল সেকশনসমূহ
            </div>

            <nav className="space-y-1.5">
              {links.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                        : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Admin Content Area */}
        <main className="lg:col-span-9">{children}</main>
      </div>
    </div>
  );
}
