'use client';

import { useState, useEffect } from 'react';

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
  createdAt: string;
  avatar?: string;
  notes?: string;
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

const USERS_STORAGE_KEY = 'ff_esports_users_db_v1';
const TRANSACTIONS_STORAGE_KEY = 'ff_esports_balance_tx_v1';

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'u-1',
    phone: '01712345678',
    ign: 'BDX_STRIKER',
    uid: '192837465',
    password: 'striker@2026',
    walletBalance: 1450.0,
    role: 'PLAYER',
    status: 'ACTIVE',
    matchesPlayed: 24,
    totalKills: 87,
    totalWins: 11,
    createdAt: '2026-09-15T10:30:00Z',
    avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=120',
    notes: 'Verified tournament player. Top 10 contender.',
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
    createdAt: '2026-09-28T19:20:00Z',
    avatar: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=120',
    notes: 'Suspicious headshot ratio detected by anti-cheat. Account restricted.',
  },
  {
    id: 'u-admin',
    phone: '01700000000',
    ign: 'ADMIN_MASTER',
    uid: '100000001',
    password: 'admin123',
    walletBalance: 50000.0,
    role: 'ADMIN',
    status: 'ACTIVE',
    matchesPlayed: 50,
    totalKills: 200,
    totalWins: 40,
    createdAt: '2026-09-01T00:00:00Z',
    avatar: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=120',
    notes: 'Platform Head Administrator & Supervisor.',
  },
];

export const INITIAL_TRANSACTIONS: BalanceTransaction[] = [
  {
    id: 'tx-101',
    userId: 'u-1',
    userPhone: '01712345678',
    userIgn: 'BDX_STRIKER',
    type: 'CREDIT',
    amount: 500,
    reason: 'Bkash Cash-in verified (TrxID: 9X82KD71)',
    balanceAfter: 1450.0,
    timestamp: '2026-10-04T09:12:00Z',
  },
  {
    id: 'tx-102',
    userId: 'u-4',
    userPhone: '01644556677',
    userIgn: 'SADIK_HEADSHOT',
    type: 'CREDIT',
    amount: 1000,
    reason: 'Tournament Booyah 1st Prize Reward',
    balanceAfter: 2100.0,
    timestamp: '2026-10-03T20:45:00Z',
  },
  {
    id: 'tx-103',
    userId: 'u-3',
    userPhone: '01911223344',
    userIgn: 'RAKIB_OP',
    type: 'DEBIT',
    amount: 50,
    reason: 'Classic Match Entry Fee',
    balanceAfter: 350.0,
    timestamp: '2026-10-03T18:00:00Z',
  },
];

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
    return JSON.parse(data);
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
export function loginUser(phone: string, pass: string): { success: boolean; user?: UserAccount; error?: string } {
  const user = getUserByPhone(phone);
  if (!user) {
    return { success: false, error: 'এই ফোন নম্বরে কোনো অ্যাকাউন্ট পাওয়া যায়নি।' };
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
    avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=120',
    notes: 'Self-registered player via portal.',
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem('ff_user', JSON.stringify(newUser));
    localStorage.setItem('ff_token', 'local_jwt_' + newUser.id + '_' + Date.now());
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
  };
}
