'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy,
  HelpCircle,
  Clock,
  Users,
  ShieldAlert,
  ArrowLeft,
  Check,
  AlertCircle,
  X,
  Play,
  Award,
  PlusCircle,
  Key,
  Copy,
  Info,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { useCMS, MatchItem } from '@/lib/cms-store';
import { useLanguage } from '@/components/LanguageProvider';
import RoomDetailsModal from '@/components/RoomDetailsModal';
import SlotBookingModal from '@/components/SlotBookingModal';
import TotalPrizeDetailsModal from '@/components/TotalPrizeDetailsModal';
import MatchDetailsPage from '@/components/MatchDetailsPage';
import LiveMatchCountdown, { formatMatchSchedule, parseScheduleTimeToDate } from '@/components/LiveMatchCountdown';

export default function CategoryDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { t, language } = useLanguage();
  const lang = language;

  const { categories, matches, settings, loaded, updateMatch } = useCMS();
  const category = categories[slug] || categories['classic-match'];

  // Filter matches for this category with useMemo for snappy responsiveness
  const allCategoryMatches = React.useMemo(
    () => matches.filter((m) => m.categorySlug === slug),
    [matches, slug]
  );
  const categoryMatches = React.useMemo(
    () =>
      allCategoryMatches
        .filter((m) => m.status !== 'COMPLETED')
        .sort(
          (a, b) =>
            (parseScheduleTimeToDate(a.time)?.getTime() || 0) -
            (parseScheduleTimeToDate(b.time)?.getTime() || 0)
        ),
    [allCategoryMatches]
  );
  const completedMatches = React.useMemo(
    () => allCategoryMatches.filter((m) => m.status === 'COMPLETED'),
    [allCategoryMatches]
  );

  const [matchTypeFilter, setMatchTypeFilter] = useState<'ALL' | 'SOLO' | 'DUO' | 'SQUAD'>('ALL');
  const [activeTab, setActiveTab] = useState<'PLAY' | 'RESULT'>('PLAY');

  const filteredCategoryMatches = React.useMemo(() => {
    return categoryMatches.filter((m) => {
      if (matchTypeFilter === 'ALL') return true;
      const typeStr = (m.type || m.matchType || '').toUpperCase();
      const titleStr = (m.title || '').toUpperCase();
      if (matchTypeFilter === 'SOLO') {
        return (
          typeStr.includes('SOLO') ||
          titleStr.includes('SOLO') ||
          titleStr.includes('সোলো') ||
          (m.totalSlots <= 2 && !typeStr.includes('DUO') && !titleStr.includes('DUO'))
        );
      }
      if (matchTypeFilter === 'DUO') {
        return typeStr.includes('DUO') || titleStr.includes('DUO') || titleStr.includes('ডুও');
      }
      if (matchTypeFilter === 'SQUAD') {
        return (
          typeStr.includes('SQUAD') ||
          titleStr.includes('SQUAD') ||
          titleStr.includes('স্কোয়াড') ||
          typeStr.includes('4V4') ||
          titleStr.includes('4V4')
        );
      }
      return true;
    });
  }, [categoryMatches, matchTypeFilter]);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [detailsMatch, setDetailsMatch] = useState<MatchItem | null>(null);
  const [bookingMatch, setBookingMatch] = useState<MatchItem | null>(null);
  const [totalPrizeMatch, setTotalPrizeMatch] = useState<MatchItem | null>(null);
  const [matchDetailsScreen, setMatchDetailsScreen] = useState<MatchItem | null>(null);
  const [bookedParticipants, setBookedParticipants] = useState<{
    [matchId: string]: Array<{ ign: string; uid?: string; slot?: number; team?: number }>;
  }>({});
  const [userBalance, setUserBalance] = useState(1500);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleBookingSuccess = (slotInfo: {
    slotNumber: number;
    teamNumber?: number;
    slotInTeam?: number;
    ign: string;
    uid: string;
    players?: Array<{ ign: string; uid: string; slotInTeam: number }>;
  }) => {
    if (bookingMatch) {
      // Deduct entry fee
      setUserBalance((prev) => Math.max(0, prev - bookingMatch.entryFee));

      const registeredCount = slotInfo.players && slotInfo.players.length > 0 ? slotInfo.players.length : 1;
      const registeredEntries = slotInfo.players && slotInfo.players.length > 0
        ? slotInfo.players.map((p) => ({
            ign: p.ign,
            uid: p.uid,
            slot: slotInfo.slotNumber,
            team: slotInfo.teamNumber,
          }))
        : [
            {
              ign: slotInfo.ign,
              uid: slotInfo.uid,
              slot: slotInfo.slotNumber,
              team: slotInfo.teamNumber,
            },
          ];

      // Update match filled slots count
      updateMatch(bookingMatch.id, {
        filledSlots: Math.min(bookingMatch.totalSlots, (bookingMatch.filledSlots || 0) + registeredCount),
      });

      setBookedParticipants((prev) => ({
        ...prev,
        [bookingMatch.id]: [...(prev[bookingMatch.id] || []), ...registeredEntries],
      }));

      const teamText = slotInfo.teamNumber
        ? `টিম #${slotInfo.teamNumber}`
        : `স্লট #${slotInfo.slotNumber}`;

      setToastMessage(
        lang === 'bn'
          ? `অভিনন্দন ${slotInfo.ign}! ${teamText} (${registeredCount} জন প্লেয়ার) সফলভাবে কনফার্ম হয়েছে।`
          : `Congratulations ${slotInfo.ign}! ${teamText} (${registeredCount} players) confirmed.`
      );
      setTimeout(() => setToastMessage(null), 5000);
    }
    setBookingMatch(null);
  };

  if (!loaded || !category) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-gray-500">
        {t('লোডিং হচ্ছে...', 'Loading...')}
      </div>
    );
  }


  // Render Full Match Details Page (Image 1, 2, 3, 4)
  if (matchDetailsScreen) {
    const currentParticipants = bookedParticipants[matchDetailsScreen.id] || [];
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-in fade-in duration-200">
        <MatchDetailsPage
          match={matchDetailsScreen}
          participants={currentParticipants}
          onBack={() => setMatchDetailsScreen(null)}
          onJoinClick={(m) => {
            setMatchDetailsScreen(null);
            setBookingMatch(m);
          }}
          language={lang}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white shadow-2xl flex items-center gap-3 font-bold text-xs animate-bounce max-w-md">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-red-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t('সব ক্যাটাগরিতে ফিরে যান', 'Back to All Categories')}
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
            {t('ওয়ালেট ব্যালেন্স:', 'Wallet Balance:')}{' '}
            <strong className="text-emerald-600">৳{userBalance}</strong>
          </span>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:underline"
          >
            <PlusCircle className="w-4 h-4" /> {t('অ্যাডমিন প্যানেল', 'Admin Panel')}
          </Link>
        </div>
      </div>

      {/* Category Header Card */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-card p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-red-600 flex-shrink-0 shadow-md">
              <img
                src={category.bannerImage}
                alt={category.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-600 uppercase">
                  {category.section}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                  {categoryMatches.length} {t('সক্রিয় ম্যাচ', 'Matches Active')}
                </span>
              </div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                {category.name}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {category.description || 'Game / Custom Match Lobby'}
              </p>
            </div>
          </div>

          {/* How to play CTA Button */}
          <button
            onClick={() => setShowHowToPlay(true)}
            className="px-5 py-3 rounded-full bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-white/15 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <HelpCircle className="w-4 h-4 text-red-600" />
            <span>{t('টুর্নামেন্ট খেলার জন্য কিভাবে যোগদান করবেন ?', 'How to Join Tournament?')}</span>
          </button>
        </div>
      </div>

      {/* Tabs: Play vs Result */}
      <div className="w-full">
        <div className="grid grid-cols-2 p-1.5 rounded-xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('PLAY')}
            className={`py-2.5 rounded-lg text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'PLAY'
                ? 'bg-white dark:bg-dark-card text-red-600 shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Play className="w-4 h-4" /> {t('সক্রিয় ম্যাচ', 'Active Matches')} ({categoryMatches.length})
          </button>
          <button
            onClick={() => setActiveTab('RESULT')}
            className={`py-2.5 rounded-lg text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'RESULT'
                ? 'bg-white dark:bg-dark-card text-red-600 shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" /> {t('ম্যাচ ফলাফল', 'Match Results')}
          </button>
        </div>

          {/* Tab 1: PLAY (Match Cards) */}
        {activeTab === 'PLAY' && (
          <div className="pt-6 space-y-6">
            {/* Top Match Type Sub-Filter (Solo, Duo, Squad) */}
            <div className="flex items-center justify-center gap-2 max-w-lg mx-auto p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              {[
                { key: 'ALL', labelBn: 'সব ম্যাচ', labelEn: 'All' },
                { key: 'SOLO', labelBn: 'সোলো (Solo)', labelEn: 'Solo' },
                { key: 'DUO', labelBn: 'ডুও (Duo)', labelEn: 'Duo' },
                { key: 'SQUAD', labelBn: 'স্কোয়াড (Squad)', labelEn: 'Squad' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setMatchTypeFilter(item.key as any)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all text-center ${
                    matchTypeFilter === item.key
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {t(item.labelBn, item.labelEn)}
                </button>
              ))}
            </div>

            {matchDetailsScreen ? (
              <MatchDetailsPage
                match={matchDetailsScreen}
                onBack={() => setMatchDetailsScreen(null)}
                onJoinClick={(m) => {
                  setMatchDetailsScreen(null);
                  setBookingMatch(m);
                }}
                language={lang}
                isPhoneView={false}
              />
            ) : (
              <>
                {/* If matches are empty, show clean empty state */}
                {filteredCategoryMatches.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 bg-white dark:bg-dark-card space-y-4">
                    <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 mx-auto flex items-center justify-center shadow-inner">
                      <Trophy className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white">
                        {t('বর্তমানে এই ক্যাটাগরিতে কোনো সক্রিয় ম্যাচ নেই', 'No Active Matches in This Category')}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                        {matchTypeFilter !== 'ALL'
                          ? t(`এই ফিল্টারে (${matchTypeFilter}) কোনো সক্রিয় ম্যাচ পাওয়া যায়নি। অন্য ফিল্টার বেছে নিন।`, `No active matches found for this filter (${matchTypeFilter}).`)
                          : t('নতুন টুর্নামেন্ট খুব শীঘ্রই লাইভ হবে। আপনি চাইলে অ্যাডমিন প্যানেল থেকে যেকোনো সময় নতুন ম্যাচ যোগ করতে পারেন।', 'New tournaments will be live soon.')}
                      </p>
                    </div>
                    <div className="pt-2">
                      <Link
                        href="/admin"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold btn-red"
                      >
                        <PlusCircle className="w-4 h-4" /> {t('অ্যাডমিন প্যানেলে ম্যাচ তৈরি করুন', 'Create Match in Admin')}
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredCategoryMatches.map((m) => {
                      const participants = bookedParticipants[m.id] || [];
                      const filled = m.filledSlots || participants.length || 0;
                      const spotsLeft = Math.max(0, m.totalSlots - filled);

                      return (
                        <div
                          key={m.id}
                          className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#181824] p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all space-y-3.5"
                        >
                          {/* 1. Top Notice Row with Left Thumbnail (Exact Image 1) - Clickable to open Details Page */}
                          <div
                            onClick={() => setMatchDetailsScreen(m)}
                            className="flex items-start gap-3 cursor-pointer hover:opacity-90 transition-opacity"
                            title="Click to view full Details Page & Rules"
                          >
                            {/* Thumbnail on left */}
                            <div className="w-20 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-amber-950 border border-amber-500/30 flex items-center justify-center relative shadow-sm">
                              <img
                                src={m.bannerImage || '/logo.png'}
                                alt={m.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40" />
                              <span className="absolute text-[9px] font-black text-amber-300 text-center leading-tight drop-shadow px-1 uppercase">
                                {m.type}
                              </span>
                            </div>

                            {/* Notice text on right */}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-snug">
                                কাস্টমে নিজের জায়গায় বসতে হবে বাধ্যতামূলক - আইডি লেভেল ৫৫+ থাকতে হবে -
                                Normal {m.type} ম্যাচের নিয়ম পড়ে নিন, নিয়ম না মানলে রিফান্ড বা উইনিং
                                পাবেন না! {settings.siteName || 'FF RIVAL TOUR BD'}
                              </p>
                              <div className="flex items-center justify-between pt-1">
                                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                                  {formatMatchSchedule(m.time)}
                                </span>
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900/40">
                                  Details Page ➔
                                </span>
                              </div>
                            </div>
                          </div>

                      {/* 2. 6-Cell Stat Grid (Exact Image 1) */}
                      <div className="grid grid-cols-3 gap-y-2.5 gap-x-2 py-2 text-center border-t border-b border-gray-100 dark:border-white/5 bg-gray-50/70 dark:bg-white/5 rounded-xl">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-tight">
                            WIN PRIZE
                          </span>
                          <span className="font-black text-gray-900 dark:text-white text-xs sm:text-sm">
                            {m.prizePool} TK
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-tight">
                            ENTRY TYPE
                          </span>
                          <span className="font-black text-gray-900 dark:text-white text-xs sm:text-sm">
                            {m.type}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-tight">
                            ENTRY FEE
                          </span>
                          <span className="font-black text-gray-900 dark:text-white text-xs sm:text-sm">
                            {m.entryFee} TK
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-tight">
                            PER KILL
                          </span>
                          <span className="font-black text-gray-900 dark:text-white text-xs sm:text-sm">
                            {m.perKill} TK
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-tight">
                            MAP
                          </span>
                          <span className="font-black text-gray-900 dark:text-white text-xs sm:text-sm">
                            {m.map}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-tight">
                            VERSION
                          </span>
                          <span className="font-black text-gray-900 dark:text-white text-xs sm:text-sm">
                            MOBILE
                          </span>
                        </div>
                      </div>

                      {/* Room ID & Pass reveal if published */}
                      {m.roomId && (
                        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-300 font-bold flex items-center gap-1.5">
                              <Key className="w-3.5 h-3.5 text-red-600" /> Room ID:
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-red-600 bg-white dark:bg-black/40 px-2 py-0.5 rounded border border-red-200 dark:border-red-900/40">
                                {m.roomId}
                              </span>
                              <button
                                onClick={() => handleCopy(m.roomId!, `room-${m.id}`)}
                                className="text-gray-400 hover:text-red-600"
                              >
                                {copiedKey === `room-${m.id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                          {m.roomPass && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600 dark:text-gray-300 font-bold flex items-center gap-1.5">
                                <Key className="w-3.5 h-3.5 text-red-600" /> Password:
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-red-600 bg-white dark:bg-black/40 px-2 py-0.5 rounded border border-red-200 dark:border-red-900/40">
                                  {m.roomPass}
                                </span>
                                <button
                                  onClick={() => handleCopy(m.roomPass!, `pass-${m.id}`)}
                                  className="text-gray-400 hover:text-red-600"
                                >
                                  {copiedKey === `pass-${m.id}` ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 3. Progress Bar + Join Button Row (Exact Image 1) */}
                      <div className="flex items-center gap-3 pt-0.5">
                        <div className="flex-1 space-y-1">
                          <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (filled / m.totalSlots) * 100
                                )}%`,
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-gray-500 font-semibold">
                            <span>Only {spotsLeft} spots are left</span>
                            <span className="text-gray-600 dark:text-gray-300 font-bold">
                              {filled}/{m.totalSlots}
                            </span>
                          </div>
                        </div>

                        {/* Join Button (Image 1 Style) */}
                        <button
                          onClick={() => setBookingMatch(m)}
                          className="px-6 py-1.5 rounded-lg border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 font-bold text-xs hover:bg-blue-600 hover:text-white transition-all shadow-sm flex-shrink-0"
                        >
                          Join
                        </button>
                      </div>

                      {/* 4. Dual Action Buttons: Room Rules and Total Prize Details */}
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        {/* Button 1: Room Rules ➔ (Navigates directly to full Details Page) */}
                        <button
                          onClick={() => setMatchDetailsScreen(m)}
                          className="py-2 px-3 rounded-lg border border-blue-400/50 dark:border-blue-500/40 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all shadow-sm group"
                        >
                          <Key className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
                          <span>Room Rules</span>
                          <span className="text-[10px] text-blue-400 font-mono">➔</span>
                        </button>

                        {/* Button 2: Total Prize Details ⌄ (Opens Image 2 Modal) */}
                        <button
                          onClick={() => setTotalPrizeMatch(m)}
                          className="py-2 px-3 rounded-lg border border-blue-400/50 dark:border-blue-500/40 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center gap-1 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all"
                        >
                          <Trophy className="w-3.5 h-3.5 text-amber-500" />
                          <span>Total Prize Details</span>
                          <span className="text-[10px]">▼</span>
                        </button>
                      </div>

                      {/* 5. Real Live Countdown Bar */}
                      <LiveMatchCountdown
                        matchTime={m.time}
                        roomId={m.roomId}
                        status={m.status}
                      />
                    </div>
                  );
                })}
              </div>
            )}
              </>
            )}
          </div>
        )}

        {/* Tab 2: RESULT */}
        {activeTab === 'RESULT' && (
          <div className="pt-8 space-y-5">
            {completedMatches.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <Trophy className="w-12 h-12 text-gray-400 mx-auto" />
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  {t('কোনো পূর্ববর্তী ম্যাচ রেজাল্ট পাওয়া যায়নি', 'No Previous Match Results Found')}
                </h3>
                <p className="text-xs text-gray-500">
                  {t(
                    'ম্যাচ শেষ হওয়ার পর সকল কিল এবং প্রাইজপুল রেজাল্ট এখানে প্রকাশ করা হবে।',
                    'After matches conclude, all kill stats and prize pool results will be displayed here.'
                  )}
                </p>
              </div>
            ) : (
              completedMatches.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#181824] p-5 space-y-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-black text-gray-900 dark:text-white">{m.title}</h4>
                      <p className="text-[11px] text-gray-500 font-semibold">
                        {formatMatchSchedule(m.time)} • {m.type} • {m.map}
                      </p>
                    </div>
                    <span className="text-[10px] font-black px-2 py-1 rounded bg-gray-600 text-white flex-shrink-0">
                      MATCH FINISHED
                    </span>
                  </div>

                  {m.results && m.results.length > 0 ? (
                    <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-white/5">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-gray-50 dark:bg-black/30 text-gray-500 font-bold uppercase">
                          <tr>
                            <th className="p-2.5">#</th>
                            <th className="p-2.5">{t('প্লেয়ার', 'Player')}</th>
                            <th className="p-2.5 text-center">{t('কিল', 'Kills')}</th>
                            <th className="p-2.5 text-right">{t('প্রাইজ', 'Prize')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-800 dark:text-gray-200 font-bold">
                          {m.results.map((r) => (
                            <tr key={`${m.id}-${r.rank}-${r.ign}`}>
                              <td className="p-2.5">{r.rank}</td>
                              <td className="p-2.5">{r.ign}</td>
                              <td className="p-2.5 text-center text-red-600">{r.kills}</td>
                              <td className="p-2.5 text-right text-emerald-600">{r.prize} TK</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-500 font-medium">
                      {t('এই ম্যাচের বিস্তারিত রেজাল্ট খুব শীঘ্রই প্রকাশ করা হবে।', 'Detailed results for this match will be published soon.')}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* HOW TO JOIN MODAL (Dynamic from Admin) */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-dark-card rounded-2xl p-6 sm:p-8 space-y-6 border border-gray-200 dark:border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-white/10">
              <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-red-600" />
                {t('টুর্নামেন্টে কিভাবে যোগদান করবেন ?', 'How to Join Tournament?')}
              </h3>
              <button
                onClick={() => setShowHowToPlay(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video rounded-xl bg-black overflow-hidden relative">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/rrSwCskEesg"
                title="How to join tournament"
                allowFullScreen
              />
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
              {settings.howToJoinGuide}
            </div>

            <button
              onClick={() => setShowHowToPlay(false)}
              className="w-full py-3 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-all"
            >
              {t('ঠিক আছে, বুঝতে পেরেছি', 'Got it, Thanks')}
            </button>
          </div>
        </div>
      )}

      {/* 1. ROOM DETAILS MODAL ("রুম ডিটেইলস") */}
      {detailsMatch && (
        <RoomDetailsModal
          match={detailsMatch}
          onClose={() => setDetailsMatch(null)}
          onJoinClick={() => {
            const m = detailsMatch;
            setDetailsMatch(null);
            setBookingMatch(m);
          }}
        />
      )}

      {/* 2. DYNAMIC 12-TEAM SQUAD SLOT BOOKING MODAL WITH FREE FIRE UID VERIFICATION */}
      {bookingMatch && (
        <SlotBookingModal
          match={bookingMatch}
          userBalance={userBalance}
          onClose={() => setBookingMatch(null)}
          onSuccess={handleBookingSuccess}
        />
      )}

      {/* 3. TOTAL PRIZE DETAILS MODAL (Exact Image 2) */}
      {totalPrizeMatch && (
        <TotalPrizeDetailsModal
          match={totalPrizeMatch}
          onClose={() => setTotalPrizeMatch(null)}
          language={lang}
        />
      )}
    </div>
  );
}
