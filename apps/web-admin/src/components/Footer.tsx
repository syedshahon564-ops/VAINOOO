'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Heart, Zap, Trophy } from 'lucide-react';
import { useCMS } from '@/lib/cms-store';

export default function Footer() {
  const { settings } = useCMS();

  return (
    <footer className="border-t border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#07070a] pt-16 pb-12 mt-20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-gray-200 dark:border-white/[0.06]">
          {/* Col 1 */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-amber-500/30 bg-black/60 shadow-lg p-0.5">
                <img
                  src={settings?.logoUrl || '/logo.png'}
                  alt={settings?.siteName || 'FF RIVAL TOUR BD'}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                  {settings?.siteName ? (
                    settings.siteName
                  ) : (
                    <>FF RIVAL <span className="text-red-600">TOUR BD</span></>
                  )}
                </span>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold tracking-wider uppercase">
                  {settings?.tagline || 'Official Free Fire Tournament Arena'}
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md leading-relaxed">
              Bangladesh&apos;s premier competitive esports arena for Free Fire. Join daily custom matches, compete against verified players, and receive instant prize payouts directly to your bKash or Nagad account.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="px-3 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Skill-Based Fair Play
              </span>
              <span className="px-3 py-1 text-xs rounded-full bg-red-600/10 text-red-600 border border-red-500/20 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Automated Verification
              </span>
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-sm text-gray-600 dark:text-gray-400">
              <li><Link href="/" className="hover:text-red-600 transition-colors">Home & Tournaments</Link></li>
              <li><Link href="/leaderboard" className="hover:text-red-600 transition-colors flex items-center gap-1 font-bold text-amber-500"><Trophy className="w-3.5 h-3.5" /> Top Players (Leaderboard)</Link></li>
              <li><Link href="/wallet" className="hover:text-red-600 transition-colors">Deposit & Withdraw</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Payment Methods</h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span>bKash: {settings?.bkashNumber || '01712345678'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Nagad: {settings?.nagadNumber || '01812345678'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span>DBBL Rocket (Instant)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} FF RIVAL TOUR BD. All rights reserved. Not affiliated with Garena Free Fire.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for Bangladeshi Esports Gamers.
          </p>
        </div>
      </div>
    </footer>
  );
}
