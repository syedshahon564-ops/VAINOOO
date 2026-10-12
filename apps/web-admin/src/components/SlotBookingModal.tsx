'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  AlertCircle,
  Users,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Loader2,
  User,
  Clipboard,
} from 'lucide-react';
import { MatchItem } from '@/lib/cms-store';
import { checkFreeFireUID } from '@/lib/ff-uid-checker';
import { getCurrentUser, hasUserJoinedMatch, recordUserJoinedMatch } from '@/lib/user-store';
import { readClipboardText, toEnDigits } from '@/lib/clipboard';

export interface RegisteredPlayerEntry {
  ign: string;
  uid: string;
  slotInTeam: number;
}

export interface BookingSuccessInfo {
  slotNumber: number;
  teamNumber?: number;
  slotInTeam?: number;
  ign: string;
  uid: string;
  players?: RegisteredPlayerEntry[];
}

interface SlotBookingModalProps {
  match: MatchItem;
  userBalance: number;
  onClose: () => void;
  onSuccess: (slotInfo: BookingSuccessInfo) => void;
  initialBookedSlots?: Record<number, { ign: string; uid: string; badge?: string }>;
}

export default function SlotBookingModal({
  match,
  userBalance,
  onClose,
  onSuccess,
  initialBookedSlots,
}: SlotBookingModalProps) {
  // Mode configuration
  const matchTypeLower = (match.type || '').toLowerCase();
  const isSquad =
    matchTypeLower.includes('squad') ||
    (match.totalSlots === 48 && matchTypeLower.includes('squad')) ||
    match.type === 'Squad';
  const isDuo = matchTypeLower.includes('duo');
  const isSolo = !isSquad && !isDuo;

  const isClashSquad =
    (match.categorySlug || '').toLowerCase().includes('clash') ||
    (match.categorySlug || '').toLowerCase().includes('cs') ||
    ((match as any).category || '').toLowerCase().includes('clash') ||
    (match.title || '').toLowerCase().includes('clash') ||
    (match.title || '').toLowerCase().includes('cs ');

  // SQUAD ONLY starts at 'SELECT_SLOT'. Solo & Duo go directly to 'PLAYER_DETAILS'
  const [currentStep, setCurrentStep] = useState<'SELECT_SLOT' | 'PLAYER_DETAILS'>(
    isSquad ? 'SELECT_SLOT' : 'PLAYER_DETAILS'
  );

  // Selected slot for Squad
  const [selectedSlotNumber, setSelectedSlotNumber] = useState<number | null>(null);

  // Player state: 4 for Squad, 2 for Duo, 1 for Solo
  const [squadPlayers, setSquadPlayers] = useState([
    { ign: '', uid: '', checking: false, verified: false },
    { ign: '', uid: '', checking: false, verified: false },
    { ign: '', uid: '', checking: false, verified: false },
    { ign: '', uid: '', checking: false, verified: false },
  ]);

  const [duoPlayers, setDuoPlayers] = useState([
    { ign: '', uid: '', checking: false, verified: false },
    { ign: '', uid: '', checking: false, verified: false },
  ]);

  const [soloPlayer, setSoloPlayer] = useState({
    ign: '',
    uid: '',
    checking: false,
    verified: false,
  });

  const squadPlayersRef = useRef(squadPlayers);
  squadPlayersRef.current = squadPlayers;
  const duoPlayersRef = useRef(duoPlayers);
  duoPlayersRef.current = duoPlayers;
  const soloPlayerRef = useRef(soloPlayer);
  soloPlayerRef.current = soloPlayer;

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Booked slots map for Squad
  const [bookedSlotsMap, setBookedSlotsMap] = useState<
    Record<number, { ign: string; uid: string; badge?: string }>
  >(() => {
    const initial: Record<number, { ign: string; uid: string; badge?: string }> = {
      ...(initialBookedSlots || {}),
    };
    if (match.participants && match.participants.length > 0) {
      match.participants.forEach((p) => {
        if (p.slot) {
          initial[p.slot] = {
            ign: p.ign,
            uid: p.uid || '---',
            badge: isSquad ? 'SQUAD' : isDuo ? 'DUO' : 'SOLO',
          };
        }
      });
    }
    return initial;
  });

  // Pre-fill logged-in user info for Player 1 / Leader (only if numeric UID)
  useEffect(() => {
    const cur = getCurrentUser();
    if (cur && cur.uid && /^\d{8,11}$/.test(cur.uid.trim())) {
      const cleanUid = cur.uid.trim();
      const hasIgn = Boolean(cur.ign && cur.ign.trim());
      if (isSquad) {
        setSquadPlayers((prev) => [
          { ign: cur.ign || '', uid: cleanUid, checking: false, verified: hasIgn },
          prev[1],
          prev[2],
          prev[3],
        ]);
      } else if (isDuo) {
        setDuoPlayers((prev) => [
          { ign: cur.ign || '', uid: cleanUid, checking: false, verified: hasIgn },
          prev[1],
        ]);
      } else {
        setSoloPlayer({ ign: cur.ign || '', uid: cleanUid, checking: false, verified: hasIgn });
      }
    }
  }, [isSquad, isDuo]);

  // Handler to verify a specific squad player's UID
  async function handleVerifySquadPlayer(index: number, explicitUid?: string) {
    const currentPlayers = squadPlayersRef.current;
    const player = currentPlayers[index];
    const rawUid = explicitUid !== undefined ? explicitUid : (player?.uid || '');
    const cleanId = cleanUid(rawUid);
    if (!cleanId || cleanId.length < 8 || cleanId.length > 12) {
      setErrorMessage(`প্লেয়ার #${index + 1}-এর জন্য সঠিক ৮-১২ ডিজিটের ফ্রি ফায়ার UID লিখুন।`);
      setSquadPlayers((prev) =>
        prev.map((p, i) => (i === index ? { ...p, uid: p.uid || cleanId, verified: false, checking: false } : p))
      );
      return;
    }

    setSquadPlayers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, checking: true, uid: cleanId } : p))
    );
    setErrorMessage(null);

    try {
      const profile = await checkFreeFireUID(cleanId);
      const finalIgn = player?.ign?.trim() || profile.ign || `FF_PLAYER_${cleanId.slice(-4)}`;
      setSquadPlayers((prev) =>
        prev.map((p, i) =>
          i === index
            ? { ...p, ign: p.ign?.trim() || finalIgn, checking: false, verified: true, uid: p.uid || cleanId }
            : p
        )
      );
      setErrorMessage(null);
    } catch {
      setSquadPlayers((prev) =>
        prev.map((p, i) =>
          i === index
            ? { ...p, ign: p.ign?.trim() || `FF_PLAYER_${cleanId.slice(-4)}`, checking: false, verified: true, uid: p.uid || cleanId }
            : p
        )
      );
      setErrorMessage(null);
    }
  }

  // Handler to verify duo player UID
  async function handleVerifyDuoPlayer(index: number, explicitUid?: string) {
    const currentPlayers = duoPlayersRef.current;
    const player = currentPlayers[index];
    const rawUid = explicitUid !== undefined ? explicitUid : (player?.uid || '');
    const cleanId = cleanUid(rawUid);
    if (!cleanId || cleanId.length < 8 || cleanId.length > 12) {
      setErrorMessage(`প্লেয়ার #${index + 1}-এর জন্য সঠিক ৮-১২ ডিজিটের ফ্রি ফায়ার UID লিখুন।`);
      setDuoPlayers((prev) =>
        prev.map((p, i) => (i === index ? { ...p, uid: p.uid || cleanId, verified: false, checking: false } : p))
      );
      return;
    }

    setDuoPlayers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, checking: true, uid: cleanId } : p))
    );
    setErrorMessage(null);

    try {
      const profile = await checkFreeFireUID(cleanId);
      const finalIgn = player?.ign?.trim() || profile.ign || `FF_PLAYER_${cleanId.slice(-4)}`;
      setDuoPlayers((prev) =>
        prev.map((p, i) =>
          i === index
            ? { ...p, ign: p.ign?.trim() || finalIgn, checking: false, verified: true, uid: p.uid || cleanId }
            : p
        )
      );
      setErrorMessage(null);
    } catch {
      setDuoPlayers((prev) =>
        prev.map((p, i) =>
          i === index
            ? { ...p, ign: p.ign?.trim() || `FF_PLAYER_${cleanId.slice(-4)}`, checking: false, verified: true, uid: p.uid || cleanId }
            : p
        )
      );
      setErrorMessage(null);
    }
  }

  // Handler to verify solo player UID
  async function handleVerifySoloPlayer(explicitUid?: string) {
    const current = soloPlayerRef.current;
    const rawUid = explicitUid !== undefined ? explicitUid : (current?.uid || '');
    const cleanId = cleanUid(rawUid);
    if (!cleanId || cleanId.length < 8 || cleanId.length > 12) {
      setErrorMessage('সঠিক ৮-১২ ডিজিটের ফ্রি ফায়ার UID লিখুন।');
      setSoloPlayer((prev) => ({ ...prev, uid: prev.uid || cleanId, verified: false, checking: false }));
      return;
    }

    setSoloPlayer((prev) => ({ ...prev, checking: true, uid: cleanId }));
    setErrorMessage(null);

    try {
      const profile = await checkFreeFireUID(cleanId);
      const finalIgn = current?.ign?.trim() || profile.ign || `FF_PLAYER_${cleanId.slice(-4)}`;
      setSoloPlayer((prev) => ({
        ...prev,
        ign: prev.ign?.trim() || finalIgn,
        checking: false,
        verified: true,
        uid: prev.uid || cleanId,
      }));
      setErrorMessage(null);
    } catch {
      setSoloPlayer((prev) => ({
        ...prev,
        ign: prev.ign?.trim() || `FF_PLAYER_${cleanId.slice(-4)}`,
        checking: false,
        verified: true,
        uid: prev.uid || cleanId,
      }));
      setErrorMessage(null);
    }
  }

  function cleanUid(input: string): string {
    if (!input) return '';
    return toEnDigits(input).slice(0, 15);
  }

  // Universal Paste Helper for UID (supports Ridmik Keyboard, AndroidBridge, and Web clipboard)
  const handlePasteUid = async (
    onApply: (uid: string) => void,
    onAutoVerify?: (uid: string) => void,
    inputElementId?: string
  ) => {
    try {
      const text = await readClipboardText();
      const digits = cleanUid(text);
      if (digits) {
        onApply(digits);
        setErrorMessage(null);
        if (digits.length >= 8 && onAutoVerify) {
          onAutoVerify(digits);
        }
        return;
      }
    } catch (err) {
      console.warn('handlePasteUid error:', err);
    }
    if (inputElementId && typeof document !== 'undefined') {
      const el = document.getElementById(inputElementId) as HTMLInputElement;
      if (el) el.focus();
    }
  };

  const handleSelectSquadSlot = (slotNum: number) => {
    if (bookedSlotsMap[slotNum]) return;
    setSelectedSlotNumber(slotNum);
    setErrorMessage(null);
  };

  // Move from Step 1 to Step 2 (Squad only)
  const handleProceedToPlayerDetails = () => {
    if (isSquad && !selectedSlotNumber) {
      setErrorMessage('Please select an available slot first (e.g. Slot #1).');
      return;
    }
    setErrorMessage(null);
    setCurrentStep('PLAYER_DETAILS');
  };

  // Helper to find next available slot for Solo and Duo
  const getNextAvailableSlot = () => {
    const total = match.totalSlots || 48;
    for (let s = 1; s <= total; s++) {
      if (!bookedSlotsMap[s]) return s;
    }
    return (match.filledSlots || 0) + 1;
  };

  // Final Confirmation
  const handleConfirmBooking = () => {
    if (userBalance < match.entryFee) {
      setErrorMessage(`Insufficient balance! You need ৳${match.entryFee} TK in your wallet.`);
      return;
    }

    const cur = getCurrentUser();
    if (hasUserJoinedMatch(match.id, cur)) {
      setErrorMessage('আপনি ইতিমধ্যে এই ম্যাচে জয়েন করেছেন! একটি ম্যাচে একবারের বেশি জয়েন করা যাবে না।');
      return;
    }

    // 1. SQUAD MODE (Requires selected slot + players)
    if (isSquad) {
      if (!selectedSlotNumber) {
        setErrorMessage('দয়া করে আপনার স্কোয়াড স্লট নির্বাচন করুন।');
        setCurrentStep('SELECT_SLOT');
        return;
      }

      if (isClashSquad) {
        // Clash Squad requires 4 players with UIDs
        for (let i = 0; i < 4; i++) {
          const p = squadPlayers[i];
          const clean = cleanUid(p.uid);
          if (!clean || clean.length < 8) {
            setErrorMessage(`ক্লাশ স্কোয়াড ম্যাচে Player #${i + 1}-এর জন্য ৮-১২ ডিজিটের Free Fire UID লিখুন।`);
            return;
          }
          p.uid = clean;
          p.verified = true;
          if (!p.ign.trim()) {
            p.ign = `FF_PLAYER_${clean.slice(-4)}`;
          }
        }
      } else {
        // Player 1 (Leader) is mandatory
        const leaderClean = cleanUid(squadPlayers[0].uid);
        if (!leaderClean || leaderClean.length < 8) {
          setErrorMessage('Player 1 (Leader)-এর সঠিক ৮-১২ ডিজিটের Free Fire UID লিখুন।');
          return;
        }
        squadPlayers[0].uid = leaderClean;
        squadPlayers[0].verified = true;
        if (!squadPlayers[0].ign.trim()) {
          squadPlayers[0].ign = cur?.ign?.trim() || `FF_PLAYER_${leaderClean.slice(-4)}`;
        }

        for (let i = 1; i < 4; i++) {
          const p = squadPlayers[i];
          const c = cleanUid(p.uid);
          if (c && c.length >= 8) {
            p.uid = c;
            p.verified = true;
            if (!p.ign.trim()) {
              p.ign = `FF_PLAYER_${c.slice(-4)}`;
            }
          }
        }
      }

      // Collect valid players
      const validSquadPlayers = squadPlayers
        .map((p, idx) => ({
          ign: p.ign.trim() || `FF_PLAYER_${p.uid.slice(-4)}`,
          uid: cleanUid(p.uid) || '---',
          slotInTeam: idx + 1,
        }))
        .filter((p, idx) => (isClashSquad ? true : idx === 0 || p.uid !== '---'));

      // Mark the slot as booked
      setBookedSlotsMap((prev) => ({
        ...prev,
        [selectedSlotNumber]: {
          ign: squadPlayers[0].ign.trim(),
          uid: squadPlayers[0].uid.trim(),
          badge: 'SQUAD',
        },
      }));

      recordUserJoinedMatch(match.id, cur, {
        ign: squadPlayers[0].ign.trim(),
        uid: squadPlayers[0].uid.trim(),
        slot: selectedSlotNumber,
      });

      onSuccess({
        slotNumber: selectedSlotNumber,
        teamNumber: selectedSlotNumber,
        ign: squadPlayers[0].ign.trim(),
        uid: squadPlayers[0].uid.trim(),
        players: validSquadPlayers,
      });
      return;
    }

    // 2. DUO MODE (Leader required, Player 2 optional)
    if (isDuo) {
      const leaderClean = cleanUid(duoPlayers[0].uid);
      if (!leaderClean || leaderClean.length < 8) {
        setErrorMessage('Player 1 (Leader)-এর সঠিক ৮-১২ ডিজিটের Free Fire UID লিখুন।');
        return;
      }
      duoPlayers[0].uid = leaderClean;
      duoPlayers[0].verified = true;
      if (!duoPlayers[0].ign.trim()) {
        duoPlayers[0].ign = cur?.ign?.trim() || `FF_PLAYER_${leaderClean.slice(-4)}`;
      }

      const p2Clean = cleanUid(duoPlayers[1].uid);
      if (p2Clean && p2Clean.length >= 8) {
        duoPlayers[1].uid = p2Clean;
        duoPlayers[1].verified = true;
        if (!duoPlayers[1].ign.trim()) {
          duoPlayers[1].ign = `FF_PLAYER_${p2Clean.slice(-4)}`;
        }
      }

      const validDuoPlayers = duoPlayers
        .map((p, idx) => ({
          ign: p.ign.trim() || `FF_PLAYER_${p.uid.slice(-4)}`,
          uid: cleanUid(p.uid) || '---',
          slotInTeam: idx + 1,
        }))
        .filter((p, idx) => idx === 0 || p.uid !== '---');

      const assignedSlot = getNextAvailableSlot();

      setBookedSlotsMap((prev) => ({
        ...prev,
        [assignedSlot]: {
          ign: duoPlayers[0].ign.trim(),
          uid: duoPlayers[0].uid.trim(),
          badge: 'DUO',
        },
      }));

      recordUserJoinedMatch(match.id, cur, {
        ign: duoPlayers[0].ign.trim(),
        uid: duoPlayers[0].uid.trim(),
        slot: assignedSlot,
      });

      onSuccess({
        slotNumber: assignedSlot,
        teamNumber: assignedSlot,
        ign: duoPlayers[0].ign.trim(),
        uid: duoPlayers[0].uid.trim(),
        players: validDuoPlayers,
      });
      return;
    }

    // 3. SOLO MODE (No slot grid - direct registration for 1 player)
    const soloClean = cleanUid(soloPlayer.uid);
    if (!soloClean || soloClean.length < 8) {
      setErrorMessage('আপনার সঠিক ৮-১২ ডিজিটের Free Fire UID লিখুন।');
      return;
    }
    soloPlayer.uid = soloClean;
    soloPlayer.verified = true;
    if (!soloPlayer.ign.trim()) {
      soloPlayer.ign = cur?.ign?.trim() || `FF_PLAYER_${soloClean.slice(-4)}`;
    }

    const assignedSlot = getNextAvailableSlot();

    setBookedSlotsMap((prev) => ({
      ...prev,
      [assignedSlot]: {
        ign: soloPlayer.ign.trim(),
        uid: soloPlayer.uid.trim(),
        badge: 'SOLO',
      },
    }));

    recordUserJoinedMatch(match.id, cur, {
      ign: soloPlayer.ign.trim(),
      uid: soloPlayer.uid.trim(),
      slot: assignedSlot,
    });

    onSuccess({
      slotNumber: assignedSlot,
      ign: soloPlayer.ign.trim(),
      uid: soloPlayer.uid.trim() || '---',
      players: [
        {
          ign: soloPlayer.ign.trim(),
          uid: soloPlayer.uid.trim() || '---',
          slotInTeam: 1,
        },
      ],
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* PURE WHITE CONTAINER */}
      <div className="w-full max-w-xl bg-white text-gray-900 rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-2xl my-auto flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="flex items-start justify-between pb-3 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-red-100 text-red-600 uppercase">
                {match.type} • {match.map}
              </span>
              <span className="text-[10px] font-bold text-gray-500">
                Fee: ৳{match.entryFee} • Prize: ৳{match.prizePool}
              </span>
            </div>
            <h3 className="text-lg font-black text-gray-900">
              {isSquad && currentStep === 'SELECT_SLOT'
                ? 'Select Slot'
                : isSquad
                ? 'Enter Squad Player Details'
                : isDuo
                ? 'Duo Registration'
                : 'Solo Registration'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: SELECT SQUAD SLOT (ONLY FOR SQUAD MATCHES) */}
        {isSquad && currentStep === 'SELECT_SLOT' && (
          <>
            {/* Legend */}
            <div className="flex items-center justify-between text-xs font-bold text-gray-700 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500 inline-block"></span>
                <span>Your Selection</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-red-500 inline-block"></span>
                <span>Booked</span>
              </div>
            </div>

            {/* Scrollable Squad Slots Grid: 12 SLOTS (NO "Team" word, just "Slot #1", "Slot #2"...) */}
            <div className="flex-1 overflow-y-auto py-2 space-y-3 pr-1">
              <div className="text-xs font-bold text-gray-600 flex items-center justify-between">
                <span>Choose your Squad Slot:</span>
                <span className="text-red-600 font-black">12 Slots (48 Players)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {Array.from({ length: 12 }, (_, tIndex) => {
                  const slotNum = tIndex + 1;
                  const booked = bookedSlotsMap[slotNum];
                  const isSelected = selectedSlotNumber === slotNum;

                  return (
                    <button
                      key={slotNum}
                      type="button"
                      disabled={!!booked}
                      onClick={() => handleSelectSquadSlot(slotNum)}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col justify-between h-20 ${
                        booked
                          ? 'bg-red-50 border-red-200 text-red-600 cursor-not-allowed opacity-75'
                          : isSelected
                          ? 'bg-amber-500 text-black border-amber-500 shadow-md ring-2 ring-amber-400 font-black scale-102'
                          : 'bg-white border-gray-200 hover:border-amber-400 text-gray-900 hover:bg-amber-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Slot #{slotNum}
                        </span>
                        <span className="text-[9px] opacity-75">4P</span>
                      </div>
                      <div className="text-xs font-black truncate">
                        {booked
                          ? `${booked.ign} (Booked)`
                          : isSelected
                          ? '✓ Selected'
                          : 'Select Slot'}
                      </div>
                      <span className="text-[9px] font-mono opacity-80">
                        {booked ? 'Booked' : isSelected ? 'Ready' : 'Available'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Step 1 Footer */}
            <div className="pt-3 border-t border-gray-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleProceedToPlayerDetails}
                disabled={!selectedSlotNumber}
                className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/30 transition-all flex items-center gap-2"
              >
                <span>Next: Player Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* STEP 2: PLAYER DETAILS (Squad Step 2, OR Direct Registration for Solo & Duo) */}
        {currentStep === 'PLAYER_DETAILS' && (
          <>
            {/* Top Info Banner */}
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200">
              {isSquad ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep('SELECT_SLOT');
                      setErrorMessage(null);
                    }}
                    className="p-1 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors flex items-center gap-1 text-xs font-bold"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Change Slot</span>
                  </button>
                  <span className="text-xs font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-lg border border-red-200">
                    Slot #{selectedSlotNumber}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-black text-gray-800">
                  <User className="w-4 h-4 text-red-600" />
                  <span>{isDuo ? 'Duo Match Entry' : 'Solo Match Entry'}</span>
                </div>
              )}

              <span className="text-xs font-bold text-gray-600">
                Fee: ৳{match.entryFee} TK
              </span>
            </div>

            {/* Instruction Alert */}
            <div className="text-xs text-gray-600 bg-blue-50/70 border border-blue-200 p-2.5 rounded-xl leading-relaxed">
              {isSquad
                ? isClashSquad
                  ? 'ক্লাশ স্কোয়াড ৪v৪ ম্যাচে অবশ্যই ৪ জন প্লেয়ারের নাম ও ইউআইডি দিতে হবে (Solo বা কম প্লেয়ার দিয়ে জয়েন করা যাবে না)।'
                  : 'স্কোয়াড লিডার (Player 1) দেওয়া আবশ্যক। আপনি চাইলে ১ জন, ২ জন, ৩ জন বা ৪ জন নিয়ে জয়েন করতে পারেন (বাকি প্লেয়ার ঐচ্ছিক)।'
                : isDuo
                ? 'Player 1 (লিডার) আবশ্যক। Player 2 ঐচ্ছিক (চাইলে একা বা ২ জন মিলে জয়েন করতে পারবেন)।'
                : 'আপনার ফ্রি ফায়ার ইন-গেম নেম (IGN) ও UID লিখুন। কনফার্ম করলেই স্বয়ংক্রিয়ভাবে স্লটে বুকিং সম্পন্ন হবে!'}
            </div>

            {/* Form Fields */}
            <div className="flex-1 overflow-y-auto py-1 space-y-3.5 pr-1">
              {/* CASE A: SQUAD (4 PLAYERS) */}
              {isSquad && (
                <div className="space-y-3">
                  {squadPlayers.map((player, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          {idx === 0
                            ? 'Player 1 (Leader - আবশ্যক)'
                            : isClashSquad
                            ? `Player ${idx + 1} (আবশ্যক)`
                            : `Player ${idx + 1} (ঐচ্ছিক / Optional)`}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const text = await readClipboardText();
                                if (text) {
                                  setSquadPlayers((prev) =>
                                    prev.map((p, i) => (i === idx ? { ...p, uid: text.trim() } : p))
                                  );
                                  if (errorMessage) setErrorMessage(null);
                                }
                              } catch {}
                            }}
                            className="text-[11px] font-bold text-red-600 hover:text-red-500 flex items-center gap-1 cursor-pointer bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/20 active:scale-95 transition-all"
                          >
                            <Clipboard className="w-3 h-3" />
                            <span>পেস্ট করুন</span>
                          </button>
                          {player.verified && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* UID Input + Paste + Verify */}
                        <div className="flex items-center gap-1.5">
                          <div className="relative flex-1">
                            <input
                              id={`squad-uid-${idx}`}
                              type="text"
                              placeholder="Free Fire UID"
                              value={player.uid}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSquadPlayers((prev) =>
                                  prev.map((p, i) => (i === idx ? { ...p, uid: val } : p))
                                );
                                if (errorMessage) setErrorMessage(null);
                              }}
                              className="w-full pl-3 pr-8 py-2 rounded-xl border border-gray-200 bg-white text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-red-500 shadow-xs"
                            />
                            <button
                              type="button"
                              title="ক্লিপবোর্ড থেকে UID পেস্ট করুন"
                              onClick={async () => {
                                try {
                                  const text = await readClipboardText();
                                  if (text) {
                                    setSquadPlayers((prev) =>
                                      prev.map((p, i) => (i === idx ? { ...p, uid: text.trim() } : p))
                                    );
                                    if (errorMessage) setErrorMessage(null);
                                  }
                                } catch {}
                              }}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-600 active:scale-95 transition-all"
                            >
                              <Clipboard className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleVerifySquadPlayer(idx)}
                            disabled={player.checking}
                            className={`px-3 py-2 rounded-xl text-[11px] font-black transition-all flex items-center gap-1 flex-shrink-0 ${
                              player.verified
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                            }`}
                          >
                            {player.checking ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                            ) : player.verified ? (
                              '✓ ভেরিফাইড'
                            ) : (
                              'ভেরিফাই'
                            )}
                          </button>
                        </div>

                        {/* In-Game Name (IGN) */}
                        <div>
                          <input
                            type="text"
                            placeholder="UID ভেরিফাই করলে নাম আসবে"
                            value={player.ign}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSquadPlayers((prev) =>
                                prev.map((p, i) => (i === idx ? { ...p, ign: val } : p))
                              );
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-900 focus:outline-none focus:border-red-500 shadow-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* CASE B: DUO (2 PLAYERS - NO SLOT PICKING) */}
              {isDuo && (
                <div className="space-y-3">
                  {duoPlayers.map((player, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          {idx === 0 ? 'Player 1 (Leader - আবশ্যক)' : 'Player 2 (ঐচ্ছিক / Optional)'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const text = await readClipboardText();
                                if (text) {
                                  setDuoPlayers((prev) =>
                                    prev.map((p, i) => (i === idx ? { ...p, uid: text.trim() } : p))
                                  );
                                  if (errorMessage) setErrorMessage(null);
                                }
                              } catch {}
                            }}
                            className="text-[11px] font-bold text-red-600 hover:text-red-500 flex items-center gap-1 cursor-pointer bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/20 active:scale-95 transition-all"
                          >
                            <Clipboard className="w-3 h-3" />
                            <span>পেস্ট করুন</span>
                          </button>
                          {player.verified && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Free Fire UID */}
                        <div className="flex items-center gap-1.5">
                          <div className="relative flex-1">
                            <input
                              id={`duo-uid-${idx}`}
                              type="text"
                              placeholder="Free Fire UID"
                              value={player.uid}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDuoPlayers((prev) =>
                                  prev.map((p, i) => (i === idx ? { ...p, uid: val } : p))
                                );
                                if (errorMessage) setErrorMessage(null);
                              }}
                              className="w-full pl-3 pr-8 py-2 rounded-xl border border-gray-200 bg-white text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-red-500 shadow-xs"
                            />
                            <button
                              type="button"
                              title="ক্লিপবোর্ড থেকে UID পেস্ট করুন"
                              onClick={async () => {
                                try {
                                  const text = await readClipboardText();
                                  if (text) {
                                    setDuoPlayers((prev) =>
                                      prev.map((p, i) => (i === idx ? { ...p, uid: text.trim() } : p))
                                    );
                                    if (errorMessage) setErrorMessage(null);
                                  }
                                } catch {}
                              }}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-600 active:scale-95 transition-all"
                            >
                              <Clipboard className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleVerifyDuoPlayer(idx)}
                            disabled={player.checking}
                            className={`px-3 py-2 rounded-xl text-[11px] font-black transition-all flex items-center gap-1 flex-shrink-0 ${
                              player.verified
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                            }`}
                          >
                            {player.checking ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                            ) : player.verified ? (
                              '✓ ভেরিফাইড'
                            ) : (
                              'ভেরিফাই'
                            )}
                          </button>
                        </div>

                        {/* In-Game Name (IGN) */}
                        <div>
                          <input
                            type="text"
                            placeholder="UID ভেরিফাই করলে নাম আসবে"
                            value={player.ign}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDuoPlayers((prev) =>
                                prev.map((p, i) => (i === idx ? { ...p, ign: val } : p))
                              );
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-900 focus:outline-none focus:border-red-500 shadow-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* CASE C: SOLO (1 PLAYER - NO SLOT PICKING) */}
              {isSolo && (
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-gray-900">
                      Solo Player Info
                    </span>
                    {soloPlayer.verified && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                      </span>
                    )}
                  </div>

                  {/* Free Fire UID First */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-gray-700 block">
                        Free Fire UID:
                      </label>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const text = await readClipboardText();
                            if (text) {
                              setSoloPlayer((prev) => ({ ...prev, uid: text.trim() }));
                              if (errorMessage) setErrorMessage(null);
                            }
                          } catch {}
                        }}
                        className="text-[11px] font-bold text-red-600 hover:text-red-500 flex items-center gap-1 cursor-pointer bg-red-500/10 px-2.5 py-0.5 rounded-lg border border-red-500/20 active:scale-95 transition-all"
                      >
                        <Clipboard className="w-3 h-3" />
                        <span>পেস্ট করুন</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <input
                          id="solo-uid"
                          type="text"
                          placeholder="যেমন: 12116725180"
                          value={soloPlayer.uid}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSoloPlayer((prev) => ({
                              ...prev,
                              uid: val,
                            }));
                            if (errorMessage) setErrorMessage(null);
                          }}
                          className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-red-500 shadow-xs"
                        />
                        <button
                          type="button"
                          title="ক্লিপবোর্ড থেকে UID পেস্ট করুন"
                          onClick={async () => {
                            try {
                              const text = await readClipboardText();
                              if (text) {
                                setSoloPlayer((prev) => ({ ...prev, uid: text.trim() }));
                                if (errorMessage) setErrorMessage(null);
                              }
                            } catch {}
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-600 active:scale-95 transition-all"
                        >
                          <Clipboard className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleVerifySoloPlayer()}
                        disabled={soloPlayer.checking}
                        className={`px-3.5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                          soloPlayer.verified
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                        }`}
                      >
                        {soloPlayer.checking ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        ) : soloPlayer.verified ? (
                          '✓ ভেরিফাইড'
                        ) : (
                          'ভেরিফাই'
                        )}
                      </button>
                    </div>
                  </div>

                  {/* In-Game Name (IGN) Auto-filled */}
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      In-Game Name (IGN):
                    </label>
                    <input
                      type="text"
                      placeholder="UID দিলে স্বয়ংক্রিয়ভাবে নাম আসবে"
                      value={soloPlayer.ign}
                      onChange={(e) =>
                        setSoloPlayer((prev) => ({ ...prev, ign: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-900 focus:outline-none focus:border-red-500 shadow-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Step 2 Footer */}
            <div className="pt-3 border-t border-gray-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmBooking}
                className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/30 transition-all flex items-center gap-2"
              >
                <span>
                  {isSquad ? `Confirm Slot (৳${match.entryFee})` : `Confirm & Join (৳${match.entryFee})`}
                </span>
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
