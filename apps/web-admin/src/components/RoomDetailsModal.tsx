'use client';

import React from 'react';
import {
  X,
  ShieldAlert,
  Clock,
  MapPin,
  Trophy,
  Users,
  Key,
  CheckCircle,
  Copy,
  AlertTriangle,
  Flame,
  Lock,
} from 'lucide-react';
import { MatchItem, useCMS, getEffectiveMatchRules } from '@/lib/cms-store';
import { parseScheduleTimeToDate } from '@/components/LiveMatchCountdown';
import { getCurrentUser, hasUserJoinedMatch } from '@/lib/user-store';

interface RoomDetailsModalProps {
  match: MatchItem;
  onClose: () => void;
  onJoinClick: () => void;
}

export default function RoomDetailsModal({ match, onClose, onJoinClick }: RoomDetailsModalProps) {
  const { categories, settings } = useCMS();
  const [copied, setCopied] = React.useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-white dark:bg-[#14141c] rounded-3xl p-6 sm:p-8 space-y-6 border border-gray-200 dark:border-white/10 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-gray-200 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-600 uppercase">
                {match.type} • {match.map}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                Official Room Details
              </span>
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white">
              {match.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-center">
          <div>
            <span className="text-[10px] text-gray-500 block uppercase font-bold">এন্ট্রি ফি</span>
            <span className="text-sm font-black text-red-600">৳{match.entryFee}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 block uppercase font-bold">মোট প্রাইজ</span>
            <span className="text-sm font-black text-emerald-600">৳{match.prizePool}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 block uppercase font-bold">পার কিল</span>
            <span className="text-sm font-black text-blue-500">৳{match.perKill}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 block uppercase font-bold">স্লট সংখ্যা</span>
            <span className="text-sm font-black text-amber-500">{match.totalSlots} Slots</span>
          </div>
        </div>

        {/* Room Timing & Release Countdown */}
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-300 font-bold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-red-600" /> ম্যাচ শুরু হওয়ার সময়:
            </span>
            <span className="font-black text-red-600 text-sm">{match.time}</span>
          </div>

          <div className="text-[11px] text-gray-600 dark:text-gray-300 flex items-center gap-1.5 pt-1 border-t border-red-200/60 dark:border-red-900/30">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>
              কাস্টম রুম আইডি ও পাসওয়ার্ড অ্যাডমিন দেওয়ার পর ম্যাচ শুরুর ঠিক <strong>৫ মিনিট আগে</strong> প্রকাশ পাবে।
            </span>
          </div>

          {(() => {
            const currentUser = typeof window !== 'undefined' ? getCurrentUser() : null;
            const userJoined = Boolean(currentUser && hasUserJoinedMatch(match.id, currentUser));
            const matchDate = parseScheduleTimeToDate(match.time, (match as any)?.startTimeIso);
            const now = Date.now();
            const diffMs = matchDate ? matchDate.getTime() - now : 999999;

            // Check delivery time and 8-minute expiry window
            const deliveredIso = (match as any)?.roomDeliveredAt || (match as any)?.deliveredAt;
            let deliveredMs: number | null = null;
            if (deliveredIso) {
              const parsed = new Date(deliveredIso).getTime();
              if (!isNaN(parsed)) deliveredMs = parsed;
            } else if (matchDate && (match.status === 'ROOM_OPEN' || (match.roomId && diffMs <= 5 * 60 * 1000))) {
              deliveredMs = Math.min(matchDate.getTime() - 5 * 60 * 1000, now);
            }

            const EIGHT_MIN_MS = 8 * 60 * 1000;
            const isExpired8Min = Boolean(deliveredMs && (now - deliveredMs >= EIGHT_MIN_MS));
            const remainingSeconds = deliveredMs ? Math.max(0, Math.floor((deliveredMs + EIGHT_MIN_MS - now) / 1000)) : null;

            const isWithin5Min = (diffMs <= 5 * 60 * 1000 && diffMs >= -180 * 60 * 1000) || match.status === 'ROOM_OPEN';
            const hasValidRoomId = Boolean(match.roomId && match.roomId.trim().length > 0);
            const showCredentials = Boolean(userJoined && hasValidRoomId && isWithin5Min && !isExpired8Min);

            if (isExpired8Min && userJoined) {
              return (
                <div className="p-3.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-center space-y-1">
                  <span className="text-xs font-black text-gray-700 dark:text-gray-300 block flex items-center justify-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-500" /> রুম আইডি ও পাসওয়ার্ডের মেয়াদ শেষ
                  </span>
                  <p className="text-[11px] text-gray-500">
                    রুম পাসওয়ার্ড প্রকাশের ৮ মিনিট পার হওয়ায় রুমটি স্বয়ংক্রিয়ভাবে বন্ধ হয়ে গেছে এবং ম্যাচটি শুরু হয়ে গেছে।
                  </p>
                </div>
              );
            }

            if (showCredentials) {
              const formatRemaining = (sec: number) => {
                const m = Math.floor(sec / 60);
                const s = sec % 60;
                return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
              };

              return (
                <div className="pt-1 space-y-2">
                  {remainingSeconds !== null && (
                    <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between text-xs font-bold text-red-600">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 animate-pulse text-red-600" />
                        পাসওয়ার্ডের মেয়াদ বাকি:
                      </span>
                      <span className="font-mono font-black bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded border border-red-300">
                        ⏱️ {formatRemaining(remainingSeconds)}
                      </span>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-white dark:bg-black/50 border border-emerald-500/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-gray-500 font-bold block uppercase">Custom Room ID</span>
                        <span className="font-mono font-black text-emerald-600 text-base">{match.roomId}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(match.roomId!, 'id')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1 shadow-xs transition-colors"
                      >
                        {copied === 'id' ? <CheckCircle className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                        <span>{copied === 'id' ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                      </button>
                    </div>

                    {match.roomPass && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/10">
                        <div>
                          <span className="text-[10px] text-gray-500 font-bold block uppercase">Room Password</span>
                          <span className="font-mono font-black text-emerald-600 text-base">{match.roomPass}</span>
                        </div>
                        <button
                          onClick={() => handleCopy(match.roomPass!, 'pass')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1 shadow-xs transition-colors"
                        >
                          {copied === 'pass' ? <CheckCircle className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                          <span>{copied === 'pass' ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 text-center font-medium">
                    ⚠️ রুম পাসওয়ার্ড দেওয়ার ৮ মিনিট পর রুম ক্লোজ হয়ে যাবে।
                  </p>
                </div>
              );
            }

            if (userJoined) {
              return (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 text-center space-y-1">
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 block flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> আপনি এই ম্যাচে সফলভাবে জয়েন করেছেন!
                  </span>
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block">
                    {hasValidRoomId
                      ? 'ম্যাচ শুরু হওয়ার ৫ মিনিট পূর্বে এখানে ও "My Matches" ট্যাবে রুম আইডি পাবেন।'
                      : '⚠️ রুম আইডি ও পাসওয়ার্ড এখনও দেওয়া হয়নি (অ্যাডমিন দেওয়ার পর এখানে প্রদর্শিত হবে)'}
                  </span>
                </div>
              );
            }

            return (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 text-center space-y-1">
                <span className="text-xs font-black text-red-600 block flex items-center justify-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> রুম আইডি কেবল জয়েনকৃত প্লেয়ারদের জন্য সংরক্ষিত
                </span>
                <span className="text-[10px] text-gray-500 block">
                  ম্যাচে বুকিং সম্পন্ন করার পর ম্যাচ শুরুর ৫ মিনিট আগে রুম আইডি স্বয়ংক্রিয়ভাবে উন্মুক্ত হবে।
                </span>
              </div>
            );
          })()}
        </div>

        {/* Specific Rules for this match */}
        {(() => {
          const currentCategory = categories[match.categorySlug];
          const effectiveRule = getEffectiveMatchRules(match, categories, settings);
          if (!effectiveRule || effectiveRule.trim() === '') return null;

          return (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-gray-900 dark:text-white">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                {currentCategory?.name || match.categorySlug} ক্যাটাগরি ও রুমের নিয়মাবলী (Category Rules)
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-black/30 border border-amber-200 dark:border-white/5 text-xs text-gray-800 dark:text-gray-200 space-y-2 whitespace-pre-line leading-relaxed font-medium">
                {effectiveRule}
              </div>
            </div>
          );
        })()}

        {/* Prize Breakdown */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-amber-700 dark:text-amber-300 block">পুরস্কারের বিবরণ:</span>
            <span className="text-[11px] text-gray-600 dark:text-gray-400">
              ১ম: ৳{match.firstPrize || Math.round(match.prizePool * 0.6)} • ২য়: ৳{match.secondPrize || Math.round(match.prizePool * 0.25)} • ৩য়: ৳{match.thirdPrize || Math.round(match.prizePool * 0.15)}
            </span>
          </div>
          {match.perKill > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500 text-black font-black text-[10px]">
              +৳{match.perKill} প্রতি কিলে
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 transition-colors"
          >
            বন্ধ করুন
          </button>
          {(() => {
            const currentUser = typeof window !== 'undefined' ? getCurrentUser() : null;
            const userJoined = Boolean(currentUser && hasUserJoinedMatch(match.id, currentUser));
            const isMatchClosed =
              match.status === 'LIVE' ||
              match.status === 'COMPLETED' ||
              (match.status as string) === 'MATCHING' ||
              (match.filledSlots || 0) >= (match.totalSlots || 48);

            if (userJoined) {
              return (
                <button
                  disabled
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black opacity-95 cursor-not-allowed flex items-center gap-1.5 shadow-md"
                >
                  <CheckCircle className="w-4 h-4" /> জয়েন করা হয়েছে
                </button>
              );
            }

            if (isMatchClosed) {
              return (
                <span className="px-5 py-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-black border border-red-500/20">
                  ম্যাচ চলমান / রেজিস্ট্রেশন বন্ধ
                </span>
              );
            }

            return (
              <button
                onClick={() => {
                  onClose();
                  onJoinClick();
                }}
                className="px-6 py-2.5 rounded-xl btn-red text-xs font-black shadow-lg shadow-red-600/30"
              >
                স্লট বুক করুন (৳{match.entryFee})
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
