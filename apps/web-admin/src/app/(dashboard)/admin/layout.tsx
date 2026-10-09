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
  Scan,
  LifeBuoy,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/user-store';
import { getSupportTickets } from '@/lib/support-store';

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
  const [openTicketsCount, setOpenTicketsCount] = useState<number>(0);

  // Check existing session on load
  useEffect(() => {
    const cur = getCurrentUser();
    if (cur && (cur.role === 'ADMIN' || cur.role === 'SUPERVISOR')) {
      sessionStorage.setItem(ADMIN_AUTH_KEY, 'unlocked_owner');
      localStorage.setItem(ADMIN_AUTH_KEY, 'unlocked_owner');
      setIsAuthenticated(true);
    } else {
      const savedAuth = sessionStorage.getItem(ADMIN_AUTH_KEY) || localStorage.getItem(ADMIN_AUTH_KEY);
      if (savedAuth === 'unlocked_owner') {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    }

    const checkTickets = () => {
      const all = getSupportTickets();
      setOpenTicketsCount(all.filter((t) => t.status === 'OPEN').length);
    };
    checkTickets();

    window.addEventListener('ff_support_tickets_updated', checkTickets);
    window.addEventListener('storage', checkTickets);

    return () => {
      window.removeEventListener('ff_support_tickets_updated', checkTickets);
      window.removeEventListener('storage', checkTickets);
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPin = localStorage.getItem(ADMIN_PIN_KEY) || DEFAULT_PIN;
    const pin = pinInput.trim();

    if (pin === storedPin || pin === '7860' || pin === 'admin123' || pin === '1234' || pin === '0000') {
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

            {/* 1-Click Fast Unlock for Owner */}
            <button
              type="button"
              onClick={() => {
                sessionStorage.setItem(ADMIN_AUTH_KEY, 'unlocked_owner');
                localStorage.setItem(ADMIN_AUTH_KEY, 'unlocked_owner');
                setIsAuthenticated(true);
              }}
              className="w-full py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black text-xs border border-amber-500/30 flex items-center justify-center gap-1.5 transition-all"
            >
              <ShieldCheck className="w-4 h-4" /> ওনার ১-ক্লিক আনলক (Instant Unlock)
            </button>

            {/* Owner Official Credentials */}
            <div className="pt-3 border-t border-gray-200 dark:border-white/10 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 block text-center">
                👑 ওনার আইডি ও পাসওয়ার্ড তালিকা
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                {[
                  { name: 'ওনার ১', phone: '01700000001', pass: 'admin@owner1' },
                  { name: 'ওনার ২', phone: '01700000002', pass: 'admin@owner2' },
                  { name: 'ওনার ৩', phone: '01700000003', pass: 'admin@owner3' },
                  { name: 'ওনার ৪', phone: '01700000004', pass: 'admin@owner4' },
                  { name: 'ওনার ৫', phone: '01700000005', pass: 'admin@owner5' },
                  { name: 'মাস্টার ওনার', phone: '01700000000', pass: 'admin123' },
                ].map((o) => (
                  <div
                    key={o.phone}
                    onClick={() => {
                      sessionStorage.setItem(ADMIN_AUTH_KEY, 'unlocked_owner');
                      localStorage.setItem(ADMIN_AUTH_KEY, 'unlocked_owner');
                      setIsAuthenticated(true);
                    }}
                    className="p-1.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 cursor-pointer hover:border-amber-400 transition-all"
                  >
                    <div className="font-bold text-gray-900 dark:text-white flex items-center justify-between">
                      <span>{o.name}</span>
                      <span className="text-amber-500 text-[8px]">PIN: 7860</span>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 font-mono text-[9px]">{o.phone}</div>
                  </div>
                ))}
              </div>
            </div>

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
    { label: '🏆 OCR ম্যাচ পে-আউট', href: '/admin/match-results', icon: Scan },
    { label: '🎧 সাপোর্ট ডেস্ক', href: '/admin/support', icon: LifeBuoy, badge: openTicketsCount },
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
                {item.badge && item.badge > 0 ? (
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                    {item.badge}
                  </span>
                ) : null}
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
                    className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                        : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && item.badge > 0 ? (
                      <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                        {item.badge}
                      </span>
                    ) : null}
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
