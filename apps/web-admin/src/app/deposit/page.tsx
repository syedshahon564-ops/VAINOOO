'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Copy,
  CheckCircle2,
  AlertCircle,
  ArrowDownLeft,
  Clock,
  Sparkles,
  ShieldCheck,
  Send,
  Loader2,
  History,
} from 'lucide-react';
import { useCMS } from '@/lib/cms-store';
import { getCurrentUser, submitDepositRequest } from '@/lib/user-store';

export default function DedicatedDepositPage() {
  const router = useRouter();
  const { settings } = useCMS();
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [method, setMethod] = useState<'BKASH' | 'NAGAD' | 'ROCKET'>('BKASH');
  const [amount, setAmount] = useState<number>(100);
  const [phone, setPhone] = useState('');
  const [trxId, setTrxId] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user?.phone) setPhone(user.phone);
  }, []);

  const paymentNumbers: Record<string, { label: string; number: string; type: string; color: string }> = {
    BKASH: {
      label: 'bKash (বিকাশ)',
      number: settings?.bkashNumber || '01712-345678',
      type: 'Personal (Send Money)',
      color: 'from-pink-500 to-rose-600',
    },
    NAGAD: {
      label: 'Nagad (নগদ)',
      number: settings?.nagadNumber || '01812-345678',
      type: 'Personal (Send Money)',
      color: 'from-orange-500 to-amber-600',
    },
    ROCKET: {
      label: 'Rocket (রকেট)',
      number: 'সাময়িক বন্ধ (Unavailable)',
      type: 'Personal (Send Money)',
      color: 'from-purple-500 to-indigo-600',
    },
  };

  const currentPayment = paymentNumbers[method];

  const handleCopy = () => {
    if (method === 'ROCKET') return;
    navigator.clipboard.writeText(currentPayment.number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (method === 'ROCKET') {
      setMessage({ type: 'error', text: 'রকেট পেমেন্ট সাময়িক বন্ধ রয়েছে। অনুগ্রহ করে বিকাশ বা নগদ নির্বাচন করুন।' });
      setLoading(false);
      return;
    }

    if (!amount || amount < 10) {
      setMessage({ type: 'error', text: 'সর্বনিম্ন ডিপোজিট পরিমাণ ১০ টাকা।' });
      setLoading(false);
      return;
    }

    if (!phone || phone.trim().length < 10) {
      setMessage({ type: 'error', text: 'সঠিক প্রেরক মোবাইল নম্বর প্রদান করুন।' });
      setLoading(false);
      return;
    }

    const cleanTrx = trxId.trim().toUpperCase();
    if (cleanTrx.length < 8 || !/^[A-Z0-9]{8,14}$/.test(cleanTrx)) {
      setMessage({ type: 'error', text: '❌ অবৈধ ট্রানজেকশন আইডি! সঠিক ৮-১২ ডিজিটের TrxID লিখুন।' });
      setLoading(false);
      return;
    }

    const userId = currentUser?.id || currentUser?.phone || phone;
    const res = submitDepositRequest({
      userId: userId,
      userPhone: phone,
      userName: currentUser?.username || currentUser?.ign || 'Player',
      method: method,
      amount: Number(amount),
      accountNumber: phone,
      trxId: cleanTrx,
      autoVerify: true,
    });

    setLoading(false);
    if (res.success) {
      setMessage({
        type: 'success',
        text: '✅ ডিপোজিট রিকোয়েস্ট সফলভাবে জমা হয়েছে! অ্যাডমিন ভেরিফাই করলেই আপনার ব্যালেন্সে যোগ হবে।',
      });
      setTrxId('');
      // Trigger update event
      window.dispatchEvent(new Event('ff_users_updated'));
      window.dispatchEvent(new Event('ff_payment_requests_updated'));
    } else {
      setMessage({ type: 'error', text: res.message || 'ডিপোজিট রিকোয়েস্ট জমা দিতে সমস্যা হয়েছে।' });
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
          অ্যাড মানি (ADD MONEY)
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
        {/* Method Switcher */}
        <div className="grid grid-cols-3 gap-2">
          {(['BKASH', 'NAGAD', 'ROCKET'] as const).map((m) => {
            const isSelected = method === m;
            const isUnavailable = m === 'ROCKET';
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`py-3 px-2 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 shadow-2xs ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 text-slate-900 font-black ring-2 ring-amber-500/20'
                    : 'border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50'
                } ${isUnavailable ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'}`}
              >
                <span className="text-xs uppercase">{m}</span>
                {isUnavailable ? (
                  <span className="text-[9px] text-red-500 font-bold">বন্ধ আছে</span>
                ) : (
                  <span className="text-[9px] text-emerald-600 font-bold">চালু আছে</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Payment Account Display Box */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
              {currentPayment.label} নম্বর
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {currentPayment.type}
            </span>
          </div>

          <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
            <span className="text-lg font-black text-slate-900 tracking-wider font-mono">
              {currentPayment.number}
            </span>
            {method !== 'ROCKET' && (
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition-all shadow-xs"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'কপি হয়েছে' : 'কপি করুন'}</span>
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-500 bg-amber-50/70 border border-amber-200/60 rounded-xl p-2.5 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p>
              উপরের নম্বরে <strong>Send Money</strong> করে ট্রানজেকশন আইডি (TrxID) ও প্রেরক নম্বর নিচে বসিয়ে সাবমিট করুন।
            </p>
          </div>
        </div>

        {/* Deposit Form */}
        <form onSubmit={handleDepositSubmit} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
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
              পরিমাণ (টাকা):
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[25, 50, 100, 200].map((amt) => (
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
              min="10"
              required
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="টাকার পরিমাণ লিখুন (যেমন: 100)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          {/* Sender Phone */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5">
              প্রেরক মোবাইল নম্বর:
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="যে নম্বর থেকে টাকা পাঠিয়েছেন (01XXXXXXXXX)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          {/* TrxID */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5">
              ট্রানজেকশন আইডি (TrxID):
            </label>
            <input
              type="text"
              required
              value={trxId}
              onChange={(e) => setTrxId(e.target.value.toUpperCase())}
              placeholder="মেসেজে প্রাপ্ত ৮-১০ ডিজিটের TrxID"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          <button
            type="submit"
            disabled={loading || method === 'ROCKET'}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-md shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>ডিপোজিট সাবমিট করুন</span>
          </button>
        </form>
      </div>
    </div>
  );
}
