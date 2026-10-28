'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  AlertCircle,
  Users,
  ArrowRight,
  ArrowLeft,
  User,
  Clipboard,
} from 'lucide-react';
import { MatchItem } from '@/lib/cms-store';
import { getCurrentUser, getUsers, hasUserJoinedMatch, recordUserJoinedMatch } from '@/lib/user-store';
import { readClipboardText } from '@/lib/clipboard';

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
  const is1v1 =
    matchTypeLower === '1 vs 1' ||
    matchTypeLower === '1v1' ||
    matchTypeLower === 'solo' ||
    matchTypeLower.includes('1 vs 1') ||
    matchTypeLower.includes('1v1') ||
    matchTypeLower.includes('solo') ||
    match.totalSlots === 2;

  const isDuo =
    !is1v1 &&
    (matchTypeLower.includes('duo') ||
      matchTypeLower.includes('2 vs 2') ||
      matchTypeLower.includes('2v2') ||
      match.totalSlots === 4 ||
      (match.totalSlots === 24 && !matchTypeLower.includes('squad')));

  const isSquad =
    !is1v1 &&
    !isDuo &&
    (matchTypeLower.includes('squad') ||
      matchTypeLower.includes('4 vs 4') ||
      matchTypeLower.includes('4v4') ||
      match.totalSlots === 48 ||
      match.totalSlots === 8 ||
      match.type === 'Squad');

  const isSolo = is1v1 || (!isSquad && !isDuo);

  const isClassicMatch =
    (match.categorySlug || '').toLowerCase().includes('classic') ||
    (match.title || '').toLowerCase().includes('classic') ||
    ((match as any).category || '').toLowerCase().includes('classic');

  const isClashSquad =
    (match.categorySlug || '').toLowerCase().includes('clash') ||
    ((match as any).category || '').toLowerCase().includes('clash') ||
    (match.title || '').toLowerCase().includes('clash');

  const isLoneWolf =
    (match.categorySlug || '').toLowerCase().includes('lone') ||
    (match.title || '').toLowerCase().includes('lone') ||
    ((match as any).category || '').toLowerCase().includes('lone');

  const isLoneWolf2v2 = isLoneWolf && isDuo;

  // Slot system is enabled for Classic matches and Lone Wolf 2v2 (which has 2 slots: Team 1 & Team 2)
  const hasSlotSelection = (isClassicMatch && (isSquad || isDuo || isSolo)) || isLoneWolf2v2;

  const totalSlotCount = isLoneWolf2v2 ? 2 : isSquad ? 12 : isDuo ? 24 : 48;

  // Starts at 'SELECT_SLOT' if slot system is enabled, otherwise directly goes to 'PLAYER_DETAILS'
  const [currentStep, setCurrentStep] = useState<'SELECT_SLOT' | 'PLAYER_DETAILS'>(
    hasSlotSelection ? 'SELECT_SLOT' : 'PLAYER_DETAILS'
  );

  // Selected slot
  const [selectedSlotNumber, setSelectedSlotNumber] = useState<number | null>(null);

  // Player state: 4 for Squad, 2 for Duo, 1 for Solo
  const [squadPlayers, setSquadPlayers] = useState([
    { ign: '', uid: '---' },
    { ign: '', uid: '---' },
    { ign: '', uid: '---' },
    { ign: '', uid: '---' },
  ]);

  const [duoPlayers, setDuoPlayers] = useState([
    { ign: '', uid: '---' },
    { ign: '', uid: '---' },
  ]);

  const [soloPlayer, setSoloPlayer] = useState({
    ign: '',
    uid: '---',
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Slot participants map: records players array for each slot number
  const [slotParticipantsMap, setSlotParticipantsMap] = useState<
    Record<number, Array<{ ign: string; uid: string }>>
  >(() => {
    const map: Record<number, Array<{ ign: string; uid: string }>> = {};
    if (match.participants && Array.isArray(match.participants)) {
      match.participants.forEach((p) => {
        if (p.slot) {
          if (!map[p.slot]) map[p.slot] = [];
          map[p.slot].push({
            ign: p.ign || 'Player',
            uid: p.uid || '---',
          });
        }
      });
    }
    if (initialBookedSlots) {
      Object.entries(initialBookedSlots).forEach(([slotStr, data]) => {
        const slot = Number(slotStr);
        if (!map[slot]) {
          map[slot] = [{ ign: data.ign, uid: data.uid || '---' }];
        }
      });
    }
    return map;
  });

  const getSlotCount = (slotNum: number) => {
    return (slotParticipantsMap[slotNum] || []).length;
  };

  const isSlotLocked = (slotNum: number) => {
    const count = getSlotCount(slotNum);
    if (isDuo) return count >= 2;
    return count >= 1;
  };

  const isSlotPartial = (slotNum: number) => {
    return isDuo && getSlotCount(slotNum) === 1;
  };

  // Universal Paste Helper for In-Game Name (IGN)
  const handlePasteIgn = async (onApply: (ign: string) => void) => {
    try {
      const text = await readClipboardText();
      if (text && text.trim()) {
        onApply(text.trim());
        setErrorMessage(null);
      }
    } catch (err) {
      console.warn('handlePasteIgn error:', err);
    }
  };

  const handleSelectSlot = (slotNum: number) => {
    if (isSlotLocked(slotNum)) {
      setErrorMessage(`Slot #${slotNum} সম্পূর্ণ বুকড ও লক করা। অন্য কোনো খালি বা ১-সিট খালি স্লট নির্বাচন করুন।`);
      return;
    }
    setSelectedSlotNumber(slotNum);
    setErrorMessage(null);
  };
  const handleSelectSquadSlot = handleSelectSlot;

  // Move from Step 1 to Step 2 (for Squad, Duo, and Classic Solo)
  const handleProceedToPlayerDetails = () => {
    if (hasSlotSelection && !selectedSlotNumber) {
      setErrorMessage('দয়া করে প্রথমে একটি স্লট নির্বাচন করুন (যেমন Slot #1)।');
      return;
    }
    setErrorMessage(null);
    setCurrentStep('PLAYER_DETAILS');
  };

  // Helper to find next available slot for Solo and Duo
  const getNextAvailableSlot = () => {
    const total = totalSlotCount || 24;
    // For duo matches: First try to find a slot that has 1 spot open to pair up!
    if (isDuo) {
      for (let s = 1; s <= total; s++) {
        if (isSlotPartial(s)) return s;
      }
    }
    for (let s = 1; s <= total; s++) {
      if (!isSlotLocked(s) && getSlotCount(s) === 0) return s;
    }
    for (let s = 1; s <= total; s++) {
      if (!isSlotLocked(s)) return s;
    }
    return 1;
  };

  // Final Confirmation
  const handleConfirmBooking = () => {
    if (userBalance < match.entryFee) {
      setErrorMessage(`Insufficient balance! You need ৳${match.entryFee} TK in your wallet.`);
      return;
    }

    const cur = getCurrentUser();
    if (cur?.status === 'BANNED' || (cur as any)?.isBanned) {
      setErrorMessage('🚨 আপনার অ্যাকাউন্টটি অ্যান্টি-চিট পলিসি ভায়োলেশনের জন্য পার্মানেন্ট ব্যান করা হয়েছে! আপনি কোনো ম্যাচে অংশগ্রহণ করতে পারবেন না।');
      return;
    }

    const registeredUsers = getUsers();
    const isPlayerBlacklisted = (uidOrIgn: string) => {
      const clean = String(uidOrIgn || '').trim().toLowerCase();
      if (!clean || clean === '---') return false;
      return registeredUsers.some(
        (u: any) =>
          (u.status === 'BANNED' || u.isBanned) &&
          (String(u.uid || '').trim().toLowerCase() === clean ||
            String(u.ign || '').trim().toLowerCase() === clean ||
            String(u.id || '').trim().toLowerCase() === clean)
      );
    };

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
      const p1Name = p1.ign?.trim();

      if (!p1Name) {
        setErrorMessage('Player 1 (Leader)-এর ইন-গেম নাম (IGN) লিখুন অথবা পেস্ট করুন।');
        return;
      }

      if (isSquad && isClashSquad) {
        // Clash Squad requires 4 player entries (name)
        for (let i = 0; i < 4; i++) {
          const p = squadPlayers[i];
          if (!p.ign?.trim()) {
            setErrorMessage(`ক্লাশ স্কোয়াড ম্যাচে Player #${i + 1}-এর ইন-গেম নাম (IGN) লিখুন।`);
            return;
          }
        }
      }

      // Collect valid players
      const validSquadPlayers = squadPlayers
        .map((p, idx) => {
          const pName = p.ign?.trim();
          return {
            ign: pName || (idx === 0 ? p1Name || `Player 1` : `Player ${idx + 1}`),
            uid: '---',
            slotInTeam: idx + 1,
          };
        })
        .filter((p, idx) => ((isSquad && isClashSquad) ? true : idx === 0 || Boolean(squadPlayers[idx].ign?.trim())));

      for (const p of validSquadPlayers) {
        if (isPlayerBlacklisted(p.ign)) {
          setErrorMessage(`🚨 প্লেয়ার (${p.ign}) অ্যান্টি-চিট সিস্টেমে পার্মানেন্ট ব্যান (BANNED)! এই প্লেয়ারকে নিয়ে টুর্নামেন্টে জয়েন করা যাবে না।`);
          return;
        }
      }

      const leaderIgn = validSquadPlayers[0]?.ign || p1Name || 'Leader';
      const leaderUid = '---';

      setSlotParticipantsMap((prev) => ({
        ...prev,
        [selectedSlotNumber]: validSquadPlayers.map((p) => ({ ign: p.ign, uid: p.uid })),
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

    // 2. DUO MODE (Leader required, Player 2 can join existing 1-person slot or bring teammate)
    if (isDuo) {
      if (hasSlotSelection && !selectedSlotNumber) {
        setErrorMessage('দয়া করে আপনার ডুয়ো স্লট নির্বাচন করুন।');
        setCurrentStep('SELECT_SLOT');
        return;
      }

      const assignedSlot = (hasSlotSelection && selectedSlotNumber) ? selectedSlotNumber : getNextAvailableSlot();
      const existingInSlot = slotParticipantsMap[assignedSlot] || [];
      const isJoiningExistingSlot = existingInSlot.length === 1;

      if (isJoiningExistingSlot) {
        // Player is joining as 2nd partner with the already registered 1st player!
        const p2 = duoPlayers[1].ign?.trim() || duoPlayers[0].ign?.trim();

        if (!p2) {
          setErrorMessage('Player 2 হিসেবে আপনার ইন-গেম নাম (IGN) লিখুন অথবা পেস্ট করুন।');
          return;
        }

        const myIgn = p2;
        const myUid = '---';

        if (isPlayerBlacklisted(myIgn)) {
          setErrorMessage(`🚨 প্লেয়ার (${myIgn}) অ্যান্টি-চিট সিস্টেমে পার্মানেন্ট ব্যান (BANNED)! টুর্নামেন্টে জয়েন করা যাবে না।`);
          return;
        }

        // Add 2nd player to slot: now it has 2 players, locking the slot (2/2)!
        const updatedSlotPlayers = [...existingInSlot, { ign: myIgn, uid: myUid }];
        setSlotParticipantsMap((prev) => ({
          ...prev,
          [assignedSlot]: updatedSlotPlayers,
        }));

        recordUserJoinedMatch(match.id, cur, {
          ign: myIgn,
          uid: myUid,
          slot: assignedSlot,
        });

        onSuccess({
          slotNumber: assignedSlot,
          teamNumber: assignedSlot,
          slotInTeam: 2,
          ign: myIgn,
          uid: myUid,
          players: [
            {
              ign: myIgn,
              uid: myUid,
              slotInTeam: 2,
            },
          ],
        });
        return;
      }

      // Slot was empty: User is Player 1 (Leader), Player 2 is optional
      const p1 = duoPlayers[0];
      const p1Name = p1.ign?.trim();

      if (!p1Name) {
        setErrorMessage('Player 1 (Leader)-এর ইন-গেম নাম (IGN) লিখুন অথবা পেস্ট করুন।');
        return;
      }

      const p2 = duoPlayers[1];
      const p2Name = p2.ign?.trim();
      const hasPlayer2 = Boolean(p2Name);

      const registeredPlayers: RegisteredPlayerEntry[] = [
        {
          ign: p1Name,
          uid: '---',
          slotInTeam: 1,
        },
      ];

      if (hasPlayer2) {
        registeredPlayers.push({
          ign: p2Name,
          uid: '---',
          slotInTeam: 2,
        });
      }

      for (const p of registeredPlayers) {
        if (isPlayerBlacklisted(p.ign)) {
          setErrorMessage(`🚨 প্লেয়ার (${p.ign}) অ্যান্টি-চিট সিস্টেমে পার্মানেন্ট ব্যান (BANNED)! এই প্লেয়ারকে নিয়ে টুর্নামেন্টে জয়েন করা যাবে না।`);
          return;
        }
      }

      const leaderIgn = registeredPlayers[0].ign;
      const leaderUid = '---';

      // Update slot: if 1 player was entered, slot has 1/2. If 2 entered, slot has 2/2 (locked)!
      setSlotParticipantsMap((prev) => ({
        ...prev,
        [assignedSlot]: registeredPlayers.map((p) => ({ ign: p.ign, uid: p.uid })),
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
        players: registeredPlayers,
      });
      return;
    }

    // 3. SOLO MODE (Single player)
    if (hasSlotSelection && !selectedSlotNumber) {
      setErrorMessage('দয়া করে আপনার সোলো স্লট নির্বাচন করুন।');
      setCurrentStep('SELECT_SLOT');
      return;
    }

    const soloName = soloPlayer.ign?.trim();

    if (!soloName) {
      setErrorMessage('আপনার ইন-গেম নাম (IGN) লিখুন অথবা পেস্ট করুন।');
      return;
    }

    const finalSoloName = soloName;
    const finalSoloUid = '---';

    if (isPlayerBlacklisted(finalSoloName)) {
      setErrorMessage('🚨 আপনার নাম অ্যান্টি-চিট সিস্টেমে পার্মানেন্ট ব্যান (BANNED)! টুর্নামেন্টে জয়েন করা যাবে না।');
      return;
    }

    const assignedSlot = (hasSlotSelection && selectedSlotNumber) ? selectedSlotNumber : getNextAvailableSlot();

    setSlotParticipantsMap((prev) => ({
      ...prev,
      [assignedSlot]: [{ ign: finalSoloName, uid: finalSoloUid }],
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
              {currentStep === 'SELECT_SLOT'
                ? isLoneWolf2v2
                  ? 'Select Team Slot (Slot #1 or Slot #2)'
                  : isSquad
                  ? 'Select Squad Slot'
                  : isDuo
                  ? 'Select Classic Duo Slot'
                  : 'Select Classic Solo Slot'
                : isSquad
                ? 'Enter Squad Player Details'
                : isDuo
                ? isLoneWolf2v2 ? 'Lone Wolf 2v2 Duo Team Registration' : 'Duo Registration'
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

        {/* STEP 1: SELECT SLOT (FOR SQUAD, AND EXCLUSIVELY FOR CLASSIC SOLO & CLASSIC DUO) */}
        {hasSlotSelection && currentStep === 'SELECT_SLOT' && (
          <>
            {/* Legend */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] font-bold text-gray-700 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
                <span>ফাঁকা (Available)</span>
              </div>
              {isDuo && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-400 border border-amber-600 inline-block"></span>
                  <span className="text-amber-800 font-black">১টি সিট খালি (1 Spot)</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500 inline-block"></span>
                <span>আপনার নির্বাচন</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-red-500 inline-block"></span>
                <span>লক / বুকড</span>
              </div>
            </div>

            {/* Scrollable Slots Grid */}
            <div className="flex-1 overflow-y-auto py-2 space-y-3 pr-1 max-h-[50vh]">
              <div className="text-xs font-bold text-gray-600 flex items-center justify-between">
                <span>{isLoneWolf2v2 ? 'টিম স্লট নির্বাচন করুন (Team 1 বা Team 2):' : isSquad ? 'Choose your Squad Slot:' : isDuo ? 'Choose your Duo Slot:' : 'Choose your Solo Slot:'}</span>
                <span className="text-red-600 font-black">
                  {isLoneWolf2v2 ? '২টি স্লট (Team 1 vs Team 2 • মোট ৪ জন)' : isSquad ? '12 Slots (48 Players)' : isDuo ? '24 Slots (48 Players)' : '48 Slots (48 Players)'}
                </span>
              </div>

              <div className={`grid ${isLoneWolf2v2 ? 'grid-cols-2 max-w-lg mx-auto w-full' : totalSlotCount > 24 ? 'grid-cols-3 sm:grid-cols-6' : 'grid-cols-2 sm:grid-cols-4'} gap-3`}>
                {Array.from({ length: totalSlotCount }, (_, tIndex) => {
                  const slotNum = tIndex + 1;
                  const playersInSlot = slotParticipantsMap[slotNum] || [];
                  const count = playersInSlot.length;
                  const isLocked = isSlotLocked(slotNum);
                  const hasOneSpot = isSlotPartial(slotNum);
                  const isSelected = selectedSlotNumber === slotNum;

                  return (
                    <button
                      key={slotNum}
                      type="button"
                      disabled={isLocked}
                      onClick={() => handleSelectSlot(slotNum)}
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col justify-between ${
                        totalSlotCount > 24 ? 'h-16' : 'h-20'
                      } ${
                        isLocked
                          ? 'bg-red-50 border-red-200 text-red-600 cursor-not-allowed opacity-75'
                          : isSelected
                          ? 'bg-amber-500 text-black border-amber-500 shadow-md ring-2 ring-amber-400 font-black scale-102'
                          : hasOneSpot
                          ? 'bg-amber-50/90 border-amber-300 text-amber-900 hover:border-amber-500 font-bold shadow-xs'
                          : 'bg-white border-gray-200 hover:border-emerald-500 text-gray-900 hover:bg-emerald-50/30'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="flex items-center gap-1">
                          {isLoneWolf2v2 ? <Users className="w-3.5 h-3.5 text-red-600" /> : isSolo ? <User className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                          {isLoneWolf2v2 ? `Team #${slotNum} (Slot #${slotNum})` : `Slot #${slotNum}`}
                        </span>
                        <span className={`text-[9px] px-1 py-0.2 rounded font-black ${
                          isLocked
                            ? 'bg-red-100 text-red-700'
                            : hasOneSpot
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {isDuo ? `${count}/2` : isSquad ? `${count > 0 ? 4 : 0}/4` : `${count}/1`}
                        </span>
                      </div>

                      <div className="text-[10px] sm:text-[11px] font-black truncate">
                        {isLocked
                          ? `🔒 ${playersInSlot[0]?.ign || 'Full'} & ${playersInSlot[1]?.ign || 'Lock'}`
                          : isSelected
                          ? '✓ সিলেক্টেড'
                          : hasOneSpot
                          ? `🟢 ১ম: ${playersInSlot[0]?.ign}`
                          : 'ফাঁকা স্লট'}
                      </div>

                      <span className="text-[9px] font-mono opacity-80">
                        {isLocked
                          ? 'লক (Full)'
                          : isSelected
                          ? 'Ready'
                          : hasOneSpot
                          ? '১টি সিট বাকি (Join)'
                          : 'Available'}
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

        {/* STEP 2: PLAYER DETAILS (For Squad / Classic Slot matches, or Direct Registration) */}
        {currentStep === 'PLAYER_DETAILS' && (
          <>
            {/* Top Info Banner */}
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200">
              {hasSlotSelection && selectedSlotNumber ? (
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
            <div className="text-xs text-gray-700 bg-emerald-50/80 border border-emerald-200 p-2.5 rounded-xl leading-relaxed flex items-center justify-between">
              <span>
                {isSquad
                  ? isClashSquad
                    ? 'ক্লাশ স্কোয়াড ৪v৪ ম্যাচে প্রতিটি প্লেয়ারের ইন-গেম নাম লিখুন বা পেস্ট করুন।'
                    : 'স্কোয়াড লিডার (Player 1) নাম দেওয়া আবশ্যক। বাকিদের নাম ঐচ্ছিক।'
                  : isDuo
                  ? 'Player 1 (লিডার) ইন-গেম নাম আবশ্যক। Player 2 ঐচ্ছিক।'
                  : 'আপনার ফ্রি ফায়ার ইন-গেম নাম (IGN) লিখে বা পেস্ট করে জয়েন করুন।'}
              </span>
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
                        <button
                          type="button"
                          onClick={() =>
                            handlePasteIgn((text) =>
                              setSquadPlayers((prev) =>
                                prev.map((p, i) => (i === idx ? { ...p, ign: text } : p))
                              )
                            )
                          }
                          className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg border border-red-200 active:scale-95 transition-all shadow-xs"
                        >
                          <Clipboard className="w-3.5 h-3.5" />
                          <span>পেস্ট করুন</span>
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-700 block">
                          ইন-গেম নাম (IGN):
                        </label>
                        <input
                          type="text"
                          placeholder={idx === 0 ? "Player 1 নাম পেস্ট করুন বা লিখুন (যেমন: ABU NUMAN)" : `Player ${idx + 1} নাম (ঐচ্ছিক)`}
                          value={player.ign}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSquadPlayers((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, ign: val } : p))
                            );
                            if (errorMessage) setErrorMessage(null);
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-900 focus:outline-none focus:border-red-500 shadow-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* CASE B: DUO (2 PLAYERS) */}
              {isDuo && (() => {
                const existingInSlot = selectedSlotNumber ? (slotParticipantsMap[selectedSlotNumber] || []) : [];
                const isJoiningAsSecond = existingInSlot.length === 1;

                if (isJoiningAsSecond) {
                  const partner = existingInSlot[0];
                  const player = duoPlayers[1].ign ? duoPlayers[1] : duoPlayers[0];

                  return (
                    <div className="space-y-3">
                      {/* Partner Info Banner */}
                      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black flex items-center gap-1.5 text-amber-800">
                            <Users className="w-4 h-4 text-amber-600" />
                            Slot #{selectedSlotNumber} • ১ম প্লেয়ার (Teammate)
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black">
                            ১টি সিট খালি (আপনার জন্য)
                          </span>
                        </div>
                        <p className="text-xs font-bold text-gray-800">
                          টিম পার্টনার: <span className="font-black text-red-600">{partner.ign}</span>
                        </p>
                        <p className="text-[10px] text-gray-500">
                          আপনি এই স্লটের ২য় প্লেয়ার হিসেবে জয়েন করছেন। আপনার জয়েনের পর এই স্লটটি ২/২ পূর্ণ হয়ে লক হয়ে যাবে।
                        </p>
                      </div>

                      {/* Player 2 Input (You) */}
                      <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold">
                              2
                            </span>
                            Player 2 (আপনার ইন-গেম নাম - আবশ্যক)
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handlePasteIgn((text) =>
                                setDuoPlayers((prev) =>
                                  prev.map((p, i) => (i === 1 ? { ...p, ign: text } : p))
                                )
                              )
                            }
                            className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg border border-red-200 active:scale-95 transition-all shadow-xs"
                          >
                            <Clipboard className="w-3.5 h-3.5" />
                            <span>পেস্ট করুন</span>
                          </button>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-gray-700 block">
                            ইন-গেম নাম (IGN):
                          </label>
                          <input
                            type="text"
                            placeholder="আপনার ফ্রি ফায়ার নাম পেস্ট করুন বা লিখুন (যেমন: ABU NUMAN)"
                            value={player.ign}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDuoPlayers((prev) =>
                                prev.map((p, i) => (i === 1 ? { ...p, ign: val } : p))
                              );
                              if (errorMessage) setErrorMessage(null);
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-900 focus:outline-none focus:border-red-500 shadow-xs"
                          />
                        </div>
                      </div>
                    </div>
                  );
                }

                // If slot is completely empty: Show Player 1 (required) + Player 2 (optional)
                return (
                  <div className="space-y-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] leading-relaxed">
                      💡 <strong>ডুয়ো স্লট সিস্টেম:</strong> আপনি একা জয়েন করলে (Player 1) আপনার স্লটে ১টি সিট ফাঁকা থাকবে, অন্য যেকোনো প্লেয়ার আপনার সাথে জয়েন করতে পারবে। আর Player 2 পূরণ করলে স্লটটি এখনই ২/২ লক হয়ে যাবে।
                    </div>

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
                            {idx === 0 ? 'Player 1 (Leader - আবশ্যক)' : 'Player 2 (ঐচ্ছিক - খালি রাখলে অন্য প্লেয়ার জয়েন করতে পারবে)'}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handlePasteIgn((text) =>
                                setDuoPlayers((prev) =>
                                  prev.map((p, i) => (i === idx ? { ...p, ign: text } : p))
                                )
                              )
                            }
                            className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg border border-red-200 active:scale-95 transition-all shadow-xs"
                          >
                            <Clipboard className="w-3.5 h-3.5" />
                            <span>পেস্ট করুন</span>
                          </button>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-gray-700 block">
                            ইন-গেম নাম (IGN):
                          </label>
                          <input
                            type="text"
                            placeholder={idx === 0 ? "Player 1 নাম পেস্ট করুন বা লিখুন (যেমন: ABU NUMAN)" : "Player 2 নাম (ঐচ্ছিক)"}
                            value={player.ign}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDuoPlayers((prev) =>
                                prev.map((p, i) => (i === idx ? { ...p, ign: val } : p))
                              );
                              if (errorMessage) setErrorMessage(null);
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-900 focus:outline-none focus:border-red-500 shadow-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* CASE C: SOLO (1 PLAYER - NO SLOT PICKING) */}
              {isSolo && (
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-red-600" />
                      <span>আপনার ফ্রি ফায়ার ইন-গেম নাম (IGN):</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        handlePasteIgn((text) =>
                          setSoloPlayer((prev) => ({ ...prev, ign: text }))
                        )
                      }
                      className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1.5 cursor-pointer bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl border border-red-200 active:scale-95 transition-all shadow-xs"
                    >
                      <Clipboard className="w-3.5 h-3.5" />
                      <span>পেস্ট করুন</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="আপনার ফ্রি ফায়ার নাম পেস্ট করুন বা লিখুন (যেমন: ABU NUMAN)"
                    value={soloPlayer.ign}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSoloPlayer((prev) => ({ ...prev, ign: val }));
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="w-full px-3.5 py-3 rounded-xl border border-gray-300 bg-white text-sm font-bold text-gray-900 focus:outline-none focus:border-red-500 shadow-xs"
                  />
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
