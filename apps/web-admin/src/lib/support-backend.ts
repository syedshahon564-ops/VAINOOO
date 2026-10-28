import fs from 'fs';
import path from 'path';
import { generateAdvancedAiResponse, getIntelligentAiResponse } from './ai-assistant';

export interface AiCustomRule {
  id: string;
  keywords: string[];
  response: string;
  category?: string;
  enabled: boolean;
}

export interface AiSupportConfig {
  systemPrompt: string;
  autoVerifyPayments: boolean;
  autoReplyDelayMs: number;
  geminiApiKey?: string;
  geminiModel?: string;
  customRules: AiCustomRule[];
}

export interface TicketMessage {
  id: string;
  senderRole: 'USER' | 'ADMIN' | 'AI_BOT';
  senderName: string;
  message: string;
  imageUrl?: string;
  timestamp: string;
  isAi?: boolean;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userPhone: string;
  userIgn: string;
  subject: string;
  category: 'PAYMENT' | 'MATCH' | 'ACCOUNT' | 'OTHER';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  matchId?: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
  paymentVerified?: boolean;
  verifiedTrxId?: string;
  verifiedAmount?: number;
}

export const DEFAULT_AI_CONFIG: AiSupportConfig = {
  systemPrompt:
    'You are the official 24/7 AI Esports Arbiter & Support Specialist for FF RIVAL TOUR BD. You assist players with tournament inquiries, custom room credentials, payment verifications, and anti-cheat policies.',
  autoVerifyPayments: true,
  autoReplyDelayMs: 600,
  geminiModel: 'gemini-3.5-flash',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  customRules: [
    {
      id: 'rule-room-pass',
      keywords: ['room', 'password', 'pass', 'id', 'রুম', 'পাসওয়ার্ড'],
      response:
        'Custom Room ID and Password will appear automatically under "My Matches" 10 to 15 minutes before the match start time. Make sure to sit in your exact assigned slot within 8 minutes!',
      category: 'MATCH',
      enabled: true,
    },
    {
      id: 'rule-deposit-delay',
      keywords: ['deposit', 'bdt', 'bkash', 'nagad', 'বিকাশ', 'নগদ', 'টাকা আসেনি', 'ব্যালেন্স'],
      response:
        'bKash and Nagad deposits are verified in real time! If you attached your Transaction ID (TrxID) or screenshot, our AI payment processor will verify and credit your balance automatically.',
      category: 'PAYMENT',
      enabled: true,
    },
    {
      id: 'rule-withdraw',
      keywords: ['withdraw', 'cashout', 'উইথড্র', 'টাকা তোলা'],
      response:
        'Withdrawals are processed directly to your personal bKash/Nagad wallet within 30 minutes to 2 hours. Minimum withdrawal is 100 BDT.',
      category: 'PAYMENT',
      enabled: true,
    },
    {
      id: 'rule-slot',
      keywords: ['slot', 'squad', 'স্লট', 'স্কোয়াড'],
      response:
        'For Solo & Duo matches, slots are assigned automatically upon joining. For Squad matches, your team captain selects your designated slot (1 to 12).',
      category: 'MATCH',
      enabled: true,
    },
  ],
};

function getAiConfigPath(): string {
  const possiblePaths = [
    path.join(process.cwd(), 'apps', 'web-admin', 'data', 'ai-support-config.json'),
    path.join(process.cwd(), 'data', 'ai-support-config.json'),
    path.join('/tmp', 'ai-support-config.json'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(process.cwd(), 'data', 'ai-support-config.json');
}

export function readAiConfig(): AiSupportConfig {
  try {
    const filePath = getAiConfigPath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_AI_CONFIG,
        ...parsed,
        geminiApiKey: process.env.GEMINI_API_KEY || parsed.geminiApiKey || DEFAULT_AI_CONFIG.geminiApiKey,
      };
    }
  } catch (e) {}
  return {
    ...DEFAULT_AI_CONFIG,
    geminiApiKey: process.env.GEMINI_API_KEY || DEFAULT_AI_CONFIG.geminiApiKey,
  };
}

export function saveAiConfig(config: AiSupportConfig): void {
  const filePath = getAiConfigPath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {}
  }
  try {
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (e) {
    try {
      const tmpPath = path.join('/tmp', 'ai-support-config.json');
      fs.writeFileSync(tmpPath, JSON.stringify(config, null, 2), 'utf-8');
    } catch (err) {}
  }
}

function getTicketsFilePath(): string {
  const possiblePaths = [
    path.join(process.cwd(), 'apps', 'web-admin', 'data', 'support-tickets.json'),
    path.join(process.cwd(), 'data', 'support-tickets.json'),
    path.join('/tmp', 'support-tickets.json'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(process.cwd(), 'data', 'support-tickets.json');
}

export function readTickets(): SupportTicket[] {
  try {
    const filePath = getTicketsFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

export function saveTickets(tickets: SupportTicket[]): void {
  const filePath = getTicketsFilePath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {}
  }
  try {
    fs.writeFileSync(filePath, JSON.stringify(tickets, null, 2), 'utf-8');
  } catch (e) {
    try {
      const tmpPath = path.join('/tmp', 'support-tickets.json');
      fs.writeFileSync(tmpPath, JSON.stringify(tickets, null, 2), 'utf-8');
    } catch (err) {}
  }
}

function getPaymentsDbPath(): string {
  const possiblePaths = [
    path.join(process.cwd(), 'apps', 'web-admin', 'data', 'payments-db.json'),
    path.join(process.cwd(), 'data', 'payments-db.json'),
    path.join('/tmp', 'payments-db.json'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(process.cwd(), 'data', 'payments-db.json');
}

function getUsersDbPath(): string {
  const possiblePaths = [
    path.join(process.cwd(), 'apps', 'web-admin', 'data', 'users-db.json'),
    path.join(process.cwd(), 'data', 'users-db.json'),
    path.join('/tmp', 'users-db.json'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(process.cwd(), 'data', 'users-db.json');
}

/**
 * Live payment check and auto-claim against payments-db.json
 */
export function checkAndClaimPayment(trxId: string, playerIdentifier: string): {
  found: boolean;
  claimedNow: boolean;
  alreadyClaimed: boolean;
  amount?: number;
  provider?: string;
  message: string;
} {
  try {
    const pPath = getPaymentsDbPath();
    if (!fs.existsSync(pPath)) {
      return { found: false, claimedNow: false, alreadyClaimed: false, message: '' };
    }

    const db = JSON.parse(fs.readFileSync(pPath, 'utf-8'));
    const incoming = db.incomingPayments || [];
    const normalizedTrx = trxId.trim().toUpperCase();

    const idx = incoming.findIndex(
      (p: any) => String(p.trx_id || p.trxId || '').trim().toUpperCase() === normalizedTrx
    );

    if (idx === -1) {
      return { found: false, claimedNow: false, alreadyClaimed: false, message: '' };
    }

    const pay = incoming[idx];
    const amount = Number(pay.amount || 0);
    const provider = String(pay.provider || 'BKASH').toUpperCase();

    if (pay.status === 'CLAIMED') {
      const claimer = pay.claimed_by || pay.claimedBy || 'another player';
      return {
        found: true,
        claimedNow: false,
        alreadyClaimed: true,
        amount,
        provider,
        message: `⚠️ এই TrxID-টি (${normalizedTrx}) ইতোমধ্যে ব্যবহার করা হয়েছে (${claimer} কর্তৃক)। আপনি নতুন কোনো ট্রানজেকশন সম্পন্ন করে থাকলে সঠিক TrxID অথবা রিসিটের স্ক্রিনশট দিন।`,
      };
    }

    // Auto-claim the payment
    const nowIso = new Date().toISOString();
    pay.status = 'CLAIMED';
    pay.claimed_by = playerIdentifier;
    pay.claimedBy = playerIdentifier;
    pay.claimed_at = nowIso;
    pay.claimedAt = nowIso;
    incoming[idx] = pay;
    db.incomingPayments = incoming;

    db.depositLogs = db.depositLogs || [];
    db.depositLogs.unshift({
      id: 'dep_ai_' + Date.now(),
      trxId: normalizedTrx,
      userId: playerIdentifier,
      amount,
      provider,
      status: 'SUCCESS',
      processedAt: nowIso,
      note: 'Auto-verified & claimed by AI Support Bot',
    });

    fs.writeFileSync(pPath, JSON.stringify(db, null, 2), 'utf-8');

    // Also update users-db.json balance
    try {
      const uPath = getUsersDbPath();
      if (fs.existsSync(uPath)) {
        const users = JSON.parse(fs.readFileSync(uPath, 'utf-8'));
        if (Array.isArray(users)) {
          const uIdx = users.findIndex(
            (u: any) =>
              u.id === playerIdentifier ||
              String(u.ign || '').toLowerCase() === playerIdentifier.toLowerCase() ||
              String(u.phone || '') === playerIdentifier
          );
          if (uIdx !== -1) {
            const curBal = Number(users[uIdx].walletBalance ?? users[uIdx].balance ?? 0);
            const newBal = Number((curBal + amount).toFixed(2));
            users[uIdx].walletBalance = newBal;
            users[uIdx].balance = newBal;
            fs.writeFileSync(uPath, JSON.stringify(users, null, 2), 'utf-8');
          }
        }
      }
    } catch (e) {}

    return {
      found: true,
      claimedNow: true,
      alreadyClaimed: false,
      amount,
      provider,
      message: `🎉 **পেমেন্ট সফলভাবে স্বয়ংক্রিয়ভাবে ভেরিফাই সম্পন্ন!**\n\n• **পরিমাণ:** ৳${amount}\n• **পেমেন্ট গেটওয়ে:** ${provider}\n• **TrxID:** ${normalizedTrx}\n• **স্ট্যাটাস:** ওয়ালেটে ৳${amount} সাথে সাথে যুক্ত করা হয়েছে ✅\n\nআপনার অ্যাপের Wallet ট্যাবে গিয়ে ব্যালেন্স রিফ্রেশ করে চেক করুন। শুভকামনা টুর্নামেন্টের জন্য!`,
    };
  } catch (err) {
    return { found: false, claimedNow: false, alreadyClaimed: false, message: '' };
  }
}

export function detectLanguage(text: string): 'BANGLA' | 'BANGLISH' | 'ENGLISH' {
  if (!text) return 'ENGLISH';
  if (/[\u0980-\u09FF]/.test(text)) return 'BANGLA';

  const banglishTokens = [
    'kemon', 'kmn', 'acho', 'aso', 'achen', 'asen', 'achi', 'asi',
    'kivabe', 'kivhabe', 'kibabe', 'kemne', 'keno', 'kn', 'kobe', 'kokhon', 'kkn',
    'taka', 'tk', 'poisa', 'pabo', 'pawa', 'jabe', 'jbo', 'diben', 'dibo', 'dite',
    'amr', 'amar', 'tomar', 'tmr', 'apnar', 'apni', 'tumi', 'tui', 'vai', 'bhai',
    'bro', 'bhaia', 'vaia', 'somossa', 'shomossha', 'lagbe', 'parbo', 'parchi',
    'parbona', 'korbo', 'korchi', 'korte', 'koro', 'bolo', 'bolun', 'bolte',
    'bhalo', 'valo', 'vlo', 'shuru', 'suru', 'hobe', 'hoise', 'hoini', 'hoi',
    'nai', 'gese', 'cole', 'chole', 'khulbe', 'asche', 'ashe', 'aseni', 'payechi',
    'dekhbo', 'dekhen', 'dekhi', 'bolbo', 'shunte', 'parben', 'dhukbo', 'dhukte',
    'boshbo', 'boshte', 'bosbo', 'boshe', 'boisa', 'ki', 'khobor', 'obostha', 'jantam'
  ];

  const words = text.toLowerCase().split(/[^a-zA-Z0-9]+/);
  for (const w of words) {
    if (banglishTokens.includes(w)) return 'BANGLISH';
  }
  return 'ENGLISH';
}

/**
 * Autonomous Anti-Cheat Ban Engine for Panel / Hack Violations
 */
export function banReportedPlayer(
  reporterMessage: string,
  reporterIgn: string = 'Reporter'
): {
  isCheatReport: boolean;
  targetIdentified: boolean;
  banned: boolean;
  targetUser?: any;
  alreadyBanned?: boolean;
  isOwner?: boolean;
  message?: string;
} {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const normalizedMessage = reporterMessage.replace(/[০-৯]/g, (d) => String(bnDigits.indexOf(d)));
  const query = normalizedMessage.toLowerCase();
  const cheatKeywords = [
    'panel', 'hack', 'hacker', 'cheat', 'cheater', 'aimbot', 'wallhack', 'config',
    'প্যানেল', 'হ্যাক', 'চিট', 'হ্যাকার', 'বিচার', 'ব্যান', 'ban', 'bichar'
  ];

  const isCheatReport = cheatKeywords.some((kw) => query.includes(kw));
  if (!isCheatReport) {
    return { isCheatReport: false, targetIdentified: false, banned: false };
  }

  const uPath = getUsersDbPath();
  let users: any[] = [];
  try {
    if (fs.existsSync(uPath)) {
      users = JSON.parse(fs.readFileSync(uPath, 'utf-8'));
    }
  } catch (e) {}

  // 1. Try to extract UID (7-12 digits)
  const uidMatch = normalizedMessage.match(/(?:uid|id|আইডি)?\s*[:#]?\s*([0-9]{7,12})\b/i);
  let matchedUser: any = null;
  let isNewBan = false;

  if (uidMatch) {
    const rawUid = uidMatch[1];
    matchedUser = users.find(
      (u) =>
        String(u.uid || '').trim() === rawUid ||
        String(u.id || '').trim() === rawUid ||
        String(u.phone || '').trim() === rawUid
    );

    // If not currently in database, insert a new entry to be permanently banned and blacklisted
    if (!matchedUser) {
      matchedUser = {
        id: 'u-banned-' + rawUid,
        uid: rawUid,
        ign: 'Reported_Panel_User_' + rawUid.slice(-4),
        phone: 'BANNED_DEVICE_' + rawUid,
        role: 'PLAYER',
        status: 'ACTIVE',
        isBanned: false,
        walletBalance: 0,
        createdAt: new Date().toISOString(),
      };
      users.unshift(matchedUser);
      isNewBan = true;
    }
  }

  // 2. Try to match IGN or username from registered players (excluding reporter and admins)
  if (!matchedUser) {
    for (const u of users) {
      const ign = String(u.ign || u.username || '').trim().toLowerCase();
      if (
        ign &&
        ign.length >= 3 &&
        ign !== reporterIgn.toLowerCase() &&
        query.includes(ign)
      ) {
        matchedUser = u;
        break;
      }
    }
  }

  const lang = detectLanguage(reporterMessage);

  // If no target identified yet:
  if (!matchedUser) {
    let msg = '';
    if (lang === 'BANGLA') {
      msg = `🚨 **অ্যান্টি-চিট সাপোর্ট অ্যাকশন:**\n\nFF RIVAL TOUR BD প্ল্যাটফর্মে প্যানেল, হ্যাক বা যেকোনো অনৈতিক ফাইল ব্যবহার সম্পূর্ণ নিষিদ্ধ!\n\nঅনুগ্রহ করে অভিযুক্ত প্লেয়ারের **ইন-গেম নাম (IGN)** এবং স্ক্রিনশট বা ভিডিও প্রুফ দিন। নাম ও প্রমাণ দেওয়া মাত্রই আমাদের এআই সিস্টেম তার অ্যাকাউন্ট এবং ডিভাইস **তাৎক্ষণিক পার্মানেন্ট ব্যান (Permanent Ban)** করে দিবে!\n\n📹 বড় ভিডিও প্রুফ থাকলে সরাসরি আমাদের অফিসিয়াল টেলিগ্রাম চ্যানেলে পাঠান:\n👉 https://t.me/ffrivalstourbdofficial`;
    } else if (lang === 'BANGLISH') {
      msg = `🚨 **Anti-Cheat Enforcement:**\n\nPlatform e panel ba hack use kora strictly prohibited!\n\nDoya kore accused cheater-er **IGN (In-Game Name)** ebong video ba screenshot proof din. Proof pawa matroi amader AI engine taake instant permanent ban kore dibe!\n\n📹 Video proof pathate official Telegram:\n👉 https://t.me/ffrivalstourbdofficial`;
    } else {
      msg = `🚨 **Anti-Cheat Enforcement:**\n\nThird-party panels, cheats, and illegal mods are strictly banned!\n\nPlease provide the suspect player's **In-Game Name (IGN)** and video/screenshot proof.\n\n📹 Send large video evidence directly to our official Telegram channel:\n👉 https://t.me/ffrivalstourbdofficial`;
    }

    return {
      isCheatReport: true,
      targetIdentified: false,
      banned: false,
      message: msg,
    };
  }

  // Safety: Prevent banning owner/admin accounts
  if (matchedUser.role === 'ADMIN' || String(matchedUser.id || '').startsWith('u-owner')) {
    return {
      isCheatReport: true,
      targetIdentified: true,
      banned: false,
      isOwner: true,
      message: lang === 'BANGLISH'
        ? `⚠️ Accused ID (${matchedUser.ign || matchedUser.uid}) platform er protected Admin/Owner account. Eita ban kora jabena.`
        : `⚠️ চিহ্নিত আইডিটি (${matchedUser.ign || matchedUser.uid}) প্ল্যাটফর্মের সুরক্ষিত অ্যাডমিন/অনার অ্যাকাউন্ট। এটি ব্যান করা সম্ভব নয়।`,
    };
  }

  // Check if already banned
  if (!isNewBan && (matchedUser.status === 'BANNED' || matchedUser.isBanned)) {
    let msg = '';
    if (lang === 'BANGLISH') {
      msg = `🚫 **Player Already Banned!**\n\n• **Player:** ${matchedUser.ign || 'Cheater'} (UID: ${matchedUser.uid || matchedUser.id})\n• **Status:** Permanent Ban Active ✅\n• Ei player amader kono tournament ba match e participate korte parbena.`;
    } else {
      msg = `🚫 **প্লেয়ার ইতোমধ্যে নিষিদ্ধ (Permanently Banned)!**\n\n• **প্লেয়ার:** ${matchedUser.ign || 'Cheater'} (UID: ${matchedUser.uid || matchedUser.id})\n• **স্ট্যাটাস:** পার্মানেন্ট ব্যান (Permanent Ban) সক্রিয় রয়েছে ✅\n• এই প্লেয়ার বর্তমানে আমাদের কোনো টুর্নামেন্ট বা ম্যাচে অংশ নিতে পারছে না।`;
    }
    return {
      isCheatReport: true,
      targetIdentified: true,
      banned: false,
      alreadyBanned: true,
      targetUser: matchedUser,
      message: msg,
    };
  }

  // Execute Permanent Ban!
  const nowIso = new Date().toISOString();
  matchedUser.status = 'BANNED';
  matchedUser.isBanned = true;
  matchedUser.banReason = 'Permanently Banned by AI Support Bot for illegal Panel / Cheat violation';
  matchedUser.bannedAt = nowIso;
  matchedUser.bannedBy = 'AI_SUPPORT_SENTINEL';
  matchedUser.walletBalance = 0; // Freeze balance

  // Persist across all user DB paths
  const candidatePaths = Array.from(new Set([
    path.join(process.cwd(), 'apps', 'web-admin', 'data', 'users-db.json'),
    path.join(process.cwd(), 'data', 'users-db.json'),
    path.resolve(__dirname, '..', '..', 'data', 'users-db.json'),
    path.resolve(__dirname, '..', '..', '..', '..', 'data', 'users-db.json'),
    path.join('/tmp', 'users-db.json'),
  ]));
  const payload = JSON.stringify(users, null, 2);
  for (const p of candidatePaths) {
    try {
      const dir = path.dirname(p);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(p, payload, 'utf-8');
    } catch (e) {}
  }

  let successMsg = '';
  if (lang === 'BANGLISH') {
    successMsg = `🚨 **Action Completed: Panel User Permanently Banned!**\n\n• **Accused Player:** ${matchedUser.ign || 'Player'} (UID: ${matchedUser.uid || matchedUser.id})\n• **Violation:** Third-party Hack Panel / Cheat Detected\n• **Enforcement:** Account & Device Permanently BANNED ✅\n• **Anti-Cheat Desk:** Added to Central Blacklist.\n\nFF RIVAL TOUR BD te 100% fair play maintain korte report korar jonno onek dhonnobad!`;
  } else if (lang === 'BANGLA') {
    successMsg = `🚨 **অ্যাকশন সম্পন্ন: অভিযুক্ত প্যানেল ইউজারকে পার্মানেন্ট ব্যান করা হয়েছে!**\n\n• **অভিযুক্ত প্লেয়ার:** ${matchedUser.ign || 'Player'} (UID: ${matchedUser.uid || matchedUser.id})\n• **অভিযোগ:** থার্ড-পার্টি হ্যাক প্যানেল / অবৈধ কনফিগ ব্যবহার\n• **গৃহীত ব্যবস্থা:** অ্যাকাউন্ট ও ডিভাইস পার্মানেন্ট ব্যান (Permanent Ban) ✅\n• **অ্যান্টি-চিট রেকর্ড:** আমাদের সেন্ট্রাল ব্ল্যাকলিস্টে অন্তর্ভুক্ত সম্পন্ন।\n\nFF RIVAL TOUR BD-তে ১০০% ফেয়ার প্লে বজায় রাখতে সহায়তা করার জন্য আপনাকে আন্তরিক ধন্যবাদ!`;
  } else {
    successMsg = `🚨 **Enforcement Action: Panel Cheater Permanently Banned!**\n\n• **Accused Player:** ${matchedUser.ign || 'Player'} (UID: ${matchedUser.uid || matchedUser.id})\n• **Violation:** Illegal Mod / Game Panel Usage\n• **Action:** Permanent Account & Device Ban Enforced ✅\n• **Status:** Added to Anti-Cheat Central Blacklist.\n\nThank you for keeping FF RIVAL TOUR BD safe and fair!`;
  }

  return {
    isCheatReport: true,
    targetIdentified: true,
    banned: true,
    targetUser: matchedUser,
    message: successMsg,
  };
}

/**
 * Supercharged Asynchronous AI Processing Engine with Gemini and Live Payment Verification
 */
export async function processAiResponse(
  ticket: Partial<SupportTicket>,
  userMessage: string,
  imageUrl?: string
): Promise<{ response: string; paymentVerified?: boolean; verifiedTrxId?: string; verifiedAmount?: number }> {
  const config = readAiConfig();
  const query = (userMessage + ' ' + (ticket.subject || '')).toLowerCase();
  const ign = ticket.userIgn || 'Player';

  // 1. Autonomous Anti-Cheat Panel / Hack Ban Check
  const banCheck = banReportedPlayer(userMessage, ign);
  if (banCheck.isCheatReport && banCheck.message) {
    return {
      response: banCheck.message,
    };
  }

  // 1. Live Payment Check: If user provided a TrxID, check and auto-claim directly
  const trxMatch = userMessage.match(/\b([A-Za-z0-9]{8,14})\b/);
  if (trxMatch && (query.includes('trx') || query.includes('deposit') || query.includes('টাকা') || query.includes('bkash') || query.includes('nagad') || query.includes('পেমেন্ট'))) {
    const trxId = trxMatch[1].toUpperCase();
    const payCheck = checkAndClaimPayment(trxId, ticket.userIgn || ticket.userId || 'PLAYER');
    if (payCheck.found) {
      if (payCheck.claimedNow) {
        return {
          paymentVerified: true,
          verifiedTrxId: trxId,
          verifiedAmount: payCheck.amount,
          response: payCheck.message,
        };
      } else if (payCheck.alreadyClaimed) {
        return {
          paymentVerified: false,
          response: payCheck.message,
        };
      }
    }
  }

  // 2. Check Admin's Custom Rules
  if (Array.isArray(config.customRules)) {
    for (const rule of config.customRules) {
      if (rule.enabled && Array.isArray(rule.keywords)) {
        const matches = rule.keywords.some((kw) => query.includes(kw.toLowerCase().trim()));
        if (matches && rule.response && rule.response.trim().length > 0) {
          return { response: rule.response.trim() };
        }
      }
    }
  }

  // 3. Conversation history for multi-turn Gemini reasoning
  const history = (ticket.messages || [])
    .slice(-6)
    .map((m) => ({
      role: m.senderRole === 'AI_BOT' ? ('assistant' as const) : ('user' as const),
      text: m.message,
    }));

  // 4. Delegate to the Advanced Multilingual Gemini AI Engine
  const aiResult = await getIntelligentAiResponse({
    userMessage,
    userIgn: ticket.userIgn,
    category: ticket.category,
    subject: ticket.subject,
    imageUrl,
    history,
    apiKey: config.geminiApiKey,
    modelName: config.geminiModel,
    systemPromptOverride: config.systemPrompt,
  });

  return {
    response: aiResult.response,
    paymentVerified: aiResult.paymentVerified,
    verifiedTrxId: aiResult.verifiedTrxId,
    verifiedAmount: aiResult.verifiedAmount,
  };
}

/**
 * Synchronous fallback wrapper
 */
export function processAiResponseSync(
  ticket: Partial<SupportTicket>,
  userMessage: string,
  imageUrl?: string
): { response: string; paymentVerified?: boolean; verifiedTrxId?: string; verifiedAmount?: number } {
  const result = generateAdvancedAiResponse({
    userMessage,
    userIgn: ticket.userIgn,
    category: ticket.category,
    subject: ticket.subject,
    imageUrl,
  });

  return {
    response: result.response,
    paymentVerified: result.paymentVerified,
    verifiedTrxId: result.verifiedTrxId,
    verifiedAmount: result.verifiedAmount,
  };
}
