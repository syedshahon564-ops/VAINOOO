'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function useViewMode() {
  const pathname = usePathname();
  const [viewMode, setViewModeState] = useState<'app' | 'web' | null>(null);

  useEffect(() => {
    const update = () => {
      if (pathname === '/mobile-app-view') {
        setViewModeState('app');
        return;
      }
      try {
        const saved = localStorage.getItem('ff_preferred_view') as 'app' | 'web' | null;
        if (saved) {
          setViewModeState(saved);
          return;
        }
      } catch (e) {}

      const isMobileUA =
        typeof navigator !== 'undefined' &&
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmall = typeof window !== 'undefined' && window.innerWidth < 768;
      const isStandalone =
        typeof window !== 'undefined' &&
        (window.matchMedia('(display-mode: standalone)').matches ||
          (window.navigator as any)?.standalone === true);

      setViewModeState(isMobileUA || isSmall || isStandalone ? 'app' : 'web');
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('ff_view_mode_changed', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('ff_view_mode_changed', update);
    };
  }, [pathname]);

  const setViewMode = (mode: 'app' | 'web') => {
    try {
      localStorage.setItem('ff_preferred_view', mode);
    } catch (e) {}
    setViewModeState(mode);
    window.dispatchEvent(new CustomEvent('ff_view_mode_changed', { detail: mode }));
  };

  const isApp = viewMode === 'app' || pathname === '/mobile-app-view';

  return { viewMode, isApp, setViewMode };
}
