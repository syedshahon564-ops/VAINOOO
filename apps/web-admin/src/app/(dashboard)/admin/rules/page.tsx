'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Check, AlertCircle, Info, ShieldAlert, Send } from 'lucide-react';
import { useCMS } from '@/lib/cms-store';

export default function AdminRulesPage() {
  const { settings, categories, updateSiteSettings } = useCMS();

  const [noticeText, setNoticeText] = useState(settings.noticeText);
  const [defaultRules, setDefaultRules] = useState(settings.defaultRules);
  const [categoryRules, setCategoryRules] = useState<Record<string, string>>(settings.categoryRules || {});
  const [selectedRuleCategory, setSelectedRuleCategory] = useState<string>('clash-squad');
  const [howToJoinGuide, setHowToJoinGuide] = useState(settings.howToJoinGuide);
  const [telegramUrl, setTelegramUrl] = useState(settings.telegramUrl);
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber);
  const [bkashNumber, setBkashNumber] = useState(settings.bkashNumber || '01886121980');
  const [nagadNumber, setNagadNumber] = useState(settings.nagadNumber || '01886121980');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Synchronize form whenever settings loads or updates from CMS
  useEffect(() => {
    if (settings) {
      setNoticeText(settings.noticeText || '');
      setDefaultRules(settings.defaultRules || '');
      setCategoryRules(settings.categoryRules || {});
      setHowToJoinGuide(settings.howToJoinGuide || '');
      setTelegramUrl(settings.telegramUrl || '');
      setWhatsappNumber(settings.whatsappNumber || '');
      setBkashNumber(settings.bkashNumber || '01886121980');
      setNagadNumber(settings.nagadNumber || '01886121980');
    }
  }, [settings]);

  const handleCategoryRuleChange = (slug: string, text: string) => {
    setCategoryRules((prev) => ({
      ...prev,
      [slug]: text,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteSettings({
      noticeText,
      defaultRules,
      categoryRules,
      howToJoinGuide,
      telegramUrl,
      whatsappNumber,
      bkashNumber,
      nagadNumber,
    });
    setToast({ text: 'টুর্নামেন্ট রুলস, ক্যাটাগরি নিয়ম ও পেমেন্ট নম্বর সফলভাবে সংরক্ষিত হয়েছে!', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const categoriesList = Object.values(categories || {});

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
          সাইটের শীর্ষে নোটিশ, সার্বজনীন নিয়ম এবং প্রতিটি ক্যাটাগরির (CS 4v4, BR, Special Match ইত্যাদি) জন্য আলাদা নিয়ম সেট করুন।
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
              * এই টেক্সটটি ওয়েবসাইটের একদম উপরে লাল ব্যানারে ট্রেন অ্যানিমেশনের মতো স্ক্রল আকারে প্লেয়ারদের কাছে প্রদর্শিত হবে।
            </span>
          </div>

          {/* Category-Specific Rules Section */}
          <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs font-black text-amber-500">
                <ShieldAlert className="w-4 h-4" />
                <span>ক্যাটাগরি অনুযায়ী আলাদা আলাদা রুলস (Category-Specific Rules)</span>
              </div>
              <span className="text-[10px] text-amber-500/80 font-bold">
                ক্যাটাগরি সিলেক্ট করে ভিন্ন ভিন্ন নিয়ম লিখুন
              </span>
            </div>

            {/* Category Select Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {categoriesList.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setSelectedRuleCategory(cat.slug)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border ${
                    selectedRuleCategory === cat.slug
                      ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                      : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-amber-400'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                {categories[selectedRuleCategory]?.name || selectedRuleCategory} এর জন্য নির্ধারিত নিয়মাবলী:
              </label>
              <textarea
                rows={6}
                value={categoryRules[selectedRuleCategory] || ''}
                placeholder={`এখানে ${categories[selectedRuleCategory]?.name || 'এই ক্যাটাগরির'} বিশেষ রুলস ও শর্তসমূহ লিখুন...`}
                onChange={(e) => handleCategoryRuleChange(selectedRuleCategory, e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 text-xs font-medium leading-relaxed focus:outline-none focus:border-amber-500 font-mono"
              />
              <span className="text-[10px] text-gray-500 block">
                * যখন প্লেয়ার এই ক্যাটাগরির ম্যাচ খেলবে, তখন তার সামনে এই ক্যাটাগরির নির্দিষ্ট নিয়মটি সবার আগে প্রদর্শিত হবে।
              </span>
            </div>
          </div>

          {/* Universal 18+ Rules */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>১৮+ টুর্নামেন্ট ও রুমের সার্বজনীন সাধারণ নিয়মাবলী (General Default Rules)</span>
            </div>
            <textarea
              rows={6}
              required
              value={defaultRules}
              onChange={(e) => setDefaultRules(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-medium leading-relaxed focus:outline-none focus:border-red-500"
            />
            <span className="text-[11px] text-gray-500">
              * কোনো ক্যাটাগরির আলাদা নিয়ম না থাকলে স্বয়ংক্রিয়ভাবে এই সার্বজনীন নিয়মগুলো প্রদর্শিত হবে।
            </span>
          </div>

          {/* Official Payment Numbers */}
          <div className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 space-y-3">
            <h3 className="text-xs font-black text-gray-900 dark:text-white">
              অফিশিয়াল পেমেন্ট নম্বর (Official Deposit / Withdraw Numbers)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-pink-600 block mb-1">
                  bKash পার্সোনাল নম্বর
                </label>
                <input
                  type="text"
                  value={bkashNumber}
                  onChange={(e) => setBkashNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/30 text-xs font-mono font-bold focus:outline-none focus:border-pink-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-amber-600 block mb-1">
                  Nagad পার্সোনাল নম্বর
                </label>
                <input
                  type="text"
                  value={nagadNumber}
                  onChange={(e) => setNagadNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/30 text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* How to Join */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-900 dark:text-white block">
              'টুর্নামেন্টে কিভাবে যোগদান করবেন ?' পপ-আপ গাইড
            </label>
            <textarea
              rows={3}
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
              সব রুলস ও সেটিংস সেভ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
