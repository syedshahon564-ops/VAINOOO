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
import { useCMS, MatchItem } from '@/lib/cms-store';
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
  const [broadcastTitle, setBroadcastTitle] = useState('🚨 নতুন টুর্নামেন্ট শুরু হতে যাচ্ছে!');
  const [broadcastMessage, setBroadcastMessage] = useState('সব ক্যাটাগরির জন্য নতুন স্লট উন্মুক্ত করা হয়েছে। এখনই আপনার স্কোয়াড বুক করুন!');

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
        '🤖 নতুন টুর্নামেন্ট লাইভ!',
        'স্বয়ংক্রিয় বট সব ৬টি ক্যাটাগরির ফ্রেশ টুর্নামেন্ট শিডিউল করেছে। এখনই স্লট বুক করুন!'
      );
      const updated: SchedulerConfig = {
        ...schedulerConfig,
        lastRunTimestamp: new Date().toLocaleTimeString('bn-BD'),
        batchCount: (schedulerConfig.batchCount || 0) + 1,
      };
      setSchedulerConfig(updated);
      saveSchedulerConfig(updated);
      showToast(
        `বট সফলভাবে ${result.createdCount} টি নতুন ম্যাচ তৈরি করেছে এবং নোটিফিকেশন পাঠিয়েছে!`,
        'success'
      );
    } catch (err) {
      showToast('ম্যাচ জেনারেট করতে সমস্যা হয়েছে', 'error');
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  const handleSaveSchedulerSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSchedulerConfig(schedulerConfig);
    showToast('বট শিডিউলিং কনফিগারেশন সফলভাবে আপডেট হয়েছে!');
  };

  const handleSendCustomBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    sendBroadcastNotification(broadcastTitle, broadcastMessage);
    showToast('মোবাইল অ্যাপ ব্যবহারকারীদের কাছে পুশ অ্যালার্ট পাঠানো হয়েছে!');
    setBroadcastTitle('');
    setBroadcastMessage('');
  };

  // 1. HANDLE CREATE MATCH
  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchTitle.trim()) {
      showToast('ম্যাচের একটি নাম বা টাইটেল দিন', 'error');
      return;
    }

    addMatch({
      categorySlug: matchCategory,
      title: matchTitle,
      map: matchMap,
      type: matchType,
      time: matchTime,
      entryFee: Number(matchEntryFee),
      prizePool: Number(matchPrizePool),
      perKill: Number(matchPerKill),
      firstPrize: Number(matchFirstPrize),
      secondPrize: Number(matchSecondPrize),
      thirdPrize: Number(matchThirdPrize),
      totalSlots: Number(matchTotalSlots),
      bannerImage: matchBannerImage,
      rules: matchRules,
    });

    showToast(`নতুন ম্যাচ "${matchTitle}" সফলভাবে তৈরি হয়েছে!`);
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
    showToast('রুম আইডি ও পাসওয়ার্ড সফলভাবে পাবলিশ ও প্লেয়ারদের জানানো হয়েছে!');
  };

  // 3. HANDLE DELETE MATCH
  const handleDeleteMatch = (matchId: string, title: string) => {
    if (confirm(`আপনি কি নিশ্চিত যে "${title}" ম্যাচটি মুছে ফেলতে চান?`)) {
      deleteMatch(matchId);
      showToast('ম্যাচটি সফলভাবে ডিলিট করা হয়েছে!');
    }
  };

  // 4. HANDLE CLEAR ALL MATCHES (Empty state)
  const handleClearAll = () => {
    if (
      confirm(
        '⚠️ আপনি কি নিশ্চিত যে সমস্ত ক্যাটাগরির সব ম্যাচ ডিলিট করে শূন্য করতে চান? (সবকিছু ফ্রেশ ও খালি হয়ে যাবে)'
      )
    ) {
      clearAllMatches();
      showToast('সব ম্যাচ সফলভাবে মুছে ফেলা হয়েছে! বর্তমানে কোনো ম্যাচ নেই।');
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
    showToast(`ক্যাটাগরি "${catName}" সফলভাবে আপডেট করা হয়েছে!`);
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
    showToast('টুর্নামেন্ট রুলস ও নোটিশ সফলভাবে সংরক্ষিত হয়েছে!');
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
      apkDownloadUrl,
    });
    if (customPin && customPin.trim().length >= 4) {
      localStorage.setItem('ff_admin_custom_pin_v1', customPin.trim());
    }
    showToast('সাইটের নাম, লোগো, APK লিংক ও সিক্রেট পিন সফলভাবে আপডেট হয়েছে!');
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
            অ্যাডমিন মাস্টার কন্ট্রোল প্যানেল (Full Dynamic CMS)
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            ম্যাচ তৈরি, এডিট ও ডিলিট করুন। ক্যাটাগরির নাম ও ইমেজ পরিবর্তন করুন। টুর্নামেন্টের রুলস ও নোটিশ নিয়ন্ত্রণ করুন।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearAll}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-red-100 dark:bg-red-950/60 text-red-600 hover:bg-red-200 transition-all border border-red-200 dark:border-red-900 flex items-center gap-1.5"
            title="সব ক্যাটাগরির ম্যাচ সম্পূর্ণ খালি করতে ক্লিক করুন"
          >
            <Trash2 className="w-3.5 h-3.5" /> সব ম্যাচ মুছুন ({matches.length})
          </button>

          <Link
            href="/"
            target="_blank"
            className="px-3 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-200 transition-all flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" /> সাইট প্রিভিউ
          </Link>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#12121a] border border-gray-200 dark:border-white/10 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-gray-500">মোট ক্যাটাগরি</span>
          <div className="text-2xl font-black text-red-600">{categoriesList.length}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#12121a] border border-gray-200 dark:border-white/10 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-gray-500">সক্রিয় ম্যাচ সংখ্যা</span>
          <div className="text-2xl font-black text-emerald-600">{matches.length}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#12121a] border border-gray-200 dark:border-white/10 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-gray-500">সাইটের নাম</span>
          <div className="text-sm font-black text-gray-900 dark:text-white truncate">
            {settings.siteName}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#12121a] border border-gray-200 dark:border-white/10 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-gray-500">লাইভ নোটিশ বার</span>
          <div className="text-xs font-bold text-amber-500 truncate">সক্রিয় আছে</div>
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
          <Trophy className="w-4 h-4" /> 🎮 ম্যাচ ম্যানেজমেন্ট ({matches.length})
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-3 text-xs font-black flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'categories'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <FolderEdit className="w-4 h-4" /> 📁 ক্যাটাগরি ও ইমেজ এডিটর
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-3 text-xs font-black flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'rules'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" /> 📜 টুর্নামেন্ট রুলস ও নোটিশ
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-3 text-xs font-black flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" /> ⚙️ সাইট সেটিংস ও নাম
        </button>

        <button
          onClick={() => setActiveTab('scheduler')}
          className={`px-4 py-3 text-xs font-black flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'scheduler'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Bot className="w-4 h-4 text-amber-500" /> 🤖 অটো সিডিউলার বট
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
                ৬টি ক্যাটাগরির জন্য এক-ক্লিকে স্বয়ংক্রিয় টুর্নামেন্ট তৈরি করুন
              </h3>
              <p className="text-xs text-gray-400 max-w-xl">
                হাতে একটি একটি করে ম্যাচ তৈরি করার প্রয়োজন নেই। বাটনে চাপ দিলেই Classic (Squad 12 Teams, Solo, Duo), Clash Squad, Lone Wolf, Lost to Win ও CS Only Headshot স্বয়ংক্রিয়ভাবে শিডিউল হয়ে যাবে।
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
                {isGeneratingBatch ? 'ম্যাচ তৈরি হচ্ছে...' : '⚡ নতুন ম্যাচ ব্যাচ তৈরি করুন'}
              </button>
            </div>
          </div>

          {/* Create Match Form */}
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 space-y-4 shadow-sm">
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-red-600" />
              নতুন ম্যাচ তৈরি করুন (Add New Match)
            </h3>
            <p className="text-xs text-gray-500">
              যেকোনো ক্যাটাগরিতে নতুন কাস্টম ম্যাচ যুক্ত করুন। ইমেজ, প্রাইজপুল এবং নিয়মাবলী নির্ধারণ করুন।
            </p>

            <form onSubmit={handleCreateMatch} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Category Selector */}
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    ক্যাটাগরি নির্বাচন করুন
                  </label>
                  <select
                    value={matchCategory}
                    onChange={(e) => setMatchCategory(e.target.value)}
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
                    ম্যাচের নাম / টাইটেল
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Match #101 • Bermuda Squad Tournament"
                    value={matchTitle}
                    onChange={(e) => setMatchTitle(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Match Time */}
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    ম্যাচের সময়সূচী (Time)
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
                    ম্যাপ (Map)
                  </label>
                  <select
                    value={matchMap}
                    onChange={(e) => setMatchMap(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-red-500"
                  >
                    <option value="Bermuda">Bermuda</option>
                    <option value="Purgatory">Purgatory</option>
                    <option value="Kalahari">Kalahari</option>
                    <option value="Alpine">Alpine</option>
                    <option value="NexTerra">NexTerra</option>
                    <option value="Iron Cage">Iron Cage</option>
                  </select>
                </div>

                {/* Mode Type */}
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    মোড (Type)
                  </label>
                  <select
                    value={matchType}
                    onChange={(e) => setMatchType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-red-500"
                  >
                    <option value="Squad">Squad</option>
                    <option value="Solo">Solo</option>
                    <option value="Duo">Duo</option>
                    <option value="4 vs 4">4 vs 4</option>
                    <option value="1 vs 1">1 vs 1</option>
                  </select>
                </div>

                {/* Total Slots */}
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    মোট স্লট (Slots)
                  </label>
                  <select
                    value={matchTotalSlots}
                    onChange={(e) => setMatchTotalSlots(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-red-500"
                  >
                    <option value="48">48 Slots (Standard BR)</option>
                    <option value="12">12 Slots (Mini BR)</option>
                    <option value="8">8 Slots (Clash Squad)</option>
                    <option value="2">2 Slots (1 vs 1)</option>
                  </select>
                </div>

                {/* Entry Fee */}
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    এন্ট্রি ফি (৳)
                  </label>
                  <input
                    type="number"
                    value={matchEntryFee}
                    onChange={(e) => setMatchEntryFee(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Prize Pool Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5">
                <div>
                  <label className="text-xs font-bold text-emerald-600 block mb-1">
                    মোট প্রাইজপুল (৳)
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
                    প্রতি কিল রিওয়ার্ড (৳)
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
                    ১ম পুরস্কার (৳)
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
                    ২য় ও ৩য় পুরস্কার (৳)
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

              {/* Match Banner Image with File Upload & Preview */}
              <ImageUploadInput
                label="ম্যাচ ব্যানার ইমেজ আপলোড করুন (Match Banner Image)"
                value={matchBannerImage}
                onChange={setMatchBannerImage}
                helperText="PNG, JPG, WEBP ফাইল আপলোড করুন বা লিংক দিন"
                previewHeight="h-40"
              />

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl text-xs font-black btn-red shadow-lg shadow-red-600/30 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> নতুন টুর্নামেন্ট পাবলিশ করুন
                </button>
              </div>
            </form>
          </div>

          {/* Active Matches List */}
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-white/10">
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                  বর্তমান সক্রিয় টুর্নামেন্টসমূহ ({matches.length})
                </h3>
                <p className="text-xs text-gray-500">
                  প্লেয়ারদের জন্য রুম আইডি ও পাসওয়ার্ড দিন অথবা প্রয়োজন না থাকলে ডিলিট করে দিন।
                </p>
              </div>
            </div>

            {matches.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-gray-300 dark:border-white/10 text-gray-400 space-y-2">
                <Trophy className="w-10 h-10 mx-auto text-gray-400" />
                <p className="text-xs font-bold text-gray-600 dark:text-gray-300">
                  বর্তমানে কোনো ম্যাচ তৈরি করা নেই (ম্যাচ লিস্ট সম্পূর্ণ খালি)
                </p>
                <p className="text-[11px] text-gray-500">
                  উপরের ফর্ম ব্যবহার করে যেকোনো সময় নতুন ম্যাচ যোগ করতে পারেন।
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
                          <span className="text-red-600 font-bold">ফি: ৳{m.entryFee}</span>
                          <span className="text-emerald-600 font-bold">প্রাইজ: ৳{m.prizePool}</span>
                          <span>সময়: {m.time}</span>
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
                        <Key className="w-3.5 h-3.5 text-amber-500" /> রুম পাসওয়ার্ড
                      </button>

                      <button
                        onClick={() => handleDeleteMatch(m.id, m.title)}
                        className="p-2 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-100 transition-colors"
                        title="ম্যাচটি ডিলিট করুন"
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
              ক্যাটাগরির নাম ও ইমেজ পরিবর্তন (Category Editor)
            </h3>
            <p className="text-xs text-gray-500">
              হোমপেজের প্রতিটি ক্যাটাগরি কার্ডের নাম, ব্যানার এবং ছবি ইচ্ছামতো পরিবর্তন করতে পারবেন।
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
                  ক্যাটাগরির নাম (Category Name)
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
                  সেকশন টাইটেল (Section Header)
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
                label="ব্যানার ইমেজ আপলোড করুন (Main Banner Image)"
                value={catBannerImage}
                onChange={setCatBannerImage}
                helperText="ক্যাটাগরি পেজের বড় ব্যানার ইমেজ ফাইল আপলোড করুন"
                previewHeight="h-32"
              />

              {/* Avatar Icon with Upload */}
              <ImageUploadInput
                label="গোল আইকন / অ্যাভাটার ইমেজ (Thumbnail Icon)"
                value={catAvatarImage}
                onChange={setCatAvatarImage}
                helperText="হোমপেজের সার্কুলার থাম্বনেইল আইকন"
                isCircular={true}
              />
            </div>

            {/* Custom rules for this category */}
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                এই ক্যাটাগরির জন্য নির্দিষ্ট নিয়মাবলী (Custom Category Rules)
              </label>
              <textarea
                rows={3}
                placeholder="ডিফল্ট রুলস ছাড়া এই ক্যাটাগরির জন্য কোনো বিশেষ নিয়ম থাকলে লিখুন..."
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
                ক্যাটাগরি তথ্য সংরক্ষণ করুন
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
              টুর্নামেন্ট রুলস ও নোটিশ পরিবর্তন (Rules & Notice Manager)
            </h3>
            <p className="text-xs text-gray-500">
              সাইটের শীর্ষ নোটিশ এবং ১৮+ টুর্নামেন্ট নিয়মাবলী সম্পূর্ণ বাংলায় এডিট করুন।
            </p>
          </div>

          <form onSubmit={handleSaveRules} className="space-y-5">
            {/* Notice Bar Text */}
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                শীর্ষ স্ক্রলিং নোটিশ বার টেক্সট (Top Marquee Announcement)
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
                ১৮+ টুর্নামেন্ট ও রুমের সার্বজনীন নিয়মাবলী (Default Tournament Rules)
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
                'টুর্নামেন্টে কিভাবে যোগদান করবেন' নির্দেশিকা (How to Join Guide)
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
                  টেলিগ্রাম কমিউনিটি লিংক
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
                  হোয়াটসঅ্যাপ সাপোর্ট নম্বর
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
                রুলস ও নোটিশ সংরক্ষণ করুন
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
              সাইট সেটিংস ও নাম পরিবর্তন (Site Settings & Branding)
            </h3>
            <p className="text-xs text-gray-500">
              ওয়েবসাইটের নাম, ট্যাগলাইন এবং বিকাশ/নগদ পেমেন্ট নম্বর পরিবর্তন করুন।
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  ওয়েবসাইট / অ্যাপের নাম
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
                  ট্যাগলাইন
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
                  অফিসিয়াল বিকাশ নম্বর (টাকা গ্রহণের জন্য)
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
                  অফিসিয়াল নগদ নম্বর
                </label>
                <input
                  type="text"
                  value={nagadNumber}
                  onChange={(e) => setNagadNumber(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-mono focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Android APK Download URL */}
            <div className="pt-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                অ্যান্ড্রয়েড অ্যাপ APK ডাউনলোড লিংক (Google Drive / Mediafire / Direct Link)
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/... বা https://yourdomain.com/app.apk"
                value={apkDownloadUrl}
                onChange={(e) => setApkDownloadUrl(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-mono focus:outline-none focus:border-red-500"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                আপনার তৈরি করা আসল APK ফাইলটি Google Drive বা Mediafire-এ আপলোড করে লিংকটি এখানে দিন। ওয়েবসাইট থেকে প্লেয়াররা সরাসরি ডাউনলোড করতে পারবে।
              </p>
            </div>

            {/* Owner Security PIN */}
            <div className="pt-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                🔐 ওনার সিক্রেট এক্সেস পিন (Secret Access PIN)
              </label>
              <input
                type="text"
                placeholder="4-8 সংখ্যার পিন (ডিফল্ট: 7860)"
                value={customPin}
                onChange={(e) => setCustomPin(e.target.value)}
                className="w-full sm:w-64 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-mono font-bold tracking-widest focus:outline-none focus:border-red-500"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                এই পিনটি দিয়ে আপনি ছাড়া অন্য কেউ অ্যাডমিন প্যানেলে ঢুকতে পারবে না। প্রয়োজনমতো পরিবর্তন করে সেভ করুন।
              </p>
            </div>

            {/* Site Logo Upload with Preview */}
            <div className="pt-2">
              <ImageUploadInput
                label="ওয়েবসাইট ও অ্যাপের লোগো আপলোড করুন (Site Logo Image)"
                value={siteLogo}
                onChange={setSiteLogo}
                helperText="স্বচ্ছ ব্যাকগ্রাউন্ডের লোগো ইমেজ (PNG, JPG, WEBP) আপলোড করুন"
                previewHeight="h-28"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  if (confirm('আপনি কি ফ্যাক্টরি ডিফল্টে সব রিসেট করতে চান?')) {
                    resetCMS();
                    showToast('ফ্যাক্টরি ডিফল্টে সফলভাবে রিসেট করা হয়েছে!');
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-xs font-bold hover:bg-gray-200"
              >
                ডিফল্টে রিসেট করুন
              </button>

              <button
                type="submit"
                className="px-6 py-3 rounded-xl text-xs font-black btn-red shadow-md shadow-red-600/20"
              >
                সেটিংস সেভ করুন
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
                    অটোমেটিক ম্যাচ সিডিউলার ও পুশ নোটিফিকেশন বট
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    আপনাকে নিজে নিজে ম্যাচ অ্যাড করতে হবে না। বট নির্দিষ্ট সময় পর পর ৬টি ক্যাটাগরির সব ম্যাচ স্বয়ংক্রিয়ভাবে তৈরি করবে এবং মোবাইল অ্যাপে পুশ অ্যালার্ট দিবে।
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  বট সক্রিয় আছে (Active)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Trigger Panel */}
          <div className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-950/40 via-slate-900 to-black p-6 space-y-4 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
                <Sparkles className="w-4 h-4" />
                এক-ক্লিকে তাৎক্ষণিক ম্যাচ জেনারেটর (Instant Batch Generation)
              </div>
              <span className="text-[10px] text-gray-400 font-mono">
                সর্বশেষ রান: {schedulerConfig.lastRunTimestamp || 'সম্প্রতি চালিত হয়েছে'}
              </span>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              নিচের বাটনে ক্লিক করলেই বট তাৎক্ষণিকভাবে <strong>Classic (১২-টিম স্কোয়াড, সোলো, ডুও)</strong>, <strong>Clash Squad 4v4</strong>, <strong>Lone Wolf</strong>, <strong>Lost to Win</strong>, এবং <strong>CS Only Headshot</strong> ক্যাটাগরির ফ্রেশ ম্যাচ শিডিউল তৈরি করবে এবং মোবাইল প্লেয়ারদের কাছে নোটিফিকেশন পাঠাবে।
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleTriggerBotBatch(false)}
                disabled={isGeneratingBatch}
                className="px-6 py-3 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                {isGeneratingBatch ? 'ম্যাচ তৈরি হচ্ছে...' : '⚡ নতুন ম্যাচ ব্যাচ যোগ করুন (Append)'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('⚠️ পুরোনো সব ম্যাচ মুছে সম্পূর্ণ নতুন ফ্রেশ ব্যাচ দিতে চান?')) {
                    handleTriggerBotBatch(true);
                  }
                }}
                disabled={isGeneratingBatch}
                className="px-5 py-3 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-gray-200 border border-white/10 flex items-center gap-2 transition-all"
              >
                <RefreshCw className="w-4 h-4 text-red-400" />
                <span>পুরোনো সব মুছে নতুন ফ্রেশ ব্যাচ দিন (Clear & Refresh)</span>
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
                  স্বয়ংক্রিয় শিডিউলিং ইন্টারভাল (Schedule Interval)
                </h4>
              </div>

              <form onSubmit={handleSaveSchedulerSettings} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    কত সময় পর পর বট নতুন ম্যাচ তৈরি করবে?
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
                    <option value={2}>প্রতি ২ ঘণ্টা পর পর (Every 2 Hours)</option>
                    <option value={4}>প্রতি ৪ ঘণ্টা পর পর (Every 4 Hours - Recommended)</option>
                    <option value={6}>প্রতি ৬ ঘণ্টা পর পর (Every 6 Hours)</option>
                    <option value={12}>প্রতি ১২ ঘণ্টা পর পর (Every 12 Hours)</option>
                    <option value={24}>প্রতিদিন ১ বার (Every 24 Hours)</option>
                  </select>
                  <p className="text-[11px] text-gray-500 mt-1">
                    শিডিউল টাইম শেষ হওয়ার সাথে সাথে ব্যাকগ্রাউন্ডে স্বয়ংক্রিয়ভাবে নতুন ম্যাচ রোল-আউট হবে।
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
                    স্বয়ংক্রিয় ব্যাকগ্রাউন্ড বট সক্রিয় রাখুন (Auto-Run Enabled)
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-xs font-bold btn-red shadow-md shadow-red-600/20"
                >
                  শিডিউল সেটিংস সেভ করুন
                </button>
              </form>
            </div>

            {/* 2. Push Notification Dispatcher */}
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-white/10">
                <Bell className="w-4 h-4 text-amber-500" />
                <h4 className="text-sm font-black text-gray-900 dark:text-white">
                  মোবাইল অ্যাপ পুশ নোটিফিকেশন ব্রডকাস্টার
                </h4>
              </div>

              <form onSubmit={handleSendCustomBroadcast} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    নোটিফিকেশন টাইটেল
                  </label>
                  <input
                    type="text"
                    required
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. 📢 নতুন মেগা টুর্নামেন্ট লাইভ!"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    নোটিফিকেশন বার্তা
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="খেলোয়াড়দের জন্য বার্তা লিখুন..."
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-xs font-black bg-amber-500 text-black hover:bg-amber-400 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>মোবাইল অ্যাপে নোটিফিকেশন অ্যালার্ট পাঠান</span>
                </button>
              </form>
            </div>
          </div>

          {/* Spectator Bot Architecture & Explanation */}
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 space-y-4 shadow-sm">
            <h4 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-red-600" />
              বট কীভাবে কাজ করে এবং কীভাবে সেটআপ করবেন? (Technical Architecture)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600 dark:text-gray-300">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 space-y-2">
                <span className="font-bold text-red-500 block">১. ADB স্পেকটেটর জয়েন</span>
                <p className="leading-relaxed">
                  অ্যান্ড্রয়েড এমুলেটরে (BlueStacks / LDPlayer) বট রান করে। ম্যাচ শুরুর সময় বট অটোমেটিক Room ID ও Password দিয়ে স্পেকটেটর স্লটে প্রবেশ করে।
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 space-y-2">
                <span className="font-bold text-emerald-500 block">২. ভিশন OCR কিল-ফিড রিডার</span>
                <p className="leading-relaxed">
                  খেলা চলাকালীন গেম স্ক্রিনের উপরের ডান পাশের কিল-ফিড থেকে PaddleOCR দিয়ে কিলারের নাম এবং ভিকটিমের নাম রিয়েলটাইমে রিড করে ডাটাবেজে স্টোর করে।
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 space-y-2">
                <span className="font-bold text-blue-500 block">৩. অটোমেটিক Booyah ও প্রাইজমানি</span>
                <p className="leading-relaxed">
                  ম্যাচ শেষে "BOOYAH!" স্ক্রিন ডিটেক্ট করে উইনার ও টপ কিলারের ওয়ালেটে তাৎক্ষণিকভাবে নগদ টাকা ট্রান্সফার করে এবং লিডারবোর্ড আপডেট করে।
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
              রুম আইডি ও পাসওয়ার্ড প্রকাশ করুন
            </h3>
            <p className="text-xs text-gray-500">
              ম্যাচ শুরুর ১৫ মিনিট আগে এই ক্রেডেনশিয়াল প্লেয়ারদের কাছে স্বয়ংক্রিয়ভাবে দৃশ্যমান হবে।
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
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => handleSaveRoomPass(editingRoomMatchId)}
                className="px-5 py-2 rounded-xl text-xs font-black btn-red shadow-md"
              >
                পাবলিশ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
