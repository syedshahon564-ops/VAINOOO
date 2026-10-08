'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Ban, Check, AlertTriangle } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';

export default function AntiCheatDeskPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      const res = await ApiClient.adminGetAntiCheatLogs();
      setLogs(res.logs || []);
    } catch (err) {
      setLogs([
        {
          id: 'flag-1',
          anomalyType: 'HEADSHOT_ANOMALY',
          confidenceScore: 0.98,
          details: '12 kills in 45 seconds with 100% headshot accuracy using MP40.',
          actionTaken: 'FLAGGED_FOR_REVIEW',
          createdAt: new Date().toISOString(),
          user: { id: 'u1', ign: 'HackerPro99', uid: '99881122', phone: '01899999999', isBanned: false },
          tournament: { title: 'Bermuda Squad Match #42' },
        },
        {
          id: 'flag-2',
          anomalyType: 'SPEED_HACK',
          confidenceScore: 0.92,
          details: 'Player traversed 1,200 meters in 4.2 seconds across map.',
          actionTaken: 'AUTO_BANNED',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          user: { id: 'u2', ign: 'FlashRunner_BD', uid: '77665544', phone: '01711112222', isBanned: true },
          tournament: { title: 'Purgatory Solo Quick Rush #39' },
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleBan(userId: string, ign: string) {
    if (!confirm(`Are you sure you want to permanently BAN player ${ign}?`)) return;
    try {
      await ApiClient.adminBanPlayer(userId, 'Banned by Supervisor for Anti-Cheat violation');
      setMessage({ type: 'success', text: `Player ${ign} has been banned.` });
      loadLogs();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to ban player' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-500" /> Anti-Cheat Supervisor Desk
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Review machine-detected headshot anomalies, speed hacks, and emulator mismatches.
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
          {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="glass-panel border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
          <thead className="bg-black/40 border-b border-white/10 text-gray-400 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-4">Player & UID</th>
              <th className="p-4">Anomaly Type</th>
              <th className="p-4">Confidence</th>
              <th className="p-4">Telemetry Logs</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-gray-300">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-white/[0.02]">
                <td className="p-4">
                  <div className="font-bold text-white">{log.user?.ign}</div>
                  <div className="text-[10px] text-gray-500 font-mono">UID: {log.user?.uid}</div>
                </td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    {log.anomalyType}
                  </span>
                </td>
                <td className="p-4 font-mono font-bold text-white">
                  {(log.confidenceScore * 100).toFixed(0)}%
                </td>
                <td className="p-4 max-w-xs text-gray-400 text-[11px] leading-relaxed">
                  {log.details}
                </td>
                <td className="p-4">
                  {log.user?.isBanned ? (
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px]">
                      BANNED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold text-[10px]">
                      FLAGGED
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">
                  {!log.user?.isBanned && (
                    <button
                      onClick={() => handleBan(log.user.id, log.user.ign)}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold text-[11px] inline-flex items-center gap-1"
                    >
                      <Ban className="w-3.5 h-3.5" /> Ban Player
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
}
