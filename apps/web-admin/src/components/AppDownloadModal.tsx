'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Download,
  Smartphone,
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useCMS } from '@/lib/cms-store';
import { useLanguage } from '@/components/LanguageProvider';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AppDownloadModal({ isOpen, onClose }: AppDownloadModalProps) {
  const { settings } = useCMS();
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  if (!isOpen) return null;

  const apkDownloadUrl = (settings?.apkDownloadUrl && settings.apkDownloadUrl.trim() !== '')
    ? settings.apkDownloadUrl
    : '/livetourbd.apk';

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstalled(true);
        setTimeout(onClose, 1500);
      }
      setDeferredPrompt(null);
    } else {
      // Guide player to use browser Add to Home Screen
      alert(t('আপনার মোবাইলের ব্রাউজার মেনু (⋮) ওপেন করে "Install App" বা "Add to Home screen" চাপুন। অ্যাপটি সরাসরি আপনার ফোনে ইন্সটল হয়ে যাবে!', 'Tap your browser menu (⋮) and select "Install App" or "Add to Home screen" to install directly on your phone!'));
    }
  };

  const handleDownloadClick = () => {
    const a = document.createElement('a');
    a.href = apkDownloadUrl;
    a.download = 'FF_Rivals_Tour_BD.apk';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#111118] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden">
        {/* Header with Game Banner Style */}
        <div className="relative bg-gradient-to-r from-red-800 via-red-600 to-black p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-black/50 border border-white/20 flex items-center justify-center p-1 shadow-lg">
              <img
                src={settings?.logoUrl || '/logo.png'}
                alt={settings?.siteName || 'App Logo'}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-amber-300" /> Official Android Client
              </div>
              <h3 className="text-xl font-black uppercase tracking-wide mt-1">
                {settings?.siteName || 'FF RIVAL TOUR BD'} APP
              </h3>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-gray-900 dark:text-gray-100">
          {/* Option 1: Direct APK Download (Built & Signed) */}
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/30 space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{t('অফিসিয়াল APK ফাইল ডাউনলোড (Android)', 'Download Official APK File (Android)')}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {t('সরাসরি সাইন করা নতুন Android APK ফাইল ডাউনলোড করে ফোনে ইনস্টল করুন।', 'Download the standalone signed Android APK file and install directly on your phone.')}
            </p>
            <button
              onClick={handleDownloadClick}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" /> {t('APK ফাইল ডাউনলোড করুন (4.2 MB)', 'Download APK File (4.2 MB)')}
            </button>
          </div>

          {/* Option 2: Instant Mobile Web App without install */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/20 to-black/30 border border-red-500/30 space-y-3">
            <div className="flex items-center gap-2 text-red-500 font-black text-sm">
              <Zap className="w-5 h-5 flex-shrink-0 text-amber-400" />
              <span>{t('ইনস্টল ছাড়াই সরাসরি মোবাইলে খেলুন', 'Instant Mobile Web App')}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {t(
                'কোনো কিছু ইনস্টল না করেই মোবাইলের ফুলস্ক্রিন ভিউতে সুপার ফাস্ট টুর্নামেন্ট খেলুন।',
                'Play instantly in full-screen mobile app view without installing anything.'
              )}
            </p>
            <div className="flex gap-2">
              <a
                href="/mobile-app-view"
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-600/30 transition-all text-center"
              >
                <Smartphone className="w-3.5 h-3.5" /> {t('মোবাইল ভিউ ওপেন করুন', 'Open Mobile View')}
              </a>
              <button
                onClick={handleInstallPWA}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-black text-xs flex items-center justify-center gap-1.5 border border-white/20 transition-all"
              >
                <Download className="w-3.5 h-3.5" /> {installed ? t('ইনস্টল সম্পন্ন!', 'Installed!') : t('হোম স্ক্রিনে সেভ', 'Add to Home')}
              </button>
            </div>
          </div>

          {/* How to run guide */}
          <div className="p-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="font-bold text-gray-900 dark:text-white">
                {t('মোবাইলে চালুর সহজ নিয়ম:', 'How to run easily on mobile:')}
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                {t(
                  'মোবাইলে Chrome ব্রাউজারে লিংকটি খুলে ওপরের থ্রি-ডট (⋮) অপশনে চাপ দিয়ে "Add to Home screen" বা "Install App" দিন। আপনার ফোনের হোমস্ক্রিনে অ্যাপ আইকন তৈরি হয়ে যাবে এবং সরাসরি ফুলস্ক্রিনে চালু হবে।',
                  'Open in mobile Chrome browser, tap the three dots (⋮) and select "Add to Home screen" or "Install App". It runs in full-screen on your phone.'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
