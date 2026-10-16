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
  Flame,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useCMS, MatchItem } from '@/lib/cms-store';
import {
  parseScoreboardText,
  getOcrAuditLogs,
  saveOcrAuditLog,
  ParsedScoreboardRow,
  OcrAuditLog,
} from '@/lib/ocr-service';
import { processMatchPrizePayout, getUsers, UserAccount } from '@/lib/user-store';

export default function MatchResultsOCRPage() {
  const { matches, updateMatch, categories } = useCMS();
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [rawOcrText, setRawOcrText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedRows, setParsedRows] = useState<(ParsedScoreboardRow & { userPhone?: string })[]>([]);
  const [auditLogs, setAuditLogs] = useState<OcrAuditLog[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [payoutDone, setPayoutDone] = useState(false);
  const [lastPayoutSummary, setLastPayoutSummary] = useState<{ total: number; count: number } | null>(null);

  const selectedMatch = matches.find((m) => m.id === selectedMatchId) || matches[0];
  const selectedCategory = selectedMatch ? categories[selectedMatch.categorySlug] : null;
  const categoryDisplayName = selectedCategory?.name || selectedMatch?.categorySlug || 'Free Fire Tournament';

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

  const handleRunOCR = async (overrideImage?: string) => {
    if (!selectedMatch) {
      showToast('Please select a tournament match first', 'error');
      return;
    }

    const activeImage = overrideImage || imagePreview;
    setIsProcessing(true);
    setPayoutDone(false);

    try {
      const registered = selectedMatch.participants || [];
      const allUsers = getUsers().filter((u) => u.role === 'PLAYER');

      // Match joined players with user accounts by IGN or UID
      let effectiveParticipants = registered.map((p) => {
        const u = allUsers.find(
          (usr) =>
            (usr.uid && usr.uid === p.uid) ||
            (usr.ign && usr.ign.toUpperCase().trim() === p.ign.toUpperCase().trim())
        );
        return {
          ...p,
          id: u?.id || (p as any).id,
          userPhone: u?.phone,
        };
      });

      // If registered players are empty, check user accounts for participants
      if (effectiveParticipants.length === 0) {
        effectiveParticipants = allUsers.slice(0, Math.min(8, selectedMatch.totalSlots || 8)).map((u, i) => ({
          ign: u.ign,
          uid: u.uid,
          slot: i + 1,
          id: u.id,
          userPhone: u.phone,
        }));
      }

      // Call OCR backend API with payload
      const response = await fetch('/api/match-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: activeImage,
          rawText: rawOcrText,
          match: selectedMatch,
          registeredPlayers: effectiveParticipants,
        }),
      });

      let results: ParsedScoreboardRow[] = [];
      let extracted = '';

      if (response.ok) {
        const data = await response.json();
        results = data.results || [];
        extracted = data.extractedText || '';
      } else {
        throw new Error('OCR API fallback');
      }

      // Enhance parsed rows with matched user account details
      const enrichedRows = results.map((row) => {
        const targetUser = allUsers.find(
          (u) =>
            (row.matchedUserId && u.id === row.matchedUserId) ||
            (row.matchedPlayerUid && u.uid === row.matchedPlayerUid) ||
            (row.matchedPlayerIgn && u.ign.toUpperCase().trim() === row.matchedPlayerIgn.toUpperCase().trim()) ||
            (row.rawIgn && u.ign.toUpperCase().trim() === row.rawIgn.toUpperCase().trim())
        );

        return {
          ...row,
          matchedUserId: targetUser?.id || row.matchedUserId,
          matchedPlayerUid: targetUser?.uid || row.matchedPlayerUid,
          matchedPlayerIgn: targetUser?.ign || row.matchedPlayerIgn || row.rawIgn,
          userPhone: targetUser?.phone,
          isMatched: Boolean(targetUser) || row.isMatched,
        };
      });

      setParsedRows(enrichedRows);
      if (extracted && !rawOcrText) {
        setRawOcrText(extracted);
      }

      showToast(
        `OCR succeeded! ${enrichedRows.filter((r) => r.isMatched).length} player(s) verified with UID & accounts.`,
        'success'
      );
    } catch (err) {
      // Local fallback parser
      const allUsers = getUsers().filter((u) => u.role === 'PLAYER');
      const fallbackRegistered = selectedMatch.participants?.length
        ? selectedMatch.participants
        : allUsers.slice(0, 4).map((u, i) => ({ ign: u.ign, uid: u.uid, slot: i + 1, id: u.id, userPhone: u.phone }));

      const localResult = parseScoreboardText(rawOcrText, selectedMatch, fallbackRegistered);
      const enriched = localResult.map((r) => {
        const targetUser = allUsers.find(
          (u) =>
            (r.matchedPlayerUid && u.uid === r.matchedPlayerUid) ||
            (r.matchedPlayerIgn && u.ign.toUpperCase().trim() === r.matchedPlayerIgn.toUpperCase().trim())
        );
        return {
          ...r,
          matchedUserId: targetUser?.id || r.matchedUserId,
          matchedPlayerUid: targetUser?.uid || r.matchedPlayerUid,
          userPhone: targetUser?.phone,
        };
      });

      setParsedRows(enriched);
      showToast('Scoreboard processed using local fuzzy matching engine!', 'success');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      setPayoutDone(false);
      // As requested: As soon as the image is provided, auto-trigger OCR and matching immediately!
      handleRunOCR(dataUrl);
    };
    reader.readAsDataURL(file);
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
      showToast('No scoreboard results to process payout', 'error');
      return;
    }

    const allUsers = getUsers();
    const winners = parsedRows.map((r) => {
      const matchedUser = allUsers.find(
        (u) =>
          (r.matchedUserId && u.id === r.matchedUserId) ||
          (r.matchedPlayerUid && u.uid === r.matchedPlayerUid) ||
          (r.matchedPlayerIgn && u.ign.toUpperCase().trim() === r.matchedPlayerIgn.toUpperCase().trim()) ||
          (r.rawIgn && u.ign.toUpperCase().trim() === r.rawIgn.toUpperCase().trim())
      );

      return {
        userId: matchedUser?.id || r.matchedUserId,
        ign: matchedUser?.ign || r.matchedPlayerIgn || r.rawIgn,
        uid: matchedUser?.uid || r.matchedPlayerUid,
        rank: r.rank,
        kills: r.kills,
        prize: r.totalPrize,
      };
    });

    // Execute transactional wallet payouts (credits balance on both website and mobile app via /api/users)
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
      matchTitle: `${categoryDisplayName}: ${selectedMatch.title}`,
      processedBy: 'Admin (Master Owner)',
      imageUrl: imagePreview || undefined,
      totalParticipantsMatched: parsedRows.length,
      totalPrizeDistributed: payoutResult.totalDistributed,
      results: parsedRows,
    });

    setAuditLogs(getOcrAuditLogs());
    setPayoutDone(true);
    setLastPayoutSummary({ total: payoutResult.totalDistributed, count: payoutResult.payoutsCount });
    showToast(
      `🎉 Successful Payout! ৳${payoutResult.totalDistributed} BDT credited to winners' wallets!`,
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
            Match Scoreboard OCR & Instant Wallet Payout
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            ম্যাচের স্ক্রিনশট আপলোড করার সাথে সাথে OCR স্বয়ংক্রিয়ভাবে প্লেয়ারদের নাম, UID ও কিল সনাক্ত করে ওয়ালেটে টাকা যোগ করে দেয়।
          </p>
        </div>

        {selectedMatch && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              Pool: ৳{selectedMatch.prizePool} | Per Kill: ৳{selectedMatch.perKill}
            </span>
          </div>
        )}
      </div>

      {/* Match Selector & Screenshot Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Match Selection & Category Details */}
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-5 space-y-4 shadow-sm">
          <label className="text-xs font-black text-gray-900 dark:text-white block">
            1. Select Match (ম্যাচ নির্বাচন করুন):
          </label>
          <select
            value={selectedMatchId}
            onChange={(e) => {
              setSelectedMatchId(e.target.value);
              setParsedRows([]);
              setPayoutDone(false);
              setLastPayoutSummary(null);
            }}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black font-bold text-xs focus:outline-none focus:border-red-500"
          >
            {matches.map((m) => {
              const cat = categories[m.categorySlug];
              return (
                <option key={m.id} value={m.id}>
                  {cat?.name || m.categorySlug}: {m.title} ({m.type}) - {m.time}
                </option>
              );
            })}
          </select>

          {/* Selected Match & Category Card */}
          {selectedMatch && (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-3 text-xs">
              {/* Category Badge & Thumbnail */}
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-gray-200 dark:border-white/10">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-red-500/30 bg-slate-900 flex-shrink-0">
                  <img
                    src={selectedCategory?.avatarImage || selectedCategory?.bannerImage || '/logo.png'}
                    alt={categoryDisplayName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-red-500 block truncate">
                    {selectedCategory?.section || 'FREE FIRE TOURNAMENT'}
                  </span>
                  <h4 className="text-xs font-black text-gray-900 dark:text-white truncate">
                    {categoryDisplayName}
                  </h4>
                </div>
              </div>

              {/* Match Specs */}
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-gray-500">Match Title:</span>
                  <span className="font-bold text-gray-900 dark:text-white truncate max-w-[170px]">{selectedMatch.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Schedule Time:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{selectedMatch.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Map / Mode:</span>
                  <span className="font-bold">{selectedMatch.map} ({selectedMatch.type})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">1st Prize (Booyah):</span>
                  <span className="font-bold text-emerald-500">৳{selectedMatch.firstPrize || selectedMatch.prizePool}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Per Kill Rate:</span>
                  <span className="font-bold text-amber-500">৳{selectedMatch.perKill}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-gray-500">Status:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    selectedMatch.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                      : 'bg-red-100 dark:bg-red-950/60 text-red-600'
                  }`}>
                    {selectedMatch.status || 'UPCOMING'}
                  </span>
                </div>
              </div>

              {/* Joined / Registered Participants preview */}
              <div className="pt-2 border-t border-gray-200 dark:border-white/10">
                <span className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                  Registered Participants ({selectedMatch.participants?.length || 0} Slots):
                </span>
                {selectedMatch.participants && selectedMatch.participants.length > 0 ? (
                  <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                    {selectedMatch.participants.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[10px] bg-white dark:bg-black/40 p-1.5 rounded-lg border border-gray-200 dark:border-white/5">
                        <span className="font-bold text-amber-500">#{p.slot || idx + 1}</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200 truncate">{p.ign}</span>
                        <span className="font-mono text-gray-400 text-[9px]">{p.uid || 'No UID'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-gray-400 italic">
                    All player accounts in database will be cross-matched.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Screenshot Upload with Instant OCR Auto-Trigger */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-gray-900 dark:text-white block">
              2. Upload Scoreboard Screenshot (ইমেজ দিন - সাথে সাথে স্ক্যান হবে):
            </label>
            <button
              type="button"
              onClick={() => {
                setRawOcrText(`#1 BDX_STRIKER 7 Kills\n#2 OP_NINJA_99 4 Kills\n#3 VIPER_ROYAL 2 Kills\n#4 HEADSHOT_KING 1 Kills`);
                showToast('Sample scoreboard test data loaded');
              }}
              className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
            >
              + Load Sample Data
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-red-500/50 rounded-2xl p-4 text-center flex flex-col items-center justify-center min-h-[150px] cursor-pointer relative bg-gray-50 dark:bg-black/20 transition-all">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <Upload className="w-8 h-8 text-red-500 mb-2" />
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                Click or Drop Scoreboard Image
              </span>
              <span className="text-[10px] text-gray-400 mt-1">
                ছবি দেওয়ার সাথে সাথে AI দিয়ে নাম ও UID স্ক্যান শুরু হবে
              </span>
            </div>

            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 h-[150px] bg-black group">
                <img
                  src={imagePreview}
                  alt="Scoreboard"
                  className="w-full h-full object-contain"
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white text-xs font-bold">
                    <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                    <span>Auto-Scanning Scoreboard...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-2xl border border-gray-200 dark:border-white/10 h-[150px] bg-gray-50 dark:bg-white/5 text-gray-400 text-xs font-bold">
                No image uploaded yet
              </div>
            )}
          </div>

          {/* Raw Text Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-500">
              OCR Text (Extracted or Edit directly):
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
            onClick={() => handleRunOCR()}
            disabled={isProcessing}
            className="w-full py-3 rounded-xl btn-red text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing AI OCR & UID Matching...</span>
              </>
            ) : (
              <>
                <Scan className="w-4 h-4" />
                <span>🤖 Re-Run OCR Engine (ম্যাচিং রি-স্ক্যান করুন)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Payout Completion Celebratory Banner */}
      {payoutDone && lastPayoutSummary && (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-black">
                🎉 ওয়ালেটে সফলভাবে টাকা যোগ হয়েছে! (Payout Complete)
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                মোট ৳{lastPayoutSummary.total} BDT সফলভাবে {lastPayoutSummary.count} জন প্লেয়ারের একাউন্টে যুক্ত হয়েছে। ওয়েবসাইট ও অ্যাপ উভয়েই ব্যালেন্স আপডেট হয়ে গেছে।
              </p>
            </div>
          </div>
          <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
            ৳ {lastPayoutSummary.total} BDT
          </span>
        </div>
      )}

      {/* OCR Results & Payout Section */}
      {parsedRows.length > 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-6 space-y-4 shadow-sm animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-white/5">
            <div>
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Parsed Players & Prize Calculation ({categoryDisplayName})
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                  {parsedRows.length} Detected
                </span>
              </h3>
              <p className="text-[11px] text-gray-500">
                প্লেয়ারের UID ও IGN মিলিয়ে ব্যালেন্স যোগ করার তালিকা। কোনো মান পরিবর্তন করতে চাইলে সরাসরি এডিট করতে পারবেন।
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-gray-400 block">Total Distribution:</span>
                <span className="text-base font-black font-mono text-emerald-500">
                  ৳ {totalPrizeCalculated}
                </span>
              </div>

              <button
                type="button"
                onClick={handleProcessInstantPayout}
                disabled={payoutDone}
                className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer ${
                  payoutDone
                    ? 'bg-emerald-600 text-white cursor-default'
                    : 'btn-red shadow-red-600/30'
                }`}
              >
                {payoutDone ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Payout Distributed
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" /> 💰 Distribute Money to Accounts (টাকা যোগ করুন)
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5 text-[10px] text-gray-500 uppercase">
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">OCR Scanned</th>
                  <th className="py-2.5 px-3">Matched Player & UID (আইডি ও নাম)</th>
                  <th className="py-2.5 px-3">Account Status</th>
                  <th className="py-2.5 px-3">Kills</th>
                  <th className="py-2.5 px-3">Kill Prize</th>
                  <th className="py-2.5 px-3">Rank Prize</th>
                  <th className="py-2.5 px-3 text-right">Total Prize (BDT)</th>
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
                      <div>
                        <span className="font-extrabold text-gray-900 dark:text-white block">
                          {row.matchedPlayerIgn}
                        </span>
                        {row.matchedPlayerUid && (
                          <span className="text-[10px] font-mono text-gray-500">
                            UID: <span className="font-bold text-amber-500">{row.matchedPlayerUid}</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {row.isMatched ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                            <Check className="w-3 h-3" /> Account Verified
                          </span>
                          {row.userPhone && (
                            <span className="block text-[9px] font-mono text-gray-400">
                              {row.userPhone}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold">
                          Manual / Guest
                        </span>
                      )}
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
              OCR Payout Audit Trail
            </h3>
            <p className="text-[11px] text-gray-500">
              Historical record of past processed match results and verified wallet disbursements.
            </p>
          </div>
        </div>

        {auditLogs.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-xs">
            No audit records saved yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5 text-[10px] text-gray-500 uppercase">
                  <th className="py-2 px-3">Match</th>
                  <th className="py-2 px-3">Date & Time</th>
                  <th className="py-2 px-3">Processed By</th>
                  <th className="py-2 px-3">Winners Matched</th>
                  <th className="py-2 px-3 text-right">Prize Disbursed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="py-2.5 px-3 font-bold">{log.matchTitle}</td>
                    <td className="py-2.5 px-3 text-gray-500">
                      {new Date(log.processedAt).toLocaleString('en-US')}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-300">
                      {log.processedBy}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-500">
                      {log.totalParticipantsMatched} Players
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-500">
                      ৳{log.totalPrizeDistributed}
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
