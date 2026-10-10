'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, ArrowDownRight, ArrowUpRight, Check, AlertCircle, Copy } from 'lucide-react';
import { getCurrentUser, addBalance, deductBalance, getTransactions, submitDepositRequest } from '@/lib/user-store';
import { useCMS } from '@/lib/cms-store';

export default function WalletPage() {
  const { settings } = useCMS();
  const [activeTab, setActiveTab] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
  const [method, setMethod] = useState<'BKASH' | 'NAGAD' | 'ROCKET'>('BKASH');
  const [amount, setAmount] = useState<number>(100);
  const [phone, setPhone] = useState('');
  const [trxId, setTrxId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());

  // Dynamic official merchant / personal numbers from settings
  const paymentNumbers = {
    BKASH: `${settings?.bkashNumber || '01712-345678'} (Personal - Send Money)`,
    NAGAD: `${settings?.nagadNumber || '01812-345678'} (Personal - Send Money)`,
    ROCKET: '01912-345678-5 (Personal - Send Money)',
  };

  useEffect(() => {
    const update = () => {
      setCurrentUser(getCurrentUser());
      loadHistory();
    };
    update();
    window.addEventListener('ff_users_updated', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('ff_users_updated', update);
      window.removeEventListener('storage', update);
    };
  }, []);

  function loadHistory() {
    const user = getCurrentUser();
    const userId = user?.id || 'u-1';
    const allTxs = getTransactions();
    const txs = allTxs.filter((t) => !userId || t.userId === userId);
    if (txs.length > 0) {
      setHistory(
        txs.map((t) => ({
          id: t.id,
          type: t.type === 'CREDIT' ? 'DEPOSIT' : (t.category === 'match_join' || t.reason?.toLowerCase().includes('match') || t.reason?.toLowerCase().includes('ম্যাচ') || t.reason?.toLowerCase().includes('slot') || t.reason?.toLowerCase().includes('entry') ? 'MATCH_JOIN' : 'WITHDRAW'),
          method: t.reason.toUpperCase().includes('NAGAD')
            ? 'NAGAD'
            : t.reason.toUpperCase().includes('ROCKET')
            ? 'ROCKET'
            : (t.category === 'match_join' || t.reason?.toLowerCase().includes('match') || t.reason?.toLowerCase().includes('ম্যাচ') ? 'MATCH' : 'BKASH'),
          amount: t.amount,
          trxId: t.reason,
          status: 'APPROVED',
          createdAt: t.timestamp,
        }))
      );
    } else {
      setHistory([
        {
          id: 'demo-tx-1',
          type: 'DEPOSIT',
          method: 'BKASH',
          amount: 200,
          trxId: 'BKA8941729',
          status: 'APPROVED',
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  }

  function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!amount || amount < 10) {
      setMessage({ type: 'error', text: 'সর্বনিম্ন ডিপোজিট পরিমাণ ১০ টাকা।' });
      setLoading(false);
      return;
    }

    if (!phone || phone.trim().length < 10) {
      setMessage({ type: 'error', text: 'সঠিক প্রেরক মোবাইল নম্বর দিন।' });
      setLoading(false);
      return;
    }

    if (!trxId || trxId.trim().length < 6) {
      setMessage({ type: 'error', text: 'সঠিক ট্রানজেকশন আইডি (TrxID) লিখুন।' });
      setLoading(false);
      return;
    }

    const user = getCurrentUser();
    const userId = user?.id || 'u-1';
    const res = submitDepositRequest({
      userId,
      userPhone: user?.phone || phone,
      userName: user?.ign || 'Player',
      method,
      amount: Number(amount),
      accountNumber: phone,
      trxId,
    });
    setMessage({
      type: 'success',
      text: res.message,
    });
    setTrxId('');
    setPhone('');
    setLoading(false);
    loadHistory();
  }

  function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const user = getCurrentUser();
    const currentBalance = user ? user.walletBalance : 1450;

    if (!amount || amount < 50) {
      setMessage({ type: 'error', text: 'সর্বনিম্ন উইথড্র পরিমাণ ৫০ টাকা।' });
      setLoading(false);
      return;
    }

    if (amount > currentBalance) {
      setMessage({ type: 'error', text: 'আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই।' });
      setLoading(false);
      return;
    }

    if (!phone || phone.trim().length < 10) {
      setMessage({ type: 'error', text: 'সঠিক রিসিভার মোবাইল নম্বর দিন।' });
      setLoading(false);
      return;
    }

    const userId = user?.id || 'u-1';
    const res = deductBalance(userId, Number(amount), `উইথড্রল রিকোয়েস্ট (${method}): ${phone}`, 'withdraw');
    setLoading(false);
    if (res.success) {
      setMessage({
        type: 'success',
        text: `৳${amount} উইথড্রল রিকোয়েস্ট সফল হয়েছে! খুব শীঘ্রই পেমেন্ট পাঠানো হবে।`,
      });
      setPhone('');
      loadHistory();
    } else {
      setMessage({ type: 'error', text: res.error || 'উইথড্রল ব্যর্থ হয়েছে।' });
    }
  }

  const copyNumber = () => {
    navigator.clipboard.writeText(paymentNumbers[method].split(' ')[0]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold text-white">bKash & Nagad Wallet</h1>
        <p className="text-sm text-gray-400 mt-1">
          Deposit funds to join matches or withdraw your verified tournament earnings.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-6">
        <button
          onClick={() => {
            setActiveTab('DEPOSIT');
            setMessage(null);
          }}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'DEPOSIT'
              ? 'text-gold border-gold'
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          <ArrowDownRight className="w-4 h-4 text-emerald-400" /> Deposit Funds
        </button>
        <button
          onClick={() => {
            setActiveTab('WITHDRAW');
            setMessage(null);
          }}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'WITHDRAW'
              ? 'text-gold border-gold'
              : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-rose-400" /> Withdraw Earnings
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}
        >
          {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Form Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 glass-panel p-6 sm:p-8 space-y-6">
          {/* Method Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300 uppercase">Select Payment Provider</label>
            <div className="grid grid-cols-3 gap-3">
              {(['BKASH', 'NAGAD', 'ROCKET'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                    method === m
                      ? 'bg-gold/10 border-gold text-gold shadow-md'
                      : 'bg-white/[0.03] border-white/10 text-gray-400 hover:bg-white/[0.06]'
                  }`}
                >
                  {m === 'BKASH' ? 'bKash' : m === 'NAGAD' ? 'Nagad' : 'Rocket'}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'DEPOSIT' ? (
            <form onSubmit={handleDeposit} className="space-y-4">
              {/* Payment Instructions Box */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2 text-xs text-gray-300">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>Send Money Number ({method}):</span>
                  <button
                    type="button"
                    onClick={copyNumber}
                    className="text-gold hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="text-base font-extrabold text-gold tracking-wider">
                  {paymentNumbers[method]}
                </div>
                <p className="text-[11px] text-gray-400">
                  Go to your {method} app, Send Money to the number above, then enter the amount and Transaction ID
                  (TrxID) below.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300">Deposit Amount (BDT)</label>
                <input
                  type="number"
                  min="10"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full mt-1.5 px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-gold focus:outline-none"
                  placeholder="Min ৳10"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300">Your Sender Phone Number</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full mt-1.5 px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-gold focus:outline-none"
                  placeholder="e.g. 017xxxxxxxx"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300">Transaction ID (TrxID)</label>
                <input
                  type="text"
                  required
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  className="w-full mt-1.5 px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-gold focus:outline-none uppercase"
                  placeholder="e.g. BKA8927189"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl btn-gold text-xs font-bold disabled:opacity-50 mt-4"
              >
                {loading ? 'Submitting...' : 'Submit Deposit Request'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-300">Withdrawal Amount (BDT)</label>
                <input
                  type="number"
                  min="50"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full mt-1.5 px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-gold focus:outline-none"
                  placeholder="Min ৳50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300">Your Receiving {method} Number</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full mt-1.5 px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-gold focus:outline-none"
                  placeholder="e.g. 017xxxxxxxx"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                Withdrawals are audited daily by the admin desk to ensure safety and fair play compliance.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl btn-gold text-xs font-bold disabled:opacity-50 mt-4"
              >
                {loading ? 'Processing...' : 'Request Cashout'}
              </button>
            </form>
          )}
        </div>

        {/* Ledger History Side */}
        <div className="lg:col-span-5 glass-panel p-6 sm:p-8 space-y-4">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Wallet className="w-4 h-4 text-gold" /> Transaction History
          </h3>

          <div className="space-y-3 max-h-[460px] overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-xs text-gray-500">No transactions recorded yet.</p>
            ) : (
              history.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span
                        className={tx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-rose-400'}
                      >
                        {tx.type === 'DEPOSIT' ? '+৳' : '-৳'}{tx.amount}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {tx.type === 'DEPOSIT'
                          ? `(ডিপোজিট - ${tx.method})`
                          : tx.type === 'MATCH_JOIN'
                          ? `(ম্যাচ জয়েন ফি)`
                          : `(উইথড্র - ${tx.method})`}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500">{tx.trxId}</div>
                  </div>

                  <div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : tx.status === 'REJECTED'
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
