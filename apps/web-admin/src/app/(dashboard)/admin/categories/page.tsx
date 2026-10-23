'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderEdit,
  Check,
  AlertCircle,
  Image as ImageIcon,
  ArrowLeft,
  Trash2,
  Plus,
  X,
  Layers,
  Sparkles,
  Info,
  Hash,
  ShieldCheck,
} from 'lucide-react';
import { useCMS } from '@/lib/cms-store';
import ImageUploadInput from '@/components/ImageUploadInput';

const SECTION_PRESETS = [
  'FREE FIRE MATCHES',
  'FREE FIRE MATCH 1 VS 1',
  'ONLY HEADSHOT',
  'CLASH SQUAD ARENA',
  'SPECIAL TOURNAMENTS',
  'CUSTOM ROOM BATTLES',
];

const DEFAULT_NEW_RULES = `⚠️ টুর্নামেন্টের সাধারণ নিয়মাবলী:
১. মোবাইল ডিভাইসের মাধ্যমে খেলতে হবে (এমুলেটর নিষিদ্ধ)।
২. রুম শুরুর ৫ মিনিট পূর্বে আইডি ও পাসওয়ার্ড অ্যাপে পেয়ে যাবেন।
৩. কোনো প্রকার হ্যাক, কনফিগ বা থার্ড-পার্টি ফাইল ব্যবহার করলে অ্যাকাউন্ট ব্যান হবে।
৪. কাস্টম রুমে ঢুকে ও ম্যাচ শেষে রেজাল্টের স্ক্রিনশট রাখা বাধ্যতামূলক।`;

export default function AdminCategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory, loaded } = useCMS();
  const categoriesList = Object.values(categories);

  const [selectedSlug, setSelectedSlug] = useState('classic-match');
  const activeCategory = categories[selectedSlug] || categories['classic-match'];

  // Current category editing form
  const [name, setName] = useState(activeCategory?.name || '');
  const [section, setSection] = useState(activeCategory?.section || '');
  const [bannerImage, setBannerImage] = useState(activeCategory?.bannerImage || '');
  const [avatarImage, setAvatarImage] = useState(activeCategory?.avatarImage || '');
  const [description, setDescription] = useState(activeCategory?.description || '');
  const [customRules, setCustomRules] = useState(activeCategory?.customRules || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New category modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [newCatSection, setNewCatSection] = useState('FREE FIRE MATCHES');
  const [newCatBanner, setNewCatBanner] = useState('');
  const [newCatAvatar, setNewCatAvatar] = useState('');
  const [newCatDescription, setNewCatDescription] = useState('');
  const [newCatRules, setNewCatRules] = useState(DEFAULT_NEW_RULES);
  const [isCreating, setIsCreating] = useState(false);

  // Synchronize form fields when user switches category OR when CMS finishes loading
  const currentCat = categories[selectedSlug];
  useEffect(() => {
    if (currentCat) {
      setName(currentCat.name || '');
      setSection(currentCat.section || '');
      setBannerImage(currentCat.bannerImage || '');
      setAvatarImage(currentCat.avatarImage || '');
      setDescription(currentCat.description || '');
      setCustomRules(currentCat.customRules || '');
    } else if (categoriesList.length > 0 && !categories[selectedSlug]) {
      // If currently selected slug was deleted, select first available category
      const firstSlug = Object.keys(categories)[0];
      if (firstSlug) setSelectedSlug(firstSlug);
    }
  }, [selectedSlug, loaded, currentCat?.updatedAt]);

  const handleSelectCategory = (slug: string) => {
    setSelectedSlug(slug);
    const cat = categories[slug];
    if (cat) {
      setName(cat.name);
      setSection(cat.section);
      setBannerImage(cat.bannerImage);
      setAvatarImage(cat.avatarImage);
      setDescription(cat.description);
      setCustomRules(cat.customRules || '');
    }
  };

  // Auto-generate slug when name changes (if not manually overridden)
  const handleNewNameChange = (val: string) => {
    setNewCatName(val);
    if (!isSlugManuallyEdited) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setNewCatSlug(generated);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setToast({ text: 'অনুগ্রহ করে ক্যাটাগরির নাম লিখুন (Enter category name)', type: 'error' });
      return;
    }

    setIsCreating(true);
    try {
      const res = await addCategory({
        slug: newCatSlug.trim(),
        name: newCatName.trim(),
        section: newCatSection.trim() || 'FREE FIRE MATCHES',
        bannerImage: newCatBanner.trim() || '/logo.png',
        avatarImage: newCatAvatar.trim() || newCatBanner.trim() || '/logo.png',
        description: newCatDescription.trim(),
        customRules: newCatRules.trim(),
      });

      if (res && res.ok) {
        setToast({
          text: `🎉 নতুন ক্যাটাগরি "${newCatName.trim()}" সফলভাবে যোগ করা হয়েছে!`,
          type: 'success',
        });
        setShowCreateModal(false);
        // Reset modal fields
        setNewCatName('');
        setNewCatSlug('');
        setIsSlugManuallyEdited(false);
        setNewCatBanner('');
        setNewCatAvatar('');
        setNewCatDescription('');
        setNewCatRules(DEFAULT_NEW_RULES);
        setNewCatSection('FREE FIRE MATCHES');

        // Select the newly created category immediately
        handleSelectCategory(res.slug);
      }
    } catch (err: any) {
      setToast({
        text: err?.message || 'ক্যাটাগরি তৈরি করতে সমস্যা হয়েছে (Failed to create category)',
        type: 'error',
      });
    } finally {
      setIsCreating(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateCategory(selectedSlug, {
        name,
        section,
        bannerImage,
        avatarImage,
        description,
        customRules,
      });
      setToast({ text: `ক্যাটাগরি "${name}" সফলভাবে আপডেট হয়েছে!`, type: 'success' });
    } catch {
      setToast({ text: `Failed to update category`, type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDelete = async () => {
    if (!selectedSlug) return;
    const confirmDelete = window.confirm(
      `আপনি কি নিশ্চিত যে "${name || selectedSlug}" ক্যাটাগরি ডিলিট করতে চান?\nAre you sure you want to delete this category? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      await deleteCategory(selectedSlug);
      setToast({ text: `Category "${name || selectedSlug}" deleted successfully!`, type: 'success' });
      const remainingSlugs = Object.keys(categories).filter((s) => s !== selectedSlug);
      if (remainingSlugs.length > 0) {
        handleSelectCategory(remainingSlugs[0]);
      }
    } catch {
      setToast({ text: 'Failed to delete category', type: 'error' });
    } finally {
      setIsDeleting(false);
      setTimeout(() => setToast(null), 3500);
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

      {/* Header with Add Category Action */}
      <div className="pb-4 border-b border-gray-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <FolderEdit className="w-6 h-6 text-red-600" />
            Categories & Tournament Modes
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            ম্যানেজ ও নতুন টুর্নামেন্ট ক্যাটাগরি যোগ করুন। ব্যানারের ছবি, আইকন এবং বিশেষ নিয়মাবলী সেট করুন।
          </p>
        </div>

        {/* Highlighted Add Category Button */}
        <button
          onClick={() => {
            setShowCreateModal(true);
            setIsSlugManuallyEdited(false);
            setNewCatName('');
            setNewCatSlug('');
            setNewCatBanner('');
            setNewCatAvatar('');
            setNewCatDescription('');
            setNewCatRules(DEFAULT_NEW_RULES);
          }}
          className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer flex-shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>নতুন ক্যাটাগরি যোগ করুন (+ Add Category)</span>
        </button>
      </div>

      {/* Category Selection Tabs Grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            উপলব্ধ ক্যাটাগরিসমূহ ({categoriesList.length})
          </span>
          <span className="text-[10px] text-gray-400">
            ক্লিক করে সিলেক্ট করুন ও বিস্তারিত এডিট করুন
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {categoriesList.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => handleSelectCategory(cat.slug)}
              className={`p-3 rounded-xl border text-center transition-all relative ${
                selectedSlug === cat.slug
                  ? 'border-red-600 bg-red-50 dark:bg-red-950/40 ring-2 ring-red-500 shadow-md'
                  : 'border-gray-200 dark:border-white/10 hover:border-red-400 bg-white dark:bg-[#12121a]'
              }`}
            >
              <div className="w-10 h-10 rounded-full mx-auto overflow-hidden mb-1.5 border border-white/20 bg-slate-800">
                <img
                  src={cat.avatarImage || cat.bannerImage || '/logo.png'}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.png';
                  }}
                />
              </div>
              <span className="text-[11px] font-black block truncate text-gray-900 dark:text-white">
                {cat.name}
              </span>
              <span className="text-[9px] text-gray-500 uppercase block truncate">
                {cat.section}
              </span>
            </button>
          ))}

          {/* Quick Add Button inside the Grid */}
          <button
            onClick={() => {
              setShowCreateModal(true);
              setIsSlugManuallyEdited(false);
              setNewCatName('');
              setNewCatSlug('');
              setNewCatBanner('');
              setNewCatAvatar('');
              setNewCatDescription('');
              setNewCatRules(DEFAULT_NEW_RULES);
            }}
            className="p-3 rounded-xl border-2 border-dashed border-red-500/40 hover:border-red-600 hover:bg-red-50/50 dark:hover:bg-red-950/30 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center bg-red-100 dark:bg-red-950/60 text-red-600 group-hover:scale-110 transition-transform mb-1.5">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-black text-red-600 block truncate">
              + নতুন ক্যাটাগরি
            </span>
            <span className="text-[9px] text-gray-400 block truncate">
              Add New
            </span>
          </button>
        </div>
      </div>

      {/* Edit Form for Active Category */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-gray-100 dark:border-white/5 gap-2">
          <div>
            <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <span>এডিট করছেন: {name || selectedSlug}</span>
            </h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              এই ক্যাটাগরির নাম, ব্যানার এবং বিশেষ রুলস পরিবর্তন করে সেভ করুন।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              Slug / ID:
            </span>
            <span className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-white/5 text-[11px] font-mono font-bold text-red-600 dark:text-red-400 border border-gray-200 dark:border-white/10">
              {selectedSlug}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Category Name (ক্যাটাগরির নাম)
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Parent Section (মূল সেকশন নির্বাচন) <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-gray-400">এই ক্যাটাগরি কোন সেকশনে দেখাবে</span>
              </div>
              <input
                type="text"
                required
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. FREE FIRE MATCHES, FREE FIRE MATCH 1 VS 1, ONLY HEADSHOT"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-red-500 mb-2"
              />
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] text-gray-400 mr-1 self-center font-bold">ক্লিক করে সিলেক্ট করুন:</span>
                {[
                  { title: 'FREE FIRE MATCHES', label: '🔥 FREE FIRE MATCHES' },
                  { title: 'FREE FIRE MATCH 1 VS 1', label: '⚔️ FREE FIRE MATCH 1 VS 1' },
                  { title: 'ONLY HEADSHOT', label: '🎯 ONLY HEADSHOT' },
                ].map((p) => (
                  <button
                    key={p.title}
                    type="button"
                    onClick={() => setSection(p.title)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      section === p.title
                        ? 'border-red-500 bg-red-600 text-white font-black shadow-sm'
                        : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-red-400'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Banner Image Upload */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500">Banner Artwork</span>
                <button
                  type="button"
                  onClick={() => {
                    const def = '/logo.png';
                    setBannerImage(def);
                    setAvatarImage(def);
                  }}
                  className="text-[10px] font-bold text-red-600 hover:underline"
                >
                  Restore Default
                </button>
              </div>
              <ImageUploadInput
                label="Category Banner (Main Photo)"
                value={bannerImage}
                onChange={(url) => {
                  setBannerImage(url);
                  if (!avatarImage || avatarImage === bannerImage || avatarImage.includes('unsplash')) {
                    setAvatarImage(url);
                  }
                }}
                helperText="Upload image from device or drag-and-drop file"
              />
            </div>

            {/* Avatar Icon Upload */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500">Icon Thumbnail</span>
                <button
                  type="button"
                  onClick={() => {
                    const def = '/logo.png';
                    setAvatarImage(def);
                  }}
                  className="text-[10px] font-bold text-red-600 hover:underline"
                >
                  Restore Default
                </button>
              </div>
              <ImageUploadInput
                label="Circular Thumbnail / Avatar"
                value={avatarImage}
                onChange={(url) => {
                  setAvatarImage(url);
                  if (!bannerImage || bannerImage === avatarImage || bannerImage.includes('unsplash')) {
                    setBannerImage(url);
                  }
                }}
                isCircular={true}
                helperText="Upload circular avatar icon for category list"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              Description (সংক্ষিপ্ত বিবরণ)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. ফ্রি ফায়ার স্পেশাল টুর্নামেন্ট ও মেগা প্রাইজপুল"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-medium focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              Category-Specific Rules & Guidelines (ক্যাটাগরির বিশেষ নিয়মাবলী)
            </label>
            <textarea
              rows={4}
              placeholder="Enter special instructions or tournament rules for this category..."
              value={customRules}
              onChange={(e) => setCustomRules(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-medium focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
              className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? 'Deleting Category...' : 'Delete Category (ক্যাটাগরি ডিলিট)'}</span>
            </button>

            <button
              type="submit"
              disabled={isSaving || isDeleting}
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-black btn-red shadow-md shadow-red-600/30 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSaving ? 'Saving Category...' : 'Save Category Information (সেভ করুন)'}
            </button>
          </div>
        </form>
      </div>

      {/* CREATE NEW CATEGORY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#12121a] border border-gray-200 dark:border-white/10 shadow-2xl p-6 sm:p-8 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900 dark:text-white">
                    নতুন টুর্নামেন্ট ক্যাটাগরি তৈরি করুন
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Add a new tournament category to the app and admin panel
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateCategory} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Name */}
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    ক্যাটাগরির নাম (Category Name) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Solo Survival, CS 2v2, Custom Scrims"
                    value={newCatName}
                    onChange={(e) => handleNewNameChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Slug / Unique ID */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      ক্যাটাগরি স্লাগ / আইডি (Slug / ID)
                    </label>
                    <span className="text-[10px] text-gray-400">ইউনিক আইডি</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. solo-survival"
                      value={newCatSlug}
                      onChange={(e) => {
                        setIsSlugManuallyEdited(true);
                        setNewCatSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/^-+|-+$/g, '')
                        );
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-xs font-mono font-bold text-red-600 dark:text-red-400 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section Header & Preset Chips */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    মূল সেকশন নির্বাচন (Parent Section) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-gray-400">এই ক্যাটাগরি কোন সেকশনে দেখাবে</span>
                </div>
                <input
                  type="text"
                  required
                  value={newCatSection}
                  onChange={(e) => setNewCatSection(e.target.value)}
                  placeholder="e.g. FREE FIRE MATCHES, ONLY HEADSHOT"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-red-500 mb-2"
                />
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-gray-400 mr-1 self-center font-bold">মূল সেকশন:</span>
                  {[
                    { title: 'FREE FIRE MATCHES', label: '🔥 FREE FIRE MATCHES' },
                    { title: 'FREE FIRE MATCH 1 VS 1', label: '⚔️ FREE FIRE MATCH 1 VS 1' },
                    { title: 'ONLY HEADSHOT', label: '🎯 ONLY HEADSHOT' },
                    { title: 'CLASH SQUAD ARENA', label: 'CLASH SQUAD ARENA' },
                    { title: 'SPECIAL TOURNAMENTS', label: 'SPECIAL TOURNAMENTS' },
                  ].map((preset) => (
                    <button
                      key={preset.title}
                      type="button"
                      onClick={() => setNewCatSection(preset.title)}
                      className={`text-[10px] px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                        newCatSection === preset.title
                          ? 'border-red-500 bg-red-600 text-white font-black shadow-sm'
                          : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-red-400'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Images Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ImageUploadInput
                  label="Category Banner (ব্যানার ইমেজ)"
                  value={newCatBanner}
                  onChange={(url) => {
                    setNewCatBanner(url);
                    if (!newCatAvatar) setNewCatAvatar(url);
                  }}
                  helperText="ম্যাচ লিস্টের মূল ব্যানার ছবি"
                />

                <ImageUploadInput
                  label="Avatar / Icon (বৃত্তাকার আইকন)"
                  value={newCatAvatar}
                  onChange={(url) => setNewCatAvatar(url)}
                  isCircular={true}
                  helperText="হোমপেজ ও ক্যাটাগরি মেনুর গোল আইকন"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  সংক্ষিপ্ত বিবরণ (Description)
                </label>
                <input
                  type="text"
                  value={newCatDescription}
                  onChange={(e) => setNewCatDescription(e.target.value)}
                  placeholder="e.g. প্রতিদিন নিয়মিত ম্যাচ খেলুন এবং জিতে নিন আকর্ষণীয় প্রাইজপুল"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Rules & Guidelines */}
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  ক্যাটাগরি স্পেসিফিক রুলস (Tournament Rules & Guidelines)
                </label>
                <textarea
                  rows={4}
                  value={newCatRules}
                  onChange={(e) => setNewCatRules(e.target.value)}
                  placeholder="এই টুর্নামেন্টের নির্দিষ্ট নিয়মাবলী লিখুন..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:border-red-500 leading-relaxed"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  বাতিল (Cancel)
                </button>

                <button
                  type="submit"
                  disabled={isCreating || !newCatName.trim()}
                  className="px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  {isCreating ? (
                    <span>তৈরি হচ্ছে...</span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>ক্যাটাগরি যুক্ত করুন (Create Category)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
