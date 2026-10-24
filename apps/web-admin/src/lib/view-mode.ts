'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function detectIsAppClient(pathname?: string): boolean {
  if (pathname === '/mobile-app-view') return true;
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('app') === 'true' || params.get('view') === 'app' || params.get('mode') === 'app') {
      return true;
    }
    if (params.get('view') === 'web' && window.innerWidth >= 1024) {
      return false;
    }
    const session = sessionStorage.getItem('ff_manual_view_mode');
    if (session === 'app') return true;
    if (session === 'web' && window.innerWidth >= 1024) return false;

    // Hardware and Device auto-detection:
    // 1. Mobile User Agent string (Android, iPhone, iPad, etc.)
    // 2. Mobile / tablet screen width (< 1024px)
    // 3. Standalone PWA / native WebView mode
    const isMobileUA =
      typeof navigator !== 'undefined' &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSmall = window.innerWidth < 1024;
    const isStandalone =
      Boolean(window.matchMedia?.('(display-mode: standalone)')?.matches) ||
      (window.navigator as any)?.standalone === true ||
      Boolean((window as any).AndroidApp || (window as any).AndroidBridge);

    return isMobileUA || isSmall || isStandalone;
  } catch (e) {
    return false;
  }
}

export function useViewMode() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewModeState] = useState<'app' | 'web'>(() => {
    return detectIsAppClient(pathname) ? 'app' : 'web';
  });

  useEffect(() => {
    setMounted(true);
    // Purge old permanent localStorage flag that prevented mobile/desktop auto-switch
    try {
      localStorage.removeItem('ff_preferred_view');
    } catch (e) {}

    const checkMobile = () => {
      const isMobile = detectIsAppClient(pathname);
      setViewModeState(isMobile ? 'app' : 'web');
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('ff_view_mode_changed', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('ff_view_mode_changed', checkMobile);
    };
  }, [pathname]);

  const setViewMode = (mode: 'app' | 'web') => {
    try {
      sessionStorage.setItem('ff_manual_view_mode', mode);
    } catch (e) {}
    setViewModeState(mode);
    window.dispatchEvent(new CustomEvent('ff_view_mode_changed', { detail: mode }));
  };

  const isApp = pathname === '/mobile-app-view' || viewMode === 'app';

  return { viewMode, isApp, mounted, setViewMode };
}
