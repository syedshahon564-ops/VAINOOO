'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Download, X, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

export default function MobileInstallBanner() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const isInStandalone =
      typeof window !== 'undefined' &&
      (Boolean(window.matchMedia?.('(display-mode: standalone)')?.matches) ||
        (window.navigator as any)?.standalone === true);

    setIsStandalone(!!isInStandalone);
    if (isInStandalone) return;

    let dismissed = false;
    try {
      dismissed = !!sessionStorage.getItem('ff_install_banner_dismissed');
    } catch {}
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
      const isMobileDevice =
        typeof navigator !== 'undefined' &&
        (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
          window.innerWidth < 768);
      let isDismissed = false;
      try {
        isDismissed = !!sessionStorage.getItem('ff_install_banner_dismissed');
      } catch {}
      if (isMobileDevice && !isInStandalone && !isDismissed) {
        setShowBanner(true);
      }
    }, 600);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    // 1. Trigger direct APK download immediately
    try {
      const a = document.createElement('a');
      a.href = '/ffrivals.apk';
      a.download = 'ffrivals.apk';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      window.location.href = '/ffrivals.apk';
    }

    // 2. Also trigger PWA prompt if available
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setShowBanner(false);
        }
      } catch (err) {}
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    try {
      sessionStorage.setItem('ff_install_banner_dismissed', '1');
    } catch {}
  };

  if (pathname === '/mobile-app-view' || !showBanner || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-3 right-3 z-50 max-w-md mx-auto animate-slideUp">
      <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-red-950 via-slate-900 to-black border-2 border-red-500/50 text-white shadow-2xl flex items-center justify-between gap-2.5 backdrop-blur-xl">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-black/80 border border-amber-500/50 flex items-center justify-center p-1 flex-shrink-0 shadow-lg shadow-amber-500/20">
            <img src="/logo.png" alt="FF Rivals Tour BD" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black text-white truncate tracking-wide">
                FF Rivals <span className="text-red-500">Tour BD</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-extrabold border border-emerald-500/30 flex items-center gap-0.5 flex-shrink-0">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" /> নো ভাইরাস
              </span>
            </div>
            <p className="text-[10px] text-gray-300 truncate mt-0.5">
              {t('অফিসিয়াল অ্যান্ড্রয়েড অ্যাপ ডাউনলোড করুন (১-ট্যাপ)', 'Download Official Android App (1-Tap)')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-red-600/40 active:scale-95 transition-all border border-red-400/40"
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
