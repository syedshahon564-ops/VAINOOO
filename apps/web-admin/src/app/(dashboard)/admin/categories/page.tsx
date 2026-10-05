'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FolderEdit, Check, AlertCircle, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { useCMS } from '@/lib/cms-store';
import ImageUploadInput from '@/components/ImageUploadInput';

export default function AdminCategoriesPage() {
  const { categories, updateCategory } = useCMS();
  const categoriesList = Object.values(categories);

  const [selectedSlug, setSelectedSlug] = useState('classic-match');
  const activeCategory = categories[selectedSlug] || categories['classic-match'];

  const [name, setName] = useState(activeCategory?.name || '');
  const [section, setSection] = useState(activeCategory?.section || '');
  const [bannerImage, setBannerImage] = useState(activeCategory?.bannerImage || '');
  const [avatarImage, setAvatarImage] = useState(activeCategory?.avatarImage || '');
  const [description, setDescription] = useState(activeCategory?.description || '');
  const [customRules, setCustomRules] = useState(activeCategory?.customRules || '');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Synchronize form fields whenever selectedSlug or categories updates from CMS
  useEffect(() => {
    const cat = categories[selectedSlug];
    if (cat) {
      setName(cat.name || '');
      setSection(cat.section || '');
      setBannerImage(cat.bannerImage || '');
      setAvatarImage(cat.avatarImage || '');
      setDescription(cat.description || '');
      setCustomRules(cat.customRules || '');
    }
  }, [selectedSlug, categories]);

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCategory(selectedSlug, {
      name,
      section,
      bannerImage,
      avatarImage,
      description,
      customRules,
    });
    setToast({ text: `ক্যাটাগরি "${name}" সফলভাবে আপডেট করা হয়েছে!`, type: 'success' });
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
          <FolderEdit className="w-6 h-6 text-red-600" />
          ক্যাটাগরি, ব্যানার ও ইমেজ এডিটর
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          ওয়েবসাইটের ৬টি মূল ক্যাটাগরির নাম, সেকশন হেডার, ব্যানার ফটো এবং আইকন ছবি পরিবর্তন করুন।
        </p>
      </div>

      {/* Category Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {categoriesList.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => handleSelectCategory(cat.slug)}
            className={`p-3 rounded-xl border text-center transition-all ${
              selectedSlug === cat.slug
                ? 'border-red-600 bg-red-50 dark:bg-red-950/40 ring-2 ring-red-500'
                : 'border-gray-200 dark:border-white/10 hover:border-red-400 bg-white dark:bg-[#12121a]'
            }`}
          >
            <div className="w-10 h-10 rounded-full mx-auto overflow-hidden mb-1.5 border border-white/20 bg-slate-800">
              <img src={cat.avatarImage} alt={cat.name} className="w-full h-full object-cover" />
            </div>
            <span className="text-[11px] font-black block truncate text-gray-900 dark:text-white">
              {cat.name}
            </span>
            <span className="text-[9px] text-gray-500 uppercase block truncate">{cat.section}</span>
          </button>
        ))}
      </div>

      {/* Edit Form */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 shadow-sm">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                ক্যাটাগরির নাম (Category Name)
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
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                সেকশন হেডার (Section Title)
              </label>
              <input
                type="text"
                required
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Banner Image Upload */}
            <ImageUploadInput
              label="ক্যাটাগরি ব্যানার ফটো (Main Banner Photo)"
              value={bannerImage}
              onChange={setBannerImage}
              helperText="ডিভাইস থেকে ফাইল আপলোড করুন অথবা ড্র্যাগ-অ্যান্ড-ড্রপ করুন"
            />

            {/* Avatar Icon Upload */}
            <ImageUploadInput
              label="ক্যাটাগরি গোল আইকন / অ্যাভাটার (Thumbnail Icon)"
              value={avatarImage}
              onChange={setAvatarImage}
              isCircular={true}
              helperText="ক্যাটাগরির বৃত্তাকার আইকন আপলোড করুন"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              ক্যাটাগরির বিবরণ (Description)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-medium focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              এই ক্যাটাগরির জন্য নির্দিষ্ট কাস্টম রুলস (Category Specific Rules)
            </label>
            <textarea
              rows={3}
              placeholder="এই ক্যাটাগরির জন্য কোনো বিশেষ নিয়ম থাকলে এখানে লিখুন..."
              value={customRules}
              onChange={(e) => setCustomRules(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-medium focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl text-xs font-black btn-red shadow-md shadow-red-600/30"
            >
              ক্যাটাগরি তথ্য সেভ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
