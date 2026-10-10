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
  const [importantNoticeTitle, setImportantNoticeTitle] = useState(settings.importantNoticeTitle || 'Important Notice');
  const [importantNoticeBody, setImportantNoticeBody] = useState(settings.importantNoticeBody || '');
  const [importantNoticeEnabled, setImportantNoticeEnabled] = useState(settings.importantNoticeEnabled ?? true);
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
      setImportantNoticeTitle(settings.importantNoticeTitle || 'Important Notice');
      setImportantNoticeBody(settings.importantNoticeBody || '');
      setImportantNoticeEnabled(settings.importantNoticeEnabled ?? true);
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
      importantNoticeTitle,
      importantNoticeBody,
      importantNoticeEnabled,
    });
    setToast({ text: 'Tournament rules, notices, and payment numbers saved successfully!', type: 'success' });
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
          Tournament Rules & Live Notice Desk
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Manage header marquee notices, universal tournament rules, and category-specific rulesets (CS 4v4, BR, Special Match).
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Important Notice Modal Settings */}
          <div className="p-4 sm:p-5 rounded-2xl border-2 border-orange-500/40 bg-orange-500/5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-orange-500/20">
              <div className="flex items-center gap-2 text-xs font-black text-orange-500">
                <span className="text-base">⚠️</span>
                <span>Important Notice Pop-up Modal (অ্যাপ / ওয়েবসাইটের প্রধান পপ-আপ নোটিশ)</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {importantNoticeEnabled ? 'সক্রিয় (Active)' : 'বন্ধ (Disabled)'}
                </span>
                <input
                  type="checkbox"
                  checked={importantNoticeEnabled}
                  onChange={(e) => setImportantNoticeEnabled(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  পপ-আপ টাইটেল (Popup Title)
                </label>
                <input
                  type="text"
                  value={importantNoticeTitle}
                  onChange={(e) => setImportantNoticeTitle(e.target.value)}
                  placeholder="Important Notice"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  নোটিশের মূল বিষয়বস্তু (Notice Body / Rules Text with Emojis)
                </label>
                <textarea
                  rows={8}
                  value={importantNoticeBody}
                  onChange={(e) => setImportantNoticeBody(e.target.value)}
                  placeholder="Enter notice text..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/30 text-xs font-medium leading-relaxed focus:outline-none focus:border-orange-500 whitespace-pre-wrap"
                />
              </div>
            </div>

            <p className="text-[11px] text-orange-600 dark:text-orange-400 font-medium">
              💡 এই নোটিশটি প্লেয়াররা অ্যাপে বা ওয়েবসাইটে প্রবেশ করা মাত্র স্ক্রিনে ভেসে উঠবে। প্লেয়ার &apos;GOT IT&apos; চাপলে নোটিশটি বন্ধ হবে।
            </p>
          </div>

          {/* Top Notice Marquee */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white">
              <Info className="w-4 h-4 text-red-600" />
              <span>Top Announcement Marquee Text</span>
            </div>
            <textarea
              rows={3}
              required
              value={noticeText}
              onChange={(e) => setNoticeText(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-medium focus:outline-none focus:border-red-500"
            />
            <span className="text-[11px] text-gray-500">
              * This text scrolls continuously in the red top announcement bar across all client pages.
            </span>
          </div>

          {/* Category-Specific Rules Section */}
          <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs font-black text-amber-500">
                <ShieldAlert className="w-4 h-4" />
                <span>Category-Specific Rules</span>
              </div>
              <span className="text-[10px] text-amber-500/80 font-bold">
                Select a category below to configure custom rules
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
                Rules for {categories[selectedRuleCategory]?.name || selectedRuleCategory}:
              </label>
              <textarea
                rows={6}
                value={categoryRules[selectedRuleCategory] || ''}
                placeholder={`Enter custom rules, gun restrictions, or format guidelines for ${categories[selectedRuleCategory]?.name || 'this category'}...`}
                onChange={(e) => handleCategoryRuleChange(selectedRuleCategory, e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 text-xs font-medium leading-relaxed focus:outline-none focus:border-amber-500 font-mono"
              />
              <span className="text-[10px] text-gray-500 block">
                * When a player joins a match in this category, these specific rules will take priority.
              </span>
            </div>
          </div>

          {/* Universal Rules */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>Universal Platform Rules (Default Fallback)</span>
            </div>
            <textarea
              rows={6}
              required
              value={defaultRules}
              onChange={(e) => setDefaultRules(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-medium leading-relaxed focus:outline-none focus:border-red-500"
            />
            <span className="text-[11px] text-gray-500">
              * Displayed automatically whenever a category does not have dedicated custom rules.
            </span>
          </div>

          {/* Official Payment Numbers */}
          <div className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 space-y-3">
            <h3 className="text-xs font-black text-gray-900 dark:text-white">
              Official Payment Numbers (Deposit / Withdrawal)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-pink-600 block mb-1">
                  bKash Personal Number
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
                  Nagad Personal Number
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
              "How to Join Tournament" Instruction Modal
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
                Telegram Support Channel / Group URL
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
                WhatsApp Support Number (e.g. 8801700000000)
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
              Save All Rules & Notices
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
