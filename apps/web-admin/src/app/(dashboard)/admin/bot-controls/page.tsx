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
  const [broadcastTitle, setBroadcastTitle] = useState('🚨 New Tournament Starting Soon!');
  const [broadcastMessage, setBroadcastMessage] = useState(
    'New matches have been added across all categories. Book your squad slots now!'
  );

  // Payment Settings Form
  const [paymentForm, setPaymentForm] = useState({
    bkashNumber: settings?.bkashNumber || '01712345678',
    nagadNumber: settings?.nagadNumber || '01812345678',
    rocketNumber: settings?.rocketNumber || '01912345678-5',
    paymentInstructionImage: settings?.paymentInstructionImage || '/logo.png',
    paymentInstructionText:
      settings?.paymentInstructionText ||
      '1. Send Money to our official bKash/Nagad/Rocket account.\n2. Enter your sender phone number and TrxID below.\n3. The automated system verifies and adds balance instantly.',
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
    rules: 'Follow tournament rules. Emulators and illegal hacks are strictly prohibited.',
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
    const defaultPlayTime = `Tonight 10:00 PM`;

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
          '1. Send Money to our official bKash/Nagad/Rocket account.\n2. Enter your sender phone number and TrxID below.\n3. The automated system verifies and adds balance instantly.',
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
        ? '✅ Automated Bot Scheduler enabled!'
        : '⏸️ Automated Bot Scheduler paused.'
    );
  };

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      showToast('Please provide a notification title and message', 'error');
      return;
    }
    dispatchDevicePushNotification(broadcastTitle, broadcastMessage);
    showToast('Push alert broadcast dispatched to mobile & web clients!', 'success');
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
    showToast('Payment gateway and wallet settings saved!', 'success');
  };

  const handleCreateScheduledMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatchForm.title.trim() || !newMatchForm.publishAt) {
      showToast('Please provide a match title and scheduled publish time', 'error');
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
      matchPlayTime: newMatchForm.matchPlayTime || 'As scheduled',
      rules: newMatchForm.rules,
    });

    setShowScheduleModal(false);
    refreshAllData();
    showToast('Match saved in bot queue! It will publish automatically at the scheduled time.', 'success');
  };

  const handlePublishNow = (id: string, title: string) => {
    const success = publishScheduledBotMatch(id);
    if (success) {
      refreshAllData();
      showToast(`"${title}" published live immediately!`, 'success');
    } else {
      showToast('Failed to publish match', 'error');
    }
  };

  const handleDeleteScheduled = (id: string) => {
    deleteScheduledBotMatch(id);
    refreshAllData();
    showToast('Scheduled match removed from queue', 'success');
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
            Automated Bot & Scheduler Controls
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Queue scheduled matches, auto-deliver room credentials, manage payment gateways, and review player withdrawal requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-black btn-red shadow-lg shadow-red-600/30 flex items-center gap-2 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Schedule New Match
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
                  Automated Bot Scheduler
                </h3>
                <span className="text-xs font-bold text-gray-500">
                  {config.autoEnabled ? 'Auto-Scheduler & Publisher Active' : 'Bot Engine Paused'}
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
                  <Pause className="w-3.5 h-3.5" /> Pause Bot
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Start Bot
                </>
              )}
            </button>
          </div>

          <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-white/5 text-xs">
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-white/5 font-medium">
              <span className="text-gray-500">Active Live Matches:</span>
              <span className="font-mono font-black text-red-600">{matches.length}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-white/5 font-medium">
              <span className="text-gray-500">Queued in Bot Scheduler:</span>
              <span className="font-mono font-black text-amber-500">{scheduledMatches.length}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-white/5 font-medium">
              <span className="text-gray-500">Pending Withdraw Requests:</span>
              <span className="font-mono font-black text-purple-500">{pendingWithdrawCount}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-white/5 font-medium">
              <span className="text-gray-500">Last Bot Cycle:</span>
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
                Mobile Broadcast Alerts
              </h3>
              <p className="text-[11px] text-gray-500">
                Dispatch instant push notifications to all active mobile & web clients.
              </p>
            </div>
          </div>

          <form onSubmit={handleSendNotification} className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Notification Title
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
                Notification Message
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
              <Send className="w-3.5 h-3.5" /> Broadcast Push Notification
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
                Scheduled Match Queue
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-300">
                  {scheduledMatches.length} Queued
                </span>
              </h3>
              <p className="text-[11px] text-gray-500">
                Matches stored in bot memory. The bot will automatically publish them live once their schedule time arrives.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowScheduleModal(true)}
              className="px-3.5 py-2 rounded-xl btn-red text-xs font-black flex items-center gap-1.5 shadow-md shadow-red-600/20 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Queue New Match
            </button>
          </div>
        </div>

        {scheduledMatches.length === 0 ? (
          <div className="py-12 text-center text-gray-500 space-y-3">
            <Calendar className="w-10 h-10 mx-auto text-gray-400 opacity-60" />
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
              No matches currently queued in scheduler.
            </p>
            <p className="text-[11px] text-gray-400">
              Click &quot;Queue New Match&quot; above to configure future tournaments for automatic release.
            </p>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-800 dark:text-white transition-all inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Queue Match
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5 text-[10px] text-gray-500 uppercase">
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Category & Type</th>
                  <th className="py-2.5 px-3">Fee & Prize Pool</th>
                  <th className="py-2.5 px-3">Auto Publish Time</th>
                  <th className="py-2.5 px-3">Play Schedule</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
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
                      <span className="text-gray-500">Fee: ৳{m.entryFee}</span> /{' '}
                      <span className="text-emerald-500">Pool: ৳{m.prizePool}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {m.publishAt ? new Date(m.publishAt).toLocaleString('en-US') : 'Immediate'}
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
                          <Zap className="w-3 h-3" /> Publish Now
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteScheduled(m.id)}
                          className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-rose-100 hover:text-rose-600 text-gray-400 transition-colors"
                          title="Delete"
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
              Wallet & Payment Gateway Configuration
            </h3>
            <p className="text-[11px] text-gray-500">
              Configure personal bKash, Nagad, and Rocket numbers and instructions for deposit and withdrawal.
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePaymentSettings} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* bKash */}
            <div className="p-3.5 rounded-xl border border-pink-500/30 bg-pink-500/5 space-y-1.5">
              <label className="font-black text-pink-600 dark:text-pink-400 flex items-center gap-1.5">
                <span>bKash Personal Number</span>
              </label>
              <input
                type="text"
                required
                value={paymentForm.bkashNumber}
                onChange={(e) => setPaymentForm({ ...paymentForm, bkashNumber: e.target.value })}
                placeholder="017XXXXXXXX"
                className="w-full px-3 py-2 rounded-xl border border-pink-300 dark:border-pink-800 bg-white dark:bg-black font-mono font-bold focus:outline-none focus:border-pink-500"
              />
              <span className="text-[10px] text-gray-500">Players send manual Send Money to this bKash number.</span>
            </div>

            {/* Nagad */}
            <div className="p-3.5 rounded-xl border border-orange-500/30 bg-orange-500/5 space-y-1.5">
              <label className="font-black text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                <span>Nagad Personal Number</span>
              </label>
              <input
                type="text"
                required
                value={paymentForm.nagadNumber}
                onChange={(e) => setPaymentForm({ ...paymentForm, nagadNumber: e.target.value })}
                placeholder="018XXXXXXXX"
                className="w-full px-3 py-2 rounded-xl border border-orange-300 dark:border-orange-800 bg-white dark:bg-black font-mono font-bold focus:outline-none focus:border-orange-500"
              />
              <span className="text-[10px] text-gray-500">Players send manual Send Money to this Nagad number.</span>
            </div>

            {/* Rocket */}
            <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-1.5">
              <label className="font-black text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <span>Rocket Number</span>
              </label>
              <input
                type="text"
                required
                value={paymentForm.rocketNumber}
                onChange={(e) => setPaymentForm({ ...paymentForm, rocketNumber: e.target.value })}
                placeholder="019XXXXXXXX-X"
                className="w-full px-3 py-2 rounded-xl border border-purple-300 dark:border-purple-800 bg-white dark:bg-black font-mono font-bold focus:outline-none focus:border-purple-500"
              />
              <span className="text-[10px] text-gray-500">Players send manual Send Money to this Rocket number.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment Guide Image */}
            <div className="space-y-1.5">
              <label className="font-bold text-gray-700 dark:text-gray-300 block">
                Payment Guide Banner / QR Code URL
              </label>
              <input
                type="text"
                value={paymentForm.paymentInstructionImage}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentInstructionImage: e.target.value })}
                placeholder="https://... or /logo.png"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black font-medium focus:outline-none focus:border-red-500"
              />
              <span className="text-[10px] text-gray-500">Displayed in client deposit dialog.</span>
            </div>

            {/* Auto Webhook Verification Toggle */}
            <div className="space-y-1.5">
              <label className="font-bold text-gray-700 dark:text-gray-300 block">
                Automated TrxID Verification Engine
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
                      <Check className="w-3.5 h-3.5" /> Auto Verification: ON
                    </>
                  ) : (
                    <>
                      <X className="w-3.5 h-3.5" /> Manual Admin Approval: ON
                    </>
                  )}
                </button>
              </div>
              <span className="text-[10px] text-gray-500 block">
                When enabled, valid TrxIDs are verified automatically and credited to player balance.
              </span>
            </div>
          </div>

          {/* Payment Guide Text */}
          <div className="space-y-1.5">
            <label className="font-bold text-gray-700 dark:text-gray-300 block">
              Payment Instruction Text
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
              <Check className="w-3.5 h-3.5" /> Save Payment Settings
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
                Deposit & Withdrawal Request Monitor
                {pendingWithdrawCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black animate-pulse">
                    {pendingWithdrawCount} Withdrawal Pending!
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-gray-500">
                Review player requests, confirm payouts, and automatically dispatch push alerts to winner devices.
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
              All ({paymentRequests.length})
            </button>
            <button
              onClick={() => setPaymentFilter('PENDING_WITHDRAW')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                paymentFilter === 'PENDING_WITHDRAW'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-300'
              }`}
            >
              Pending Withdraw ({pendingWithdrawCount})
            </button>
            <button
              onClick={() => setPaymentFilter('PENDING_DEPOSIT')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                paymentFilter === 'PENDING_DEPOSIT'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-300'
              }`}
            >
              Pending Deposit ({pendingDepositCount})
            </button>
            <button
              onClick={() => setPaymentFilter('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                paymentFilter === 'COMPLETED'
                  ? 'bg-gray-800 text-white dark:bg-white dark:text-black'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="py-10 text-center text-gray-500 space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 opacity-80" />
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
              No pending payment requests under this filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5 text-[10px] text-gray-500 uppercase">
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Player</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Account / TrxID</th>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3">
                      {req.type === 'WITHDRAW' ? (
                        <span className="inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                          <ArrowUpRight className="w-3 h-3 text-rose-500" /> Withdraw
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                          <ArrowDownRight className="w-3 h-3 text-emerald-500" /> Deposit
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
                        {req.method}
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
                      {new Date(req.createdAt).toLocaleString('en-US')}
                    </td>
                    <td className="py-3 px-3">
                      {req.status === 'APPROVED' ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {req.autoVerified ? '🤖 Auto Verified' : '✅ Completed'}
                        </span>
                      ) : req.status === 'REJECTED' ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                          ❌ Rejected
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                          ⏳ Pending
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
                                  showToast(`Withdrawal confirmed and notification sent to player!`, 'success');
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 shadow transition-all"
                              >
                                <Check className="w-3 h-3" /> Mark Paid
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  rejectWithdrawRequest(req.id, 'Declined by administrator');
                                  refreshAllData();
                                  showToast('Withdrawal rejected and balance refunded.', 'error');
                                }}
                                className="px-2 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-[10px] transition-all"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  approveDepositRequest(req.id);
                                  refreshAllData();
                                  showToast(`Deposit approved and ৳${req.amount} credited!`, 'success');
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 shadow transition-all"
                              >
                                <Check className="w-3 h-3" /> Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  rejectDepositRequest(req.id, 'Invalid TrxID');
                                  refreshAllData();
                                  showToast('Deposit rejected.', 'error');
                                }}
                                className="px-2 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-[10px] transition-all"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400">Processed</span>
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
                Bot Room Manager & Credential Dispatch
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                  {monitoredMatches.length} Matches Monitored
                </span>
              </h3>
              <p className="text-[11px] text-gray-500">
                The bot delivers Custom Room IDs and Passwords to registered players 15 minutes before match start.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const count = runBotRoomManagerCycle();
                refreshAllData();
                showToast(`Bot manager cycle executed (${count} rooms delivered).`);
              }}
              className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 text-gray-800 dark:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Refresh Monitor
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
                  showToast(`Bot dispatched credentials for ${delivered || monitoredMatches.length} matches!`);
                }}
                className="px-3.5 py-2 rounded-xl btn-red text-xs font-black flex items-center gap-1.5 shadow-md shadow-red-600/20 active:scale-95 transition-all"
              >
                <Zap className="w-3.5 h-3.5" /> Deliver All Rooms Now
              </button>
            )}
          </div>
        </div>

        {monitoredMatches.length === 0 ? (
          <div className="py-12 text-center text-gray-500 space-y-2">
            <Bot className="w-10 h-10 mx-auto text-gray-400 opacity-60" />
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
              No live matches currently monitored (0 matches).
            </p>
            <p className="text-[11px] text-gray-400">
              When matches are scheduled or published live, they will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5 text-[10px] text-gray-500 uppercase">
                  <th className="py-2.5 px-3">Match Title</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Schedule Time</th>
                  <th className="py-2.5 px-3">Slots</th>
                  <th className="py-2.5 px-3">Room Delivery Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
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
                            ✅ Delivered: {m.roomId} (Pass: {m.roomPass || '1234'})
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                          ⏳ Queued (15m before start)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          const res = autoDeliverRoomCredentials(m.id);
                          if (res) {
                            showToast(`Room ID ${res.roomId} delivered for "${m.title}"!`);
                            refreshAllData();
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] transition-colors"
                      >
                        ⚡ {m.roomId ? 'Re-deliver' : 'Deliver Room ID'}
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
                    Schedule & Save Match for Bot
                  </h3>
                  <p className="text-[11px] text-gray-200">
                    The match will be held in bot memory and automatically published live on schedule.
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
                  <label className="font-bold text-gray-700 dark:text-gray-300">Match Title:</label>
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
                  <label className="font-bold text-gray-700 dark:text-gray-300">Category:</label>
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
                  <label className="font-bold text-gray-700 dark:text-gray-300">Match Mode (Type):</label>
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
                    <option value="Squad">Squad (4 Players)</option>
                    <option value="Duo">Duo (2 Players)</option>
                    <option value="Solo">Solo (1 Player)</option>
                  </select>
                </div>

                {/* Map */}
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Map:</label>
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
                  <label className="font-bold text-gray-600 dark:text-gray-400 block mb-1">Entry Fee (৳):</label>
                  <input
                    type="number"
                    min={0}
                    value={newMatchForm.entryFee}
                    onChange={(e) => setNewMatchForm({ ...newMatchForm, entryFee: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-600 dark:text-gray-400 block mb-1">Prize Pool (৳):</label>
                  <input
                    type="number"
                    min={0}
                    value={newMatchForm.prizePool}
                    onChange={(e) => setNewMatchForm({ ...newMatchForm, prizePool: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black font-mono font-bold text-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-600 dark:text-gray-400 block mb-1">1st Prize (৳):</label>
                  <input
                    type="number"
                    min={0}
                    value={newMatchForm.firstPrize}
                    onChange={(e) => setNewMatchForm({ ...newMatchForm, firstPrize: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black font-mono font-bold text-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-600 dark:text-gray-400 block mb-1">Per Kill (৳):</label>
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
                    <span>Auto Publish Time (Live Date & Time):</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newMatchForm.publishAt}
                    onChange={(e) => setNewMatchForm({ ...newMatchForm, publishAt: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-blue-300 dark:border-blue-800 bg-white dark:bg-black font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-gray-500">
                    The bot will publish this tournament to the live registry at this exact timestamp.
                  </span>
                </div>

                {/* Match Play Time */}
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1">
                  <label className="font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>Match Play Time (Lobby Start):</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newMatchForm.matchPlayTime}
                    onChange={(e) => setNewMatchForm({ ...newMatchForm, matchPlayTime: e.target.value })}
                    placeholder="e.g. Tonight 10:30 PM"
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-black font-bold focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-gray-500">
                    Displayed prominently on player match cards.
                  </span>
                </div>
              </div>

              {/* Total Slots */}
              <div className="space-y-1">
                <label className="font-bold text-gray-700 dark:text-gray-300">Total Slots:</label>
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
                <label className="font-bold text-gray-700 dark:text-gray-300">Rules & Format Guidelines:</label>
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl btn-red text-xs font-black flex items-center gap-1.5 shadow-md shadow-red-600/30"
                >
                  <Check className="w-3.5 h-3.5" /> Save in Bot Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
