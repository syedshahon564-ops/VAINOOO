'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  Wallet,
  User,
  LogOut,
  Sun,
  Moon,
  Home,
  Globe,
  ArrowDownRight,
  Download,
  Smartphone,
} from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import { useTheme } from '@/components/ThemeProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { useCMS } from '@/lib/cms-store';
import { getCurrentUser, logoutUser } from '@/lib/user-store';
import DepositWithdrawModal from '@/components/DepositWithdrawModal';
import { useViewMode } from '@/lib/view-mode';

export default function Navbar() {
  const router = useRouter();
  const { isApp, setViewMode } = useViewMode();
  const [user, setUser] = useState<any>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const { settings } = useCMS();

  // Hidden secret trigger for owner: 5 clicks on logo within 3 seconds navigates to secret /admin
  const logoClicksRef = useRef<number>(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSecretLogoClick = (e: React.MouseEvent) => {
    logoClicksRef.current += 1;
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);

    if (logoClicksRef.current >= 5) {
      e.preventDefault();
      logoClicksRef.current = 0;
      router.push('/admin');
      return;
    }

    clickTimeoutRef.current = setTimeout(() => {
      logoClicksRef.current = 0;
    }, 2500);
  };

  useEffect(() => {
    // Hidden keyboard shortcut: Ctrl+Shift+A opens admin
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        router.push('/admin');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  useEffect(() => {
    const updateActiveUser = () => {
      const current = getCurrentUser();
      setUser(current);
    };

    updateActiveUser();

    window.addEventListener('ff_users_updated', updateActiveUser);
    window.addEventListener('storage', updateActiveUser);
    return () => {
      window.removeEventListener('ff_users_updated', updateActiveUser);
      window.removeEventListener('storage', updateActiveUser);
    };
  }, []);

  const handleLogout = () => {
    ApiClient.clearToken();
    logoutUser();
    setUser(null);
    window.location.href = '/';
  };

  if (isApp) return null;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/95 dark:bg-[#07070a]/90 border-b border-gray-200 dark:border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo with User-uploaded Logo */}
        <Link href="/" onClick={handleSecretLogoClick} className="flex items-center gap-3 group select-none flex-shrink-0">
          <div className="w-11 h-11 rounded-2xl overflow-hidden border border-amber-500/40 bg-black/80 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-all flex items-center justify-center p-1">
            <img
              src="/logo.png"
              alt="FF Rivals Tour BD"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-black tracking-wide text-gray-900 dark:text-white leading-tight">
              FF Rivals <span className="text-red-600">Tour BD</span>
            </span>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold tracking-wider uppercase leading-tight">
              Free Fire Esports Arena
            </p>
          </div>
        </Link>

        {/* Clean Nav Links (Home, Leaderboard, Deposit & Withdraw) */}
        <nav className="hidden md:flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-gray-700 dark:text-gray-300 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
          >
            <Home className="w-4 h-4" /> {t('হোম', 'Home')}
          </Link>

          <Link
            href="/leaderboard"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all font-black"
          >
            <Trophy className="w-4 h-4 text-amber-500" /> {t('লিডারবোর্ড', 'Leaderboard')}
          </Link>

          <button
            onClick={() => setShowDepositModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black transition-all shadow-md shadow-emerald-600/20"
          >
            <ArrowDownRight className="w-4 h-4" /> {t('ডিপোজিট ও উইথড্র', 'Deposit & Withdraw')}
          </button>
        </nav>

        {/* Right Action Icons & User Balance */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Mobile Deposit Quick Button */}
          <button
            onClick={() => setShowDepositModal(true)}
            className="md:hidden px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center gap-1 shadow-sm"
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>{t('ডিপোজিট', 'Deposit')}</span>
          </button>

          {/* Language Switcher (Bangla / English) */}
          <button
            onClick={toggleLanguage}
            title={language === 'bn' ? 'Switch to English' : 'বাংলা ভাষায় পরিবর্তন করুন'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/10 text-xs font-black text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/15 transition-all border border-gray-200 dark:border-white/10"
          >
            <Globe className="w-3.5 h-3.5 text-red-600" />
            <span>{language === 'bn' ? 'EN' : 'বাং'}</span>
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/15 transition-all border border-gray-200 dark:border-white/10"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Wallet Balance Pill (Clicks to Open Deposit/Withdraw Modal) */}
          <button
            onClick={() => setShowDepositModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 hover:border-red-500 transition-all text-left"
          >
            <Wallet className="w-3.5 h-3.5 text-red-600" />
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold hidden sm:inline">
              {t('ব্যালেন্স:', 'Balance:')}
            </span>
            <span className="text-xs font-black text-red-600 dark:text-red-400">
              ৳ {user ? (user.walletBalance || 0).toFixed(2) : '1,450.00'}
            </span>
          </button>

          {/* Profile Button */}
          {user ? (
            <div className="flex items-center gap-2">
              {user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition-all flex items-center gap-1 shadow-sm"
                >
                  👑 <span className="hidden md:inline">{t('অ্যাডমিন', 'Admin')}</span>
                </Link>
              )}
              <Link
                href="/profile"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 transition-all border border-gray-200 dark:border-white/10"
              >
                <User className="w-3.5 h-3.5 text-gray-700 dark:text-gray-200" />
                <span className="text-xs font-bold text-gray-900 dark:text-white hidden sm:inline">
                  {user.ign || 'Player'}
                </span>
              </Link>

              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 transition-all"
              >
                {t('লগইন', 'Login')}
              </Link>
              <Link
                href="/login?mode=register"
                className="px-4 py-2 rounded-xl text-xs font-bold btn-red"
              >
                {t('রেজিস্টার', 'Register')}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Deposit & Withdraw Interactive Modal */}
      <DepositWithdrawModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
      />
    </header>
  );
}
