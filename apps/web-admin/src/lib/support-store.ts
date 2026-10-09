'use client';

import { dispatchDevicePushNotification } from './match-scheduler';

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
}

const SUPPORT_TICKETS_KEY = 'ff_support_tickets_v1';

export const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 't-101',
    userId: 'u-1',
    userPhone: '01712345678',
    userIgn: 'BDX_STRIKER',
    subject: 'bKash Deposit not reflected in balance (TrxID: BKA89212)',
    category: 'PAYMENT',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3500000).toISOString(),
    messages: [
      {
        id: 'msg-1',
        senderRole: 'USER',
        senderName: 'BDX_STRIKER',
        message: 'Hello, I deposited 500 BDT via bKash 20 minutes ago. Transaction ID is BKA89212. Please add to my balance.',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'msg-1-ai',
        senderRole: 'AI_BOT',
        senderName: 'AI Support',
        isAi: true,
        message: 'Hello BDX_STRIKER! 🤖 I am AI Support. Your bKash deposit with TrxID "BKA89212" is currently queued in verification. Manual deposits are credited within 5-15 minutes once verified by our finance desk.',
        timestamp: new Date(Date.now() - 3500000).toISOString(),
      },
    ],
  },
  {
    id: 't-102',
    userId: 'u-2',
    userPhone: '01899112233',
    userIgn: 'OP_NINJA_99',
    subject: 'Room ID & Password issue for match #42',
    category: 'MATCH',
    status: 'RESOLVED',
    priority: 'MEDIUM',
    matchId: 'm-1',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    messages: [
      {
        id: 'msg-2',
        senderRole: 'USER',
        senderName: 'OP_NINJA_99',
        message: 'Room password showed invalid when entered. Please provide the correct room pass.',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'msg-2-ai',
        senderRole: 'AI_BOT',
        senderName: 'AI Support',
        isAi: true,
        message: 'Hello OP_NINJA_99! 🤖 Room credentials are refreshed automatically under the "My Matches" tab. Our supervisor updated the password to 5566.',
        timestamp: new Date(Date.now() - 7100000).toISOString(),
      },
      {
        id: 'msg-3',
        senderRole: 'ADMIN',
        senderName: 'Admin Supervisor',
        message: 'Room password reset to 5566. Please join custom room immediately.',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
      },
    ],
  },
];

/**
 * Generates an intelligent, contextual AI response tailored for Free Fire tournament issues
 */
export function generateAiSupportResponse(
  userQuery: string,
  category: 'PAYMENT' | 'MATCH' | 'ACCOUNT' | 'OTHER',
  subject: string,
  ign: string = 'Player'
): string {
  const q = (userQuery + ' ' + subject).toLowerCase();

  // Payment / Deposit / TrxID
  if (
    category === 'PAYMENT' ||
    q.includes('bkash') ||
    q.includes('nagad') ||
    q.includes('deposit') ||
    q.includes('trx') ||
    q.includes('টাকা') ||
    q.includes('ব্যালেন্স') ||
    q.includes('পেমেন্ট')
  ) {
    return `Hello ${ign}! 🤖 AI Support here.

We noticed your payment query regarding "${subject}".
• Deposit Verification: Manual bKash/Nagad deposits are verified within 5 to 15 minutes.
• Please ensure the Transaction ID (TrxID) and sender number match your confirmation SMS exactly.
• If verified, your balance will reflect immediately. Our admin desk has also been alerted!`;
  }

  // Room ID / Password / Match Join
  if (
    category === 'MATCH' ||
    q.includes('room') ||
    q.includes('pass') ||
    q.includes('id') ||
    q.includes('রুম') ||
    q.includes('পাসওয়ার্ড') ||
    q.includes('start') ||
    q.includes('join')
  ) {
    return `Hello ${ign}! 🤖 AI Support here.

Regarding match access for "${subject}":
• Room ID & Password are automatically delivered to your registered match card under "My Matches" 10 to 15 minutes before match start.
• When the status displays "ROOM OPEN", click "View Room ID & Password".
• Please enter the custom room within 5 minutes to secure your slot.`;
  }

  // Withdrawal / Payout
  if (
    q.includes('withdraw') ||
    q.includes('উইথড্র') ||
    q.includes('ক্যাশআউট') ||
    q.includes('টাকা তোলা') ||
    q.includes('payout')
  ) {
    return `Hello ${ign}! 🤖 AI Support here.

Regarding your withdrawal request:
• All verified withdrawals are processed within 1 to 2 hours directly to your designated bKash or Nagad personal wallet.
• Minimum withdrawal is 100 BDT. You will receive an automatic push notification once payout completes.`;
  }

  // Slots / Squad booking
  if (
    q.includes('slot') ||
    q.includes('squad') ||
    q.includes('স্লট') ||
    q.includes('team') ||
    q.includes('স্কোয়াড')
  ) {
    return `Hello ${ign}! 🤖 AI Support here.

Regarding slot bookings:
• Solo & Duo matches: Your slot is assigned automatically upon registration with your Free Fire UID and IGN.
• Squad matches: You can select any vacant slot (1–12) during registration.
• Remember to sit in your exact designated slot in the custom lobby.`;
  }

  // Cheating / Hacks / Anti-Cheat
  if (
    q.includes('hack') ||
    q.includes('cheat') ||
    q.includes('হ্যাক') ||
    q.includes('চিটার') ||
    q.includes('ban') ||
    q.includes('emulator')
  ) {
    return `Hello ${ign}! 🤖 AI Support here.

🛡️ Fair Play & Anti-Cheat Notice:
• Emulators, config files, and 3rd-party mods are strictly prohibited and auto-detected.
• If you are reporting a suspect, please attach a screenshot or video link. Violators face permanent bans and prize forfeit.`;
  }

  // General fallback
  return `Hello ${ign}! 🤖 I am your 24/7 AI Support Assistant.

We have received your ticket regarding: "${subject}".
Our automated tournament management system has recorded this request, and a human supervisor has been notified. We will update you here shortly!`;
}

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
    const raw = localStorage.getItem(SUPPORT_TICKETS_KEY);
    if (!raw) {
      localStorage.setItem(SUPPORT_TICKETS_KEY, JSON.stringify(INITIAL_TICKETS));
      return INITIAL_TICKETS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_TICKETS;
  }
}

export function saveSupportTickets(list: SupportTicket[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SUPPORT_TICKETS_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('ff_support_tickets_updated', { detail: list }));
  } catch (e) {}
}

export function getUserTickets(userId: string, userPhone?: string): SupportTicket[] {
  const all = getSupportTickets();
  return all.filter((t) => t.userId === userId || (userPhone && t.userPhone === userPhone));
}

/**
 * Triggers automated AI Bot reply after a realistic delay (e.g. 500ms)
 */
export function scheduleAiSupportReply(
  ticketId: string,
  userMessage: string,
  category: 'PAYMENT' | 'MATCH' | 'ACCOUNT' | 'OTHER',
  subject: string,
  userIgn: string
): void {
  if (typeof window === 'undefined') return;

  setTimeout(() => {
    const all = getSupportTickets();
    const ticketIndex = all.findIndex((t) => t.id === ticketId);
    if (ticketIndex === -1) return;

    const ticket = all[ticketIndex];
    const aiMessageText = generateAiSupportResponse(userMessage, category, subject, userIgn);
    const now = new Date().toISOString();

    const aiMsg: TicketMessage = {
      id: 'msg-ai-' + Date.now(),
      senderRole: 'AI_BOT',
      senderName: 'AI Support',
      message: aiMessageText,
      timestamp: now,
      isAi: true,
    };

    const updatedTicket: SupportTicket = {
      ...ticket,
      updatedAt: now,
      status: ticket.status === 'RESOLVED' ? 'RESOLVED' : 'IN_PROGRESS',
      messages: [...ticket.messages, aiMsg],
    };

    all[ticketIndex] = updatedTicket;
    saveSupportTickets(all);

    playSupportAlertSound();

    dispatchDevicePushNotification(
      '🤖 AI Support Replied',
      `Ticket #${ticket.id}: ${aiMessageText.slice(0, 90)}...`
    );
  }, 600);
}

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

  const newTicket: SupportTicket = {
    id: 't-' + Date.now().toString().slice(-6),
    userId: data.userId,
    userPhone: data.userPhone,
    userIgn: data.userIgn,
    subject: data.subject.trim(),
    category: data.category,
    status: 'OPEN',
    priority: data.priority || 'MEDIUM',
    matchId: data.matchId,
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: 'msg-' + Date.now(),
        senderRole: 'USER',
        senderName: data.userIgn || data.userPhone,
        message: data.message.trim(),
        imageUrl: data.imageUrl,
        timestamp: now,
      },
    ],
  };

  const updated = [newTicket, ...all];
  saveSupportTickets(updated);

  // Play audio sound and notify admin
  playSupportAlertSound();
  dispatchDevicePushNotification(
    '🎧 New Support Ticket Received',
    `[${data.category}] ${data.userIgn} (${data.userPhone}): "${data.subject}"`
  );

  // Automatically trigger AI Support Bot instant reply!
  scheduleAiSupportReply(
    newTicket.id,
    data.message,
    data.category,
    data.subject,
    data.userIgn
  );

  return newTicket;
}

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
  const ticketIndex = all.findIndex((t) => t.id === ticketId);
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

  const updatedTicket: SupportTicket = {
    ...ticket,
    updatedAt: now,
    status: reply.senderRole === 'ADMIN' ? 'IN_PROGRESS' : ticket.status,
    messages: [...ticket.messages, newMsg],
  };

  all[ticketIndex] = updatedTicket;
  saveSupportTickets(all);

  playSupportAlertSound();

  if (reply.senderRole === 'ADMIN') {
    // Notify player that admin replied
    dispatchDevicePushNotification(
      '💬 Admin Support Response',
      `Ticket "${ticket.subject}": "${reply.message.slice(0, 80)}"`
    );
  } else if (reply.senderRole === 'USER') {
    // Notify admin that user replied
    dispatchDevicePushNotification(
      '💬 User Support Message',
      `Ticket #${ticket.id} (${ticket.userIgn}): "${reply.message.slice(0, 80)}"`
    );

    // Automatically trigger AI Support Bot reply for the user query!
    scheduleAiSupportReply(
      ticket.id,
      reply.message,
      ticket.category,
      ticket.subject,
      ticket.userIgn
    );
  }

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

  return true;
}
