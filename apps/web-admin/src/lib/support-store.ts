'use client';

import { dispatchDevicePushNotification } from './match-scheduler';

export interface TicketMessage {
  id: string;
  senderRole: 'USER' | 'ADMIN';
  senderName: string;
  message: string;
  imageUrl?: string;
  timestamp: string;
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
    subject: 'বিকাশ ডিপোজিট ব্যালেন্সে যোগ হয়নি (TrxID: BKA89212)',
    category: 'PAYMENT',
    status: 'OPEN',
    priority: 'HIGH',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    messages: [
      {
        id: 'msg-1',
        senderRole: 'USER',
        senderName: 'BDX_STRIKER',
        message: 'ভাইয়া আমি ৫০০ টাকা বিকাশ করেছি ২০ মিনিট আগে। ট্রানজেকশন আইডি BKA89212। দ্রুত ব্যালেন্স দিন টুর্নামেন্ট খেলব।',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
  },
  {
    id: 't-102',
    userId: 'u-2',
    userPhone: '01899112233',
    userIgn: 'OP_NINJA_99',
    subject: 'ম্যাচের রুম আইডি পাসওয়ার্ডে সমস্যা হচ্ছে',
    category: 'MATCH',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    matchId: 'm-1',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    messages: [
      {
        id: 'msg-1',
        senderRole: 'USER',
        senderName: 'OP_NINJA_99',
        message: 'রুম পাসওয়ার্ড ১২৩৪ দিলে ইনভ্যালিড দেখাচ্ছে। দয়া করে সঠিক পাস দিন।',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'msg-2',
        senderRole: 'ADMIN',
        senderName: 'Admin Support',
        message: 'রুম পাসওয়ার্ড রিসেট করে ৫৫৬৬ দেওয়া হয়েছে। দ্রুত জয়েন করুন।',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
      },
    ],
  },
];

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
    '🎧 নতুন সাপোর্ট টিকেট জমা পড়েছে!',
    `[${data.category}] ${data.userIgn} (${data.userPhone}): "${data.subject}"`
  );

  return newTicket;
}

export function addTicketReply(
  ticketId: string,
  reply: {
    senderRole: 'USER' | 'ADMIN';
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
      '💬 অ্যাডমিন থেকে সাপোর্ট উত্তর এসেছে!',
      `আপনার টিকেট "${ticket.subject}" এর উত্তর দেওয়া হয়েছে: "${reply.message.slice(0, 80)}"`
    );
  } else {
    // Notify admin that user replied
    dispatchDevicePushNotification(
      '💬 ইউজারের নতুন সাপোর্ট মেসেজ!',
      `টিকেট #${ticket.id} (${ticket.userIgn}): "${reply.message.slice(0, 80)}"`
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
      '✅ সাপোর্ট টিকেট সম্পন্ন হয়েছে',
      `আপনার টিকেট #${ticket.id} (${ticket.subject}) সফলভাবে সমাধান (Resolved) করা হয়েছে।`
    );
  }

  return true;
}
