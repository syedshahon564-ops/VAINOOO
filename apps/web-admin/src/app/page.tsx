'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Info,
  X,
  Smartphone,
  Send,
  Download,
  Flame,
  Tv,
  ArrowRight,
  Shield,
  Trophy,
} from 'lucide-react';
import { useCMS } from '@/lib/cms-store';
import { useLanguage } from '@/components/LanguageProvider';
import AppDownloadModal from '@/components/AppDownloadModal';
import MobileAppViewPage from './mobile-app-view/page';
import { useViewMode } from '@/lib/view-mode';

export default function HomePage() {
  const [showNotice, setShowNotice] = useState(true);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const { categories, matches, settings } = useCMS();
  const { t } = useLanguage();
  const { isApp, setViewMode } = useViewMode();

  if (isApp) {
    return <MobileAppViewPage standalone={true} onSwitchToWeb={() => setViewMode('web')} />;
  }

  const handleDownloadApp = () => {
    const downloadUrl = (settings?.apkDownloadUrl && settings.apkDownloadUrl.trim() !== '')
      ? settings.apkDownloadUrl
      : '/livetourbd.apk';

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'FF_Rival_Tour_BD.apk';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setShowDownloadModal(true);
  };

  // Helper to get real-time match count for any category
  const getMatchCount = (slug: string) => {
    return matches.filter((m) => m.categorySlug === slug).length;
  };

  const catSpecial = categories['special-match'];
  const catClassic = categories['classic-match'];
  const catClash = categories['clash-squad'];
  const catLoneWolf = categories['lone-wolf'];
  const catLostToWin = categories['lost-to-win'];
  const catHeadshot = categories['cs-only-headshot'];

  const freeFireMatches = [catSpecial, catClassic, catClash, catLoneWolf].filter(Boolean);
  const match1vs1 = [catLostToWin].filter(Boolean);
  const onlyHeadshot = [catHeadshot].filter(Boolean);

  return (
    <main className="w-full pb-16 space-y-8">
      {/* Top Small Announcement Notice Bar (Dynamic from Admin) */}
      {showNotice && (
        <div className="bg-red-600 text-white py-3 px-4 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold leading-relaxed">
              <Info className="w-5 h-5 flex-shrink-0 animate-pulse" />
              <p>{settings.noticeText}</p>
            </div>
            <button
              onClick={() => setShowNotice(false)}
              className="p-1 rounded-md hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Hero Carousel Banners */}
        <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-white/10 bg-gradient-to-r from-red-900 via-red-700 to-black p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-wider">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" /> {settings.siteName} Championship 2026
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight uppercase">
              {t('প্রতিদিনের টুর্নামেন্টে জয়েন করুন এবং জিতে নিন নগদ টাকা', 'JOIN DAILY FREE FIRE TOURNAMENTS & WIN REAL BDT')}
            </h1>
            <p className="text-xs sm:text-sm text-gray-200">
              {t(
                'ব্যাটল রয়্যাল, ক্ল্যাশ স্কোয়াড ৪v৪, লোন উলফ এবং ১v১ হেডশট লড়াই। স্বয়ংক্রিয় স্লট বুকিং ও দ্রুত বিকাশ/নগদে প্রাইজ উইথড্র।',
                'Battle Royale, Clash Squad 4v4, Lone Wolf & 1vs1 Headshot battles. Instant automated slot booking & fast bKash/Nagad payouts.'
              )}
            </p>
            <div className="flex flex-wrap gap-3 pt-2 justify-center md:justify-start">
              <Link
                href="/leaderboard"
                className="px-6 py-3 rounded-xl bg-amber-500 text-black font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/30 hover:bg-amber-400 transition-all"
              >
                <Trophy className="w-4 h-4 text-black" /> {t('🏆 টপ প্লেয়ার লিডারবোর্ড', '🏆 Top Players Leaderboard')}
              </Link>
              <button
                onClick={handleDownloadApp}
                className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all border border-red-500/30"
              >
                <Download className="w-4 h-4" /> {t('📥 ডাউনলোড অ্যাপ (Android)', '📥 Download App (Android)')}
              </button>
              <button
                onClick={() => setViewMode('app')}
                className="px-6 py-3 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-black text-xs flex items-center gap-2 border border-amber-500/40 shadow-lg transition-all"
              >
                <Smartphone className="w-4 h-4 text-amber-400" /> {t('📱 মোবাইল অ্যাপ ভিউ', '📱 Switch to App View')}
              </button>
            </div>
          </div>

          {/* Logo Showcase Box */}
          <div className="w-full md:w-auto p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center flex flex-col items-center space-y-3">
            <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-amber-400/50 shadow-2xl bg-black/60 p-1 flex items-center justify-center">
              <img
                src={settings?.logoUrl || '/logo.png'}
                alt={settings?.siteName || 'FF RIVAL TOUR BD'}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-sm font-black text-amber-300 tracking-wider">
              {settings?.siteName || 'FF RIVAL TOUR BD'}
            </div>
            <p className="text-xs text-gray-200 max-w-xs">
              {t('যেকোনো সহায়তার জন্য টেলিগ্রামে মেসেজ দিন', 'Need immediate help with room password or withdrawal?')}
            </p>
            <a
              href={settings.telegramUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#229ED9] text-white text-xs font-bold shadow hover:brightness-110"
            >
              <Send className="w-4 h-4" /> Telegram Community
            </a>
          </div>
        </div>

        {/* SECTION 1: FREE FIRE MATCHES (From User Screenshot) */}
        <section className="space-y-6">
          <div className="flex items-center justify-center gap-4 text-center">
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-wider">
              {catClassic?.section || 'FREE FIRE MATCHES'}
            </h2>
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {freeFireMatches.map((cat) => {
              const count = getMatchCount(cat.slug);
              return (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className="category-card-red p-5 flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-4 z-10">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30 bg-black/40 shadow-xl flex-shrink-0">
                      <img
                        src={cat.avatarImage}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="text-white">
                      <h3 className="text-lg sm:text-xl font-black tracking-wide group-hover:text-amber-300 transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-gray-200 font-medium mt-0.5">
                        {count} {t('টি ম্যাচ উপলব্ধ', 'Matches Available')}
                      </p>
                    </div>
                  </div>

                  {/* Arrow CTA */}
                  <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white group-hover:translate-x-1.5 transition-transform z-10">
                    <ArrowRight className="w-5 h-5" />
                  </div>

                  {/* Subtle character overlay backdrop */}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1/2 bg-cover bg-right opacity-30 mix-blend-overlay pointer-events-none"
                    style={{ backgroundImage: `url(${cat.bannerImage})` }}
                  />
                </Link>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: FREE FIRE MATCH 1 VS 1 (From User Screenshot) */}
        <section className="space-y-6">
          <div className="flex items-center justify-center gap-4 text-center">
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-wider">
              {catLostToWin?.section || 'FREE FIRE MATCH 1 VS 1'}
            </h2>
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {match1vs1.map((cat) => {
              const count = getMatchCount(cat.slug);
              return (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className="category-card-red p-5 flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-4 z-10">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30 bg-black/40 shadow-xl flex-shrink-0">
                      <img
                        src={cat.avatarImage}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="text-white">
                      <h3 className="text-lg sm:text-xl font-black tracking-wide group-hover:text-amber-300 transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-gray-200 font-medium mt-0.5">
                        {count} {t('টি ম্যাচ উপলব্ধ', 'Matches Available')}
                      </p>
                    </div>
                  </div>

                  <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white group-hover:translate-x-1.5 transition-transform z-10">
                    <ArrowRight className="w-5 h-5" />
                  </div>

                  <div
                    className="absolute right-0 top-0 bottom-0 w-1/2 bg-cover bg-right opacity-30 mix-blend-overlay pointer-events-none"
                    style={{ backgroundImage: `url(${cat.bannerImage})` }}
                  />
                </Link>
              );
            })}
          </div>
        </section>

        {/* SECTION 3: ONLY HEADSHOT (From User Screenshot) */}
        <section className="space-y-6">
          <div className="flex items-center justify-center gap-4 text-center">
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-wider">
              {catHeadshot?.section || 'ONLY HEADSHOT'}
            </h2>
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {onlyHeadshot.map((cat) => {
              const count = getMatchCount(cat.slug);
              return (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className="category-card-red p-5 flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-4 z-10">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30 bg-black/40 shadow-xl flex-shrink-0">
                      <img
                        src={cat.avatarImage}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="text-white">
                      <h3 className="text-lg sm:text-xl font-black tracking-wide group-hover:text-amber-300 transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-gray-200 font-medium mt-0.5">
                        {count} {t('টি ম্যাচ উপলব্ধ', 'Matches Available')}
                      </p>
                    </div>
                  </div>

                  <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white group-hover:translate-x-1.5 transition-transform z-10">
                    <ArrowRight className="w-5 h-5" />
                  </div>

                  <div
                    className="absolute right-0 top-0 bottom-0 w-1/2 bg-cover bg-right opacity-30 mix-blend-overlay pointer-events-none"
                    style={{ backgroundImage: `url(${cat.bannerImage})` }}
                  />
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      {/* App Download Modal */}
      <AppDownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />
    </main>
  );
}
