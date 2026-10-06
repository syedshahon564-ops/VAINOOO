'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function useViewMode() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewModeState] = useState<'app' | 'web' | null>(null);

  useEffect(() => {
    setMounted(true);
    // Purge old permanent localStorage flag that prevented mobile/desktop auto-switch
    try {
      localStorage.removeItem('ff_preferred_view');
    } catch (e) {}

    const checkMobile = () => {
      // Direct navigation to /mobile-app-view is always app
      if (pathname === '/mobile-app-view') {
        setViewModeState('app');
        return;
      }

      // Check URL query param ?view=app or ?view=web
      try {
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const v = params.get('view') || params.get('mode');
          if (v === 'app' || v === 'web') {
            setViewModeState(v);
            return;
          }
        }
      } catch (e) {}

      // Check session manual switch if user explicitly toggled during this active session
      try {
        const sessionChoice = sessionStorage.getItem('ff_manual_view_mode') as 'app' | 'web' | null;
        if (sessionChoice === 'app' || sessionChoice === 'web') {
          setViewModeState(sessionChoice);
          return;
        }
      } catch (e) {}

      // Hardware and Device auto-detection:
      // 1. Mobile User Agent string (Android, iPhone, etc.)
      // 2. Mobile screen width (< 768px)
      // 3. Standalone PWA mode
      const isMobileUA =
        typeof navigator !== 'undefined' &&
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmall = typeof window !== 'undefined' && window.innerWidth < 768;
      const isStandalone =
        typeof window !== 'undefined' &&
        (Boolean(window.matchMedia?.('(display-mode: standalone)')?.matches) ||
          (window.navigator as any)?.standalone === true);

      // Desktop gets 'web' by default; Mobile gets 'app' by default
      const detected = isMobileUA || isSmall || isStandalone ? 'app' : 'web';
      setViewModeState(detected);
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

  const isApp = pathname === '/mobile-app-view' || (mounted && viewMode === 'app');

  return { viewMode, isApp, mounted, setViewMode };
}
