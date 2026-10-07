'use client';

import { useEffect } from 'react';
import { runDailyAutoSchedulerIfDue } from '@/lib/match-scheduler';

/**
 * Invisible component: keeps the auto bot alive while the site is open.
 * Checks every minute whether the daily batch of matches is due and publishes it.
 */
export default function AutoSchedulerRunner() {
  useEffect(() => {
    // Only run if admin explicitly enabled the automated bot in settings
    const config = typeof window !== 'undefined' ? localStorage.getItem('ff_scheduler_config_v1') : null;
    let enabled = false;
    try {
      if (config) enabled = JSON.parse(config).autoEnabled === true;
    } catch (e) {}

    if (!enabled) return;

    runDailyAutoSchedulerIfDue();
    const timer = setInterval(() => {
      runDailyAutoSchedulerIfDue();
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  return null;
}
