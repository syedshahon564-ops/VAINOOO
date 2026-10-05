'use client';

import React from 'react';
import { X } from 'lucide-react';
import { MatchItem } from '@/lib/cms-store';

interface TotalPrizeDetailsModalProps {
  match: MatchItem;
  onClose: () => void;
  language?: 'bn' | 'en';
}

export default function TotalPrizeDetailsModal({
  match,
  onClose,
  language = 'bn',
}: TotalPrizeDetailsModalProps) {
  const first = match.firstPrize || Math.round(match.prizePool * 0.6);
  const second = match.secondPrize || Math.round(match.prizePool * 0.25);
  const third = match.thirdPrize || Math.round(match.prizePool * 0.15);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Container */}
      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Floating Circular Close (X) Button (Matching Image 2) */}
        <button
          onClick={onClose}
          className="absolute top-2 right-1/2 translate-x-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-black dark:text-white flex items-center justify-center shadow-lg border border-gray-200 dark:border-white/10 hover:scale-105 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Body with Yellow Top Header */}
        <div className="pt-6">
          {/* Yellow Header (Image 2) */}
          <div className="bg-[#facc15] text-slate-900 p-5 pt-6 text-center space-y-2 rounded-t-3xl shadow-inner">
            <h3 className="text-base font-black uppercase tracking-wider">
              TOTAL WINPRIZE
            </h3>
            <p className="text-[10px] font-semibold leading-relaxed text-slate-800 line-clamp-3">
              কাস্টমে নিজের জায়গায় বসতে হবে বাধ্যতামূলক - আইডি লেভেল ৫৫+ থাকতে হবে -
              Normal {match.type} ম্যাচের নিয়ম পড়ে নিন, নিয়ম না মানলে রিফান্ড বা উইনিং
              পাবেন না! FF RIVAL TOUR BD
            </p>
          </div>

          {/* White Card Body with Prize List (Image 2) */}
          <div className="bg-white p-5 space-y-3 rounded-b-3xl text-sm font-bold text-slate-800 shadow-xl">
            <div className="flex items-center gap-3 py-1 border-b border-gray-100">
              <span className="text-lg">👑</span>
              <span>Winner - {first} Taka</span>
            </div>

            <div className="flex items-center gap-3 py-1 border-b border-gray-100">
              <span className="text-lg">🥈</span>
              <span>2nd Position - {second} Taka</span>
            </div>

            <div className="flex items-center gap-3 py-1 border-b border-gray-100">
              <span className="text-lg">🥉</span>
              <span>3rd Position - {third} Taka</span>
            </div>

            <div className="flex items-center gap-3 py-1">
              <span className="text-lg">🥇</span>
              <span>Per Kill : {match.perKill} Taka</span>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition-all"
            >
              {language === 'en' ? 'Close' : 'ঠিক আছে'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
