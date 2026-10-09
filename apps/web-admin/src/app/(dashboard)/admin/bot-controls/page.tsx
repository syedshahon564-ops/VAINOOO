'use client';

import React, { useState, useEffect } from 'react';
import {
  Bot,
  Play,
  Pause,
  RotateCcw,
  Smartphone,
  Cpu,
  ShieldCheck,
  Sparkles,
  Clock,
  Send,
  Check,
  AlertCircle,
  Radio,
  Zap,
  Plus,
  Trash2,
  Calendar,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  X,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  getSchedulerConfig,
  saveSchedulerConfig,
  SchedulerConfig,
  getBotMonitoredMatches,
  autoDeliverRoomCredentials,
  runBotRoomManagerCycle,
  BotMonitoredMatch,
  safeFormatDate,
  dispatchDevicePushNotification,
  getScheduledBotMatches,
  addScheduledBotMatch,
  deleteScheduledBotMatch,
  publishScheduledBotMatch,
  ScheduledBotMatch,
} from '@/lib/match-scheduler';
import { useCMS, INITIAL_CATEGORIES } from '@/lib/cms-store';
import {
  getPaymentRequests,
  approveWithdrawRequest,
  rejectWithdrawRequest,
  approveDepositRequest,
  rejectDepositRequest,
  PaymentRequest,
} from '@/lib/user-store';

export default function BotControlsPage() {
  const { matches, settings, updateSiteSettings: updateSettings, categories } = useCMS();
  const [config, setConfig] = useState<SchedulerConfig>(getSchedulerConfig());
  const [monitoredMatches, setMonitoredMatches] = useState<BotMonitoredMatch[]>([]);
  const [scheduledMatches, setScheduledMatches] = useState<ScheduledBotMatch[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals & Forms
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'PENDING_WITHDRAW' | 'PENDING_DEPOSIT' | 'COMPLETED'>('ALL');

  // Broadcast Notification Form
  const [broadcastTitle, setBroadcastTitle] = useState('🚨 নতুন টুর্নামেন্ট শুরু হতে যাচ্ছে!');
  const [broadcastMessage, setBroadcastMessage] = useState(
    'সব ৬টি ক্যাটাগরির নতুন ম্যাচ যুক্ত হয়েছে। এখনই আপনার পছন্দের স্লট বুক করুন!'
  );

  // Payment Settings Form
  const [paymentForm, setPaymentForm] = useState({
    bkashNumber: settings?.bkashNumber || '01712345678',
    nagadNumber: settings?.nagadNumber || '01812345678',
    rocketNumber: settings?.rocketNumber || '01912345678-5',
    paymentInstructionImage: settings?.paymentInstructionImage || '/logo.png',
    paymentInstructionText:
      settings?.paymentInstructionText ||
      '১. আমাদের বিকাশ/নগদ/ডাচ-বাংলা রকেট নাম্বারে Send Money করুন।\n২. নিচে আপনার প্রেরক মোবাইল নম্বর ও TrxID লিখুন।\n৩. বট স্বয়ংক্রিয়ভাবে ট্রানজেকশন যাচাই করে সাথে সাথে ওয়ালেটে ব্যালেন্স যুক্ত করে দিবে।',
    autoWebhookVerification: settings?.autoWebhookVerification !== false,
  });

  // New Scheduled Match Form State
  const [newMatchForm, setNewMatchForm] = useState({
    title: 'BR CLASSIC MEGA MATCH #1',
    categorySlug: 'classic-match',
    type: 'Squad' as 'Solo' | 'Duo' | 'Squad',
    map: 'Bermuda',
    version: 'MOBILE',
    entryFee: 80,
    prizePool: 650,
    firstPrize: 400,
    secondPrize: 150,
    thirdPrize: 100,
    perKill: 15,
    totalSlots: 48,
    publishAt: '',
    matchPlayTime: '',
    rules: 'সব নিয়ম মেনে খেলুন। কোনো ধরনের হ্যাকিং বা ইললিগ্যাল কার্যকলাপ নিষিদ্ধ।',
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const refreshAllData = () => {
    setMonitoredMatches(getBotMonitoredMatches());
    setScheduledMatches(getScheduledBotMatches());
    setPaymentRequests(getPaymentRequests());
    setConfig(getSchedulerConfig());
  };

  useEffect(() => {
    refreshAllData();

    // Default publishAt to 1 hour from now
    const now = new Date();
    const plus1Hour = new Date(now.getTime() + 60 * 60 * 1000);
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const defaultPublishIso = `${plus1Hour.getFullYear()}-${pad(plus1Hour.getMonth() + 1)}-${pad(
      plus1Hour.getDate()
    )}T${pad(plus1Hour.getHours())}:${pad(plus1Hour.getMinutes())}`;
    const defaultPlayTime = `আজ রাত ১০:০০ PM`;

    setNewMatchForm((prev) => ({
      ...prev,
      publishAt: defaultPublishIso,
      matchPlayTime: defaultPlayTime,
    }));

    const handleUpdate = () => refreshAllData();
    window.addEventListener('ff_bot_matches_updated', handleUpdate);
    window.addEventListener('ff_scheduled_matches_updated', handleUpdate);
    window.addEventListener('ff_payment_requests_updated', handleUpdate);
    window.addEventListener('ff_cms_updated', handleUpdate);
    window.addEventListener('ff_room_credentials_delivered', handleUpdate);

    return () => {
      window.removeEventListener('ff_bot_matches_updated', handleUpdate);
      window.removeEventListener('ff_scheduled_matches_updated', handleUpdate);
      window.removeEventListener('ff_payment_requests_updated', handleUpdate);
      window.removeEventListener('ff_cms_updated', handleUpdate);
      window.removeEventListener('ff_room_credentials_delivered', handleUpdate);
    };
  }, []);

  // Update payment form when CMS settings change
  useEffect(() => {
    if (settings) {
      setPaymentForm({
        bkashNumber: settings.bkashNumber || '01712345678',
        nagadNumber: settings.nagadNumber || '01812345678',
        rocketNumber: settings.rocketNumber || '01912345678-5',
        paymentInstructionImage: settings.paymentInstructionImage || '/logo.png',
        paymentInstructionText:
          settings.paymentInstructionText ||
          '১. আমাদের বিকাশ/নগদ/ডাচ-বাংলা রকেট নাম্বারে Send Money করুন।\n২. নিচে আপনার প্রেরক মোবাইল নম্বর ও TrxID লিখুন।\n৩. বট স্বয়ংক্রিয়ভাবে ট্রানজেকশন যাচাই করে সাথে সাথে ওয়ালেটে ব্যালেন্স যুক্ত করে দিবে।',
        autoWebhookVerification: settings.autoWebhookVerification !== false,
      });
    }
  }, [settings]);

  const handleToggleAutoBot = () => {
    const nextState = !config.autoEnabled;
    const updated = { ...config, autoEnabled: nextState };
    setConfig(updated);
    saveSchedulerConfig(updated);
    showToast(
      nextState
        ? '✅ অটোমেটিক বট শিডিউলার চালু করা হয়েছে!'
        : '⏸️ অটোমেটিক বট শিডিউলার সাময়িকভাবে পজ করা হয়েছে।'
    );
  };

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      showToast('অনুগ্রহ করে নোটিফিকেশনের শিরোনাম ও বার্তা লিখুন', 'error');
      return;
    }
    dispatchDevicePushNotification(broadcastTitle, broadcastMessage);
    showToast('মোবাইল ও ওয়েব অ্যাপে পুশ নোটিফিকেশন পাঠানো হয়েছে!', 'success');
  };

  const handleSavePaymentSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      bkashNumber: paymentForm.bkashNumber,
      nagadNumber: paymentForm.nagadNumber,
      rocketNumber: paymentForm.rocketNumber,
      paymentInstructionImage: paymentForm.paymentInstructionImage,
      paymentInstructionText: paymentForm.paymentInstructionText,
      autoWebhookVerification: paymentForm.autoWebhookVerification,
    });
    showToast('পেমেন্ট ও ওয়ালেট সেটিংস সফলভাবে সেভ করা হয়েছে!', 'success');
  };

  const handleCreateScheduledMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatchForm.title.trim() || !newMatchForm.publishAt) {
      showToast('ম্যাচের শিরোনাম ও পাবলিশ তারিখ প্রদান করুন', 'error');
      return;
    }

    addScheduledBotMatch({
      title: newMatchForm.title,
      categorySlug: newMatchForm.categorySlug,
      map: newMatchForm.map,
      type: newMatchForm.type,
      version: newMatchForm.version,
      entryFee: Number(newMatchForm.entryFee),
      prizePool: Number(newMatchForm.prizePool),
      firstPrize: Number(newMatchForm.firstPrize),
      secondPrize: Number(newMatchForm.secondPrize),
      thirdPrize: Number(newMatchForm.thirdPrize),
      perKill: Number(newMatchForm.perKill),
      totalSlots: Number(newMatchForm.totalSlots),
      publishAt: newMatchForm.publishAt,
      matchPlayTime: newMatchForm.matchPlayTime || 'শিডিউল অনুযায়ী',
      rules: newMatchForm.rules,
    });

    setShowScheduleModal(false);
    refreshAllData();
    showToast('ম্যাচটি শিডিউল কিউতে সফলভাবে সেভ করা হয়েছে! নির্ধারিত সময়ে বট স্বয়ংক্রিয়ভাবে পাবলিশ করবে।', 'success');
  };

  const handlePublishNow = (id: string, title: string) => {
    const success = publishScheduledBotMatch(id);
    if (success) {
      refreshAllData();
      showToast(`"${title}" সফলভাবে লাইভ টুর্নামেন্ট তালিকায় পাবলিশ করা হয়েছে!`, 'success');
    } else {
      showToast('পাবলিশ করতে ব্যর্থ হয়েছে', 'error');
    }
  };

  const handleDeleteScheduled = (id: string) => {
    deleteScheduledBotMatch(id);
    refreshAllData();
    showToast('শিডিউলড ম্যাচ মুছে ফেলা হয়েছে', 'success');
  };

  // Filter payment requests
  const filteredRequests = paymentRequests.filter((r) => {
    if (paymentFilter === 'PENDING_WITHDRAW') return r.type === 'WITHDRAW' && r.status === 'PENDING';
    if (paymentFilter === 'PENDING_DEPOSIT') return r.type === 'DEPOSIT' && r.status === 'PENDING';
    if (paymentFilter === 'COMPLETED') return r.status === 'APPROVED' || r.status === 'REJECTED';
    return true;
  });

  const pendingWithdrawCount = paymentRequests.filter((r) => r.type === 'WITHDRAW' && r.status === 'PENDING').length;
  const pendingDepositCount = paymentRequests.filter((r) => r.type === 'DEPOSIT' && r.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold transition-all ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="pb-4 border-b border-gray-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-red-600" />
            অটোমেটেড বট ও শিডিউলার কন্ট্রোল (Auto Scheduler & Bot Controls)
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            ম্যাচ তৈরি করে বটের কাছে সেভ রাখুন, অটো পাবলিশ শিডিউল করুন, ওয়ালেট গেটওয়ে কন্ট্রোল ও উইথড্রল রিকোয়েস্ট পরিচালনা করুন।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-black btn-red shadow-lg shadow-red-600/30 flex items-center gap-2 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            নতুন ম্যাচ শিডিউল/সেভ করুন
          </button>
        </div>
      </div>

      {/* Grid: Master Bot Status & Broadcast Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Master Bot Switch & Configuration */}
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  config.autoEnabled
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600'
                }`}
              >
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                  স্বয়ংক্রিয় বট স্ট্যাটাস
                </h3>
                <span className="text-xs font-bold text-gray-500">
                  {config.autoEnabled ? 'অটো-শিডিউলার ও পাবলিশার সক্রিয় (Active)' : 'বট বর্তমানে বন্ধ (Paused)'}
                </span>
              </div>
            </div>

            <button
              onClick={handleToggleAutoBot}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md ${
                config.autoEnabled
                  ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/30'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/30'
              }`}
            >
              {config.autoEnabled ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> বট বন্ধ করুন
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> বট চালু করুন
                </>
              )}
            </button>
          </div>

          <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-white/5 text-xs">
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-white/5 font-medium">
              <span className="text-gray-500">বর্তমান লাইভ ম্যাচ:</span>
              <span className="font-mono font-black text-red-600">{matches.length} টি</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-white/5 font-medium">
              <span className="text-gray-500">বটের কাছে শিডিউলড/সেভ করা ম্যাচ:</span>
              <span className="font-mono font-black text-amber-500">{scheduledMatches.length} টি</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-white/5 font-medium">
              <span className="text-gray-500">পেন্ডিং উইথড্র রিকোয়েস্ট:</span>
              <span className="font-mono font-black text-purple-500">{pendingWithdrawCount} টি</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-white/5 font-medium">
              <span className="text-gray-500">সর্বশেষ বট রান হয়েছে:</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">
                {safeFormatDate(config.lastRunTimestamp)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Broadcast Notification to Mobile Users */}
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-white/5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white">
                মোবাইল অ্যাপ ব্রডকাস্ট অ্যালার্ট
              </h3>
              <p className="text-[11px] text-gray-500">
                সকল মোবাইল ও ওয়েব অ্যাপ প্লেয়ারদের কাছে পুশ নোটিফিকেশন অ্যালার্ট পাঠান।
              </p>
            </div>
          </div>

          <form onSubmit={handleSendNotification} className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                নোটিফিকেশন শিরোনাম (Title)
              </label>
              <input
                type="text"
                required
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 font-bold focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                বার্তা (Message)
              </label>
              <textarea
                rows={3}
                required
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 font-medium focus:outline-none focus:border-red-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl btn-red text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-red-600/30 transition-all"
            >
              <Send className="w-3.5 h-3.5" /> পুশ নোটিফিকেশন সেন্ড করুন
            </button>
          </form>
        </div>
      </div>

      {/* SECTION 2: SCHEDULED & SAVED MATCH QUEUE */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                সংরক্ষিত ও শিডিউলড ম্যাচ কিউ (Scheduled Match Queue)
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-300">
                  {scheduledMatches.length}টি ম্যাচ বটের কাছে সংরক্ষিত
                </span>
              </h3>
              <p className="text-[11px] text-gray-500">
                ম্যাচগুলো বানিয়ে সেভ করে রাখুন। নির্ধারিত পাবলিশ ডেট ও সময় আসার সাথে সাথে বট স্বয়ংক্রিয়ভাবে লাইভ করে দিবে।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowScheduleModal(true)}
              className="px-3.5 py-2 rounded-xl btn-red text-xs font-black flex items-center gap-1.5 shadow-md shadow-red-600/20 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> নতুন ম্যাচ সেভ করুন
            </button>
          </div>
        </div>

        {scheduledMatches.length === 0 ? (
          <div className="py-12 text-center text-gray-500 space-y-3">
            <Calendar className="w-10 h-10 mx-auto text-gray-400 opacity-60" />
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
              বর্তমানে কোনো শিডিউলড ম্যাচ সংরক্ষিত নেই।
            </p>
            <p className="text-[11px] text-gray-400">
              উপরের &quot;নতুন ম্যাচ সেভ করুন&quot; বাটনে ক্লিক করে তারিখ ও সময় দিয়ে ম্যাচ বটের মেমোরিতে সেভ করে রাখুন।
            </p>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-800 dark:text-white transition-all inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> ম্যাচ সেভ করুন
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5 text-[10px] text-gray-500 uppercase">
                  <th className="py-2.5 px-3">ম্যাচের নাম</th>
                  <th className="py-2.5 px-3">ক্যাটাগরি ও টাইপ</th>
                  <th className="py-2.5 px-3">এন্ট্রি ও প্রাইজপুল</th>
                  <th className="py-2.5 px-3">পাবলিশ তারিখ ও সময়</th>
                  <th className="py-2.5 px-3">ম্যাচ খেলার সময়</th>
                  <th className="py-2.5 px-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {scheduledMatches.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-extrabold text-gray-900 dark:text-white">
                      {m.title}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                          {m.categorySlug}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400">
                          {m.type}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold">
                      <span className="text-gray-500">ফি: ৳{m.entryFee}</span> /{' '}
                      <span className="text-emerald-500">পুল: ৳{m.prizePool}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {m.publishAt ? new Date(m.publishAt).toLocaleString('bn-BD') : 'তাৎক্ষণিক'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-bold text-gray-700 dark:text-gray-300">
                      {m.matchPlayTime}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handlePublishNow(m.id, m.title)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 transition-all shadow-sm"
                        >
                          <Zap className="w-3 h-3" /> এখনই লাইভ পাবলিশ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteScheduled(m.id)}
                          className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-rose-100 hover:text-rose-600 text-gray-400 transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 3: WALLET & PAYMENT GATEWAY SETTINGS */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 space-y-5 shadow-sm">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-white/5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 dark:text-white">
              ওয়ালেট ও পেমেন্ট মেথড সেটিংস (বিকাশ, নগদ, ডাচ-বাংলা/রকেট)
            </h3>
            <p className="text-[11px] text-gray-500">
              প্লেয়ারদের ডিপোজিট ও উইথড্রয়ের জন্য বিকাশ, নগদ এবং ডাচ-বাংলা রকেট নাম্বার ও সেন্ড মানি নির্দেশনা সেট করুন।
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePaymentSettings} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* bKash */}
            <div className="p-3.5 rounded-xl border border-pink-500/30 bg-pink-500/5 space-y-1.5">
              <label className="font-black text-pink-600 dark:text-pink-400 flex items-center gap-1.5">
                <span>বিকাশ পার্সোনাল নম্বর (bKash)</span>
              </label>
              <input
                type="text"
                required
                value={paymentForm.bkashNumber}
                onChange={(e) => setPaymentForm({ ...paymentForm, bkashNumber: e.target.value })}
                placeholder="017XXXXXXXX"
                className="w-full px-3 py-2 rounded-xl border border-pink-300 dark:border-pink-800 bg-white dark:bg-black font-mono font-bold focus:outline-none focus:border-pink-500"
              />
              <span className="text-[10px] text-gray-500">প্লেয়াররা এই নম্বরে বিকাশ Send Money করবে।</span>
            </div>

            {/* Nagad */}
            <div className="p-3.5 rounded-xl border border-orange-500/30 bg-orange-500/5 space-y-1.5">
              <label className="font-black text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                <span>নগদ পার্সোনাল নম্বর (Nagad)</span>
              </label>
              <input
                type="text"
                required
                value={paymentForm.nagadNumber}
                onChange={(e) => setPaymentForm({ ...paymentForm, nagadNumber: e.target.value })}
                placeholder="018XXXXXXXX"
                className="w-full px-3 py-2 rounded-xl border border-orange-300 dark:border-orange-800 bg-white dark:bg-black font-mono font-bold focus:outline-none focus:border-orange-500"
              />
              <span className="text-[10px] text-gray-500">প্লেয়াররা এই নম্বরে নগদ Send Money করবে।</span>
            </div>

            {/* Dutch-Bangla Rocket */}
            <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-1.5">
              <label className="font-black text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <span>ডাচ-বাংলা / রকেট নম্বর (Rocket)</span>
              </label>
              <input
                type="text"
                required
                value={paymentForm.rocketNumber}
                onChange={(e) => setPaymentForm({ ...paymentForm, rocketNumber: e.target.value })}
                placeholder="019XXXXXXXX-X"
                className="w-full px-3 py-2 rounded-xl border border-purple-300 dark:border-purple-800 bg-white dark:bg-black font-mono font-bold focus:outline-none focus:border-purple-500"
              />
              <span className="text-[10px] text-gray-500">প্লেয়াররা এই নম্বরে ডাচ-বাংলা রকেট Send Money করবে।</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment Guide Image */}
            <div className="space-y-1.5">
              <label className="font-bold text-gray-700 dark:text-gray-300 block">
                সেন্ড মানি গাইড ব্যানার / QR কোড ইমেজ URL
              </label>
              <input
                type="text"
                value={paymentForm.paymentInstructionImage}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentInstructionImage: e.target.value })}
                placeholder="https://... বা /logo.png"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black font-medium focus:outline-none focus:border-red-500"
              />
              <span className="text-[10px] text-gray-500">ডিপোজিট মডালে এই ছবি/QR কোড প্লেয়ারদের দেখানো হবে।</span>
            </div>

            {/* Auto Webhook Verification Toggle */}
            <div className="space-y-1.5">
              <label className="font-bold text-gray-700 dark:text-gray-300 block">
                স্বয়ংক্রিয় ওয়েব হুক ও TrxID ভেরিফিকেশন বট
              </label>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setPaymentForm({
                      ...paymentForm,
                      autoWebhookVerification: !paymentForm.autoWebhookVerification,
                    })
                  }
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                    paymentForm.autoWebhookVerification
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {paymentForm.autoWebhookVerification ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> বট অটো ভেরিফিকেশন: চালু (ON)
                    </>
                  ) : (
                    <>
                      <X className="w-3.5 h-3.5" /> ম্যানুয়াল এডমিন অনুমোদন: চালু (OFF)
                    </>
                  )}
                </button>
              </div>
              <span className="text-[10px] text-gray-500 block">
                চালু থাকলে TrxID সাবমিটের সাথে সাথে বট নিজে যাচাই করে ব্যালেন্স যোগ করে দিবে।
              </span>
            </div>
          </div>

          {/* Payment Guide Text */}
          <div className="space-y-1.5">
            <label className="font-bold text-gray-700 dark:text-gray-300 block">
              সেন্ড মানি নির্দেশনা বার্তা (Instruction Text)
            </label>
            <textarea
              rows={3}
              value={paymentForm.paymentInstructionText}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentInstructionText: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black font-medium focus:outline-none focus:border-red-500 leading-relaxed"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl btn-red text-xs font-black flex items-center gap-1.5 shadow-md shadow-red-600/20 active:scale-95 transition-all"
            >
              <Check className="w-3.5 h-3.5" /> পেমেন্ট সেটিংস সেভ করুন
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 4: REAL-TIME DEPOSIT & WITHDRAW REQUEST MONITOR */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-purple-600">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                ডিপোজিট ও উইথড্র রিকোয়েস্ট মনিটর
                {pendingWithdrawCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black animate-pulse">
                    {pendingWithdrawCount}টি উইথড্র অপেক্ষমাণ!
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-gray-500">
                প্লেয়ারদের রিকোয়েস্ট দেখে টাকা পাঠিয়ে এক ক্লিকে কনফার্ম করুন। প্লেয়ারের মোবাইলে সাথে সাথে পুশ নোটিফিকেশন পৌঁছে যাবে।
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <button
              onClick={() => setPaymentFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                paymentFilter === 'ALL'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'
              }`}
            >
              সকল ({paymentRequests.length})
            </button>
            <button
              onClick={() => setPaymentFilter('PENDING_WITHDRAW')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                paymentFilter === 'PENDING_WITHDRAW'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-300'
              }`}
            >
              পেন্ডিং উইথড্র ({pendingWithdrawCount})
            </button>
            <button
              onClick={() => setPaymentFilter('PENDING_DEPOSIT')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                paymentFilter === 'PENDING_DEPOSIT'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-300'
              }`}
            >
              পেন্ডিং ডিপোজিট ({pendingDepositCount})
            </button>
            <button
              onClick={() => setPaymentFilter('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                paymentFilter === 'COMPLETED'
                  ? 'bg-gray-800 text-white dark:bg-white dark:text-black'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'
              }`}
            >
              কমপ্লিটেড
            </button>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="py-10 text-center text-gray-500 space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 opacity-80" />
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
              এই ফিল্টারে বর্তমানে কোনো লেনদেন রিকোয়েস্ট নেই।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5 text-[10px] text-gray-500 uppercase">
                  <th className="py-2.5 px-3">ধরন</th>
                  <th className="py-2.5 px-3">প্লেয়ার</th>
                  <th className="py-2.5 px-3">মেথড</th>
                  <th className="py-2.5 px-3">পরিমাণ</th>
                  <th className="py-2.5 px-3">অ্যাকাউন্ট / TrxID</th>
                  <th className="py-2.5 px-3">তারিখ ও সময়</th>
                  <th className="py-2.5 px-3">স্ট্যাটাস</th>
                  <th className="py-2.5 px-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3">
                      {req.type === 'WITHDRAW' ? (
                        <span className="inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                          <ArrowUpRight className="w-3 h-3 text-rose-500" /> উইথড্রল
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                          <ArrowDownRight className="w-3 h-3 text-emerald-500" /> ডিপোজিট
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {req.userName || req.userPhone}
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">{req.userPhone}</span>
                    </td>
                    <td className="py-3 px-3 font-bold">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-black ${
                          req.method === 'BKASH'
                            ? 'bg-pink-100 text-pink-700'
                            : req.method === 'NAGAD'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {req.method === 'BKASH' ? 'বিকাশ' : req.method === 'NAGAD' ? 'নগদ' : 'রকেট'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-black text-sm text-gray-900 dark:text-white">
                      ৳ {req.amount}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-gray-800 dark:text-gray-200">
                        {req.accountNumber}
                      </div>
                      {req.trxId && (
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 block font-bold">
                          TrxID: {req.trxId}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[10px] text-gray-400">
                      {new Date(req.createdAt).toLocaleString('bn-BD')}
                    </td>
                    <td className="py-3 px-3">
                      {req.status === 'APPROVED' ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {req.autoVerified ? '🤖 অটো ভেরিফাইড' : '✅ কমপ্লিট'}
                        </span>
                      ) : req.status === 'REJECTED' ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                          ❌ বাতিল
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                          ⏳ অপেক্ষমাণ
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          {req.type === 'WITHDRAW' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  approveWithdrawRequest(req.id);
                                  refreshAllData();
                                  showToast(`উইথড্রল সফল কনফার্ম করা হয়েছে এবং প্লেয়ারকে নোটিফিকেশন পাঠানো হয়েছে!`, 'success');
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 shadow transition-all"
                              >
                                <Check className="w-3 h-3" /> টাকা পাঠানো হয়েছে
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  rejectWithdrawRequest(req.id, 'এডমিন কর্তৃক বাতিল');
                                  refreshAllData();
                                  showToast('উইথড্রল বাতিল করা হয়েছে ও ব্যালেন্স রিফান্ড করা হয়েছে।', 'error');
                                }}
                                className="px-2 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-[10px] transition-all"
                              >
                                বাতিল
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  approveDepositRequest(req.id);
                                  refreshAllData();
                                  showToast(`ডিপোজিট অ্যাপ্রুভ হয়েছে এবং ৳${req.amount} ব্যালেন্স যোগ করা হয়েছে!`, 'success');
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 shadow transition-all"
                              >
                                <Check className="w-3 h-3" /> অ্যাপ্রুভ করুন
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  rejectDepositRequest(req.id, 'ভুল TrxID');
                                  refreshAllData();
                                  showToast('ডিপোজিট বাতিল করা হয়েছে।', 'error');
                                }}
                                className="px-2 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-[10px] transition-all"
                              >
                                বাতিল
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400">নিষ্পন্ন</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 5: LIVE MATCHES & ROOM ID DELIVERY CENTER */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                বট রুম ম্যানেজার ও অটো ক্রেডেনশিয়াল ডেলিভারি
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                  {monitoredMatches.length}টি লাইভ ম্যাচ মনিটর হচ্ছে
                </span>
              </h3>
              <p className="text-[11px] text-gray-500">
                ম্যাচ শুরুর ১৫ মিনিট আগে বট স্বয়ংক্রিয়ভাবে রুম আইডি ও পাসওয়ার্ড তৈরি করে প্লেয়ারদের কাছে ডেলিভারি করে।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const count = runBotRoomManagerCycle();
                refreshAllData();
                showToast(`বট সাইকেল সফলভাবে সম্পন্ন হয়েছে (${count} টি রুমে ডেলিভারি হয়েছে)।`);
              }}
              className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 text-gray-800 dark:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> রিফ্রেশ মনিটর
            </button>

            {monitoredMatches.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  let delivered = 0;
                  monitoredMatches.forEach((m) => {
                    if (!m.roomId) {
                      autoDeliverRoomCredentials(m.id);
                      delivered++;
                    }
                  });
                  refreshAllData();
                  showToast(`বট সব ${delivered || monitoredMatches.length}টি ম্যাচের রুম আইডি ও পাসওয়ার্ড ডেলিভারি করেছে!`);
                }}
                className="px-3.5 py-2 rounded-xl btn-red text-xs font-black flex items-center gap-1.5 shadow-md shadow-red-600/20 active:scale-95 transition-all"
              >
                <Zap className="w-3.5 h-3.5" /> সব রুম এখনই ডেলিভার করুন
              </button>
            )}
          </div>
        </div>

        {monitoredMatches.length === 0 ? (
          <div className="py-12 text-center text-gray-500 space-y-2">
            <Bot className="w-10 h-10 mx-auto text-gray-400 opacity-60" />
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
              বর্তমানে বটের মেমোরিতে কোনো লাইভ ম্যাচ নেই (০ ম্যাচ)।
            </p>
            <p className="text-[11px] text-gray-400">
              ম্যাচ যুক্ত করলে বা শিডিউল থেকে পাবলিশ হলে তা এখানে স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5 text-[10px] text-gray-500 uppercase">
                  <th className="py-2.5 px-3">ম্যাচের নাম</th>
                  <th className="py-2.5 px-3">ক্যাটাগরি</th>
                  <th className="py-2.5 px-3">শিডিউল টাইম</th>
                  <th className="py-2.5 px-3">স্লট</th>
                  <th className="py-2.5 px-3">রুম ডেলিভারি স্ট্যাটাস</th>
                  <th className="py-2.5 px-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {monitoredMatches.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-extrabold text-gray-900 dark:text-white">
                      {m.title}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                        {m.categorySlug}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-gray-600 dark:text-gray-300">
                      {m.time}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold">
                      {m.filledSlots}/{m.totalSlots}
                    </td>
                    <td className="py-3 px-3">
                      {m.roomId ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✅ ডেলিভার্ড: {m.roomId} (Pass: {m.roomPass || '1234'})
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                          ⏳ অপেক্ষমাণ (ম্যাচ শুরুর ১৫ মিনিট আগে)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          const res = autoDeliverRoomCredentials(m.id);
                          if (res) {
                            showToast(`"${m.title}" এর জন্য রুম আইডি: ${res.roomId} তৈরি ও ডেলিভারি করা হয়েছে!`);
                            refreshAllData();
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] transition-colors"
                      >
                        ⚡ {m.roomId ? 'পুনরায় ডেলিভার' : 'রুম আইডি দিন'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: ADD / SCHEDULE NEW MATCH */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#12121a] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-red-800 via-red-600 to-black text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-black uppercase">
                    নতুন ম্যাচ শিডিউল ও সেভ করুন (Save Scheduled Match)
                  </h3>
                  <p className="text-[11px] text-gray-200">
                    বটের মেমোরিতে ম্যাচটি সেভ থাকবে এবং নির্ধারিত সময়ে লাইভ পাবলিশ হবে।
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateScheduledMatch} className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">ম্যাচের নাম (Title):</label>
                  <input
                    type="text"
                    required
                    value={newMatchForm.title}
                    onChange={(e) => setNewMatchForm({ ...newMatchForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black font-bold focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">ক্যাটাগরি:</label>
                  <select
                    value={newMatchForm.categorySlug}
                    onChange={(e) => {
                      const slug = e.target.value;
                      let defSlots = 48;
                      let defType: 'Solo' | 'Duo' | 'Squad' = 'Squad';
                      if (slug === 'clash-squad' || slug === 'cs-only-headshot') {
                        defSlots = 8;
                        defType = 'Squad';
                      } else if (slug === 'lone-wolf' || slug === 'lost-to-win') {
                        defSlots = 2;
                        defType = 'Solo';
                      }
                      setNewMatchForm({
                        ...newMatchForm,
                        categorySlug: slug,
                        totalSlots: defSlots,
                        type: defType,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black font-bold focus:outline-none focus:border-red-500"
                  >
                    {Object.values(categories || INITIAL_CATEGORIES).map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type */}
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">ম্যাচ টাইপ:</label>
                  <select
                    value={newMatchForm.type}
                    onChange={(e) =>
                      setNewMatchForm({
                        ...newMatchForm,
                        type: e.target.value as 'Solo' | 'Duo' | 'Squad',
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black font-bold focus:outline-none focus:border-red-500"
                  >
                    <option value="Squad">Squad (৪ জন)</option>
                    <option value="Duo">Duo (২ জন)</option>
                    <option value="Solo">Solo (১ জন)</option>
                  </select>
                </div>

                {/* Map */}
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">ম্যাপ (Map):</label>
                  <select
                    value={newMatchForm.map}
                    onChange={(e) => setNewMatchForm({ ...newMatchForm, map: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black font-bold focus:outline-none focus:border-red-500"
                  >
                    <option value="Bermuda">Bermuda</option>
                    <option value="Purgatory">Purgatory</option>
                    <option value="Kalahari">Kalahari</option>
                    <option value="Iron Cage">Iron Cage</option>
                  </select>
                </div>
              </div>

              {/* Financials Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10">
                <div>
                  <label className="font-bold text-gray-600 dark:text-gray-400 block mb-1">এন্ট্রি ফি (৳):</label>
                  <input
                    type="number"
                    min={0}
                    value={newMatchForm.entryFee}
                    onChange={(e) => setNewMatchForm({ ...newMatchForm, entryFee: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-600 dark:text-gray-400 block mb-1">মোট প্রাইজপুল (৳):</label>
                  <input
                    type="number"
                    min={0}
                    value={newMatchForm.prizePool}
                    onChange={(e) => setNewMatchForm({ ...newMatchForm, prizePool: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black font-mono font-bold text-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-600 dark:text-gray-400 block mb-1">১ম প্রাইজ (৳):</label>
                  <input
                    type="number"
                    min={0}
                    value={newMatchForm.firstPrize}
                    onChange={(e) => setNewMatchForm({ ...newMatchForm, firstPrize: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black font-mono font-bold text-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-600 dark:text-gray-400 block mb-1">প্রতি কিল (৳):</label>
                  <input
                    type="number"
                    min={0}
                    value={newMatchForm.perKill}
                    onChange={(e) => setNewMatchForm({ ...newMatchForm, perKill: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black font-mono font-bold"
                  />
                </div>
              </div>

              {/* Timing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Publish Date & Time */}
                <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-1">
                  <label className="font-black text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>পাবলিশ করার তারিখ ও সময় (Auto Publish Time):</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newMatchForm.publishAt}
                    onChange={(e) => setNewMatchForm({ ...newMatchForm, publishAt: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-blue-300 dark:border-blue-800 bg-white dark:bg-black font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-gray-500">
                    এই সময় হওয়ার সাথে সাথে বট স্বয়ংক্রিয়ভাবে টুর্নামেন্ট তালিকায় পাবলিশ করবে।
                  </span>
                </div>

                {/* Match Play Time */}
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1">
                  <label className="font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>ম্যাচ খেলার শিডিউল টাইম (Play Time):</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newMatchForm.matchPlayTime}
                    onChange={(e) => setNewMatchForm({ ...newMatchForm, matchPlayTime: e.target.value })}
                    placeholder="যেমন: আজ রাত ১০:৩০ PM"
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-black font-bold focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-gray-500">
                    প্লেয়ারদের কার্ডে এই সময় প্রদর্শিত হবে।
                  </span>
                </div>
              </div>

              {/* Total Slots */}
              <div className="space-y-1">
                <label className="font-bold text-gray-700 dark:text-gray-300">মোট স্লট সংখ্যা (Total Slots):</label>
                <input
                  type="number"
                  min={2}
                  max={48}
                  value={newMatchForm.totalSlots}
                  onChange={(e) => setNewMatchForm({ ...newMatchForm, totalSlots: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black font-mono font-bold"
                />
              </div>

              {/* Rules */}
              <div className="space-y-1">
                <label className="font-bold text-gray-700 dark:text-gray-300">ম্যাচের নিয়মাবলী (Rules):</label>
                <textarea
                  rows={2}
                  value={newMatchForm.rules}
                  onChange={(e) => setNewMatchForm({ ...newMatchForm, rules: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black font-medium"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl btn-red text-xs font-black flex items-center gap-1.5 shadow-md shadow-red-600/30"
                >
                  <Check className="w-3.5 h-3.5" /> বটের কাছে সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
