'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  AlertCircle,
  Users,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Loader2,
  User,
} from 'lucide-react';
import { MatchItem } from '@/lib/cms-store';
import { checkFreeFireUID } from '@/lib/ff-uid-checker';
import { getCurrentUser } from '@/lib/user-store';

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
      if (isSquad) {
        setSquadPlayers((prev) => [
          { ign: cur.ign || '', uid: cur.uid || '', checking: false, verified: true },
          prev[1],
          prev[2],
          prev[3],
        ]);
      } else if (isDuo) {
        setDuoPlayers((prev) => [
          { ign: cur.ign || '', uid: cur.uid || '', checking: false, verified: true },
          prev[1],
        ]);
      } else {
        setSoloPlayer({ ign: cur.ign || '', uid: cur.uid || '', checking: false, verified: true });
      }
    }
  }, [isSquad, isDuo]);

  // Handler to verify a specific squad player's UID
  async function handleVerifySquadPlayer(index: number) {
    const player = squadPlayers[index];
    if (!player.uid || player.uid.trim().length < 8) {
      setErrorMessage(`Please enter a valid 8-11 digit Free Fire UID for Player #${index + 1}.`);
      return;
    }

    setSquadPlayers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, checking: true } : p))
    );
    setErrorMessage(null);

    try {
      const profile = await checkFreeFireUID(player.uid.trim());
      if (profile.isValid) {
        setSquadPlayers((prev) =>
          prev.map((p, i) =>
            i === index
              ? { ...p, ign: profile.ign || p.ign, checking: false, verified: true }
              : p
          )
        );
      } else {
        setSquadPlayers((prev) =>
          prev.map((p, i) => (i === index ? { ...p, checking: false, verified: false } : p))
        );
        setErrorMessage(`UID for Player #${index + 1} not found online. You can enter IGN manually.`);
      }
    } catch {
      setSquadPlayers((prev) =>
        prev.map((p, i) => (i === index ? { ...p, checking: false } : p))
      );
    }
  }

  // Handler to verify duo player UID
  async function handleVerifyDuoPlayer(index: number) {
    const player = duoPlayers[index];
    if (!player.uid || player.uid.trim().length < 8) {
      setErrorMessage(`Please enter a valid 8-11 digit Free Fire UID for Player #${index + 1}.`);
      return;
    }

    setDuoPlayers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, checking: true } : p))
    );
    setErrorMessage(null);

    try {
      const profile = await checkFreeFireUID(player.uid.trim());
      if (profile.isValid) {
        setDuoPlayers((prev) =>
          prev.map((p, i) =>
            i === index
              ? { ...p, ign: profile.ign || p.ign, checking: false, verified: true }
              : p
          )
        );
      } else {
        setDuoPlayers((prev) =>
          prev.map((p, i) => (i === index ? { ...p, checking: false, verified: false } : p))
        );
        setErrorMessage(`UID for Player #${index + 1} not found online. You can enter IGN manually.`);
      }
    } catch {
      setDuoPlayers((prev) =>
        prev.map((p, i) => (i === index ? { ...p, checking: false } : p))
      );
    }
  }

  // Handler to verify solo player UID
  async function handleVerifySoloPlayer() {
    if (!soloPlayer.uid || soloPlayer.uid.trim().length < 8) {
      setErrorMessage('Please enter a valid 8-11 digit Free Fire UID.');
      return;
    }

    setSoloPlayer((prev) => ({ ...prev, checking: true }));
    setErrorMessage(null);

    try {
      const profile = await checkFreeFireUID(soloPlayer.uid.trim());
      if (profile.isValid) {
        setSoloPlayer((prev) => ({
          ...prev,
          ign: profile.ign || prev.ign,
          checking: false,
          verified: true,
        }));
      } else {
        setSoloPlayer((prev) => ({ ...prev, checking: false, verified: false }));
        setErrorMessage('Free Fire UID not found online. You can type IGN manually.');
      }
    } catch {
      setSoloPlayer((prev) => ({ ...prev, checking: false }));
    }
  }

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

    // 1. SQUAD MODE (Requires selected slot + 4 players)
    if (isSquad) {
      if (!selectedSlotNumber) {
        setErrorMessage('Please select your squad slot.');
        setCurrentStep('SELECT_SLOT');
        return;
      }

      for (let i = 0; i < 4; i++) {
        const p = squadPlayers[i];
        if (!p.ign.trim()) {
          setErrorMessage(`Please enter In-Game Name (IGN) for Player #${i + 1}. All 4 players are required!`);
          return;
        }
      }

      // Mark the slot as booked
      setBookedSlotsMap((prev) => ({
        ...prev,
        [selectedSlotNumber]: {
          ign: squadPlayers[0].ign.trim(),
          uid: squadPlayers[0].uid.trim(),
          badge: 'SQUAD',
        },
      }));

      onSuccess({
        slotNumber: selectedSlotNumber,
        teamNumber: selectedSlotNumber,
        ign: squadPlayers[0].ign.trim(),
        uid: squadPlayers[0].uid.trim(),
        players: squadPlayers.map((p, idx) => ({
          ign: p.ign.trim(),
          uid: p.uid.trim() || '---',
          slotInTeam: idx + 1,
        })),
      });
      return;
    }

    // 2. DUO MODE (No slot grid - direct registration for 2 players)
    if (isDuo) {
      if (!duoPlayers[0].ign.trim()) {
        setErrorMessage('Please enter In-Game Name (IGN) for Player 1 (Leader).');
        return;
      }
      if (!duoPlayers[1].ign.trim()) {
        setErrorMessage('Please enter In-Game Name (IGN) for Player 2.');
        return;
      }

      const assignedSlot = getNextAvailableSlot();

      setBookedSlotsMap((prev) => ({
        ...prev,
        [assignedSlot]: {
          ign: duoPlayers[0].ign.trim(),
          uid: duoPlayers[0].uid.trim(),
          badge: 'DUO',
        },
      }));

      onSuccess({
        slotNumber: assignedSlot,
        teamNumber: assignedSlot,
        ign: duoPlayers[0].ign.trim(),
        uid: duoPlayers[0].uid.trim(),
        players: duoPlayers.map((p, idx) => ({
          ign: p.ign.trim(),
          uid: p.uid.trim() || '---',
          slotInTeam: idx + 1,
        })),
      });
      return;
    }

    // 3. SOLO MODE (No slot grid - direct registration for 1 player)
    if (!soloPlayer.ign.trim()) {
      setErrorMessage('Please enter your Free Fire In-Game Name (IGN).');
      return;
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
                ? 'Please enter Free Fire In-Game Name (IGN) and UID for all 4 squad players.'
                : isDuo
                ? 'Please enter In-Game Name (IGN) for both duo players. Your slot will be registered automatically!'
                : 'Enter your Free Fire In-Game Name (IGN) and UID. You will be registered automatically upon confirmation!'}
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
                          {idx === 0 ? 'Player 1 (Leader)' : `Player ${idx + 1}`}
                        </span>
                        {player.verified && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* UID Input + Verify */}
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="Free Fire UID"
                            value={player.uid}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSquadPlayers((prev) =>
                                prev.map((p, i) =>
                                  i === idx ? { ...p, uid: val, verified: false } : p
                                )
                              );
                            }}
                            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-red-500 shadow-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleVerifySquadPlayer(idx)}
                            disabled={player.checking}
                            className="px-2.5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-[11px] font-bold transition-all flex items-center gap-1 flex-shrink-0"
                          >
                            {player.checking ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                            ) : (
                              'Verify'
                            )}
                          </button>
                        </div>

                        {/* In-Game Name (IGN) */}
                        <div>
                          <input
                            type="text"
                            placeholder="In-Game Name (IGN)"
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
                          {idx === 0 ? 'Player 1 (Leader)' : `Player 2`}
                        </span>
                        {player.verified && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Free Fire UID */}
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="Free Fire UID (optional)"
                            value={player.uid}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDuoPlayers((prev) =>
                                prev.map((p, i) =>
                                  i === idx ? { ...p, uid: val, verified: false } : p
                                )
                              );
                            }}
                            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-red-500 shadow-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleVerifyDuoPlayer(idx)}
                            disabled={player.checking}
                            className="px-2.5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-[11px] font-bold transition-all flex items-center gap-1 flex-shrink-0"
                          >
                            {player.checking ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                            ) : (
                              'Verify'
                            )}
                          </button>
                        </div>

                        {/* In-Game Name (IGN) */}
                        <div>
                          <input
                            type="text"
                            placeholder="In-Game Name (IGN)"
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

                  {/* In-Game Name (IGN) */}
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      In-Game Name (IGN):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ꧁★PRO-KILLER★꧂"
                      value={soloPlayer.ign}
                      onChange={(e) =>
                        setSoloPlayer((prev) => ({ ...prev, ign: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-900 focus:outline-none focus:border-red-500 shadow-xs"
                    />
                  </div>

                  {/* Free Fire UID */}
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Free Fire UID:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="e.g. 123456789"
                        value={soloPlayer.uid}
                        onChange={(e) =>
                          setSoloPlayer((prev) => ({
                            ...prev,
                            uid: e.target.value,
                            verified: false,
                          }))
                        }
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-red-500 shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={handleVerifySoloPlayer}
                        disabled={soloPlayer.checking}
                        className="px-3 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold transition-all flex items-center gap-1"
                      >
                        {soloPlayer.checking ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                        ) : (
                          'Verify'
                        )}
                      </button>
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
