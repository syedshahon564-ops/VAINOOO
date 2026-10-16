'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  Check,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useCMS, BannerSlide } from '@/lib/cms-store';
import ImageUploadInput from '@/components/ImageUploadInput';

const DEFAULT_INITIAL_BANNERS: BannerSlide[] = [
  {
    id: 'slide-1',
    badge: 'CHAMPIONSHIP 2026',
    title: 'দৈনিক ফ্রি ফায়ার টুর্নামেন্ট লাইভ!',
    subtitle: 'ব্যাটল রয়্যাল, ক্ল্যাশ স্কোয়াড ৪v৪, লোন উলফ এবং ১v১ হেডশট লড়াই। বিকাশ/নগদে প্রাইজ উইথড্র।',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1400',
    actionText: 'Join Now',
    actionUrl: '/matches',
  },
  {
    id: 'slide-2',
    badge: 'MEGA CASH PRIZE',
    title: 'স্কোয়াড ও সোলো মেগা প্রাইজ টুর্নামেন্ট',
    subtitle: 'প্রতিটি বুইয়াহ ও কিলে নিশ্চিত ক্যাশ রিওয়ার্ড। সরাসরি বিকাশ ও নগদে সুপার ফাস্ট পেমেন্ট উইথড্রল!',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1400',
    actionText: 'Join Now',
    actionUrl: '/matches',
  },
  {
    id: 'slide-3',
    badge: '100% SAFE & AUTOMATED',
    title: 'ADVANCED ANTI-CHEAT & INSTANT WITHDRAW',
    subtitle: 'সম্পূর্ণ ফেয়ার টুর্নামেন্ট সিকিউরিটি ও ২৪/৭ লাইভ কাস্টমার সাপোর্ট। আইডি লেভেল ৫৫+ বাধ্যতামূলক।',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1400',
    actionText: 'Telegram Support',
    actionUrl: 'https://t.me/ffrivaltourbd',
  },
];

export default function AdminBannersPage() {
  const { settings, updateSiteSettings, loaded } = useCMS();

  const [bannerSlidesList, setBannerSlidesList] = useState<BannerSlide[]>(
    settings.banners && settings.banners.length > 0 ? settings.banners : DEFAULT_INITIAL_BANNERS
  );
  const [isSavingBanners, setIsSavingBanners] = useState(false);
  const [previewSlideIdx, setPreviewSlideIdx] = useState(0);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Synchronize when settings finish loading
  useEffect(() => {
    if (settings.banners && Array.isArray(settings.banners) && settings.banners.length > 0) {
      setBannerSlidesList(settings.banners);
    }
  }, [loaded, settings.bannersUpdatedAt, settings.updatedAt]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAddNewSlide = () => {
    const newSlide: BannerSlide = {
      id: 'slide-' + Date.now(),
      badge: 'NEW PROMO',
      title: 'New Tournament Banner',
      subtitle: '',
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1400',
      actionText: 'Join Now',
      actionUrl: '/matches',
    };
    setBannerSlidesList((prev) => [...prev, newSlide]);
    setPreviewSlideIdx(bannerSlidesList.length);
    showToast('New slide added! Remember to click "Save Banners".');
  };

  const handleRemoveSlide = (idx: number) => {
    if (bannerSlidesList.length <= 1) {
      showToast('At least one banner slide is required.', 'error');
      return;
    }
    const updated = bannerSlidesList.filter((_, i) => i !== idx);
    setBannerSlidesList(updated);
    if (previewSlideIdx >= updated.length) {
      setPreviewSlideIdx(Math.max(0, updated.length - 1));
    }
    showToast('Slide removed! Click "Save Banners" to apply.');
  };

  const handleMoveSlide = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= bannerSlidesList.length) return;
    const updated = [...bannerSlidesList];
    const [movedItem] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, movedItem);
    setBannerSlidesList(updated);
    setPreviewSlideIdx(toIdx);
  };

  const handleUpdateSlideField = (idx: number, field: keyof BannerSlide, value: string) => {
    setBannerSlidesList((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleSaveBannersDirectly = async () => {
    setIsSavingBanners(true);
    try {
      await updateSiteSettings({
        banners: bannerSlidesList,
      });
      showToast('Banners saved and synced across website and mobile app!');
    } catch {
      showToast('Failed to save banners', 'error');
    } finally {
      setIsSavingBanners(false);
    }
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

      {/* Header & Quick Action Card */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <ImageIcon className="w-6 h-6 text-amber-500" />
              Home Banner Carousel & Slide Manager
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              স্লাইডের ছবি পরিবর্তন করুন (কম্পিউটার/মোবাইল থেকে আপলোড অথবা ছবির লিঙ্ক দিন), নতুন স্লাইড যোগ করুন, সাজান এবং সরাসরি সেভ করুন।
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleAddNewSlide}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Slide</span>
            </button>

            <button
              type="button"
              onClick={handleSaveBannersDirectly}
              disabled={isSavingBanners}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-all cursor-pointer"
            >
              {isSavingBanners ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Banners</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Interactive Carousel Preview */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Live App / Web Carousel Simulation (Slide {previewSlideIdx + 1} of {bannerSlidesList.length})
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setPreviewSlideIdx((prev) =>
                    prev > 0 ? prev - 1 : bannerSlidesList.length - 1
                  )
                }
                className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 cursor-pointer"
                title="Previous Slide"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setPreviewSlideIdx((prev) =>
                    prev < bannerSlidesList.length - 1 ? prev + 1 : 0
                  )
                }
                className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 cursor-pointer"
                title="Next Slide"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {bannerSlidesList[previewSlideIdx] && (
            <div className="relative rounded-2xl overflow-hidden h-[190px] sm:h-[240px] border border-amber-500/30 shadow-xl bg-slate-950 flex flex-col justify-end group">
              {/* Pure Banner Graphic Display */}
              <img
                src={bannerSlidesList[previewSlideIdx].image || '/logo.png'}
                alt={bannerSlidesList[previewSlideIdx].title || 'Slide'}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Subtle Bottom Target URL Pill */}
              <div className="relative z-10 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-400 bg-black/60 px-2 py-0.5 rounded border border-amber-500/30">
                  Slide #{previewSlideIdx + 1}: {bannerSlidesList[previewSlideIdx].title || 'Banner'}
                </span>
                {bannerSlidesList[previewSlideIdx].actionUrl && (
                  <span className="text-[10px] font-mono text-gray-300 bg-black/60 px-2 py-0.5 rounded">
                    Target: {bannerSlidesList[previewSlideIdx].actionUrl}
                  </span>
                )}
              </div>

              {/* Dots indicator */}
              <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5">
                {bannerSlidesList.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPreviewSlideIdx(i)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      i === previewSlideIdx
                        ? 'w-6 bg-amber-400'
                        : 'w-2 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* List of Slide Cards for Editing */}
      <div className="space-y-5">
        {bannerSlidesList.map((slide, idx) => (
          <div
            key={slide.id || idx}
            className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-5 sm:p-6 space-y-5 shadow-sm hover:border-amber-500/40 transition-all"
          >
            {/* Slide Card Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-black">
                  Slide #{idx + 1}
                </span>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                  {slide.badge || 'No Badge'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMoveSlide(idx, idx - 1)}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Move Up in order"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Up</span>
                </button>

                <button
                  type="button"
                  disabled={idx === bannerSlidesList.length - 1}
                  onClick={() => handleMoveSlide(idx, idx + 1)}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Move Down in order"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Down</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewSlideIdx(idx)}
                  className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Preview this slide above"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRemoveSlide(idx)}
                  className="p-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-1 hover:bg-red-100 cursor-pointer"
                  title="Delete this slide"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Remove</span>
                </button>
              </div>
            </div>

            {/* Slide Image Uploader */}
            <div className="space-y-1">
              <ImageUploadInput
                label={`Slide #${idx + 1} Artwork Image (ছবি পরিবর্তন / আপলোড)`}
                value={slide.image || ''}
                onChange={(url) => handleUpdateSlideField(idx, 'image', url)}
                helperText="Upload image file from computer/device, or paste an external image URL."
              />
            </div>

            {/* Slide Configuration Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Top Badge / Label:
                </label>
                <input
                  type="text"
                  placeholder="e.g. MEGA CASH PRIZE"
                  value={slide.badge || ''}
                  onChange={(e) => handleUpdateSlideField(idx, 'badge', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Slide Title / Identifier:
                </label>
                <input
                  type="text"
                  placeholder="e.g. দৈনিক টুর্নামেন্ট লাইভ!"
                  value={slide.title || ''}
                  onChange={(e) => handleUpdateSlideField(idx, 'title', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Click Action Target URL:
                </label>
                <input
                  type="text"
                  placeholder="e.g. /matches or https://t.me/..."
                  value={slide.actionUrl || ''}
                  onChange={(e) => handleUpdateSlideField(idx, 'actionUrl', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-mono text-gray-800 dark:text-gray-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Save Button Bar at Bottom */}
      <div className="sticky bottom-6 z-30 p-4 rounded-2xl bg-white/95 dark:bg-[#12121a]/95 backdrop-blur-md border border-gray-200 dark:border-white/10 shadow-2xl flex items-center justify-between gap-4">
        <div className="text-xs font-bold text-gray-600 dark:text-gray-400">
          Showing {bannerSlidesList.length} slide{bannerSlidesList.length > 1 ? 's' : ''}.
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddNewSlide}
            className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black border border-amber-500/30 transition-all cursor-pointer"
          >
            + Add Another Slide
          </button>
          <button
            type="button"
            onClick={handleSaveBannersDirectly}
            disabled={isSavingBanners}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-all cursor-pointer"
          >
            {isSavingBanners ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All Banners</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
