'use client';

import { useEffect } from 'react';
import { runDailyAutoSchedulerIfDue } from '@/lib/match-scheduler';

/**
 * Invisible component: keeps the auto bot alive while the site is open.
 * Checks every minute whether the daily batch of matches is due and publishes it.
 */
export default function AutoSchedulerRunner() {
  useEffect(() => {
    runDailyAutoSchedulerIfDue();
    const timer = setInterval(() => {
      runDailyAutoSchedulerIfDue();
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  return null;
}
