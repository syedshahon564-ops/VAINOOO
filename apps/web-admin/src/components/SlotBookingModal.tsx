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

  // Pre-fill logged-in user info for Player 1 / Leader
  useEffect(() => {
    const cur = getCurrentUser();
    if (cur) {
      const defaultName = cur.ign || cur.username || '';
      const defaultUid = cur.uid && cur.uid !== '---' ? cur.uid : '';
      if (isSquad) {
        setSquadPlayers((prev) => [
          { ign: prev[0].ign || defaultName, uid: prev[0].uid || defaultUid, checking: false, verified: true },
          prev[1],
          prev[2],
          prev[3],
        ]);
      } else if (isDuo) {
        setDuoPlayers((prev) => [
          { ign: prev[0].ign || defaultName, uid: prev[0].uid || defaultUid, checking: false, verified: true },
          prev[1],
        ]);
      } else {
        setSoloPlayer((prev) => ({
          ign: prev.ign || defaultName,
          uid: prev.uid || defaultUid,
          checking: false,
          verified: true,
        }));
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

      const p1 = squadPlayers[0];
      const p1Name = p1.ign?.trim() || cur?.ign?.trim() || cur?.username?.trim();
      const p1Uid = cleanUid(p1.uid) || cur?.uid || '';

      if (!p1Name && !p1Uid) {
        setErrorMessage('Player 1 (Leader)-এর নাম (IGN) অথবা UID লিখুন।');
        return;
      }

      if (isClashSquad) {
        // Clash Squad requires 4 player entries (name or UID)
        for (let i = 0; i < 4; i++) {
          const p = squadPlayers[i];
          if (!p.ign?.trim() && !cleanUid(p.uid)) {
            setErrorMessage(`ক্লাশ স্কোয়াড ম্যাচে Player #${i + 1}-এর নাম বা UID লিখুন।`);
            return;
          }
        }
      }

      // Collect valid players
      const validSquadPlayers = squadPlayers
        .map((p, idx) => {
          const cUid = cleanUid(p.uid);
          const pName = p.ign?.trim();
          return {
            ign: pName || (idx === 0 ? p1Name || `Player 1` : cUid ? `FF_${cUid.slice(-4)}` : `Player ${idx + 1}`),
            uid: cUid || (idx === 0 ? p1Uid || cur?.uid || '---' : `P${idx + 1}`),
            slotInTeam: idx + 1,
          };
        })
        .filter((p, idx) => (isClashSquad ? true : idx === 0 || Boolean(squadPlayers[idx].ign?.trim() || cleanUid(squadPlayers[idx].uid))));

      const leaderIgn = validSquadPlayers[0]?.ign || p1Name || 'Leader';
      const leaderUid = validSquadPlayers[0]?.uid || p1Uid || cur?.uid || '---';

      // Mark the slot as booked
      setBookedSlotsMap((prev) => ({
        ...prev,
        [selectedSlotNumber]: {
          ign: leaderIgn,
          uid: leaderUid,
          badge: 'SQUAD',
        },
      }));

      recordUserJoinedMatch(match.id, cur, {
        ign: leaderIgn,
        uid: leaderUid,
        slot: selectedSlotNumber,
      });

      onSuccess({
        slotNumber: selectedSlotNumber,
        teamNumber: selectedSlotNumber,
        ign: leaderIgn,
        uid: leaderUid,
        players: validSquadPlayers,
      });
      return;
    }

    // 2. DUO MODE (Leader required, Player 2 optional)
    if (isDuo) {
      const p1 = duoPlayers[0];
      const p1Name = p1.ign?.trim() || cur?.ign?.trim() || cur?.username?.trim();
      const p1Uid = cleanUid(p1.uid) || cur?.uid || '';

      if (!p1Name && !p1Uid) {
        setErrorMessage('Player 1 (Leader)-এর নাম (IGN) অথবা UID লিখুন।');
        return;
      }

      const validDuoPlayers = duoPlayers
        .map((p, idx) => {
          const cUid = cleanUid(p.uid);
          const pName = p.ign?.trim();
          return {
            ign: pName || (idx === 0 ? p1Name || `Player 1` : cUid ? `FF_${cUid.slice(-4)}` : `Player ${idx + 1}`),
            uid: cUid || (idx === 0 ? p1Uid || cur?.uid || '---' : `P${idx + 1}`),
            slotInTeam: idx + 1,
          };
        })
        .filter((p, idx) => idx === 0 || Boolean(duoPlayers[idx].ign?.trim() || cleanUid(duoPlayers[idx].uid)));

      const assignedSlot = getNextAvailableSlot();
      const leaderIgn = validDuoPlayers[0]?.ign || p1Name || 'Leader';
      const leaderUid = validDuoPlayers[0]?.uid || p1Uid || cur?.uid || '---';

      setBookedSlotsMap((prev) => ({
        ...prev,
        [assignedSlot]: {
          ign: leaderIgn,
          uid: leaderUid,
          badge: 'DUO',
        },
      }));

      recordUserJoinedMatch(match.id, cur, {
        ign: leaderIgn,
        uid: leaderUid,
        slot: assignedSlot,
      });

      onSuccess({
        slotNumber: assignedSlot,
        teamNumber: assignedSlot,
        ign: leaderIgn,
        uid: leaderUid,
        players: validDuoPlayers,
      });
      return;
    }

    // 3. SOLO MODE (No slot grid - direct registration for 1 player)
    const soloName = soloPlayer.ign?.trim() || cur?.ign?.trim() || cur?.username?.trim();
    const soloUid = cleanUid(soloPlayer.uid) || cur?.uid || '';

    if (!soloName && !soloUid) {
      setErrorMessage('আপনার ইন-গেম নাম (IGN) অথবা UID লিখুন।');
      return;
    }

    const finalSoloName = soloName || (soloUid ? `FF_${soloUid.slice(-4)}` : 'Player');
    const finalSoloUid = soloUid || cur?.uid || '---';

    const assignedSlot = getNextAvailableSlot();

    setBookedSlotsMap((prev) => ({
      ...prev,
      [assignedSlot]: {
        ign: finalSoloName,
        uid: finalSoloUid,
        badge: 'SOLO',
      },
    }));

    recordUserJoinedMatch(match.id, cur, {
      ign: finalSoloName,
      uid: finalSoloUid,
      slot: assignedSlot,
    });

    onSuccess({
      slotNumber: assignedSlot,
      ign: finalSoloName,
      uid: finalSoloUid,
      players: [
        {
          ign: finalSoloName,
          uid: finalSoloUid,
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
                  ? 'ক্লাশ স্কোয়াড ৪v৪ ম্যাচে প্রতিটি প্লেয়ারের UID এবং ইন-গেম নাম দিন।'
                  : 'স্কোয়াড লিডার (Player 1) দেওয়া আবশ্যক। বাকি প্লেয়ারদের তথ্য ঐচ্ছিক।'
                : isDuo
                ? 'Player 1 (লিডার) আবশ্যক। Player 2 ঐচ্ছিক।'
                : 'আপনার ফ্রি ফায়ার UID এবং ইন-গেম নাম (IGN) দিয়ে কনফার্ম করুন।'}
            </div>

            {/* Form Fields */}
            <div className="flex-1 overflow-y-auto py-1 space-y-3.5 pr-1">
              {/* CASE A: SQUAD (4 PLAYERS) */}
              {isSquad && (
                <div className="space-y-3">
                  {squadPlayers.map((player, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3"
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
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Free Fire UID */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-gray-700">
                              Free Fire UID:
                            </label>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const text = await readClipboardText();
                                  if (text) {
                                    const digits = toEnDigits(text) || text.trim();
                                    setSquadPlayers((prev) =>
                                      prev.map((p, i) => (i === idx ? { ...p, uid: digits } : p))
                                    );
                                    if (errorMessage) setErrorMessage(null);
                                  }
                                } catch {}
                              }}
                              className="text-[10px] font-bold text-red-600 hover:text-red-500 flex items-center gap-1 cursor-pointer bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/20 active:scale-95 transition-all"
                            >
                              <Clipboard className="w-2.5 h-2.5" />
                              <span>পেস্ট করুন</span>
                            </button>
                          </div>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder={idx === 0 ? "ফ্রি ফায়ার UID (যেমন: 123456789)" : `Player ${idx + 1} UID (ঐচ্ছিক)`}
                            value={player.uid}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSquadPlayers((prev) =>
                                prev.map((p, i) => (i === idx ? { ...p, uid: val } : p))
                              );
                              if (errorMessage) setErrorMessage(null);
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-900 focus:outline-none focus:border-red-500 shadow-xs"
                          />
                        </div>

                        {/* In-Game Name (IGN) */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-gray-700">
                              ইন-গেম নাম (IGN):
                            </label>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const text = await readClipboardText();
                                  if (text) {
                                    setSquadPlayers((prev) =>
                                      prev.map((p, i) => (i === idx ? { ...p, ign: text.trim() } : p))
                                    );
                                    if (errorMessage) setErrorMessage(null);
                                  }
                                } catch {}
                              }}
                              className="text-[10px] font-bold text-red-600 hover:text-red-500 flex items-center gap-1 cursor-pointer bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/20 active:scale-95 transition-all"
                            >
                              <Clipboard className="w-2.5 h-2.5" />
                              <span>পেস্ট করুন</span>
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder={idx === 0 ? "Player 1 নাম (যেমন: ABU NUMAN)" : `Player ${idx + 1} নাম (ঐচ্ছিক)`}
                            value={player.ign}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSquadPlayers((prev) =>
                                prev.map((p, i) => (i === idx ? { ...p, ign: val } : p))
                              );
                              if (errorMessage) setErrorMessage(null);
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
                      className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          {idx === 0 ? 'Player 1 (Leader - আবশ্যক)' : 'Player 2 (ঐচ্ছিক / Optional)'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Free Fire UID */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-gray-700">
                              Free Fire UID:
                            </label>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const text = await readClipboardText();
                                  if (text) {
                                    const digits = toEnDigits(text) || text.trim();
                                    setDuoPlayers((prev) =>
                                      prev.map((p, i) => (i === idx ? { ...p, uid: digits } : p))
                                    );
                                    if (errorMessage) setErrorMessage(null);
                                  }
                                } catch {}
                              }}
                              className="text-[10px] font-bold text-red-600 hover:text-red-500 flex items-center gap-1 cursor-pointer bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/20 active:scale-95 transition-all"
                            >
                              <Clipboard className="w-2.5 h-2.5" />
                              <span>পেস্ট করুন</span>
                            </button>
                          </div>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder={idx === 0 ? "ফ্রি ফায়ার UID (যেমন: 123456789)" : "Player 2 UID (ঐচ্ছিক)"}
                            value={player.uid}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDuoPlayers((prev) =>
                                prev.map((p, i) => (i === idx ? { ...p, uid: val } : p))
                              );
                              if (errorMessage) setErrorMessage(null);
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-900 focus:outline-none focus:border-red-500 shadow-xs"
                          />
                        </div>

                        {/* In-Game Name (IGN) */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-gray-700">
                              ইন-গেম নাম (IGN):
                            </label>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const text = await readClipboardText();
                                  if (text) {
                                    setDuoPlayers((prev) =>
                                      prev.map((p, i) => (i === idx ? { ...p, ign: text.trim() } : p))
                                    );
                                    if (errorMessage) setErrorMessage(null);
                                  }
                                } catch {}
                              }}
                              className="text-[10px] font-bold text-red-600 hover:text-red-500 flex items-center gap-1 cursor-pointer bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/20 active:scale-95 transition-all"
                            >
                              <Clipboard className="w-2.5 h-2.5" />
                              <span>পেস্ট করুন</span>
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder={idx === 0 ? "Player 1 নাম (যেমন: ABU NUMAN)" : "Player 2 নাম (ঐচ্ছিক)"}
                            value={player.ign}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDuoPlayers((prev) =>
                                prev.map((p, i) => (i === idx ? { ...p, ign: val } : p))
                              );
                              if (errorMessage) setErrorMessage(null);
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Solo UID */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-700 block">
                          Free Fire UID:
                        </label>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const text = await readClipboardText();
                              if (text) {
                                const digits = toEnDigits(text) || text.trim();
                                setSoloPlayer((prev) => ({ ...prev, uid: digits }));
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
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="আপনার ফ্রি ফায়ার UID (যেমন: 123456789)"
                        value={soloPlayer.uid}
                        onChange={(e) => {
                          setSoloPlayer((prev) => ({ ...prev, uid: e.target.value }));
                          if (errorMessage) setErrorMessage(null);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-900 focus:outline-none focus:border-red-500 shadow-xs"
                      />
                    </div>

                    {/* Solo IGN */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-700 block">
                          ইন-গেম নাম (IGN):
                        </label>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const text = await readClipboardText();
                              if (text) {
                                setSoloPlayer((prev) => ({ ...prev, ign: text.trim() }));
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
                      <input
                        type="text"
                        placeholder="আপনার ফ্রি ফায়ার নাম (যেমন: ABU NUMAN)"
                        value={soloPlayer.ign}
                        onChange={(e) => {
                          setSoloPlayer((prev) => ({ ...prev, ign: e.target.value }));
                          if (errorMessage) setErrorMessage(null);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-900 focus:outline-none focus:border-red-500 shadow-xs"
                      />
                    </div>
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
