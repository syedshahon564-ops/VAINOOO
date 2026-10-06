'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import { useViewMode } from '@/lib/view-mode';

export default function MobileInstallBanner() {
  const { t } = useLanguage();
  const { isApp } = useViewMode();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  if (isApp) return null;

  useEffect(() => {
    const isInStandalone =
      typeof window !== 'undefined' &&
      (Boolean(window.matchMedia?.('(display-mode: standalone)')?.matches) ||
        (window.navigator as any)?.standalone === true);

    setIsStandalone(!!isInStandalone);
    if (isInStandalone) return;

    const dismissed = sessionStorage.getItem('ff_install_banner_dismissed');
    if (dismissed) return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch(() => {});
    }

    const timer = setTimeout(() => {
      const isMobile =
        typeof navigator !== 'undefined' &&
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile && !isInStandalone && !sessionStorage.getItem('ff_install_banner_dismissed')) {
        setShowBanner(true);
      }
    }, 2500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice && choice.outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      window.location.href = '/download';
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('ff_install_banner_dismissed', '1');
  };

  if (!showBanner || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto animate-slideUp">
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-950 via-slate-900 to-black border border-red-500/40 text-white shadow-2xl flex items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-black/60 border border-amber-500/40 flex items-center justify-center p-1 flex-shrink-0 shadow">
            <img src="/logo.png" alt="App Icon" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-black text-white truncate">
                FF RIVAL TOUR BD
              </span>
              <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5" /> নো ভাইরাস
              </span>
            </div>
            <p className="text-[10px] text-gray-300 truncate">
              {t('সরাসরি ফোনে ১-ট্যাপে ইনস্টল করুন', 'Install official 1-tap app to phone')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black flex items-center gap-1 shadow-md shadow-red-600/30 active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('ইনস্টল', 'Install')}</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
