'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Check, AlertCircle, Info, ShieldAlert, Send } from 'lucide-react';
import { useCMS } from '@/lib/cms-store';

export default function AdminRulesPage() {
  const { settings, updateSiteSettings } = useCMS();

  const [noticeText, setNoticeText] = useState(settings.noticeText);
  const [defaultRules, setDefaultRules] = useState(settings.defaultRules);
  const [howToJoinGuide, setHowToJoinGuide] = useState(settings.howToJoinGuide);
  const [telegramUrl, setTelegramUrl] = useState(settings.telegramUrl);
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Synchronize form whenever settings loads or updates from CMS
  useEffect(() => {
    if (settings) {
      setNoticeText(settings.noticeText || '');
      setDefaultRules(settings.defaultRules || '');
      setHowToJoinGuide(settings.howToJoinGuide || '');
      setTelegramUrl(settings.telegramUrl || '');
      setWhatsappNumber(settings.whatsappNumber || '');
    }
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteSettings({
      noticeText,
      defaultRules,
      howToJoinGuide,
      telegramUrl,
      whatsappNumber,
    });
    setToast({ text: 'টুর্নামেন্ট রুলস ও নোটিশ সফলভাবে সংরক্ষিত হয়েছে!', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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
      <div className="pb-4 border-b border-gray-200 dark:border-white/10">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-red-600" />
          টুর্নামেন্ট রুলস ও লাইভ নোটিশ কন্ট্রোল
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          সাইটের শীর্ষে চলমান নোটিশ টেক্সট, ১৮+ নিয়ম ও শর্তাবলী এবং জয়েনিং গাইডলাইন বাংলায় পরিবর্তন করুন।
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Top Notice Marquee */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white">
              <Info className="w-4 h-4 text-red-600" />
              <span>শীর্ষ লাল নোটিশ বার টেক্সট (Top Announcement Marquee)</span>
            </div>
            <textarea
              rows={3}
              required
              value={noticeText}
              onChange={(e) => setNoticeText(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-medium focus:outline-none focus:border-red-500"
            />
            <span className="text-[11px] text-gray-500">
              * এই টেক্সটটি ওয়েবসাইটের একদম উপরে লাল ব্যানারে স্ক্রল আকারে প্লেয়ারদের কাছে প্রদর্শিত হবে।
            </span>
          </div>

          {/* 18+ Rules */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>১৮+ টুর্নামেন্ট ও রুমের সার্বজনীন নিয়মাবলী (Tournament Rules & Conditions)</span>
            </div>
            <textarea
              rows={8}
              required
              value={defaultRules}
              onChange={(e) => setDefaultRules(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-medium leading-relaxed focus:outline-none focus:border-red-500"
            />
            <span className="text-[11px] text-gray-500">
              * প্রতিটি ক্যাটাগরি ও ম্যাচের নিচে প্লেয়ারদের জন্য এই নিয়মগুলো দেখানো হবে।
            </span>
          </div>

          {/* How to Join */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-900 dark:text-white block">
              'টুর্নামেন্টে কিভাবে যোগদান করবেন ?' পপ-আপ গাইড
            </label>
            <textarea
              rows={4}
              required
              value={howToJoinGuide}
              onChange={(e) => setHowToJoinGuide(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-medium leading-relaxed focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Social Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                টেলিগ্রাম সাপোর্ট গ্রুপ লিংক
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
                হোয়াটসঅ্যাপ সাপোর্ট নম্বর (e.g. 8801700000000)
              </label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-mono focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl text-xs font-black btn-red shadow-md shadow-red-600/30"
            >
              রুলস ও নোটিশ সেভ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
