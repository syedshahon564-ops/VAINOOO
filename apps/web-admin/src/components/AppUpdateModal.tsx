'use client';

import React, { useState, useEffect } from 'react';
import { Download, Sparkles, ShieldCheck, CheckCircle2, X } from 'lucide-react';

interface AppUpdateModalProps {
  forceOpen?: boolean;
}

const DISMISS_STORAGE_KEY = 'ff_app_download_dismissed_session';

export default function AppUpdateModal({ forceOpen = false }: AppUpdateModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handleDownloadApp = React.useCallback(() => {
    setDownloading(true);
    setDownloadProgress(30);

    try {
      const downloadTarget = '/downloads/ffrivals.apk';
      const fullUrl = typeof window !== 'undefined' ? window.location.origin + downloadTarget : downloadTarget;

      // 1. Create native anchor click for seamless background download
      const link = document.createElement('a');
      link.href = downloadTarget;
      link.setAttribute('download', 'ffrivals.apk');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 2. Open external browser if in Capacitor
      try {
        if (typeof window !== 'undefined' && (window as any)?.Capacitor) {
          window.open(fullUrl, '_system');
        }
      } catch {}

      const int = setInterval(() => {
        setDownloadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(int);
            return 100;
          }
          return prev + 25;
        });
      }, 300);

      setTimeout(() => {
        setDownloading(false);
        setDownloadSuccess(true);
      }, 1400);
    } catch {
      setDownloading(false);
      setDownloadSuccess(true);
    }
  }, []);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }

    try {
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        
        // 1. NEVER show download prompt if the user is ALREADY inside the mobile app
        const isInsideApp =
          searchParams.get('app') === 'true' ||
          Boolean((window as any)?.AndroidBridge) ||
          Boolean((window as any)?.Capacitor);

        if (isInsideApp) {
          setIsOpen(false);
          return;
        }

        // 2. If the user dismissed the prompt in this session, don't nag them again
        const dismissed = sessionStorage.getItem(DISMISS_STORAGE_KEY);
        if (dismissed === 'true') {
          setIsOpen(false);
          return;
        }

        // 3. Prompt website visitors to download the official 30 MB Android app
        setIsOpen(true);

        // Auto download APK when entering the website
        const autoDownloadTimer = setTimeout(() => {
          handleDownloadApp();
        }, 1200);

        return () => clearTimeout(autoDownloadTimer);
      }
    } catch {
      setIsOpen(false);
    }
  }, [forceOpen, handleDownloadApp]);

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_STORAGE_KEY, 'true');
    } catch {}
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      {/* Outer Card with glowing border */}
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#180a0a] via-[#11111a] to-[#0a0a10] border-2 border-red-500/50 p-5 sm:p-6 text-white shadow-2xl shadow-red-600/30 text-center space-y-4">
        
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          type="button"
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Animated Badge Icon */}
        <div className="relative w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-red-600 via-amber-500 to-rose-600 p-0.5 shadow-2xl shadow-red-600/40">
          <div className="w-full h-full rounded-2xl bg-[#0f0a12] flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
          </div>
          <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-red-600 text-[10px] font-black tracking-wider text-white border-2 border-[#11111a] shadow-md animate-bounce">
            ৩০ MB
          </span>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-black uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            অফিসিয়াল Android অ্যাপ
          </div>
          <h3 className="text-xl font-black tracking-wide text-white">
            FF RIVALS v5.0.0 নতুন আপডেট ডাউনলোড করুন! 🚀
          </h3>
          <p className="text-xs text-gray-300 leading-relaxed pt-1">
            সুপারফাস্ট টুর্নামেন্ট অভিজ্ঞতা, ম্যাচ রুম আইডি ও পুশ নোটিফিকেশন পেতে আমাদের <span className="text-amber-400 font-bold">৩০ MB</span> অফিশিয়াল অ্যাপটি ফোনে ইনস্টল করুন।
          </p>
        </div>

        {/* Specs Badges */}
        <div className="flex items-center justify-center gap-2 text-[11px] font-bold">
          <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
            📦 সাইজ: ৩০ MB
          </span>
          <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            🛡️ ১০০% নিরাপদ ও ভাইরাস মুক্ত
          </span>
        </div>

        {/* Feature List */}
        <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3 text-left space-y-2 text-[11px]">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider pb-0.5 border-b border-white/10">
            মোবাইল অ্যাপে খেলার সুবিধাসমূহ:
          </p>
          <div className="flex items-start gap-2 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>সরাসরি ফোনে টুর্নামেন্ট রুম আইডি ও পাসওয়ার্ড নোটিফিকেশন</span>
          </div>
          <div className="flex items-start gap-2 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>ল্যাগ-ফ্রি ফুলস্ক্রিন গেমিং ইন্টারফেস</span>
          </div>
          <div className="flex items-start gap-2 text-amber-300 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>ইনস্ট্যান্ট bKash / Nagad ডিপোজিট ও উইথড্রল</span>
          </div>
        </div>

        {/* Progress Bar (Visible while downloading) */}
        {downloading && (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[10px] font-bold text-gray-300">
              <span>ডাউনলোড হচ্ছে...</span>
              <span>{downloadProgress}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-red-600 to-amber-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Downloaded Success Notice */}
        {downloadSuccess && (
          <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>APK ফাইলটি ডাউনলোড শুরু হয়েছে!</span>
            </div>
            <p className="text-[10px] text-gray-300 font-normal">
              আপনার ফোনের Downloads ফোল্ডার বা নোটিফিকেশন বার থেকে <span className="text-white font-bold">ffrivals.apk</span> ফাইলটি ওপেন করে &apos;Install&apos; করুন।
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleDownloadApp}
            disabled={downloading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:brightness-110 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-red-600/40 transition-all border border-amber-400/40 cursor-pointer"
          >
            <Download className={`w-5 h-5 ${downloading ? 'animate-bounce' : ''}`} />
            <span>
              {downloading ? 'ডাউনলোড হচ্ছে (৩০ MB)...' : '📥 অ্যাপ ডাউনলোড করুন (৩০ MB)'}
            </span>
          </button>

          {/* Continue in browser button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full py-2 text-[11px] text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
          >
            🌐 ব্রাউজারে চালিয়ে যান (Continue in Browser)
          </button>
        </div>
      </div>
    </div>
  );
}
