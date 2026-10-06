'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home, ShieldAlert } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Handled application exception:', error);
  }, [error]);

  const handleClearAndReload = () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        window.location.reload();
      }
    } catch (e) {
      reset();
    }
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md p-6 rounded-3xl bg-[#12121a] border border-white/10 text-center space-y-4 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-500 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-black text-white">অ্যাপ লোড করতে সমস্যা হয়েছে</h2>
          <p className="text-xs text-gray-400">
            সাময়িক নেটওয়ার্ক বা ব্রাউজার ক্যাশের কারণে পেজটি রিলোড করা প্রয়োজন।
          </p>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <button
            onClick={handleClearAndReload}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 active:scale-95 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>আবার চেষ্টা করুন (Reload App)</span>
          </button>

          <Link
            href="/mobile-app-view"
            className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/10 transition-all"
          >
            <Home className="w-4 h-4 text-amber-400" />
            <span>মোবাইল ভিউ খুলুন</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
