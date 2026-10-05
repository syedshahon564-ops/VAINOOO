'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Download,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useCMS } from '@/lib/cms-store';
import { useLanguage } from '@/components/LanguageProvider';

export default function DownloadAppPage() {
  const { settings } = useCMS();
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installedSuccess, setInstalledSuccess] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handlePWAInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice && choice.outcome === 'accepted') {
        setInstalledSuccess(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        t(
          'আপনার মোবাইলের Chrome ব্রাউজারের ওপরের থ্রি-ডট (⋮) মেনু থেকে "Install App" বা "Add to Home screen" চাপুন। সরাসরি কোনো ওয়ার্নিং ছাড়াই ফোনে ইনস্টল হয়ে যাবে!',
          'Tap your browser menu (⋮) and select "Install App" or "Add to Home screen" to install without any virus warning!'
        )
      );
    }
  };

  const handleDirectApkDownload = () => {
    setDownloadStarted(true);
    const downloadUrl =
      settings?.apkDownloadUrl && settings.apkDownloadUrl.trim() !== ''
        ? settings.apkDownloadUrl
        : 'https://github.com/syedshahon564-ops/VAINOOO/releases/download/v1.0.0/FF_Rival_Tour_BD.apk';

    window.location.href = downloadUrl;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-red-950 via-red-800 to-black p-6 sm:p-10 text-white shadow-2xl border border-red-500/30">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-black/60 border-2 border-amber-400 p-2 shadow-xl shadow-amber-500/20 flex-shrink-0 flex items-center justify-center">
            <img
              src={settings?.logoUrl || '/logo.png'}
              alt={settings?.siteName || 'App Logo'}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Official Android Client v1.0.0
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wide">
              {settings?.siteName || 'FF RIVAL TOUR BD'} APP
            </h1>
            <p className="text-xs sm:text-sm text-gray-200">
              {t(
                'বাংলাদেশি ফ্রি ফায়ার গেমারদের জন্য ১০০% নিরাপদ, লাইটওয়েট এবং সুপারফাস্ট টুর্নামেন্ট অ্যাপ।',
                '100% safe, lightweight, and superfast Free Fire tournament client for Bangladeshi gamers.'
              )}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-[11px] font-bold">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> ১০০% ভাইরাস মুক্ত
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white border border-white/15">
                সাইজ: ৪.৪ MB
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white border border-white/15">
                Android 5.0+
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Download Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option 1: 1-Tap Instant Install (No Virus Warning Ever) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#12121a] border-2 border-emerald-500/40 shadow-xl space-y-4 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">
            RECOMMENDED
          </div>

          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Zap className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">
              {t('১-ট্যাপে সরাসরি ইনস্টল (নো ভাইরাস প্যারা)', '1-Tap Direct Install (No Warnings)')}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {t(
                'গুগল ও অ্যান্ড্রয়েডের অফিসিয়াল নিয়ম অনুযায়ী ফোনে সরাসরি ১-ক্লিকে অ্যাপ ইনস্টল করুন। কোনো ভাইরাসের ওয়ার্নিং বা প্লে প্রোটেক্ট ব্লকের প্যারা নেই!',
                'Install directly onto your phone launcher in 1 second. Zero virus warnings, zero Play Protect blocks.'
              )}
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handlePWAInstall}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
            >
              <Smartphone className="w-4 h-4" />
              <span>
                {installedSuccess
                  ? t('সফলভাবে ইনস্টল হয়েছে!', 'Successfully Installed!')
                  : t('ফোনে ১-ট্যাপে ইনস্টল করুন', 'Install to Phone (1-Tap)')}
              </span>
            </button>
          </div>
        </div>

        {/* Option 2: Direct APK Download */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#12121a] border border-gray-200 dark:border-white/10 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-red-600/10 text-red-600 flex items-center justify-center">
              <Download className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">
              {t('অফিসিয়াল APK ফাইল ডাউনলোড', 'Direct APK File Download')}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {t(
                'স্ট্যান্ডঅ্যালোন .apk ফাইল সরাসরি আপনার মেমোরিতে ডাউনলোড করে প্যাকেজ ইনস্টলার দিয়ে ইনস্টল করুন।',
                'Download the standalone .apk file directly and install via Android Package Installer.'
              )}
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleDirectApkDownload}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>
                {downloadStarted
                  ? t('APK ডাউনলোড শুরু হয়েছে...', 'APK Downloading...')
                  : t('APK ফাইল ডাউনলোড করুন (৪.৪ MB)', 'Download APK File (4.4 MB)')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Step-by-Step Installation Guide */}
      <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-6 h-6 text-emerald-500 flex-shrink-0" />
          <h2 className="text-lg font-black text-gray-900 dark:text-white">
            {t('অ্যান্ড্রয়েডে ইনস্টল করার সহজ ৩টি ধাপ', 'Easy 3-Step Installation Guide')}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 space-y-2">
            <span className="w-6 h-6 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center">
              ১
            </span>
            <h4 className="font-bold text-gray-900 dark:text-white">ডাউনলোড কনফার্ম করুন</h4>
            <p className="text-gray-500 dark:text-gray-400 text-[11px] leading-relaxed">
              ডাউনলোড বাটনে চাপ দিলে Chrome এ &quot;File might be harmful&quot; দেখাবে। এটি যেকোনো প্লেস্টোরের বাইরের ফাইলের ক্ষেত্রে স্বাভাবিক—নিঃসংকোচে &quot;Download anyway&quot; চাপুন।
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 space-y-2">
            <span className="w-6 h-6 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center">
              ২
            </span>
            <h4 className="font-bold text-gray-900 dark:text-white">ফাইলটি ওপেন করে Install দিন</h4>
            <p className="text-gray-500 dark:text-gray-400 text-[11px] leading-relaxed">
              ডাউনলোড শেষ হলে মোবাইলের নোটিফিকেশন বার অথবা ডাউনলোডস ফোল্ডার থেকে <strong>FF_Rival_Tour_BD.apk</strong> ফাইলে ক্লিক করে &quot;Install&quot; বাটনে চাপ দিন।
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 space-y-2">
            <span className="w-6 h-6 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center">
              ৩
            </span>
            <h4 className="font-bold text-gray-900 dark:text-white">Play Protect বাইপাস করুন</h4>
            <p className="text-gray-500 dark:text-gray-400 text-[11px] leading-relaxed">
              যদি &quot;Blocked by Play Protect&quot; ওয়ার্নিং আসে, তবে নিচে থাকা &quot;More details&quot; এ ক্লিক করে &quot;Install anyway&quot; চাপুন। অ্যাপটি সরাসরি ওপেন হয়ে যাবে!
            </p>
          </div>
        </div>

        {/* Safety Note Alert */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-black text-amber-400 block">
              নিরাপত্তা ও ভাইরাস সংক্রান্ত স্পষ্টীকরণ:
            </span>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-[11px]">
              যেহেতু অ্যাপটি সরাসরি ওয়েবসাইট থেকে দেওয়া হচ্ছে (Google Play Store এ ছাড়তে লাখ লাখ টাকা ফিস দিতে হয়), তাই যেকোনো অ্যান্ড্রয়েড ফোন আননোন সোর্স হিসেবে সাধারণ ওয়ার্নিং দেখায়। আমাদের অ্যাপটি <strong>১০০% ভাইরাস ও ম্যালওয়্যার মুক্ত</strong> এবং শুধুমাত্র ফ্রি ফায়ার টুর্নামেন্ট রুম জয়েন ও প্রাইজের জন্য ডিজাইন করা হয়েছে।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
