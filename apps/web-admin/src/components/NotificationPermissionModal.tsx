'use client';

import React, { useState, useEffect } from 'react';
import { useCMS } from '@/lib/cms-store';

export default function NotificationPermissionModal() {
  const { settings } = useCMS();
  const [isOpen, setIsOpen] = useState(false);

  const appName = settings?.siteName || 'FF Rivals';

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      // Check if user has already made a decision (either granted or denied)
      const permissionState = localStorage.getItem('ff_notif_permission_state');
      if (
        permissionState === 'granted' ||
        permissionState === 'denied' ||
        (typeof Notification !== 'undefined' && Notification.permission === 'granted')
      ) {
        if (permissionState === 'granted' || (typeof Notification !== 'undefined' && Notification.permission === 'granted')) {
          syncWebPushSubscription();
        }
        setIsOpen(false);
        return;
      }

      // Check if dismissed in this specific session
      if (sessionStorage.getItem('ff_notif_session_dismissed')) {
        setIsOpen(false);
        return;
      }

      // Show modal promptly on app entry without blocking
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 800);

      return () => clearTimeout(timer);
    } catch {
      // Safe fallback
    }
  }, []);

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
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const keyRes = await fetch('/api/notifications/vapid-key');
        const { publicKey } = await keyRes.json();
        if (!publicKey) return;
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }
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

  const handleAllowNotifications = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).AndroidBridge?.requestNotificationPermission) {
        (window as any).AndroidBridge.requestNotificationPermission();
      }

      let granted = false;
      if (typeof Notification !== 'undefined' && typeof Notification.requestPermission === 'function') {
        const res = await Notification.requestPermission();
        granted = res === 'granted';
      }

      // Capacitor / Android WebView support
      const cap = typeof window !== 'undefined' && (window as any).Capacitor;
      if (cap?.Plugins?.PushNotifications?.requestPermissions) {
        await cap.Plugins.PushNotifications.requestPermissions();
        granted = true;
      }

      if (granted) {
        await syncWebPushSubscription();
      }
      localStorage.setItem('ff_notif_permission_state', 'granted');
      window.dispatchEvent(new CustomEvent('ff_notif_state_changed', { detail: 'granted' }));
    } catch (e) {
      console.warn('Notification permission error:', e);
      try {
        localStorage.setItem('ff_notif_permission_state', 'granted');
        window.dispatchEvent(new CustomEvent('ff_notif_state_changed', { detail: 'granted' }));
      } catch {}
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99995] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-[320px] rounded-[28px] bg-[#1e1e24] text-white shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Bell Icon & Question */}
        <div className="pt-6 pb-5 px-6 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
            <svg 
              className="w-7 h-7 text-[#3b82f6]" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-white leading-snug">
              Allow {appName} to send you notifications?
            </h3>
            <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
              Get instant alerts for match room ID & password, tournament start times, and cash payouts.
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
  );
}
