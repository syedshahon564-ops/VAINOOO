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
} from 'lucide-react';
import { MatchItem } from '@/lib/cms-store';
import { parseScheduleTimeToDate } from '@/components/LiveMatchCountdown';

interface RoomDetailsModalProps {
  match: MatchItem;
  onClose: () => void;
  onJoinClick: () => void;
}

export default function RoomDetailsModal({ match, onClose, onJoinClick }: RoomDetailsModalProps) {
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
              কাস্টম রুম আইডি ও পাসওয়ার্ড ম্যাচ শুরুর ঠিক <strong>৫ মিনিট আগে</strong> স্বয়ংক্রিয়ভাবে প্রকাশ পাবে।
            </span>
          </div>

          {(() => {
            const matchDate = parseScheduleTimeToDate(match.time, (match as any)?.startTimeIso);
            const diffMs = matchDate ? matchDate.getTime() - Date.now() : 999999;
            const isWithin5Min = (diffMs <= 5 * 60 * 1000 && diffMs >= -180 * 60 * 1000) || match.status === 'ROOM_OPEN' || match.status === 'LIVE';
            const showCredentials = Boolean(match.roomId && isWithin5Min);

            if (showCredentials) {
              return (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-black/50 border border-emerald-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-gray-400 block">Room ID</span>
                      <span className="font-mono font-black text-emerald-600 text-sm">{match.roomId}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(match.roomId!, 'id')}
                      className="p-1 text-gray-400 hover:text-emerald-500"
                    >
                      {copied === 'id' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-black/50 border border-emerald-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-gray-400 block">Password</span>
                      <span className="font-mono font-black text-emerald-600 text-sm">{match.roomPass || '1234'}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(match.roomPass || '1234', 'pass')}
                      className="p-1 text-gray-400 hover:text-emerald-500"
                    >
                      {copied === 'pass' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 text-center space-y-1">
                <span className="text-xs font-black text-red-600 block">
                  🔒 রুম খোলার ৫ মিনিট আগে এখানে রুম আইডি ও পাসওয়ার্ড দেওয়া হবে।
                </span>
                <span className="text-[10px] text-gray-500 block">
                  ম্যাচ শুরু হওয়ার ৫ মিনিট পূর্বে স্বয়ংক্রিয়ভাবে আইডি ও পাসওয়ার্ড চলে আসবে।
                </span>
              </div>
            );
          })()}
        </div>

        {/* Specific Rules for this match */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-gray-900 dark:text-white">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            এই রুমের নির্দিষ্ট নিয়ম ও বিধিনিষেধ (Room Rules)
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/5 text-xs text-gray-700 dark:text-gray-300 space-y-2 whitespace-pre-line leading-relaxed font-medium">
            {match.rules ||
              `১. গান প্রোপার্টি অফ, ক্যারেক্টার স্কিল অন, লিমিটেড অ্যামো ইয়েস।
২. আপনার বুক করা নির্দিষ্ট স্লটেই বসতে হবে, অন্য স্লটে বসলে কিক করা হবে।
৩. কোনো প্রকার হ্যাক, কনফিগ বা স্ক্রিপ্ট ব্যবহার সম্পূর্ণ নিষিদ্ধ।
৪. টিম-আপ (Friendly Teaming) করলে কোনো প্রাইজমানি দেওয়া হবে না।`}
          </div>
        </div>

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
            className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-200"
          >
            বন্ধ করুন
          </button>
          <button
            onClick={() => {
              onClose();
              onJoinClick();
            }}
            className="px-6 py-2.5 rounded-xl btn-red text-xs font-black shadow-lg shadow-red-600/30"
          >
            স্লট বুক করুন (৳{match.entryFee})
          </button>
        </div>
      </div>
    </div>
  );
}
