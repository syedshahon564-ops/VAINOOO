'use client';

import React, { useState, useEffect } from 'react';
import { Download, Sparkles, ShieldAlert, CheckCircle2, ArrowRight, Zap, RefreshCw } from 'lucide-react';

interface AppUpdateModalProps {
  forceOpen?: boolean;
}

const LATEST_VERSION = 'v3.5.0';
const APP_STORAGE_KEY = 'ff_app_installed_version_v350';

export default function AppUpdateModal({ forceOpen = false }: AppUpdateModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }

    try {
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const urlVersion = searchParams.get('v');
        const installedVersion = localStorage.getItem(APP_STORAGE_KEY);

        // If the user already updated to this exact latest version (v3.5.0), allow entry
        if (urlVersion === '3.5.0' || installedVersion === LATEST_VERSION) {
          setIsOpen(false);
          return;
        }

        // Everyone else must be prompted with the mandatory update
        setIsOpen(true);
      }
    } catch {
      setIsOpen(true);
    }
  }, [forceOpen]);

  const handleUpdateNow = () => {
    setDownloading(true);
    setDownloadProgress(20);

    try {
      // Direct download trigger
      const a = document.createElement('a');
      a.href = '/downloads/ffrivals.apk';
      a.download = 'ffrivals.apk';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      const int = setInterval(() => {
        setDownloadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(int);
            return 100;
          }
          return prev + 25;
        });
      }, 400);

      setTimeout(() => {
        setDownloading(false);
        setDownloadSuccess(true);
      }, 1800);
    } catch {
      window.location.href = '/downloads/ffrivals.apk';
      setDownloading(false);
      setDownloadSuccess(true);
    }
  };

  const handleInstalledContinue = () => {
    try {
      localStorage.setItem(APP_STORAGE_KEY, LATEST_VERSION);
    } catch {}
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      {/* Outer Card with glowing border */}
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#180a0a] via-[#11111a] to-[#0a0a10] border-2 border-red-500/50 p-5 sm:p-6 text-white shadow-2xl shadow-red-600/30 text-center space-y-4">
        
        {/* Animated Badge Icon */}
        <div className="relative w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-red-600 via-amber-500 to-rose-600 p-0.5 shadow-2xl shadow-red-600/40">
          <div className="w-full h-full rounded-2xl bg-[#0f0a12] flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
          </div>
          <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-red-600 text-[10px] font-black tracking-wider text-white border-2 border-[#11111a] shadow-md animate-bounce">
            NEW 4 MB
          </span>
        </div>

        {/* Title & Warning */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-black uppercase tracking-wider mb-1">
            <ShieldAlert className="w-3 h-3 text-red-400" />
            নতুন আপডেট আবশ্যক (Mandatory Update)
          </div>
          <h3 className="text-xl font-black tracking-wide text-white">
            অ্যাপ আপডেট করুন! 🚀
          </h3>
          <p className="text-xs text-gray-300 leading-relaxed pt-1">
            <span className="text-amber-400 font-bold">FF RIVALS TOUR BD</span> অ্যাপে প্রবেশ করতে হলে অবশ্যই সর্বশেষ <span className="text-red-400 font-bold">৪ MB (v3.5.0)</span> আপডেট সম্পন্ন করতে হবে।
          </p>
        </div>

        {/* Specs Badges */}
        <div className="flex items-center justify-center gap-2 text-[11px] font-bold">
          <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
            📦 সাইজ: ৪ এমবি (4 MB)
          </span>
          <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            ⚡ ভার্সন: v3.5.0 Latest
          </span>
        </div>

        {/* What's New Feature List */}
        <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3 text-left space-y-2 text-[11px]">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider pb-0.5 border-b border-white/10">
            লেটেস্ট সংস্করণের নতুন সুবিধাসমূহ:
          </p>
          <div className="flex items-start gap-2 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>আসল ফ্রি ফায়ার UID অটো-ভেরিফাই ও রিয়েল গেম নেম</span>
          </div>
          <div className="flex items-start gap-2 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>ম্যাচ শুরুর ৫ মিনিট আগে অটোমেটিক রুম আইডি ও পাসওয়ার্ড</span>
          </div>
          <div className="flex items-start gap-2 text-amber-300 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>ইনস্ট্যান্ট bKash / Nagad ডিপোজিট ও উইথড্র সিস্টেম</span>
          </div>
          <div className="flex items-start gap-2 text-rose-300 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>হোয়াইট স্ক্রিন ফিক্সড ও সুপারফাস্ট ল্যাগ-ফ্রি পারফরম্যান্স</span>
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
              আপনার ফোনের Downloads ফোল্ডার বা নোটিফিকেশন বার থেকে <span className="text-white font-bold">ffrivals.apk</span> ফাইলটি ওপেন করে &apos;Install&apos; বা &apos;Update&apos; করুন।
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {!downloadSuccess ? (
            <button
              onClick={handleUpdateNow}
              disabled={downloading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:brightness-110 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-red-600/40 transition-all border border-amber-400/40 cursor-pointer"
            >
              <Download className={`w-5 h-5 ${downloading ? 'animate-bounce' : ''}`} />
              <span>
                {downloading ? 'ডাউনলোড হচ্ছে (৪ MB)...' : '📥 এখনই আপডেট করুন (৪ MB)'}
              </span>
            </button>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleInstalledContinue}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ইনস্টল সম্পন্ন করেছি, অ্যাপে প্রবেশ করুন</span>
              </button>

              <button
                onClick={handleUpdateNow}
                className="w-full py-2 rounded-xl text-gray-400 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>পুনরায় ডাউনলোড করতে ক্লিক করুন (4 MB)</span>
              </button>
            </div>
          )}

          <a
            href="/downloads/ffrivals.apk"
            download="ffrivals.apk"
            className="block text-[11px] text-gray-400 hover:text-amber-400 transition-colors underline pt-1"
          >
            সরাসরি ডাউনলোড লিঙ্ক (Direct APK Link)
          </a>
        </div>
      </div>
    </div>
  );
}
