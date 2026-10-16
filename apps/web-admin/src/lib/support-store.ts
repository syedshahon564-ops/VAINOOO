'use client';

import { dispatchDevicePushNotification } from './match-scheduler';
import { addBalance } from './user-store';

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

const SUPPORT_TICKETS_KEY = 'ff_support_tickets_v2';
const ZERO_RESET_KEY = 'ff_support_tickets_zero_v3';
const CREDITED_TICKETS_KEY = 'ff_credited_ai_tickets_v1';

// Initial tickets are strictly 0 (Clean Slate, no mock tickets)
export const INITIAL_TICKETS: SupportTicket[] = [];

/**
 * Synthesizes a distinctive alert chime for incoming support tickets
 */
export function playSupportAlertSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Chime notes: F5 -> A5 -> C6
    const now = ctx.currentTime;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(698.46, now);
    osc.frequency.setValueAtTime(880.0, now + 0.12);
    osc.frequency.setValueAtTime(1046.5, now + 0.24);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.start(now);
    osc.stop(now + 0.5);
  } catch (e) {}
}

export function getSupportTickets(): SupportTicket[] {
  if (typeof window === 'undefined') return INITIAL_TICKETS;
  try {
    // One-time cleanup to zero out old mock tickets (t-101, t-102)
    if (!localStorage.getItem(ZERO_RESET_KEY)) {
      localStorage.removeItem('ff_support_tickets_v1');
      localStorage.setItem(SUPPORT_TICKETS_KEY, JSON.stringify([]));
      localStorage.setItem(ZERO_RESET_KEY, '1');
      return [];
    }

    const raw = localStorage.getItem(SUPPORT_TICKETS_KEY);
    if (!raw) {
      localStorage.setItem(SUPPORT_TICKETS_KEY, JSON.stringify(INITIAL_TICKETS));
      return INITIAL_TICKETS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return INITIAL_TICKETS;
  }
}

export function saveSupportTickets(list: SupportTicket[], broadcast = true): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SUPPORT_TICKETS_KEY, JSON.stringify(list));
    if (broadcast) {
      window.dispatchEvent(new CustomEvent('ff_support_tickets_updated', { detail: list }));
    }
  } catch (e) {}
}

/**
 * Synchronizes support tickets with the central server (/api/support/tickets)
 */
export async function syncSupportTicketsFromServer(
  userId?: string,
  userPhone?: string
): Promise<SupportTicket[]> {
  try {
    let url = '/api/support/tickets';
    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    if (userPhone) params.set('userPhone', userPhone);
    const qs = params.toString();
    if (qs) url += '?' + qs;

    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.tickets)) {
        const serverTickets: SupportTicket[] = data.tickets;

        if (!userId && !userPhone) {
          saveSupportTickets(serverTickets, true);
        }

        // Check if any tickets have AI-verified payments that need wallet credit
        handleAiAutoCredits(serverTickets);

        return serverTickets;
      }
    }
  } catch (e) {}
  return getSupportTickets();
}

function handleAiAutoCredits(tickets: SupportTicket[]) {
  if (typeof window === 'undefined') return;
  try {
    const creditedRaw = localStorage.getItem(CREDITED_TICKETS_KEY) || '[]';
    const creditedSet = new Set<string>(JSON.parse(creditedRaw));

    for (const t of tickets) {
      if (t.paymentVerified && t.verifiedAmount && !creditedSet.has(t.id)) {
        creditedSet.add(t.id);
        addBalance(
          t.userId,
          t.verifiedAmount,
          `AI Auto-Verified Deposit (TrxID: ${t.verifiedTrxId || 'PROOF'})`
        );
        dispatchDevicePushNotification(
          '🤖 Payment Auto-Verified by AI',
          `৳${t.verifiedAmount} has been instantly credited to your wallet (TrxID: ${t.verifiedTrxId || 'OK'})`
        );
      }
    }
    localStorage.setItem(CREDITED_TICKETS_KEY, JSON.stringify(Array.from(creditedSet)));
  } catch (e) {}
}

export function getUserTickets(userId: string, userPhone?: string): SupportTicket[] {
  const all = getSupportTickets();
  return all.filter((t) => t.userId === userId || (userPhone && t.userPhone === userPhone));
}

export function detectClientLanguage(text: string): 'BANGLA' | 'BANGLISH' | 'ENGLISH' {
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

export function generateClientAiResponse(
  ticket: Partial<SupportTicket>,
  userMessage: string,
  imageUrl?: string
): { response: string; paymentVerified?: boolean; verifiedTrxId?: string; verifiedAmount?: number } {
  const query = (userMessage + ' ' + (ticket.subject || '')).toLowerCase();
  const ign = ticket.userIgn || 'Player';
  const lang = detectClientLanguage(userMessage + ' ' + (ticket.subject || ''));

  // 1. Greetings & Social Chitchat
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

  // 2. Deposit / Payment / TrxID inquiries
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
          paymentVerified: false,
          verifiedTrxId: trxId,
          verifiedAmount: detectedAmount,
          response: `🤖 এআই সাপোর্ট: পেমেন্ট প্রমাণপত্র সফলভাবে গৃহীত হয়েছে! 📋\n\nহ্যালো ${ign}! আমরা আপনার পেমেন্ট প্রমাণ (TrxID: ${trxId}, ৳${detectedAmount}) সাপোর্ট সিস্টেমে রেকর্ড করেছি।\n\n• বর্তমান স্ট্যাটাস: পর্যালোচনায় রয়েছে (Pending Admin Approval)\n• নোট: ট্রানজেকশন সফলভাবে যাচাই হওয়ার পর আপনার ওয়ালেটে ব্যালেন্স স্বয়ংক্রিয়ভাবে ক্রেডিট হয়ে যাবে। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন!`,
        };
      }
      if (lang === 'BANGLISH') {
        return {
          paymentVerified: false,
          verifiedTrxId: trxId,
          verifiedAmount: detectedAmount,
          response: `🤖 AI Support: Payment Proof Successfully Received! 📋\n\nHello ${ign}! Apnar dewa TrxID (${trxId}) ebong ৳${detectedAmount} Takar payment proof amader system e record kora hoyeche.\n\n• Current Status: Under Review (Pending Admin Verification)\n• Note: Admin transaction verify korar por apnar wallet e balance update kore dibe. Ektu opekkha korun!`,
        };
      }
      return {
        paymentVerified: false,
        verifiedTrxId: trxId,
        verifiedAmount: detectedAmount,
        response: `🤖 AI Support: Payment Proof Received! 📋\n\nHello ${ign}! We have recorded your payment proof (TrxID: ${trxId}, ৳${detectedAmount}).\n\n• Status: Under Admin Review\n• Note: Once confirmed against official SMS records, your wallet balance will be updated promptly!`,
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

  // 3. Match / Room ID & Password + 8-Minute Auto-Expiry Rule
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

  // 4. Slot System (Classic Solo 48, Classic Duo 24, Squad 12)
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
        response: `🎯 Slot Selection System:\n\nHello ${ign}!\n• Classic Solo: 1 theke 48 number porjonto je kono khali slot nijer pochondo moto select korte parben.\n• Classic Duo: 1 theke 24 number porjonto team slot select korte parben (2 Jon player per team).\n• Squad Match: 1 theke 12 number porjonto squad slot select korte parben (4 Jon player per squad).\n• Onno Match (Clash Squad, Lone Wolf, etc.): Ete manual slot grid nei, join korlei auto serial slot assign hoye jay.\n\n📌 Room khulley obosshoi apnar booking kora slot e boshben!`,
      };
    }
    return {
      response: `🎯 Slot Selection System:\n\nHello ${ign}!\n• Classic Solo: Choose any free slot from #1 to #48.\n• Classic Duo: Choose any team slot from #1 to #24 (2 players per team).\n• Squad Matches: Choose any team slot from #1 to #12 (4 players per squad).\n• Other Modes (CS, Lone Wolf): Slots are assigned automatically upon entry.\n\nPlease strictly sit in your designated slot inside the Free Fire custom lobby!`,
    };
  }

  // 5. Withdrawal / Cashout
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

  // 6. Rules, Configs, Hacks & Anti-cheat
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

  // 7. Prize Money & Results
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

  // 8. Admin Contact / Human Helpline
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

  // 9. Intelligent Fallback (Understands any general query)
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

/**
 * Creates a support ticket and syncs to backend API with instant AI bot response
 */
export function createSupportTicket(data: {
  userId: string;
  userPhone: string;
  userIgn: string;
  subject: string;
  category: 'PAYMENT' | 'MATCH' | 'ACCOUNT' | 'OTHER';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  matchId?: string;
  message: string;
  imageUrl?: string;
}): SupportTicket {
  const all = getSupportTickets();
  const now = new Date().toISOString();
  const tempId = 't-' + Date.now().toString().slice(-6);

  // Generate instant AI Response
  const aiResult = generateClientAiResponse(data, data.message, data.imageUrl);
  const aiMessage: TicketMessage = {
    id: 'msg-ai-' + (Date.now() + 10),
    senderRole: 'AI_BOT',
    senderName: 'AI Support',
    isAi: true,
    message: aiResult.response,
    timestamp: new Date(Date.now() + 300).toISOString(),
  };

  const newTicket: SupportTicket = {
    id: tempId,
    userId: data.userId,
    userPhone: data.userPhone,
    userIgn: data.userIgn,
    subject: data.subject.trim(),
    category: data.category,
    status: aiResult.paymentVerified ? 'RESOLVED' : 'OPEN',
    priority: aiResult.paymentVerified ? 'HIGH' : data.priority || 'MEDIUM',
    matchId: data.matchId,
    createdAt: now,
    updatedAt: now,
    paymentVerified: aiResult.paymentVerified,
    verifiedTrxId: aiResult.verifiedTrxId,
    verifiedAmount: aiResult.verifiedAmount,
    messages: [
      {
        id: 'msg-' + Date.now(),
        senderRole: 'USER',
        senderName: data.userIgn || data.userPhone,
        message: data.message.trim(),
        imageUrl: data.imageUrl,
        timestamp: now,
      },
      aiMessage,
    ],
  };

  const updated = [newTicket, ...all];
  saveSupportTickets(updated);

  playSupportAlertSound();
  dispatchDevicePushNotification(
    '🎧 New Support Ticket Received',
    `[${data.category}] ${data.userIgn} (${data.userPhone}): "${data.subject}"`
  );

  if (newTicket.paymentVerified && newTicket.verifiedAmount) {
    handleAiAutoCredits([newTicket]);
  }

  // Background sync with server route
  fetch('/api/support/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, id: tempId }),
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((resData) => {
      if (resData && resData.ok && resData.ticket) {
        const serverTicket: SupportTicket = resData.ticket;
        const currentList = getSupportTickets();
        const replaced = currentList.map((t) => (t.id === tempId ? serverTicket : t));
        saveSupportTickets(replaced);

        if (serverTicket.paymentVerified && serverTicket.verifiedAmount) {
          handleAiAutoCredits([serverTicket]);
        }
      }
    })
    .catch(() => {});

  return newTicket;
}

/**
 * Adds a reply to a support ticket and syncs to backend API with instant AI bot reply
 */
export function addTicketReply(
  ticketId: string,
  reply: {
    senderRole: 'USER' | 'ADMIN' | 'AI_BOT';
    senderName: string;
    message: string;
    imageUrl?: string;
  }
): SupportTicket | null {
  const all = getSupportTickets();
  let ticketIndex = all.findIndex((t) => t.id === ticketId);

  // Robust fallback: if ticketId changed due to server sync or prefix, find by latest ticket or partial ID
  if (ticketIndex === -1 && all.length > 0) {
    ticketIndex = all.findIndex((t) => t.id.includes(ticketId.slice(-4)) || ticketId.includes(t.id.slice(-4)));
    if (ticketIndex === -1) {
      ticketIndex = 0; // Fallback to user's most recent ticket
    }
  }

  if (ticketIndex === -1) return null;

  const ticket = all[ticketIndex];
  const now = new Date().toISOString();

  const newMsg: TicketMessage = {
    id: 'msg-' + Date.now(),
    senderRole: reply.senderRole,
    senderName: reply.senderName,
    message: reply.message.trim(),
    imageUrl: reply.imageUrl,
    timestamp: now,
    isAi: reply.senderRole === 'AI_BOT',
  };

  const msgs = [...ticket.messages, newMsg];
  let finalStatus = ticket.status;
  let paymentVerified = ticket.paymentVerified;
  let verifiedTrxId = ticket.verifiedTrxId;
  let verifiedAmount = ticket.verifiedAmount;

  // If user sent the message, automatically generate instant AI Bot reply!
  if (reply.senderRole === 'USER') {
    const aiResult = generateClientAiResponse(ticket, reply.message, reply.imageUrl);
    const aiMsg: TicketMessage = {
      id: 'msg-ai-' + (Date.now() + 50),
      senderRole: 'AI_BOT',
      senderName: 'AI Support',
      isAi: true,
      message: aiResult.response,
      timestamp: new Date(Date.now() + 400).toISOString(),
    };
    msgs.push(aiMsg);

    if (aiResult.paymentVerified) {
      finalStatus = 'RESOLVED';
      paymentVerified = true;
      verifiedTrxId = aiResult.verifiedTrxId;
      verifiedAmount = aiResult.verifiedAmount;
    }
  } else if (reply.senderRole === 'ADMIN') {
    finalStatus = 'IN_PROGRESS';
  }

  const updatedTicket: SupportTicket = {
    ...ticket,
    updatedAt: now,
    status: finalStatus,
    paymentVerified,
    verifiedTrxId,
    verifiedAmount,
    messages: msgs,
  };

  all[ticketIndex] = updatedTicket;
  saveSupportTickets(all);
  playSupportAlertSound();

  if (updatedTicket.paymentVerified && updatedTicket.verifiedAmount) {
    handleAiAutoCredits([updatedTicket]);
  }

  if (reply.senderRole === 'ADMIN') {
    dispatchDevicePushNotification(
      '💬 Admin Support Response',
      `Ticket "${ticket.subject}": "${reply.message.slice(0, 80)}"`
    );
  }

  // Push to server API in background
  fetch('/api/support/tickets', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticketId, reply }),
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((resData) => {
      if (resData && resData.ok && resData.ticket) {
        const serverTicket: SupportTicket = resData.ticket;
        const currentList = getSupportTickets();
        const idx = currentList.findIndex((t) => t.id === ticketId);
        if (idx !== -1) {
          currentList[idx] = serverTicket;
          saveSupportTickets(currentList);
          if (serverTicket.paymentVerified) {
            handleAiAutoCredits([serverTicket]);
          }
        }
      }
    })
    .catch(() => {});

  return updatedTicket;
}

export function updateTicketStatus(
  ticketId: string,
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
): boolean {
  const all = getSupportTickets();
  const ticketIndex = all.findIndex((t) => t.id === ticketId);
  if (ticketIndex === -1) return false;

  const ticket = all[ticketIndex];
  ticket.status = status;
  ticket.updatedAt = new Date().toISOString();
  saveSupportTickets(all);

  if (status === 'RESOLVED') {
    dispatchDevicePushNotification(
      '✅ Support Ticket Resolved',
      `Ticket #${ticket.id} (${ticket.subject}) has been successfully resolved.`
    );
  }

  // Sync to server
  fetch('/api/support/tickets', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticketId, status }),
  }).catch(() => {});

  return true;
}

/**
 * Resets all tickets to 0 both locally and on server
 */
export async function resetAllSupportTickets(): Promise<boolean> {
  try {
    await fetch('/api/support/tickets?all=true', { method: 'DELETE' });
  } catch (e) {}
  saveSupportTickets([]);
  return true;
}

/**
 * Deletes a single support ticket
 */
export async function deleteSupportTicket(ticketId: string): Promise<boolean> {
  try {
    await fetch(`/api/support/tickets?id=${ticketId}`, { method: 'DELETE' });
  } catch (e) {}
  const all = getSupportTickets().filter((t) => t.id !== ticketId);
  saveSupportTickets(all);
  return true;
}

/**
 * Retrieves the persistent, continuous live support chat conversation for the user,
 * preserving all previous chat history across sessions and initializing with a warm AI greeting.
 */
export function getOrCreateUserConversation(user?: { id?: string; phone?: string; ign?: string } | null): SupportTicket {
  const all = getSupportTickets();
  const userId = user?.id || 'u-guest';
  const userPhone = user?.phone || '01700000000';
  const userIgn = user?.ign || 'Player';

  // 1. Look for existing conversation for this user
  let conv = all.find(
    (t) => t.userId === userId || (userPhone && userPhone !== '01700000000' && t.userPhone === userPhone)
  );

  // 2. If guest and any ticket exists, use the latest one
  if (!conv && userId === 'u-guest' && all.length > 0) {
    conv = all[0];
  }

  // 3. If none exists, create the initial persistent conversation
  if (!conv) {
    const now = new Date().toISOString();
    const cleanId = 'chat-' + (userId.replace(/[^a-zA-Z0-9]/g, '') || 'player') + '-' + Date.now().toString().slice(-4);
    conv = {
      id: cleanId,
      userId,
      userPhone,
      userIgn,
      subject: '24/7 Live Support Chat',
      category: 'OTHER',
      status: 'OPEN',
      priority: 'MEDIUM',
      createdAt: now,
      updatedAt: now,
      messages: [
        {
          id: 'msg-welcome-' + Date.now(),
          senderRole: 'AI_BOT',
          senderName: 'AI Support',
          isAi: true,
          message: `🤖 হ্যালো ${userIgn}! FF RIVAL TOUR BD-এর অফিসিয়াল ২৪/৭ লাইভ সাপোর্ট চ্যাটে স্বাগতম।\n\nটুর্নামেন্ট, ম্যাচ রুম আইডি ও পাসওয়ার্ড (৮ মিনিট নিয়ম), ক্লাসিক সোলো/ডুয়ো স্লট বুকিং, বিকাশ/নগদ ডিপোজিট বা উইথড্র—যেকোনো প্রশ্ন করুন, আমি সাথে সাথে সমাধান দিচ্ছি!`,
          timestamp: now,
        },
      ],
    };
    all.unshift(conv);
    saveSupportTickets(all);

    // Sync initial ticket to server API in background
    fetch('/api/support/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: cleanId,
        userId,
        userPhone,
        userIgn,
        subject: conv.subject,
        category: conv.category,
        message: conv.messages[0].message,
      }),
    }).catch(() => {});
  }

  return conv;
}

