'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  User,
  Wallet,
  Trophy,
  ShieldCheck,
  Phone,
  Hash,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Award,
  Camera,
  Mail,
  Bell,
  Zap,
  Smartphone,
} from 'lucide-react';

import { getCurrentUser, updateUser } from '@/lib/user-store';
import DepositWithdrawModal from '@/components/DepositWithdrawModal';

export default function ProfilePage() {
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [financeModalTab, setFinanceModalTab] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
  const [notifEnabled, setNotifEnabled] = useState(true);

  useEffect(() => {
    try {
      const state = localStorage.getItem('ff_notif_permission_state');
      if (state === 'denied') {
        setNotifEnabled(false);
      } else if (state === 'granted') {
        setNotifEnabled(true);
      }
    } catch {}
  }, []);

  const handleToggleNotifications = async () => {
    const nextState = !notifEnabled;
    setNotifEnabled(nextState);
    if (nextState) {
      try {
        if (typeof Notification !== 'undefined' && typeof Notification.requestPermission === 'function') {
          await Notification.requestPermission();
        }
        if (typeof window !== 'undefined' && (window as any).AndroidBridge?.requestNotificationPermission) {
          (window as any).AndroidBridge.requestNotificationPermission();
        }
        localStorage.setItem('ff_notif_permission_state', 'granted');
        if (typeof window !== 'undefined' && (window as any).AndroidBridge?.showNativeNotification) {
          (window as any).AndroidBridge.showNativeNotification(
            '🔔 নোটিফিকেশন চালু হয়েছে!',
            'এখন থেকে সকল ম্যাচ ও রুম আইডির আপডেট আপনার ফোনে সরাসরি আসবে।',
            '/'
          );
        }
      } catch {}
    } else {
      try {
        localStorage.setItem('ff_notif_permission_state', 'denied');
      } catch {}
    }
  };
  const [user, setUser] = useState<any>({
    ign: '',
    uid: '',
    phone: '',
    walletBalance: 0,
    role: 'PLAYER',
    totalMatches: 0,
    totalWins: 0,
    totalKills: 0,
    winRate: '0%',
  });

  useEffect(() => {
    const updateActiveUser = () => {
      const current = getCurrentUser();
      if (current) {
        const matches = current.matchesPlayed ?? 0;
        const wins = current.totalWins ?? 0;
        const kills = current.totalKills ?? 0;
        const winRate = matches > 0 ? ((wins / matches) * 100).toFixed(1) + '%' : '0%';
        setUser((prev: any) => ({
          ...prev,
          ...current,
          walletBalance: current.walletBalance ?? 0,
          totalMatches: matches,
          totalKills: kills,
          totalWins: wins,
          winRate: winRate,
        }));
      }
    };

    updateActiveUser();

    window.addEventListener('ff_users_updated', updateActiveUser);
    window.addEventListener('storage', updateActiveUser);
    return () => {
      window.removeEventListener('ff_users_updated', updateActiveUser);
      window.removeEventListener('storage', updateActiveUser);
    };
  }, []);

  const matchHistory: any[] = user?.matchHistory || [];

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert('Image size should be under 8 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (user?.id) {
        const updated = updateUser(user.id, { avatar: base64 });
        if (updated) {
          setUser((prev: any) => ({ ...prev, avatar: base64 }));
        }
      } else {
        setUser((prev: any) => ({ ...prev, avatar: base64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Player Header Card */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-card p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          {/* Avatar with Camera badge */}
          <div className="relative group flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl border-2 border-red-500/30 overflow-hidden bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20 text-3xl font-black">
              {user.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user.ign ? user.ign[0] : 'P'
              )}
            </div>
            <label
              htmlFor="profile-avatar-upload"
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-md cursor-pointer border-2 border-white dark:border-gray-900 transition-transform active:scale-90"
              title="Change Profile Picture (Gallery / Files)"
            >
              <Camera className="w-4 h-4" />
            </label>
            <input
              id="profile-avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileUpload}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">{user.username || user.ign}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Verified Player
              </span>
            </div>
            {user.email && (
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center sm:justify-start gap-1">
                <Mail className="w-3.5 h-3.5" /> {user.email}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center sm:justify-start gap-1 font-mono">
              <Hash className="w-3.5 h-3.5" /> UID: {user.uid}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center sm:justify-start gap-1">
              <Phone className="w-3.5 h-3.5" /> {user.phone}
            </p>
          </div>
        </div>

        {/* Balance Card Tile */}
        <div className="w-full sm:w-auto p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-center sm:text-right space-y-2">
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
            Wallet Balance
          </span>
          <div className="text-3xl font-black text-red-600 dark:text-red-400">
            ৳ {Number(user.walletBalance ?? 0).toFixed(2)}
          </div>
          <div className="flex gap-2 justify-center sm:justify-end pt-1 flex-wrap">
            <button
              onClick={() => {
                setFinanceModalTab('DEPOSIT');
                setShowFinanceModal(true);
              }}
              className="px-3 py-1.5 rounded-lg btn-red text-[11px] font-bold flex items-center gap-1 shadow-sm"
            >
              <ArrowDownRight className="w-3.5 h-3.5" /> ডিপোজিট (Deposit)
            </button>
            <button
              onClick={() => {
                setFinanceModalTab('WITHDRAW');
                setShowFinanceModal(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-white" /> উইথড্র (Withdraw)
            </button>
            {user.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-black text-[11px] font-black flex items-center gap-1 shadow-sm hover:bg-amber-400"
              >
                👑 অ্যাডমিন প্যানেল
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Dedicated PayBot Connector Card (Visible exclusively to the 4 PayBot IDs and Admin) */}
      {(user?.id?.startsWith('u-paybot') ||
        user?.phone?.startsWith('0179900000') ||
        user?.role === 'ADMIN') && (
        <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 p-5 shadow-lg shadow-emerald-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  ⚡ PayBot অটো-পেমেন্ট ও মোবাইল কানেক্টর
                </h4>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  EXCLUSIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                বিকাশ/নগদ অটো-ডিপোজিট কানেক্ট করুন। কোনো আলাদা এসএমএস ফরওয়ার্ডার লাগবে না।
              </p>
            </div>
          </div>

          <Link
            href="/paybot-connect"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Smartphone className="w-4 h-4" />
            ফোনে কানেক্ট করুন
          </Link>
        </div>
      )}

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-card text-center space-y-1 shadow-sm">
          <div className="text-xs text-gray-500 font-semibold uppercase">Matches</div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">{user.totalMatches ?? 0}</div>
        </div>
        <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-card text-center space-y-1 shadow-sm">
          <div className="text-xs text-gray-500 font-semibold uppercase">Total Wins</div>
          <div className="text-2xl font-black text-amber-500">{user.totalWins ?? 0}</div>
        </div>
        <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-card text-center space-y-1 shadow-sm">
          <div className="text-xs text-gray-500 font-semibold uppercase">Total Kills</div>
          <div className="text-2xl font-black text-red-600">{user.totalKills ?? 0}</div>
        </div>
        <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-card text-center space-y-1 shadow-sm">
          <div className="text-xs text-gray-500 font-semibold uppercase">Win Rate</div>
          <div className="text-2xl font-black text-emerald-600">{user.winRate || '0%'}</div>
        </div>
      </div>

      {/* Device Notification Preference Card */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-card p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
              ডিভাইস নোটিফিকেশন (Push Notifications)
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                notifEnabled
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'
              }`}>
                {notifEnabled ? 'চালু (ON)' : 'বন্ধ (OFF)'}
              </span>
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              রুম আইডি, পাসওয়ার্ড ও প্রাইজ মানি উইথড্রলের তাৎক্ষণিক নোটিফিকেশন অ্যালার্ট।
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleNotifications}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            notifEnabled
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
              : 'bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300'
          }`}
        >
          {notifEnabled ? 'নোটিফিকেশন বন্ধ করুন' : 'নোটিফিকেশন চালু করুন'}
        </button>
      </div>

      {/* Recent Tournaments History */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-card p-6 space-y-4 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Trophy className="w-4 h-4 text-red-600" /> Recent Tournament Matches & Earnings
        </h3>

        <div className="divide-y divide-gray-100 dark:divide-white/5">
          {matchHistory.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500 font-medium">
              এখনো কোনো টুর্নামেন্ট খেলা হয়নি
            </div>
          ) : (
            matchHistory.map((h) => (
              <div key={h.id} className="py-3 flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-gray-900 dark:text-white">{h.title || h.matchTitle}</div>
                  <div className="text-gray-500 text-[11px] flex items-center gap-2">
                    <span>{h.date}</span>
                    <span>•</span>
                    <span>{h.kills ?? 0} Kills</span>
                    <span>•</span>
                    <span className="font-bold text-amber-500">#{h.rank ?? '-'}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                    {(h.winnings || h.prizeEarned) > 0 ? `+৳ ${h.winnings || h.prizeEarned}` : '৳ 0.00'}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      (h.winnings || h.prizeEarned || 0) > 0 || h.isBooyah
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {(h.winnings || h.prizeEarned || 0) > 0 || h.isBooyah ? 'Won' : 'Played'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showFinanceModal && (
        <DepositWithdrawModal
          isOpen={showFinanceModal}
          initialTab={financeModalTab}
          onClose={() => setShowFinanceModal(false)}
        />
      )}
    </div>
  );
}
