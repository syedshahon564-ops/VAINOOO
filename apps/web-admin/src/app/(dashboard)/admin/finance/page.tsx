'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Check, X, AlertCircle } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';

export default function AdminFinancePage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    try {
      const res = await ApiClient.adminGetTransactions();
      setTransactions(res.transactions || []);
    } catch (err) {
      setTransactions([
        {
          id: 'tx-1',
          type: 'DEPOSIT',
          method: 'BKASH',
          amount: 300,
          phone: '01711223344',
          trxId: 'BKA7829102',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          user: { ign: 'BDX_STRIKER', uid: '192837465' },
        },
        {
          id: 'tx-2',
          type: 'WITHDRAW',
          method: 'NAGAD',
          amount: 1200,
          phone: '01988776655',
          trxId: 'WD-78192',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          user: { ign: 'Silent_Sniper', uid: '99887711' },
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      await ApiClient.adminApproveTransaction(id);
      setMessage({ type: 'success', text: 'Transaction approved and funds transferred.' });
      loadTransactions();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Approval failed' });
    }
  }

  async function handleReject(id: string) {
    const reason = prompt('Enter rejection reason:') || 'Invalid transaction reference';
    try {
      await ApiClient.adminRejectTransaction(id, reason);
      setMessage({ type: 'success', text: 'Transaction rejected.' });
      loadTransactions();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Rejection failed' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-gold" /> Finance Ledger & Payout Approval Desk
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Audit player deposits (TrxID matching) and release bKash/Nagad prize withdrawals.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}
        >
          {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="glass-panel border border-white/10 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-black/40 border-b border-white/10 text-gray-400 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-4">Player</th>
              <th className="p-4">Type / Provider</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Phone & TrxID</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Approve / Reject</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-gray-300">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-white/[0.02]">
                <td className="p-4">
                  <div className="font-bold text-white">{tx.user?.ign}</div>
                  <div className="text-[10px] text-gray-500 font-mono">UID: {tx.user?.uid}</div>
                </td>
                <td className="p-4">
                  <span
                    className={`font-bold ${
                      tx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {tx.type}
                  </span>{' '}
                  <span className="text-gray-400">({tx.method})</span>
                </td>
                <td className="p-4 font-mono font-bold text-gold text-sm">৳{tx.amount}</td>
                <td className="p-4">
                  <div className="text-white font-medium">{tx.phone}</div>
                  <div className="font-mono text-gray-400 text-[11px]">{tx.trxId}</div>
                </td>
                <td className="p-4">
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
                </td>
                <td className="p-4 text-right">
                  {tx.status === 'PENDING' ? (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleApprove(tx.id)}
                        className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-bold"
                        title="Approve Transaction"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReject(tx.id)}
                        className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 font-bold"
                        title="Reject Transaction"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-gray-500">Processed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
