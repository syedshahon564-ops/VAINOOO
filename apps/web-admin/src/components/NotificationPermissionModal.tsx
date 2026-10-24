'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCMS } from '@/lib/cms-store';
import { useRouter } from 'next/navigation';
import { Bell, X, ExternalLink, ShieldCheck } from 'lucide-react';

interface IncomingNotif {
  id: string;
  title: string;
  body: string;
  url?: string;
  icon?: string;
  sentAt?: string;
}

export default function NotificationPermissionModal() {
  const router = useRouter();
  const { settings } = useCMS();
  const [isOpen, setIsOpen] = useState(false);
  const [activeBanner, setActiveBanner] = useState<IncomingNotif | null>(null);
  const bannerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSeenIdRef = useRef<string>('');

  const appName = settings?.siteName || 'FF Rivals';

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

  async function syncWebPushSubscription() {
    if (typeof window === 'undefined') return;
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          const keyRes = await fetch('/api/notifications/vapid-key');
          if (keyRes.ok) {
            const { publicKey } = await keyRes.json();
            if (publicKey) {
              sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey),
              });
            }
          }
        }
        if (sub) {
          await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription: sub }),
          });
        }
      }
    } catch (err) {
      console.warn('Sync push subscription error:', err);
    }
  }

  // 1. Initial Permission Check & Modal Trigger
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      const isGranted = typeof Notification !== 'undefined' && Notification.permission === 'granted';
      const storedState = localStorage.getItem('ff_notif_permission_state');

      if (isGranted || storedState === 'granted') {
        syncWebPushSubscription();
        setIsOpen(false);
      } else {
        // Only suppress if explicitly dismissed in current browser session
        if (!sessionStorage.getItem('ff_notif_session_dismissed')) {
          const timer = setTimeout(() => {
            setIsOpen(true);
            // In Android APK, also request system permission
            if ((window as any).AndroidBridge?.requestNotificationPermission) {
              try {
                (window as any).AndroidBridge.requestNotificationPermission();
              } catch (e) {}
            }
          }, 1200);
          return () => clearTimeout(timer);
        }
      }
    } catch {
      // Safe fallback
    }
  }, []);

  // 2. Play subtle audio chime for incoming notifications
  const playChime = () => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      }
    } catch (e) {}
  };

  // 3. Real-time Background Notification Sync Poller (Runs every 10s across entire app)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Seed lastSeenId from localStorage
    const savedLast = localStorage.getItem('ff_last_seen_notif_id') || '';
    lastSeenIdRef.current = savedLast;

    let isPolling = false;
    const checkNotifications = async () => {
      if (isPolling) return;
      isPolling = true;
      try {
        const res = await fetch('/api/notifications', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const notifs: IncomingNotif[] = data.notifications || [];
        if (notifs.length === 0) return;

        const latest = notifs[0];
        if (!lastSeenIdRef.current) {
          // Initial baseline: mark latest as seen so we don't spam old notifications
          lastSeenIdRef.current = latest.id;
          localStorage.setItem('ff_last_seen_notif_id', latest.id);
          return;
        }

        if (latest.id !== lastSeenIdRef.current) {
          lastSeenIdRef.current = latest.id;
          localStorage.setItem('ff_last_seen_notif_id', latest.id);

          // 1. Android Native Heads-Up Notification (APK)
          if ((window as any).AndroidBridge?.showNativeNotification) {
            try {
              (window as any).AndroidBridge.showNativeNotification(
                latest.title,
                latest.body,
                latest.url || '/'
              );
            } catch (e) {}
          }

          // 2. Browser Push/System Notification
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            try {
              new Notification(latest.title, {
                body: latest.body,
                icon: latest.icon || '/icon-192.png',
                badge: '/icon-192.png',
              });
            } catch (e) {}
          }

          // 3. Play chime
          playChime();

          // 4. In-App Floating Heads-up Alert Banner
          setActiveBanner(latest);
          if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
          bannerTimerRef.current = setTimeout(() => {
            setActiveBanner(null);
          }, 6500);

          // 5. Global window event
          window.dispatchEvent(
            new CustomEvent('ff_notification_received', { detail: latest })
          );
        }
      } catch (err) {
        // Silently retry
      } finally {
        isPolling = false;
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 10000);
    return () => {
      clearInterval(interval);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, []);

  const handleAllowNotifications = async () => {
    try {
      // 1. Android Native request
      if (typeof window !== 'undefined' && (window as any).AndroidBridge?.requestNotificationPermission) {
        try {
          (window as any).AndroidBridge.requestNotificationPermission();
        } catch (e) {}
      }

      // 2. Web browser request
      let granted = false;
      if (typeof Notification !== 'undefined' && typeof Notification.requestPermission === 'function') {
        const res = await Notification.requestPermission();
        granted = res === 'granted';
      }

      // 3. Capacitor Bridge fallback
      const cap = typeof window !== 'undefined' && (window as any).Capacitor;
      if (cap?.Plugins?.PushNotifications?.requestPermissions) {
        await cap.Plugins.PushNotifications.requestPermissions();
        granted = true;
      }

      localStorage.setItem('ff_notif_permission_state', 'granted');
      window.dispatchEvent(new CustomEvent('ff_notif_state_changed', { detail: 'granted' }));

      // Sync WebPush
      await syncWebPushSubscription();

      // Show instant test confirmation heads-up
      if (typeof window !== 'undefined' && (window as any).AndroidBridge?.showNativeNotification) {
        (window as any).AndroidBridge.showNativeNotification(
          '🎉 নোটিফিকেশন সফলভাবে চালু হয়েছে!',
          'রুম আইডি, পাসওয়ার্ড ও টুর্নামেন্ট আপডেট এখন থেকে আপনার ফোনে সরাসরি আসবে।',
          '/'
        );
      }
    } catch (e) {
      console.warn('Notification permission error:', e);
      localStorage.setItem('ff_notif_permission_state', 'granted');
    } finally {
      setIsOpen(false);
    }
  };

  const handleDenyNotifications = () => {
    try {
      localStorage.setItem('ff_notif_permission_state', 'denied');
      sessionStorage.setItem('ff_notif_session_dismissed', 'true');
      window.dispatchEvent(new CustomEvent('ff_notif_state_changed', { detail: 'denied' }));
    } catch {}
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating In-App Live Alert Banner when any notification arrives */}
      {activeBanner && (
        <div className="fixed top-4 left-4 right-4 z-[99999] max-w-md mx-auto animate-in slide-in-from-top-4 duration-300">
          <div
            onClick={() => {
              if (activeBanner.url) router.push(activeBanner.url);
              setActiveBanner(null);
            }}
            className="p-3.5 rounded-2xl bg-slate-900/95 border border-red-500/50 shadow-2xl backdrop-blur-md flex items-start gap-3 cursor-pointer hover:bg-slate-850 transition-all select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center shrink-0 border border-red-500/30">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white truncate">
                  {activeBanner.title}
                </span>
                <span className="text-[10px] text-red-400 font-bold ml-2 shrink-0">
                  এখনই
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                {activeBanner.body}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveBanner(null);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Permission Request Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[99995] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-[320px] rounded-[28px] bg-[#1e1e24] text-white shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Bell Icon & Question */}
            <div className="pt-6 pb-5 px-6 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 shadow-lg shadow-blue-500/20">
                <Bell className="w-7 h-7 text-[#3b82f6] animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-snug">
                  Allow {appName} to send you notifications?
                </h3>
                <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                  ম্যাচের রুম আইডি ও পাসওয়ার্ড, টুর্নামেন্টের সময় এবং পেমেন্ট উইথড্রর নোটিফিকেশন সরাসরি ফোনে পেতে অনুমতি দিন।
                </p>
              </div>
            </div>

            {/* Action Buttons styled like Android native permission prompt */}
            <div className="divide-y divide-white/10 border-t border-white/10">
              <button
                type="button"
                onClick={handleAllowNotifications}
                className="w-full py-3.5 text-center text-[#3b82f6] font-bold text-sm hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
              >
                Allow (অনুমতি দিন)
              </button>
              <button
                type="button"
                onClick={handleDenyNotifications}
                className="w-full py-3.5 text-center text-gray-400 font-medium text-sm hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
              >
                Don&apos;t allow (এখন নয়)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
