'use client';

import { getCMSData, saveCMSData, MatchItem } from './cms-store';
import { parseScheduleTimeToDate } from '@/components/LiveMatchCountdown';

export interface SlotBooking {
  slotNumber: number; // 1 to 48 (or 1 to 12 for squad team)
  teamNumber?: number; // 1 to 12 for squad
  playerIndexInTeam?: number; // 1 to 4
  uid: string;
  ign: string;
  badge?: string;
  bookedAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  categorySlug?: string;
  timestamp: string;
  read: boolean;
}

const NOTIFICATIONS_STORAGE_KEY = 'ff_notifications_v1';
const SCHEDULER_CONFIG_KEY = 'ff_scheduler_config_v1';

export interface SchedulerConfig {
  autoEnabled: boolean;
  intervalHours: number; // legacy field (kept for backward compatibility)
  lastRunTimestamp: string | null;
  nextRunTimestamp: string | null;
  batchCount: number;
  /** Matches the bot adds per day for each category (max per day). */
  dailyQuota: Record<string, number>;
  /** Daily time (HH:mm, 24h) when the bot publishes the whole day's matches. */
  dailyRunTime: string;
  /** Local date (YYYY-MM-DD) of the day that was last auto-generated. */
  lastBatchDate: string | null;
}

/** Maximum matches per day for each category (as decided by admin). */
export const DEFAULT_DAILY_QUOTA: Record<string, number> = {
  'classic-match': 10,
  'lone-wolf': 7,
  'special-match': 0, // Special matches are added manually, not by the bot
  'clash-squad': 12,
  'lost-to-win': 1,
  'cs-only-headshot': 9,
};

export const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  autoEnabled: false,
  intervalHours: 24,
  lastRunTimestamp: null,
  nextRunTimestamp: null,
  batchCount: 0,
  dailyQuota: DEFAULT_DAILY_QUOTA,
  dailyRunTime: '00:05',
  lastBatchDate: null,
};

export function getSchedulerConfig(): SchedulerConfig {
  if (typeof window === 'undefined') return DEFAULT_SCHEDULER_CONFIG;
  try {
    const raw = localStorage.getItem(SCHEDULER_CONFIG_KEY);
    if (!raw) return DEFAULT_SCHEDULER_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SCHEDULER_CONFIG,
      ...parsed,
      dailyQuota: { ...DEFAULT_DAILY_QUOTA, ...(parsed.dailyQuota || {}) },
    };
  } catch (e) {
    return DEFAULT_SCHEDULER_CONFIG;
  }
}

export function saveSchedulerConfig(config: SchedulerConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SCHEDULER_CONFIG_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent('ff_scheduler_config_updated', { detail: config }));
}

export function getNotifications(): AppNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function sendBroadcastNotification(
  title: string,
  message: string,
  categorySlug?: string
): AppNotification {
  const current = getNotifications();
  const newNotif: AppNotification = {
    id: 'notif-' + Date.now(),
    title,
    message,
    categorySlug,
    timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
    read: false,
  };
  const updated = [newNotif, ...current].slice(0, 30);
  if (typeof window !== 'undefined') {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('ff_notification_received', { detail: newNotif }));
  }
  return newNotif;
}

export function markNotificationsAsRead(): void {
  const current = getNotifications();
  const updated = current.map((n) => ({ ...n, read: true }));
  if (typeof window !== 'undefined') {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('ff_notifications_read'));
  }
}

export function safeFormatDate(val?: string | null): string {
  if (!val) return 'এখনো রান হয়নি';
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString('bn-BD', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  } catch (e) {}
  return val;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  try {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  } catch (e) {
    return false;
  }
}

export function dispatchDevicePushNotification(
  title: string,
  message: string,
  categorySlug?: string
): AppNotification {
  // 1. In-app notification
  const notif = sendBroadcastNotification(title, message, categorySlug);

  // 2. Real Browser / OS Notification
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: message,
        icon: '/logo.png',
        badge: '/logo.png',
      });
    } catch (e) {
      // In mobile WebViews Notification constructor might require Service Worker
    }
  }

  // 3. Audio chime if supported
  if (typeof window !== 'undefined') {
    try {
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
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      }
    } catch (e) {}
  }

  return notif;
}

export function generateDynamicScheduleTimes(): string[] {
  const now = new Date();
  const times: string[] = [];
  const currentHour = now.getHours();

  for (let i = 0; i < 6; i++) {
    const targetHour = currentHour + 1 + i * 2;
    const isTomorrow = targetHour >= 24;
    const h24 = targetHour % 24;
    const period = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    const padH = h12 < 10 ? `0${h12}` : `${h12}`;

    let label = '';
    if (isTomorrow) {
      label = 'আগামীকাল ';
    } else {
      if (h24 >= 5 && h24 < 12) label = 'আজ সকাল ';
      else if (h24 >= 12 && h24 < 16) label = 'আজ দুপুর ';
      else if (h24 >= 16 && h24 < 18) label = 'আজ বিকাল ';
      else if (h24 >= 18 && h24 < 20) label = 'আজ সন্ধ্যা ';
      else label = 'আজ রাত ';
    }

    times.push(`${label}${padH}:00 ${period}`);
  }
  return times;
}

/* ------------------------------------------------------------------ */
/*  Daily Automated Match Generator (Bot)                              */
/* ------------------------------------------------------------------ */

const BOT_MATCH_ID_REGEX = /^(auto-|cm-|cs-|lw-|ltw-|sm-|oh-)/;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Local date key in YYYY-MM-DD format */
export function localDateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Schedule string understood by the countdown parser, e.g. "2026-10-05 at 08:30 PM" */
export function formatScheduleString(d: Date): string {
  const h24 = d.getHours();
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${localDateKey(d)} at ${pad2(h12)}:${pad2(d.getMinutes())} ${period}`;
}

const roundTo5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);

/**
 * Spread `count` match start times through the day (10:00 AM - 11:30 PM).
 * For "today" only the remaining part of the day is used.
 */
function buildDaySlots(count: number, day: Date, offsetMin: number): Date[] {
  if (count <= 0) return [];
  const now = new Date();
  const open = new Date(day);
  open.setHours(10, 0, 0, 0);
  const close = new Date(day);
  close.setHours(23, 30, 0, 0);

  let start = open;
  if (localDateKey(day) === localDateKey(now)) {
    const earliest = new Date(now.getTime() + 30 * 60000);
    earliest.setMinutes(Math.ceil(earliest.getMinutes() / 5) * 5, 0, 0);
    if (earliest.getTime() > start.getTime()) start = earliest;
  }
  if (start.getTime() >= close.getTime()) return [];

  const span = close.getTime() - start.getTime();
  const slots: Date[] = [];
  for (let i = 0; i < count; i++) {
    const ratio = count === 1 ? 0.5 : i / (count - 1);
    const t = new Date(start.getTime() + span * ratio + offsetMin * 60000);
    if (t.getTime() > close.getTime()) t.setTime(close.getTime());
    t.setMinutes(Math.round(t.getMinutes() / 5) * 5, 0, 0);
    slots.push(t);
  }
  return slots;
}

/** Prize split: multi = top 3 share ~55% of collected entry, single = winner takes the pot. */
function buildPrizes(collected: number, mode: 'multi' | 'single') {
  if (mode === 'single') {
    const first = roundTo5(collected * 0.8);
    return { prizePool: first, firstPrize: first, secondPrize: 0, thirdPrize: 0 };
  }
  const pool = roundTo5(collected * 0.55);
  const first = roundTo5(pool * 0.5);
  const second = roundTo5(pool * 0.3);
  const third = Math.max(5, pool - first - second);
  return { prizePool: first + second + third, firstPrize: first, secondPrize: second, thirdPrize: third };
}

interface BotMatchSpec {
  title: string;
  type: string;
  map: string;
  entryFee: number;
  totalSlots: number;
  prizePool: number;
  firstPrize: number;
  secondPrize: number;
  thirdPrize: number;
  perKill: number;
  rules: string;
}

const CLASSIC_PLAN: Array<{ type: 'Squad' | 'Solo' | 'Duo'; map: string; entry: number }> = [
  { type: 'Squad', map: 'Bermuda', entry: 60 },
  { type: 'Solo', map: 'Purgatory', entry: 10 },
  { type: 'Duo', map: 'Kalahari', entry: 30 },
  { type: 'Squad', map: 'Bermuda', entry: 80 },
  { type: 'Solo', map: 'Bermuda', entry: 20 },
  { type: 'Duo', map: 'Purgatory', entry: 40 },
  { type: 'Squad', map: 'Kalahari', entry: 100 },
  { type: 'Solo', map: 'Purgatory', entry: 30 },
  { type: 'Duo', map: 'Bermuda', entry: 60 },
  { type: 'Squad', map: 'Bermuda', entry: 120 },
];

const CLASH_ENTRIES = [10, 10, 20, 20, 30, 30, 40, 50, 50, 70, 100, 150];
const LONE_WOLF_ENTRIES = [10, 10, 20, 30, 50, 50, 100];
const LOST_TO_WIN_ENTRIES = [100];
const HEADSHOT_ENTRIES = [10, 20, 20, 30, 30, 50, 50, 70, 100];

const MAPS_CS = ['Bermuda', 'Purgatory', 'Kalahari', 'Alpine'];

function buildSpecs(slug: string, count: number): BotMatchSpec[] {
  const specs: BotMatchSpec[] = [];

  for (let i = 0; i < count; i++) {
    if (slug === 'classic-match') {
      const p = CLASSIC_PLAN[i % CLASSIC_PLAN.length];
      const units = p.type === 'Squad' ? 12 : p.type === 'Duo' ? 24 : 48;
      const prizes = buildPrizes(p.entry * units, 'multi');
      specs.push({
        title:
          p.type === 'Squad'
            ? `Classic Squad • ${p.map} (12 Teams)`
            : p.type === 'Duo'
            ? `Classic Duo • ${p.map} (24 Teams)`
            : `Classic Solo • ${p.map} (48 Players)`,
        type: p.type,
        map: p.map,
        entryFee: p.entry,
        totalSlots: 48,
        perKill: Math.max(2, Math.round(p.entry / 10)),
        ...prizes,
        rules:
          p.type === 'Squad'
            ? `১. ক্লাসিক স্কোয়াড ম্যাচে মোট ১২টি টিম থাকবে (প্রতিটি টিমে ৪ জন প্লেয়ার)।\n২. টিম-আপ সম্পূর্ণ নিষিদ্ধ। টিম-আপ প্রমাণিত হলে স্কোয়াডের সবাইকে ব্যান করা হবে।\n৩. ম্যাচ শুরুর ২-৪ মিনিট আগে Room ID ও Password দেওয়া হবে।`
            : p.type === 'Duo'
            ? `১. ২৪টি ডুও দল অংশগ্রহণ করবে।\n২. আপনার ডুও পার্টনারের সাথে একই স্লটে জয়েন করতে হবে।\n৩. টিম-আপ নিষিদ্ধ।`
            : `১. ৪৮ জন প্লেয়ার সোলো লড়াই করবে।\n২. টিম-আপ করতে দেখা গেলে কিল বোনাস বাজেয়াপ্ত হবে।\n৩. হ্যাক, কনফিগ বা স্ক্রিপ্ট ব্যবহারকারীকে অটো-ব্যান করা হবে।`,
      });
    } else if (slug === 'clash-squad') {
      const entry = CLASH_ENTRIES[i % CLASH_ENTRIES.length];
      const map = MAPS_CS[i % MAPS_CS.length];
      const modePattern = i % 3;
      const type = modePattern === 0 ? '4 vs 4' : modePattern === 1 ? '2 vs 2' : '1 vs 1';
      const slots = type === '4 vs 4' ? 8 : type === '2 vs 2' ? 4 : 2;
      specs.push({
        title: `Clash Squad ${type} • ${map}`,
        type,
        map,
        entryFee: entry,
        totalSlots: slots,
        perKill: 0,
        ...buildPrizes(entry * slots, 'single'),
        rules: `১. ক্ল্যাশ স্কোয়াড ৭ রাউন্ডের খেলা।\n২. গ্রেনেড সম্পূর্ণ নিষিদ্ধ। গ্রেনেড মারলে তৎক্ষণাৎ ডিসকোয়ালিফাই।\n৩. বিজয়ী দল সম্পূর্ণ প্রাইজপুল পাবে।`,
      });
    } else if (slug === 'lone-wolf') {
      const entry = LONE_WOLF_ENTRIES[i % LONE_WOLF_ENTRIES.length];
      const isDuo = i % 2 === 1;
      const type = isDuo ? '2 vs 2' : '1 vs 1';
      const slots = isDuo ? 4 : 2;
      specs.push({
        title: isDuo ? `Lone Wolf Duo 2v2 • Iron Cage` : `Lone Wolf 1v1 • Iron Cage`,
        type,
        map: 'Iron Cage',
        entryFee: entry,
        totalSlots: slots,
        perKill: 0,
        ...buildPrizes(entry * slots, 'single'),
        rules: isDuo
          ? `১. ২ বনাম ২ ডুও ফাইট।\n২. বিজয়ী দল সম্পূর্ণ প্রাইজপুল পাবে।\n৩. কোনো প্রকার গান বা ক্যারেক্টার রেস্ট্রিকশন নেই।`
          : `১. ১ বনাম ১ সরাসরি ডুয়েল ফাইট।\n২. কোনো প্রকার গান বা ক্যারেক্টার রেস্ট্রিকশন নেই।`,
      });
    } else if (slug === 'lost-to-win') {
      const entry = LOST_TO_WIN_ENTRIES[i % LOST_TO_WIN_ENTRIES.length];
      specs.push({
        title: `1v1 Lost to Win Challenge`,
        type: '1 vs 1',
        map: 'Bermuda',
        entryFee: entry,
        totalSlots: 2,
        perKill: 0,
        ...buildPrizes(entry * 2, 'single'),
        rules: `১. বিশেষ ১v১ চ্যালেঞ্জ। জয়ী প্লেয়ার উইনিং প্রাইজ পাবেন।`,
      });
    } else if (slug === 'cs-only-headshot') {
      const entry = HEADSHOT_ENTRIES[i % HEADSHOT_ENTRIES.length];
      specs.push({
        title: `CS Only Headshot 4v4`,
        type: '4 vs 4',
        map: 'Bermuda',
        entryFee: entry,
        totalSlots: 8,
        perKill: 0,
        ...buildPrizes(entry * 8, 'single'),
        rules: `১. হেডশট অনলি মোড সক্রিয় থাকবে।\n২. বডি শটে কোনো ড্যামেজ হবে না, শুধুমাত্র হেডশটে নক ও কিল হবে।`,
      });
    }
  }
  return specs;
}

/**
 * Daily Batch Generator (used by the bot and the manual "Generate" button).
 * Adds the full day's matches for every category based on `dailyQuota`:
 *   Classic 10, Lone Wolf 7, Clash Squad 12, Lost to Win 1, CS Only Headshot 9
 *   (Special Match is NOT bot-generated - admin adds it manually).
 * Prize pools are derived from the entry fee and slot count (realistic payouts).
 */
export function generateAutomatedMatchBatch(options?: {
  clearExisting?: boolean;
  targetDay?: 'today' | 'tomorrow';
}): {
  createdCount: number;
  matches: MatchItem[];
  targetDate: string;
} {
  const cmsData = getCMSData();
  const config = getSchedulerConfig();
  const now = new Date();

  const targetDay = new Date(now);
  const useTomorrow =
    options?.targetDay === 'tomorrow' || (!options?.targetDay && now.getHours() >= 20);
  if (useTomorrow) targetDay.setDate(targetDay.getDate() + 1);
  const targetKey = localDateKey(targetDay);
  const todayKey = localDateKey(now);

  if (options?.clearExisting) {
    cmsData.matches = [];
  } else {
    // Remove stale / duplicate bot matches that nobody joined (same day or old days)
    cmsData.matches = cmsData.matches.filter((m) => {
      if (!BOT_MATCH_ID_REGEX.test(m.id)) return true;
      if ((m.filledSlots || 0) > 0) return true;
      const d = parseScheduleTimeToDate(m.time);
      if (!d) return false;
      const key = localDateKey(d);
      return key !== targetKey && key >= todayKey;
    });
  }

  const batchTimestamp = Date.now();
  const generatedMatches: MatchItem[] = [];
  const categoryOrder = Object.keys(config.dailyQuota);

  categoryOrder.forEach((slug, catIndex) => {
    const count = Math.max(0, Math.floor(config.dailyQuota[slug] || 0));
    if (count === 0) return;
    const specs = buildSpecs(slug, count);
    const slots = buildDaySlots(specs.length, targetDay, catIndex * 7);
    const banner = cmsData.categories[slug]?.bannerImage || '';

    specs.forEach((spec, i) => {
      if (!slots[i]) return;
      generatedMatches.push({
        id: `auto-${slug}-${targetKey}-${i}-${batchTimestamp}`,
        categorySlug: slug,
        title: `Match #${i + 1} • ${spec.title}`,
        map: spec.map,
        type: spec.type,
        time: formatScheduleString(slots[i]),
        entryFee: spec.entryFee,
        prizePool: spec.prizePool,
        perKill: spec.perKill,
        firstPrize: spec.firstPrize,
        secondPrize: spec.secondPrize,
        thirdPrize: spec.thirdPrize,
        totalSlots: spec.totalSlots,
        filledSlots: 0,
        bannerImage: banner,
        rules: spec.rules,
        status: 'UPCOMING',
      });
    });
  });

  generatedMatches.sort(
    (a, b) =>
      (parseScheduleTimeToDate(a.time)?.getTime() || 0) -
      (parseScheduleTimeToDate(b.time)?.getTime() || 0)
  );

  cmsData.matches = [...generatedMatches, ...cmsData.matches];
  saveCMSData(cmsData);

  // Update Scheduler Configuration last run
  const cfg = getSchedulerConfig();
  cfg.lastRunTimestamp = new Date().toISOString();
  cfg.lastBatchDate = targetKey;
  cfg.nextRunTimestamp = null;
  cfg.batchCount += 1;
  saveSchedulerConfig(cfg);

  // Register all newly generated matches with the Bot system
  generatedMatches.forEach((m) => registerMatchWithBot(m));

  // Dispatch App Notification to all active mobile users
  sendBroadcastNotification(
    '🔥 নতুন টুর্নামেন্ট যুক্ত হয়েছে!',
    `${generatedMatches.length}টি নতুন ম্যাচ শিডিউল করা হয়েছে। এখনই আপনার পছন্দের স্লট বুক করুন!`,
    'classic-match'
  );

  return {
    createdCount: generatedMatches.length,
    matches: generatedMatches,
    targetDate: targetKey,
  };
}

/**
 * Called periodically from the browser. Publishes the day's matches once per day
 * after `dailyRunTime` (and tomorrow's batch after 8 PM) when the bot is enabled.
 */
export function runDailyAutoSchedulerIfDue(): boolean {
  if (typeof window === 'undefined') return false;
  const config = getSchedulerConfig();
  if (!config.autoEnabled) return false;

  const now = new Date();
  const todayKey = localDateKey(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = localDateKey(tomorrow);

  const [rh, rm] = (config.dailyRunTime || '00:05').split(':').map((x) => parseInt(x, 10) || 0);
  const runAt = new Date(now);
  runAt.setHours(rh, rm, 0, 0);
  if (now.getTime() < runAt.getTime()) return false;

  const last = config.lastBatchDate;
  const publishTomorrow = now.getHours() >= 20;

  if (last === tomorrowKey) return false;
  if (last === todayKey && !publishTomorrow) return false;

  generateAutomatedMatchBatch({ targetDay: publishTomorrow ? 'tomorrow' : 'today' });
  return true;
}

/* ------------------------------------------------------------------ */
/*  Bot Monitored Matches Registry & Auto Room Delivery               */
/* ------------------------------------------------------------------ */

export interface BotMonitoredMatch {
  id: string;
  categorySlug: string;
  title: string;
  time: string;
  map?: string;
  type?: string;
  status: 'UPCOMING' | 'ROOM_OPEN' | 'LIVE' | 'COMPLETED';
  roomId?: string;
  roomPass?: string;
  roomDelivered: boolean;
  deliveredAt?: string;
  registeredAt: string;
  totalSlots: number;
  filledSlots: number;
}

export interface UserBookedMatch {
  id: string;
  matchId: string;
  categorySlug?: string;
  title: string;
  map?: string;
  type?: string;
  slot: number;
  team?: number;
  ign: string;
  uid: string;
  time: string;
  roomId?: string;
  roomPass?: string;
  bookedAt: string;
}

const BOT_MONITORED_STORAGE_KEY = 'ff_bot_monitored_matches_v2';
const USER_BOOKINGS_STORAGE_KEY = 'ff_user_booked_matches_v2';

export function getBotMonitoredMatches(): BotMonitoredMatch[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BOT_MONITORED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveBotMonitoredMatches(matches: BotMonitoredMatch[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BOT_MONITORED_STORAGE_KEY, JSON.stringify(matches));
    window.dispatchEvent(new CustomEvent('ff_bot_matches_updated', { detail: matches }));
  } catch (e) {}
}

export function registerMatchWithBot(match: MatchItem): void {
  if (typeof window === 'undefined') return;
  const current = getBotMonitoredMatches();
  const existingIdx = current.findIndex((m) => m.id === match.id);
  const isDelivered = Boolean(match.roomId && match.status === 'ROOM_OPEN');
  const nowIso = new Date().toISOString();

  const monitoredItem: BotMonitoredMatch = {
    id: match.id,
    categorySlug: match.categorySlug,
    title: match.title,
    time: match.time,
    map: match.map,
    type: match.type,
    status: match.status || 'UPCOMING',
    roomId: match.roomId,
    roomPass: match.roomPass,
    roomDelivered: isDelivered,
    deliveredAt: match.roomId ? (existingIdx !== -1 && current[existingIdx].deliveredAt ? current[existingIdx].deliveredAt : nowIso) : undefined,
    registeredAt: existingIdx !== -1 ? current[existingIdx].registeredAt : nowIso,
    totalSlots: match.totalSlots,
    filledSlots: match.filledSlots || 0,
  };

  if (existingIdx !== -1) {
    current[existingIdx] = monitoredItem;
  } else {
    current.unshift(monitoredItem);
  }
  saveBotMonitoredMatches(current);
}

export function unregisterMatchFromBot(matchId: string): void {
  if (typeof window === 'undefined') return;
  const current = getBotMonitoredMatches();
  const updated = current.filter((m) => m.id !== matchId);
  saveBotMonitoredMatches(updated);
}

export function clearBotMatches(): void {
  if (typeof window === 'undefined') return;
  saveBotMonitoredMatches([]);
}

/**
 * Generates a realistic 7-digit Free Fire Custom Room ID (e.g. "8492015")
 */
export function generateRandomRoomId(): string {
  return Math.floor(1000000 + Math.random() * 9000000).toString();
}

/**
 * Generates a realistic 4-digit PIN Room Password (e.g. "1234", "7890")
 */
export function generateRandomRoomPass(): string {
  return Math.random() > 0.35 ? '1234' : Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Automatically generates & delivers Room ID and Password for a match,
 * updates CMS data, notifies mobile users, and updates player bookings.
 */
export function autoDeliverRoomCredentials(matchId: string): { roomId: string; roomPass: string } | null {
  if (typeof window === 'undefined') return null;
  const cmsData = getCMSData();
  const matchIndex = cmsData.matches.findIndex((m) => m.id === matchId);
  if (matchIndex === -1) return null;

  const match = cmsData.matches[matchIndex];
  const roomId = match.roomId || generateRandomRoomId();
  const roomPass = match.roomPass || generateRandomRoomPass();

  // 1. Update Match in CMS store
  cmsData.matches[matchIndex] = {
    ...match,
    roomId,
    roomPass,
    status: 'ROOM_OPEN',
  };
  saveCMSData(cmsData);

  // 2. Update Bot Monitored match
  const monitored = getBotMonitoredMatches();
  const monIdx = monitored.findIndex((m) => m.id === matchId);
  const nowIso = new Date().toISOString();
  if (monIdx !== -1) {
    monitored[monIdx] = {
      ...monitored[monIdx],
      roomId,
      roomPass,
      status: 'ROOM_OPEN',
      roomDelivered: true,
      deliveredAt: nowIso,
    };
  } else {
    monitored.unshift({
      id: match.id,
      categorySlug: match.categorySlug,
      title: match.title,
      time: match.time,
      map: match.map,
      type: match.type,
      status: 'ROOM_OPEN',
      roomId,
      roomPass,
      roomDelivered: true,
      deliveredAt: nowIso,
      registeredAt: nowIso,
      totalSlots: match.totalSlots,
      filledSlots: match.filledSlots || 0,
    });
  }
  saveBotMonitoredMatches(monitored);

  // 3. Update User Bookings storage if user has booked this match
  updateUserBookingsWithRoomCredentials(matchId, roomId, roomPass);

  // 4. Dispatch notification to all users (both in-app and browser/device push)
  dispatchDevicePushNotification(
    '🔑 রুম আইডি ও পাসওয়ার্ড ডেলিভারি!',
    `"${match.title}" ম্যাচের রুম আইডি: ${roomId} এবং পাসওয়ার্ড: ${roomPass} উন্মুক্ত করা হয়েছে। দ্রুত ফ্রি ফায়ারে জয়েন করুন!`,
    match.categorySlug
  );

  window.dispatchEvent(
    new CustomEvent('ff_room_credentials_delivered', {
      detail: { matchId, roomId, roomPass },
    })
  );

  return { roomId, roomPass };
}

/**
 * Checks all matches and auto-delivers Room ID & Password if scheduled time is due
 * (or <= 15 minutes before start).
 */
export function runBotRoomManagerCycle(): number {
  if (typeof window === 'undefined') return 0;
  const cmsData = getCMSData();
  if (!cmsData.matches || cmsData.matches.length === 0) return 0;

  const now = new Date();
  let deliveredCount = 0;

  const monitored = getBotMonitoredMatches();
  const monitoredMap = new Map(monitored.map((m) => [m.id, m]));

  for (const match of cmsData.matches) {
    if (match.status === 'COMPLETED') continue;

    // Register if not monitored yet
    if (!monitoredMap.has(match.id)) {
      registerMatchWithBot(match);
    }

    // Check if room needs delivery
    if (!match.roomId || match.status !== 'ROOM_OPEN') {
      const matchDate = parseScheduleTimeToDate(match.time);
      let isDue = false;

      if (matchDate) {
        // Room opens 15 minutes before match start
        const diffMinutes = (matchDate.getTime() - now.getTime()) / 60000;
        // If within 15 minutes before start or already past start time
        if (diffMinutes <= 15) {
          isDue = true;
        }
      } else {
        // If time format cannot be parsed, deliver if match has participants or marked ROOM_OPEN
        if ((match.filledSlots || 0) > 0 || match.status === 'ROOM_OPEN') {
          isDue = true;
        }
      }

      if (isDue) {
        autoDeliverRoomCredentials(match.id);
        deliveredCount++;
      }
    }
  }

  return deliveredCount;
}

/* ------------------------------------------------------------------ */
/*  User Booked Matches Persistent Helpers                            */
/* ------------------------------------------------------------------ */

export function getUserBookedMatches(): UserBookedMatch[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(USER_BOOKINGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveUserBookedMatches(list: UserBookedMatch[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_BOOKINGS_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('ff_user_bookings_updated', { detail: list }));
  } catch (e) {}
}

export function addUserBooking(booking: Omit<UserBookedMatch, 'id' | 'bookedAt'>): UserBookedMatch {
  const current = getUserBookedMatches();
  const newEntry: UserBookedMatch = {
    ...booking,
    id: 'bm-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    bookedAt: new Date().toISOString(),
  };
  const updated = [newEntry, ...current];
  saveUserBookedMatches(updated);
  return newEntry;
}

export function updateUserBookingsWithRoomCredentials(
  matchId: string,
  roomId: string,
  roomPass: string
): void {
  const current = getUserBookedMatches();
  let modified = false;
  const updated = current.map((b) => {
    if (b.matchId === matchId || b.id === matchId) {
      modified = true;
      return { ...b, roomId, roomPass };
    }
    return b;
  });
  if (modified) {
    saveUserBookedMatches(updated);
  }
}

// Global listener: when a match is added from anywhere, register with bot
if (typeof window !== 'undefined') {
  window.addEventListener('ff_match_added', (e: any) => {
    if (e.detail) {
      registerMatchWithBot(e.detail);
    }
  });
  window.addEventListener('ff_match_deleted', (e: any) => {
    if (e.detail?.matchId) {
      unregisterMatchFromBot(e.detail.matchId);
    }
  });
}

/* ------------------------------------------------------------------ */
/*  Scheduled & Draft Matches Queue System                            */
/* ------------------------------------------------------------------ */

export interface ScheduledBotMatch {
  id: string;
  title: string;
  categorySlug: string;
  map: string;
  type: 'Solo' | 'Duo' | 'Squad';
  version: string;
  entryFee: number;
  prizePool: number;
  firstPrize: number;
  secondPrize?: number;
  thirdPrize?: number;
  perKill: number;
  totalSlots: number;
  publishAt: string; // ISO or local date-time string e.g. "2026-10-09T22:00"
  matchPlayTime: string; // e.g. "আজ রাত ১০:০০ PM" or schedule string
  rules?: string;
  createdAt: string;
  status: 'SCHEDULED' | 'PUBLISHED';
}

const SCHEDULED_MATCHES_STORAGE_KEY = 'ff_scheduled_matches_queue_v1';

export function getScheduledBotMatches(): ScheduledBotMatch[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SCHEDULED_MATCHES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveScheduledBotMatches(list: ScheduledBotMatch[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SCHEDULED_MATCHES_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('ff_scheduled_matches_updated', { detail: list }));
  } catch (e) {}
}

export function addScheduledBotMatch(
  match: Omit<ScheduledBotMatch, 'id' | 'createdAt' | 'status'>
): ScheduledBotMatch {
  const current = getScheduledBotMatches();
  const newMatch: ScheduledBotMatch = {
    ...match,
    id: 'sched-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    createdAt: new Date().toISOString(),
    status: 'SCHEDULED',
  };
  const updated = [newMatch, ...current];
  saveScheduledBotMatches(updated);
  return newMatch;
}

export function deleteScheduledBotMatch(id: string): void {
  const current = getScheduledBotMatches();
  const updated = current.filter((m) => m.id !== id);
  saveScheduledBotMatches(updated);
}

export function publishScheduledBotMatch(id: string): boolean {
  if (typeof window === 'undefined') return false;
  const current = getScheduledBotMatches();
  const target = current.find((m) => m.id === id);
  if (!target) return false;

  const cmsData = getCMSData();
  const newMatchItem: MatchItem = {
    id: 'm-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    categorySlug: target.categorySlug,
    title: target.title,
    time: target.matchPlayTime,
    map: target.map,
    type: target.type,
    version: target.version || 'MOBILE',
    entryFee: target.entryFee,
    prizePool: target.prizePool,
    firstPrize: target.firstPrize,
    secondPrize: target.secondPrize || 0,
    thirdPrize: target.thirdPrize || 0,
    perKill: target.perKill,
    totalSlots: target.totalSlots,
    filledSlots: 0,
    status: 'UPCOMING',
    rules: target.rules || 'সব নিয়ম মেনে খেলুন। কোনো হ্যাকিং বা ইললিগ্যাল কার্যকলাপ নিষিদ্ধ।',
    bannerImage: '/logo.png',
  };

  // Add to CMS data matches
  cmsData.matches = [newMatchItem, ...cmsData.matches];
  saveCMSData(cmsData);

  // Register with bot monitoring
  registerMatchWithBot(newMatchItem);

  // Remove from scheduled queue
  const updatedScheduled = current.filter((m) => m.id !== id);
  saveScheduledBotMatches(updatedScheduled);

  // Notify players with device push notification
  dispatchDevicePushNotification(
    '🔥 নতুন ম্যাচ লাইভ পাবলিশ হয়েছে!',
    `"${newMatchItem.title}" (${newMatchItem.type}) টুর্নামেন্ট শুরু হতে যাচ্ছে। এখনই আপনার পছন্দের স্লট বুক করুন!`,
    newMatchItem.categorySlug
  );

  return true;
}

export function runScheduledBotPublishCycle(): number {
  if (typeof window === 'undefined') return 0;
  const scheduled = getScheduledBotMatches();
  if (scheduled.length === 0) return 0;

  const now = Date.now();
  let publishedCount = 0;

  for (const item of scheduled) {
    if (item.status === 'SCHEDULED' && item.publishAt) {
      const pubTime = new Date(item.publishAt).getTime();
      if (!isNaN(pubTime) && pubTime <= now) {
        if (publishScheduledBotMatch(item.id)) {
          publishedCount++;
        }
      }
    }
  }

  return publishedCount;
}

// Global auto-publish and room check cycle every 15s in browser
if (typeof window !== 'undefined') {
  setInterval(() => {
    runScheduledBotPublishCycle();
    runBotRoomManagerCycle();
  }, 15000);
}

