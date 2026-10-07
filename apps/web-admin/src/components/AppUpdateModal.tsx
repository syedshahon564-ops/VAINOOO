'use client';

import React, { useState, useEffect } from 'react';
import { Download, Sparkles, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AppUpdateModalProps {
  forceOpen?: boolean;
}

export default function AppUpdateModal({ forceOpen = false }: AppUpdateModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }

    try {
      if (typeof window !== 'undefined') {
        const dismissed = sessionStorage.getItem('ff_update_dismissed_v102');
        // Show update prompt inside Capacitor WebView, mobile devices, or whenever not dismissed
        const isCapacitor = Boolean((window as any)?.Capacitor);
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);

        if (!dismissed && (isCapacitor || isMobileUA)) {
          // Small delay for smooth entry
          const timer = setTimeout(() => {
            setIsOpen(true);
          }, 1200);
          return () => clearTimeout(timer);
        }
      }
    } catch (e) {
      // safe fallback
    }
  }, [forceOpen]);

  const handleUpdateNow = () => {
    setDownloading(true);
    try {
      const a = document.createElement('a');
      a.href = '/downloads/ffrivals.apk';
      a.download = 'ffrivals.apk';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      try {
        sessionStorage.setItem('ff_update_dismissed_v102', 'true');
        localStorage.setItem('ff_installed_version', '1.0.2');
      } catch (e) {}

      setTimeout(() => {
        setDownloading(false);
        setIsOpen(false);
      }, 2500);
    } catch (err) {
      window.location.href = '/downloads/ffrivals.apk';
      setDownloading(false);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem('ff_update_dismissed_v102', 'true');
    } catch (e) {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#0f0f17] border-2 border-amber-500/40 p-6 text-white shadow-2xl shadow-amber-500/10 text-center space-y-4">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Animated Badge Icon */}
        <div className="relative w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-red-600 p-0.5 shadow-xl shadow-amber-500/20">
          <div className="w-full h-full rounded-2xl bg-[#0f0f17] flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
          </div>
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-red-600 text-[9px] font-black tracking-wider text-white border border-[#0f0f17]">
            v1.0.2
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <h3 className="text-lg font-black tracking-wide text-white">
            অ্যাপ আপডেট পাওয়া গেছে! 🚀
          </h3>
          <p className="text-xs text-gray-300 leading-relaxed">
            <span className="text-amber-400 font-bold">FF Rivals Tour BD</span> অ্যাপের নতুন সংস্করণ (v1.0.2) রিলিজ হয়েছে। অ্যাপটি আপডেট করলে সমস্ত এরর ও বাগ স্বয়ংক্রিয়ভাবে ফিক্স হয়ে যাবে।
          </p>
        </div>

        {/* Change Highlights */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-3 text-left space-y-2 text-[11px]">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>হোয়াইট স্ক্রিন ও এক্সেপশন এরর সম্পূর্ণ ফিক্সড</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>সরাসরি নতুন হাই-স্পিড রেলওয়ে সার্ভারের সাথে কানেক্টেড</span>
          </div>
          <div className="flex items-center gap-2 text-amber-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>ওনার ও অ্যাডমিনদের জন্য ১-ক্লিক অ্যাডমিন ড্যাশবোর্ড</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleUpdateNow}
            disabled={downloading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:brightness-110 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all border border-amber-400/30"
          >
            <Download className={`w-4 h-4 ${downloading ? 'animate-bounce' : ''}`} />
            <span>
              {downloading ? 'ডাউনলোড হচ্ছে...' : 'এখনই আপডেট করুন (Update APK)'}
            </span>
          </button>

          <button
            onClick={handleDismiss}
            className="w-full py-2 rounded-xl text-gray-400 hover:text-white text-xs font-semibold transition-colors"
          >
            পরে করব (Later)
          </button>
        </div>
      </div>
    </div>
  );
}
