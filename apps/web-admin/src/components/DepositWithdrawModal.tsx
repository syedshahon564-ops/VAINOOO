'use client';

import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  X,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { useCMS } from '@/lib/cms-store';
import { useLanguage } from '@/components/LanguageProvider';
import {
  getCurrentUser,
  addBalance,
  deductBalance,
  submitDepositRequest,
  submitWithdrawRequest,
} from '@/lib/user-store';

interface DepositWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'DEPOSIT' | 'WITHDRAW';
}

export default function DepositWithdrawModal({
  isOpen,
  onClose,
  initialTab = 'DEPOSIT',
}: DepositWithdrawModalProps) {
  const { settings } = useCMS();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'DEPOSIT' | 'WITHDRAW'>(initialTab);
  const [method, setMethod] = useState<'BKASH' | 'NAGAD' | 'ROCKET'>('BKASH');
  const [amount, setAmount] = useState<number>(100);
  const [phone, setPhone] = useState('');
  const [trxId, setTrxId] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'pending'; text: string } | null>(null);

  const currentUser = getCurrentUser();
  const currentBalance = currentUser ? (currentUser.walletBalance || 0) : 1450.0;

  if (!isOpen) return null;

  const paymentNumbers: Record<string, { label: string; number: string; type: string }> = {
    BKASH: {
      label: 'bKash (বিকাশ)',
      number: settings?.bkashNumber || '01712345678',
      type: 'Personal (Send Money)',
    },
    NAGAD: {
      label: 'Nagad (নগদ)',
      number: settings?.nagadNumber || '01812345678',
      type: 'Personal (Send Money)',
    },
    ROCKET: {
      label: 'Dutch-Bangla Rocket (ডাচ-বাংলা/রকেট)',
      number: settings?.rocketNumber || '01912345678-5',
      type: 'Personal (Send Money)',
    },
  };

  const currentPayment = paymentNumbers[method];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentPayment.number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    if (!amount || amount < 10) {
      setMessage({ type: 'error', text: 'সর্বনিম্ন ডিপোজিট পরিমাণ ১০ টাকা।' });
      setSubmitting(false);
      return;
    }

    if (!phone || phone.trim().length < 10) {
      setMessage({ type: 'error', text: 'সঠিক প্রেরক মোবাইল নম্বর দিন।' });
      setSubmitting(false);
      return;
    }

    const cleanTrx = trxId.trim().toUpperCase();
    if (cleanTrx.length < 8 || !/^[A-Z0-9]{8,14}$/.test(cleanTrx)) {
      setMessage({
        type: 'error',
        text: '❌ অবৈধ ট্রানজেকশন আইডি! সঠিক ৮-১২ ডিজিটের bKash/Nagad/Rocket TrxID লিখুন (যেমন: BKA8941729 বা 71F92D0A)।',
      });
      setSubmitting(false);
      return;
    }

    const userId = currentUser?.id || 'u-1';
    const userPhone = currentUser?.phone || phone;
    const userName = currentUser?.ign || 'Player';

    const res = submitDepositRequest({
      userId,
      userPhone,
      userName,
      method,
      amount: Number(amount),
      accountNumber: phone,
      trxId: cleanTrx,
      autoVerify: false,
    });
    setSubmitting(false);

    if (res.success) {
      setMessage({
        type: 'pending',
        text: `⏳ আপনার ৳${amount} ডিপোজিট রিকোয়েস্ট জমা হয়েছে (পেন্ডিং)! এডমিন অফিসিয়াল স্টেটমেন্ট মিলিয়ে TrxID (${cleanTrx}) যাচাই করার পর ব্যালেন্স যোগ করবেন।`,
      });
      setTrxId('');
      setPhone('');
      setTimeout(() => {
        setMessage(null);
        onClose();
      }, 3500);
    } else {
      setMessage({ type: 'error', text: 'ডিপোজিট রিকোয়েস্ট পাঠানো যায়নি।' });
    }
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    if (!amount || amount < 50) {
      setMessage({ type: 'error', text: 'সর্বনিম্ন উইথড্র পরিমাণ ৫০ টাকা।' });
      setSubmitting(false);
      return;
    }

    if (amount > currentBalance) {
      setMessage({ type: 'error', text: 'আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই।' });
      setSubmitting(false);
      return;
    }

    if (!phone || phone.trim().length < 10) {
      setMessage({ type: 'error', text: 'সঠিক রিসিভার মোবাইল নম্বর দিন।' });
      setSubmitting(false);
      return;
    }

    const userId = currentUser?.id || 'u-1';
    const userPhone = currentUser?.phone || phone;
    const userName = currentUser?.ign || 'Player';

    const res = submitWithdrawRequest({
      userId,
      userPhone,
      userName,
      method,
      amount: Number(amount),
      accountNumber: phone,
    });
    setSubmitting(false);

    if (res.success) {
      setMessage({
        type: 'success',
        text: `৳${amount} উইথড্রল রিকোয়েস্ট সফল হয়েছে! খুব শীঘ্রই ${method} নম্বরে (${phone}) পেমেন্ট পাঠানো হবে।`,
      });
      setPhone('');
      setTimeout(() => {
        setMessage(null);
        onClose();
      }, 1500);
    } else {
      setMessage({ type: 'error', text: res.error || 'উইথড্রল ব্যর্থ হয়েছে।' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#12121a] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-red-800 via-red-600 to-black text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/20 flex items-center justify-center text-amber-400">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-wide">
                  {t('ওয়ালেট ও লেনদেন', 'Wallet & Payments')}
                </h3>
                <p className="text-xs text-gray-200">
                  {settings?.siteName || 'FF RIVAL TOUR BD'} Official Finance
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-gray-300 uppercase font-bold block">
                {t('বর্তমান ব্যালেন্স', 'Current Balance')}
              </span>
              <span className="text-xl font-black text-amber-300">
                ৳ {currentBalance.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex gap-2 mt-5 p-1 bg-black/30 rounded-xl border border-white/10">
            <button
              onClick={() => {
                setActiveTab('DEPOSIT');
                setMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-2 transition-all ${
                activeTab === 'DEPOSIT'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <ArrowDownRight className="w-4 h-4 text-emerald-400" />
              <span>{t('ডিপোজিট (Deposit)', 'Deposit')}</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('WITHDRAW');
                setMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-2 transition-all ${
                activeTab === 'WITHDRAW'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-amber-400" />
              <span>{t('উইথড্র (Withdraw)', 'Withdraw')}</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {message && (
            <div
              className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : message.type === 'pending'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : message.type === 'pending' ? (
                <Clock className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {activeTab === 'DEPOSIT' ? (
            <form onSubmit={handleDepositSubmit} className="space-y-4">
              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
                  {t('পেমেন্ট মেথড নির্বাচন করুন:', 'Select Payment Method:')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['BKASH', 'NAGAD', 'ROCKET'] as const).map((m) => {
                    const isSel = method === m;
                    const colors = {
                      BKASH: 'border-pink-500 text-pink-600 bg-pink-50/50 dark:bg-pink-950/20',
                      NAGAD: 'border-orange-500 text-orange-600 bg-orange-50/50 dark:bg-orange-950/20',
                      ROCKET: 'border-purple-500 text-purple-600 bg-purple-50/50 dark:bg-purple-950/20',
                    };
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMethod(m)}
                        className={`py-2.5 px-3 rounded-xl border-2 text-xs font-black transition-all flex flex-col items-center gap-0.5 ${
                          isSel
                            ? colors[m]
                            : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                        }`}
                      >
                        <span>{m === 'BKASH' ? 'বিকাশ' : m === 'NAGAD' ? 'নগদ' : 'রকেট'}</span>
                        <span className="text-[10px] font-normal opacity-80">{m}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Official Number Card */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                    {currentPayment.label} নম্বর:
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300">
                    {currentPayment.type}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 bg-white dark:bg-black/40 p-2.5 rounded-xl border border-amber-500/20">
                  <span className="font-mono text-base font-black text-gray-900 dark:text-white tracking-wider">
                    {currentPayment.number}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-black flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-gray-300">
                  ⚠️ উপরের নম্বরে Send Money করে নিচের বক্সে আপনার মোবাইল নম্বর ও TrxID দিন।
                </p>
              </div>

              {/* Payment Instruction Banner & Text from Settings */}
              {settings?.paymentInstructionText && (
                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-gray-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>সেন্ড মানি নির্দেশাবলী:</span>
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">
                    {settings.paymentInstructionText}
                  </p>
                  {settings.paymentInstructionImage && settings.paymentInstructionImage !== '/logo.png' && (
                    <div className="pt-1">
                      <img
                        src={settings.paymentInstructionImage}
                        alt="Payment QR/Guide"
                        className="max-h-36 rounded-xl border border-gray-200 dark:border-white/10 object-contain mx-auto"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Amount Quick Pills */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                  {t('টাকার পরিমাণ (BDT):', 'Amount (BDT):')}
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {[50, 100, 200, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(amt)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                        amount === amt
                          ? 'bg-red-600 text-white border-red-600 shadow'
                          : 'border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                      }`}
                    >
                      ৳ {amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={10}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  required
                  placeholder="টাকার পরিমাণ লিখুন"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Sender Phone Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                  {t('যে নম্বর থেকে টাকা পাঠিয়েছেন:', 'Sender Phone Number:')}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Transaction ID */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                  {t('ট্রানজেকশন আইডি (TrxID):', 'Transaction ID (TrxID):')}
                </label>
                <input
                  type="text"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                  required
                  placeholder="যেমন: BKA7891234"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-sm font-mono uppercase text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>{submitting ? 'যাচাই করা হচ্ছে...' : 'ডিপোজিট রিকোয়েস্ট পাঠান'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
                  {t('উইথড্র মেথড নির্বাচন করুন:', 'Select Withdraw Method:')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['BKASH', 'NAGAD', 'ROCKET'] as const).map((m) => {
                    const isSel = method === m;
                    const colors = {
                      BKASH: 'border-pink-500 text-pink-600 bg-pink-50/50 dark:bg-pink-950/20',
                      NAGAD: 'border-orange-500 text-orange-600 bg-orange-50/50 dark:bg-orange-950/20',
                      ROCKET: 'border-purple-500 text-purple-600 bg-purple-50/50 dark:bg-purple-950/20',
                    };
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMethod(m)}
                        className={`py-2.5 px-3 rounded-xl border-2 text-xs font-black transition-all flex flex-col items-center gap-0.5 ${
                          isSel
                            ? colors[m]
                            : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                        }`}
                      >
                        <span>{m === 'BKASH' ? 'বিকাশ' : m === 'NAGAD' ? 'নগদ' : 'রকেট'}</span>
                        <span className="text-[10px] font-normal opacity-80">{m}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                  {t('উইথড্র পরিমাণ (BDT):', 'Withdraw Amount (BDT):')}
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {[100, 200, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(amt)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                        amount === amt
                          ? 'bg-red-600 text-white border-red-600 shadow'
                          : 'border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                      }`}
                    >
                      ৳ {amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={50}
                  max={currentBalance}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  required
                  placeholder="উইথড্রর পরিমাণ লিখুন (সর্বনিম্ন ৫০)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Receiver Phone Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                  {t('যে নম্বরে টাকা গ্রহণ করবেন:', 'Receiver Phone Number:')}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="01XXXXXXXXX (Personal Number)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-[11px] text-gray-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>উইথড্রল রিকোয়েস্ট দেওয়ার ৫ থেকে ৩০ মিনিটের মধ্যে পেমেন্ট সম্পন্ন হবে।</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>{submitting ? 'প্রসেসিং হচ্ছে...' : 'উইথড্রল কনফার্ম করুন'}</span>
              </button>
            </form>
          )}

          {/* Telegram Support Link */}
          <div className="pt-2 border-t border-gray-100 dark:border-white/10 text-center">
            <a
              href={settings?.telegramUrl || 'https://t.me/ffrivaltourbd'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>💬 পেমেন্ট সংক্রান্ত যেকোনো সমস্যায় সরাসরি টেলিগ্রাম সাপোর্টে মেসেজ দিন</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
