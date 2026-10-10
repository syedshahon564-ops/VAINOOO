'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function AndroidBackHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const lastBackPressRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Keep history depth >= 3 so webView.canGoBack() in Capacitor is ALWAYS TRUE
    const ensureDeepHistory = () => {
      try {
        window.history.pushState({ trapBase: 1 }, '', window.location.href);
        window.history.pushState({ trapActive: 2 }, '', window.location.href);
      } catch {}
    };

    ensureDeepHistory();
    window.addEventListener('touchstart', ensureDeepHistory, { once: true, passive: true });
    window.addEventListener('click', ensureDeepHistory, { once: true, passive: true });

    const handlePopState = (e: PopStateEvent) => {
      // 1. Check if an active in-page back handler exists (e.g. in mobile-app-view)
      if (typeof (window as any).__handleAndroidBack === 'function') {
        const handled = (window as any).__handleAndroidBack();
        if (handled) {
          // Re-arm immediately
          ensureDeepHistory();
          return;
        }
      }

      // 2. Check if there are any open modals in DOM with close buttons
      const closeButtons = document.querySelectorAll<HTMLElement>(
        '[aria-label="Close"], [data-modal-close="true"], .modal-close-btn'
      );
      if (closeButtons.length > 0) {
        closeButtons[closeButtons.length - 1].click();
        ensureDeepHistory();
        return;
      }

      // 3. If on sub-page, navigate back
      if (pathname && pathname !== '/' && pathname !== '/mobile-app-view') {
        router.back();
        ensureDeepHistory();
        return;
      }

      // 4. At home root: Require 2 quick back presses within 2 seconds to exit
      const now = Date.now();
      if (now - lastBackPressRef.current < 2000) {
        // Double press confirmed: allow native exit
        const cap = (window as any).Capacitor;
        if (cap?.Plugins?.App?.exitApp) {
          cap.Plugins.App.exitApp();
        }
      } else {
        lastBackPressRef.current = now;
        showExitToast();
        ensureDeepHistory();
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Global Capacitor hardware back listener
    let capHandle: any = null;
    try {
      const capApp = (window as any)?.Capacitor?.Plugins?.App;
      if (capApp?.addListener) {
        capHandle = capApp.addListener('backButton', () => {
          handlePopState(new PopStateEvent('popstate'));
        });
      }
    } catch {}

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (capHandle?.remove) capHandle.remove();
    };
  }, [pathname, router]);

  return null;
}

function showExitToast() {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById('ff-exit-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'ff-exit-toast';
  toast.innerText = 'অ্যাপ থেকে বের হতে আবার ব্যাক চাপুন (Press back again to exit)';
  toast.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(18, 18, 24, 0.95);
    color: #ffffff;
    border: 1px solid rgba(239, 68, 68, 0.5);
    padding: 10px 20px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 700;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    z-index: 999999;
    pointer-events: none;
    transition: opacity 0.3s ease;
    text-align: center;
    white-space: nowrap;
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 1800);
}
