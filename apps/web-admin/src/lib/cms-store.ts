'use client';

import { useEffect, useMemo, useState } from 'react';
import { INITIAL_CATEGORIES, INITIAL_BANNERS, LONE_WOLF_1V1_RULES, LONE_WOLF_2V2_RULES } from './initial-categories';
export { isMatchFinished } from '@/components/LiveMatchCountdown';
export { INITIAL_CATEGORIES, INITIAL_BANNERS, LONE_WOLF_1V1_RULES, LONE_WOLF_2V2_RULES };

export interface MatchItem {
  id: string;
  categorySlug: string;
  title: string;
  map: string;
  time: string;
  entryFee: number;
  prizePool: number;
  perKill: number;
  firstPrize: number;
  secondPrize: number;
  thirdPrize: number;
  totalSlots: number;
  filledSlots: number;
  type: string; // 'Squad' | 'Solo' | 'Duo' | '4 vs 4' | '1 vs 1'
  matchType?: string;
  version?: string;
  bannerImage?: string;
  rules?: string;
  roomId?: string;
  roomPass?: string;
  roomDeliveredAt?: string;
  status?: 'UPCOMING' | 'ROOM_OPEN' | 'LIVE' | 'COMPLETED';
  /** Published after the match ends: who placed where, kills and prize won. */
  results?: Array<{ rank: number; ign: string; kills: number; prize: number }>;
  participants?: Array<{ ign: string; uid?: string; slot?: number; team?: number }>;
  createdAt?: number;
  updatedAt?: number;
}

export interface MatchParticipant {
  ign: string;
  uid?: string;
  slot?: number;
  team?: number;
}

export interface CategoryItem {
  slug: string;
  id: number;
  name: string;
  section: string;
  bannerImage: string;
  avatarImage: string;
  description: string;
  customRules?: string;
  updatedAt?: number;
}

export interface TopPlayerItem {
  id: string;
  rank: number;
  ign: string;
  uid: string;
  avatar: string;
  kills: number;
  earnings: number;
  matchesPlayed: number;
  booyahs: number;
  winRate: string;
}

export interface BannerSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  image?: string;
  actionText?: string;
  actionUrl?: string;
  updatedAt?: number;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  logoUrl: string;
  noticeText: string;
  telegramUrl: string;
  whatsappNumber: string;
  bkashNumber: string;
  nagadNumber: string;
  rocketNumber?: string; // ডাচ-বাংলা (DBBL Rocket)
  paymentInstructionImage?: string; // সেন্ড মানি নির্দেশিকা ইমেজ
  paymentInstructionText?: string; // সেন্ড মানি নির্দেশিকা বার্তা
  autoWebhookVerification?: boolean; // স্বয়ংক্রিয় ওয়েবক ও ট্রানজেকশন বট ভেরিফিকেশন
  defaultRules: string;
  categoryRules?: Record<string, string>;
  howToJoinGuide: string;
  apkDownloadUrl?: string;
  banners?: BannerSlide[];
  importantNoticeTitle?: string;
  importantNoticeBody?: string;
  importantNoticeEnabled?: boolean;
  updatedAt?: number;
  bannersUpdatedAt?: number;
}

export interface CMSData {
  categories: Record<string, CategoryItem>;
  matches: MatchItem[];
  settings: SiteSettings;
  topPlayers: TopPlayerItem[];
  deletedCategories?: string[];
  matchesClearedAt?: number;
  matchesUpdatedAt?: number;
}

const STORAGE_KEY = 'ff_esports_cms_data_v8';
const MIGRATION_KEY = 'ff_esports_cms_migration_v8';
const ZERO_RESET_KEY = 'ff_esports_matches_zero_reset_v8';

export const INITIAL_TOP_PLAYERS: TopPlayerItem[] = [];

export const DEFAULT_IMPORTANT_NOTICE = `✍️ We Support only fair players 😎
প্রথমে নিয়ম পড়বেন all rules button a click করে, সমস্ত mode এর নিয়ম আলাদা 🤝 যারা নিয়ম মেনে খেলতে পারবেন তাদের জন্য GR FF TOUR সেরা 🥳 নিয়ম না মানতে পারলে ম্যাচে জয়েন করবেন না leave and go এই অ্যাপস তাদের জন্য না!
⛔ একের অধিক (বেশি) ফ্রী ফায়ার আইডি দিয়ে যে এক্স গেম খেলবে তাকে এক্স থেকে ব্যান করা হবে!
⛔ এক্সের ম্যাচের মধ্যে Garena Free Fire যে প্লেয়ার কে (garena free fire was eliminated by the system due to abnormal behaviour) এই লিখা দিয়ে Eliminate করবে তাকে সঙ্গে সঙ্গে আমাদের এক্স থেকে পার্মানেন্ট ব্যান করা হবে!
✅ Withdraw 100 টাকার নিচে হলে 5 টাকা খরচ কাটা হবে এবং 100 টাকার বেশি হলে (যেমন 101 টাকা থেকে আপনার যত টাকা ইচ্ছে) 10 টাকা খরচ কাটা হবে! প্রত্যেক উইথড্র উইথড্র রিকোয়েস্ট পাঠানোর 48 ঘণ্টার মধ্যে যাচাই-বাছাই করে সম্পন্ন করা হয়✅ সারাদিন যতবার ইচ্ছে ততবার উইথড্র করবেন😇✅
যে কোন সমস্যায় আমাদের হোয়াটসঅ্যাপ চ্যানেলে দেওয়া ফেসবুক পেইজে মেসেজ করবেন, সমস্যা নিয়ে যদি আপনি আমাদের সাথে যোগাযোগ না করেন সে ক্ষেত্রে আপনার নিজেরই ক্ষতি আর আমরা সেটা জানতেও পারব না, তাই নির্দ্বিধায় আমাদেরকে মেসেজ করবেন!`;

export const INITIAL_SETTINGS: SiteSettings = {
  siteName: 'FF RIVAL TOUR BD',
  tagline: 'Bangladesh Official Free Fire Esports Arena',
  logoUrl: '/logo.png',
  noticeText:
    '🔥 FF RIVAL TOUR BD-তে স্বাগতম! প্রতিদিন গেম খেলে জিতে নিন আসল টাকা! 💰 টপ প্লেয়ার লিডারবোর্ডে নিজের নাম তুলুন এবং জিতে নিন মেগা প্রাইজপুল! যেকোনো সহায়তার জন্য টেলিগ্রামে যোগাযোগ করুন 🎯',
  telegramUrl: 'https://t.me/ffrivaltourbd',
  whatsappNumber: '8801700000000',
  bkashNumber: '01712345678',
  nagadNumber: '01812345678',
  rocketNumber: '01912345678-5',
  paymentInstructionImage: '/logo.png',
  paymentInstructionText: '১. আমাদের বিকাশ/নগদ/ডাচ-বাংলা রকেট নাম্বারে Send Money করুন।\n২. নিচে আপনার প্রেরক মোবাইল নম্বর ও TrxID লিখুন।\n৩. বট স্বয়ংক্রিয়ভাবে ট্রানজেকশন যাচাই করে সাথে সাথে ওয়ালেটে ব্যালেন্স যুক্ত করে দিবে।',
  autoWebhookVerification: true,
  apkDownloadUrl: '',
  importantNoticeTitle: 'Important Notice',
  importantNoticeBody: DEFAULT_IMPORTANT_NOTICE,
  importantNoticeEnabled: true,
  banners: INITIAL_BANNERS,
  defaultRules: `⚠️ "FF RIVAL TOUR BD" BR Survival এর নিয়মাবলী এবং শর্তসমূহ:-

✅ ম্যাচের কাস্টমে ঢুকে একটি স্ক্রিনশট নিবেন, এবং আপনি মরে যাওয়ার পর একটি স্ক্রিনশট নিবেন রেজাল্টের, যেখানে আপনি কত নাম্বার হয়েছেন এবং সময় দেখায় ম্যাচটির হিস্ট্রিতে, এগুলো আমাদের এডমিন চাইলে দিতে হবে বাধ্যতামূলক! যদি না দিতে পারেন উইনিং প্রাইজ বাতিল পাবেন না!

🚫 কাস্টমের আইডি পাসওয়ার্ড পাওয়ার পরে গেমের ভিতরে গিয়ে সর্বপ্রথম আপনার গেমের ইনভাইট জয়েন এর নোটিফিকেশন রিজেক্ট/বন্ধ করে নিতে হবে, বাধ্যতামূলক, না করলে অ্যাপস থেকে পার্মানেন্ট ব্যান করা হবে!

🚫 অ্যাপসের মধ্যে ম্যাচ কেনার পর ম্যাচের মধ্যে ক্লিক করে একদম নিচের দিকে এসে আপনার নামের পাশে কত নাম্বার সেটা আপনাকে দেখে নিতে হবে, কাস্টমের পাসওয়ার্ড পাওয়ার পর কাস্টমে সোজা জয়েন করা যাবে না প্রথমে অবজারভে জয়েন করবে, অবজারভ থেকে তারপরে নিজের জায়গায় বসবে, সোজা জয়েন করলে তাকে কিক করে দেওয়া হবে, এক্সে ম্যাচ আপনার নামের পাশে যত নাম্বার লেখা থাকবে (২/৪/১০/৪৫/৪৮) কাস্টম রুমে ঢুকে আপনি সে স্থানে গিয়ে বসতে হবে, যদি আপনার জায়গায় অন্য কেউ বসে থাকে তাহলে আপনি অবজারভে গিয়ে বসবেন, যদি আপনি অবজারভে না গিয়ে অন্যের জায়গায় বসে থাকেন তাহলে আপনি কিক খাবেন (রিফান্ড পাবেন না) আর আপনি অবজারভে গিয়ে বসার পর আপনার জায়গায় যে রয়েছে তাকে ম্যাচ শুরু করার আগে কিক আউট করে দেওয়া হবে, তখন সঙ্গে সঙ্গে আপনি আপনার জায়গায় বসে পড়বেন। অথবা আপনি অবজারভে থাকবেন নিয়ম অনুযায়ী এরপরে ম্যাচ শুরু করার আগে আপনাকে যে কোন জায়গায় আমাদের হোস্ট নামিয়ে দিবে তবে আপনি অ্যালার্ট থাকবেন আপনার জায়গায় ফাঁকা হলে সেখানে আপনি নেমে পড়বেন ভুলে অন্য জায়গায় নামবেন না অন্যের জায়গায় বসলে কিক খাবেন এবং এর পরে ম্যাচটি শুরু করা হবে এবং তখন নিয়ম অনুযায়ী আপনি আপনার উইনিং প্রাইজ পাবেন।

🚫 স্থান থেকে অবজারভে না গিয়ে অন্য জায়গায় গিয়ে বসে থাকলে আপনাকে কিক আউট করা হবে এবং সে ম্যাচের রিফান্ড পাবেন না। এক্ষেত্রে কেউ যদি জায়গায় বসার জন্য ৫ দুই ম্যাচ কাস্টম থেকে কিক খায় তাহলে তাকে পার্মানেন্টলি আমাদের এপ্স থেকে ব্যান করা হবে, তার একাউন্টে টাকা থাকলে সেটা তাকে উইথড্র করে দেওয়া হবে তবে সে পার্মানেন্ট ব্যান হবে, আর একবার FF RIVAL TOUR BD apps এ ব্যান হলে সে আর কখনো FF RIVAL TOUR BD apps এ খেলতে পারবে না!

🚫 ম্যাচ শুরু হওয়ার সময়ের দুই থেকে চার মিনিট আগে কাস্টমের আইডি পাসওয়ার্ড পাবেন রুম ডিটেলস বাটনে হওয়ার পর আরো দুই মিনিট অপেক্ষা করা হবে প্লেয়ারদের জন্য, দুই মিনিট হয়ে যাওয়ার সঙ্গে সঙ্গে কাস্টমের আইডি পাসওয়ার্ড পরিবর্তন করে দেওয়া হবে, এরপরে আরো পাঁচ মিনিট সময় নিয়ে কাস্টমের হোস্টিং প্লেয়ারদের পর্যবেক্ষণ করবে এরপরে ম্যাচটি স্টার্ট করবে!

🚫 কোন কারণ ছাড়া রুম থেকে কিক করা হয়না এবং কোনদিন হবেও না, তবে আপনি যদি দাবি করেন কোন কারণ ছাড়া আপনাকে কিক আউট করা হয়েছে সে ক্ষেত্রে আপনাকে সেটা প্রমাণ দিতে হবে ভিডিওর মাধ্যমে Recording ছাড়া টাকা রিফান্ড পাবেন না। কিক মারার পরে ভিডিও করলে চলবে না। অ্যাপ থেকে কাস্টম আইডি পাসওয়ার্ড নেওয়া থেকেই ভিডিও চালু রাখতে হবে।

🚫 Survival match এর কাস্টমে precise aim No থাকবে⛔ মানে auto aim off ⛔ Full Control ✅
🚫 Survival match এর কাস্টমে Headshot ON থাকবে⛔ ONLY Headshot Mode
🚫 BR SURVIVAL MATCH খেলতে আইডির লেভেল ৪০+ থাকতে হবে!

✅ ম্যাচের মধ্যে সমস্ত গাড়ি সমস্ত গান ব্যবহার করতে পারবেন Survival match এ
✅ Character skill on
✅ load out on
✅ hp 500
✅ all gun allow
✅ all car allow
✅ kill allow
⚠️ zone damage high 🔥

survival match এ বেশিরভাগ ম্যাচে সবাই একসাথে মরে যাওয়ায় রেজাল্ট পাওয়া যায় না মাঝে মাঝে, তাই ম্যাচ শেষ হওয়ার ৩০ মিনিটের মধ্যে উইনিং প্রাইজ না পেলে আমাদের হোয়াটসঅ্যাপ চ্যানেলে দেওয়া ফেসবুক পেইজে সময় সহকারে হিস্ট্রি থেকে স্ক্রিনশট পাঠাবেন ⚠️

👀 ম্যাচের উইনিং প্রাইজ ম্যাচ শেষ হওয়ার ৩০ মিনিটের মধ্যে পাবেন, না পেলে ম্যাচ হিস্ট্রির সময় সহকারে দেখা যায় এরকম screenshot, আমাদের হোয়াটসঅ্যাপ চ্যানেলে দেওয়া ফেসবুক পেইজে পাঠাতে হবে ১০ ঘণ্টার মধ্যে, মেসেজ করে রাখলে হবে আপনি উইনিং না পেলে আপনাকে উইনিং দিয়ে দেওয়া হবে যেকোনো সময় আপনার মেসেজ দেখার পরেই ✅

✔️ যেকোন সমস্যা বা সহযোগিতার ক্ষেত্রে আমাদের SUPPORT এ যোগাযোগ করতে হবে।
FF RIVAL TOUR BD এর সিদ্ধান্ত চূড়ান্ত সিদ্ধান্ত 👌`,
  categoryRules: {
    'classic-match': `⚔️ Classic Match (BR Battle Royale) নিয়মাবলী:
1. ম্যাপ: Bermuda / Purgatory / Kalahari (ম্যাচ শিডিউল অনুযায়ী)।
2. টিমমেট কিলিং বা গ্রিফিং করলে কোনো রিফান্ড নেই।
3. সঠিক স্লটে না বসলে কাস্টম হোস্ট কিক করে দিবে।
4. কাস্টম রুমে ঢুকে স্ক্রিনশট এবং ম্যাচ শেষে রেজাল্টের স্ক্রিনশট রাখা বাধ্যতামূলক।
5. প্রতি কিল ও বুইয়াহ প্রাইজ স্বয়ংক্রিয়ভাবে ওয়ালেটে যুক্ত হবে।`,
    'regular-match': `⚔️ Classic Battle Royale (BR) নিয়মাবলী:
1. ম্যাপ: Bermuda / Purgatory / Kalahari (ম্যাচ শিডিউল অনুযায়ী)।
2. টিমমেট কিলিং বা গ্রিফিং করলে কোনো রিফান্ড নেই।
3. সঠিক স্লটে না বসলে কাস্টম হোস্ট কিক করে দিবে।
4. প্রতি কিল ও বুইয়াহ প্রাইজ স্বয়ংক্রিয়ভাবে ওয়ালেটে যুক্ত হবে।`,
    'clash-squad': `🔥 Clash Squad (CS 4v4) বিশেষ নিয়মাবলী:
1. লিমিটেড এমো (Limited Ammo): Yes / No (ম্যাচ ডিটেইলস অনুযায়ী)।
2. গ্রেনেড ও স্মোক নিষিদ্ধ (No Grenade & Flashbang)।
3. ক্যারেক্টার স্কিল (Character Skill): No / Yes।
4. গান প্রোপার্টি (Gun Attributes): No।
5. এমুলেটর প্লেয়ার সম্পূর্ণ নিষিদ্ধ (Mobile Only)।
6. রুম শুরুর ৫ মিনিট পূর্বে আইডি ও পাসওয়ার্ড প্রদান করা হবে।`,
    'cs-only-headshot': `🎯 CS Only Headshot বিশেষ নিয়মাবলী:
1. শুধুমাত্র হেডশট শট গণনা করা হবে (Only Headshot Mode)।
2. বডি শটে নক বা কিল করলে অযোগ্য ঘোষিত হবেন।
3. এমুলেটর, স্ক্রিপ্ট বা কনফিগ ব্যবহার সম্পূর্ণ নিষিদ্ধ।
4. লেভেল সর্বনিম্ন ৪০+ হতে হবে।`,
    'lone-wolf': LONE_WOLF_1V1_RULES,
    'lone-wolf-solo': LONE_WOLF_1V1_RULES,
    'lone-wolf-duo': LONE_WOLF_2V2_RULES,
    'lost-to-win': `💰 Lost To Win (1 vs 1) বিশেষ নিয়মাবলী:
1. ১v১ চ্যালেঞ্জ লড়াই। হারলেও অথবা জিতলেও ক্যাশ রিটার্ন অফার প্রযোজ্য।
2. কাস্টম রুমে নিজের স্লটে উপস্থিত থাকতে হবে।
3. ফেক আইডি বা এমুলেটর নিষিদ্ধ।`,
    'special-match': `⭐ Special Match & Headshot Only নিয়মাবলী:
1. শুধুমাত্র হেডশট শট গণনা করা হবে (Only Headshot Mode)।
2. হ্যাক, স্ক্রিপ্ট বা কনফিগ ব্যবহার করলে অ্যাকাউন্ট আজীবনের জন্য ব্যান।
3. ম্যাচ শেষে উইনিং রেজাল্টের ফুল স্ক্রিনশট নেওয়া বাধ্যতামূলক।
4. লেভেল সর্বনিম্ন ৫০+ হতে হবে।`,
  },
  howToJoinGuide: `১. আপনার পছন্দের ক্যাটাগরি বেছে নিন এবং সক্রিয় টুর্নামেন্টে ক্লিক করুন।
২. খালি স্লট থেকে আপনার পছন্দের স্লট সিলেক্ট করে 'স্লট বুক করুন' বাটনে ক্লিক করুন।
৩. ম্যাচ শুরুর ১৫ মিনিট আগে এই পেজে রুম আইডি ও পাসওয়ার্ড চলে আসবে।
৪. ফ্রি ফায়ার গেমে গিয়ে Custom Room-এ আইডি ও পাসওয়ার্ড দিয়ে আপনার নির্দিষ্ট স্লটে জয়েন করুন।`,
};

// Initial matches are strictly EMPTY as requested by user ("ei gula te jni kno kisy nh thke mne match a jni nh thke kno rokom er")
export const INITIAL_CMS_DATA: CMSData = {
  categories: INITIAL_CATEGORIES,
  matches: [], // EMPTY by default!
  settings: INITIAL_SETTINGS,
  topPlayers: INITIAL_TOP_PLAYERS,
};

export function getEffectiveCategoryRule(
  categorySlug: string,
  categories?: Record<string, CategoryItem>,
  settings?: SiteSettings
): string {
  const cat = categories?.[categorySlug];
  if (cat?.customRules && cat.customRules.trim() !== '') {
    return cat.customRules;
  }
  if (settings?.categoryRules?.[categorySlug] && settings.categoryRules[categorySlug].trim() !== '') {
    return settings.categoryRules[categorySlug];
  }
  if (categorySlug === 'classic-match' && settings?.categoryRules?.['regular-match']) {
    return settings.categoryRules['regular-match'];
  }
  if (categorySlug === 'regular-match' && settings?.categoryRules?.['classic-match']) {
    return settings.categoryRules['classic-match'];
  }
  return '';
}

export function getEffectiveMatchRules(
  match: MatchItem,
  categories?: Record<string, CategoryItem>,
  settings?: SiteSettings
): string {
  const isLoneWolf =
    (match.categorySlug || '').toLowerCase().includes('lone') ||
    (match.title || '').toLowerCase().includes('lone');

  if (isLoneWolf) {
    const typeStr = (match.type || (match as any).matchType || '').toLowerCase();
    const isDuo =
      typeStr.includes('duo') ||
      typeStr.includes('2v2') ||
      typeStr.includes('2 vs 2') ||
      match.totalSlots === 4;

    if (isDuo) {
      if (settings?.categoryRules?.['lone-wolf-duo'] && settings.categoryRules['lone-wolf-duo'].trim() !== '') {
        return settings.categoryRules['lone-wolf-duo'];
      }
      return LONE_WOLF_2V2_RULES;
    } else {
      if (settings?.categoryRules?.['lone-wolf-solo'] && settings.categoryRules['lone-wolf-solo'].trim() !== '') {
        return settings.categoryRules['lone-wolf-solo'];
      }
      if (settings?.categoryRules?.['lone-wolf'] && settings.categoryRules['lone-wolf'].trim() !== '') {
        return settings.categoryRules['lone-wolf'];
      }
      const cat = categories?.['lone-wolf'];
      if (cat?.customRules && cat.customRules.trim() !== '') {
        return cat.customRules;
      }
      return LONE_WOLF_1V1_RULES;
    }
  }

  const catRule = getEffectiveCategoryRule(match.categorySlug, categories, settings);
  if (catRule) return catRule;
  if (match.rules && match.rules.trim() !== '') return match.rules;
  return settings?.defaultRules || '';
}

let memoryCMSCache: CMSData | null = null;

export function getCMSData(): CMSData {
  if (typeof window === 'undefined') return INITIAL_CMS_DATA;
  if (memoryCMSCache) return memoryCMSCache;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CMS_DATA));
      memoryCMSCache = INITIAL_CMS_DATA;
      return INITIAL_CMS_DATA;
    }
    const parsed = JSON.parse(raw) || {};
    let matches: MatchItem[] = Array.isArray(parsed?.matches)
      ? parsed.matches.filter((m: any) => m && typeof m === 'object')
      : [];

    // One-time zero-matches cleanup across all categories as requested by user
    if (!localStorage.getItem(ZERO_RESET_KEY)) {
      matches = [];
      localStorage.setItem(ZERO_RESET_KEY, '1');
      if (parsed) {
        parsed.matches = [];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, matches: [] }));
        } catch (e) {}
      }
    }

    const merged: CMSData = normalizeCMSData({
      categories: parsed?.categories ? parsed.categories : INITIAL_CATEGORIES,
      matches,
      settings: { ...INITIAL_SETTINGS, ...(parsed?.settings || {}) },
      topPlayers: Array.isArray(parsed?.topPlayers) ? parsed.topPlayers : INITIAL_TOP_PLAYERS,
      deletedCategories: Array.isArray(parsed?.deletedCategories) ? parsed.deletedCategories : [],
    });
    memoryCMSCache = merged;
    return merged;
  } catch (e) {
    return INITIAL_CMS_DATA;
  }
}

/** Ensure every CMS field has a safe shape (arrays are arrays, objects are objects). */
export function normalizeCMSData(input: Partial<CMSData> | null | undefined): CMSData {
  const src: any = input && typeof input === 'object' ? input : {};
  const deletedCategories: string[] = Array.isArray(src.deletedCategories)
    ? src.deletedCategories
    : [];
  if (!deletedCategories.includes('br-survival')) {
    deletedCategories.push('br-survival');
  }

  const rawCategories =
    src.categories && typeof src.categories === 'object' && !Array.isArray(src.categories)
      ? src.categories
      : INITIAL_CATEGORIES;

  // Auto-heal any legacy broken paths or /uploads/ 404 paths
  const healedCategories: Record<string, CategoryItem> = {};
  for (const [slug, cat] of Object.entries(rawCategories)) {
    if (slug === 'br-survival' || deletedCategories.includes(slug)) continue;
    if (cat && typeof cat === 'object') {
      const item = cat as CategoryItem;
      const initialCat = INITIAL_CATEGORIES[slug];
      const initialBanner = initialCat?.bannerImage;
      const initialAvatar = initialCat?.avatarImage || initialBanner;

      let bannerImage = item.bannerImage;
      if (!bannerImage || bannerImage.includes('unsplash.com') || bannerImage === '/logo.png') {
        bannerImage = initialBanner || bannerImage;
      }
      let avatarImage = item.avatarImage;
      if (!avatarImage || avatarImage.includes('unsplash.com') || avatarImage === '/logo.png') {
        avatarImage = initialAvatar || bannerImage;
      }

      healedCategories[slug] = {
        ...(initialCat || {}),
        ...item,
        bannerImage,
        avatarImage,
        updatedAt: item.updatedAt || initialCat?.updatedAt || 0,
      };
    }
  }

  // Ensure all 6 initial categories are always present
  for (const [slug, initCat] of Object.entries(INITIAL_CATEGORIES)) {
    if (!healedCategories[slug] && !deletedCategories.includes(slug)) {
      healedCategories[slug] = initCat as CategoryItem;
    }
  }
  delete healedCategories['br-survival'];

  const cleanMatches: MatchItem[] = Array.isArray(src.matches)
    ? src.matches
        .filter((m: any) => m && typeof m === 'object' && m.categorySlug !== 'br-survival')
        .map((m: any) => {
          const isLoneWolf = m.categorySlug === 'lone-wolf';
          const isClashSquad = m.categorySlug === 'clash-squad' || m.categorySlug === 'cs-only-headshot';
          const cat = healedCategories[m.categorySlug];
          const bannerImage =
            m.bannerImage && m.bannerImage.trim() !== '' && m.bannerImage !== '/logo.png'
              ? m.bannerImage
              : cat?.bannerImage || cat?.avatarImage || '/logo.png';

          if (isLoneWolf) {
            return {
              ...m,
              bannerImage,
              perKill: 0,
              secondPrize: 0,
              thirdPrize: 0,
              firstPrize: m.firstPrize || m.prizePool,
              totalSlots: (m.type === '2 vs 2' || m.type === '2v2' || m.type?.toLowerCase() === 'duo' || m.type?.includes('2 vs 2')) ? 4 : 2,
            };
          }
          if (isClashSquad) {
            return {
              ...m,
              bannerImage,
              perKill: 0,
              secondPrize: 0,
              thirdPrize: 0,
              firstPrize: m.firstPrize || m.prizePool,
              totalSlots: m.type === '1 vs 1' ? 2 : (m.type?.includes('2') || m.type?.toLowerCase().includes('duo')) ? 4 : 8,
            };
          }
          return {
            ...m,
            bannerImage,
          };
        })
    : [];

  const rawBanners = Array.isArray(src.settings?.banners) && src.settings.banners.length > 0
    ? src.settings.banners
    : INITIAL_BANNERS;
  const healedBanners = rawBanners.map((b: any, idx: number) => {
    let img = b?.image;
    if (!img || img.includes('unsplash.com') || img === '/logo.png') {
      img = INITIAL_BANNERS[idx]?.image || INITIAL_BANNERS[0]?.image || img;
    }
    return {
      ...(INITIAL_BANNERS[idx] || {}),
      ...b,
      image: img,
    };
  });

  return {
    categories: healedCategories,
    matches: cleanMatches,
    settings: {
      ...INITIAL_SETTINGS,
      ...(src.settings && typeof src.settings === 'object' ? src.settings : {}),
      banners: healedBanners,
      importantNoticeTitle: src.settings?.importantNoticeTitle || INITIAL_SETTINGS.importantNoticeTitle,
      importantNoticeBody: src.settings?.importantNoticeBody ?? INITIAL_SETTINGS.importantNoticeBody,
      importantNoticeEnabled: src.settings?.importantNoticeEnabled ?? INITIAL_SETTINGS.importantNoticeEnabled,
    },
    topPlayers: Array.isArray(src.topPlayers)
      ? src.topPlayers.filter((p: any) => p && typeof p === 'object')
      : INITIAL_TOP_PLAYERS,
    deletedCategories,
    matchesClearedAt: typeof src.matchesClearedAt === 'number' ? src.matchesClearedAt : undefined,
    matchesUpdatedAt: typeof src.matchesUpdatedAt === 'number' ? src.matchesUpdatedAt : undefined,
  };
}

// 1ms Real-Time CMS Sync Bus for Owner Actions & Autonomous Bots
let cmsSyncChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    cmsSyncChannel = new BroadcastChannel('ff_cms_sync_channel');
    cmsSyncChannel.onmessage = (event) => {
      if (event?.data?.type === 'CMS_UPDATED' && event.data.data) {
        const next = normalizeCMSData(event.data.data);
        memoryCMSCache = next;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch (e) {}
        window.dispatchEvent(new CustomEvent('ff_cms_updated', { detail: next }));
      }
    };
  } catch (e) {}
}

export function prepareCMSPayload(data: CMSData) {
  // Strip huge default base64 images from categories to keep payload tiny (<10KB)
  const lightCategories: Record<string, any> = {};
  for (const [slug, cat] of Object.entries(data.categories || {})) {
    const isHeavyBanner = cat.bannerImage && cat.bannerImage.startsWith('data:') && cat.bannerImage.length > 50000;
    const isHeavyAvatar = cat.avatarImage && cat.avatarImage.startsWith('data:') && cat.avatarImage.length > 50000;
    lightCategories[slug] = {
      ...cat,
      bannerImage: isHeavyBanner ? '/categories/' + slug + '.png' : cat.bannerImage,
      avatarImage: isHeavyAvatar ? '/categories/' + slug + '.png' : cat.avatarImage,
    };
  }

  const lightBanners = (data.settings?.banners || []).map((b) => {
    if (b.image && b.image.startsWith('data:') && b.image.length > 50000) {
      return { ...b, image: '/banners/default.png' };
    }
    return b;
  });

  return {
    ...data,
    categories: lightCategories,
    settings: {
      ...data.settings,
      banners: lightBanners,
    },
  };
}

export function saveCMSData(input: CMSData): void {
  if (typeof window === 'undefined') return;
  const data = normalizeCMSData(input);
  memoryCMSCache = data;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // Ignore storage quota errors
  }
  try {
    window.dispatchEvent(new CustomEvent('ff_cms_updated', { detail: data }));
    cmsSyncChannel?.postMessage({ type: 'CMS_UPDATED', data });
  } catch (e) {}

  // Server sync so all phones, emulators and browsers stay updated
  try {
    const payload = prepareCMSPayload(data);
    fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch (e) {}
}

export async function saveCMSDataAsync(input: CMSData): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const data = normalizeCMSData(input);
  memoryCMSCache = data;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {}
  try {
    window.dispatchEvent(new CustomEvent('ff_cms_updated', { detail: data }));
  } catch (e) {}

  try {
    const payload = prepareCMSPayload(data);
    const res = await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export function addMatch(match: Omit<MatchItem, 'id' | 'filledSlots'>): MatchItem {
  const data = getCMSData();
  const isLoneWolf = match.categorySlug === 'lone-wolf';
  const isClashSquad = match.categorySlug === 'clash-squad' || match.categorySlug === 'cs-only-headshot';

  let totalSlots = match.totalSlots;
  let perKill = match.perKill;
  let firstPrize = match.firstPrize || match.prizePool;
  let secondPrize = match.secondPrize || 0;
  let thirdPrize = match.thirdPrize || 0;

  if (isLoneWolf) {
    perKill = 0;
    secondPrize = 0;
    thirdPrize = 0;
    firstPrize = match.prizePool;
    totalSlots = (match.type === '2 vs 2' || match.type === '2v2' || match.type.toLowerCase() === 'duo' || match.type.includes('2 vs 2')) ? 4 : 2;
  } else if (isClashSquad) {
    perKill = 0;
    secondPrize = 0;
    thirdPrize = 0;
    firstPrize = match.prizePool;
    totalSlots = match.type === '1 vs 1' ? 2 : (match.type.includes('2') || match.type.toLowerCase().includes('duo')) ? 4 : 8;
  }

  const cat = data.categories[match.categorySlug];
  const catRule = getEffectiveMatchRules(
    { ...match, totalSlots } as MatchItem,
    data.categories,
    data.settings
  );
  const finalBanner =
    match.bannerImage && match.bannerImage.trim() !== '' && match.bannerImage !== '/logo.png'
      ? match.bannerImage
      : cat?.bannerImage || cat?.avatarImage || '/logo.png';

  const now = Date.now();
  const newMatch: MatchItem = {
    ...match,
    rules: match.rules && match.rules.trim() !== '' ? match.rules : catRule,
    bannerImage: finalBanner,
    totalSlots,
    perKill,
    firstPrize,
    secondPrize,
    thirdPrize,
    id: 'm-' + now + '-' + Math.floor(Math.random() * 1000),
    filledSlots: 0,
    status: match.status || 'UPCOMING',
    createdAt: now,
    updatedAt: now,
  };
  data.matchesUpdatedAt = now;
  data.matches.unshift(newMatch);
  saveCMSData(data);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ff_match_added', { detail: newMatch }));
  }
  return newMatch;
}

export function updateMatch(matchId: string, updated: Partial<MatchItem>): void {
  const data = getCMSData();
  const index = data.matches.findIndex((m) => m.id === matchId);
  if (index !== -1) {
    const existing = data.matches[index];
    let roomDeliveredAt = updated.roomDeliveredAt || existing.roomDeliveredAt;
    if ((updated.roomId || updated.roomPass) && !roomDeliveredAt) {
      roomDeliveredAt = new Date().toISOString();
    }
    const now = Date.now();
    data.matches[index] = { ...existing, ...updated, ...(roomDeliveredAt ? { roomDeliveredAt } : {}), updatedAt: now };
    data.matchesUpdatedAt = now;
    saveCMSData(data);
  }
}

export function deleteMatch(matchId: string): void {
  const data = getCMSData();
  data.matches = data.matches.filter((m) => m.id !== matchId);
  data.matchesUpdatedAt = Date.now();
  saveCMSData(data);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ff_match_deleted', { detail: { matchId } }));
  }
}

export function clearAllMatches(): void {
  const data = getCMSData();
  const now = Date.now();
  data.matches = [];
  data.matchesClearedAt = now;
  data.matchesUpdatedAt = now;
  saveCMSData(data);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ff_matches_cleared'));
  }
}

export async function updateCategory(slug: string, updated: Partial<CategoryItem>): Promise<boolean> {
  const data = getCMSData();
  const existing = data.categories[slug] || INITIAL_CATEGORIES[slug] || {
    slug,
    id: Date.now(),
    name: slug,
    section: 'FREE FIRE MATCHES',
    bannerImage: '',
    avatarImage: '',
    description: '',
  };

  const bannerImg = updated.bannerImage !== undefined ? updated.bannerImage : existing.bannerImage;
  const avatarImg = updated.avatarImage !== undefined ? updated.avatarImage : existing.avatarImage;

  // Auto-fill pair if one is set
  const finalBanner = bannerImg || avatarImg || existing.bannerImage || '';
  const finalAvatar = avatarImg || bannerImg || existing.avatarImage || '';

  const updatedCategory: CategoryItem = {
    ...existing,
    ...updated,
    bannerImage: finalBanner,
    avatarImage: finalAvatar,
    updatedAt: Date.now(),
  };

  data.categories[slug] = updatedCategory;

  // Auto-propagate category rules to settings and all matches belonging to this category:
  if (updated.customRules !== undefined) {
    if (!data.settings.categoryRules) {
      data.settings.categoryRules = {};
    }
    data.settings.categoryRules[slug] = updated.customRules;
    data.settings.updatedAt = Date.now();

    // Propagate rule to all existing matches in this category!
    data.matches = data.matches.map((m) => {
      if (m.categorySlug === slug) {
        return { ...m, rules: updated.customRules };
      }
      return m;
    });
  }

  saveCMSData(data);
  return true;
}

export async function deleteCategory(slug: string): Promise<boolean> {
  const data = getCMSData();
  if (!data.deletedCategories) {
    data.deletedCategories = [];
  }
  if (!data.deletedCategories.includes(slug)) {
    data.deletedCategories.push(slug);
  }
  delete data.categories[slug];
  saveCMSData(data);
  return true;
}

export function updateSiteSettings(settings: Partial<SiteSettings>): Promise<boolean> {
  const data = getCMSData();
  data.settings = {
    ...INITIAL_SETTINGS,
    ...(data.settings || {}),
    ...settings,
    updatedAt: Date.now() + 5000,
  };
  saveCMSData(data);
  return Promise.resolve(true);
}

export function updateTopPlayers(players: TopPlayerItem[]): void {
  const data = getCMSData();
  data.topPlayers = players;
  saveCMSData(data);
}

export function resetCMS(): void {
  saveCMSData(INITIAL_CMS_DATA);
}

let globalSyncInitialized = false;
let isSyncInProgress = false;

export function syncCMSWithServer(): void {
  if (typeof window === 'undefined' || isSyncInProgress) return;
  isSyncInProgress = true;

  fetch(`/api/cms?t=${Date.now()}`, { cache: 'no-store' })
    .then((res) => (res.ok ? res.json() : null))
    .then((serverData) => {
      isSyncInProgress = false;
      if (serverData && typeof serverData === 'object' && !serverData.error) {
        const current = getCMSData();
        const serverMatches = Array.isArray(serverData.matches) ? serverData.matches : null;
        const serverCategories =
          serverData.categories && typeof serverData.categories === 'object' && !Array.isArray(serverData.categories)
            ? serverData.categories
            : {};
        const serverSettings =
          serverData.settings && typeof serverData.settings === 'object' ? serverData.settings : {};

        const serverDeleted: string[] = Array.isArray(serverData.deletedCategories)
          ? serverData.deletedCategories
          : [];
        const localDeleted: string[] = Array.isArray(current?.deletedCategories)
          ? current.deletedCategories
          : [];
        const allDeleted = Array.from(new Set([...localDeleted, ...serverDeleted]));

        // Smart merge categories:
        const mergedCategories: Record<string, CategoryItem> = { ...(current?.categories || {}) };
        for (const [slug, serverCat] of Object.entries(serverCategories)) {
          if (allDeleted.includes(slug)) {
            delete mergedCategories[slug];
            continue;
          }
          const localCat = mergedCategories[slug];
          const initialCat = INITIAL_CATEGORIES[slug];
          const rawServerCat = { ...(serverCat as any) };
          if (!rawServerCat.bannerImage || rawServerCat.bannerImage.includes('unsplash.com') || rawServerCat.bannerImage === '/logo.png') {
            rawServerCat.bannerImage = initialCat?.bannerImage || localCat?.bannerImage || rawServerCat.bannerImage;
          }
          if (!rawServerCat.avatarImage || rawServerCat.avatarImage.includes('unsplash.com') || rawServerCat.avatarImage === '/logo.png') {
            rawServerCat.avatarImage = initialCat?.avatarImage || localCat?.avatarImage || rawServerCat.bannerImage;
          }

          if (!localCat) {
            mergedCategories[slug] = rawServerCat as CategoryItem;
          } else {
            const localTime = (localCat as any)?.updatedAt || 0;
            const serverTime = (rawServerCat as any)?.updatedAt || 0;
            if (localTime > serverTime) {
              mergedCategories[slug] = { ...(rawServerCat as CategoryItem), ...localCat };
            } else {
              mergedCategories[slug] = { ...localCat, ...(rawServerCat as CategoryItem) };
            }
          }
        }

        // Ensure all 6 initial categories are always present
        for (const [slug, initCat] of Object.entries(INITIAL_CATEGORIES)) {
          if (!mergedCategories[slug] && !allDeleted.includes(slug)) {
            mergedCategories[slug] = initCat as CategoryItem;
          }
        }

        for (const del of allDeleted) {
          delete mergedCategories[del];
        }

        // Smart merge settings:
        const localSettings = current?.settings || ({} as any);
        const localSettingsTime = (localSettings as any)?.updatedAt || 0;
        const serverSettingsTime = (serverSettings as any)?.updatedAt || 0;

        let mergedSettings: SiteSettings;
        if (localSettingsTime > serverSettingsTime) {
          mergedSettings = {
            ...INITIAL_SETTINGS,
            ...serverSettings,
            ...localSettings,
          } as SiteSettings;
        } else {
          mergedSettings = {
            ...INITIAL_SETTINGS,
            ...localSettings,
            ...serverSettings,
          } as SiteSettings;
        }

        // Safeguard payment numbers:
        if (localSettings?.bkashNumber && localSettings.bkashNumber.trim() !== '' && localSettings.bkashNumber !== '01712345678') {
          if (!serverSettings?.bkashNumber || serverSettings.bkashNumber === '01712345678' || localSettingsTime >= serverSettingsTime) {
            mergedSettings.bkashNumber = localSettings.bkashNumber;
          }
        }
        if (localSettings?.nagadNumber && localSettings.nagadNumber.trim() !== '' && localSettings.nagadNumber !== '01812345678') {
          if (!serverSettings?.nagadNumber || serverSettings.nagadNumber === '01812345678' || localSettingsTime >= serverSettingsTime) {
            mergedSettings.nagadNumber = localSettings.nagadNumber;
          }
        }

        if (Array.isArray(serverSettings.banners) && serverSettings.banners.length > 0) {
          const cleanServerBanners = serverSettings.banners.map((b: any, idx: number) => {
            if (!b.image || b.image.includes('unsplash.com') || b.image === '/logo.png') {
              return { ...b, image: INITIAL_BANNERS[idx]?.image || INITIAL_BANNERS[0]?.image };
            }
            return b;
          });
          if (serverSettingsTime >= localSettingsTime) {
            mergedSettings.banners = cleanServerBanners;
          }
        } else if (Array.isArray(localSettings.banners) && localSettings.banners.length > 0) {
          mergedSettings.banners = localSettings.banners;
        } else {
          mergedSettings.banners = INITIAL_BANNERS;
        }

        // Smart merge matches with Clear All Matches protection:
        const serverClearedAt = typeof serverData?.matchesClearedAt === 'number' ? serverData.matchesClearedAt : 0;
        const localClearedAt = typeof current?.matchesClearedAt === 'number' ? current.matchesClearedAt : 0;
        const effectiveClearedAt = Math.max(serverClearedAt, localClearedAt);

        const getMatchTime = (m: any): number => {
          if (typeof m?.createdAt === 'number') return m.createdAt;
          if (typeof m?.updatedAt === 'number') return m.updatedAt;
          const matchIdMatch = String(m?.id || '').match(/^m-(\d+)/);
          if (matchIdMatch) {
            const t = parseInt(matchIdMatch[1], 10);
            if (!isNaN(t)) return t;
          }
          return 0;
        };

        let mergedMatches: MatchItem[] = [];
        if (Array.isArray(serverMatches)) {
          const validServerMatches = serverMatches.filter((m: MatchItem) => getMatchTime(m) > effectiveClearedAt);
          const serverIdSet = new Set(validServerMatches.map((m: MatchItem) => m.id));
          const now = Date.now();
          const localPending = (current?.matches || []).filter(
            (m: MatchItem) => !serverIdSet.has(m.id) && getMatchTime(m) > effectiveClearedAt
          );
          mergedMatches = [...localPending, ...validServerMatches];
        } else {
          mergedMatches = (current?.matches || []).filter((m: MatchItem) => getMatchTime(m) > effectiveClearedAt);
        }

        mergedMatches = mergedMatches.map((m) => {
          const catRule = getEffectiveCategoryRule(m.categorySlug, mergedCategories, mergedSettings);
          if (catRule && (!m.rules || m.rules.trim() === '')) {
            return { ...m, rules: catRule };
          }
          return m;
        });

        const merged: CMSData = normalizeCMSData({
          categories: mergedCategories,
          matches: mergedMatches,
          settings: mergedSettings,
          topPlayers:
            Array.isArray(serverData.topPlayers) && serverData.topPlayers.length > 0
              ? serverData.topPlayers
              : current?.topPlayers,
          deletedCategories: allDeleted,
          matchesClearedAt: effectiveClearedAt > 0 ? effectiveClearedAt : undefined,
          matchesUpdatedAt: Math.max(serverData.matchesUpdatedAt || 0, current.matchesUpdatedAt || 0),
        });

        const newSerialized = JSON.stringify(merged);
        memoryCMSCache = merged;
        try {
          localStorage.setItem(STORAGE_KEY, newSerialized);
        } catch (e) {}
        window.dispatchEvent(new CustomEvent('ff_cms_updated', { detail: merged }));
      }
    })
    .catch(() => {
      isSyncInProgress = false;
    });
}

const DEFAULT_PLAYER_AVATAR = 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=120';

export function getLiveTopPlayers(cmsData?: CMSData): TopPlayerItem[] {
  const currentCMS = cmsData || getCMSData();
  const rawList: TopPlayerItem[] = Array.isArray(currentCMS?.topPlayers)
    ? currentCMS.topPlayers
        .filter((p) => p && !p.id?.startsWith('tp-') && (Number(p.kills || 0) > 0 || Number(p.matchesPlayed || 0) > 0 || Number(p.earnings || 0) > 0))
        .map((p) => ({ ...p, uid: '' }))
    : [];

  if (typeof window !== 'undefined') {
    try {
      const storedUsers = localStorage.getItem('ff_esports_users_db_v1');
      if (storedUsers) {
        const users = JSON.parse(storedUsers);
        if (Array.isArray(users)) {
          users.forEach((u: any) => {
            if (!u || u.role === 'ADMIN') return;
            const ign = String(u.ign || u.username || '').trim();
            if (!ign) return;
            const kills = Number(u.totalKills || 0);
            const earnings = Number(u.totalEarnings || 0);
            const matches = Number(u.matchesPlayed || 0);
            const booyahs = Number(u.totalWins || 0);

            if (kills > 0 || earnings > 0 || matches > 0 || booyahs > 0) {
              const existingIdx = rawList.findIndex((p) => p.ign.toLowerCase() === ign.toLowerCase());
              const entry: TopPlayerItem = {
                id: u.id || `live-${Date.now()}`,
                rank: 0,
                ign: ign.toUpperCase(),
                uid: '', // Strict constraint: never expose UID
                avatar: u.avatar || DEFAULT_PLAYER_AVATAR,
                kills,
                earnings,
                matchesPlayed: matches,
                booyahs,
                winRate: matches > 0 ? `${Math.round((booyahs / matches) * 100)}%` : '0%',
              };
              if (existingIdx !== -1) {
                rawList[existingIdx] = { ...rawList[existingIdx], ...entry };
              } else {
                rawList.push(entry);
              }
            }
          });
        }
      }
    } catch (e) {}
  }

  // Filter out any entries without an IGN
  const validPlayers = rawList.filter((p) => p && p.ign && p.ign.trim().length > 0);

  // Sort by earnings descending, then kills descending
  validPlayers.sort((a, b) => (Number(b.earnings) || 0) - (Number(a.earnings) || 0) || (Number(b.kills) || 0) - (Number(a.kills) || 0));

  // Re-assign 1-based ranks and clear any UID
  return validPlayers.map((p, idx) => ({
    ...p,
    rank: idx + 1,
    uid: '',
  }));
}

function initGlobalCmsSync(): void {
  if (typeof window === 'undefined' || globalSyncInitialized) return;
  globalSyncInitialized = true;

  syncCMSWithServer();
  // 1.5-second rapid sync so Owner panel changes go live immediately to all devices
  setInterval(syncCMSWithServer, 1500);

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      syncCMSWithServer();
    }
  };
  window.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('focus', syncCMSWithServer);
  window.addEventListener('online', syncCMSWithServer);
  window.addEventListener('touchstart', () => { syncCMSWithServer(); }, { passive: true });
}

// React Hook for Reactive CMS Sync across pages
export function useCMS() {
  const [data, setData] = useState<CMSData>(() => memoryCMSCache || getCMSData());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    initGlobalCmsSync();
    setData(memoryCMSCache || getCMSData());
    setLoaded(true);
    syncCMSWithServer();

    const handleUpdate = (e: any) => {
      if (e?.detail && typeof e.detail === 'object') {
        const next = normalizeCMSData(e.detail);
        memoryCMSCache = next;
        setData(next);
      } else {
        memoryCMSCache = null;
        setData(getCMSData());
      }
    };

    window.addEventListener('ff_cms_updated', handleUpdate);
    window.addEventListener('ff_users_updated', () => {
      setData(getCMSData());
    });
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('ff_matches_cleared', () => {
      memoryCMSCache = null;
      setData(getCMSData());
    });

    return () => {
      window.removeEventListener('ff_cms_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const safe = useMemo(() => normalizeCMSData(data), [data]);

  return {
    data: safe,
    loaded,
    categories: safe.categories,
    matches: safe.matches,
    settings: safe.settings,
    topPlayers: getLiveTopPlayers(safe),
    addMatch,
    updateMatch,
    deleteMatch,
    clearAllMatches,
    updateCategory,
    deleteCategory,
    updateSiteSettings,
    updateTopPlayers,
    resetCMS,
  };
}
