'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  Minus,
  Edit3,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  ShieldAlert,
  Wallet,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  UserX,
  History,
  Trash2,
  AlertCircle,
  Phone,
  Hash,
  Award,
} from 'lucide-react';
import {
  useUserStore,
  UserAccount,
  BalanceTransaction,
  addBalance,
  deductBalance,
  updateUser,
  addUser,
  deleteUser,
  setUserStatus,
} from '@/lib/user-store';

export default function AdminUsersPage() {
  const { users, transactions, refresh } = useUserStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BANNED'>('ALL');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Visible passwords state (set of user ids whose password is unmasked)
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // MODAL STATES
  // 1. Add Balance Modal
  const [balanceModalUser, setBalanceModalUser] = useState<UserAccount | null>(null);
  const [balanceActionType, setBalanceActionType] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [balanceAmount, setBalanceAmount] = useState<number>(100);
  const [balanceReason, setBalanceReason] = useState<string>('');

  // 2. Edit User Modal
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editIgn, setEditIgn] = useState('');
  const [editUid, setEditUid] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<'PLAYER' | 'ADMIN'>('PLAYER');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'BANNED' | 'SUSPENDED'>('ACTIVE');
  const [editNotes, setEditNotes] = useState('');

  // 3. Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newIgn, setNewIgn] = useState('');
  const [newUid, setNewUid] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newInitialBalance, setNewInitialBalance] = useState(100);
  const [newRole, setNewRole] = useState<'PLAYER' | 'ADMIN'>('PLAYER');

  // 4. Transaction History Tab
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const togglePasswordVisibility = (userId: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} কপি করা হয়েছে!`, 'success');
  };

  // Open Balance Modal
  const openBalanceModal = (user: UserAccount, type: 'ADD' | 'DEDUCT') => {
    setBalanceModalUser(user);
    setBalanceActionType(type);
    setBalanceAmount(type === 'ADD' ? 100 : 50);
    setBalanceReason(type === 'ADD' ? 'বিকাশ ডিপোজিট ভেরিফাইড' : 'উইথড্র কমপ্লিট');
  };

  const handleBalanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!balanceModalUser) return;

    if (balanceActionType === 'ADD') {
      const res = addBalance(balanceModalUser.id, Number(balanceAmount), balanceReason);
      if (res.success) {
        showToast(
          `৳${balanceAmount} টাকা যোগ করা হয়েছে (${balanceModalUser.ign})! নতুন ব্যালেন্স: ৳${res.newBalance}`,
          'success'
        );
        setBalanceModalUser(null);
        refresh();
      } else {
        showToast(res.error || 'টাকা যোগ করা যায়নি', 'error');
      }
    } else {
      const res = deductBalance(balanceModalUser.id, Number(balanceAmount), balanceReason);
      if (res.success) {
        showToast(
          `৳${balanceAmount} টাকা কাটা হয়েছে (${balanceModalUser.ign})! নতুন ব্যালেন্স: ৳${res.newBalance}`,
          'success'
        );
        setBalanceModalUser(null);
        refresh();
      } else {
        showToast(res.error || 'টাকা কাটা যায়নি', 'error');
      }
    }
  };

  // Open Edit Modal
  const openEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setEditIgn(user.ign);
    setEditUid(user.uid);
    setEditPhone(user.phone);
    setEditPassword(user.password);
    setEditRole(user.role === 'ADMIN' ? 'ADMIN' : 'PLAYER');
    setEditStatus(user.status);
    setEditNotes(user.notes || '');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    updateUser(editingUser.id, {
      ign: editIgn.trim().toUpperCase(),
      uid: editUid.trim(),
      phone: editPhone.trim(),
      password: editPassword,
      role: editRole,
      status: editStatus,
      notes: editNotes,
    });

    showToast(`ইউজার "${editIgn}" এর তথ্য সফলভাবে আপডেট হয়েছে!`, 'success');
    setEditingUser(null);
    refresh();
  };

  // Handle Create User Submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIgn || !newPhone || !newPassword) {
      showToast('নাম, ফোন নম্বর ও পাসওয়ার্ড আবশ্যক!', 'error');
      return;
    }

    const created = addUser({
      ign: newIgn.trim().toUpperCase(),
      uid: newUid.trim() || String(Math.floor(100000000 + Math.random() * 900000000)),
      phone: newPhone.trim(),
      password: newPassword,
      walletBalance: Number(newInitialBalance) || 0,
      role: newRole,
      status: 'ACTIVE',
      matchesPlayed: 0,
      totalKills: 0,
      totalWins: 0,
      avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=120',
      notes: 'Created manually by Admin.',
    });

    showToast(`নতুন ইউজার "${created.ign}" সফলভাবে যুক্ত করা হয়েছে!`, 'success');
    setShowCreateModal(false);
    setNewIgn('');
    setNewUid('');
    setNewPhone('');
    setNewPassword('');
    setNewInitialBalance(100);
    refresh();
  };

  // Quick Ban / Unban Toggle
  const handleToggleBan = (user: UserAccount) => {
    const newStatus = user.status === 'BANNED' ? 'ACTIVE' : 'BANNED';
    setUserStatus(user.id, newStatus);
    showToast(
      `ইউজার ${user.ign} কে ${newStatus === 'BANNED' ? 'ব্যান (Banned)' : 'আনব্যান (Active)'} করা হয়েছে!`,
      newStatus === 'BANNED' ? 'error' : 'success'
    );
    refresh();
  };

  // Delete User
  const handleDeleteUser = (user: UserAccount) => {
    if (confirm(`আপনি কি নিশ্চিত যে "${user.ign}" অ্যাকাউন্টটি সম্পূর্ণ ডিলিট করতে চান?`)) {
      deleteUser(user.id);
      showToast(`ইউজার ${user.ign} ডিলিট করা হয়েছে!`, 'success');
      refresh();
    }
  };

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.ign.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm) ||
      u.uid.includes(searchTerm);
    if (statusFilter === 'ALL') return matchSearch;
    return matchSearch && u.status === statusFilter;
  });

  // Aggregate Stats
  const totalBalanceSum = users.reduce((acc, u) => acc + (u.walletBalance || 0), 0);
  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;
  const bannedCount = users.filter((u) => u.status === 'BANNED').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold transition-all ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200 dark:border-white/10">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-red-600" />
            ইউজার ম্যানেজমেন্ট ও প্লেয়ার অ্যাকাউন্টস
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            সকল ইউজারের বিস্তারিত তথ্য, পাসওয়ার্ড, অ্যাকাউন্ট ব্যালেন্স ম্যানেজমেন্ট (+ যোগ / - কাটা) ও পূর্ণ নিয়ন্ত্রণ।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] hover:bg-gray-50 dark:hover:bg-white/5 text-xs font-bold text-gray-700 dark:text-gray-300 transition-all"
          >
            <History className="w-4 h-4 text-amber-500" />
            লেনদেন হিস্টোরি ({transactions.length})
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl btn-red text-xs font-black shadow-md shadow-red-600/30"
          >
            <Plus className="w-4 h-4" />
            নতুন ইউজার যোগ করুন
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] shadow-sm">
          <span className="text-[10px] font-black uppercase text-gray-500">মোট ইউজার</span>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-1 flex items-center gap-1.5">
            <Users className="w-5 h-5 text-blue-500" />
            {users.length}
          </div>
          <span className="text-[10px] text-gray-400 mt-1 block">নিবন্ধিত প্লেয়ার অ্যাকাউন্ট</span>
        </div>

        <div className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] shadow-sm">
          <span className="text-[10px] font-black uppercase text-gray-500">মোট প্ল্যাটফর্ম ব্যালেন্স</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
            <Coins className="w-5 h-5" />৳ {totalBalanceSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-gray-400 mt-1 block">সব ইউজারের মোট টাকা</span>
        </div>

        <div className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] shadow-sm">
          <span className="text-[10px] font-black uppercase text-gray-500">অ্যাক্টিভ প্লেয়ার</span>
          <div className="text-2xl font-black text-emerald-500 mt-1 flex items-center gap-1.5">
            <UserCheck className="w-5 h-5" />
            {activeCount}
          </div>
          <span className="text-[10px] text-emerald-600/80 mt-1 block">ম্যাচ খেলার জন্য প্রস্তুত</span>
        </div>

        <div className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] shadow-sm">
          <span className="text-[10px] font-black uppercase text-gray-500">ব্যানড অ্যাকাউন্ট</span>
          <div className="text-2xl font-black text-rose-500 mt-1 flex items-center gap-1.5">
            <UserX className="w-5 h-5" />
            {bannedCount}
          </div>
          <span className="text-[10px] text-rose-400 mt-1 block">সাসপেন্ড বা নিষিদ্ধ</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a]">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ইউজারের নাম (IGN), ফোন নম্বর অথবা Free Fire UID লিখে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-medium focus:outline-none focus:border-red-500 text-gray-900 dark:text-white"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-black/40 p-1 rounded-xl">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'ALL'
                ? 'bg-white dark:bg-red-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            সব ({users.length})
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'ACTIVE'
                ? 'bg-white dark:bg-emerald-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-emerald-500'
            }`}
          >
            অ্যাক্টিভ ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('BANNED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'BANNED'
                ? 'bg-white dark:bg-rose-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-rose-500'
            }`}
          >
            ব্যানড ({bannedCount})
          </button>
        </div>
      </div>

      {/* Users List Table & Cards */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-black/40 text-[10px] font-black uppercase text-gray-500 tracking-wider">
                <th className="py-3.5 px-4">প্লেয়ার / IGN</th>
                <th className="py-3.5 px-4">ফোন ও UID</th>
                <th className="py-3.5 px-4">পাসওয়ার্ড (Password)</th>
                <th className="py-3.5 px-4">ওয়ালেট ব্যালেন্স</th>
                <th className="py-3.5 px-4">স্ট্যাটাস</th>
                <th className="py-3.5 px-4">ম্যাচ / কিল</th>
                <th className="py-3.5 px-4 text-right">অ্যাকশন ও ব্যালেন্স কন্ট্রোল</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    কোনো ইউজার খুঁজে পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isPasswordRevealed = !!revealedPasswords[user.id];

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Player Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/20 bg-slate-800 flex-shrink-0">
                            <img
                              src={
                                user.avatar ||
                                'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=120'
                              }
                              alt={user.ign}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-gray-900 dark:text-white">
                                {user.ign}
                              </span>
                              {user.role === 'ADMIN' && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-500/20 text-red-500 border border-red-500/30">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 block truncate">
                              ID: {user.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Phone & UID */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-mono text-gray-700 dark:text-gray-300 font-bold">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            <span>{user.phone}</span>
                            <button
                              onClick={() => copyToClipboard(user.phone, 'ফোন নম্বর')}
                              className="p-1 hover:text-red-500 text-gray-400 transition-colors"
                              title="কপি করুন"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-mono text-gray-400">
                            <Hash className="w-3 h-3" />
                            <span>UID: {user.uid}</span>
                          </div>
                        </div>
                      </td>

                      {/* Password (Visible or toggle reveal) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-black/50 border border-gray-200 dark:border-white/10 font-mono text-xs font-bold text-gray-800 dark:text-gray-200 min-w-[100px] flex items-center justify-between">
                            <span>
                              {isPasswordRevealed ? user.password : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(user.id)}
                              className="ml-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                              title={isPasswordRevealed ? 'লুকান' : 'পাসওয়ার্ড দেখুন'}
                            >
                              {isPasswordRevealed ? (
                                <EyeOff className="w-3.5 h-3.5 text-red-500" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <button
                            onClick={() => copyToClipboard(user.password, 'পাসওয়ার্ড')}
                            className="p-1 hover:text-red-500 text-gray-400 transition-colors"
                            title="পাসওয়ার্ড কপি করুন"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Wallet Balance */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 font-black text-emerald-600 dark:text-emerald-400 shadow-sm">
                          <Wallet className="w-3.5 h-3.5" />
                          <span>৳ {user.walletBalance.toFixed(2)}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            user.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {user.status === 'ACTIVE' ? 'অ্যাক্টিভ' : 'ব্যানড'}
                        </span>
                      </td>

                      {/* Matches / Stats */}
                      <td className="py-3.5 px-4">
                        <div className="text-[11px] text-gray-600 dark:text-gray-300">
                          <span className="font-bold">{user.matchesPlayed}</span> ম্যাচ •{' '}
                          <span className="font-bold text-amber-500">{user.totalKills}</span> কিল
                        </div>
                        <span className="text-[10px] text-emerald-500 font-bold">
                          {user.totalWins} Booyah
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Add Balance Button */}
                          <button
                            onClick={() => openBalanceModal(user, 'ADD')}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black transition-all shadow-sm"
                            title="টাকা যোগ করুন (+ Add Balance)"
                          >
                            <Plus className="w-3 h-3" />
                            <span>টাকা যোগ</span>
                          </button>

                          {/* Deduct Balance Button */}
                          <button
                            onClick={() => openBalanceModal(user, 'DEDUCT')}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black transition-all shadow-sm"
                            title="টাকা কাটুন (- Deduct Balance)"
                          >
                            <Minus className="w-3 h-3" />
                            <span>টাকা কাটুন</span>
                          </button>

                          {/* Edit User Button */}
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 transition-colors"
                            title="তথ্য ও পাসওয়ার্ড এডিট করুন"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Ban / Unban Toggle Button */}
                          <button
                            onClick={() => handleToggleBan(user)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              user.status === 'BANNED'
                                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                            }`}
                            title={user.status === 'BANNED' ? 'আনব্যান করুন' : 'ব্যান করুন'}
                          >
                            {user.status === 'BANNED' ? (
                              <UserCheck className="w-3.5 h-3.5" />
                            ) : (
                              <UserX className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-gray-400 hover:text-rose-600 transition-colors"
                            title="অ্যাকাউন্ট ডিলিট করুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD OR DEDUCT BALANCE */}
      {balanceModalUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#12121a] border border-gray-200 dark:border-white/10 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${
                    balanceActionType === 'ADD' ? 'bg-emerald-600' : 'bg-amber-600'
                  }`}
                >
                  {balanceActionType === 'ADD' ? (
                    <ArrowUpRight className="w-5 h-5" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white">
                    {balanceActionType === 'ADD' ? 'টাকা যোগ করুন (+ Credit)' : 'টাকা কাটুন (- Debit)'}
                  </h3>
                  <span className="text-[11px] text-gray-500">
                    প্লেয়ার: <span className="font-bold text-red-500">{balanceModalUser.ign}</span> (
                    {balanceModalUser.phone})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setBalanceModalUser(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Current Balance Display */}
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-semibold">ইউজারের বর্তমান ব্যালেন্স:</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                ৳ {balanceModalUser.walletBalance.toFixed(2)}
              </span>
            </div>

            <form onSubmit={handleBalanceSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  টাকার পরিমাণ (BDT ৳)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-400">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={balanceAmount}
                    onChange={(e) => setBalanceAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-sm font-black text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {[20, 50, 100, 200, 500, 1000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBalanceAmount(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        balanceAmount === preset
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {balanceActionType === 'ADD' ? '+' : '-'}৳{preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  কারণ / রেফারেন্স নোট (Reason / Note)
                </label>
                <input
                  type="text"
                  required
                  value={balanceReason}
                  onChange={(e) => setBalanceReason(e.target.value)}
                  placeholder="যেমন: বিকাশ ডিপোজিট (TrxID), উইথড্রয়াল, পেনাল্টি ইত্যাদি..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-medium focus:outline-none focus:border-red-500 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBalanceModalUser(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl text-xs font-black text-white shadow-md transition-all ${
                    balanceActionType === 'ADD'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                      : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                  }`}
                >
                  {balanceActionType === 'ADD' ? 'ব্যালেন্স নিশ্চিত করুন (+)' : 'ব্যালেন্স কেটে নিন (-)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT USER DETAILS & PASSWORD */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#12121a] border border-gray-200 dark:border-white/10 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-red-600" />
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white">
                    ইউজার তথ্য ও পাসওয়ার্ড পরিবর্তন
                  </h3>
                  <span className="text-[11px] text-gray-500">অ্যাকাউন্ট ID: {editingUser.id}</span>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    ইন-গেম নেম (In-Game Name / IGN)
                  </label>
                  <input
                    type="text"
                    required
                    value={editIgn}
                    onChange={(e) => setEditIgn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Free Fire Player UID
                  </label>
                  <input
                    type="text"
                    required
                    value={editUid}
                    onChange={(e) => setEditUid(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    ফোন নম্বর (Phone Number)
                  </label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1 flex items-center justify-between">
                    <span>পাসওয়ার্ড (Password)</span>
                    <span className="text-[10px] text-amber-500">সরাসরি পরিবর্তনযোগ্য</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-mono font-bold text-red-500 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    ইউজার রোল (Role)
                  </label>
                  <select
                    value={editRole}
                    onChange={(e: any) => setEditRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-red-500 text-gray-900 dark:text-white"
                  >
                    <option value="PLAYER">PLAYER (প্লেয়ার)</option>
                    <option value="ADMIN">ADMIN (অ্যাডমিন / সুপারভাইজার)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    অ্যাকাউন্ট স্ট্যাটাস (Status)
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e: any) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-red-500 text-gray-900 dark:text-white"
                  >
                    <option value="ACTIVE">ACTIVE (সক্রিয়)</option>
                    <option value="BANNED">BANNED (ব্যানড / নিষিদ্ধ)</option>
                    <option value="SUSPENDED">SUSPENDED (স্থগিত)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  অ্যাডমিন নোট (Admin Notes)
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="প্লেয়ার সংক্রান্ত কোনো নোট বা সতর্কবার্তা..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black btn-red shadow-md shadow-red-600/30"
                >
                  তথ্য সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE NEW USER */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#12121a] border border-gray-200 dark:border-white/10 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-red-600" />
                <h3 className="text-sm font-black text-gray-900 dark:text-white">
                  নতুন প্লেয়ার অ্যাকাউন্ট তৈরি করুন
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  ইন-গেম নেম (IGN)
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: BDX_STRIKER"
                  value={newIgn}
                  onChange={(e) => setNewIgn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    ফোন নম্বর
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="017xxxxxxxx"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Free Fire UID
                  </label>
                  <input
                    type="text"
                    placeholder="192837465"
                    value={newUid}
                    onChange={(e) => setNewUid(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  পাসওয়ার্ড (Password)
                </label>
                <input
                  type="text"
                  required
                  placeholder="পাসওয়ার্ড লিখুন..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-mono focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    প্রারম্ভিক ব্যালেন্স (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newInitialBalance}
                    onChange={(e) => setNewInitialBalance(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    রোল (Role)
                  </label>
                  <select
                    value={newRole}
                    onChange={(e: any) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs font-bold focus:outline-none focus:border-red-500 text-gray-900 dark:text-white"
                  >
                    <option value="PLAYER">PLAYER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black btn-red shadow-md shadow-red-600/30"
                >
                  অ্যাকাউন্ট তৈরি করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: TRANSACTION AUDIT LEDGER */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#12121a] border border-gray-200 dark:border-white/10 p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white">
                    ব্যালেন্স লেনদেন ও অ্যাডমিন অ্যাকশন হিস্টোরি
                  </h3>
                  <span className="text-[11px] text-gray-500">
                    ইউজারদের ব্যালেন্স যোগ ও কর্তনের সম্পূর্ণ অডিট লগ
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {transactions.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs">
                  এখনও কোনো লেনদেনের রেকর্ড তৈরি হয়নি।
                </div>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
                          tx.type === 'CREDIT' ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      >
                        {tx.type === 'CREDIT' ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-gray-900 dark:text-white">
                            {tx.userIgn}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            ({tx.userPhone})
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500">{tx.reason}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-black text-sm ${
                          tx.type === 'CREDIT'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {tx.type === 'CREDIT' ? '+' : '-'}৳{tx.amount.toFixed(2)}
                      </span>
                      <span className="block text-[10px] text-gray-400 mt-0.5">
                        {new Date(tx.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        • {new Date(tx.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
