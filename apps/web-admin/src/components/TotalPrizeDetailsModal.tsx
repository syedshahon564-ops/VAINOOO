'use client';

import React from 'react';
import { X, Trophy, Users, ShieldAlert, Award, Ticket } from 'lucide-react';
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
  const isLoneWolf =
    match.categorySlug === 'lone-wolf' ||
    match.title?.toLowerCase().includes('lone wolf') ||
    match.type === '1 vs 1' ||
    match.type === '1v1' ||
    match.type === '2 vs 2' ||
    match.type === '2v2';

  const isClashSquad =
    match.categorySlug === 'clash-squad' ||
    match.categorySlug === 'cs-only-headshot' ||
    match.title?.toLowerCase().includes('clash squad') ||
    match.title?.toLowerCase().includes('cs ') ||
    match.type === '4 vs 4' ||
    match.type === '4v4';

  const hasMultiTiers =
    !isLoneWolf &&
    !isClashSquad &&
    ((match.secondPrize && match.secondPrize > 0) ||
      (match.thirdPrize && match.thirdPrize > 0) ||
      (match.perKill && match.perKill > 0));

  const winnerPrize = match.firstPrize || match.prizePool;
  const second = match.secondPrize || 0;
  const third = match.thirdPrize || 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Container */}
      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Floating Circular Close (X) Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-1/2 translate-x-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-black dark:text-white flex items-center justify-center shadow-lg border border-gray-200 dark:border-white/10 hover:scale-105 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Body with Yellow Top Header */}
        <div className="pt-6">
          {/* Yellow Header */}
          <div className="bg-[#facc15] text-slate-900 p-5 pt-6 text-center space-y-2 rounded-t-3xl shadow-inner">
            <h3 className="text-base font-black uppercase tracking-wider">
              TOTAL WINPRIZE
            </h3>
            <p className="text-[10px] font-semibold leading-relaxed text-slate-800 line-clamp-3">
              {isLoneWolf
                ? `লোন উলফ (${match.type}) ম্যাচের নিয়ম: কাস্টমে নিজের স্লটে বসতে হবে। বিজয়ী সম্পূর্ণ উইনিং প্রাইজ পাবে! FF RIVAL TOUR BD`
                : isClashSquad
                ? `ক্লাশ স্কোয়াড (${match.type}) ম্যাচের নিয়ম: বিজয়ী দল সম্পূর্ণ প্রাইজপুল পাবে! FF RIVAL TOUR BD`
                : `কাস্টমে নিজের জায়গায় বসতে হবে বাধ্যতামূলক - আইডি লেভেল ৫৫+ থাকতে হবে - Normal ${match.type} ম্যাচের নিয়ম পড়ে নিন! FF RIVAL TOUR BD`}
            </p>
          </div>

          {/* White Card Body with Prize List */}
          <div className="bg-white p-5 space-y-3 rounded-b-3xl text-sm font-bold text-slate-800 shadow-xl">
            {/* Winner Prize */}
            <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-xl">👑</span>
                <span>{isClashSquad ? 'Winning Team' : 'Winner'}</span>
              </div>
              <span className="font-black text-emerald-600 text-base">{winnerPrize} Taka</span>
            </div>

            {/* Entry Fee */}
            <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-xl">🎟️</span>
                <span>Entry Fee</span>
              </div>
              <span className="font-bold text-slate-700">{match.entryFee} Taka</span>
            </div>

            {/* If Battle Royale with 2nd & 3rd place prizes */}
            {hasMultiTiers && (
              <>
                {second > 0 && (
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🥈</span>
                      <span>2nd Position</span>
                    </div>
                    <span className="font-bold text-slate-700">{second} Taka</span>
                  </div>
                )}

                {third > 0 && (
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🥉</span>
                      <span>3rd Position</span>
                    </div>
                    <span className="font-bold text-slate-700">{third} Taka</span>
                  </div>
                )}

                {match.perKill && match.perKill > 0 ? (
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🎯</span>
                      <span>Per Kill</span>
                    </div>
                    <span className="font-bold text-slate-700">{match.perKill} Taka</span>
                  </div>
                ) : null}
              </>
            )}

            {/* Match Format & Slots for 1v1 / Lone Wolf / Clash Squad */}
            {!hasMultiTiers && (
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="text-xl">👥</span>
                  <span>Match Format</span>
                </div>
                <span className="font-bold text-slate-700">
                  {match.type} ({match.totalSlots} Slots)
                </span>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full mt-3 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition-all active:scale-98"
            >
              {language === 'en' ? 'Close' : 'ঠিক আছে'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
