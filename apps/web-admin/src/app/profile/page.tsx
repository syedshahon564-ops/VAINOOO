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
} from 'lucide-react';

import { getCurrentUser } from '@/lib/user-store';
import DepositWithdrawModal from '@/components/DepositWithdrawModal';

export default function ProfilePage() {
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [financeModalTab, setFinanceModalTab] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
  const [user, setUser] = useState<any>({
    ign: 'BDX_STRIKER',
    uid: '192837465',
    phone: '01712-345678',
    walletBalance: 1450.0,
    role: 'PLAYER',
    totalMatches: 34,
    totalWins: 12,
    totalKills: 89,
    winRate: '35.2%',
  });

  useEffect(() => {
    const updateActiveUser = () => {
      const current = getCurrentUser();
      if (current) {
        setUser((prev: any) => ({
          ...prev,
          ...current,
          totalMatches: current.matchesPlayed || prev.totalMatches,
          totalKills: current.totalKills || prev.totalKills,
          totalWins: current.totalWins || prev.totalWins,
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

  const history = [
    {
      id: 'm-1',
      title: 'Free Fire Bermuda Squad Championship #42',
      date: 'Yesterday 08:30 PM',
      rank: '#1 Booyah',
      kills: 8,
      winnings: 580,
      status: 'Won',
    },
    {
      id: 'm-2',
      title: 'Purgatory Solo Quick Rush #39',
      date: '02 Oct 2026',
      rank: '#2 Place',
      kills: 4,
      winnings: 240,
      status: 'Won',
    },
    {
      id: 'm-3',
      title: 'Clash Squad 4v4 War',
      date: '01 Oct 2026',
      rank: '#5 Place',
      kills: 2,
      winnings: 0,
      status: 'Lost',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Player Header Card */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-card p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20 text-3xl font-black">
            {user.ign ? user.ign[0] : 'P'}
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">{user.ign}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Verified Player
              </span>
            </div>
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
            ৳ {Number(user.walletBalance || 1450).toFixed(2)}
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

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-card text-center space-y-1 shadow-sm">
          <div className="text-xs text-gray-500 font-semibold uppercase">Matches</div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">{user.totalMatches || 34}</div>
        </div>
        <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-card text-center space-y-1 shadow-sm">
          <div className="text-xs text-gray-500 font-semibold uppercase">Total Wins</div>
          <div className="text-2xl font-black text-amber-500">{user.totalWins || 12}</div>
        </div>
        <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-card text-center space-y-1 shadow-sm">
          <div className="text-xs text-gray-500 font-semibold uppercase">Total Kills</div>
          <div className="text-2xl font-black text-red-600">{user.totalKills || 89}</div>
        </div>
        <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-card text-center space-y-1 shadow-sm">
          <div className="text-xs text-gray-500 font-semibold uppercase">Win Rate</div>
          <div className="text-2xl font-black text-emerald-600">{user.winRate || '35.2%'}</div>
        </div>
      </div>

      {/* Recent Tournaments History */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-card p-6 space-y-4 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Trophy className="w-4 h-4 text-red-600" /> Recent Tournament Matches & Earnings
        </h3>

        <div className="divide-y divide-gray-100 dark:divide-white/5">
          {history.map((h) => (
            <div key={h.id} className="py-3 flex items-center justify-between text-xs">
              <div className="space-y-1">
                <div className="font-bold text-gray-900 dark:text-white">{h.title}</div>
                <div className="text-gray-500 text-[11px] flex items-center gap-2">
                  <span>{h.date}</span>
                  <span>•</span>
                  <span>{h.kills} Kills</span>
                  <span>•</span>
                  <span className="font-bold text-amber-500">{h.rank}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                  {h.winnings > 0 ? `+৳ ${h.winnings}` : '৳ 0.00'}
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    h.status === 'Won'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {h.status}
                </span>
              </div>
            </div>
          ))}
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
