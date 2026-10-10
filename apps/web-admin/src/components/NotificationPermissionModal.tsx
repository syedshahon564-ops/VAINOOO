'use client';

import React, { useState, useEffect } from 'react';
import { useCMS } from '@/lib/cms-store';

export default function NotificationPermissionModal() {
  const { settings } = useCMS();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const appName = settings?.siteName || 'GR FF TOUR';

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      // Check if already granted
      const permissionState = localStorage.getItem('ff_notif_permission_state');
      if (permissionState === 'granted') {
        setIsOpen(false);
        return;
      }

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        localStorage.setItem('ff_notif_permission_state', 'granted');
        setIsOpen(false);
        return;
      }

      // Check if dismissed in this specific session
      if (sessionStorage.getItem('ff_notif_session_dismissed')) {
        setIsOpen(false);
        return;
      }

      // Show modal on entry
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 600);

      return () => clearTimeout(timer);
    } catch {
      // Safe fallback
    }
  }, []);

  const handleExitApp = () => {
    try {
      sessionStorage.setItem('ff_notif_session_dismissed', 'true');
    } catch {}
    setIsOpen(false);
  };

  const handleProceedToStep2 = () => {
    setStep(2);
  };

  const handleAllowNotifications = async () => {
    try {
      if (typeof Notification !== 'undefined' && typeof Notification.requestPermission === 'function') {
        await Notification.requestPermission();
      }

      // If inside Capacitor / Android WebView
      const cap = (typeof window !== 'undefined' && (window as any).Capacitor);
      if (cap?.Plugins?.PushNotifications?.requestPermissions) {
        await cap.Plugins.PushNotifications.requestPermissions();
      }
    } catch (e) {
      console.warn('Notification permission error:', e);
    } finally {
      try {
        localStorage.setItem('ff_notif_permission_state', 'granted');
      } catch {}
      setIsOpen(false);
    }
  };

  const handleDenyNotifications = () => {
    try {
      sessionStorage.setItem('ff_notif_session_dismissed', 'true');
    } catch {}
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99995] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      {step === 1 ? (
        /* STEP 1: Modal matching Image 2 */
        <div 
          className="relative w-full max-w-sm rounded-2xl bg-white text-gray-900 shadow-2xl p-6 border border-gray-100 animate-in zoom-in-95 duration-200"
          role="dialog"
          aria-modal="true"
        >
          <h2 className="text-lg font-bold text-gray-900 leading-snug">
            Notification Permission Required
          </h2>
          <p className="text-sm text-gray-600 mt-3 leading-relaxed">
            This app needs notification permission to keep you updated with important information.
          </p>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={handleExitApp}
              className="px-3 py-2 text-sm font-semibold text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
            >
              Exit App
            </button>
            <button
              onClick={handleProceedToStep2}
              className="px-3 py-2 text-sm font-semibold text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
            >
              Grant Permission
            </button>
          </div>
        </div>
      ) : (
        /* STEP 2: Modal matching Image 3 */
        <div 
          className="relative w-full max-w-[320px] rounded-[28px] bg-[#2d2d30] text-white shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-200"
          role="dialog"
          aria-modal="true"
        >
          {/* Bell Icon + Title */}
          <div className="pt-6 pb-5 px-6 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center">
              <svg 
                className="w-7 h-7 text-[#3b82f6]" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-white leading-snug">
              Allow {appName} to send you notifications?
            </h3>
          </div>

          {/* Action Buttons styled like Android system prompt */}
          <div className="divide-y divide-white/10 border-t border-white/10">
            <button
              onClick={handleAllowNotifications}
              className="w-full py-3.5 text-center text-[#3b82f6] font-semibold text-base hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
            >
              Allow
            </button>
            <button
              onClick={handleDenyNotifications}
              className="w-full py-3.5 text-center text-[#3b82f6] font-normal text-base hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
            >
              Don&apos;t allow
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
