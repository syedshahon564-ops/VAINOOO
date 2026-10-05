'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ShieldCheck, Lock, Unlock, Copy, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ApiClient } from '@/lib/api-client';

export default function RoomCredentialsPage() {
  const params = useParams();
  const tournamentId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    fetchCredentials();
  }, [tournamentId]);

  async function fetchCredentials() {
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.getRoomCredentials(tournamentId);
      setData(res);
      if (res.isLocked && res.remainingSeconds) {
        setCountdown(res.remainingSeconds);
      }
    } catch (err: any) {
      setError(err.message || 'You must join this tournament to view room credentials.');
    } finally {
      setLoading(false);
    }
  }

  // Ticking countdown timer
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          fetchCredentials();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string, type: 'id' | 'pass') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-8">
      <Link href="/matches" className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Tournaments
      </Link>

      <div className="glass-panel p-8 sm:p-10 border border-gold/30 shadow-2xl relative overflow-hidden">
        {/* Glow Header */}
        <div className="flex items-center gap-3 pb-6 border-b border-white/10">
          <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
            {data && !data.isLocked ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Custom Room Credentials</h1>
            <p className="text-xs text-gray-400">Secure 15-Minute Tokenized Unlock</p>
          </div>
        </div>

        <div className="py-8 space-y-6">
          {loading ? (
            <div className="text-center py-12 text-sm text-gray-400">Verifying slot registration & timer...</div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : data?.isLocked ? (
            <div className="text-center py-6 space-y-4">
              <div className="inline-block p-4 rounded-full bg-amber-500/10 border border-amber-500/30">
                <Clock className="w-8 h-8 text-amber-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white">Room Unlocks In:</h3>
              <div className="text-4xl font-extrabold text-gold tracking-widest font-mono">
                {countdown !== null ? formatCountdown(countdown) : 'Calculating...'}
              </div>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Room ID and Password are protected and will reveal 15 minutes before the match start time. This screen updates automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Room ID Box */}
              <div className="p-4 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400">Custom Room ID</span>
                  <div className="text-2xl font-black text-white tracking-widest font-mono mt-0.5">
                    {data?.roomId || 'Pending Host Setup'}
                  </div>
                </div>
                {data?.roomId && (
                  <button
                    onClick={() => copyToClipboard(data.roomId, 'id')}
                    className="px-4 py-2 rounded-xl btn-gold text-xs font-bold flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5 text-black" /> {copiedId ? 'Copied!' : 'Copy ID'}
                  </button>
                )}
              </div>

              {/* Password Box */}
              <div className="p-4 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400">Room Password</span>
                  <div className="text-2xl font-black text-neon-cyan tracking-widest font-mono mt-0.5">
                    {data?.roomPass || 'Pending Host Setup'}
                  </div>
                </div>
                {data?.roomPass && (
                  <button
                    onClick={() => copyToClipboard(data.roomPass, 'pass')}
                    className="px-4 py-2 rounded-xl btn-cyan text-xs font-bold flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5 text-black" /> {copiedPass ? 'Copied!' : 'Copy Pass'}
                  </button>
                )}
              </div>

              {/* In-Game Instructions */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2 text-xs text-gray-300">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Free Fire Joining Guide:
                </div>
                <ol className="list-decimal list-inside space-y-1 text-gray-400 text-[11px]">
                  <li>Open Free Fire on your phone or PC emulator.</li>
                  <li>Go to Mode Selection → Select <b>Custom Room</b>.</li>
                  <li>Paste the Room ID in the search box at the top left.</li>
                  <li>Enter the Password and join your designated slot number.</li>
                  <li>Do not leave your slot until the host starts the match!</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
