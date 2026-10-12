'use client';

import React, { useEffect, useState } from 'react';
import { Bell, BellRing, X, CheckCircle, ShieldAlert } from 'lucide-react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showPrompt, setShowPrompt] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribedSuccess, setSubscribedSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Check if already subscribed
          if ('Notification' in window) {
            setPermission(Notification.permission);
            if (Notification.permission === 'default') {
              // Show prompt after 3 seconds if not asked yet
              const dismissed = localStorage.getItem('ff_notif_dismissed_until');
              if (!dismissed || Number(dismissed) < Date.now()) {
                const timer = setTimeout(() => setShowPrompt(true), 3500);
                return () => clearTimeout(timer);
              }
            } else if (Notification.permission === 'granted') {
              // Ensure subscription is synced
              syncPushSubscription(registration);
            }
          }
        })
        .catch((err) => console.warn('SW register error:', err));
    }
  }, []);

  async function syncPushSubscription(registration?: ServiceWorkerRegistration) {
    try {
      const reg = registration || (await navigator.serviceWorker.ready);
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        // Fetch VAPID public key
        const keyRes = await fetch('/api/notifications/vapid-key');
        const { publicKey } = await keyRes.json();
        if (!publicKey) return;

        const convertedKey = urlBase64ToUint8Array(publicKey);
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });
      }

      // Save to backend
      if (sub) {
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub }),
        });
      }
    } catch (err) {
      console.warn('Sync push subscription error:', err);
    }
  }

  async function handleEnableNotifications() {
    setSubscribing(true);
    try {
      // 1. If inside Android APK, request Android 13+ native permission
      if (typeof window !== 'undefined' && (window as any).AndroidBridge?.requestNotificationPermission) {
        try {
          (window as any).AndroidBridge.requestNotificationPermission();
        } catch (e) {}
      }

      // 2. Request Web Notification permission
      if ('Notification' in window) {
        const res = await Notification.requestPermission();
        setPermission(res);

        if (res === 'granted' && 'serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          await syncPushSubscription(reg);
          setSubscribedSuccess(true);
          setTimeout(() => {
            setShowPrompt(false);
          }, 2000);
        } else {
          setShowPrompt(false);
        }
      }
    } catch (err) {
      console.warn('Enable notification error:', err);
    } finally {
      setSubscribing(false);
    }
  }

  function handleDismiss() {
    setShowPrompt(false);
    // Dismiss for 2 days
    try {
      localStorage.setItem('ff_notif_dismissed_until', String(Date.now() + 2 * 24 * 60 * 60 * 1000));
    } catch (e) {}
  }

  if (!showPrompt || permission === 'granted') return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 animate-in fade-in slide-in-from-bottom duration-300">
      <div className="p-4 rounded-2xl bg-slate-900/95 dark:bg-black/95 text-white border border-amber-500/30 shadow-2xl backdrop-blur-xl space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-black tracking-wide text-white">নোটিফিকেশন চালু করুন</h4>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-tight">
                ম্যাচ রুম আইডি, পাসওয়ার্ড ও পেমেন্ট আপডেট সরাসরি ফোনে পেতে পারমিশন দিন।
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {subscribedSuccess ? (
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold py-1">
            <CheckCircle className="w-4 h-4" />
            <span>সফলভাবে নোটিফিকেশন চালু হয়েছে! 🎉</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleEnableNotifications}
              disabled={subscribing}
              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{subscribing ? 'চালু হচ্ছে...' : 'নোটিফিকেশন অন করুন'}</span>
            </button>
            <button
              onClick={handleDismiss}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              পরে
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
