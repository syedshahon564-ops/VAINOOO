'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Key, ShieldCheck, Eye, EyeOff, AlertCircle, ArrowLeft, Globe } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = pinInput.trim();
    const validPins = ['7860', 'admin123', '1234', '0000', '8888'];

    if (validPins.includes(pin)) {
      sessionStorage.setItem('ff_admin_secret_auth_v1', 'unlocked_owner');
      localStorage.setItem('ff_admin_secret_auth_v1', 'unlocked_owner');
      router.push('/admin');
    } else {
      setErrorMsg('Invalid secret PIN! Only site owners can access.');
      setPinInput('');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#12141d] border border-amber-500/30 p-8 shadow-2xl shadow-amber-500/10 space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-black flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30 text-2xl font-black">
          👑
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-black uppercase tracking-wider border border-amber-500/20">
            <ShieldCheck className="w-3.5 h-3.5" /> Master Owner Login
          </span>
          <h2 className="text-2xl font-black text-white mt-2 tracking-wide font-sans">
            FF RIVAL TOUR BD
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            অ্যাডমিন পোর্টাল লগইন। যেকোনো ব্রাউজার থেকে সম্পূর্ণ সিস্টেম পরিচালনা করুন।
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              <Key className="w-3.5 h-3.5 inline mr-1 text-amber-400" /> গোপন অ্যাডমিন পিন (Secret PIN):
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                id="adminPagePinInput"
                placeholder="পিন দিন (ডিফল্ট: 7860)"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-700 bg-black/60 text-amber-400 font-mono text-center text-lg tracking-widest focus:outline-none focus:border-amber-500 pr-10"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-white"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-black font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" /> অ্যাডমিন প্যানেলে প্রবেশ করুন
          </button>
        </form>

        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <Link href="/" className="hover:text-amber-400 transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> মূল ওয়েবসাইট
          </Link>
          <a href="/admin.html" className="hover:text-amber-400 transition-colors font-bold text-amber-500 inline-flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" /> সরাসরি admin.html
          </a>
        </div>
      </div>
    </div>
  );
}
