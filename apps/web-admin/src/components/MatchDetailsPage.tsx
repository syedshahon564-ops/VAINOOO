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
import { MatchItem, useCMS } from '@/lib/cms-store';
import { formatMatchSchedule } from '@/components/LiveMatchCountdown';

interface MatchDetailsPageProps {
  match: MatchItem;
  participants?: string[];
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
  const { settings } = useCMS();
  const [showVideoModal, setShowVideoModal] = useState(false);

  const cleanScheduleTime = match.time
    .replace('আজ ', '')
    .replace('আজ রাত ', '')
    .replace('আজ বিকাল ', '');

  return (
    <div
      className={`min-h-full bg-white dark:bg-[#12121a] text-gray-900 dark:text-gray-100 ${
        isPhoneView ? 'p-4 pb-20' : 'max-w-3xl mx-auto p-6 pb-24'
      } space-y-4`}
    >
      {/* 1. Header with Back Arrow and 'Details Page' (Exact Screenshot 4) */}
      <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-white/10">
        <button
          onClick={onBack}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-black text-gray-900 dark:text-white">
          Details Page
        </h2>
      </div>

      {/* 2. Top Notice Banner (Exact Screenshot 4) */}
      <div className="space-y-1">
        <h3 className="text-sm font-black text-gray-900 dark:text-white leading-snug">
          Prize Pool TOP 12 ✅ HP 500 😉 কাস্টমে নিজের জায়গায় বসতে হবে বাধ্যতামূলক - আইডি লেভেল 40+ থাকতে হবে - {match.categorySlug?.includes('survival') ? 'BR Survival' : match.title || 'BR Survival'} ম্যাচের নিয়ম পড়ে নিন, নিয়ম না মানলে রিফান্ড বা উইনিং পাবেন না! {settings.siteName || 'FF RIVAL TOUR BD'}
        </h3>
      </div>

      {/* 3. Badge Pills Grid (Exact Screenshot 4) */}
      <div className="space-y-2 pt-1">
        {/* Row 1: Type | Version | Map */}
        <div className="flex flex-wrap gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
          <div className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
            Type: <span className="font-black text-gray-900 dark:text-white">{match.type || 'Solo'}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
            Version: <span className="font-black text-gray-900 dark:text-white">TPP</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
            Map: <span className="font-black text-gray-900 dark:text-white">{match.map || 'Bermuda'}</span>
          </div>
        </div>

        {/* Row 2: Match Type | Entry fee */}
        <div className="flex flex-wrap gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
          <div className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
            Match Type: <span className="font-black text-emerald-600">Paid</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
            Entry fee: <span className="font-black text-gray-900 dark:text-white">{match.entryFee} TK</span>
          </div>
        </div>

        {/* Row 3: Match Schedule */}
        <div className="flex flex-wrap gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
          <div className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
            Match Schedule:{' '}
            <span className="font-black text-gray-900 dark:text-white">
              {formatMatchSchedule(match.time)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Prize Details (Exact Screenshot 4) */}
      <div className="space-y-2 pt-2">
        <h4 className="text-sm font-black text-gray-900 dark:text-white">
          Prize Details
        </h4>
        <div className="flex flex-wrap gap-3">
          <div className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs font-bold">
            Winning Prize:{' '}
            <span className="font-black text-gray-900 dark:text-white">
              {match.firstPrize || match.prizePool || 170} TK
            </span>
          </div>
          <div className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs font-bold">
            Per Kill:{' '}
            <span className="font-black text-gray-900 dark:text-white">
              {match.perKill || 0} TK
            </span>
          </div>
        </div>
      </div>

      {/* 5. Orange Dashed Box: Room ID & Password Notice (Exact Screenshot 4) */}
      <div className="p-3 rounded-xl border-2 border-dashed border-amber-500 bg-amber-50/90 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 text-center font-bold text-[11px] leading-snug">
        ম্যাচ শুরু হওয়ার সময়ের ২ থেকে ৪ মিনিট আগে কাস্টমের আইডি পাসওয়ার্ড পাবেন Room Details Button এ
      </div>

      {/* 6. Dotted Line Separator (Exact Screenshot 4) */}
      <div className="border-b border-dotted border-gray-300 dark:border-white/20 pt-1" />

      {/* 7. Match Instructions and Rules Section Header (Exact Screenshot 4) */}
      <div className="space-y-3 pt-1">
        <h4 className="text-sm font-black text-gray-900 dark:text-white">
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

      {/* 8. Full Detailed Rules List (Exact Bengali Text from Screenshots 1, 2, 3, 4) */}
      <div className="text-xs space-y-3.5 pt-2 leading-relaxed text-gray-800 dark:text-gray-200 font-medium">
        <p className="font-black text-amber-700 dark:text-amber-400 text-xs flex items-center gap-1.5">
          <span>⚠️</span>
          <span>&quot;{settings.siteName || 'FF RIVAL TOUR BD'}&quot; BR Survival এর নিয়মাবলী এবং শর্তসমূহ:-</span>
        </p>

        <p className="flex items-start gap-2">
          <span className="text-emerald-600 font-bold flex-shrink-0">✅</span>
          <span>
            ম্যাচের কাস্টমে ঢুকে একটি স্ক্রিনশট নিবেন, এবং আপনি মরে যাওয়ার পর একটি স্ক্রিনশট নিবেন রেজাল্টের, যেখানে আপনি কত নাম্বার হয়েছেন এবং সময় দেখায় ম্যাচটির হিস্ট্রিতে, এগুলো আমাদের এডমিন চাইলে দিতে হবে বাধ্যতামূলক! যদি না দিতে পারেন উইনিং প্রাইজ বাতিল পাবেন না!
          </span>
        </p>

        <p className="flex items-start gap-2">
          <span className="text-rose-600 font-bold flex-shrink-0">🚫</span>
          <span>
            কাস্টমের আইডি পাসওয়ার্ড পাওয়ার পরে গেমের ভিতরে গিয়ে সর্বপ্রথম আপনার গেমের ইনভাইট জয়েন এর নোটিফিকেশন রিজেক্ট/বন্ধ করে নিতে হবে, বাধ্যতামূলক, না করলে অ্যাপস থেকে পার্মানেন্ট ব্যান করা হবে!
          </span>
        </p>

        <p className="flex items-start gap-2">
          <span className="text-rose-600 font-bold flex-shrink-0">🚫</span>
          <span>
            অ্যাপসের মধ্যে ম্যাচ কেনার পর ম্যাচের মধ্যে ক্লিক করে একদম নিচের দিকে এসে আপনার নামের পাশে কত নাম্বার সেটা আপনাকে দেখে নিতে হবে, কাস্টমের পাসওয়ার্ড পাওয়ার পর কাস্টমে সোজা জয়েন করা যাবে না প্রথমে অবজারভে জয়েন করবে, অবজারভ থেকে তারপরে নিজের জায়গায় বসবে, সোজা জয়েন করলে তাকে কিক করে দেওয়া হবে, এক্সে ম্যাচ আপনার নামের পাশে যত নাম্বার লেখা থাকবে (২/৪/১০/৪৫/৪৮) কাস্টম রুমে ঢুকে আপনি সে স্থানে গিয়ে বসতে হবে, যদি আপনার জায়গায় অন্য কেউ বসে থাকে তাহলে আপনি অবজারভে গিয়ে বসবেন, যদি আপনি অবজারভে না গিয়ে অন্যের জায়গায় বসে থাকেন তাহলে আপনি কিক খাবেন (রিফান্ড পাবেন না) আর আপনি অবজারভে গিয়ে বসার পর আপনার জায়গায় যে রয়েছে তাকে ম্যাচ শুরু করার আগে কিক আউট করে দেওয়া হবে, তখন সঙ্গে সঙ্গে আপনি আপনার জায়গায় বসে পড়বেন। অথবা আপনি অবজারভে থাকবেন নিয়ম অনুযায়ী এরপরে ম্যাচ শুরু করার আগে আপনাকে যে কোন জায়গায় আমাদের হোস্ট নামিয়ে দিবে তবে আপনি অ্যালার্ট থাকবেন আপনার জায়গায় ফাঁকা হলে সেখানে আপনি নেমে পড়বেন ভুলে অন্য জায়গায় নামবেন না অন্যের জায়গায় বসলে কিক খাবেন এবং এর পরে ম্যাচটি শুরু করা হবে এবং তখন নিয়ম অনুযায়ী আপনি আপনার উইনিং প্রাইজ পাবেন।
          </span>
        </p>

        <p className="flex items-start gap-2">
          <span className="text-rose-600 font-bold flex-shrink-0">🚫</span>
          <span>
            স্থান থেকে অবজারভে না গিয়ে অন্য জায়গায় গিয়ে বসে থাকলে আপনাকে কিক আউট করা হবে এবং সে ম্যাচের রিফান্ড পাবেন না। এক্ষেত্রে কেউ যদি জায়গায় বসার জন্য ৫ দুই ম্যাচ কাস্টম থেকে কিক খায় তাহলে তাকে পার্মানেন্টলি আমাদের এপ্স থেকে ব্যান করা হবে, তার একাউন্টে টাকা থাকলে সেটা তাকে উইথড্র করে দেওয়া হবে তবে সে পার্মানেন্ট ব্যান হবে, আর একবার {settings.siteName || 'FF RIVAL TOUR BD'} apps এ ব্যান হলে সে আর কখনো {settings.siteName || 'FF RIVAL TOUR BD'} apps এ খেলতে পারবে না!
          </span>
        </p>

        <p className="flex items-start gap-2">
          <span className="text-rose-600 font-bold flex-shrink-0">🚫</span>
          <span>
            ম্যাচ শুরু হওয়ার সময়ের দুই থেকে চার মিনিট আগে কাস্টমের আইডি পাসওয়ার্ড পাবেন রুম ডিটেলস বাটনে হওয়ার পর আরো দুই মিনিট অপেক্ষা করা হবে প্লেয়ারদের জন্য, দুই মিনিট হয়ে যাওয়ার সঙ্গে সঙ্গে কাস্টমের আইডি পাসওয়ার্ড পরিবর্তন করে দেওয়া হবে, এরপরে আরো পাঁচ মিনিট সময় নিয়ে কাস্টমের হোস্টিং প্লেয়ারদের পর্যবেক্ষণ করবে এরপরে ম্যাচটি স্টার্ট করবে!
          </span>
        </p>

        <p className="flex items-start gap-2">
          <span className="text-rose-600 font-bold flex-shrink-0">🚫</span>
          <span>
            কোন কারণ ছাড়া রুম থেকে কিক করা হয়না এবং কোনদিন হবেও না, তবে আপনি যদি দাবি করেন কোন কারণ ছাড়া আপনাকে কিক আউট করা হয়েছে সে ক্ষেত্রে আপনাকে সেটা প্রমাণ দিতে হবে ভিডিওর মাধ্যমে Recording ছাড়া টাকা রিফান্ড পাবেন না। কিক মারার পরে ভিডিও করলে চলবে না। অ্যাপ থেকে কাস্টম আইডি পাসওয়ার্ড নেওয়া থেকেই ভিডিও চালু রাখতে হবে।
          </span>
        </p>

        <p className="flex items-start gap-2">
          <span className="text-rose-600 font-bold flex-shrink-0">🚫</span>
          <span>
            Survival match এর কাস্টমে precise aim No থাকবে⛔ মানে auto aim off ⛔ Full Control ✅
          </span>
        </p>

        <p className="flex items-start gap-2">
          <span className="text-rose-600 font-bold flex-shrink-0">🚫</span>
          <span>
            Survival match এর কাস্টমে Headshot ON থাকবে⛔ ONLY Headshot Mode
          </span>
        </p>

        <p className="flex items-start gap-2">
          <span className="text-rose-600 font-bold flex-shrink-0">🚫</span>
          <span>
            BR SURVIVAL MATCH খেলতে আইডির লেভেল ৪০+ থাকতে হবে!
          </span>
        </p>

        <p className="flex items-start gap-2">
          <span className="text-emerald-600 font-bold flex-shrink-0">✅</span>
          <span>
            ম্যাচের মধ্যে সমস্ত গাড়ি সমস্ত গান ব্যবহার করতে পারবেন Survival match এ
          </span>
        </p>

        {/* Bullet feature checklist (Screenshot 1) */}
        <div className="space-y-1.5 pl-6 font-bold text-gray-900 dark:text-white">
          <div className="flex items-center gap-2">
            <span className="text-emerald-500">✅</span> Character skill on
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-500">✅</span> load out on
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-500">✅</span> hp 500
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-500">✅</span> all gun allow
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-500">✅</span> all car allow
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-500">✅</span> kill allow
          </div>
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <span>⚠️</span> zone damage high 🔥
          </div>
        </div>

        <p className="text-gray-700 dark:text-gray-300">
          survival match এ বেশিরভাগ ম্যাচে সবাই একসাথে মরে যাওয়ায় রেজাল্ট পাওয়া যায় না মাঝে মাঝে, তাই ম্যাচ শেষ হওয়ার ৩০ মিনিটের মধ্যে উইনিং প্রাইজ না পেলে আমাদের হোয়াটসঅ্যাপ চ্যানেলে দেওয়া ফেসবুক পেইজে সময় সহকারে হিস্ট্রি থেকে স্ক্রিনশট পাঠাবেন ⚠️
        </p>

        <p className="text-gray-700 dark:text-gray-300">
          👀 ম্যাচের উইনিং প্রাইজ ম্যাচ শেষ হওয়ার ৩০ মিনিটের মধ্যে পাবেন, না পেলে ম্যাচ হিস্ট্রির সময় সহকারে দেখা যায় এরকম screenshot, আমাদের হোয়াটসঅ্যাপ চ্যানেলে দেওয়া ফেসবুক পেইজে পাঠাতে হবে ১০ ঘণ্টার মধ্যে, মেসেজ করে রাখলে হবে আপনি উইনিং না পেলে আপনাকে উইনিং দিয়ে দেওয়া হবে যেকোনো সময় আপনার মেসেজ দেখার পরেই ✅
        </p>

        <p className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
          <span className="text-emerald-600">✔️</span>
          যেকোন সমস্যা বা সহযোগিতার ক্ষেত্রে আমাদের SUPPORT এ যোগাযোগ করতে হবে।
        </p>

        <p className="font-black text-amber-600 dark:text-amber-400 text-sm">
          {settings.siteName || 'FF RIVAL TOUR BD'} এর সিদ্ধান্ত চূড়ান্ত সিদ্ধান্ত 👌
        </p>
      </div>

      {/* 9. ROOM RULES & REGISTERED PARTICIPANTS (Image 3) */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-black/30 p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-white/10">
          <Key className="w-4 h-4 text-red-600" />
          <h4 className="text-sm font-black text-gray-900 dark:text-white">
            কাস্টম রুম রুলস ও রেজিস্টার্ড প্লেয়ার তালিকা (Room Rules & Participants)
          </h4>
        </div>

        {/* Rules note from Image 3 */}
        <div className="text-xs text-gray-700 dark:text-gray-300 space-y-2 leading-relaxed font-medium bg-white dark:bg-[#181824] p-3.5 rounded-xl border border-gray-100 dark:border-white/5">
          <p>
            ফেসবুক পেইজে পাঠাতে হবে ১০ ঘণ্টার মধ্যে, মেসেজ করে রাখলে হবে আপনি উইনিং না পেলে আপনাকে উইনিং দিয়ে দেওয়া হবে যেকোনো সময় আপনার মেসেজ দেখার পরেই✅
          </p>
          <p className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
            <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            যেকোন সমস্যা বা সহযোগিতার ক্ষেত্রে আমাদের SUPPORT এ যোগাযোগ করতে হবে।
          </p>
          <p className="font-black text-amber-600 dark:text-amber-400">
            {settings.siteName || 'FF RIVAL TOUR BD'} এর সিদ্ধান্ত চূড়ান্ত সিদ্ধান্ত 👌
          </p>
        </div>

        {/* Separator */}
        <div className="border-t border-dashed border-gray-300 dark:border-white/20 pt-2 text-center">
          <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white flex items-center justify-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-500" />
            REGISTERED PARTICIPANTS ({participants.length}/{match.totalSlots})
          </h4>
        </div>

        {/* Numbered Participants or Empty State */}
        {participants.length === 0 ? (
          <div className="py-6 px-4 rounded-xl border border-dashed border-gray-200 dark:border-white/10 bg-white/60 dark:bg-black/20 text-center space-y-1">
            <Users className="w-7 h-7 mx-auto text-gray-400 opacity-60" />
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
              এখনো কোনো প্লেয়ার রেজিস্ট্রেশন করেনি
            </p>
            <p className="text-[11px] text-gray-400">
              ম্যাচে অংশ নিতে নিচের &quot;স্লট বুক করুন / Join Now&quot; বাটনে ক্লিক করে প্রথম প্লেয়ার হিসেবে আপনার স্লট নিশ্চিত করুন।
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 divide-y divide-gray-100 dark:divide-white/5">
            {participants.map((name, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 py-2 text-xs font-bold text-gray-800 dark:text-gray-200"
              >
                <span className="w-6 text-gray-400 font-mono text-xs">{idx + 1}</span>
                <span className="font-mono tracking-wide">{name}</span>
                <span className="ml-auto text-[10px] font-bold text-emerald-500 uppercase px-2 py-0.5 rounded bg-emerald-500/10">
                  Confirmed
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Sticky Join Button */}
      <div className="pt-4 border-t border-gray-100 dark:border-white/10">
        <button
          onClick={() => onJoinClick(match)}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 active:scale-98"
        >
          <span>স্লট বুক করুন / Join Now (৳{match.entryFee})</span>
        </button>
      </div>

      {/* HOW TO JOIN VIDEO MODAL */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#181824] rounded-2xl p-5 sm:p-6 space-y-4 border border-gray-200 dark:border-white/10 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-white/10">
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Play className="w-4 h-4 text-red-600" />
                সঠিক নিয়ম ও কাস্টমে জয়েন করার গাইড
              </h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500"
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

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
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
