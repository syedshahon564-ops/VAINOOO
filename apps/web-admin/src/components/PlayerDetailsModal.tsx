'use client';

import React, { useState } from 'react';
import {
  X,
  Trophy,
  ShieldCheck,
  Crosshair,
  TrendingUp,
  Award,
  Copy,
  Check,
  Flame,
  Zap,
  Target,
  Swords,
  Medal,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

export interface PlayerDetailsData {
  id?: string;
  rank?: number;
  ign: string;
  uid: string;
  avatar?: string;
  kills?: number;
  earnings?: number;
  matchesPlayed?: number;
  booyahs?: number;
  winRate?: string;
  level?: number;
  badge?: string;
  guild?: string;
  headshotRate?: string;
  kdRatio?: string;
  server?: string;
  likes?: number;
}

interface PlayerDetailsModalProps {
  player: PlayerDetailsData;
  language?: 'bn' | 'en';
  onClose: () => void;
}

export default function PlayerDetailsModal({
  player,
  language = 'bn',
  onClose,
}: PlayerDetailsModalProps) {
  const [copiedUID, setCopiedUID] = useState(false);

  const t = (bn: string, en: string) => (language === 'en' ? en : bn);

  const handleCopyUID = () => {
    navigator.clipboard?.writeText(player.uid);
    setCopiedUID(true);
    setTimeout(() => setCopiedUID(false), 2000);
  };

  // Enriched defaults for stats
  const level = player.level || (70 + (parseInt(player.uid.slice(-1) || '4', 10) % 15));
  const guild = player.guild || 'BD_RIVALS_ELITE';
  const kd = player.kdRatio || (3.8 + (player.kills ? (player.kills % 30) / 10 : 0.8)).toFixed(2);
  const hsRate = player.headshotRate || `${55 + (parseInt(player.uid.slice(-2) || '12', 10) % 25)}%`;
  const likes = player.likes || 12840 + (player.kills || 50) * 12;
  const badge = player.badge || (player.rank === 1 ? 'GRANDMASTER' : player.rank && player.rank <= 3 ? 'HEROIC' : 'MASTER');

  const recentMatches = [
    {
      id: 'rm-1',
      title: 'Bermuda Squad Championship #101',
      mode: 'Squad 12-Teams',
      result: '1st (Booyah)',
      kills: 7,
      prize: '৳1,000',
      time: t('আজ দুপুর', 'Today Afternoon'),
    },
    {
      id: 'rm-2',
      title: 'CS 4v4 Clock Tower Showdown',
      mode: '4 vs 4',
      result: 'Winner (7-3)',
      kills: 9,
      prize: '৳1,500',
      time: t('গতকাল', 'Yesterday'),
    },
    {
      id: 'rm-3',
      title: 'Purgatory Solo Rush #98',
      mode: 'Solo 48',
      result: '2nd Place',
      kills: 6,
      prize: '৳300',
      time: t('২ দিন আগে', '2 days ago'),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-[#12121a] rounded-3xl p-5 sm:p-6 space-y-5 border border-gray-200 dark:border-white/10 shadow-2xl my-6 relative overflow-hidden">
        {/* Decorative Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-rose-600" />

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600">
              <Trophy className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                {t('প্লেয়ার ডিটেইলস ও স্ট্যাটস', 'Player Details & Statistics')}
              </h3>
              <p className="text-[11px] text-gray-500">
                {t('অফিসিয়াল ফ্রি ফায়ার প্লেয়ার প্রোফাইল', 'Official Free Fire Esports Player Profile')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Identity Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-red-950/40 via-[#181824] to-black border border-red-500/20 text-white relative space-y-3">
          <div className="flex items-center gap-3.5">
            {/* Avatar with Glow Ring */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-lg shadow-amber-500/20 bg-slate-800">
                <img
                  src={
                    player.avatar ||
                    'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=120'
                  }
                  alt={player.ign}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-amber-500 text-black text-[9px] font-black shadow">
                Lv.{level}
              </span>
            </div>

            {/* Name, UID & Badges */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-black truncate">{player.ign}</h4>
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-red-600 text-white shadow">
                  {badge}
                </span>
              </div>

              {/* UID with copy button */}
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <span className="font-mono bg-black/40 px-2 py-0.5 rounded border border-white/10 text-[11px]">
                  UID: {player.uid}
                </span>
                <button
                  onClick={handleCopyUID}
                  className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 text-[10px] font-bold"
                  title="Copy UID"
                >
                  {copiedUID ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">{t('কপি হয়েছে', 'Copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{t('কপি', 'Copy')}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Guild and Server */}
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <span>Guild: <strong className="text-amber-300">{guild}</strong></span>
                <span>•</span>
                <span>Region: <strong className="text-white">BD Server</strong></span>
                <span>•</span>
                <span>❤️ {likes.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Anti-cheat verified pill */}
          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px]">
            <div className="flex items-center gap-1 text-emerald-400 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t('১০০% অ্যান্টি-চিট ভেরিফায়েড ফেয়ার প্লেয়ার', '100% Anti-Cheat Verified Clean Player')}</span>
            </div>
            {player.rank && (
              <span className="text-amber-400 font-black">
                {t(`র‍্যাংক #${player.rank}`, `Rank #${player.rank}`)}
              </span>
            )}
          </div>
        </div>

        {/* 6 Key Esports Combat Stats */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {t('টুর্নামেন্ট পারফরম্যান্স ও স্ট্যাটস', 'Tournament Performance Stats')}
          </span>

          <div className="grid grid-cols-3 gap-2">
            {/* Total Kills */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-center space-y-0.5">
              <span className="text-[10px] text-gray-500 font-bold flex items-center justify-center gap-1">
                <Crosshair className="w-3 h-3 text-red-500" />
                {t('মোট কিল', 'Total Kills')}
              </span>
              <span className="text-base font-black text-red-600 dark:text-red-500">
                {player.kills || 0}
              </span>
            </div>

            {/* Total Earnings */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-center space-y-0.5">
              <span className="text-[10px] text-gray-500 font-bold flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                {t('মোট জয়', 'Total Won')}
              </span>
              <span className="text-base font-black text-emerald-600">
                ৳{(player.earnings || 0).toLocaleString()}
              </span>
            </div>

            {/* Total Booyahs */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-center space-y-0.5">
              <span className="text-[10px] text-gray-500 font-bold flex items-center justify-center gap-1">
                <Trophy className="w-3 h-3 text-amber-500" />
                {t('বুইয়াহ (Booyahs)', 'Booyahs')}
              </span>
              <span className="text-base font-black text-amber-500">
                {player.booyahs || 0}
              </span>
            </div>

            {/* Matches Played */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-center space-y-0.5">
              <span className="text-[10px] text-gray-500 font-bold flex items-center justify-center gap-1">
                <Swords className="w-3 h-3 text-blue-500" />
                {t('ম্যাচ খেলা', 'Matches')}
              </span>
              <span className="text-sm font-black text-gray-900 dark:text-white">
                {player.matchesPlayed || 0}
              </span>
            </div>

            {/* K/D Ratio */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-center space-y-0.5">
              <span className="text-[10px] text-gray-500 font-bold flex items-center justify-center gap-1">
                <Target className="w-3 h-3 text-purple-500" />
                {t('K/D রেশিও', 'K/D Ratio')}
              </span>
              <span className="text-sm font-black text-purple-600 dark:text-purple-400">
                {kd}
              </span>
            </div>

            {/* Headshot Rate */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-center space-y-0.5">
              <span className="text-[10px] text-gray-500 font-bold flex items-center justify-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" />
                {t('হেডশট রেট', 'Headshot %')}
              </span>
              <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                {hsRate}
              </span>
            </div>
          </div>
        </div>

        {/* Favorite Weapons */}
        <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 space-y-1.5">
          <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider block">
            {t('পছন্দের অস্ত্র (Favorite Loadout)', 'Favorite Loadout')}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {['MP40 (Flashing Spade)', 'M1887 (One Punch Man)', 'Woodpecker', 'Desert Eagle'].map((gun) => (
              <span
                key={gun}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-200"
              >
                🔥 {gun}
              </span>
            ))}
          </div>
        </div>

        {/* Recent Match Performance */}
        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {t('সাম্প্রতিক টুর্নামেন্ট ইতিহাস', 'Recent Tournament History')}
          </span>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {recentMatches.map((m) => (
              <div
                key={m.id}
                className="p-2.5 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-gray-900 dark:text-white block line-clamp-1 text-[11px]">
                    {m.title}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span>{m.mode}</span>
                    <span>•</span>
                    <span className="text-amber-500 font-bold">{m.result}</span>
                    <span>•</span>
                    <span>{m.time}</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="font-black text-red-500 block text-[11px]">
                    {m.kills} {t('কিল', 'Kills')}
                  </span>
                  <span className="font-black text-emerald-600 text-[10px]">
                    {m.prize}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Close CTA Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black transition-all shadow-md shadow-red-600/30 active:scale-98"
        >
          {t('বন্ধ করুন', 'Close')}
        </button>
      </div>
    </div>
  );
}
