'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function AndroidBackHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const lastBackPressRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // If in-app mobile view is active, it has its own dedicated state-aware handler
    if ((window as any).__inAppMobileViewActive) {
      return;
    }

    const ensureDeepHistory = () => {
      try {
        if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#base') {
          window.history.replaceState({ trapBase: 1 }, '', '#base');
          window.history.pushState({ trapActive: 2 }, '', '#home');
        }
      } catch {}
    };

    ensureDeepHistory();
    window.addEventListener('touchstart', ensureDeepHistory, { once: true, passive: true });
    window.addEventListener('click', ensureDeepHistory, { once: true, passive: true });

    // Expose global fallback for MainActivity.java when outside mobile-app-view
    if (pathname !== '/mobile-app-view') {
      (window as any).__handleAndroidBack = () => {
        if ((window as any).__inAppMobileViewActive) return true;

        // 0. Priority: active input blur
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
          (document.activeElement as HTMLElement).blur();
          return true;
        }

        // 1. Priority: any open modal/dialog in DOM
        const openDialog = document.querySelector('[role="dialog"]');
        if (openDialog) {
          const btn = openDialog.querySelector<HTMLElement>('button');
          if (btn) {
            btn.click();
            return true;
          }
        }

        // 2. Priority: navigate back if on sub-page
        if (pathname && pathname !== '/' && pathname !== '/mobile-app-view') {
          router.back();
          return true;
        }

        // 3. At root: double back press prevention
        const now = Date.now();
        if (now - lastBackPressRef.current < 2000) {
          return false; // Exit allowed
        } else {
          lastBackPressRef.current = now;
          showExitToast();
          return true; // Toast shown, stay in app
        }
      };
    }

    const handlePopState = (e: PopStateEvent) => {
      if ((window as any).__inAppMobileViewActive) {
        return;
      }

      // 1. Check if in-page back handler exists
      if (typeof (window as any).__handleAndroidBack === 'function') {
        const handled = (window as any).__handleAndroidBack();
        if (handled) {
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
