'use client';

import { useEffect, useMemo, useState } from 'react';

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
  status?: 'UPCOMING' | 'ROOM_OPEN' | 'LIVE' | 'COMPLETED';
  /** Published after the match ends: who placed where, kills and prize won. */
  results?: Array<{ rank: number; ign: string; kills: number; prize: number }>;
  participants?: Array<{ ign: string; uid?: string; slot?: number; team?: number }>;
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
}

export interface CMSData {
  categories: Record<string, CategoryItem>;
  matches: MatchItem[];
  settings: SiteSettings;
  topPlayers: TopPlayerItem[];
}

const STORAGE_KEY = 'ff_esports_cms_data_v6';
const MIGRATION_KEY = 'ff_esports_cms_migration_v6';
const ZERO_RESET_KEY = 'ff_esports_matches_zero_reset_v6';

export const INITIAL_CATEGORIES: Record<string, CategoryItem> = {
  'special-match': {
    slug: 'special-match',
    id: 79,
    name: 'SPECIAL MATCH',
    section: 'FREE FIRE MATCHES',
    bannerImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=640',
    avatarImage: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=120',
    description: 'Exclusive anime crossover & special event rules custom matches.',
  },
  'classic-match': {
    slug: 'classic-match',
    id: 80,
    name: 'CLASSIC MATCH',
    section: 'FREE FIRE MATCHES',
    bannerImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=640',
    avatarImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=120',
    description: 'Standard 48-player Free Fire Battle Royale on Bermuda and Purgatory.',
  },
  'clash-squad': {
    slug: 'clash-squad',
    id: 81,
    name: 'CLASH SQUAD',
    section: 'FREE FIRE MATCHES',
    bannerImage: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?q=80&w=640',
    avatarImage: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=120',
    description: 'Competitive 4 vs 4 tactical round tournament.',
  },
  'lone-wolf': {
    slug: 'lone-wolf',
    id: 82,
    name: 'LONE WOLF',
    section: 'FREE FIRE MATCHES',
    bannerImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=640',
    avatarImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=120',
    description: '1 vs 1 Iron Cage duel battles.',
  },
  'lost-to-win': {
    slug: 'lost-to-win',
    id: 76,
    name: 'LOST TO WIN',
    section: 'FREE FIRE MATCH 1 VS 1',
    bannerImage: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=640',
    avatarImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=120',
    description: 'Special 1 vs 1 challenges where every match offers massive cash returns.',
  },
  'cs-only-headshot': {
    slug: 'cs-only-headshot',
    id: 87,
    name: 'CS ONLY HEADSHOT',
    section: 'ONLY HEADSHOT',
    bannerImage: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?q=80&w=640',
    avatarImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=120',
    description: 'Clash Squad with Headshot only enabled. Body damage is nullified.',
  },
  'br-survival': {
    slug: 'br-survival',
    id: 88,
    name: 'BR SURVIVAL',
    section: 'FREE FIRE MATCHES',
    bannerImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=640',
    avatarImage: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=120',
    description: 'Battle Royale Survival with HP 500, High Zone Damage & Full Control.',
  },
};

export const INITIAL_TOP_PLAYERS: TopPlayerItem[] = [
  {
    id: 'tp-1',
    rank: 1,
    ign: 'OP_NINJA_99',
    uid: '748291034',
    avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=120',
    kills: 184,
    earnings: 14500,
    matchesPlayed: 42,
    booyahs: 24,
    winRate: '57.1%',
  },
  {
    id: 'tp-2',
    rank: 2,
    ign: 'VAMPIRE_FF',
    uid: '839201948',
    avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=120',
    kills: 156,
    earnings: 11200,
    matchesPlayed: 38,
    booyahs: 18,
    winRate: '47.3%',
  },
  {
    id: 'tp-3',
    rank: 3,
    ign: 'BDX_STRIKER',
    uid: '192837465',
    avatar: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=120',
    kills: 142,
    earnings: 8600,
    matchesPlayed: 35,
    booyahs: 15,
    winRate: '42.8%',
  },
  {
    id: 'tp-4',
    rank: 4,
    ign: 'KING_HEADSHOT',
    uid: '610293847',
    avatar: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=120',
    kills: 118,
    earnings: 6400,
    matchesPlayed: 29,
    booyahs: 12,
    winRate: '41.3%',
  },
  {
    id: 'tp-5',
    rank: 5,
    ign: 'RIVAL_BOSS_BD',
    uid: '920182746',
    avatar: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=120',
    kills: 97,
    earnings: 4800,
    matchesPlayed: 24,
    booyahs: 9,
    winRate: '37.5%',
  },
  {
    id: 'tp-6',
    rank: 6,
    ign: 'CYBER_SNIPER',
    uid: '501928374',
    avatar: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=120',
    kills: 85,
    earnings: 3900,
    matchesPlayed: 20,
    booyahs: 8,
    winRate: '40.0%',
  },
];

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
  banners: [
    {
      id: 'slide-1',
      badge: 'CHAMPIONSHIP 2026',
      title: 'JOIN DAILY FREE FIRE TOURNAMENTS & WIN REAL BDT',
      subtitle: 'ব্যাটল রয়্যাল, ক্ল্যাশ স্কোয়াড ৪v৪, লোন উলফ এবং ১v১ হেডশট লড়াই। স্বয়ংক্রিয় স্লট বুকিং ও দ্রুত বিকাশ/নগদে প্রাইজ উইথড্র।',
      image: '/logo.png',
      actionText: 'Telegram Community',
      actionUrl: 'https://t.me/ffrivaltourbd',
    },
    {
      id: 'slide-2',
      badge: 'MEGA PRIZE POOL',
      title: 'SPECIAL BR SURVIVAL & CLASH SQUAD 4V4',
      subtitle: 'প্রতিটি বুইয়াহ এবং কিলে নিশ্চিত ক্যাশ রিওয়ার্ড। সরাসরি বিকাশ ও নগদে সুপার ফাস্ট পেমেন্ট উইথড্রল!',
      image: '/logo.png',
      actionText: 'Join Community',
      actionUrl: 'https://t.me/ffrivaltourbd',
    },
    {
      id: 'slide-3',
      badge: '100% SAFE & AUTOMATED',
      title: 'ADVANCED ANTI-CHEAT & INSTANT WITHDRAW',
      subtitle: 'সম্পূর্ণ ফেয়ার টুর্নামেন্ট সিকিউরিটি ও ২৪/৭ লাইভ কাস্টমার সাপোর্ট।',
      image: '/logo.png',
      actionText: 'Telegram Support',
      actionUrl: 'https://t.me/ffrivaltourbd',
    },
  ],
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
    'clash-squad': `🔥 Clash Squad (CS 4v4) বিশেষ নিয়মাবলী:
1. লিমিটেড এমো (Limited Ammo): Yes / No (ম্যাচ ডিটেইলস অনুযায়ী)।
2. গ্রেনেড ও স্মোক নিষিদ্ধ (No Grenade & Flashbang)।
3. ক্যারেক্টার স্কিল (Character Skill): No / Yes।
4. গান প্রোপার্টি (Gun Attributes): No।
5. এমুলেটর প্লেয়ার সম্পূর্ণ নিষিদ্ধ (Mobile Only)।
6. রুম শুরুর ৫ মিনিট পূর্বে আইডি ও পাসওয়ার্ড প্রদান করা হবে।`,
    'special-match': `⭐ Special Match & Headshot Only নিয়মাবলী:
1. শুধুমাত্র হেডশট শট গণনা করা হবে (Only Headshot Mode)।
2. হ্যাক, স্ক্রিপ্ট বা কনফিগ ব্যবহার করলে অ্যাকাউন্ট আজীবনের জন্য ব্যান।
3. ম্যাচ শেষে উইনিং রেজাল্টের ফুল স্ক্রিনশট নেওয়া বাধ্যতামূলক।
4. লেভেল সর্বনিম্ন ৫০+ হতে হবে।`,
    'regular-match': `⚔️ Classic Battle Royale (BR) নিয়মাবলী:
1. ম্যাপ: Bermuda / Purgatory / Kalahari (ম্যাচ শিডিউল অনুযায়ী)।
2. টিমমেট কিলিং বা গ্রিফিং করলে কোনো রিফান্ড নেই।
3. সঠিক স্লটে না বসলে কাস্টম হোস্ট কিক করে দিবে।
4. প্রতি কিল ও বুইয়াহ প্রাইজ স্বয়ংক্রিয়ভাবে ওয়ালেটে যুক্ত হবে।`,
    'lone-wolf': `🎯 Lone Wolf / 1v1 Custom Duel নিয়মাবলী:
1. শুধুমাত্র ডেজার্ট ঈগল / উডপিকার / শটগান দিয়ে ওয়ান ট্যাপ ফাইট।
2. গ্লু ওয়াল আনলিমিটেড।
3. হ্যাক বা ম্যাক্রো সম্পূর্ণ নিষিদ্ধ।`,
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
      categories: { ...INITIAL_CATEGORIES, ...(parsed?.categories || {}) },
      matches,
      settings: { ...INITIAL_SETTINGS, ...(parsed?.settings || {}) },
      topPlayers: Array.isArray(parsed?.topPlayers) ? parsed.topPlayers : INITIAL_TOP_PLAYERS,
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
  
  const rawCategories =
    src.categories && typeof src.categories === 'object' && !Array.isArray(src.categories)
      ? src.categories
      : INITIAL_CATEGORIES;

  // Auto-heal any legacy broken paths or /uploads/ 404 paths
  const healedCategories: Record<string, CategoryItem> = { ...INITIAL_CATEGORIES };
  for (const [slug, cat] of Object.entries(rawCategories)) {
    if (cat && typeof cat === 'object') {
      const item = cat as CategoryItem;
      const fallbackBanner =
        INITIAL_CATEGORIES[slug]?.bannerImage ||
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=640';
      const fallbackAvatar =
        INITIAL_CATEGORIES[slug]?.avatarImage ||
        'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=120';

      const bannerImage = item.bannerImage || fallbackBanner;
      const avatarImage = item.avatarImage || fallbackAvatar;

      healedCategories[slug] = {
        ...(INITIAL_CATEGORIES[slug] || {}),
        ...item,
        bannerImage,
        avatarImage,
      };
    }
  }

  return {
    categories: healedCategories,
    matches: Array.isArray(src.matches) ? src.matches.filter((m: any) => m && typeof m === 'object') : [],
    settings: { ...INITIAL_SETTINGS, ...(src.settings && typeof src.settings === 'object' ? src.settings : {}) },
    topPlayers: Array.isArray(src.topPlayers)
      ? src.topPlayers.filter((p: any) => p && typeof p === 'object')
      : INITIAL_TOP_PLAYERS,
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
  } catch (e) {}

  // Background server sync so all phones, emulators and browsers stay updated
  try {
    fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => {});
  } catch (e) {}
}

export function addMatch(match: Omit<MatchItem, 'id' | 'filledSlots'>): MatchItem {
  const data = getCMSData();
  const newMatch: MatchItem = {
    ...match,
    id: 'm-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    filledSlots: 0,
    status: match.status || 'UPCOMING',
  };
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
    data.matches[index] = { ...data.matches[index], ...updated };
    saveCMSData(data);
  }
}

export function deleteMatch(matchId: string): void {
  const data = getCMSData();
  data.matches = data.matches.filter((m) => m.id !== matchId);
  saveCMSData(data);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ff_match_deleted', { detail: { matchId } }));
  }
}

export function clearAllMatches(): void {
  const data = getCMSData();
  data.matches = [];
  saveCMSData(data);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ff_matches_cleared'));
  }
}

export function updateCategory(slug: string, updated: Partial<CategoryItem>): void {
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
  data.categories[slug] = { ...existing, ...updated };
  saveCMSData(data);
}

export function updateSiteSettings(settings: Partial<SiteSettings>): void {
  const data = getCMSData();
  data.settings = { ...INITIAL_SETTINGS, ...(data.settings || {}), ...settings };
  saveCMSData(data);
}

export function updateTopPlayers(players: TopPlayerItem[]): void {
  const data = getCMSData();
  data.topPlayers = players;
  saveCMSData(data);
}

export function resetCMS(): void {
  saveCMSData(INITIAL_CMS_DATA);
}

// React Hook for Reactive CMS Sync across pages
export function useCMS() {
  const [data, setData] = useState<CMSData>(INITIAL_CMS_DATA);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    setData(getCMSData());
    setLoaded(true);

    // Initial background sync with server to pick up matches/categories created on other devices/admin
    try {
      fetch('/api/cms', { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((serverData) => {
          if (!active) return;
          if (serverData && typeof serverData === 'object' && !serverData.error) {
            const current = getCMSData();
            const serverMatches = Array.isArray(serverData.matches) ? serverData.matches : [];
            const currentMatches = Array.isArray(current?.matches) ? current.matches : [];
            let effectiveMatches = currentMatches;
            if (serverMatches.length > 0) {
              effectiveMatches = serverMatches;
            } else if (currentMatches.length > 0) {
              // Push client matches to server so other devices receive them
              fetch('/api/cms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...current, ...serverData, matches: currentMatches }),
              }).catch(() => {});
            }

            const serverCategories =
              serverData.categories && typeof serverData.categories === 'object' && !Array.isArray(serverData.categories)
                ? serverData.categories
                : {};
            const serverSettings =
              serverData.settings && typeof serverData.settings === 'object' ? serverData.settings : {};
            const merged: CMSData = normalizeCMSData({
              categories: { ...(current?.categories || {}), ...serverCategories },
              matches: effectiveMatches,
              settings: { ...(current?.settings || {}), ...serverSettings } as SiteSettings,
              topPlayers:
                Array.isArray(serverData.topPlayers) && serverData.topPlayers.length > 0
                  ? serverData.topPlayers
                  : current?.topPlayers,
            });
            memoryCMSCache = merged;
            setData(merged);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            } catch (e) {}
          }
        })
        .catch(() => {});
    } catch (e) {}

    const handleUpdate = (e: any) => {
      if (!active) return;
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
    window.addEventListener('storage', handleUpdate);
    return () => {
      active = false;
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
    topPlayers: safe.topPlayers,
    addMatch,
    updateMatch,
    deleteMatch,
    clearAllMatches,
    updateCategory,
    updateSiteSettings,
    updateTopPlayers,
    resetCMS,
  };
}
