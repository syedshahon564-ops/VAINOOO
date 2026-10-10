'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Users,
  ShieldAlert,
  CreditCard,
  Bot,
  ArrowRight,
  Plus,
  Trash2,
  Key,
  Check,
  AlertCircle,
  FolderEdit,
  FileText,
  Settings,
  Image,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Bell,
  Radio,
  Send,
  PlayCircle,
  Cpu,
  Clock,
} from 'lucide-react';
import { useCMS, MatchItem, BannerSlide } from '@/lib/cms-store';
import ImageUploadInput from '@/components/ImageUploadInput';
import {
  generateAutomatedMatchBatch,
  getSchedulerConfig,
  saveSchedulerConfig,
  sendBroadcastNotification,
  SchedulerConfig,
} from '@/lib/match-scheduler';

export default function AdminMasterPage() {
  const {
    categories,
    matches,
    settings,
    addMatch,
    updateMatch,
    deleteMatch,
    clearAllMatches,
    updateCategory,
    updateSiteSettings,
    resetCMS,
  } = useCMS();

  const [activeTab, setActiveTab] = useState<'matches' | 'categories' | 'rules' | 'settings' | 'scheduler'>('matches');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // BOT & SCHEDULER STATE
  const [schedulerConfig, setSchedulerConfig] = useState<SchedulerConfig>(getSchedulerConfig());
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('🚨 New Tournament Starting Soon!');
  const [broadcastMessage, setBroadcastMessage] = useState('New slots have been opened for all categories. Book your squad now!');

  // MATCH CREATION FORM STATE
  const [matchCategory, setMatchCategory] = useState('classic-match');
  const [matchTitle, setMatchTitle] = useState('');
  const [matchMap, setMatchMap] = useState('Bermuda');
  const [matchType, setMatchType] = useState('Squad');
  const [matchEntryFee, setMatchEntryFee] = useState(50);
  const [matchPrizePool, setMatchPrizePool] = useState(2000);
  const [matchPerKill, setMatchPerKill] = useState(15);
  const [matchFirstPrize, setMatchFirstPrize] = useState(1000);
  const [matchSecondPrize, setMatchSecondPrize] = useState(500);
  const [matchThirdPrize, setMatchThirdPrize] = useState(200);
  const [matchTotalSlots, setMatchTotalSlots] = useState(48);
  const [matchTime, setMatchTime] = useState('Today 08:00 PM');
  const [matchBannerImage, setMatchBannerImage] = useState(
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=640'
  );
  const [matchRules, setMatchRules] = useState('');

  // ROOM CREDENTIALS FORM STATE
  const [editingRoomMatchId, setEditingRoomMatchId] = useState<string | null>(null);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [roomPassInput, setRoomPassInput] = useState('');

  // CATEGORY EDIT STATE
  const [selectedCatSlug, setSelectedCatSlug] = useState('classic-match');
  const activeCategory = categories[selectedCatSlug] || categories['classic-match'];
  const [catName, setCatName] = useState(activeCategory?.name || '');
  const [catSection, setCatSection] = useState(activeCategory?.section || '');
  const [catBannerImage, setCatBannerImage] = useState(activeCategory?.bannerImage || '');
  const [catAvatarImage, setCatAvatarImage] = useState(activeCategory?.avatarImage || '');
  const [catDescription, setCatDescription] = useState(activeCategory?.description || '');
  const [catCustomRules, setCatCustomRules] = useState(activeCategory?.customRules || '');

  // When changing category in dropdown, load its values
  const handleSelectCategoryToEdit = (slug: string) => {
    setSelectedCatSlug(slug);
    const cat = categories[slug];
    if (cat) {
      setCatName(cat.name);
      setCatSection(cat.section);
      setCatBannerImage(cat.bannerImage);
      setCatAvatarImage(cat.avatarImage);
      setCatDescription(cat.description);
      setCatCustomRules(cat.customRules || '');
    }
  };

  // RULES & NOTICE FORM STATE
  const [noticeText, setNoticeText] = useState(settings.noticeText);
  const [defaultRules, setDefaultRules] = useState(settings.defaultRules);
  const [howToJoinGuide, setHowToJoinGuide] = useState(settings.howToJoinGuide);
  const [telegramUrl, setTelegramUrl] = useState(settings.telegramUrl);
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber);

  // SITE SETTINGS FORM STATE
  const [siteName, setSiteName] = useState(settings.siteName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [siteLogo, setSiteLogo] = useState(settings.logoUrl || '/logo.png');
  const [bkashNumber, setBkashNumber] = useState(settings.bkashNumber);
  const [nagadNumber, setNagadNumber] = useState(settings.nagadNumber);
  const [apkDownloadUrl, setApkDownloadUrl] = useState(settings.apkDownloadUrl || '');
  const [customPin, setCustomPin] = useState('7860');
  const [bannerSlidesList, setBannerSlidesList] = useState<BannerSlide[]>(settings.banners || []);

  // Synchronize category form fields whenever selectedCatSlug or categories updates
  useEffect(() => {
    const cat = categories[selectedCatSlug];
    if (cat) {
      setCatName(cat.name || '');
      setCatSection(cat.section || '');
      setCatBannerImage(cat.bannerImage || '');
      setCatAvatarImage(cat.avatarImage || '');
      setCatDescription(cat.description || '');
      setCatCustomRules(cat.customRules || '');
    }
  }, [selectedCatSlug, categories]);

  // Synchronize site settings & rules whenever CMS settings loads or updates
  useEffect(() => {
    if (settings) {
      setNoticeText(settings.noticeText || '');
      setDefaultRules(settings.defaultRules || '');
      setHowToJoinGuide(settings.howToJoinGuide || '');
      setTelegramUrl(settings.telegramUrl || '');
      setWhatsappNumber(settings.whatsappNumber || '');
      setSiteName(settings.siteName || '');
      setTagline(settings.tagline || '');
      setSiteLogo(settings.logoUrl || '/logo.png');
      setBkashNumber(settings.bkashNumber || '');
      setNagadNumber(settings.nagadNumber || '');
      setApkDownloadUrl(settings.apkDownloadUrl || '');
      if (settings.banners && settings.banners.length > 0) {
        setBannerSlidesList(settings.banners);
      }
      const savedPin = localStorage.getItem('ff_admin_custom_pin_v1') || '7860';
      setCustomPin(savedPin);
    }
  }, [settings]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  // BOT BATCH GENERATOR HANDLER
  const handleTriggerBotBatch = (clearExisting: boolean = false) => {
    setIsGeneratingBatch(true);
    try {
      const result = generateAutomatedMatchBatch({ clearExisting });
      sendBroadcastNotification(
        '🤖 New Tournaments Live!',
        'Autonomous Bot has scheduled fresh matches across all 6 categories. Book your slot now!'
      );
      const updated: SchedulerConfig = {
        ...schedulerConfig,
        lastRunTimestamp: new Date().toLocaleTimeString('en-US'),
        batchCount: (schedulerConfig.batchCount || 0) + 1,
      };
      setSchedulerConfig(updated);
      saveSchedulerConfig(updated);
      showToast(
        `Bot successfully generated ${result.createdCount} new matches and dispatched push alerts!`,
        'success'
      );
    } catch (err) {
      showToast('Failed to generate matches', 'error');
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  const handleSaveSchedulerSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSchedulerConfig(schedulerConfig);
    showToast('Bot scheduling configuration saved successfully!');
  };

  const handleSendCustomBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    sendBroadcastNotification(broadcastTitle, broadcastMessage);
    showToast('Push alert broadcast dispatched to mobile players!');
    setBroadcastTitle('');
    setBroadcastMessage('');
  };

  // 1. HANDLE CREATE MATCH
  const isMatchLoneWolf = matchCategory === 'lone-wolf';
  const isMatchClashSquad = matchCategory === 'clash-squad' || matchCategory === 'cs-only-headshot';

  const handleSelectMatchCategory = (slug: string) => {
    setMatchCategory(slug);
    const cat = categories[slug];
    if (cat?.bannerImage) {
      setMatchBannerImage(cat.bannerImage);
    }
    if (slug === 'lone-wolf') {
      setMatchType('1 vs 1');
      setMatchTotalSlots(2);
      setMatchMap('Iron Cage');
      setMatchPerKill(0);
      setMatchSecondPrize(0);
      setMatchThirdPrize(0);
      const pool = Math.max(10, Math.round(matchEntryFee * 2 * 0.85));
      setMatchPrizePool(pool);
      setMatchFirstPrize(pool);
    } else if (slug === 'clash-squad' || slug === 'cs-only-headshot') {
      setMatchType('4 vs 4');
      setMatchTotalSlots(8);
      setMatchMap('Bermuda');
      setMatchPerKill(0);
      setMatchSecondPrize(0);
      setMatchThirdPrize(0);
      const pool = Math.max(20, Math.round(matchEntryFee * 8 * 0.75));
      setMatchPrizePool(pool);
      setMatchFirstPrize(pool);
    } else {
      setMatchType('Squad');
      setMatchTotalSlots(48);
      setMatchMap('Bermuda');
    }
  };

  const handleSelectMatchType = (newType: string) => {
    setMatchType(newType);
    if (matchCategory === 'lone-wolf') {
      const slots = newType === '2 vs 2' ? 4 : 2;
      setMatchTotalSlots(slots);
      const pool = Math.max(10, Math.round(matchEntryFee * slots * 0.85));
      setMatchPrizePool(pool);
      setMatchFirstPrize(pool);
      setMatchSecondPrize(0);
      setMatchThirdPrize(0);
      setMatchPerKill(0);
    } else if (matchCategory === 'clash-squad' || matchCategory === 'cs-only-headshot') {
      const slots = newType === '1 vs 1' ? 2 : newType === '2 vs 2' ? 4 : 8;
      setMatchTotalSlots(slots);
      const pool = Math.max(10, Math.round(matchEntryFee * slots * 0.8));
      setMatchPrizePool(pool);
      setMatchFirstPrize(pool);
      setMatchSecondPrize(0);
      setMatchThirdPrize(0);
      setMatchPerKill(0);
    } else {
      if (newType === 'Squad' || newType === 'Solo' || newType === 'Duo') setMatchTotalSlots(48);
      else if (newType === '4 vs 4') setMatchTotalSlots(8);
      else if (newType === '1 vs 1') setMatchTotalSlots(2);
      else if (newType === '2 vs 2') setMatchTotalSlots(4);
    }
  };

  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchTitle.trim()) {
      showToast('Please provide a match name or title', 'error');
      return;
    }

    const isSingle = matchCategory === 'lone-wolf' || matchCategory === 'clash-squad' || matchCategory === 'cs-only-headshot';
    const finalPerKill = isSingle ? 0 : Number(matchPerKill);
    const finalFirstPrize = isSingle ? Number(matchPrizePool) : Number(matchFirstPrize);
    const finalSecondPrize = isSingle ? 0 : Number(matchSecondPrize);
    const finalThirdPrize = isSingle ? 0 : Number(matchThirdPrize);
    let finalSlots = Number(matchTotalSlots);
    if (matchCategory === 'lone-wolf') {
      finalSlots = matchType === '2 vs 2' ? 4 : 2;
    } else if (matchCategory === 'clash-squad' || matchCategory === 'cs-only-headshot') {
      finalSlots = matchType === '1 vs 1' ? 2 : matchType === '2 vs 2' ? 4 : 8;
    }

    addMatch({
      categorySlug: matchCategory,
      title: matchTitle,
      map: matchMap,
      type: matchType,
      time: matchTime,
      entryFee: Number(matchEntryFee),
      prizePool: Number(matchPrizePool),
      perKill: finalPerKill,
      firstPrize: finalFirstPrize,
      secondPrize: finalSecondPrize,
      thirdPrize: finalThirdPrize,
      totalSlots: finalSlots,
      bannerImage: matchBannerImage,
      rules: matchRules,
    });

    showToast(`New match "${matchTitle}" created successfully!`);
    setMatchTitle('');
    setMatchRules('');
  };

  // 2. HANDLE PUBLISH ROOM ID & PASS
  const handleSaveRoomPass = (matchId: string) => {
    updateMatch(matchId, {
      roomId: roomIdInput,
      roomPass: roomPassInput,
      status: 'ROOM_OPEN',
    });
    setEditingRoomMatchId(null);
    setRoomIdInput('');
    setRoomPassInput('');
    showToast('Room ID & password published and sent to players!');
  };

  // 3. HANDLE DELETE MATCH
  const handleDeleteMatch = (matchId: string, title: string) => {
    if (confirm(`Are you sure you want to delete the match "${title}"?`)) {
      deleteMatch(matchId);
      showToast('Match deleted successfully!');
    }
  };

  // 4. HANDLE CLEAR ALL MATCHES (Empty state)
  const handleClearAll = () => {
    if (
      confirm(
        '⚠️ Are you sure you want to delete all matches across all categories? (This will clear the entire match list)'
      )
    ) {
      clearAllMatches();
      showToast('All matches cleared successfully! The match list is now empty.');
    }
  };

  // 5. HANDLE SAVE CATEGORY
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    updateCategory(selectedCatSlug, {
      name: catName,
      section: catSection,
      bannerImage: catBannerImage,
      avatarImage: catAvatarImage,
      description: catDescription,
      customRules: catCustomRules,
    });
    showToast(`Category "${catName}" updated successfully!`);
  };

  // 6. HANDLE SAVE RULES
  const handleSaveRules = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteSettings({
      noticeText,
      defaultRules,
      howToJoinGuide,
      telegramUrl,
      whatsappNumber,
    });
    showToast('Tournament rules & announcements saved successfully!');
  };

  // 7. HANDLE SAVE SITE SETTINGS
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteSettings({
      siteName,
      tagline,
      logoUrl: siteLogo,
      bkashNumber,
      nagadNumber,
      telegramUrl,
      whatsappNumber,
      apkDownloadUrl,
      banners: bannerSlidesList,
    });
    if (customPin && customPin.trim().length >= 4) {
      localStorage.setItem('ff_admin_custom_pin_v1', customPin.trim());
    }
    showToast('Site settings, logo, payment numbers, and banner slider saved successfully!');
  };

  const categoriesList = Object.values(categories);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold transition-all animate-bounce ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-white/10">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-red-600" />
            Admin Master Control Panel (Dynamic CMS)
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Create, edit, and delete matches. Customize categories and banners. Manage universal rules and notices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearAll}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-red-100 dark:bg-red-950/60 text-red-600 hover:bg-red-200 transition-all border border-red-200 dark:border-red-900 flex items-center gap-1.5"
            title="Click to delete all matches across all categories"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All Matches ({matches.length})
          </button>

          <Link
            href="/"
            target="_blank"
            className="px-3 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-200 transition-all flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Site Preview
          </Link>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#12121a] border border-gray-200 dark:border-white/10 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-gray-500">Total Categories</span>
          <div className="text-2xl font-black text-red-600">{categoriesList.length}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#12121a] border border-gray-200 dark:border-white/10 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-gray-500">Active Matches</span>
          <div className="text-2xl font-black text-emerald-600">{matches.length}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#12121a] border border-gray-200 dark:border-white/10 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-gray-500">Site Name</span>
          <div className="text-sm font-black text-gray-900 dark:text-white truncate">
            {settings.siteName}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#12121a] border border-gray-200 dark:border-white/10 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-gray-500">Live Notice Bar</span>
          <div className="text-xs font-bold text-amber-500 truncate">Active 24/7</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 dark:border-white/10 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('matches')}
          className={`px-4 py-3 text-xs font-black flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'matches'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" /> 🎮 Match Management ({matches.length})
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-3 text-xs font-black flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'categories'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <FolderEdit className="w-4 h-4" /> 📁 Category & Image Editor
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-3 text-xs font-black flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'rules'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" /> 📜 Tournament Rules & Notices
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-3 text-xs font-black flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" /> ⚙️ Site Settings & Branding
        </button>

        <button
          onClick={() => setActiveTab('scheduler')}
          className={`px-4 py-3 text-xs font-black flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'scheduler'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Bot className="w-4 h-4 text-amber-500" /> 🤖 Auto Scheduler Bot
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: MATCH MANAGEMENT (CREATE, EDIT, DELETE, INJECT PASS)    */}
      {/* ============================================================== */}
      {activeTab === 'matches' && (
        <div className="space-y-8">
          {/* Quick Bot Generator Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950 via-slate-900 to-black border border-red-500/30 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600/30 text-red-400 border border-red-500/30 text-[10px] font-black uppercase">
                <Bot className="w-3.5 h-3.5" /> Autonomous Match Dispatcher Bot
              </div>
              <h3 className="text-base font-black">
                One-Click Batch Tournament Generator for All 6 Categories
              </h3>
              <p className="text-xs text-gray-400 max-w-xl">
                No need to create matches manually one by one. With one click, Classic (Squad 12 Teams, Solo, Duo), Clash Squad 4v4, Lone Wolf, Lost to Win, and CS Only Headshot matches are generated automatically.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => handleTriggerBotBatch(false)}
                disabled={isGeneratingBatch}
                className="px-5 py-3 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                {isGeneratingBatch ? 'Generating Matches...' : '⚡ Generate New Match Batch'}
              </button>
            </div>
          </div>

          {/* Create Match Form */}
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 space-y-4 shadow-sm">
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-red-600" />
              Add New Match
            </h3>
            <p className="text-xs text-gray-500">
              Add a new custom match to any category. Define map, slots, entry fee, prize pool, and custom rules.
            </p>

            <form onSubmit={handleCreateMatch} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Category Selector */}
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Select Category
                  </label>
                  <select
                    value={matchCategory}
                    onChange={(e) => handleSelectMatchCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-red-500"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>
                        {cat.name} ({cat.section})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Match Title */}
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Match Name / Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      isMatchLoneWolf
                        ? 'e.g. Lone Wolf 1v1 Iron Cage Duel #1'
                        : isMatchClashSquad
                        ? 'e.g. Clash Squad 4v4 Bermuda Battle #1'
                        : 'e.g. Match #101 • Bermuda Squad Tournament'
                    }
                    value={matchTitle}
                    onChange={(e) => setMatchTitle(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Match Time */}
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Match Schedule (Time)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Today 08:30 PM"
                    value={matchTime}
                    onChange={(e) => setMatchTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Map Type */}
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Map
                  </label>
                  <select
                    value={matchMap}
                    onChange={(e) => setMatchMap(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-red-500"
                  >
                    <option value="Iron Cage">Iron Cage</option>
                    <option value="Bermuda">Bermuda</option>
                    <option value="Purgatory">Purgatory</option>
                    <option value="Kalahari">Kalahari</option>
                    <option value="Alpine">Alpine</option>
                    <option value="NexTerra">NexTerra</option>
                  </select>
                </div>

                {/* Mode Type */}
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Mode / Type
                  </label>
                  <select
                    value={matchType}
                    onChange={(e) => handleSelectMatchType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-red-500"
                  >
                    {isMatchLoneWolf ? (
                      <>
                        <option value="1 vs 1">1 vs 1 (Solo)</option>
                        <option value="2 vs 2">2 vs 2 (Duo)</option>
                      </>
                    ) : isMatchClashSquad ? (
                      <>
                        <option value="1 vs 1">1 vs 1</option>
                        <option value="2 vs 2">2 vs 2</option>
                        <option value="4 vs 4">4 vs 4 (Squad)</option>
                      </>
                    ) : (
                      <>
                        <option value="Squad">Squad</option>
                        <option value="Solo">Solo</option>
                        <option value="Duo">Duo</option>
                        <option value="4 vs 4">4 vs 4</option>
                        <option value="1 vs 1">1 vs 1</option>
                        <option value="2 vs 2">2 vs 2</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Total Slots */}
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Total Slots
                  </label>
                  <select
                    value={matchTotalSlots}
                    onChange={(e) => setMatchTotalSlots(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-red-500"
                  >
                    {isMatchLoneWolf ? (
                      <>
                        <option value="2">2 Slots (1 vs 1 Solo)</option>
                        <option value="4">4 Slots (2 vs 2 Duo)</option>
                      </>
                    ) : isMatchClashSquad ? (
                      <>
                        <option value="2">2 Slots (1 vs 1)</option>
                        <option value="4">4 Slots (2 vs 2)</option>
                        <option value="8">8 Slots (4 vs 4 Squad)</option>
                      </>
                    ) : (
                      <>
                        <option value="48">48 Slots (Standard BR)</option>
                        <option value="24">24 Slots (Duo BR)</option>
                        <option value="12">12 Slots (Mini BR)</option>
                        <option value="8">8 Slots (Clash Squad)</option>
                        <option value="4">4 Slots (2 vs 2)</option>
                        <option value="2">2 Slots (1 vs 1)</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Entry Fee */}
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Entry Fee (৳)
                  </label>
                  <input
                    type="number"
                    value={matchEntryFee}
                    onChange={(e) => {
                      const fee = Number(e.target.value);
                      setMatchEntryFee(fee);
                      if (isMatchLoneWolf) {
                        const slots = matchType === '2 vs 2' ? 4 : 2;
                        const pool = Math.max(10, Math.round(fee * slots * 0.85));
                        setMatchPrizePool(pool);
                        setMatchFirstPrize(pool);
                      } else if (isMatchClashSquad) {
                        const slots = matchType === '1 vs 1' ? 2 : matchType === '2 vs 2' ? 4 : 8;
                        const pool = Math.max(10, Math.round(fee * slots * 0.8));
                        setMatchPrizePool(pool);
                        setMatchFirstPrize(pool);
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Prize Pool Breakdown */}
              {isMatchLoneWolf || isMatchClashSquad ? (
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5 space-y-2">
                  <label className="text-xs font-bold text-emerald-600 block">
                    {isMatchLoneWolf ? 'Winning Prize Pool (৳)' : 'Winning Team Prize Pool (৳)'}
                  </label>
                  <input
                    type="number"
                    value={matchPrizePool}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setMatchPrizePool(val);
                      setMatchFirstPrize(val);
                      setMatchSecondPrize(0);
                      setMatchThirdPrize(0);
                      setMatchPerKill(0);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 text-xs font-bold focus:outline-none"
                  />
                  <p className="text-[11px] text-gray-500">
                    {isMatchLoneWolf
                      ? '💡 Lone Wolf mode awards the full winning prize to the winner (1v1 or 2v2). No Per Kill or 2nd/3rd position cuts.'
                      : '💡 Clash Squad mode awards the entire prize pool to the winning team. No Per Kill fees.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5">
                  <div>
                    <label className="text-xs font-bold text-emerald-600 block mb-1">
                      Total Prize Pool (৳)
                    </label>
                    <input
                      type="number"
                      value={matchPrizePool}
                      onChange={(e) => setMatchPrizePool(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 text-xs font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-blue-600 block mb-1">
                      Per Kill Reward (৳)
                    </label>
                    <input
                      type="number"
                      value={matchPerKill}
                      onChange={(e) => setMatchPerKill(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 text-xs font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-600 block mb-1">
                      1st Prize (৳)
                    </label>
                    <input
                      type="number"
                      value={matchFirstPrize}
                      onChange={(e) => setMatchFirstPrize(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 text-xs font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">
                      2nd & 3rd Prize (৳)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="2nd"
                        value={matchSecondPrize}
                        onChange={(e) => setMatchSecondPrize(Number(e.target.value))}
                        className="w-1/2 px-2 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 text-xs font-bold focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder="3rd"
                        value={matchThirdPrize}
                        onChange={(e) => setMatchThirdPrize(Number(e.target.value))}
                        className="w-1/2 px-2 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 text-xs font-bold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Match Banner Image with File Upload & Preview */}
              <ImageUploadInput
                label="Match Banner Image"
                value={matchBannerImage}
                onChange={setMatchBannerImage}
                helperText="Upload PNG, JPG, WEBP file or paste an image URL"
                previewHeight="h-40"
              />

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl text-xs font-black btn-red shadow-lg shadow-red-600/30 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Publish New Match
                </button>
              </div>
            </form>
          </div>

          {/* Active Matches List */}
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-white/10">
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                  Active Tournaments ({matches.length})
                </h3>
                <p className="text-xs text-gray-500">
                  Publish Room ID & Password for players, or remove completed matches.
                </p>
              </div>
            </div>

            {matches.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-gray-300 dark:border-white/10 text-gray-400 space-y-2">
                <Trophy className="w-10 h-10 mx-auto text-gray-400" />
                <p className="text-xs font-bold text-gray-600 dark:text-gray-300">
                  No matches currently scheduled (Match list is empty)
                </p>
                <p className="text-[11px] text-gray-500">
                  Use the form above or the Bot Generator to add tournaments anytime.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-white/5 space-y-3">
                {matches.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl border border-gray-200 dark:border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      {m.bannerImage && (
                        <div className="w-16 h-14 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                          <img
                            src={m.bannerImage}
                            alt={m.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-600 uppercase">
                            {categories[m.categorySlug]?.name || m.categorySlug}
                          </span>
                          <span className="text-[10px] font-bold text-gray-500">
                            {m.type} • {m.map}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-gray-900 dark:text-white mt-0.5">
                          {m.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="text-red-600 font-bold">Fee: ৳{m.entryFee}</span>
                          <span className="text-emerald-600 font-bold">Prize: ৳{m.prizePool}</span>
                          <span>Time: {m.time}</span>
                          {m.roomId && (
                            <span className="font-mono text-emerald-500 font-bold">
                              Room: {m.roomId} / {m.roomPass}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => {
                          setEditingRoomMatchId(m.id);
                          setRoomIdInput(m.roomId || '');
                          setRoomPassInput(m.roomPass || '');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 text-gray-800 dark:text-gray-200 text-xs font-bold flex items-center gap-1.5"
                      >
                        <Key className="w-3.5 h-3.5 text-amber-500" /> Room Credentials
                      </button>

                      <button
                        onClick={() => handleDeleteMatch(m.id, m.title)}
                        className="p-2 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-100 transition-colors"
                        title="Delete this match"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: CATEGORY MANAGER (NAME, BANNER, AVATAR, RULES)         */}
      {/* ============================================================== */}
      {activeTab === 'categories' && (
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <FolderEdit className="w-5 h-5 text-red-600" />
              Category & Image Editor
            </h3>
            <p className="text-xs text-gray-500">
              Customize title, section heading, banner artwork, and circular thumbnail icons for each category.
            </p>
          </div>

          {/* Select Category to edit */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {categoriesList.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => handleSelectCategoryToEdit(cat.slug)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  selectedCatSlug === cat.slug
                    ? 'border-red-600 bg-red-50 dark:bg-red-950/40 ring-2 ring-red-500'
                    : 'border-gray-200 dark:border-white/10 hover:border-red-400 bg-gray-50 dark:bg-black/20'
                }`}
              >
                <div className="w-10 h-10 rounded-full mx-auto overflow-hidden mb-1.5 border border-white/20">
                  <img src={cat.avatarImage} alt={cat.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-[11px] font-black block truncate text-gray-900 dark:text-white">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>

          {/* Category Edit Form */}
          <form onSubmit={handleSaveCategory} className="space-y-4 pt-4 border-t border-gray-200 dark:border-white/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Section Header
                </label>
                <input
                  type="text"
                  required
                  value={catSection}
                  onChange={(e) => setCatSection(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Banner Image with Upload */}
              <ImageUploadInput
                label="Main Banner Image"
                value={catBannerImage}
                onChange={setCatBannerImage}
                helperText="Upload category page high-resolution banner image"
                previewHeight="h-32"
              />

              {/* Avatar Icon with Upload */}
              <ImageUploadInput
                label="Thumbnail Icon (Circular)"
                value={catAvatarImage}
                onChange={setCatAvatarImage}
                helperText="Circular thumbnail icon shown on home screen"
                isCircular={true}
              />
            </div>

            {/* Custom rules for this category */}
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Custom Category Rules
              </label>
              <textarea
                rows={3}
                placeholder="Specific rules or tournament guidelines for this category..."
                value={catCustomRules}
                onChange={(e) => setCatCustomRules(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-medium focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl text-xs font-black btn-red shadow-md shadow-red-600/20"
              >
                Save Category Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: RULES & NOTICE MANAGER                                  */}
      {/* ============================================================== */}
      {activeTab === 'rules' && (
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-600" />
              Tournament Rules & Notices Manager
            </h3>
            <p className="text-xs text-gray-500">
              Update top live marquee announcement and universal tournament participation rules.
            </p>
          </div>

          <form onSubmit={handleSaveRules} className="space-y-5">
            {/* Notice Bar Text */}
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Top Marquee Announcement Text
              </label>
              <textarea
                rows={2}
                value={noticeText}
                onChange={(e) => setNoticeText(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-medium focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Global 18+ Rules */}
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Universal Tournament Rules (18+)
              </label>
              <textarea
                rows={7}
                value={defaultRules}
                onChange={(e) => setDefaultRules(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-medium leading-relaxed focus:outline-none focus:border-red-500"
              />
            </div>

            {/* How to Join Guide */}
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                How to Join Guide
              </label>
              <textarea
                rows={4}
                value={howToJoinGuide}
                onChange={(e) => setHowToJoinGuide(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-medium leading-relaxed focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Telegram Community Link
                </label>
                <input
                  type="text"
                  value={telegramUrl}
                  onChange={(e) => setTelegramUrl(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-mono focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  WhatsApp Support Number
                </label>
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-mono focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl text-xs font-black btn-red shadow-md shadow-red-600/20"
              >
                Save Rules & Notices
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: SITE SETTINGS & BRANDING                                */}
      {/* ============================================================== */}
      {activeTab === 'settings' && (
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-red-600" />
              Site Settings & Branding
            </h3>
            <p className="text-xs text-gray-500">
              Customize website title, tagline, payment accounts, APK download URL, and admin security PIN.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Website / App Title
                </label>
                <input
                  type="text"
                  required
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  required
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Official bKash Number (For receiving deposits)
                </label>
                <input
                  type="text"
                  value={bkashNumber}
                  onChange={(e) => setBkashNumber(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-mono focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Official Nagad Number
                </label>
                <input
                  type="text"
                  value={nagadNumber}
                  onChange={(e) => setNagadNumber(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-mono focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Official Telegram Support / Channel URL
                </label>
                <input
                  type="url"
                  placeholder="https://t.me/yourchannel"
                  value={telegramUrl}
                  onChange={(e) => setTelegramUrl(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-mono focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Official WhatsApp Helpline Number
                </label>
                <input
                  type="text"
                  placeholder="01XXXXXXXXX"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-mono focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Android APK Download URL */}
            <div className="pt-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Android App APK Download URL (Google Drive / Direct Link)
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/... or https://yourdomain.com/app.apk"
                value={apkDownloadUrl}
                onChange={(e) => setApkDownloadUrl(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-mono focus:outline-none focus:border-red-500"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Upload your production APK to Google Drive, MediaFire, or server storage and provide the direct download link here for players.
              </p>
            </div>

            {/* Owner Security PIN */}
            <div className="pt-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                🔐 Owner Secret Access PIN
              </label>
              <input
                type="text"
                placeholder="4-8 digit PIN (Default: 7860)"
                value={customPin}
                onChange={(e) => setCustomPin(e.target.value)}
                className="w-full sm:w-64 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-mono font-bold tracking-widest focus:outline-none focus:border-red-500"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                This secret PIN protects the admin panel from unauthorized access. Change and save whenever needed.
              </p>
            </div>

            {/* Site Logo Upload with Preview */}
            <div className="pt-2">
              <ImageUploadInput
                label="Site Logo Image"
                value={siteLogo}
                onChange={setSiteLogo}
                helperText="Upload transparent background logo (PNG, JPG, WEBP)"
                previewHeight="h-28"
              />
            </div>

            {/* Banner Carousel Slider Management */}
            <div className="pt-4 border-t border-gray-200 dark:border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Image className="w-4 h-4 text-amber-500" />
                    Home Banner Carousel Manager
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Add or modify interactive promotional banner slides displayed on mobile app and web homepage.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const newSlide: BannerSlide = {
                      id: `slide-${Date.now()}`,
                      badge: 'NEW EVENT',
                      title: 'New Mega Tournament Live!',
                      subtitle: 'Withdraw winnings directly via bKash & Nagad.',
                      image: '/logo.png',
                      actionText: 'Join Now',
                      actionUrl: telegramUrl || 'https://t.me/ffrivaltourbd',
                    };
                    setBannerSlidesList((prev) => [...prev, newSlide]);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Slide</span>
                </button>
              </div>

              <div className="space-y-4">
                {bannerSlidesList.map((slide, idx) => (
                  <div
                    key={slide.id || idx}
                    className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                        Banner Slide #{idx + 1}
                      </span>
                      {bannerSlidesList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setBannerSlidesList((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          className="text-red-500 hover:text-red-400 text-xs flex items-center gap-1 font-bold"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                          Badge Text
                        </label>
                        <input
                          type="text"
                          value={slide.badge}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBannerSlidesList((prev) =>
                              prev.map((s, i) => (i === idx ? { ...s, badge: val } : s))
                            );
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/30 text-xs font-bold"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={slide.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBannerSlidesList((prev) =>
                              prev.map((s, i) => (i === idx ? { ...s, title: val } : s))
                            );
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/30 text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                        Subtitle / Description
                      </label>
                      <input
                        type="text"
                        value={slide.subtitle}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBannerSlidesList((prev) =>
                            prev.map((s, i) => (i === idx ? { ...s, subtitle: val } : s))
                          );
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/30 text-xs"
                      />
                    </div>

                    <ImageUploadInput
                      label="Banner Image"
                      value={slide.image || '/logo.png'}
                      onChange={(imgUrl) => {
                        setBannerSlidesList((prev) =>
                          prev.map((s, i) => (i === idx ? { ...s, image: imgUrl } : s))
                        );
                      }}
                      helperText="Promotional banner image (16:9 or wide format)"
                      previewHeight="h-28"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to reset all CMS settings to factory default?')) {
                    resetCMS();
                    showToast('CMS reset to factory defaults successfully!');
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-xs font-bold hover:bg-gray-200"
              >
                Reset to Defaults
              </button>

              <button
                type="submit"
                className="px-6 py-3 rounded-xl text-xs font-black btn-red shadow-md shadow-red-600/20"
              >
                Save Site Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: AUTONOMOUS MATCH SCHEDULER & NOTIFICATION BOT          */}
      {/* ============================================================== */}
      {activeTab === 'scheduler' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-500/20 text-red-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                    Automated Match Scheduler & Push Notification Bot
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    No manual work required. The autonomous bot periodically schedules matches across all 6 categories and sends push notifications to players.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Bot Active (Autonomous)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Trigger Panel */}
          <div className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-950/40 via-slate-900 to-black p-6 space-y-4 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
                <Sparkles className="w-4 h-4" />
                Instant Batch Tournament Generator
              </div>
              <span className="text-[10px] text-gray-400 font-mono">
                Last Run: {schedulerConfig.lastRunTimestamp || 'Ran recently'}
              </span>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Click the button below to instantly schedule fresh matches for <strong>Classic (Squad 12 Teams, Solo, Duo)</strong>, <strong>Clash Squad 4v4</strong>, <strong>Lone Wolf</strong>, <strong>Lost to Win</strong>, and <strong>CS Only Headshot</strong> categories and notify all registered players.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleTriggerBotBatch(false)}
                disabled={isGeneratingBatch}
                className="px-6 py-3 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                {isGeneratingBatch ? 'Generating Matches...' : '⚡ Append New Match Batch'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('⚠️ Are you sure you want to clear existing matches and generate a completely fresh batch?')) {
                    handleTriggerBotBatch(true);
                  }
                }}
                disabled={isGeneratingBatch}
                className="px-5 py-3 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-gray-200 border border-white/10 flex items-center gap-2 transition-all"
              >
                <RefreshCw className="w-4 h-4 text-red-400" />
                <span>Clear All & Generate Fresh Batch</span>
              </button>
            </div>
          </div>

          {/* Configuration Grid: Timer Schedule + Push Notification */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Schedule Interval Config */}
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-white/10">
                <Clock className="w-4 h-4 text-red-600" />
                <h4 className="text-sm font-black text-gray-900 dark:text-white">
                  Automated Scheduling Interval
                </h4>
              </div>

              <form onSubmit={handleSaveSchedulerSettings} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    How often should the bot generate new tournaments?
                  </label>
                  <select
                    value={schedulerConfig.intervalHours}
                    onChange={(e) =>
                      setSchedulerConfig({
                        ...schedulerConfig,
                        intervalHours: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-red-500"
                  >
                    <option value={2}>Every 2 Hours</option>
                    <option value={4}>Every 4 Hours (Recommended)</option>
                    <option value={6}>Every 6 Hours</option>
                    <option value={12}>Every 12 Hours</option>
                    <option value={24}>Every 24 Hours (Daily)</option>
                  </select>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Fresh tournaments will automatically roll out in the background once the timer interval expires.
                  </p>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5">
                  <input
                    type="checkbox"
                    id="autoEnabled"
                    checked={schedulerConfig.autoEnabled}
                    onChange={(e) =>
                      setSchedulerConfig({
                        ...schedulerConfig,
                        autoEnabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                  />
                  <label htmlFor="autoEnabled" className="text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                    Enable Autonomous Background Match Bot
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-xs font-bold btn-red shadow-md shadow-red-600/20"
                >
                  Save Schedule Settings
                </button>
              </form>
            </div>

            {/* 2. Push Notification Dispatcher */}
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-white/10">
                <Bell className="w-4 h-4 text-amber-500" />
                <h4 className="text-sm font-black text-gray-900 dark:text-white">
                  Mobile App Push Notification Broadcaster
                </h4>
              </div>

              <form onSubmit={handleSendCustomBroadcast} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Notification Title
                  </label>
                  <input
                    type="text"
                    required
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. 📢 New Mega Tournament Live!"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Notification Message
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Enter broadcast message for mobile players..."
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-xs font-black bg-amber-500 text-black hover:bg-amber-400 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Push Alert to Mobile Players</span>
                </button>
              </form>
            </div>
          </div>

          {/* Spectator Bot Architecture & Explanation */}
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 space-y-4 shadow-sm">
            <h4 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-red-600" />
              How the Autonomous Match Engine Works (Technical Architecture)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600 dark:text-gray-300">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 space-y-2">
                <span className="font-bold text-red-500 block">1. ADB Spectator Join</span>
                <p className="leading-relaxed">
                  The bot operates inside an Android emulator (BlueStacks / LDPlayer). When a tournament starts, it automatically injects the Room ID and Password to enter the spectator slot.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 space-y-2">
                <span className="font-bold text-emerald-500 block">2. Vision OCR Kill-Feed Reader</span>
                <p className="leading-relaxed">
                  During gameplay, PaddleOCR reads the top-right kill-feed in real time, detecting killer and victim IGNs and syncing kill counts directly to the database.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 space-y-2">
                <span className="font-bold text-blue-500 block">3. Automatic Booyah & Payout</span>
                <p className="leading-relaxed">
                  Detects the final "BOOYAH!" victory screen, transfers cash rewards directly to the winner and top killers wallets, and updates the tournament leaderboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ROOM PASS INJECT MODAL                                         */}
      {/* ============================================================== */}
      {editingRoomMatchId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#161622] rounded-2xl p-6 space-y-4 border border-gray-200 dark:border-white/10 shadow-2xl">
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-red-600" />
              Publish Room ID & Password
            </h3>
            <p className="text-xs text-gray-500">
              These credentials will automatically become visible to joined players 15 minutes before match start.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Custom Room ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9948210"
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-xs font-mono font-bold focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Room Password
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1234"
                  value={roomPassInput}
                  onChange={(e) => setRoomPassInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-xs font-mono font-bold focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setEditingRoomMatchId(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs font-bold hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveRoomPass(editingRoomMatchId)}
                className="px-5 py-2 rounded-xl text-xs font-black btn-red shadow-md"
              >
                Publish Credentials
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
