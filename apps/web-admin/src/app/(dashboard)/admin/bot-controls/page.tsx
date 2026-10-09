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
} from 'lucide-react';
import {
  generateAutomatedMatchBatch,
  getSchedulerConfig,
  saveSchedulerConfig,
  sendBroadcastNotification,
  SchedulerConfig,
  getBotMonitoredMatches,
  autoDeliverRoomCredentials,
  runBotRoomManagerCycle,
  BotMonitoredMatch,
} from '@/lib/match-scheduler';
import { useCMS } from '@/lib/cms-store';

export default function BotControlsPage() {
  const { matches } = useCMS();
  const [config, setConfig] = useState<SchedulerConfig>(getSchedulerConfig());
  const [monitoredMatches, setMonitoredMatches] = useState<BotMonitoredMatch[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setMonitoredMatches(getBotMonitoredMatches());
    const handleUpdate = () => setMonitoredMatches(getBotMonitoredMatches());
    window.addEventListener('ff_bot_matches_updated', handleUpdate);
    window.addEventListener('ff_cms_updated', handleUpdate);
    window.addEventListener('ff_room_credentials_delivered', handleUpdate);
    return () => {
      window.removeEventListener('ff_bot_matches_updated', handleUpdate);
      window.removeEventListener('ff_cms_updated', handleUpdate);
      window.removeEventListener('ff_room_credentials_delivered', handleUpdate);
    };
  }, []);

  // Broadcast Notification Form
  const [broadcastTitle, setBroadcastTitle] = useState('🚨 নতুন টুর্নামেন্ট শুরু হতে যাচ্ছে!');
  const [broadcastMessage, setBroadcastMessage] = useState(
    'সব ৬টি ক্যাটাগরির নতুন ম্যাচ যুক্ত হয়েছে। এখনই আপনার পছন্দের স্লট বুক করুন!'
  );

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

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

  const handleSaveInterval = (hours: number) => {
    const updated = { ...config, intervalHours: hours };
    setConfig(updated);
    saveSchedulerConfig(updated);
    showToast(`বট শিডিউলার ইন্টারভ্যাল প্রতি ${hours} ঘণ্টায় সেট করা হয়েছে!`);
  };

  const handleTriggerManualBatch = (clearExisting: boolean = false) => {
    setIsGenerating(true);
    try {
      const result = generateAutomatedMatchBatch({ clearExisting });
      sendBroadcastNotification(
        '🤖 নতুন টুর্নামেন্ট লাইভ!',
        'স্বয়ংক্রিয় বট সব ৬টি ক্যাটাগরির ফ্রেশ টুর্নামেন্ট শিডিউল করেছে। এখনই স্লট বুক করুন!'
      );
      const updated: SchedulerConfig = {
        ...config,
        lastRunTimestamp: new Date().toLocaleTimeString('bn-BD'),
        batchCount: (config.batchCount || 0) + 1,
      };
      setConfig(updated);
      saveSchedulerConfig(updated);
      showToast(
        `বট সফলভাবে ${result.createdCount} টি নতুন ম্যাচ তৈরি করেছে এবং নোটিফিকেশন পাঠিয়েছে!`,
        'success'
      );
    } catch (err) {
      showToast('ম্যাচ জেনারেট করতে সমস্যা হয়েছে', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      showToast('অনুগ্রহ করে নোটিফিকেশনের শিরোনাম ও বার্তা লিখুন', 'error');
      return;
    }
    sendBroadcastNotification(broadcastTitle, broadcastMessage);
    showToast('মোবাইল অ্যাপ ব্যবহারকারীদের কাছে ব্রডকাস্ট নোটিফিকেশন পাঠানো হয়েছে!', 'success');
  };

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
            অটোমেটেড বট ও শিডিউলার কন্ট্রোল (Auto Scheduler Bot)
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            স্বয়ংক্রিয়ভাবে টুর্নামেন্ট ম্যাচ তৈরি, ভবিষ্যৎ শিডিউল নির্ধারণ এবং মোবাইল ব্যবহারকারীদের নোটিফিকেশন অ্যালার্ট কন্ট্রোল করুন।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTriggerManualBatch(false)}
            disabled={isGenerating}
            className="px-4 py-2 rounded-xl text-xs font-black btn-red shadow-lg shadow-red-600/30 flex items-center gap-2 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            {isGenerating ? 'জেনারেট হচ্ছে...' : 'এখনই নতুন ব্যাচ তৈরি করুন'}
          </button>
        </div>
      </div>

      {/* Grid */}
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
                  {config.autoEnabled ? 'অটো-শিডিউলার সক্রিয় (Active)' : 'বট বর্তমানে বন্ধ (Paused)'}
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
              <span className="text-gray-500">বর্তমান সক্রিয় ম্যাচ:</span>
              <span className="font-mono font-black text-red-600">{matches.length} টি</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-white/5 font-medium">
              <span className="text-gray-500">সর্বমোট তৈরি করা ব্যাচ:</span>
              <span className="font-mono font-black text-emerald-600">
                {config.batchCount || 0} টি
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-white/5 font-medium">
              <span className="text-gray-500">সর্বশেষ রান করা হয়েছে:</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">
                {config.lastRunTimestamp ? new Date(config.lastRunTimestamp).toLocaleString('bn-BD') : 'এখনো রান হয়নি'}
              </span>
            </div>
          </div>

          {/* Daily Quota Configuration Table */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-gray-800 dark:text-gray-200 block">
                প্রতিদিনের স্বয়ংক্রিয় ম্যাচ কোটা (Daily Limits):
              </label>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                মোট ৩৯টি ম্যাচ/দিন
              </span>
            </div>

            <div className="rounded-xl border border-gray-100 dark:border-white/5 overflow-hidden text-xs">
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-gray-50 dark:bg-white/5 font-bold border-b border-gray-100 dark:border-white/5 text-gray-500 uppercase text-[10px]">
                <span>ক্যাটাগরি</span>
                <span className="text-right">দৈনিক ম্যাচ সংখ্যা</span>
              </div>
              {[
                { slug: 'classic-match', label: 'Classic Match (Solo, Squad, Duo)', count: config.dailyQuota?.['classic-match'] ?? 10 },
                { slug: 'clash-squad', label: 'Clash Squad (4v4)', count: config.dailyQuota?.['clash-squad'] ?? 12 },
                { slug: 'cs-only-headshot', label: 'CS Only Headshot (4v4)', count: config.dailyQuota?.['cs-only-headshot'] ?? 9 },
                { slug: 'lone-wolf', label: 'Lone Wolf (1v1)', count: config.dailyQuota?.['lone-wolf'] ?? 7 },
                { slug: 'lost-to-win', label: 'Lost to Win (1v1)', count: config.dailyQuota?.['lost-to-win'] ?? 1 },
                { slug: 'special-match', label: 'Special Match (ম্যানুয়াল)', count: config.dailyQuota?.['special-match'] ?? 0 },
              ].map((row) => (
                <div
                  key={row.slug}
                  className="grid grid-cols-2 items-center gap-2 p-2.5 border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-white/5"
                >
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs">
                    {row.label}
                  </span>
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="font-mono font-black text-red-600 text-xs">
                      {row.count} টি/দিন
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleTriggerManualBatch(false)}
                disabled={isGenerating}
                className="py-2.5 px-3 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 text-gray-800 dark:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                আজকের ব্যাচ শিডিউল করুন
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsGenerating(true);
                  try {
                    const result = generateAutomatedMatchBatch({ targetDay: 'tomorrow' });
                    showToast(`আগামীকালের জন্য ${result.createdCount}টি ম্যাচ শিডিউল করা হয়েছে!`, 'success');
                  } catch (e) {
                    showToast('শিডিউল করতে সমস্যা হয়েছে', 'error');
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                disabled={isGenerating}
                className="py-2.5 px-3 rounded-xl btn-red text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20"
              >
                <Clock className="w-3.5 h-3.5" />
                আগামীকালের ব্যাচ দিন
              </button>
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
                সকল মোবাইল অ্যাপ ব্যবহারকারীদের কাছে তাৎক্ষণিক পুশ নোটিফিকেশন পাঠান।
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
              <Send className="w-3.5 h-3.5" /> নোটিফিকেশন সেন্ড করুন
            </button>
          </form>
        </div>
      </div>

      {/* Section 3: Bot Monitored Matches & Auto Room Credentials Delivery Center */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                বট মনিটরিং সেন্টার ও অটো রুম আইডি ডেলিভারি
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                  {monitoredMatches.length}টি ম্যাচ মনিটর হচ্ছে
                </span>
              </h3>
              <p className="text-[11px] text-gray-500">
                নতুন যেকোনো ম্যাচ তৈরি হলে তা বটের কাছে স্বয়ংক্রিয়ভাবে সেভ হয় এবং শিডিউল অনুযায়ী প্লেয়ারদের কাছে রুম আইডি ও পাসওয়ার্ড ডেলিভারি করে।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const count = runBotRoomManagerCycle();
                setMonitoredMatches(getBotMonitoredMatches());
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
                  setMonitoredMatches(getBotMonitoredMatches());
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
              বর্তমানে বটের মেমোরিতে কোনো ম্যাচ সংরক্ষিত নেই (০ ম্যাচ)।
            </p>
            <p className="text-[11px] text-gray-400">
              নতুন ম্যাচ তৈরি করলে বা স্বয়ংক্রিয় ব্যাচ দিলে তা বটের তালিকায় স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে।
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
                            setMonitoredMatches(getBotMonitoredMatches());
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
    </div>
  );
}
