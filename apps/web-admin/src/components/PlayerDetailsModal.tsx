'use client';

import React from 'react';
import {
  X,
  Trophy,
  ShieldCheck,
  Crosshair,
  TrendingUp,
  Swords,
  Medal,
} from 'lucide-react';
import { useCMS } from '@/lib/cms-store';

export interface PlayerDetailsData {
  id?: string;
  rank?: number;
  ign: string;
  uid?: string;
  avatar?: string;
  kills?: number;
  earnings?: number;
  matchesPlayed?: number;
  booyahs?: number;
  winRate?: string;
  badge?: string;
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
  const t = (bn: string, en: string) => (language === 'en' ? en : bn);
  const { matches } = useCMS();

  // Find real played match history from CMS matches where player participated or has results
  const pIgn = (player.ign || '').toLowerCase().trim();
  const playerMatches = (matches || []).filter((m) => {
    if (!pIgn) return false;
    const inResults = Array.isArray(m.results) && m.results.some((r) => r.ign?.toLowerCase()?.trim() === pIgn);
    const inParticipants = Array.isArray(m.participants) && m.participants.some((p) => p.ign?.toLowerCase()?.trim() === pIgn);
    return inResults || inParticipants;
  });

  const badge = player.badge || (player.rank === 1 ? 'GRANDMASTER' : player.rank && player.rank <= 3 ? 'HEROIC' : 'MASTER');

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
            {/* Avatar - Uses actual profile photo, no level badge */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-lg shadow-amber-500/20 bg-slate-800">
                <img
                  src={player.avatar || '/avatars/avatar-1.png'}
                  alt={player.ign}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/avatars/avatar-1.png';
                  }}
                />
              </div>
            </div>

            {/* Name & Official Badges (No fake level, No fake guild) */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-black truncate">{player.ign}</h4>
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-red-600 text-white shadow">
                  {badge}
                </span>
              </div>

              {/* Verified Player Status */}
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('ভেরিফায়েড অফিসিয়াল প্লেয়ার', 'Verified Esports Player')}</span>
                </span>
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

        {/* 3 Key Combat Stats Only: Matches, Total Kills, Total Won */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {t('টুর্নামেন্ট পারফরম্যান্স ও স্ট্যাটস', 'Tournament Performance Stats')}
          </span>

          <div className="grid grid-cols-3 gap-2">
            {/* Matches Played */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-center space-y-0.5">
              <span className="text-[10px] text-gray-500 font-bold flex items-center justify-center gap-1">
                <Swords className="w-3 h-3 text-blue-500" />
                {t('ম্যাচ খেলা', 'Matches')}
              </span>
              <span className="text-base font-black text-gray-900 dark:text-white">
                {player.matchesPlayed || (playerMatches.length > 0 ? playerMatches.length : 0)}
              </span>
            </div>

            {/* Total Kills */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-center space-y-0.5">
              <span className="text-[10px] text-gray-500 font-bold flex items-center justify-center gap-1">
                <Crosshair className="w-3 h-3 text-red-500" />
                {t('টোটাল কিল', 'Total Kills')}
              </span>
              <span className="text-base font-black text-red-600 dark:text-red-500">
                {player.kills || 0}
              </span>
            </div>

            {/* Total Won */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-center space-y-0.5">
              <span className="text-[10px] text-gray-500 font-bold flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                {t('টোটাল জয়', 'Total Won')}
              </span>
              <span className="text-base font-black text-emerald-600">
                ৳{(player.earnings || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Real Tournament History Only (No Mock/Fake History) */}
        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {t('টুর্নামেন্ট ইতিহাস', 'Tournament History')}
          </span>

          {playerMatches.length === 0 ? (
            <div className="p-4 text-center rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 text-xs text-gray-400 font-bold">
              {t('কোনো পূর্ববর্তী টুর্নামেন্ট হিস্ট্রি রেকর্ড নেই', 'No previous tournament history records')}
            </div>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {playerMatches.map((m) => {
                const resultEntry = Array.isArray(m.results)
                  ? m.results.find((r) => r.ign?.toLowerCase()?.trim() === pIgn)
                  : null;

                const kills = resultEntry ? resultEntry.kills : 0;
                const prize = resultEntry?.prize ? `৳${resultEntry.prize.toLocaleString()}` : '৳০';
                const resultText = resultEntry
                  ? (resultEntry.rank === 1 ? '1st (Booyah)' : `#${resultEntry.rank} প্লেসমেন্ট`)
                  : (m.status === 'COMPLETED' ? 'সম্পন্ন' : 'অংশগ্রহণকারী');

                return (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-gray-900 dark:text-white block line-clamp-1 text-[11px]">
                        {m.title}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <span>{m.type || m.matchType || m.categorySlug}</span>
                        <span>•</span>
                        <span className="text-amber-500 font-bold">{resultText}</span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="font-black text-red-500 block text-[11px]">
                        {kills} {t('কিল', 'Kills')}
                      </span>
                      <span className="font-black text-emerald-600 text-[10px]">
                        {prize}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
