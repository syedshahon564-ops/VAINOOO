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

/**
 * Creates a support ticket and syncs to backend API
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
  const newTicket: SupportTicket = {
    id: tempId,
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

  playSupportAlertSound();
  dispatchDevicePushNotification(
    '🎧 New Support Ticket Received',
    `[${data.category}] ${data.userIgn} (${data.userPhone}): "${data.subject}"`
  );

  // Background sync with server route which executes AI rules & payment auto-verification
  fetch('/api/support/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
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
 * Adds a reply to a support ticket and syncs to backend API
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
    dispatchDevicePushNotification(
      '💬 Admin Support Response',
      `Ticket "${ticket.subject}": "${reply.message.slice(0, 80)}"`
    );
  }

  // Push to server API
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
