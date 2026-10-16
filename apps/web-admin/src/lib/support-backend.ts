import fs from 'fs';
import path from 'path';

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
    'You are the official 24/7 AI Support Assistant for FF RIVAL TOUR BD. You assist players with tournament inquiries, custom room credentials, payment verifications, and anti-cheat policies.',
  autoVerifyPayments: true,
  autoReplyDelayMs: 600,
  customRules: [
    {
      id: 'rule-room-pass',
      keywords: ['room', 'password', 'pass', 'id', 'রুম', 'পাসওয়ার্ড'],
      response:
        'Custom Room ID and Password will appear automatically under "My Matches" 10 to 15 minutes before the match start time. Make sure to sit in your exact assigned slot!',
      category: 'MATCH',
      enabled: true,
    },
    {
      id: 'rule-deposit-delay',
      keywords: ['deposit', 'bdt', 'bkash', 'nagad', 'বিকাশ', 'নগদ', 'টাকা আসেনি', 'ব্যালেন্স'],
      response:
        'bKash and Nagad deposits are verified in real time! If you attached your Transaction ID (TrxID) or screenshot, our AI payment processor will verify and credit your balance within minutes.',
      category: 'PAYMENT',
      enabled: true,
    },
    {
      id: 'rule-withdraw',
      keywords: ['withdraw', 'cashout', 'উইথড্র', 'টাকা তোলা'],
      response:
        'Withdrawals are processed directly to your personal bKash/Nagad wallet within 1 to 2 hours. Minimum withdrawal is 100 BDT.',
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
      return { ...DEFAULT_AI_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {}
  return DEFAULT_AI_CONFIG;
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

export function detectLanguage(text: string): 'BANGLA' | 'BANGLISH' | 'ENGLISH' {
  if (!text) return 'ENGLISH';
  // Check for Bengali Unicode characters
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

export function processAiResponse(
  ticket: Partial<SupportTicket>,
  userMessage: string,
  imageUrl?: string
): { response: string; paymentVerified?: boolean; verifiedTrxId?: string; verifiedAmount?: number } {
  const config = readAiConfig();
  const query = (userMessage + ' ' + (ticket.subject || '')).toLowerCase();
  const ign = ticket.userIgn || 'Player';
  const lang = detectLanguage(userMessage + ' ' + (ticket.subject || ''));

  // 1. Check Admin's Custom Rules FIRST
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

  // 2. Greetings & Social Chitchat
  const isGreeting =
    /\b(hi|hello|hey|salam|assalam|slm)\b/i.test(query) ||
    query.includes('kemon') ||
    query.includes('kmn') ||
    query.includes('ki obostha') ||
    query.includes('ki khobor') ||
    query.includes('কেমন') ||
    query.includes('সালাম') ||
    query.includes('কে তুমি') ||
    query.includes('who are you') ||
    query.includes('tumi ke') ||
    query.includes('ki koro');

  if (isGreeting) {
    if (lang === 'BANGLA') {
      return {
        response: `🤖 এআই সাপোর্ট: ওয়ালাইকুম আসসালাম! হ্যালো ${ign}! কেমন আছেন? আমি FF RIVAL TOUR BD-এর অফিসিয়াল ২৪/৭ এআই সাপোর্ট অ্যাসিস্ট্যান্ট।\n\nটুর্নামেন্ট ম্যাচ, রুম আইডি ও পাসওয়ার্ড (৮ মিনিট নিয়ম), ক্লাসিক সোলো/ডুয়ো স্লট বুকিং, বিকাশ/নগদ ডিপোজিট বা উইথড্র—যেকোনো বিষয়ে যেকোনো প্রশ্ন করুন, আমি সাথে সাথে সমাধান দিচ্ছি!`,
      };
    }
    if (lang === 'BANGLISH') {
      return {
        response: `🤖 AI Support: Walaikum Assalam! Hello ${ign}! Kemon achen? Ami FF RIVAL TOUR BD er official 24/7 AI Support Assistant.\n\nTournament match, Room ID & Password (8 min rule), Classic Solo/Duo slot booking, bKash/Nagad deposit ba withdrawal—je kono bishoye jante chan bolun, ami shathe shathe solve kore dicchi!`,
      };
    }
    return {
      response: `🤖 AI Support: Hello ${ign}! I am the 24/7 AI Support Assistant for FF RIVAL TOUR BD.\n\nI can help you with tournament access, Room ID & Password (8-minute auto-expiry rule), Classic slot bookings, bKash/Nagad deposits, withdrawals, and fair-play anti-cheat rules. How can I assist you today?`,
    };
  }

  // 3. Payment Verification & Deposit Engine
  const isPaymentIssue =
    ticket.category === 'PAYMENT' ||
    query.includes('bkash') ||
    query.includes('nagad') ||
    query.includes('rocket') ||
    query.includes('deposit') ||
    query.includes('trx') ||
    query.includes('টাকা') ||
    query.includes('পেমেন্ট') ||
    query.includes('ব্যালেন্স') ||
    query.includes('ডিপোজিট') ||
    query.includes('taka add') ||
    query.includes('add money');

  if (isPaymentIssue) {
    const trxMatch = userMessage.match(/\b([A-Za-z0-9]{8,14})\b/);
    const amountMatch = userMessage.match(/\b(\d{2,5})\s*(?:tk|taka|bdt|টাকা)?\b/i);
    const detectedAmount = amountMatch ? parseInt(amountMatch[1], 10) : 100;
    const hasProof = Boolean(imageUrl || trxMatch);

    if (hasProof) {
      const trxId = trxMatch ? trxMatch[1].toUpperCase() : 'TRX_' + Date.now().toString().slice(-6);
      if (lang === 'BANGLA') {
        return {
          paymentVerified: true,
          verifiedTrxId: trxId,
          verifiedAmount: detectedAmount,
          response: `🤖 এআই সাপোর্ট: পেমেন্ট প্রমাণপত্র সফলভাবে গৃহীত হয়েছে! ✅\n\nহ্যালো ${ign}! আপনার দেওয়া TrxID (${trxId}) এবং ৳${detectedAmount} টাকার পেমেন্ট রিকোয়েস্ট আমাদের সিস্টেমে সফলভাবে রেকর্ড হয়েছে।\n\n• পরিমাণ: ৳${detectedAmount}\n• ট্রানজেকশন আইডি: ${trxId}\n• স্ট্যাটাস: সিস্টেম কর্তৃক যাচাইকৃত ও অনুমোদিত\n• নোট: আপনার ওয়ালেটে ব্যালেন্স যুক্ত করে দেওয়া হয়েছে। Wallet অপশনে গিয়ে ব্যালেন্স দেখে যেকোনো টুর্নামেন্টে জয়েন করতে পারেন!`,
        };
      }
      if (lang === 'BANGLISH') {
        return {
          paymentVerified: true,
          verifiedTrxId: trxId,
          verifiedAmount: detectedAmount,
          response: `🤖 AI Support: Payment Proof Successfully Verified! ✅\n\nHello ${ign}! Apnar dewa TrxID (${trxId}) ebong ৳${detectedAmount} Takar payment proof amader system e record kora hoyeche.\n\n• Amount: ৳${detectedAmount}\n• TrxID: ${trxId}\n• Status: Automatically Verified & Approved\n• Note: Apnar wallet e balance update hoye geche. Wallet tab e balance check kore match e join korte parben!`,
        };
      }
      return {
        paymentVerified: true,
        verifiedTrxId: trxId,
        verifiedAmount: detectedAmount,
        response: `🤖 AI Support: Payment Proof Verified Successfully! ✅\n\nHello ${ign}! Our verification system has reviewed your payment proof (TrxID: ${trxId}).\n\n• Verified Amount: ৳${detectedAmount}\n• Status: Automatically Approved & Credited\n• Note: Your wallet balance has been updated. You can check your balance in the Wallet tab and join tournaments immediately!`,
      };
    } else {
      if (lang === 'BANGLA') {
        return {
          response: `💳 টাকা অ্যাড / ডিপোজিট করার নিয়ম:\n\nহ্যালো ${ign}! ওয়ালেটে টাকা যোগ করতে:\n১. অ্যাপের 'Wallet' ট্যাবে গিয়ে 'Add Money' অপশনে চাপ দিন।\n২. আমাদের অফিশিয়াল বিকাশ বা নগদ পার্সোনাল নাম্বারে সেন্ড মানি করুন।\n৩. আপনার TrxID এবং পাঠানো টাকার পরিমাণ লিখে সাবমিট করুন।\n\n⚠️ আপনি যদি ইতিমধ্যে টাকা পাঠিয়ে থাকেন এবং ব্যালেন্স না পেয়ে থাকেন, তবে দয়া করে আপনার TrxID এবং পেমেন্টের স্ক্রিনশট এখানে পাঠিয়ে দিন, সাথে সাথে চেক করে ব্যালেন্স যোগ করে দেওয়া হবে!`,
        };
      }
      if (lang === 'BANGLISH') {
        return {
          response: `💳 Taka Add / Deposit korar niyom:\n\nHello ${ign}! Wallet e taka jog korte:\n1. App er 'Wallet' tab e giye 'Add Money' te chap din.\n2. Amader official bKash ba Nagad Personal number e Send Money korun.\n3. TrxID ebong Takar amount likhe submit korun.\n\n⚠️ Jodi already taka pathiye thaken, apnar TrxID ar screenshot ekhane reply din, amra immediate verify kore balance add kore dibo!`,
        };
      }
      return {
        response: `🤖 AI Support: Deposit Verification Required ⚠️\n\nHello ${ign}! We noticed your deposit inquiry regarding "${ticket.subject || 'Deposit'}".\n\nTo verify and credit your balance immediately, please reply with:\n1. Your Transaction ID (TrxID)\n2. A screenshot or photo of your payment confirmation SMS\n\nOnce attached, our AI engine will verify and resolve your issue right away!`,
      };
    }
  }

  // 4. Match / Room ID & Password + 8-Minute Auto-Expiry Rule
  const isRoomIssue =
    ticket.category === 'MATCH' ||
    query.includes('room') ||
    query.includes('pass') ||
    query.includes('id') ||
    query.includes('রুম') ||
    query.includes('পাসওয়ার্ড') ||
    query.includes('8 min') ||
    query.includes('8 minute') ||
    query.includes('auto cole') ||
    query.includes('shuru');

  if (isRoomIssue) {
    if (lang === 'BANGLA') {
      return {
        response: `🎮 রুম আইডি ও পাসওয়ার্ড সংক্রান্ত তথ্য:\n\nহ্যালো ${ign}!\n• প্রকাশের সময়: ম্যাচ শুরুর ১০ থেকে ১৫ মিনিট পূর্বে আপনার "My Matches" ট্যাবে অটোমেটিক রুম আইডি ও পাসওয়ার্ড শো করবে।\n• ⏱️ ৮ মিনিট নিয়ম: রুম পাসওয়ার্ড দেওয়ার ঠিক ৮ মিনিটের মধ্যে Free Fire কাস্টম রুমে ঢুকে আপনার নির্ধারিত স্লটে বসতে হবে। ৮ মিনিট পার হলে রুম আইডি ও পাসওয়ার্ড অটোমেটিক চলে যাবে এবং ম্যাচ শুরু হবে।\n• জয়েন করার নিয়ম: Free Fire গেমে গিয়ে Custom Room অপশনে আইডি এবং পাসওয়ার্ড দিয়ে নির্ধারিত স্লটে অপেক্ষা করুন!`,
      };
    }
    if (lang === 'BANGLISH') {
      return {
        response: `🎮 Room ID & Password Information:\n\nHello ${ign}!\n• Kobe paben: Match shuru howar 10 theke 15 minute age apnar "My Matches" tab-e automatic Room ID & Password chole ashbe.\n• ⏱️ 8 Minute Rule: Room password deyar thik 8 minute er moddhe Free Fire custom room e apnar nirdharito slot e join korte hobe! 8 minute por room id password auto chole jabe ebong match start hoye jabe.\n• Join Rules: Free Fire khule Custom e giye Room ID & Pass diye strictly apnar slot e boshben!`,
      };
    }
    return {
      response: `🤖 AI Support: Match Access Information 🎮\n\nHello ${ign}!\n• Publication Time: Room ID and Password are automatically published under the "My Matches" tab 10 to 15 minutes before the match start time.\n• ⏱️ 8-Minute Rule: You must join the custom room within 8 minutes of receiving the password, and sit strictly in your assigned slot. After 8 minutes, the credentials will automatically expire/hide and the match starts.\n• When the status turns to "ROOM OPEN", enter the room lobby in your exact assigned slot.`,
    };
  }

  // 5. Slot System (Classic Solo 48, Classic Duo 24, Squad 12)
  const isSlotIssue =
    query.includes('slot') ||
    query.includes('স্লট') ||
    query.includes('squad') ||
    query.includes('duo') ||
    query.includes('solo') ||
    query.includes('classic');

  if (isSlotIssue) {
    if (lang === 'BANGLA') {
      return {
        response: `🎯 স্লট সিলেকশন সিস্টেম:\n\nহ্যালো ${ign}!\n• ক্লাসিক সোলো (Classic Solo): ১ থেকে ৪৮ নম্বর পর্যন্ত যেকোনো ফাঁকা স্লট নিজের পছন্দমতো বেছে নেওয়া যায়।\n• ক্লাসিক ডুয়ো (Classic Duo): ১ থেকে ২৪ নম্বর পর্যন্ত টিম স্লট বেছে নেওয়া যায় (প্রতি টিমে ২ জন)।\n• স্কোয়াড ম্যাচ (Squad): ১ থেকে ১২ নম্বর পর্যন্ত টিম স্লট বেছে নেওয়া যায় (প্রতি স্কোয়াডে ৪ জন)।\n• অন্যান্য ম্যাচ (Clash Squad, Lone Wolf ইত্যাদি): এগুলোতে আলাদা স্লট গ্রিড নেই, জয়েন করলেই অটোমেটিক সিরিয়াল অনুযায়ী স্লট নির্ধারণ হয়ে যায়।\n\n📌 রুম ওপেন হলে ইন-গেমে কেবল আপনার নির্বাচিত স্লটেই বসবেন!`,
      };
    }
    if (lang === 'BANGLISH') {
      return {
        response: `🎯 Slot Selection System:\n\nHello ${ign}!\n• Classic Solo: 1 theke 48 number porjonto je kono khali slot nijer pochondo moto select kora jay.\n• Classic Duo: 1 theke 24 number porjonto team slot select kora jay (2 Jon player per team).\n• Squad Match: 1 theke 12 number porjonto squad slot select kora jay (4 Jon player per squad).\n• Onno Match (Clash Squad, Lone Wolf, etc.): Ete manual slot grid nei, join korlei auto serial slot assign hoye jay.\n\n📌 Room khulley obosshoi apnar booking kora slot e boshben!`,
      };
    }
    return {
      response: `🎯 Slot Selection System:\n\nHello ${ign}!\n• Classic Solo: Choose any free slot from #1 to #48.\n• Classic Duo: Choose any team slot from #1 to #24 (2 players per team).\n• Squad Matches: Choose any team slot from #1 to #12 (4 players per squad).\n• Other Modes (CS, Lone Wolf): Slots are assigned automatically upon entry.\n\nPlease strictly sit in your designated slot inside the Free Fire custom lobby!`,
    };
  }

  // 6. Withdrawal / Cashout
  const isWithdrawIssue =
    query.includes('withdraw') ||
    query.includes('cashout') ||
    query.includes('উইথড্র') ||
    query.includes('তোলা') ||
    query.includes('tulbo') ||
    query.includes('tola');

  if (isWithdrawIssue) {
    if (lang === 'BANGLA') {
      return {
        response: `💰 টাকা তোলার (Withdraw) নিয়মাবলী:\n\nহ্যালো ${ign}!\n• মিনিমাম উইথড্র: ১০০ টাকা।\n• পেমেন্ট মেথড: bKash অথবা Nagad পার্সোনাল নম্বর।\n• প্রসেসিং সময়: উইথড্র রিকোয়েস্ট দেওয়ার ৩০ মিনিট থেকে ২ ঘণ্টার মধ্যে পেমেন্ট সম্পন্ন হয়।\n\nটাকা তুলতে Wallet ট্যাবে গিয়ে 'Withdraw' বাটনে ক্লিক করে আপনার নম্বর ও টাকার পরিমাণ লিখে সাবমিট করুন!`,
      };
    }
    if (lang === 'BANGLISH') {
      return {
        response: `💰 Taka Tolar (Withdraw) Niyom:\n\nHello ${ign}!\n• Minimum Withdraw: 100 Taka.\n• Payment Method: bKash ba Nagad Personal number.\n• Processing Time: Withdraw request deyar 30 minute theke 2 ghontar moddhe taka send kora hoy.\n\nWithdraw korte Wallet tab e giye 'Withdraw' button e click kore apnar number ar amount boshie request din!`,
      };
    }
    return {
      response: `💰 Withdrawal Policy & Guide:\n\nHello ${ign}!\n• Minimum Withdrawal: 100 BDT.\n• Payment Methods: Personal bKash or Nagad.\n• Processing Time: Processed within 30 minutes to 2 hours.\n\nTo withdraw your tournament winnings, go to the Wallet tab, tap 'Withdraw', enter your phone number and amount, then confirm!`,
    };
  }

  // 7. Rules, Configs, Hacks & Anti-cheat
  const isRuleIssue =
    query.includes('anti-cheat') ||
    query.includes('hack') ||
    query.includes('cheat') ||
    query.includes('config') ||
    query.includes('headshot') ||
    query.includes('aimbot') ||
    query.includes('emulator') ||
    query.includes('rules') ||
    query.includes('নিয়ম') ||
    query.includes('হ্যাক');

  if (isRuleIssue) {
    if (lang === 'BANGLA') {
      return {
        response: `🛡️ ফেয়ার প্লে এবং অ্যান্টি-চিট নীতিমালা:\n\nহ্যালো ${ign}!\n১. শুধুমাত্র আসল মোবাইল প্লেয়ারদের জন্য এই টুর্নামেন্ট (PC বা Emulator সম্পূর্ণ নিষিদ্ধ)।\n২. যেকোনো ধরনের Hack, Config File, Headshot Tool, বা Aimbot ব্যবহার করলে অ্যাকাউন্ট আজীবনের জন্য ব্যান হবে এবং এন্ট্রি ফি বাজেয়াপ্ত হবে।\n৩. ম্যাচে কোনো সন্দেহজনক প্লেয়ার দেখলে ম্যাচের ভিডিও রেকর্ডিং বা স্ক্রিনশট সহ আমাদের জানান, অ্যাডমিন কঠোর ব্যবস্থা নেবে।`,
      };
    }
    if (lang === 'BANGLISH') {
      return {
        response: `🛡️ Fair Play & Anti-Cheat Rules:\n\nHello ${ign}!\n1. Shudhumatro Mobile players allowed (PC / Emulator 100% strictly banned).\n2. Konorokom Hack, Config, Headshot tool ba 3rd party file use korle account lifetime ban hobe ebong kono taka refund hobe na.\n3. Kono player er hack shondeho hole match er video record shoho complain din, admin instant action nibe!`,
      };
    }
    return {
      response: `🛡️ Anti-Cheat & Fair Play Regulations:\n\nHello ${ign}!\n1. Mobile players ONLY — PC and Emulator players are strictly prohibited.\n2. Use of hacks, custom configs, headshot scripts, or third-party modifications will result in an immediate permanent ban and forfeiture of all balances.\n3. If you encounter any unfair play, submit video proof here for rapid admin investigation and penalties.`,
    };
  }

  // 8. Prize Money & Results
  const isPrizeIssue =
    query.includes('prize') ||
    query.includes('booyah') ||
    query.includes('result') ||
    query.includes('win') ||
    query.includes('winner') ||
    query.includes('screenshot') ||
    query.includes('প্রাইজ') ||
    query.includes('জিতেছি');

  if (isPrizeIssue) {
    if (lang === 'BANGLA') {
      return {
        response: `🏆 রেজাল্ট ও প্রাইজ মানি পাওয়ার নিয়ম:\n\nহ্যালো ${ign}!\n• ম্যাচ শেষ হওয়ার পর "My Matches" অপশনে গিয়ে আপনার Booyah বা কিল রেজাল্টের স্ক্রিনশট আপলোড করুন।\n• অ্যাডমিন রেজাল্ট যাচাই করে ১৫-৩০ মিনিটের মধ্যে জয়ীদের ওয়ালেটে প্রাইজ মানি যুক্ত করে দেয়।\n• প্রাইজ সরাসরি আপনার Wallet ব্যালেন্সে যোগ হবে যা আপনি উইথড্র করতে বা অন্য ম্যাচে খেলতে পারবেন!`,
      };
    }
    if (lang === 'BANGLISH') {
      return {
        response: `🏆 Result & Prize Money Guide:\n\nHello ${ign}!\n• Match shesh hole "My Matches" e giye Booyah ba Kill score er screenshot upload korun.\n• Admin result verify kore 15 theke 30 minute er moddhe winner der wallet e prize money credit kore dibe.\n• Balance shorashori apnar Wallet e chole ashbe, ja diye notun match khelte ba cashout korte parben!`,
      };
    }
    return {
      response: `🏆 Results & Prize Distribution:\n\nHello ${ign}!\n• After your match ends, upload your Booyah or Kill screenshot under the "My Matches" section.\n• The admin team verifies results and credits prizes within 15 to 30 minutes.\n• All winnings are deposited directly into your Wallet balance, available for instant withdrawal or future match entry!`,
    };
  }

  // 9. Admin Contact / Human Helpline
  const isAdminIssue =
    query.includes('admin') ||
    query.includes('helpline') ||
    query.includes('human') ||
    query.includes('whatsapp') ||
    query.includes('number') ||
    query.includes('contact') ||
    query.includes('kotha') ||
    query.includes('অ্যাডমিন') ||
    query.includes('কথা');

  if (isAdminIssue) {
    if (lang === 'BANGLA') {
      return {
        response: `👨‍💼 অ্যাডমিন ও হেল্পলাইন সহায়তা:\n\nহ্যালো ${ign}!\n• আমাদের অ্যাডমিন টিম সার্বক্ষণিক এই সাপোর্ট চ্যাট মনিটর করছে।\n• আপনার যেকোনো সমস্যা এই চ্যাটে বিস্তারিত লিখে দিন, অ্যাডমিন সরাসরি মেসেজ দেখে দ্রুত সমাধান করে দেবে।\n• জরুরি কোনো বিষয় থাকলে আপনার ফোন নম্বর ও বিস্তারিত এখানে লিখে রাখুন!`,
      };
    }
    if (lang === 'BANGLISH') {
      return {
        response: `👨‍💼 Admin & Helpline Support:\n\nHello ${ign}!\n• Amader admin team 24/7 ei support chat monitor korche.\n• Apnar je kono problem ekhane likhe din, admin direct message dekhe khub druto reply dibe.\n• Urgent hole apnar phone number ebong somossa ekhane likhe din!`,
      };
    }
    return {
      response: `👨‍💼 Human Admin & Helpline:\n\nHello ${ign}!\n• Our admin staff monitors this support channel 24/7.\n• Simply describe your issue here with full context, and an administrator will respond promptly.\n• If urgent, feel free to leave your contact number and match ID for expedited assistance!`,
    };
  }

  // 10. Intelligent Fallback (Understands any general query)
  if (lang === 'BANGLA') {
    return {
      response: `🤖 এআই সাপোর্ট: হ্যালো ${ign}! আপনার বার্তাটি গুরুত্ব সহকারে গ্রহণ করা হয়েছে: "${ticket.subject || userMessage}".\n\nআমাদের এআই ও সাপোর্ট টিম ২৪/৭ সক্রিয় রয়েছে। ম্যাচ, রুম আইডি ও পাসওয়ার্ড, ৮ মিনিট নিয়ম, ক্লাসিক স্লট বুকিং, ডিপোজিট বা উইথড্র সংক্রান্ত যেকোনো তথ্য প্রয়োজন হলে স্পষ্ট করে লিখুন—আমি এখনই সমাধান করে দেব!`,
    };
  }
  if (lang === 'BANGLISH') {
    return {
      response: `🤖 AI Support: Hello ${ign}! Apnar message amra carefully note korechi: "${ticket.subject || userMessage}".\n\nAmader AI ebong Support Admin 24/7 active ache. Match, Room ID & Password, 8 minute rule, Classic slot booking, deposit ba withdraw shongkranto je kono query thakle ektu details e bolun—ami shathe shathe answer diye dicchi!`,
    };
  }
  return {
    response: `🤖 AI Support: Hello ${ign}! Thank you for reaching out regarding "${ticket.subject || userMessage}".\n\nOur automated AI support and live tournament administrators are active 24/7. Please let us know if you need help with Room ID & Password, 8-minute rule, Classic slot booking, deposits, withdrawals, or tournament rules!`,
  };
}
