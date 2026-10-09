'use client';

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Scan,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Users,
  Coins,
  ShieldCheck,
  RotateCcw,
  History,
  Check,
  ChevronRight,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { useCMS, MatchItem } from '@/lib/cms-store';
import {
  parseScoreboardText,
  getOcrAuditLogs,
  saveOcrAuditLog,
  ParsedScoreboardRow,
  OcrAuditLog,
} from '@/lib/ocr-service';
import { processMatchPrizePayout, getUsers } from '@/lib/user-store';

export default function MatchResultsOCRPage() {
  const { matches, updateMatch } = useCMS();
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [rawOcrText, setRawOcrText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedScoreboardRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<OcrAuditLog[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [payoutDone, setPayoutDone] = useState(false);

  const selectedMatch = matches.find((m) => m.id === selectedMatchId) || matches[0];

  useEffect(() => {
    if (matches.length > 0 && !selectedMatchId) {
      setSelectedMatchId(matches[0].id);
    }
    setAuditLogs(getOcrAuditLogs());
  }, [matches, selectedMatchId]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      setPayoutDone(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRunOCR = async () => {
    if (!selectedMatch) {
      showToast('অনুগ্রহ করে একটি ম্যাচ নির্বাচন করুন', 'error');
      return;
    }

    setIsProcessing(true);
    setPayoutDone(false);

    try {
      const registered = selectedMatch.participants || [];

      // If registered players are empty, check user accounts for sample registered players
      let effectiveParticipants = registered;
      if (effectiveParticipants.length === 0) {
        const allUsers = getUsers().filter((u) => u.role === 'PLAYER');
        effectiveParticipants = allUsers.slice(0, Math.min(8, selectedMatch.totalSlots || 8)).map((u, i) => ({
          ign: u.ign,
          uid: u.uid,
          slot: i + 1,
        }));
      }

      // Call OCR backend API with payload
      const response = await fetch('/api/match-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          rawText: rawOcrText,
          match: selectedMatch,
          registeredPlayers: effectiveParticipants,
        }),
      });

      if (!response.ok) {
        throw new Error('OCR API failed');
      }

      const data = await response.json();
      setParsedRows(data.results || []);
      if (data.extractedText && !rawOcrText) {
        setRawOcrText(data.extractedText);
      }

      showToast(
        `OCR সফল হয়েছে! ${data.matchedCount || data.results?.length} জন প্লেয়ার ফাজি-ম্যাচ করা হয়েছে।`,
        'success'
      );
    } catch (err) {
      // Local fallback parsing
      const fallbackRegistered = selectedMatch.participants?.length
        ? selectedMatch.participants
        : [
            { ign: 'BDX_STRIKER', uid: '192837465', slot: 1 },
            { ign: 'OP_NINJA_99', uid: '283746192', slot: 2 },
            { ign: 'VIPER_ROYAL', uid: '394857261', slot: 3 },
            { ign: 'HEADSHOT_KING', uid: '485726193', slot: 4 },
          ];

      const localResult = parseScoreboardText(rawOcrText, selectedMatch, fallbackRegistered);
      setParsedRows(localResult);
      showToast('লোকাল ফাজি পার্সার দিয়ে সফলভাবে রেজাল্ট প্রসেস করা হয়েছে!', 'success');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateRow = (index: number, field: keyof ParsedScoreboardRow, value: any) => {
    const updated = [...parsedRows];
    updated[index] = { ...updated[index], [field]: value };

    // Recalculate prizes if rank or kills change
    if (field === 'kills' || field === 'rank') {
      const rank = field === 'rank' ? Number(value) : updated[index].rank;
      const kills = field === 'kills' ? Number(value) : updated[index].kills;
      const perKillRate = selectedMatch.perKill || 0;
      const killPrize = kills * perKillRate;

      let rankPrize = 0;
      if (rank === 1) rankPrize = selectedMatch.firstPrize || Math.round(selectedMatch.prizePool * 0.5);
      else if (rank === 2) rankPrize = selectedMatch.secondPrize || Math.round(selectedMatch.prizePool * 0.25);
      else if (rank === 3) rankPrize = selectedMatch.thirdPrize || Math.round(selectedMatch.prizePool * 0.15);

      updated[index].killPrize = killPrize;
      updated[index].rankPrize = rankPrize;
      updated[index].totalPrize = killPrize + rankPrize;
    }

    setParsedRows(updated);
  };

  const handleProcessInstantPayout = () => {
    if (!selectedMatch || parsedRows.length === 0) {
      showToast('প্রসেস করার মতো কোনো রেজাল্ট নেই', 'error');
      return;
    }

    const winners = parsedRows.map((r) => ({
      userId: r.matchedUserId,
      ign: r.matchedPlayerIgn || r.rawIgn,
      uid: r.matchedPlayerUid,
      rank: r.rank,
      kills: r.kills,
      prize: r.totalPrize,
    }));

    // Execute transactional wallet payouts
    const payoutResult = processMatchPrizePayout(selectedMatch.id, selectedMatch.title, winners);

    // Update match status to COMPLETED and save results in CMS
    updateMatch(selectedMatch.id, {
      status: 'COMPLETED',
      results: parsedRows.map((r) => ({
        rank: r.rank,
        ign: r.matchedPlayerIgn || r.rawIgn,
        kills: r.kills,
        prize: r.totalPrize,
      })),
    });

    // Save audit log
    saveOcrAuditLog({
      matchId: selectedMatch.id,
      matchTitle: selectedMatch.title,
      processedBy: 'Admin (Master Owner)',
      imageUrl: imagePreview || undefined,
      totalParticipantsMatched: parsedRows.length,
      totalPrizeDistributed: payoutResult.totalDistributed,
      results: parsedRows,
    });

    setAuditLogs(getOcrAuditLogs());
    setPayoutDone(true);
    showToast(
      `🎉 সফল পে-আউট! মোট ৳${payoutResult.totalDistributed} টাকা বিজয়ীদের ওয়ালেটে যোগ করা হয়েছে!`,
      'success'
    );
  };

  const totalPrizeCalculated = parsedRows.reduce((sum, r) => sum + r.totalPrize, 0);

  return (
    <div className="space-y-6">
      {/* Toast */}
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
      <div className="pb-4 border-b border-gray-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Scan className="w-6 h-6 text-red-600" />
            ম্যাচ স্কোরবোর্ড OCR ও অটো প্রাইজ পে-আউট (Automated OCR Payout)
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            ম্যাচ শেষের স্ক্রিনশট আপলোড করে প্লেয়ারদের র‍্যাংক ও কিল শনাক্ত করুন এবং এক ক্লিকে ওয়ালেটে টাকা পাঠিয়ে দিন।
          </p>
        </div>

        {selectedMatch && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              পুল: ৳{selectedMatch.prizePool} | প্রতি কিল: ৳{selectedMatch.perKill}
            </span>
          </div>
        )}
      </div>

      {/* Match Selector & Screenshot Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Match Selection */}
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-5 space-y-4 shadow-sm">
          <label className="text-xs font-black text-gray-900 dark:text-white block">
            ১. ম্যাচ নির্বাচন করুন:
          </label>
          <select
            value={selectedMatchId}
            onChange={(e) => {
              setSelectedMatchId(e.target.value);
              setParsedRows([]);
              setPayoutDone(false);
            }}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black font-bold text-xs focus:outline-none focus:border-red-500"
          >
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title} ({m.type}) - {m.time}
              </option>
            ))}
          </select>

          {selectedMatch && (
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">ক্যাটাগরি:</span>
                <span className="font-bold">{selectedMatch.categorySlug}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">১ম পুরস্কার:</span>
                <span className="font-bold text-emerald-500">৳{selectedMatch.firstPrize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">প্রতি কিল:</span>
                <span className="font-bold text-amber-500">৳{selectedMatch.perKill}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">স্ট্যাটাস:</span>
                <span className="font-bold px-2 py-0.5 rounded bg-red-100 text-red-600 text-[10px]">
                  {selectedMatch.status || 'UPCOMING'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Screenshot Upload */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-gray-900 dark:text-white block">
              ২. স্কোরবোর্ড স্ক্রিনশট আপলোড (JPEG/PNG):
            </label>
            <button
              type="button"
              onClick={() => {
                setRawOcrText(`#1 BDX_STRIKER 7 Kills\n#2 OP_NINJA_99 4 Kills\n#3 VIPER_ROYAL 2 Kills\n#4 HEADSHOT_KING 1 Kills`);
                showToast('নমুনা স্কোরবোর্ড ডাটা লোড করা হয়েছে');
              }}
              className="text-[11px] font-bold text-red-600 hover:underline"
            >
              + নমুনা ডাটা লোড করুন
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-red-500/50 rounded-2xl p-4 text-center flex flex-col items-center justify-center min-h-[140px] cursor-pointer relative bg-gray-50 dark:bg-black/20">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-red-500 mb-2" />
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                ছবি সিলেক্ট করতে ক্লিক করুন
              </span>
              <span className="text-[10px] text-gray-400 mt-1">ফ্রি ফায়ার এন্ড-ম্যাচ রেজাল্ট স্ক্রিনশট</span>
            </div>

            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 h-[140px] bg-black">
                <img
                  src={imagePreview}
                  alt="Scoreboard"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-2xl border border-gray-200 dark:border-white/10 h-[140px] bg-gray-50 dark:bg-white/5 text-gray-400 text-xs font-bold">
                কোনো ছবি আপলোড হয়নি
              </div>
            )}
          </div>

          {/* Raw Text Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-500">
              OCR টেক্সট (স্বয়ংক্রিয় এক্সট্রাকশন বা সরাসরি পেস্ট করুন):
            </label>
            <textarea
              rows={2}
              value={rawOcrText}
              onChange={(e) => setRawOcrText(e.target.value)}
              placeholder="#1 PLAYER_NAME 5 Kills..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black font-mono text-xs focus:outline-none focus:border-red-500"
            />
          </div>

          <button
            type="button"
            onClick={handleRunOCR}
            disabled={isProcessing}
            className="w-full py-3 rounded-xl btn-red text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 active:scale-95 transition-all disabled:opacity-50"
          >
            <Scan className="w-4 h-4" />
            <span>{isProcessing ? 'OCR ও ফাজি ম্যাচিং হচ্ছে...' : '🤖 OCR প্রসেসিং চালান (Parse & Match)'}</span>
          </button>
        </div>
      </div>

      {/* OCR Results & Payout Section */}
      {parsedRows.length > 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 space-y-4 shadow-sm animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-white/5">
            <div>
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                শনাক্তকৃত প্লেয়ার ও প্রাইজ ক্যালকুলেশন
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                  {parsedRows.length} জন শনাক্ত
                </span>
              </h3>
              <p className="text-[11px] text-gray-500">
                নিচের তথ্যগুলো যাচাই করুন। প্রয়োজনে কিল বা র‍্যাংক ম্যানুয়ালি পরিবর্তন করতে পারেন।
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-gray-400 block">মোট প্রাইজ বণ্টন:</span>
                <span className="text-base font-black font-mono text-emerald-500">
                  ৳ {totalPrizeCalculated}
                </span>
              </div>

              <button
                type="button"
                onClick={handleProcessInstantPayout}
                disabled={payoutDone}
                className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg transition-all active:scale-95 ${
                  payoutDone
                    ? 'bg-emerald-600 text-white cursor-default'
                    : 'btn-red shadow-red-600/30'
                }`}
              >
                {payoutDone ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> পে-আউট সম্পন্ন হয়েছে
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" /> 💰 প্রাইজ বিতরণ ও ওয়ালেটে টাকা পাঠান
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5 text-[10px] text-gray-500 uppercase">
                  <th className="py-2.5 px-3">র‍্যাংক</th>
                  <th className="py-2.5 px-3">OCR নেম</th>
                  <th className="py-2.5 px-3">ফাজি-ম্যাচড প্লেয়ার (IGN)</th>
                  <th className="py-2.5 px-3">কিল সংখ্যা</th>
                  <th className="py-2.5 px-3">কিল প্রাইজ</th>
                  <th className="py-2.5 px-3">র‍্যাংক প্রাইজ</th>
                  <th className="py-2.5 px-3 text-right">মোট পুরস্কার (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {parsedRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min={1}
                        value={row.rank}
                        onChange={(e) => handleUpdateRow(idx, 'rank', e.target.value)}
                        className="w-12 px-2 py-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black font-bold text-center font-mono"
                      />
                    </td>
                    <td className="py-3 px-3 font-mono text-gray-500">{row.rawIgn}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-gray-900 dark:text-white">
                          {row.matchedPlayerIgn}
                        </span>
                        {row.isMatched ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                            {(row.confidence * 100).toFixed(0)}% Match
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                            ম্যানুয়াল
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min={0}
                        value={row.kills}
                        onChange={(e) => handleUpdateRow(idx, 'kills', e.target.value)}
                        className="w-14 px-2 py-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black font-bold text-center font-mono"
                      />
                    </td>
                    <td className="py-3 px-3 font-mono text-gray-600 dark:text-gray-300">
                      ৳{row.killPrize}
                    </td>
                    <td className="py-3 px-3 font-mono text-amber-500 font-bold">
                      ৳{row.rankPrize}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-sm text-emerald-500">
                      ৳{row.totalPrize}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* OCR Audit Logs */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-white/5">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-gray-300">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 dark:text-white">
              OCR পে-আউট অডিট লগ (Audit Trail)
            </h3>
            <p className="text-[11px] text-gray-500">
              অতীতে প্রক্রিয়াজাত সকল ম্যাচ রেজাল্ট ও প্রাইজ লেনদেনের ইতিহাস।
            </p>
          </div>
        </div>

        {auditLogs.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-xs">
            এখনো কোনো অডিট লগ জমা হয়নি।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5 text-[10px] text-gray-500 uppercase">
                  <th className="py-2 px-3">ম্যাচ</th>
                  <th className="py-2 px-3">তারিখ ও সময়</th>
                  <th className="py-2 px-3">প্রসেস করেছেন</th>
                  <th className="py-2 px-3">বিজয়ী সংখ্যা</th>
                  <th className="py-2 px-3 text-right">মোট বিতরণকৃত প্রাইজ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="py-2.5 px-3 font-bold">{log.matchTitle}</td>
                    <td className="py-2.5 px-3 text-gray-500">
                      {new Date(log.processedAt).toLocaleString('bn-BD')}
                    </td>
                    <td className="py-2.5 px-3">{log.processedBy}</td>
                    <td className="py-2.5 px-3 font-mono">{log.totalParticipantsMatched} জন</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-500">
                      ৳ {log.totalPrizeDistributed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
