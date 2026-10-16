'use client';

import React, { useState, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Headphones,
} from 'lucide-react';
import { useCMS, isMatchFinished } from '@/lib/cms-store';
import { useLanguage } from '@/components/LanguageProvider';
import AppDownloadModal from '@/components/AppDownloadModal';
import MobileAppViewPage from './mobile-app-view/page';
import { useViewMode } from '@/lib/view-mode';

export default function HomePage() {
  const [showNotice, setShowNotice] = useState(true);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const { categories, matches, settings } = useCMS();
  const { t, language } = useLanguage();
  const { isApp, setViewMode } = useViewMode();
  const [mounted, setMounted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const defaultBanners = [
    {
      id: 'slide-1',
      badge: 'CHAMPIONSHIP 2026',
      title: t('প্রতিদিনের টুর্নামেন্টে জয়েন করুন এবং জিতে নিন নগদ টাকা', 'JOIN DAILY FREE FIRE TOURNAMENTS & WIN REAL BDT'),
      subtitle: t(
        'ব্যাটল রয়্যাল, ক্ল্যাশ স্কোয়াড ৪v৪, লোন উলফ এবং ১v১ হেডশট লড়াই। স্বয়ংক্রিয় স্লট বুকিং ও দ্রুত বিকাশ/নগদে প্রাইজ উইথড্র।',
        'Battle Royale, Clash Squad 4v4, Lone Wolf & 1vs1 Headshot battles. Instant automated slot booking & fast bKash/Nagad payouts.'
      ),
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1400',
      actionText: 'Telegram Community',
      actionUrl: settings?.telegramUrl || 'https://t.me/ffrivaltourbd',
    },
    {
      id: 'slide-2',
      badge: 'MEGA CASH PRIZE POOL',
      title: t('ক্ল্যাশ স্কোয়াড ৪v৪ এবং স্পেশাল বিআর সার্ভাইভাল', 'SPECIAL CLASH SQUAD 4V4 & BR SURVIVAL BATTLES'),
      subtitle: t(
        'প্রতিটি বুইয়াহ ও কিলে নিশ্চিত ক্যাশ রিওয়ার্ড। ১-ট্যাপে সরাসরি বিকাশ ও নগদে সুপার ফাস্ট পেমেন্ট উইথড্রল!',
        'Guaranteed cash rewards for every Booyah and Kill. Instant automated payouts to bKash & Nagad!'
      ),
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1400',
      actionText: 'Join Community',
      actionUrl: settings?.telegramUrl || 'https://t.me/ffrivaltourbd',
    },
    {
      id: 'slide-3',
      badge: '100% SAFE & AUTOMATED',
      title: t('অ্যাডভান্সড অ্যান্টি-চিট সিকিউরিটি ও ২৪/৭ লাইভ সাপোর্ট', 'ADVANCED ANTI-CHEAT & 24/7 LIVE SUPPORT'),
      subtitle: t(
        'সম্পূর্ণ ফেয়ার টুর্নামেন্ট সিকিউরিটি ও ২৪/৭ লাইভ কাস্টমার সাপোর্ট। আইডি লেভেল ৫৫+ বাধ্যতামূলক।',
        '100% fair tournament rules, anti-hack verification & instant room password dispatch.'
      ),
      image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1400',
      actionText: 'Telegram Support',
      actionUrl: settings?.telegramUrl || 'https://t.me/ffrivaltourbd',
    },
  ];

  const bannerSlides =
    settings?.banners && settings.banners.length > 0 ? settings.banners : defaultBanners;

  useEffect(() => {
    if (isPaused || bannerSlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused, bannerSlides.length]);

  const activeSlide = bannerSlides[currentSlide] || bannerSlides[0];

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDownloadApp = () => {
    const downloadUrl = (settings?.apkDownloadUrl && settings.apkDownloadUrl.trim() !== '')
      ? settings.apkDownloadUrl
      : '/ffrivals.apk';

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'ffrivals.apk';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setShowDownloadModal(true);
  };

  // Helper to get real-time match count for any category (active only)
  const getMatchCount = (slug: string) => {
    return matches.filter((m) => m.categorySlug === slug && !isMatchFinished(m)).length;
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

  if (!mounted) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0a0a0f] flex flex-col items-center justify-center p-6 space-y-4 text-center">
        <div className="w-20 h-20 rounded-2xl bg-black/80 border-2 border-amber-500/40 p-2 flex items-center justify-center shadow-2xl shadow-amber-500/10 animate-pulse">
          <img src="/logo.png" alt="FF Rivals Tour BD" className="w-full h-full object-contain" />
        </div>
        <div className="space-y-1">
          <h2 className="text-white text-base sm:text-lg font-black uppercase tracking-wider">
            FF Rivals <span className="text-red-600">Tour BD</span>
          </h2>
          <p className="text-gray-400 text-xs font-semibold">লোড হচ্ছে, অপেক্ষা করুন...</p>
        </div>
        <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin mt-2" />
      </div>
    );
  }

  if (isApp) {
    return <MobileAppViewPage standalone={true} />;
  }

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
        {/* Hero Interactive Auto-sliding Carousel (Pure Full-Bleed Banner Images) */}
        <div
          className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 group h-[220px] sm:h-[320px] md:h-[380px] lg:h-[420px] w-full bg-black select-none"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Pure Full-Bleed Banner Images with Smooth Crossfade */}
          {bannerSlides.map((slide, idx) => {
            const isCurrent = idx === currentSlide;
            const content = (
              <div
                key={slide.id || idx}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <img
                  src={slide.image || '/logo.png'}
                  alt={slide.title || 'Tournament Banner'}
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.02]"
                />
              </div>
            );

            if (slide.actionUrl) {
              return (
                <a
                  key={slide.id || idx}
                  href={slide.actionUrl}
                  target={slide.actionUrl.startsWith('http') ? '_blank' : '_self'}
                  rel="noreferrer"
                  className="cursor-pointer"
                  title={slide.title || 'Tournament Banner'}
                >
                  {content}
                </a>
              );
            }
            return content;
          })}

          {/* Navigation Arrows (Prev / Next) */}
          {bannerSlides.length > 1 && (
            <>
              <button
                onClick={() => setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 hover:scale-105"
                title="Previous Slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentSlide((prev) => (prev + 1) % bannerSlides.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 hover:scale-105"
                title="Next Slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Dot Indicators */}
          {bannerSlides.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              {bannerSlides.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  onClick={() => setCurrentSlide(dotIdx)}
                  className={`transition-all duration-300 rounded-full ${
                    dotIdx === currentSlide
                      ? 'w-7 h-2 bg-gradient-to-r from-amber-400 to-red-500 shadow-md'
                      : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                  }`}
                  title={`Go to slide ${dotIdx + 1}`}
                />
              ))}
            </div>
          )}
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
                  prefetch={true}
                  className="category-card-red p-5 flex items-center justify-between group cursor-pointer active:scale-[0.98] transition-transform duration-100"
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
                  prefetch={true}
                  className="category-card-red p-5 flex items-center justify-between group cursor-pointer active:scale-[0.98] transition-transform duration-100"
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
                  prefetch={true}
                  className="category-card-red p-5 flex items-center justify-between group cursor-pointer active:scale-[0.98] transition-transform duration-100"
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
