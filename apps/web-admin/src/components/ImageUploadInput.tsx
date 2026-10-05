'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Check,
  X,
  Link as LinkIcon,
  RefreshCw,
  Loader2,
} from 'lucide-react';

interface ImageUploadInputProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  helperText?: string;
  previewHeight?: string;
  isCircular?: boolean;
}

export default function ImageUploadInput({
  label,
  value,
  onChange,
  helperText = 'PNG, JPG, WEBP ফাইল সিলেক্ট করুন বা ড্র্যাগ করে ছাড়ুন',
  previewHeight = 'h-36',
  isCircular = false,
}: ImageUploadInputProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('অনুগ্রহ করে শুধুমাত্র ইমেজ (JPG, PNG, WEBP) ফাইল সিলেক্ট করুন।');
      return;
    }

    setErrorMsg(null);
    setIsUploading(true);

    try {
      // 1. Try uploading to /api/upload
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          onChange(data.url);
          setIsUploading(false);
          return;
        }
      }

      // 2. Fallback to client-side compressed Data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onChange(result);
        setIsUploading(false);
      };
      reader.onerror = () => {
        setErrorMsg('ফাইলটি পড়া সম্ভব হয়নি।');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.warn('API upload fallback to Data URL:', err);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onChange(result);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-red-600" />
          <span>{label}</span>
        </label>

        {/* Toggle between File Upload and URL input */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/10 p-0.5 rounded-lg text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-0.5 rounded-md transition-all ${
              mode === 'upload'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
          >
            ফাইল আপলোড
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-0.5 rounded-md transition-all ${
              mode === 'url'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
          >
            URL লিংক
          </button>
        </div>
      </div>

      {mode === 'upload' ? (
        <div className="space-y-2">
          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-4 text-center transition-all flex flex-col items-center justify-center gap-2 ${
              dragOver
                ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                : 'border-gray-300 dark:border-white/15 bg-gray-50/70 dark:bg-white/5 hover:border-red-400 hover:bg-gray-100/70 dark:hover:bg-white/10'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {isUploading ? (
              <div className="py-3 flex flex-col items-center gap-2 text-xs font-bold text-red-600">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>ইমেজ আপলোড হচ্ছে...</span>
              </div>
            ) : (
              <div className="py-2 flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 shadow-inner">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  <span className="text-red-600 underline">ডিভাইস থেকে ইমেজ বেছে নিন</span> বা ড্র্যাগ করে ছাড়ুন
                </div>
                <p className="text-[10px] text-gray-400">{helperText}</p>
              </div>
            )}
          </div>

          {errorMsg && (
            <p className="text-[11px] font-bold text-red-600">{errorMsg}</p>
          )}
        </div>
      ) : (
        /* Direct URL Input */
        <div className="space-y-1">
          <div className="relative">
            <input
              type="text"
              placeholder="https://images.unsplash.com/... বা /uploads/..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-mono focus:outline-none focus:border-red-500"
            />
            <LinkIcon className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3.5" />
          </div>
        </div>
      )}

      {/* Real-time Image Preview Box */}
      {value && (
        <div className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-black/20 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-gray-500 flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-500" /> বর্তমান প্রিভিউ:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] font-bold text-red-600 hover:underline flex items-center gap-0.5"
              >
                <RefreshCw className="w-2.5 h-2.5" /> পরিবর্তন
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="text-[10px] font-bold text-gray-400 hover:text-red-600 flex items-center gap-0.5"
              >
                <X className="w-2.5 h-2.5" /> মুছুন
              </button>
            </div>
          </div>

          {isCircular ? (
            <div className="flex items-center justify-center p-2">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-red-500 shadow-md bg-black/40">
                <img
                  src={value}
                  alt="Uploaded Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ) : (
            <div
              className={`w-full ${previewHeight} rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-black/40 relative shadow-inner`}
            >
              <img
                src={value}
                alt="Uploaded Preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
