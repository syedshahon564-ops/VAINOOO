'use client';

import { useState, useEffect } from 'react';
import { dispatchDevicePushNotification } from './match-scheduler';

export interface PaymentRequest {
  id: string;
  userId: string;
  userPhone: string;
  userName?: string;
  type: 'DEPOSIT' | 'WITHDRAW';
  method: 'BKASH' | 'NAGAD' | 'ROCKET';
  amount: number;
  accountNumber: string; // sender number for deposit, receiver number for withdraw
  trxId?: string; // for deposit
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt?: string;
  adminNote?: string;
  autoVerified?: boolean;
}

export interface UserMatchRecord {
  id: string;
  matchTitle: string;
  category: string;
  date: string;
  slotNumber: number;
  kills: number;
  rank: number;
  isBooyah: boolean;
  prizeEarned: number;
}

export interface UserAccount {
  id: string;
  phone: string;
  ign: string;
  uid: string;
  password: string;
  walletBalance: number;
  role: 'PLAYER' | 'ADMIN' | 'SUPERVISOR';
  status: 'ACTIVE' | 'BANNED' | 'SUSPENDED';
  matchesPlayed: number;
  totalKills: number;
  totalWins: number;
  totalEarnings?: number;
  createdAt: string;
  username?: string;
  email?: string;
  deviceId?: string;
  avatar?: string;
  notes?: string;
  matchHistory?: UserMatchRecord[];
  updatedAt?: string;
}

export interface BalanceTransaction {
  id: string;
  userId: string;
  userPhone: string;
  userIgn: string;
  type: 'CREDIT' | 'DEBIT'; // CREDIT = + Add, DEBIT = - Deduct
  amount: number;
  reason: string;
  balanceAfter: number;
  timestamp: string;
  category?: 'match_winning' | 'deposit' | 'withdraw' | 'manual_adjustment' | string;
  referenceId?: string;
  status?: 'completed' | 'pending' | 'failed' | string;
}

const USERS_STORAGE_KEY = 'ff_esports_users_db_v4';
const TRANSACTIONS_STORAGE_KEY = 'ff_esports_balance_tx_v2';

export const DEFAULT_AVATARS = [
  '/avatars/avatar-1.png',
  '/avatars/avatar-2.png',
  '/avatars/avatar-3.png',
  '/avatars/avatar-4.png',
  '/avatars/avatar-5.png',
];

export const INITIAL_USERS: UserAccount[] = [
  // 1. Master Owner Account
  {
    id: 'u-owner-main',
    phone: '01700000000',
    ign: 'OWNER_MAIN',
    uid: '100000000',
    password: 'admin123',
    walletBalance: 50000.0,
    role: 'ADMIN',
    status: 'ACTIVE',
    matchesPlayed: 0,
    totalKills: 0,
    totalWins: 0,
    totalEarnings: 0,
    createdAt: '2026-09-01T00:00:00Z',
    avatar: '/logo.png',
    notes: 'Master Platform Owner & Administrator.',
  },
  // 2. Vaino Esports Owner Account
  {
    id: 'u-owner-vaino',
    phone: '01911000000',
    ign: 'VAINO_OWNER',
    uid: '200000000',
    password: 'owner123',
    walletBalance: 25000.0,
    role: 'ADMIN',
    status: 'ACTIVE',
    matchesPlayed: 0,
    totalKills: 0,
    totalWins: 0,
    totalEarnings: 0,
    createdAt: '2026-09-01T00:00:00Z',
    avatar: '/logo.png',
    notes: 'Official Vaino Esports Owner Account.',
  },
  // 3. Tour BD Operations Owner Account
  {
    id: 'u-owner-tourbd',
    phone: '01822000000',
    ign: 'TOUR_OWNER',
    uid: '300000000',
    password: 'owner123',
    walletBalance: 15000.0,
    role: 'ADMIN',
    status: 'ACTIVE',
    matchesPlayed: 0,
    totalKills: 0,
    totalWins: 0,
    totalEarnings: 0,
    createdAt: '2026-09-01T00:00:00Z',
    avatar: '/logo.png',
    notes: 'FF Rival Tour BD Operations Owner.',
  },
];

export const INITIAL_TRANSACTIONS: BalanceTransaction[] = [];

// 1ms Real-Time Sync Bus across tabs, iframes & windows
let userSyncChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    userSyncChannel = new BroadcastChannel('ff_users_sync_bus');
    userSyncChannel.onmessage = (event) => {
      if (event?.data?.type === 'USERS_UPDATED' && Array.isArray(event.data.users)) {
        try {
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(event.data.users));
        } catch (e) {}
        const currentLoggedStr = localStorage.getItem('ff_user') || getCookieUser();
        if (currentLoggedStr) {
          const current = typeof currentLoggedStr === 'string' ? JSON.parse(currentLoggedStr) : currentLoggedStr;
          const found = event.data.users.find(
            (u: any) => u && (u.id === current.id || (u.phone && current.phone && u.phone === current.phone))
          );
          if (found) {
            saveSession(found);
            window.dispatchEvent(new CustomEvent('ff_user_profile_updated', { detail: found }));
          }
        }
        window.dispatchEvent(new CustomEvent('ff_users_updated', { detail: event.data.users }));
      } else if (event?.data?.type === 'USER_PROFILE_UPDATED' && event.data.user) {
        const u = event.data.user;
        const currentLoggedStr = localStorage.getItem('ff_user') || getCookieUser();
        if (currentLoggedStr) {
          const current = typeof currentLoggedStr === 'string' ? JSON.parse(currentLoggedStr) : currentLoggedStr;
          if (u.id === current.id || (u.phone && current.phone && u.phone === current.phone)) {
            saveSession(u);
            window.dispatchEvent(new CustomEvent('ff_user_profile_updated', { detail: u }));
          }
        }
        window.dispatchEvent(new CustomEvent('ff_users_updated', { detail: getUsers() }));
      }
    };
  } catch (e) {}
}

// Helper to notify other components/tabs in 1ms
function notifyUsersChange(users: UserAccount[]) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ff_users_updated', { detail: users }));
    try {
      userSyncChannel?.postMessage({ type: 'USERS_UPDATED', users });
    } catch (e) {}
  }
}

let hasInitializedUserSync = false;

export async function fetchUsersFromServer(): Promise<UserAccount[]> {
  if (typeof window === 'undefined') return getUsers();
  try {
    const res = await fetch(`/api/users?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) return getUsers();
    const data = await res.json();
    if (data.ok && Array.isArray(data.users)) {
      const serverUsers: UserAccount[] = data.users;
      const localUsers = getUsers();

      const mergedMap = new Map<string, UserAccount>();
      // Put local users
      localUsers.forEach((u) => {
        if (u && u.id) mergedMap.set(u.id, u);
      });
      // Merge with server users
      serverUsers.forEach((su) => {
        if (!su || !su.id) return;
        let targetKey = su.id;
        let lu = mergedMap.get(su.id);
        if (!lu) {
          for (const [k, v] of mergedMap.entries()) {
            if (
              (v.phone && su.phone && v.phone.trim() === su.phone.trim()) ||
              (v.username && su.username && v.username.toLowerCase() === su.username.toLowerCase()) ||
              (v.email && su.email && v.email.toLowerCase() === su.email.toLowerCase())
            ) {
              lu = v;
              targetKey = k;
              break;
            }
          }
        }

        if (!lu) {
          mergedMap.set(su.id, su);
        } else {
          const luTime = lu.updatedAt ? new Date(lu.updatedAt).getTime() : 0;
          const suTime = su.updatedAt ? new Date(su.updatedAt).getTime() : 0;
          let effectiveBalance: number;
          let effectiveTime: number;

          if (luTime > suTime) {
            effectiveBalance = typeof lu.walletBalance === 'number' ? lu.walletBalance : Number(lu.walletBalance || 0);
            effectiveTime = luTime;
          } else if (suTime > luTime) {
            effectiveBalance = typeof su.walletBalance === 'number' ? su.walletBalance : Number(su.walletBalance || 0);
            effectiveTime = suTime;
          } else {
            effectiveBalance = Math.max(Number(lu.walletBalance || 0), Number(su.walletBalance || 0));
            effectiveTime = luTime || suTime || Date.now();
          }

          mergedMap.set(targetKey, {
            ...lu,
            ...su,
            walletBalance: effectiveBalance,
            updatedAt: new Date(effectiveTime).toISOString(),
          });
        }
      });

      const merged = Array.from(mergedMap.values());
      try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(merged));
        
        // Immediately sync currently logged-in user session with new balance across all identifiers
        const currentLoggedStr = localStorage.getItem('ff_user') || getCookieUser();
        if (currentLoggedStr) {
          const current = typeof currentLoggedStr === 'string' ? JSON.parse(currentLoggedStr) : currentLoggedStr;
          const found = merged.find(
            (u) =>
              u.id === current.id ||
              (u.phone && current.phone && u.phone.trim() === current.phone.trim()) ||
              (u.username && current.username && u.username.toLowerCase() === current.username.toLowerCase()) ||
              (u.email && current.email && u.email.toLowerCase() === current.email.toLowerCase())
          );
          if (found) {
            saveSession(found);
            window.dispatchEvent(new CustomEvent('ff_user_profile_updated', { detail: found }));
          }
        }

        notifyUsersChange(merged);
      } catch (e) {}

      // If local had newly registered users that the server didn't have, post sync
      const missingOnServer = localUsers.filter((lu) => !serverUsers.some((su) => su.id === lu.id));
      if (missingOnServer.length > 0) {
        fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sync', users: merged }),
        }).catch(() => {});
      }

      return merged;
    }
  } catch (err) {
    console.warn('Failed to fetch users from server database:', err);
  }
  return getUsers();
}

export function initUserSync() {
  if (typeof window === 'undefined' || hasInitializedUserSync) return;
  hasInitializedUserSync = true;

  // Disconnect all previous test sessions once so all accounts start clean
  const SESSION_BUILD_KEY = 'ff_live_session_clean_v4';
  try {
    if (localStorage.getItem(SESSION_BUILD_KEY) !== 'clean') {
      clearSession();
      localStorage.setItem(SESSION_BUILD_KEY, 'clean');
    }
  } catch (e) {}

  fetchUsersFromServer();
  // 1-second rapid server sync for immediate cross-device balance & user updates
  setInterval(fetchUsersFromServer, 1000);

  window.addEventListener('focus', () => {
    fetchUsersFromServer();
  });
  window.addEventListener('touchstart', () => {
    fetchUsersFromServer();
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      fetchUsersFromServer();
    }
  });
}

export function getUsers(): UserAccount[] {
  if (typeof window === 'undefined') return INITIAL_USERS;
  try {
    const data = localStorage.getItem(USERS_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    const rawParsed = JSON.parse(data);
    if (!Array.isArray(rawParsed)) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    const parsed: UserAccount[] = rawParsed.filter((u: any) => u && typeof u === 'object');
    let updated = parsed.length !== rawParsed.length;
    INITIAL_USERS.forEach((initUser) => {
      const idx = parsed.findIndex(
        (u) =>
          u.phone === initUser.phone ||
          u.id === initUser.id ||
          (u.ign && initUser.ign && u.ign.toLowerCase() === initUser.ign.toLowerCase())
      );
      if (idx === -1) {
        parsed.push(initUser);
        updated = true;
      } else {
        // Refresh role and credentials if owner/admin
        if (initUser.role === 'ADMIN') {
          if (
            parsed[idx].role !== 'ADMIN' ||
            parsed[idx].password !== initUser.password ||
            parsed[idx].ign !== initUser.ign ||
            parsed[idx].phone !== initUser.phone
          ) {
            parsed[idx].role = 'ADMIN';
            parsed[idx].password = initUser.password;
            parsed[idx].ign = initUser.ign;
            parsed[idx].phone = initUser.phone;
            parsed[idx].uid = initUser.uid;
            updated = true;
          }
        }
        if (!parsed[idx].matchHistory && initUser.matchHistory) {
          parsed[idx].matchHistory = initUser.matchHistory;
          updated = true;
        }
        if (parsed[idx].totalEarnings === undefined && initUser.totalEarnings !== undefined) {
          parsed[idx].totalEarnings = initUser.totalEarnings;
          updated = true;
        }
      }
    });

    // Heal player avatars to new gaming avatars if unset or pointing to unsplash
    parsed.forEach((u, i) => {
      if (!u.avatar || u.avatar.includes('unsplash.com') || u.avatar === '/avatars/avatar-2.jpg') {
        u.avatar = DEFAULT_AVATARS[i % DEFAULT_AVATARS.length];
        updated = true;
      }
    });

    if (updated) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load users from localStorage:', e);
    return INITIAL_USERS;
  }
}

export function saveUsers(users: UserAccount[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    // If currently logged-in user was updated, update ff_user and session first
    let updatedLoggedInUser: UserAccount | null = null;
    const currentLoggedStr = localStorage.getItem('ff_user') || getCookieUser();
    if (currentLoggedStr) {
      const current = typeof currentLoggedStr === 'string' ? JSON.parse(currentLoggedStr) : currentLoggedStr;
      const found = users.find((u) => u.id === current.id || (u.phone && current.phone && u.phone === current.phone));
      if (found) {
        updatedLoggedInUser = found;
        saveSession(found);
      }
    }

    notifyUsersChange(users);
    if (updatedLoggedInUser) {
      window.dispatchEvent(new CustomEvent('ff_user_profile_updated', { detail: updatedLoggedInUser }));
    }

    // Sync to server database in background
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sync', users }),
    }).catch(() => {});
  } catch (e) {
    console.error('Failed to save users:', e);
  }
}

export function getTransactions(): BalanceTransaction[] {
  if (typeof window === 'undefined') return INITIAL_TRANSACTIONS;
  try {
    const data = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(INITIAL_TRANSACTIONS));
      return INITIAL_TRANSACTIONS;
    }
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_TRANSACTIONS;
  }
}

export function saveTransactions(transactions: BalanceTransaction[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
  } catch (e) {
    console.error('Failed to save transactions:', e);
  }
}

// User CRUD operations
export function getUserById(id: string): UserAccount | undefined {
  return getUsers().find((u) => u.id === id);
}

export function getUserByPhone(phone: string): UserAccount | undefined {
  return getUsers().find((u) => u.phone.trim() === phone.trim());
}

export function addUser(user: Omit<UserAccount, 'id' | 'createdAt'>): UserAccount {
  const users = getUsers();
  const newUser: UserAccount = {
    ...user,
    id: 'u-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    createdAt: new Date().toISOString(),
  };
  users.unshift(newUser);
  saveUsers(users);
  return newUser;
}

export function updateUser(id: string, updates: Partial<UserAccount>): UserAccount | null {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return null;

  const nowIso = new Date().toISOString();
  users[index] = { ...users[index], ...updates, updatedAt: nowIso };
  saveUsers(users);

  if (typeof window !== 'undefined') {
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update',
        userId: id,
        updates: { ...updates, updatedAt: nowIso },
      }),
    }).catch(() => {});
  }

  return users[index];
}

export function deleteUser(id: string): boolean {
  const users = getUsers();
  const filtered = users.filter((u) => u.id !== id);
  if (filtered.length !== users.length) {
    saveUsers(filtered);
    return true;
  }
  return false;
}

// Balance Management: Add Balance (+ টাকা যোগ)
export function addBalance(
  userId: string,
  amount: number,
  reason: string,
  category?: string,
  referenceId?: string
): { success: boolean; newBalance?: number; error?: string } {
  if (amount <= 0) return { success: false, error: 'টাকার পরিমাণ ০ এর বেশি হতে হবে' };

  const users = getUsers();
  const user = users.find(
    (u) =>
      u.id === userId ||
      u.phone === userId ||
      (u.ign && u.ign.toLowerCase() === String(userId).toLowerCase()) ||
      (u.username && u.username.toLowerCase() === String(userId).toLowerCase())
  );
  if (!user) return { success: false, error: 'ইউজার খুঁজে পাওয়া যায়নি' };

  const newBalance = Number((user.walletBalance + amount).toFixed(2));
  const nowIso = new Date().toISOString();
  user.walletBalance = newBalance;
  user.updatedAt = nowIso;
  saveUsers(users);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ff_user_profile_updated', { detail: user }));
    try {
      userSyncChannel?.postMessage({ type: 'USER_PROFILE_UPDATED', user });
    } catch (e) {}

    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        action: 'update',
        userId: user.id,
        updates: { walletBalance: newBalance, updatedAt: nowIso },
      }),
    }).catch(() => {});
  }

  // Record audit transaction
  const tx: BalanceTransaction = {
    id: 'tx-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    userId: user.id,
    userPhone: user.phone,
    userIgn: user.ign,
    type: 'CREDIT',
    amount,
    reason: reason || 'অ্যাডমিন কর্তৃক ব্যালেন্স যোগ',
    balanceAfter: newBalance,
    timestamp: new Date().toISOString(),
    category: category || 'manual_adjustment',
    referenceId: referenceId || undefined,
    status: 'completed',
  };
  const txList = getTransactions();
  txList.unshift(tx);
  saveTransactions(txList);

  return { success: true, newBalance };
}

/**
 * Executes ACID-safe automated match prize payouts to winners
 */
export function processMatchPrizePayout(
  matchId: string,
  matchTitle: string,
  winners: Array<{
    userId?: string;
    ign: string;
    uid?: string;
    rank: number;
    kills: number;
    prize: number;
  }>
): {
  success: boolean;
  totalDistributed: number;
  payoutsCount: number;
  errors: string[];
} {
  const users = getUsers();
  const errors: string[] = [];
  let totalDistributed = 0;
  let payoutsCount = 0;

  for (const winner of winners) {
    if (!winner.prize || winner.prize <= 0) continue;

    // Match player in DB by userId, or ign (case-insensitive), or uid
    let targetUser = winner.userId ? users.find((u) => u.id === winner.userId) : null;
    if (!targetUser && winner.ign) {
      targetUser = users.find(
        (u) => u.ign.toUpperCase().trim() === winner.ign.toUpperCase().trim()
      );
    }
    if (!targetUser && winner.uid) {
      targetUser = users.find((u) => u.uid === winner.uid);
    }

    if (!targetUser) {
      errors.push(`প্লেয়ার ${winner.ign} (UID: ${winner.uid || 'N/A'}) রেজিস্টার্ড নয়`);
      continue;
    }

    // Atomically credit user balance
    const payoutReason = `🏆 টুর্নামেন্ট প্রাইজ: ${matchTitle} (${winner.rank}ম স্থান, ${winner.kills} কিল)`;
    const creditRes = addBalance(
      targetUser.id,
      winner.prize,
      payoutReason,
      'match_winning',
      matchId
    );

    if (creditRes.success) {
      totalDistributed += winner.prize;
      payoutsCount++;

      // Update player profile statistics
      targetUser.matchesPlayed = (targetUser.matchesPlayed || 0) + 1;
      targetUser.totalKills = (targetUser.totalKills || 0) + winner.kills;
      targetUser.totalEarnings = (targetUser.totalEarnings || 0) + winner.prize;
      if (winner.rank === 1) {
        targetUser.totalWins = (targetUser.totalWins || 0) + 1;
      }
      saveUsers(users);

      // Instant device push notification
      dispatchDevicePushNotification(
        '🎉 অভিনন্দন! প্রাইজ মানি যুক্ত হয়েছে!',
        `আপনি "${matchTitle}" টুর্নামেন্টে ${winner.rank}ম স্থান ও ${winner.kills}টি কিল অর্জন করে ৳${winner.prize} টাকা জিতেছেন!`
      );
    } else {
      errors.push(`ইউজার ${winner.ign} এর ব্যালেন্স যোগ করতে সমস্যা: ${creditRes.error}`);
    }
  }

  return {
    success: payoutsCount > 0 || winners.length === 0,
    totalDistributed,
    payoutsCount,
    errors,
  };
}

// Balance Management: Deduct / Cut Balance (- টাকা কাটা)
export function deductBalance(
  userId: string,
  amount: number,
  reason: string,
  category?: 'match_winning' | 'deposit' | 'withdraw' | 'match_join' | string
): { success: boolean; newBalance?: number; error?: string } {
  if (amount <= 0) return { success: false, error: 'টাকার পরিমাণ ০ এর বেশি হতে হবে' };

  const users = getUsers();
  const user = users.find(
    (u) =>
      u.id === userId ||
      u.phone === userId ||
      (u.ign && u.ign.toLowerCase() === String(userId).toLowerCase()) ||
      (u.username && u.username.toLowerCase() === String(userId).toLowerCase())
  );
  if (!user) return { success: false, error: 'ইউজার খুঁজে পাওয়া যায়নি' };

  if (user.walletBalance < amount) {
    return { success: false, error: `পর্যাপ্ত ব্যালেন্স নেই! ইউজারের বর্তমান ব্যালেন্স ৳${user.walletBalance}` };
  }

  const newBalance = Number((user.walletBalance - amount).toFixed(2));
  const nowIso = new Date().toISOString();
  user.walletBalance = newBalance;
  user.updatedAt = nowIso;
  saveUsers(users);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ff_user_profile_updated', { detail: user }));
    try {
      userSyncChannel?.postMessage({ type: 'USER_PROFILE_UPDATED', user });
    } catch (e) {}

    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        action: 'update',
        userId: user.id,
        updates: { walletBalance: newBalance, updatedAt: nowIso },
      }),
    }).catch(() => {});
  }

  const isMatchReason =
    reason.toLowerCase().includes('ম্যাচ') ||
    reason.toLowerCase().includes('স্লট') ||
    reason.toLowerCase().includes('match') ||
    reason.toLowerCase().includes('slot') ||
    reason.toLowerCase().includes('booking') ||
    reason.toLowerCase().includes('বুকিং');

  const resolvedCategory = category || (isMatchReason ? 'match_join' : 'withdraw');

  // Record audit transaction
  const tx: BalanceTransaction = {
    id: 'tx-' + Date.now(),
    userId: user.id,
    userPhone: user.phone,
    userIgn: user.ign,
    type: 'DEBIT',
    amount,
    reason: reason || 'অ্যাডমিন কর্তৃক ব্যালেন্স কর্তন',
    balanceAfter: newBalance,
    category: resolvedCategory,
    timestamp: new Date().toISOString(),
  };
  const txList = getTransactions();
  txList.unshift(tx);
  saveTransactions(txList);

  return { success: true, newBalance };
}

const JOINED_MATCHES_KEY = 'ff_user_joined_matches_v2';

export function hasUserJoinedMatch(matchId: string, user?: UserAccount | null): boolean {
  if (typeof window === 'undefined' || !matchId) return false;
  try {
    const raw = localStorage.getItem(JOINED_MATCHES_KEY);
    if (raw) {
      const map = JSON.parse(raw) as Record<string, any>;
      const entry = map[matchId];
      if (entry) {
        // If match was joined > 16 hours ago (yesterday/past session), expire it so tomorrow players can join fresh!
        if (entry.joinedAt) {
          const joinedTime = new Date(entry.joinedAt).getTime();
          const hoursAgo = (Date.now() - joinedTime) / (1000 * 60 * 60);
          if (hoursAgo > 16) {
            delete map[matchId];
            localStorage.setItem(JOINED_MATCHES_KEY, JSON.stringify(map));
            return false;
          }
        }
        return true;
      }
    }
  } catch (e) {}
  return false;
}

export function recordUserJoinedMatch(
  matchId: string,
  user?: UserAccount | null,
  extra?: { ign?: string; uid?: string; slot?: number }
): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(JOINED_MATCHES_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[matchId] = {
      matchId,
      userId: user?.id || 'guest',
      userPhone: user?.phone || '',
      ign: extra?.ign || user?.ign || '',
      uid: extra?.uid || user?.uid || '',
      slot: extra?.slot || 1,
      joinedAt: new Date().toISOString(),
      deviceFingerprint: typeof navigator !== 'undefined' ? `${navigator.userAgent}` : 'web',
    };
    localStorage.setItem(JOINED_MATCHES_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent('ff_match_joined_state_updated', { detail: { matchId } }));
  } catch (e) {}
}

// Toggle or Set User Status (Active / Banned / Suspended)
export function setUserStatus(userId: string, status: 'ACTIVE' | 'BANNED' | 'SUSPENDED'): UserAccount | null {
  return updateUser(userId, { status });
}

// Auth Helpers
export function loginUserSync(identifier: string, pass: string): { success: boolean; user?: UserAccount; error?: string } {
  const clean = String(identifier || '').trim().toLowerCase();
  const cleanPass = String(pass || '').trim();

  if (!clean) {
    return { success: false, error: 'Please enter your username or email.' };
  }
  if (!cleanPass) {
    return { success: false, error: 'Please enter your password.' };
  }

  const users = getUsers();
  const user = users.find((u) => {
    if (!u) return false;
    const uUsername = String(u.username || '').trim().toLowerCase();
    const uEmail = String(u.email || '').trim().toLowerCase();
    const uPhone = String(u.phone || '').trim().toLowerCase();
    const uIgn = String(u.ign || '').trim().toLowerCase();
    const uUid = String(u.uid || '').trim().toLowerCase();
    const uId = String(u.id || '').trim().toLowerCase();

    return (
      (uUsername && uUsername === clean) ||
      (uEmail && uEmail === clean) ||
      (uPhone && uPhone === clean) ||
      (uIgn && uIgn === clean) ||
      (uUid && uUid === clean) ||
      (uId && uId === clean)
    );
  });

  if (!user) {
    return { success: false, error: 'No account found with this username or email.' };
  }

  const uPass = String(user.password || '').trim();
  if (uPass !== cleanPass) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }

  if (user.status === 'BANNED') {
    return {
      success: false,
      error: 'Your account has been banned. Please contact support.',
    };
  }

  // Save current active user
  if (typeof window !== 'undefined') {
    saveSession(user);
    window.dispatchEvent(new CustomEvent('ff_users_updated', { detail: getUsers() }));
  }

  return { success: true, user };
}

export async function loginUser(identifier: string, pass: string): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  // 1. Try local memory / localStorage first
  const localRes = loginUserSync(identifier, pass);
  if (localRes.success) return localRes;

  // 2. If not found, fetch fresh live users from server database!
  try {
    const refreshed = await fetchUsersFromServer();
    if (refreshed && refreshed.length > 0) {
      const secondCheck = loginUserSync(identifier, pass);
      if (secondCheck.success) return secondCheck;
    }
  } catch (err) {
    console.warn('Live login fetch error:', err);
  }

  return localRes;
}

export async function registerUser(data: {
  username?: string;
  email?: string;
  password: string;
  phone?: string;
  ign?: string;
  uid?: string;
}): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  // Pull fresh users from server first to prevent race conditions
  try {
    await fetchUsersFromServer();
  } catch (e) {}

  // Device Registration Record (Audit tracking without blocking new players)
  if (typeof window !== 'undefined') {
    try {
      const regRaw = localStorage.getItem('ff_device_registered_accounts');
      let registeredList: string[] = [];
      if (regRaw) {
        try {
          const parsed = JSON.parse(regRaw);
          if (Array.isArray(parsed)) registeredList = parsed;
        } catch {
          registeredList = [regRaw];
        }
      }
    } catch {}
  }

  const users = getUsers();
  const cleanUsername = String(data.username || data.ign || '').trim().toLowerCase();
  const cleanEmail = String(data.email || '').trim().toLowerCase();
  const cleanPhone = String(data.phone || '').trim();

  if (cleanUsername) {
    const usernameTaken = users.some((u) => {
      if (!u) return false;
      const uName = String(u.username || '').trim().toLowerCase();
      const uIgn = String(u.ign || '').trim().toLowerCase();
      return uName === cleanUsername || uIgn === cleanUsername;
    });
    if (usernameTaken) {
      return { success: false, error: 'This username is already taken. Please choose another one.' };
    }
  }

  if (cleanEmail) {
    const emailTaken = users.some((u) => u && String(u.email || '').trim().toLowerCase() === cleanEmail);
    if (emailTaken) {
      return { success: false, error: 'This email is already registered. Please log in.' };
    }
  }

  if (cleanPhone) {
    const existing = getUserByPhone(cleanPhone);
    if (existing) {
      return { success: false, error: 'This phone number is already registered. Please log in.' };
    }
  }

  const generatedUid = String(Math.floor(100000000 + Math.random() * 900000000));
  const finalUsername = String(data.username || data.ign || 'player_' + generatedUid.slice(-4)).trim();
  const finalEmail = cleanEmail || `${finalUsername.toLowerCase()}@gmail.com`;

  const newUser = addUser({
    username: finalUsername,
    email: finalEmail,
    phone: cleanPhone || '01' + Math.floor(100000000 + Math.random() * 900000000),
    ign: finalUsername.toUpperCase(),
    uid: data.uid?.trim() || generatedUid,
    password: String(data.password || '').trim(),
    walletBalance: 0.0, // Strictly 0.0 BDT for new account registrations
    role: 'PLAYER',
    status: 'ACTIVE',
    matchesPlayed: 0,
    totalKills: 0,
    totalWins: 0,
    totalEarnings: 0,
    matchHistory: [],
    avatar: DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)],
    notes: 'Self-registered player via portal.',
  });

  if (typeof window !== 'undefined') {
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({ action: 'register', user: newUser }),
    }).catch(() => {});
  }

  if (typeof window !== 'undefined') {
    try {
      const regRaw = localStorage.getItem('ff_device_registered_accounts');
      let registeredList: string[] = [];
      if (regRaw) {
        try {
          const parsed = JSON.parse(regRaw);
          if (Array.isArray(parsed)) registeredList = parsed;
        } catch {
          registeredList = [regRaw];
        }
      } else {
        const legacy = localStorage.getItem('ff_device_registered_account');
        if (legacy) registeredList = [legacy];
      }
      if (!registeredList.includes(finalUsername)) {
        registeredList.push(finalUsername);
      }
      localStorage.setItem('ff_device_registered_accounts', JSON.stringify(registeredList));
      localStorage.setItem('ff_device_registered_account', finalUsername);
    } catch {}
    saveSession(newUser);
    window.dispatchEvent(new CustomEvent('ff_users_updated', { detail: getUsers() }));
  }

  // Persist directly to server database
  try {
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', user: newUser }),
    });
  } catch (err) {
    console.warn('Failed to sync new user to server database:', err);
  }

  return { success: true, user: newUser };
}

export function saveSession(user: UserAccount) {
  if (typeof window === 'undefined') return;
  try {
    const jsonStr = JSON.stringify(user);
    localStorage.setItem('ff_user', jsonStr);
    localStorage.setItem('ff_token', 'local_jwt_' + user.id + '_' + Date.now());
    // Also save in persistent cookie with 10 years expiry
    const expires = new Date(Date.now() + 3650 * 864e5).toUTCString();
    document.cookie = `ff_user=${encodeURIComponent(jsonStr)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch (e) {}
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('ff_user');
    localStorage.removeItem('ff_token');
    document.cookie = 'ff_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
  } catch (e) {}
}

export function getCookieUser(): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const match = document.cookie.match(/(?:^|;\s*)ff_user=([^;]*)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  } catch (e) {}
  return null;
}

export function getCurrentUser(): UserAccount | null {
  if (typeof window === 'undefined') return null;
  try {
    let data = localStorage.getItem('ff_user');
    if (!data) {
      data = getCookieUser();
      if (data) {
        try {
          localStorage.setItem('ff_user', data);
        } catch (e) {}
      }
    }
    if (!data) return null;
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    // Refresh with latest data from users list
    const fresh = getUserById(parsed.id) || getUserByPhone(parsed.phone);
    if (!fresh && parsed.role !== 'ADMIN') {
      clearSession();
      return null;
    }
    const res = fresh || (parsed.role === 'ADMIN' ? parsed : null);
    if (res && (!res.avatar || res.avatar.includes('unsplash.com') || res.avatar === '/avatars/avatar-2.jpg')) {
      res.avatar = DEFAULT_AVATARS[0];
    }
    return res;
  } catch (e) {
    return null;
  }
}

export function logoutUser(): void {
  if (typeof window !== 'undefined') {
    clearSession();
    window.dispatchEvent(new CustomEvent('ff_users_updated', { detail: getUsers() }));
  }
}

// React Hook for live reactivity across all components
export function useUserStore() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [currentUser, setCurrentUserState] = useState<UserAccount | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = () => {
    const list = getUsers();
    setUsers(list);
    setTransactions(getTransactions());
    setCurrentUserState(getCurrentUser());
  };

  useEffect(() => {
    refresh();
    setLoaded(true);
    initUserSync();

    const handleUpdate = () => {
      refresh();
    };

    window.addEventListener('ff_users_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('ff_users_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return {
    users,
    transactions,
    currentUser,
    loaded,
    addUser,
    updateUser,
    deleteUser,
    addBalance,
    deductBalance,
    setUserStatus,
    loginUser,
    registerUser,
    logoutUser,
    refresh,
    getPaymentRequests,
    submitDepositRequest,
    submitWithdrawRequest,
    approveWithdrawRequest,
    rejectWithdrawRequest,
    approveDepositRequest,
    rejectDepositRequest,
    processMatchPrizePayout,
  };
}

/* ------------------------------------------------------------------ */
/*  Payment Requests (Deposit & Withdrawal)                           */
/* ------------------------------------------------------------------ */

const PAYMENT_REQUESTS_STORAGE_KEY = 'ff_esports_payment_requests_v1';

export function getPaymentRequests(): PaymentRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PAYMENT_REQUESTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function savePaymentRequests(list: PaymentRequest[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PAYMENT_REQUESTS_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('ff_payment_requests_updated', { detail: list }));
  } catch (e) {}
}

export function submitDepositRequest(data: {
  userId: string;
  userPhone: string;
  userName?: string;
  method: 'BKASH' | 'NAGAD' | 'ROCKET';
  amount: number;
  accountNumber: string;
  trxId: string;
  autoVerify?: boolean;
}): { success: boolean; request: PaymentRequest; message: string } {
  const current = getPaymentRequests();
  const now = new Date().toISOString();

  // Strictly keep deposits in PENDING status until Admin verifies the transaction in Admin Finance panel
  const isAutoApproved = false;

  const newReq: PaymentRequest = {
    id: 'pay-dep-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    userId: data.userId,
    userPhone: data.userPhone,
    userName: data.userName,
    type: 'DEPOSIT',
    method: data.method,
    amount: Number(data.amount),
    accountNumber: data.accountNumber,
    trxId: data.trxId.toUpperCase().trim(),
    status: isAutoApproved ? 'APPROVED' : 'PENDING',
    autoVerified: isAutoApproved,
    createdAt: now,
    updatedAt: now,
  };

  const updated = [newReq, ...current];
  savePaymentRequests(updated);

  dispatchDevicePushNotification(
    '⏳ ডিপোজিট রিকোয়েস্ট পেন্ডিং',
    `আপনার ৳${data.amount} ডিপোজিট রিকোয়েস্ট (TrxID: ${newReq.trxId}) জমা হয়েছে। এডমিন যাচাই করে ব্যালেন্স যোগ করবেন।`
  );
  return {
    success: true,
    request: newReq,
    message: `৳${data.amount} ডিপোজিট রিকোয়েস্ট জমা হয়েছে! এডমিন ট্রানজেকশন আইডি যাচাই করার পর ওয়ালেটে ব্যালেন্স যোগ করবেন।`,
  };
}

export function submitWithdrawRequest(data: {
  userId: string;
  userPhone: string;
  userName?: string;
  method: 'BKASH' | 'NAGAD' | 'ROCKET';
  amount: number;
  accountNumber: string;
}): { success: boolean; error?: string; request?: PaymentRequest } {
  const user = getUserById(data.userId) || getUserByPhone(data.userPhone);
  if (!user) {
    return { success: false, error: 'ইউজার খুঁজে পাওয়া যায়নি।' };
  }

  if (user.walletBalance < data.amount) {
    return { success: false, error: 'আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই।' };
  }

  // Deduct balance from wallet immediately to prevent double spending
  const deductRes = deductBalance(
    data.userId,
    Number(data.amount),
    `উইথড্রল রিকোয়েস্ট (${data.method}: ${data.accountNumber})`
  );

  if (!deductRes.success) {
    return { success: false, error: deductRes.error || 'উইথড্রল ব্যর্থ হয়েছে।' };
  }

  const current = getPaymentRequests();
  const now = new Date().toISOString();
  const newReq: PaymentRequest = {
    id: 'pay-wth-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    userId: data.userId,
    userPhone: data.userPhone,
    userName: data.userName,
    type: 'WITHDRAW',
    method: data.method,
    amount: Number(data.amount),
    accountNumber: data.accountNumber,
    status: 'PENDING',
    createdAt: now,
    updatedAt: now,
  };

  const updated = [newReq, ...current];
  savePaymentRequests(updated);

  dispatchDevicePushNotification(
    '💸 উইথড্রল রিকোয়েস্ট জমা হয়েছে',
    `৳${data.amount} উইথড্রল (${data.method}) পেন্ডিং আছে। এডমিন পেমেন্ট পাঠানোর পর কনফার্মেশন পাবেন।`
  );

  // Instantly send alert notification to admin channel
  if (typeof window !== 'undefined') {
    fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `💸 নতুন উইথড্রল রিকোয়েস্ট (${data.method})`,
        message: `প্লেয়ার ${data.userName || data.userPhone} ৳${data.amount} উত্তোলন চেয়েছেন (${data.accountNumber})।`,
        url: '/admin/finance',
      }),
    }).catch(() => {});
  }

  return { success: true, request: newReq };
}

export function approveWithdrawRequest(requestId: string, adminNote?: string): boolean {
  const current = getPaymentRequests();
  const req = current.find((r) => r.id === requestId);
  if (!req || req.status !== 'PENDING') return false;

  const now = new Date().toISOString();
  const updated = current.map((r) =>
    r.id === requestId
      ? {
          ...r,
          status: 'APPROVED' as const,
          adminNote: adminNote || 'টাকা পাঠানো হয়েছে',
          updatedAt: now,
        }
      : r
  );
  savePaymentRequests(updated);

  // Send real-time notification to user
  dispatchDevicePushNotification(
    '✅ টাকা পাঠানো হয়েছে!',
    `আপনার ৳${req.amount} টাকা উইথড্রল সফলভাবে ${req.method} (${req.accountNumber}) নম্বরে পাঠানো হয়েছে। একাউন্ট চেক করুন।`
  );

  return true;
}

export function rejectWithdrawRequest(requestId: string, reason?: string): boolean {
  const current = getPaymentRequests();
  const req = current.find((r) => r.id === requestId);
  if (!req || req.status !== 'PENDING') return false;

  // Refund the deducted amount back to user's wallet
  addBalance(
    req.userId,
    req.amount,
    `উইথড্রল বাতিল ও রিফান্ড: ${reason || 'এডমিন দ্বারা বাতিল'}`
  );

  const now = new Date().toISOString();
  const updated = current.map((r) =>
    r.id === requestId
      ? {
          ...r,
          status: 'REJECTED' as const,
          adminNote: reason || 'বাতিল করা হয়েছে ও টাকা ফেরত দেওয়া হয়েছে',
          updatedAt: now,
        }
      : r
  );
  savePaymentRequests(updated);

  dispatchDevicePushNotification(
    '❌ উইথড্রল বাতিল ও রিফান্ড',
    `আপনার ৳${req.amount} উইথড্রল রিকোয়েস্ট বাতিল করা হয়েছে এবং পুরো টাকা ওয়ালেটে রিফান্ড করা হয়েছে।`
  );

  return true;
}

export function approveDepositRequest(requestId: string): boolean {
  const current = getPaymentRequests();
  const req = current.find((r) => r.id === requestId);
  if (!req || req.status !== 'PENDING') return false;

  // Add balance to user
  addBalance(
    req.userId,
    req.amount,
    `${req.method} Deposit Approved (TrxID: ${req.trxId || 'N/A'})`
  );

  const now = new Date().toISOString();
  const updated = current.map((r) =>
    r.id === requestId
      ? {
          ...r,
          status: 'APPROVED' as const,
          updatedAt: now,
        }
      : r
  );
  savePaymentRequests(updated);

  dispatchDevicePushNotification(
    '💰 ডিপোজিট অনুমোদিত!',
    `আপনার ৳${req.amount} ডিপোজিট সফলভাবে অনুমোদিত হয়েছে এবং ওয়ালেটে যোগ করা হয়েছে।`
  );

  return true;
}

export function rejectDepositRequest(requestId: string, reason?: string): boolean {
  const current = getPaymentRequests();
  const req = current.find((r) => r.id === requestId);
  if (!req || req.status !== 'PENDING') return false;

  const now = new Date().toISOString();
  const updated = current.map((r) =>
    r.id === requestId
      ? {
          ...r,
          status: 'REJECTED' as const,
          adminNote: reason || 'ভুল TrxID বা অপ্রমাণিত লেনদেন',
          updatedAt: now,
        }
      : r
  );
  savePaymentRequests(updated);

  dispatchDevicePushNotification(
    '❌ ডিপোজিট বাতিল',
    `আপনার ৳${req.amount} ডিপোজিট রিকোয়েস্ট বাতিল করা হয়েছে (${reason || 'ভুল TrxID'})।`
  );

  return true;
}

