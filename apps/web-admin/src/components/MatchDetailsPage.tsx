'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Play,
  HelpCircle,
  X,
  ShieldAlert,
  Check,
  AlertTriangle,
  Flame,
  Key,
  Users,
} from 'lucide-react';
import { MatchItem, useCMS, getEffectiveMatchRules } from '@/lib/cms-store';
import { formatMatchSchedule } from '@/components/LiveMatchCountdown';
import { getCurrentUser, hasUserJoinedMatch } from '@/lib/user-store';

export type ParticipantItem =
  | string
  | {
      ign: string;
      uid?: string;
      slot?: number;
      team?: number;
    };

interface MatchDetailsPageProps {
  match: MatchItem;
  participants?: ParticipantItem[];
  onBack: () => void;
  onJoinClick: (match: MatchItem) => void;
  language?: 'bn' | 'en';
  isPhoneView?: boolean;
}

export default function MatchDetailsPage({
  match,
  participants = [],
  onBack,
  onJoinClick,
  language = 'bn',
  isPhoneView = false,
}: MatchDetailsPageProps) {
  const { settings, categories } = useCMS();
  const [showVideoModal, setShowVideoModal] = useState(false);

  const activeParticipants = React.useMemo(() => {
    const list: ParticipantItem[] = [];
    const seen = new Set<string>();

    if (match.participants && match.participants.length > 0) {
      match.participants.forEach((p) => {
        const key = `${p.ign}-${p.slot || 0}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push(p);
        }
      });
    }

    if (participants && participants.length > 0) {
      participants.forEach((p) => {
        const ign = typeof p === 'string' ? p : p.ign;
        const slot = typeof p === 'object' ? p.slot || 0 : 0;
        const key = `${ign}-${slot}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push(p);
        }
      });
    }

    return list;
  }, [match.participants, participants]);

  return (
    <div
      className={`min-h-full bg-white text-gray-900 ${
        isPhoneView ? 'p-4 pb-20' : 'max-w-3xl mx-auto p-6 pb-24'
      } space-y-4`}
    >
      {/* 1. Header with Back Arrow and 'Details Page' (Exact Screenshot 4) */}
      <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
        <button
          onClick={onBack}
          className="p-1 rounded-lg hover:bg-gray-100 text-gray-800 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-black text-gray-900">
          Details Page
        </h2>
      </div>

      {/* 2. Top Notice Banner (Dynamic from Admin Rules) */}
      {(() => {
        const currentCategory = categories[match.categorySlug];
        const effectiveNotice =
          (match.rules && match.rules.trim()) ||
          (currentCategory?.customRules && currentCategory.customRules.trim()) ||
          (settings.categoryRules?.[match.categorySlug] && settings.categoryRules[match.categorySlug].trim()) ||
          (match.categorySlug === 'classic-match' && settings.categoryRules?.['regular-match'] && settings.categoryRules['regular-match'].trim()) ||
          (settings.defaultRules && settings.defaultRules.trim()) ||
          '';

        if (!effectiveNotice) return null;

        return (
          <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug whitespace-pre-line">
              {effectiveNotice}
            </h3>
          </div>
        );
      })()}

      {/* 3. Badge Pills Grid (Exact Screenshot 4) */}
      <div className="space-y-2 pt-1">
        {/* Row 1: Type | Version | Map */}
        <div className="flex flex-wrap gap-2 text-xs font-bold text-gray-700">
          <div className="px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50">
            Type: <span className="font-black text-gray-900">{match.type || 'Solo'}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50">
            Version: <span className="font-black text-gray-900">TPP</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50">
            Map: <span className="font-black text-gray-900">{match.map || 'Bermuda'}</span>
          </div>
        </div>

        {/* Row 2: Match Type | Entry fee */}
        <div className="flex flex-wrap gap-2 text-xs font-bold text-gray-700">
          <div className="px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50">
            Match Type: <span className="font-black text-emerald-600">Paid</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50">
            Entry fee: <span className="font-black text-gray-900">{match.entryFee} TK</span>
          </div>
        </div>

        {/* Row 3: Match Schedule */}
        <div className="flex flex-wrap gap-2 text-xs font-bold text-gray-700">
          <div className="px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50">
            Match Schedule:{' '}
            <span className="font-black text-gray-900">
              {formatMatchSchedule(match.time)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Prize Details (Exact Screenshot 4) */}
      <div className="space-y-2 pt-2">
        <h4 className="text-sm font-black text-gray-900">
          Prize Details
        </h4>
        <div className="flex flex-wrap gap-3">
          <div className="px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold text-gray-700">
            Winning Prize:{' '}
            <span className="font-black text-gray-900">
              {match.firstPrize || match.prizePool || 170} TK
            </span>
          </div>
          {match.categorySlug === 'lone-wolf' ||
          match.categorySlug === 'clash-squad' ||
          match.categorySlug === 'cs-only-headshot' ||
          match.type === '1 vs 1' ||
          match.type === '2 vs 2' ||
          match.type === '4 vs 4' ||
          !match.perKill ? (
            <div className="px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold text-gray-700">
              Format:{' '}
              <span className="font-black text-gray-900">
                {match.type} ({match.totalSlots} Slots)
              </span>
            </div>
          ) : (
            <div className="px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold text-gray-700">
              Per Kill:{' '}
              <span className="font-black text-gray-900">
                {match.perKill || 0} TK
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 5. Orange Dashed Box: Room ID & Password Notice (Exact Screenshot 4) */}
      <div className="p-3.5 rounded-xl border-2 border-dashed border-amber-500 bg-amber-50 text-amber-900 text-center font-bold text-xs leading-snug">
        ম্যাচ শুরু হওয়ার সময়ের ২ থেকে ৪ মিনিট আগে কাস্টমের আইডি পাসওয়ার্ড পাবেন Room Details Button এ
      </div>

      {/* 6. Dotted Line Separator (Exact Screenshot 4) */}
      <div className="border-b border-dotted border-gray-300 pt-1" />

      {/* 7. Match Instructions and Rules Section Header (Exact Screenshot 4) */}
      <div className="space-y-3 pt-1">
        <h4 className="text-sm font-black text-gray-900">
          Match Instructions and Rules
        </h4>

        {/* Black Pill Video Button (Exact Screenshot 4) */}
        <button
          onClick={() => setShowVideoModal(true)}
          className="w-full py-3 px-4 rounded-full bg-black text-white hover:bg-gray-800 transition-all shadow-md flex items-center justify-center gap-2 text-xs font-black tracking-wide"
        >
          <span>সঠিক নিয়ম জানতে ভিডিও দেখুন এখানে ক্লিক করে</span>
          <span className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center text-[10px] pl-0.5">
            ▶
          </span>
        </button>
      </div>

      {/* 8. Category & Match Specific Dynamic Rules (from Admin CMS) */}
      {(() => {
        const currentCategory = categories[match.categorySlug];
        const categoryRule = getEffectiveMatchRules(match, categories, settings);

        if (!categoryRule || categoryRule.trim() === '') return null;

        return (
          <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 space-y-2 mb-3">
            <h5 className="text-xs font-black text-amber-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>🏆 {currentCategory?.name || match.categorySlug} ক্যাটাগরির নির্ধারিত টুর্নামেন্ট রুলস:</span>
            </h5>
            <div className="text-xs whitespace-pre-line text-gray-900 font-mono leading-relaxed bg-white/80 p-3.5 rounded-xl border border-amber-200">
              {categoryRule}
            </div>
          </div>
        );
      })()}

      {/* 9. ROOM RULES & REGISTERED PARTICIPANTS (Pure White Container) */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
          <Key className="w-4 h-4 text-red-600" />
          <h4 className="text-sm font-black text-gray-900">
            কাস্টম রুম রুলস ও রেজিস্টার্ড প্লেয়ার তালিকা (Room Rules & Participants)
          </h4>
        </div>


        {/* Separator */}
        <div className="border-t border-dashed border-gray-200 pt-3 text-center">
          <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center justify-center gap-1.5">
            <Users className="w-4 h-4 text-blue-600" />
            REGISTERED PARTICIPANTS ({activeParticipants.length}/{match.totalSlots})
          </h4>
        </div>

        {/* Numbered Participants with UID & IGN */}
        {activeParticipants.length === 0 ? (
          <div className="py-8 px-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/60 text-center space-y-1.5">
            <Users className="w-8 h-8 mx-auto text-gray-400 opacity-60" />
            <p className="text-xs font-bold text-gray-800">
              এখনো কোনো প্লেয়ার রেজিস্ট্রেশন করেনি
            </p>
            <p className="text-[11px] text-gray-500">
              ম্যাচে অংশ নিতে নিচের &quot;Join Now / স্লট বুক করুন&quot; বাটনে ক্লিক করে আপনার নাম যুক্ত করুন।
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {activeParticipants.map((item, idx) => {
              const ign = typeof item === 'string' ? item : item.ign;
              const uid = typeof item === 'object' && item.uid && item.uid !== '---' ? item.uid : null;
              const slotNum = typeof item === 'object' && item.slot ? item.slot : idx + 1;
              const teamNum = typeof item === 'object' && item.team ? item.team : null;

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold transition-all hover:bg-gray-100/70"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-red-100 text-red-600 font-black text-xs flex items-center justify-center font-mono">
                      #{slotNum}
                    </span>
                    <div>
                      <span className="font-black text-gray-900 text-xs block">
                        {ign}
                      </span>
                      {uid && (
                        <span className="text-[10px] text-gray-500 font-mono block">
                          UID: {uid}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {teamNum && (
                      <span className="text-[10px] font-bold text-gray-600 bg-gray-200/80 px-2 py-0.5 rounded-md">
                        Team #{teamNum}
                      </span>
                    )}
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase">
                      Confirmed
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Sticky Join Button */}
      <div className="pt-4 border-t border-gray-200">
        {(() => {
          const isJoined =
            hasUserJoinedMatch(match.id, getCurrentUser()) ||
            activeParticipants.some(
              (p) =>
                typeof p !== 'string' &&
                ((getCurrentUser()?.ign &&
                  p.ign.toLowerCase() === getCurrentUser()?.ign.toLowerCase()) ||
                  (getCurrentUser()?.uid && p.uid === getCurrentUser()?.uid))
            );
          const isClosed =
            match.status === 'LIVE' ||
            match.status === 'COMPLETED' ||
            (match.status as string) === 'MATCHING' ||
            (match.filledSlots || 0) >= (match.totalSlots || 48);

          if (isJoined) {
            return (
              <button
                disabled
                className="w-full py-3.5 rounded-xl bg-emerald-600 text-white font-black text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-not-allowed opacity-95"
              >
                <Check className="w-4 h-4" />
                <span>স্লট বুক করা হয়েছে (JOINED)</span>
              </button>
            );
          }

          if (isClosed) {
            return (
              <div className="w-full py-3.5 rounded-xl bg-red-50 text-red-600 border border-red-200 font-black text-sm flex items-center justify-center gap-2">
                <span>ম্যাচ চলমান / রেজিস্ট্রেশন বন্ধ (REGISTRATION CLOSED)</span>
              </div>
            );
          }

          return (
            <button
              onClick={() => onJoinClick(match)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <span>স্লট বুক করুন / Join Now (৳{match.entryFee})</span>
            </button>
          );
        })()}
      </div>

      {/* HOW TO JOIN VIDEO MODAL */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl p-5 sm:p-6 space-y-4 border border-gray-200 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Play className="w-4 h-4 text-red-600" />
                সঠিক নিয়ম ও কাস্টমে জয়েন করার গাইড
              </h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video rounded-xl bg-black overflow-hidden relative shadow-md">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/rrSwCskEesg"
                title="How to join tournament"
                allowFullScreen
              />
            </div>

            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              ভিডিওতে দেখানো নিয়ম অনুযায়ী ম্যাচ শুরু হওয়ার ২ মিনিট আগে কাস্টম রুম আইডি ও পাসওয়ার্ড নিয়ে গেমে প্রবেশ করে নির্দিষ্ট স্লটে বসুন।
            </p>

            <button
              onClick={() => setShowVideoModal(false)}
              className="w-full py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-all"
            >
              ঠিক আছে, বুঝতে পেরেছি
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
