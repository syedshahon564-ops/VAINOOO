'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Flame,
  Award,
  Crosshair,
  DollarSign,
  Gamepad2,
  Medal,
  ArrowLeft,
  Search,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { useCMS } from '@/lib/cms-store';
import { useLanguage } from '@/components/LanguageProvider';
import PlayerDetailsModal, { PlayerDetailsData } from '@/components/PlayerDetailsModal';

export default function LeaderboardPage() {
  const { topPlayers, settings } = useCMS();
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'monthly' | 'weekly'>('all');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerDetailsData | null>(null);

  const filteredPlayers = topPlayers.filter(
    (p) =>
      p.ign.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.uid.includes(searchQuery)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Link href="/" className="hover:text-red-600 transition-colors">
              হোম
            </Link>
            <span>/</span>
            <span className="text-amber-500 font-bold">টপ প্লেয়ার লিডারবোর্ড</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
            <Trophy className="w-8 h-8 text-amber-500" />
            {settings.siteName} - শীর্ষ প্লেয়ারদের তালিকা (Top Players)
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            কে কয়টা কিল করেছে, কে কত টাকা আয় করেছে এবং কে কয়টা ম্যাচ খেলেছে তার লাইভ ফলাফল।
          </p>
        </div>

        <Link
          href="/mobile-app-view"
          className="px-4 py-2.5 rounded-xl text-xs font-bold btn-red flex items-center gap-1.5 shadow-md shadow-red-600/30"
        >
          📱 মোবাইল অ্যাপে দেখুন
        </Link>
      </div>

      {/* TOP 3 PODIUM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {/* Rank 2 */}
        {topPlayers[1] && (
          <div className="order-2 md:order-1 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 text-center space-y-3 relative shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white font-black text-sm mx-auto flex items-center justify-center shadow-md">
              2nd
            </div>
            <div className="w-20 h-20 rounded-full mx-auto overflow-hidden border-4 border-slate-300 dark:border-slate-600 shadow-xl">
              <img src={topPlayers[1].avatar} alt={topPlayers[1].ign} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">{topPlayers[1].ign}</h3>
              <span className="text-xs text-gray-500 font-mono">UID: {topPlayers[1].uid}</span>
            </div>
            <div className="grid grid-cols-3 gap-1 py-2 rounded-xl bg-gray-50 dark:bg-white/5 text-[11px]">
              <div>
                <span className="text-gray-400 block text-[9px] uppercase font-bold">মোট কিল</span>
                <span className="font-black text-red-600">{topPlayers[1].kills}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[9px] uppercase font-bold">মোট আয়</span>
                <span className="font-black text-emerald-600">৳{topPlayers[1].earnings}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[9px] uppercase font-bold">ম্যাচ</span>
                <span className="font-black text-blue-500">{topPlayers[1].matchesPlayed}</span>
              </div>
            </div>
          </div>
        )}

        {/* Rank 1 (Champion) */}
        {topPlayers[0] && (
          <div className="order-1 md:order-2 rounded-2xl border-2 border-amber-500 bg-gradient-to-b from-amber-500/10 via-white to-white dark:via-[#141420] dark:to-[#12121a] p-6 sm:p-8 text-center space-y-4 relative shadow-xl transform md:-translate-y-4">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500 text-black font-black text-xs shadow-md shadow-amber-500/30 uppercase tracking-wider">
              👑 Champion #1
            </div>
            <div className="w-24 h-24 rounded-full mx-auto overflow-hidden border-4 border-amber-400 shadow-2xl relative">
              <img src={topPlayers[0].avatar} alt={topPlayers[0].ign} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center justify-center gap-1.5">
                {topPlayers[0].ign}
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              </h3>
              <span className="text-xs text-gray-500 font-mono">UID: {topPlayers[0].uid}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
              <div>
                <span className="text-amber-800 dark:text-amber-300 block text-[10px] uppercase font-bold">মোট কিল</span>
                <span className="text-base font-black text-red-600">{topPlayers[0].kills}</span>
              </div>
              <div>
                <span className="text-amber-800 dark:text-amber-300 block text-[10px] uppercase font-bold">মোট আয়</span>
                <span className="text-base font-black text-emerald-600">৳{topPlayers[0].earnings}</span>
              </div>
              <div>
                <span className="text-amber-800 dark:text-amber-300 block text-[10px] uppercase font-bold">ম্যাচ খেলা</span>
                <span className="text-base font-black text-blue-600">{topPlayers[0].matchesPlayed}</span>
              </div>
            </div>
          </div>
        )}

        {/* Rank 3 */}
        {topPlayers[2] && (
          <div className="order-3 md:order-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 text-center space-y-3 relative shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-full bg-amber-700/30 text-amber-600 font-black text-sm mx-auto flex items-center justify-center shadow-md">
              3rd
            </div>
            <div className="w-20 h-20 rounded-full mx-auto overflow-hidden border-4 border-amber-700/40 shadow-xl">
              <img src={topPlayers[2].avatar} alt={topPlayers[2].ign} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">{topPlayers[2].ign}</h3>
              <span className="text-xs text-gray-500 font-mono">UID: {topPlayers[2].uid}</span>
            </div>
            <div className="grid grid-cols-3 gap-1 py-2 rounded-xl bg-gray-50 dark:bg-white/5 text-[11px]">
              <div>
                <span className="text-gray-400 block text-[9px] uppercase font-bold">মোট কিল</span>
                <span className="font-black text-red-600">{topPlayers[2].kills}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[9px] uppercase font-bold">মোট আয়</span>
                <span className="font-black text-emerald-600">৳{topPlayers[2].earnings}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[9px] uppercase font-bold">ম্যাচ</span>
                <span className="font-black text-blue-500">{topPlayers[2].matchesPlayed}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SEARCH & FILTER */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#12121a] border border-gray-200 dark:border-white/10 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="প্লেয়ারের নাম বা UID খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'monthly', 'weekly'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeFilter(t)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all capitalize ${
                timeFilter === t
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'
              }`}
            >
              {t === 'all' ? 'সর্বকালের সেরা' : t === 'monthly' ? 'এই মাসের' : 'এই সপ্তাহের'}
            </button>
          ))}
        </div>
      </div>

      {/* FULL LEADERBOARD TABLE */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 dark:bg-black/40 border-b border-gray-200 dark:border-white/10 text-gray-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-4 text-center">র‍্যাংক</th>
              <th className="p-4">প্লেয়ারের নাম ও UID</th>
              <th className="p-4 text-center">মোট কিল (Kills)</th>
              <th className="p-4 text-center">মোট আয় (Earnings)</th>
              <th className="p-4 text-center">ম্যাচ খেলেছে</th>
              <th className="p-4 text-center">Booyah সংখ্যা</th>
              <th className="p-4 text-right">উইন রেট</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-700 dark:text-gray-300">
            {filteredPlayers.map((p) => (
              <tr
                key={p.id}
                onClick={() => setSelectedPlayer(p)}
                className="hover:bg-amber-500/5 dark:hover:bg-white/[0.04] cursor-pointer transition-all group"
                title={language === 'en' ? 'Click to view player details' : 'প্লেয়ার ডিটেইলস দেখতে ক্লিক করুন'}
              >
                <td className="p-4 text-center">
                  <span
                    className={`w-7 h-7 rounded-full inline-flex items-center justify-center font-black text-xs ${
                      p.rank === 1
                        ? 'bg-amber-400 text-black shadow-md'
                        : p.rank === 2
                        ? 'bg-slate-300 text-black'
                        : p.rank === 3
                        ? 'bg-amber-700/50 text-white'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    #{p.rank}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
                      <img src={p.avatar} alt={p.ign} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="font-black text-gray-900 dark:text-white block text-sm group-hover:text-amber-500 transition-colors flex items-center gap-1.5">
                        {p.ign}
                        <Eye className="w-3 h-3 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">UID: {p.uid}</span>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-center font-black text-red-600 text-sm">
                  {p.kills} Kills
                </td>
                <td className="p-4 text-center font-black text-emerald-600 text-sm">
                  ৳{p.earnings.toLocaleString()}
                </td>
                <td className="p-4 text-center font-bold text-gray-800 dark:text-gray-200">
                  {p.matchesPlayed} Matches
                </td>
                <td className="p-4 text-center font-black text-amber-500">
                  {p.booyahs} Booyahs
                </td>
                <td className="p-4 text-right font-black text-blue-500">
                  {p.winRate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RENDER BILINGUAL PLAYER DETAILS MODAL */}
      {selectedPlayer && (
        <PlayerDetailsModal
          player={selectedPlayer}
          language={language}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
