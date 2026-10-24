'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Key, Flame } from 'lucide-react';

interface LiveMatchCountdownProps {
  matchTime: string;
  startTimeIso?: string;
  roomId?: string;
  status?: string;
  compact?: boolean;
  className?: string;
}

/**
 * Converts Bengali digits (০-৯) to Western digits (0-9)
 */
function convertBanglaToEnglishDigits(str: string): string {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let res = str;
  for (let i = 0; i < 10; i++) {
    res = res.replace(new RegExp(banglaDigits[i], 'g'), i.toString());
  }
  return res;
}

/**
 * Parse match schedule string (e.g. "Today 08:30 PM", "আজ রাত ০৮:০০ PM", ISO date) into a Date object
 */
export function parseScheduleTimeToDate(matchTime: string, startTimeIso?: string): Date | null {
  if (startTimeIso) {
    const d = new Date(startTimeIso);
    if (!isNaN(d.getTime())) return d;
  }

  if (!matchTime) return null;

  // Direct ISO/standard parse attempt
  const standardDate = new Date(matchTime);
  if (!isNaN(standardDate.getTime()) && matchTime.includes('-') && matchTime.includes('T')) {
    return standardDate;
  }

  const raw = convertBanglaToEnglishDigits(matchTime.trim());

  // Check for day keywords
  let dayOffset = 0;
  if (/আগামীকাল|কাল|tomorrow/i.test(raw)) {
    dayOffset = 1;
  } else if (/আজ|today/i.test(raw)) {
    dayOffset = 0;
  }

  // Check for date pattern YYYY-MM-DD
  const ymdMatch = raw.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);

  // Check for time pattern HH:mm
  const timeMatch = raw.match(/(\d{1,2})[:.](\d{2})(?::\d{2})?\s*(AM|PM|am|pm)?/);

  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const period = timeMatch[3]?.toUpperCase();

    // Check Bengali period words if period not explicitly given
    const isPMByBengali = /রাত|সন্ধ্যা|বিকাল|দুপুর|pm/i.test(raw);
    const isAMByBengali = /সকাল|ভোর|am/i.test(raw);

    if (period === 'PM' || (!period && isPMByBengali)) {
      if (hours < 12) hours += 12;
    } else if (period === 'AM' || (!period && isAMByBengali)) {
      if (hours === 12) hours = 0;
    }

    const target = new Date();
    if (ymdMatch) {
      target.setFullYear(parseInt(ymdMatch[1], 10), parseInt(ymdMatch[2], 10) - 1, parseInt(ymdMatch[3], 10));
    } else {
      target.setDate(target.getDate() + dayOffset);
    }
    target.setHours(hours, minutes, 0, 0);

    // If dayOffset was 0 (Today) and target is already in the past, roll to tomorrow
    if (!ymdMatch && dayOffset === 0 && target.getTime() < Date.now() - 3600 * 1000) {
      target.setDate(target.getDate() + 1);
    }

    return target;
  }

  return null;
}

/**
 * Returns a clean, upcoming schedule string like "Today 08:30 PM" or "Tomorrow 10:00 AM".
 */
export function getUpcomingScheduleTime(offsetHours: number = 1): string {
  const now = new Date();
  const d = new Date(Date.now() + offsetHours * 60 * 60 * 1000);
  const isTomorrow = d.getDate() !== now.getDate();
  const dayPrefix = isTomorrow ? 'Tomorrow' : 'Today';
  const h = d.getHours();
  const m = d.getMinutes();
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const padH = h12 < 10 ? `0${h12}` : `${h12}`;
  const padM = m < 10 ? `0${m}` : `${m}`;
  return `${dayPrefix} ${padH}:${padM} ${period}`;
}

/**
 * Formats a stored match time into "YYYY-MM-DD at hh:mm AM/PM" using the real scheduled date.
 */
export function formatMatchSchedule(matchTime: string): string {
  const d = parseScheduleTimeToDate(matchTime);
  if (!d) return matchTime;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const h24 = d.getHours();
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} at ${pad(h12)}:${pad(
    d.getMinutes()
  )} ${period}`;
}

/**
 * Checks whether a match has concluded or ended so it leaves active category lobbies.
 */
export function isMatchFinished(match: {
  status?: string;
  results?: any[];
  time?: string;
  startTimeIso?: string;
  roomId?: string;
  roomDeliveredAt?: string;
  deliveredAt?: string;
  categorySlug?: string;
}): boolean {
  if (!match) return false;
  const s = String(match.status || '').toUpperCase();
  if (
    s === 'COMPLETED' ||
    s === 'FINISHED' ||
    s === 'ENDED' ||
    s === 'RESULT_PUBLISHED' ||
    s === 'CANCELLED' ||
    s === 'LIVE'
  ) {
    return true;
  }
  if (Array.isArray(match.results) && match.results.length > 0) {
    return true;
  }

  // User specification: As soon as match scheduled time has arrived/passed, it immediately leaves active category lobbies
  if (match.time) {
    try {
      const d = parseScheduleTimeToDate(match.time, match.startTimeIso);
      if (d && !isNaN(d.getTime())) {
        const diffMs = Date.now() - d.getTime();
        // If match scheduled time has arrived (0 ms or more elapsed), match leaves active lobby
        if (diffMs >= 0) {
          return true;
        }
      }
    } catch (e) {}
  }

  const deliveredIso = (match as any)?.roomDeliveredAt || (match as any)?.deliveredAt;
  if (deliveredIso) {
    try {
      const deliveredTime = new Date(deliveredIso).getTime();
      if (!isNaN(deliveredTime)) {
        const elapsedMins = (Date.now() - deliveredTime) / (60 * 1000);
        if (elapsedMins >= 5) {
          return true;
        }
      }
    } catch (e) {}
  }

  return false;
}

// Centralized Shared Singleton Ticker to eliminate multi-timer CPU & React thrashing
let globalTimestamp = typeof window !== 'undefined' ? Date.now() : 0;
const tickListeners = new Set<() => void>();
let globalInterval: any = null;

function subscribeTick(callback: () => void) {
  tickListeners.add(callback);
  if (!globalInterval && typeof window !== 'undefined') {
    globalTimestamp = Date.now();
    globalInterval = setInterval(() => {
      globalTimestamp = Date.now();
      tickListeners.forEach((cb) => cb());
    }, 1000);
  }
  return () => {
    tickListeners.delete(callback);
    if (tickListeners.size === 0 && globalInterval) {
      clearInterval(globalInterval);
      globalInterval = null;
    }
  };
}

export function useGlobalSecondTick(): number {
  const [, setTick] = useState(0);
  useEffect(() => {
    return subscribeTick(() => setTick((v) => (v + 1) % 1000000));
  }, []);
  return globalTimestamp || Date.now();
}

export default function LiveMatchCountdown({
  matchTime,
  startTimeIso,
  roomId,
  status,
  compact = false,
  className = '',
}: LiveMatchCountdownProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const currentNow = useGlobalSecondTick();
  const targetDate = React.useMemo(() => {
    return parseScheduleTimeToDate(matchTime, startTimeIso);
  }, [matchTime, startTimeIso]);

  if (!mounted) {
    return (
      <div
        className={`w-full py-1.5 rounded-lg bg-emerald-600 text-white font-black ${
          compact ? 'text-[11px]' : 'text-xs'
        } flex items-center justify-center gap-1.5 shadow-sm select-none ${className}`}
      >
        <Clock className="w-3.5 h-3.5" />
        <span>STARTS IN - 00m:00s</span>
      </div>
    );
  }

  const diffMs = targetDate ? targetDate.getTime() - currentNow : null;

  // If match status is explicitly LIVE or COMPLETED
  if (status === 'LIVE') {
    return (
      <div
        className={`w-full py-1.5 rounded-lg bg-red-600 text-white font-black ${
          compact ? 'text-[11px]' : 'text-xs'
        } flex items-center justify-center gap-1.5 shadow-sm select-none ${className}`}
      >
        <span className="w-2 h-2 rounded-full bg-white animate-ping inline-block" />
        <span>MATCH LIVE</span>
      </div>
    );
  }

  if (status === 'COMPLETED') {
    return (
      <div
        className={`w-full py-1.5 rounded-lg bg-gray-600 text-white font-bold ${
          compact ? 'text-[11px]' : 'text-xs'
        } flex items-center justify-center gap-1.5 shadow-sm select-none ${className}`}
      >
        <span>MATCH FINISHED</span>
      </div>
    );
  }

  // In calculating state
  if (diffMs === null) {
    return (
      <div
        className={`w-full py-1.5 rounded-lg bg-emerald-600 text-white font-black ${
          compact ? 'text-[11px]' : 'text-xs'
        } flex items-center justify-center gap-1.5 shadow-sm select-none ${className}`}
      >
        <Clock className="w-3.5 h-3.5" />
        <span>STARTS IN - 00m:00s</span>
      </div>
    );
  }

  // Active Countdown
  if (diffMs > 0) {
    const totalSec = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const timeFormatted =
      hours > 0
        ? `${pad(hours)}h:${pad(minutes)}m:${pad(seconds)}s`
        : `${pad(minutes)}m:${pad(seconds)}s`;

    return (
      <div
        className={`w-full py-1.5 rounded-lg bg-emerald-600 text-white font-black ${
          compact ? 'text-[11px]' : 'text-xs'
        } flex items-center justify-center gap-1.5 shadow-sm select-none tracking-wide ${className}`}
        title={`Scheduled Start: ${targetDate?.toLocaleTimeString()}`}
      >
        <Clock className="w-3.5 h-3.5 animate-pulse text-emerald-100 flex-shrink-0" />
        <span>STARTS IN - {timeFormatted}</span>
      </div>
    );
  }

  // Time has passed: Within 20 minutes (Room Open or Preparing)
  if (diffMs > -20 * 60 * 1000) {
    if (roomId) {
      return (
        <div
          className={`w-full py-1.5 rounded-lg bg-amber-500 text-black font-black ${
            compact ? 'text-[11px]' : 'text-xs'
          } flex items-center justify-center gap-1.5 shadow-sm animate-pulse select-none ${className}`}
        >
          <Key className="w-3.5 h-3.5 text-black" />
          <span>ROOM OPEN • ID REVEALED</span>
        </div>
      );
    }

    return (
      <div
        className={`w-full py-1.5 rounded-lg bg-emerald-700 text-white font-black ${
          compact ? 'text-[11px]' : 'text-xs'
        } flex items-center justify-center gap-1.5 shadow-sm animate-pulse select-none ${className}`}
      >
        <Clock className="w-3.5 h-3.5 text-white" />
        <span>ROOM OPENING SOON</span>
      </div>
    );
  }

  // More than 20 minutes passed -> MATCH LIVE
  return (
    <div
      className={`w-full py-1.5 rounded-lg bg-red-600 text-white font-black ${
        compact ? 'text-[11px]' : 'text-xs'
      } flex items-center justify-center gap-1.5 shadow-sm select-none ${className}`}
    >
      <span className="w-2 h-2 rounded-full bg-white animate-ping inline-block" />
      <span>MATCH LIVE</span>
    </div>
  );
}
