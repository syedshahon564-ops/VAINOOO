'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Wallet,
  ShieldCheck,
  Send,
  Loader2,
  History,
} from 'lucide-react';
import { getCurrentUser, submitWithdrawRequest } from '@/lib/user-store';

export default function DedicatedWithdrawPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [method, setMethod] = useState<'BKASH' | 'NAGAD'>('BKASH');
  const [amount, setAmount] = useState<number>(100);
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user?.phone) setAccountNumber(user.phone);
  }, []);

  const balance = Number(currentUser?.walletBalance || 0);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!amount || amount < 50) {
      setMessage({ type: 'error', text: 'সর্বনিম্ন উইথড্র পরিমাণ ৫০ টাকা।' });
      setLoading(false);
      return;
    }

    if (amount > balance) {
      setMessage({ type: 'error', text: 'অপর্যাপ্ত ব্যালেন্স! আপনার ব্যালেন্সের চেয়ে বেশি উইথড্র করা যাবে না।' });
      setLoading(false);
      return;
    }

    if (!accountNumber || accountNumber.trim().length < 10) {
      setMessage({ type: 'error', text: 'সঠিক বিকাশ বা নগদ মোবাইল নম্বর প্রদান করুন।' });
      setLoading(false);
      return;
    }

    const userId = currentUser?.id || currentUser?.phone || accountNumber;
    const res = submitWithdrawRequest({
      userId: userId,
      userPhone: accountNumber,
      userName: currentUser?.username || currentUser?.ign || 'Player',
      method: method,
      amount: Number(amount),
      accountNumber: accountNumber,
    });

    setLoading(false);
    if (res.success) {
      setMessage({
        type: 'success',
        text: '✅ উইথড্র রিকোয়েস্ট সফলভাবে জমা হয়েছে! দ্রুত আপনার অ্যাকাউন্টে টাকা পাঠিয়ে দেওয়া হবে।',
      });
      // Refresh current user balance
      const updatedUser = getCurrentUser();
      setCurrentUser(updatedUser);
      // Trigger update event
      window.dispatchEvent(new Event('ff_users_updated'));
      window.dispatchEvent(new Event('ff_payment_requests_updated'));
    } else {
      setMessage({ type: 'error', text: res.error || 'উইথড্র রিকোয়েস্ট জমা দিতে সমস্যা হয়েছে।' });
    }
  };

  return (
    <div className="min-h-screen bg-[#faf5ff] text-slate-800 pb-16 font-sans select-none">
      {/* 1. Header Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-2xs">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-800 hover:bg-slate-100 active:scale-95 transition-all"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>

        <h1 className="text-base font-black tracking-wider text-slate-900 uppercase">
          উইথড্র (WITHDRAW MONEY)
        </h1>

        <Link
          href="/history"
          className="text-xs font-black text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-xl flex items-center gap-1 active:scale-95 transition-all"
        >
          <History className="w-3.5 h-3.5" />
          <span>হিস্ট্রি</span>
        </Link>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Wallet Balance Display Card */}
        <div className="p-5 rounded-3xl bg-gradient-to-tr from-emerald-700 via-teal-600 to-emerald-900 text-white shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
              উইথড্রযোগ্য ব্যালেন্স
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
              ইনস্ট্যান্ট পেআউট
            </span>
          </div>
          <div className="text-3xl font-black">৳ {balance.toFixed(2)}</div>
          <div className="text-[11px] text-emerald-100/90 pt-1 border-t border-white/20">
            ম্যাচে জেতা প্রাইজমানি সরাসরি আপনার বিকাশ বা নগদে তুলে নিন।
          </div>
        </div>

        {/* Method Switcher */}
        <div className="grid grid-cols-2 gap-2">
          {(['BKASH', 'NAGAD'] as const).map((m) => {
            const isSelected = method === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`py-3 px-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 shadow-2xs active:scale-95 ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-600/10 text-slate-900 font-black ring-2 ring-emerald-600/20'
                    : 'border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50'
                }`}
              >
                <span className="text-sm uppercase font-black">{m}</span>
                <span className="text-[10px] text-emerald-700 font-bold">ব্যক্তিগত অ্যাকাউন্ট</span>
              </button>
            );
          })}
        </div>

        {/* Withdraw Form */}
        <form onSubmit={handleWithdrawSubmit} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
          {message && (
            <div
              className={`p-3 rounded-2xl text-xs font-bold flex items-start gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Quick Amounts */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5">
              উইথড্র পরিমাণ (টাকা):
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[50, 100, 200, 500].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt)}
                  className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    amount === amt
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ৳ {amt}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="50"
              max={balance}
              required
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="টাকার পরিমাণ লিখুন (সর্বনিম্ন ৫০)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          {/* Receiver Phone */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5">
              {method} প্রাপক মোবাইল নম্বর:
            </label>
            <input
              type="tel"
              required
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="যে নম্বরে টাকা নিবেন (01XXXXXXXXX)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p>
              উইথড্র রিকোয়েস্ট দেওয়ার ৫ থেকে ১৫ মিনিটের মধ্যে পেআউট অটোমেটিকভাবে প্রসেস হয়ে যাবে।
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || balance < 50}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-md shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>উইথড্র কনফার্ম করুন</span>
          </button>
        </form>
      </div>
    </div>
  );
}
