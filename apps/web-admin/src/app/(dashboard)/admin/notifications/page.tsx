'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Send,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  ExternalLink,
  Sparkles,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  url?: string;
  icon?: string;
  sentAt: string;
  totalSubscribers: number;
  successCount: number;
  failureCount: number;
}

const PRESETS = [
  {
    title: '🎮 রুম আইডি ও পাসওয়ার্ড প্রকাশ হয়েছে!',
    message: 'আপনার বুক করা ম্যাচের রুম আইডি ও পাসওয়ার্ড দেওয়া হয়েছে। দ্রুত ফ্রি ফায়ার রুমে প্রবেশ করুন!',
    url: '/matches',
  },
  {
    title: '🎉 ডিপোজিট ব্যালেন্স যুক্ত হয়েছে!',
    message: 'আপনার ওয়ালেটে ডিপোজিট সফলভাবে ভেরিফাই হয়ে ক্রেডিট হয়েছে। টুর্নামেন্টে জয়েন করতে পারেন।',
    url: '/wallet',
  },
  {
    title: '🔥 নতুন গ্র্যান্ড টুর্নামেন্ট শুরু হয়েছে!',
    message: 'আজকের স্পেশাল টুর্নামেন্টের স্লট বুকিং শুরু হয়েছে। দ্রুত আপনার স্লট কনফার্ম করুন!',
    url: '/',
  },
  {
    title: '⚡ উইথড্র সফলভাবে সম্পন্ন হয়েছে!',
    message: 'আপনার উইথড্র রিকোয়েস্ট সফলভাবে সম্পন্ন হয়েছে এবং টাকা পাঠানো হয়েছে।',
    url: '/wallet',
  },
];

export default function AdminNotificationsPage() {
  const [subscribersCount, setSubscribersCount] = useState<number>(0);
  const [history, setHistory] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetUrl, setTargetUrl] = useState('/');
  const [iconUrl, setIconUrl] = useState('/icon-192.png');

  // Status message
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSubscribersCount(data.subscribersCount || 0);
        setHistory(data.notifications || []);
      }
    } catch (e) {
      console.warn('Error fetching notification stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setTitle(preset.title);
    setMessage(preset.message);
    setTargetUrl(preset.url);
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setAlert({ type: 'error', text: 'দয়া করে নোটিফিকেশনের শিরোনাম ও বার্তা লিখুন।' });
      return;
    }

    setSending(true);
    setAlert(null);

    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          url: targetUrl || '/',
          icon: iconUrl || '/icon-192.png',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAlert({
          type: 'success',
          text: `🎉 সফলভাবে ${data.successCount} টি ডিভাইসে পুশ নোটিফিকেশন পাঠানো হয়েছে! (মোট সাবস্ক্রাইবার: ${data.totalSubscribers})`,
        });
        setTitle('');
        setMessage('');
        fetchStats();
      } else {
        setAlert({
          type: 'error',
          text: data.error || 'নোটিফিকেশন পাঠাতে সমস্যা হয়েছে।',
        });
      }
    } catch (err: any) {
      setAlert({
        type: 'error',
        text: err?.message || 'সার্ভার কানেকশন এরর।',
      });
    } finally {
      setSending(false);
    }
  };

  const handleTestNotification = async () => {
    if (!title.trim() || !message.trim()) {
      setAlert({ type: 'error', text: 'টেস্ট করার জন্য আগে শিরোনাম ও বার্তা লিখুন।' });
      return;
    }

    try {
      // 1. If inside APK, trigger native heads-up notification
      if (typeof window !== 'undefined' && (window as any).AndroidBridge?.showNativeNotification) {
        (window as any).AndroidBridge.showNativeNotification(title, message, targetUrl);
        setAlert({ type: 'success', text: '📱 ফোনে টেস্ট নোটিফিকেশন পাঠানো হয়েছে!' });
        return;
      }

      // 2. Browser ServiceWorker / Notification API
      if ('Notification' in window && Notification.permission === 'granted') {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification(title, {
            body: message,
            icon: iconUrl || '/icon-192.png',
            badge: '/icon-192.png',
            data: { url: targetUrl || '/' },
          });
          setAlert({ type: 'success', text: '🔔 ব্রাউজারে টেস্ট নোটিফিকেশন ডিসপ্লে করা হয়েছে!' });
        } else {
          new Notification(title, { body: message, icon: iconUrl || '/icon-192.png' });
          setAlert({ type: 'success', text: '🔔 টেস্ট নোটিফিকেশন দেখানো হয়েছে!' });
        }
      } else {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          new Notification(title, { body: message, icon: iconUrl || '/icon-192.png' });
          setAlert({ type: 'success', text: '🔔 পারমিশন পেয়ে টেস্ট নোটিফিকেশন দেখানো হয়েছে!' });
        } else {
          setAlert({ type: 'error', text: 'আপনার ব্রাউজারে নোটিফিকেশন পারমিশন দেওয়া নেই।' });
        }
      }
    } catch (e: any) {
      setAlert({ type: 'error', text: 'টেস্ট নোটিফিকেশন এরর: ' + e.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
              <BellRing className="w-5 h-5 text-white" />
            </span>
            <h1 className="text-xl font-black tracking-tight">পুশ নোটিফিকেশন ড্যাশবোর্ড</h1>
          </div>
          <p className="text-xs text-white/80 max-w-xl leading-relaxed">
            এখান থেকে এক ক্লিকে সকল নিবন্ধিত খেলোয়াড় ও ইউজারের মোবাইলে সরাসরি ব্যাকগ্রাউন্ড পুশ নোটিফিকেশন পাঠান।
            অ্যাপ বন্ধ থাকলেও ইউজাররা তাদের ফোনের স্ট্যাটাস বারে নোটিফিকেশন পাবে।
          </p>
        </div>

        {/* Live Subscriber Badge */}
        <div className="flex items-center gap-3 bg-black/25 backdrop-blur-md p-3 px-4 rounded-2xl border border-white/10">
          <Users className="w-6 h-6 text-amber-300" />
          <div>
            <div className="text-[10px] text-white/80 font-bold uppercase tracking-wider">
              অ্যাক্টিভ পুশ সাবস্ক্রাইবার
            </div>
            <div className="text-xl font-black text-white font-mono flex items-center gap-2">
              <span>{subscribersCount} ডিভাইস</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {alert && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold ${
            alert.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400'
          }`}
        >
          {alert.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{alert.text}</span>
        </div>
      )}

      {/* Grid: Form & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Notification Composer */}
        <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/5">
            <div>
              <h2 className="text-base font-black text-gray-900 dark:text-white">
                নতুন নোটিফিকেশন তৈরি করুন
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                সকল মোবাইল ও ডেস্কটপ ডিভাইসে তৎক্ষণাৎ পৌঁছে যাবে
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-red-600/10 text-red-600 text-[10px] font-black uppercase tracking-wider">
              Instant Push
            </span>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>কুইক প্রি-সেট বার্তা (Quick Templates):</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="text-left p-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:border-red-500 dark:hover:border-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all text-xs cursor-pointer group"
                >
                  <div className="font-bold text-gray-900 dark:text-white group-hover:text-red-600 transition-colors truncate">
                    {p.title}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {p.message}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSendNotification} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                নোটিফিকেশন শিরোনাম (Title) *
              </label>
              <input
                type="text"
                required
                placeholder="যেমন: 🔥 আজকের মেগা টুর্নামেন্ট শুরু!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                বার্তা / মেসেজ (Message Body) *
              </label>
              <textarea
                required
                rows={3}
                placeholder="ইউজাররা নোটিফিকেশনে যে মেসেজ দেখবে..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:border-red-500 resize-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  টার্গেট ইউআরএল (ক্লিক করলে যেখানে যাবে)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: /matches বা /wallet"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-mono text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  আইকন লিঙ্ক (Icon URL)
                </label>
                <input
                  type="text"
                  placeholder="/icon-192.png"
                  value={iconUrl}
                  onChange={(e) => setIconUrl(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-mono text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={sending}
                className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>পাঠানো হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>🚀 সকল ডিভাইসে পুশ পাঠান</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleTestNotification}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span>টেস্ট করুন (এই ডিভাইসে)</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Information Card */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-black">কীভাবে কাজ করে?</h3>
            </div>
            <ul className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold mt-0.5">
                  ১
                </span>
                <span>
                  <strong>ব্যাকগ্রাউন্ড নোটিফিকেশন:</strong> ইউজার অ্যাপ বা ব্রাউজার বন্ধ রাখলেও সরাসরি ফোনের নোটিফিকেশন বারে মেসেজ যাবে।
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold mt-0.5">
                  ২
                </span>
                <span>
                  <strong>অ্যান্ড্রয়েড APK ইন্টিগ্রেশন:</strong> আমাদের ওয়েবসাইট থেকে ডাউনলোড করা অ্যাপে স্বয়ংক্রিয়ভাবে নোটিফিকেশন চ্যানেল তৈরি হয়।
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold mt-0.5">
                  ৩
                </span>
                <span>
                  <strong>ক্লিক করলে সরাসরি লিঙ্ক:</strong> নোটিফিকেশনে ট্যাপ করলে সরাসরি ম্যাচ পেজ বা ওয়ালেট পেজে নিয়ে যাবে।
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Section: Sent History */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-black text-gray-900 dark:text-white">
              পূর্ববর্তী প্রেরিত নোটিফিকেশন হিস্ট্রি ({history.length})
            </h3>
          </div>
          <button
            onClick={fetchStats}
            className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 font-bold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> রিফ্রেশ
          </button>
        </div>

        {history.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-xs">
            এখনও কোনো নোটিফিকেশন পাঠানো হয়নি।
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {history.map((item) => (
              <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <span>{item.title}</span>
                    {item.url && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400">
                        {item.url}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-600 dark:text-gray-300">
                    {item.body}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-gray-500 flex-shrink-0">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                    ✓ {item.successCount} সফল
                  </span>
                  <span>{new Date(item.sentAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
