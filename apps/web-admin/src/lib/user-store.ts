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
  avatar?: string;
  notes?: string;
  matchHistory?: UserMatchRecord[];
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
}

const USERS_STORAGE_KEY = 'ff_esports_users_db_v2';
const TRANSACTIONS_STORAGE_KEY = 'ff_esports_balance_tx_v2';

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
  // Player Accounts
  {
    id: 'u-1',
    phone: '01712345678',
    ign: 'BDX_STRIKER',
    uid: '192837465',
    password: 'striker@2026',
    walletBalance: 1450.0,
    role: 'PLAYER',
    status: 'ACTIVE',
    matchesPlayed: 38,
    totalKills: 142,
    totalWins: 12,
    totalEarnings: 8600,
    createdAt: '2026-09-15T10:30:00Z',
    avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=120',
    notes: 'Verified tournament player. Top 10 contender.',
    matchHistory: [
      {
        id: 'rec-1',
        matchTitle: 'BR SURVIVAL #108 (CLASSIC)',
        category: 'Classic BR',
        date: '2026-10-06 19:00',
        slotNumber: 4,
        kills: 8,
        rank: 1,
        isBooyah: true,
        prizeEarned: 1200,
      },
      {
        id: 'rec-2',
        matchTitle: 'CLASH SQUAD 4V4 #92',
        category: 'Clash Squad',
        date: '2026-10-05 20:30',
        slotNumber: 1,
        kills: 14,
        rank: 1,
        isBooyah: true,
        prizeEarned: 800,
      },
      {
        id: 'rec-3',
        matchTitle: 'CS HEADSHOT SPECIAL #44',
        category: 'Headshot Only',
        date: '2026-10-04 18:00',
        slotNumber: 2,
        kills: 11,
        rank: 2,
        isBooyah: false,
        prizeEarned: 450,
      },
      {
        id: 'rec-4',
        matchTitle: 'LONE WOLF 1V1 #31',
        category: 'Lone Wolf',
        date: '2026-10-03 21:15',
        slotNumber: 1,
        kills: 5,
        rank: 1,
        isBooyah: true,
        prizeEarned: 300,
      },
    ],
  },
  {
    id: 'u-2',
    phone: '01899887766',
    ign: 'TANVIR_FF',
    uid: '283746519',
    password: 'tanvir#ff99',
    walletBalance: 820.0,
    role: 'PLAYER',
    status: 'ACTIVE',
    matchesPlayed: 18,
    totalKills: 64,
    totalWins: 7,
    totalEarnings: 3900,
    createdAt: '2026-09-18T14:15:00Z',
    avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=120',
  },
  {
    id: 'u-3',
    phone: '01911223344',
    ign: 'RAKIB_OP',
    uid: '394857201',
    password: 'rakib_op12',
    walletBalance: 350.0,
    role: 'PLAYER',
    status: 'ACTIVE',
    matchesPlayed: 12,
    totalKills: 38,
    totalWins: 3,
    totalEarnings: 1800,
    createdAt: '2026-09-22T08:00:00Z',
    avatar: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=120',
  },
  {
    id: 'u-4',
    phone: '01644556677',
    ign: 'SADIK_HEADSHOT',
    uid: '405968172',
    password: 'headshot405',
    walletBalance: 2100.0,
    role: 'PLAYER',
    status: 'ACTIVE',
    matchesPlayed: 35,
    totalKills: 142,
    totalWins: 19,
    totalEarnings: 9400,
    createdAt: '2026-09-10T16:45:00Z',
    avatar: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=120',
    notes: 'Pro CS 4v4 headshot specialist.',
  },
  {
    id: 'u-5',
    phone: '01577889900',
    ign: 'MAHIN_KILLER',
    uid: '516079283',
    password: 'mahin#killer',
    walletBalance: 0.0,
    role: 'PLAYER',
    status: 'BANNED',
    matchesPlayed: 8,
    totalKills: 14,
    totalWins: 1,
    totalEarnings: 400,
    createdAt: '2026-09-28T19:20:00Z',
    avatar: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=120',
    notes: 'Suspicious headshot ratio detected by anti-cheat. Account restricted.',
  },
];

export const INITIAL_TRANSACTIONS: BalanceTransaction[] = [];

// Helper to notify other components/tabs
function notifyUsersChange(users: UserAccount[]) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ff_users_updated', { detail: users }));
  }
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
    notifyUsersChange(users);

    // If currently logged-in user was updated, update ff_user in localStorage as well
    const currentLoggedStr = localStorage.getItem('ff_user');
    if (currentLoggedStr) {
      const current = JSON.parse(currentLoggedStr);
      const updatedCurrent = users.find((u) => u.id === current.id || u.phone === current.phone);
      if (updatedCurrent) {
        localStorage.setItem('ff_user', JSON.stringify(updatedCurrent));
      }
    }
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

  users[index] = { ...users[index], ...updates };
  saveUsers(users);
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
export function addBalance(userId: string, amount: number, reason: string): { success: boolean; newBalance?: number; error?: string } {
  if (amount <= 0) return { success: false, error: 'টাকার পরিমাণ ০ এর বেশি হতে হবে' };

  const users = getUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return { success: false, error: 'ইউজার খুঁজে পাওয়া যায়নি' };

  const newBalance = Number((user.walletBalance + amount).toFixed(2));
  user.walletBalance = newBalance;
  saveUsers(users);

  // Record audit transaction
  const tx: BalanceTransaction = {
    id: 'tx-' + Date.now(),
    userId: user.id,
    userPhone: user.phone,
    userIgn: user.ign,
    type: 'CREDIT',
    amount,
    reason: reason || 'অ্যাডমিন কর্তৃক ব্যালেন্স যোগ',
    balanceAfter: newBalance,
    timestamp: new Date().toISOString(),
  };
  const txList = getTransactions();
  txList.unshift(tx);
  saveTransactions(txList);

  return { success: true, newBalance };
}

// Balance Management: Deduct / Cut Balance (- টাকা কাটা)
export function deductBalance(userId: string, amount: number, reason: string): { success: boolean; newBalance?: number; error?: string } {
  if (amount <= 0) return { success: false, error: 'টাকার পরিমাণ ০ এর বেশি হতে হবে' };

  const users = getUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return { success: false, error: 'ইউজার খুঁজে পাওয়া যায়নি' };

  if (user.walletBalance < amount) {
    return { success: false, error: `পর্যাপ্ত ব্যালেন্স নেই! ইউজারের বর্তমান ব্যালেন্স ৳${user.walletBalance}` };
  }

  const newBalance = Number((user.walletBalance - amount).toFixed(2));
  user.walletBalance = newBalance;
  saveUsers(users);

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
    timestamp: new Date().toISOString(),
  };
  const txList = getTransactions();
  txList.unshift(tx);
  saveTransactions(txList);

  return { success: true, newBalance };
}

// Toggle or Set User Status (Active / Banned / Suspended)
export function setUserStatus(userId: string, status: 'ACTIVE' | 'BANNED' | 'SUSPENDED'): UserAccount | null {
  return updateUser(userId, { status });
}

// Auth Helpers
export function loginUser(identifier: string, pass: string): { success: boolean; user?: UserAccount; error?: string } {
  const clean = identifier.trim().toLowerCase();
  const users = getUsers();
  const user = users.find((u) => 
    u.phone.trim().toLowerCase() === clean ||
    u.ign.trim().toLowerCase() === clean ||
    u.uid.trim().toLowerCase() === clean ||
    u.id.toLowerCase() === clean
  );
  if (!user) {
    return { success: false, error: 'এই ফোন নম্বর বা ওনার আইডিতে কোনো অ্যাকাউন্ট পাওয়া যায়নি।' };
  }
  if (user.password !== pass) {
    return { success: false, error: 'পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে পুনরায় চেষ্টা করুন।' };
  }
  if (user.status === 'BANNED') {
    return {
      success: false,
      error: 'আপনার অ্যাকাউন্টটি ব্যান (Banned) করা হয়েছে। সহায়তার জন্য অ্যাডমিনের সাথে যোগাযোগ করুন।',
    };
  }

  // Save current active user
  if (typeof window !== 'undefined') {
    localStorage.setItem('ff_user', JSON.stringify(user));
    localStorage.setItem('ff_token', 'local_jwt_' + user.id + '_' + Date.now());
    window.dispatchEvent(new CustomEvent('ff_users_updated', { detail: getUsers() }));
  }

  return { success: true, user };
}

export function registerUser(data: {
  phone: string;
  ign: string;
  uid: string;
  password: string;
}): { success: boolean; user?: UserAccount; error?: string } {
  const existing = getUserByPhone(data.phone);
  if (existing) {
    return { success: false, error: 'এই ফোন নম্বরটি ইতিমধ্যে ব্যবহৃত হয়েছে। লগইন করার চেষ্টা করুন।' };
  }

  const newUser = addUser({
    phone: data.phone.trim(),
    ign: data.ign.trim().toUpperCase(),
    uid: data.uid.trim(),
    password: data.password,
    walletBalance: 100.0, // Initial welcome bonus balance
    role: 'PLAYER',
    status: 'ACTIVE',
    matchesPlayed: 0,
    totalKills: 0,
    totalWins: 0,
    totalEarnings: 0,
    matchHistory: [],
    avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=120',
    notes: 'Self-registered player via portal.',
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem('ff_user', JSON.stringify(newUser));
    localStorage.setItem('ff_token', 'local_jwt_' + newUser.id + '_' + Date.now());
    window.dispatchEvent(new CustomEvent('ff_users_updated', { detail: getUsers() }));
  }

  return { success: true, user: newUser };
}

export function getCurrentUser(): UserAccount | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem('ff_user');
    if (!data) return null;
    const parsed = JSON.parse(data);
    // Refresh with latest data from users list
    const fresh = getUserById(parsed.id) || getUserByPhone(parsed.phone);
    return fresh || parsed;
  } catch (e) {
    return null;
  }
}

export function logoutUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ff_user');
    localStorage.removeItem('ff_token');
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

  // If autoVerify is enabled
  const shouldAutoApprove = Boolean(data.autoVerify && data.trxId && data.trxId.trim().length >= 6);

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
    status: shouldAutoApprove ? 'APPROVED' : 'PENDING',
    autoVerified: shouldAutoApprove,
    createdAt: now,
    updatedAt: now,
  };

  const updated = [newReq, ...current];
  savePaymentRequests(updated);

  if (shouldAutoApprove) {
    // Add balance to user immediately
    addBalance(data.userId, Number(data.amount), `${data.method} Auto-Verified Deposit (TrxID: ${newReq.trxId})`);
    dispatchDevicePushNotification(
      '💰 ডিপোজিট সফল হয়েছে!',
      `আপনার ${data.method} ডিপোজিট (TrxID: ${newReq.trxId}) সফল হয়েছে এবং ৳${data.amount} ওয়ালেটে যোগ করা হয়েছে।`
    );
    return {
      success: true,
      request: newReq,
      message: `৳${data.amount} ডিপোজিট স্বয়ংক্রিয়ভাবে ভেরিফাই হয়ে ওয়ালেটে যোগ করা হয়েছে!`,
    };
  } else {
    dispatchDevicePushNotification(
      '⏳ ডিপোজিট রিকোয়েস্ট পেন্ডিং',
      `৳${data.amount} ডিপোজিট রিকোয়েস্ট জমা হয়েছে। এডমিন যাচাই করে ব্যালেন্স যোগ করবেন।`
    );
    return {
      success: true,
      request: newReq,
      message: `৳${data.amount} ডিপোজিট রিকোয়েস্ট জমা হয়েছে! এডমিন খুব শীঘ্রই যাচাই করে ব্যালেন্স যোগ করবেন।`,
    };
  }
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

