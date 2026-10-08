'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  AlertCircle,
  Users,
  ShieldCheck,
  Search,
  Sparkles,
  UserCheck,
  Flame,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
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
  // 2-Step Flow: 'SELECT_SLOT' -> 'PLAYER_DETAILS'
  const [currentStep, setCurrentStep] = useState<'SELECT_SLOT' | 'PLAYER_DETAILS'>('SELECT_SLOT');

  // Mode configuration
  const matchTypeLower = (match.type || '').toLowerCase();
  const isSquad =
    matchTypeLower.includes('squad') ||
    match.totalSlots === 48 ||
    match.type === 'Squad';
  const isDuo = matchTypeLower.includes('duo');
  const isClashSquad = matchTypeLower.includes('4') && match.totalSlots === 8;
  const is1v1 = match.totalSlots === 2;

  // Selected team & slot
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
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

  // Booked slots map
  const [bookedSlotsMap, setBookedSlotsMap] = useState<
    Record<number, { ign: string; uid: string; badge?: string }>
  >(initialBookedSlots || {});

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

  const handleSelectSquadTeam = (teamNum: number) => {
    if (bookedSlotsMap[teamNum]) return;
    setSelectedTeam(teamNum);
    setSelectedSlotNumber(teamNum);
    setErrorMessage(null);
  };

  const handleSelectSlot = (slotNum: number) => {
    if (bookedSlotsMap[slotNum]) return;
    setSelectedSlotNumber(slotNum);
    if (isSquad || isDuo) {
      setSelectedTeam(slotNum);
    }
    setErrorMessage(null);
  };

  // Move from Step 1 to Step 2
  const handleProceedToPlayerDetails = () => {
    if (isSquad) {
      if (!selectedTeam) {
        setErrorMessage('Please select a team / slot first.');
        return;
      }
    } else {
      if (!selectedSlotNumber) {
        setErrorMessage('Please select an available slot first.');
        return;
      }
    }
    setErrorMessage(null);
    setCurrentStep('PLAYER_DETAILS');
  };

  // Final Confirmation in Step 2
  const handleConfirmBooking = () => {
    if (userBalance < match.entryFee) {
      setErrorMessage(`Insufficient balance! You need ৳${match.entryFee} TK in your wallet.`);
      return;
    }

    // Validation for Squad (Requires 4 players UID and IGN)
    if (isSquad) {
      if (!selectedTeam) {
        setErrorMessage('Please select your squad team.');
        setCurrentStep('SELECT_SLOT');
        return;
      }

      for (let i = 0; i < 4; i++) {
        const p = squadPlayers[i];
        if (!p.uid.trim()) {
          setErrorMessage(`Please enter Free Fire UID for Player #${i + 1}. All 4 players are required!`);
          return;
        }
        if (!p.ign.trim()) {
          setErrorMessage(`Please enter In-Game Name (IGN) for Player #${i + 1}. All 4 players are required!`);
          return;
        }
      }

      // Mark the team slot as booked
      setBookedSlotsMap((prev) => ({
        ...prev,
        [selectedTeam]: {
          ign: squadPlayers[0].ign.trim(),
          uid: squadPlayers[0].uid.trim(),
          badge: 'SQUAD',
        },
      }));

      onSuccess({
        slotNumber: selectedTeam,
        teamNumber: selectedTeam,
        ign: squadPlayers[0].ign.trim(),
        uid: squadPlayers[0].uid.trim(),
        players: squadPlayers.map((p, idx) => ({
          ign: p.ign.trim(),
          uid: p.uid.trim(),
          slotInTeam: idx + 1,
        })),
      });
      return;
    }

    // Validation for Duo (Requires 2 players UID and IGN)
    if (isDuo) {
      const activeSlot = selectedSlotNumber || selectedTeam;
      if (!activeSlot) {
        setErrorMessage('Please select a duo team first.');
        setCurrentStep('SELECT_SLOT');
        return;
      }
      for (let i = 0; i < 2; i++) {
        const p = duoPlayers[i];
        if (!p.uid.trim()) {
          setErrorMessage(`Please enter Free Fire UID for Player #${i + 1}. Both players are required!`);
          return;
        }
        if (!p.ign.trim()) {
          setErrorMessage(`Please enter In-Game Name (IGN) for Player #${i + 1}. Both players are required!`);
          return;
        }
      }

      setBookedSlotsMap((prev) => ({
        ...prev,
        [activeSlot]: {
          ign: duoPlayers[0].ign.trim(),
          uid: duoPlayers[0].uid.trim(),
          badge: 'DUO',
        },
      }));

      onSuccess({
        slotNumber: activeSlot,
        teamNumber: activeSlot,
        ign: duoPlayers[0].ign.trim(),
        uid: duoPlayers[0].uid.trim(),
        players: duoPlayers.map((p, idx) => ({
          ign: p.ign.trim(),
          uid: p.uid.trim(),
          slotInTeam: idx + 1,
        })),
      });
      return;
    }

    // Validation for Solo / CS / 1v1 (Requires 1 player UID and IGN)
    if (!selectedSlotNumber) {
      setErrorMessage('Please select an available slot.');
      setCurrentStep('SELECT_SLOT');
      return;
    }
    if (!soloPlayer.uid.trim()) {
      setErrorMessage('Please enter your Free Fire UID.');
      return;
    }
    if (!soloPlayer.ign.trim()) {
      setErrorMessage('Please enter your Free Fire In-Game Name (IGN).');
      return;
    }

    setBookedSlotsMap((prev) => ({
      ...prev,
      [selectedSlotNumber]: {
        ign: soloPlayer.ign.trim(),
        uid: soloPlayer.uid.trim(),
        badge: 'SOLO',
      },
    }));

    onSuccess({
      slotNumber: selectedSlotNumber,
      ign: soloPlayer.ign.trim(),
      uid: soloPlayer.uid.trim(),
      players: [
        {
          ign: soloPlayer.ign.trim(),
          uid: soloPlayer.uid.trim(),
          slotInTeam: 1,
        },
      ],
    });
  };

  const activeSelectedSlot = selectedTeam || selectedSlotNumber;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* PURE WHITE CONTAINER - NO DARK THEME OVERRIDES */}
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
              {currentStep === 'SELECT_SLOT' ? 'Select Slot' : 'Enter Player Details'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: SELECT SLOT */}
        {currentStep === 'SELECT_SLOT' && (
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

            {/* Scrollable Slots Grid */}
            <div className="flex-1 overflow-y-auto py-2 space-y-4 pr-1">
              {/* CASE A: SQUAD MODE (12 TEAMS) */}
              {isSquad && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-gray-600 flex items-center justify-between">
                    <span>Choose your Team Slot:</span>
                    <span className="text-red-600 font-black">12 Teams (48 Players)</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {Array.from({ length: 12 }, (_, tIndex) => {
                      const teamNum = tIndex + 1;
                      const booked = bookedSlotsMap[teamNum];
                      const isSelected = selectedTeam === teamNum;

                      return (
                        <button
                          key={teamNum}
                          type="button"
                          disabled={!!booked}
                          onClick={() => handleSelectSquadTeam(teamNum)}
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
                              Team #{teamNum}
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
              )}

              {/* CASE B: DUO MODE (24 TEAMS) */}
              {isDuo && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-gray-600 flex items-center justify-between">
                    <span>Choose your Duo Team Slot:</span>
                    <span className="text-red-600 font-black">24 Teams (48 Players)</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Array.from({ length: 24 }, (_, dIndex) => {
                      const teamNum = dIndex + 1;
                      const booked = bookedSlotsMap[teamNum];
                      const isSelected = selectedSlotNumber === teamNum;

                      return (
                        <button
                          key={teamNum}
                          type="button"
                          disabled={!!booked}
                          onClick={() => handleSelectSlot(teamNum)}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            booked
                              ? 'bg-red-50 border-red-200 text-red-600 cursor-not-allowed opacity-75'
                              : isSelected
                              ? 'bg-amber-500 text-black border-amber-500 font-black shadow-md ring-2 ring-amber-400'
                              : 'bg-white border-gray-200 hover:border-amber-400 text-gray-900 hover:bg-amber-50/50'
                          }`}
                        >
                          <span className="text-xs font-bold block">Team #{teamNum}</span>
                          <span className="text-[10px] font-bold truncate block">
                            {booked ? 'Booked' : isSelected ? '✓ Selected' : 'Available'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CASE C: SOLO MODE */}
              {!isSquad && !isDuo && match.totalSlots > 8 && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-gray-600 flex items-center justify-between">
                    <span>Choose your Solo Slot:</span>
                    <span className="text-red-600 font-black">1 to {match.totalSlots}</span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {Array.from({ length: match.totalSlots }, (_, i) => i + 1).map((slotNum) => {
                      const booked = bookedSlotsMap[slotNum];
                      const isSelected = selectedSlotNumber === slotNum;

                      return (
                        <button
                          key={slotNum}
                          type="button"
                          disabled={!!booked}
                          onClick={() => handleSelectSlot(slotNum)}
                          className={`h-12 rounded-xl p-1.5 text-center flex flex-col justify-between transition-all border ${
                            booked
                              ? 'bg-red-50 border-red-200 text-red-600 cursor-not-allowed opacity-75'
                              : isSelected
                              ? 'bg-amber-500 text-black border-amber-500 shadow-md ring-2 ring-amber-400 font-bold'
                              : 'bg-white border-gray-200 hover:border-amber-400 text-gray-900 hover:bg-amber-50/50'
                          }`}
                        >
                          <span className="text-[10px] font-bold">#{slotNum}</span>
                          <span className="text-[10px] font-black truncate block">
                            {booked ? booked.ign.slice(0, 6) : isSelected ? '✓ You' : 'Available'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CASE D: CLASH SQUAD (8 SLOTS) */}
              {isClashSquad && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Team Alpha */}
                    <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50 space-y-3">
                      <span className="text-xs font-black text-blue-600 block uppercase">
                        Team Alpha (Slots 1-4)
                      </span>
                      <div className="space-y-2">
                        {[1, 2, 3, 4].map((slotNum) => {
                          const booked = bookedSlotsMap[slotNum];
                          const isSelected = selectedSlotNumber === slotNum;
                          return (
                            <button
                              key={slotNum}
                              type="button"
                              disabled={!!booked}
                              onClick={() => handleSelectSlot(slotNum)}
                              className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                                booked
                                  ? 'bg-red-50 text-red-600 border-red-200'
                                  : isSelected
                                  ? 'bg-amber-500 text-black border-amber-400 font-black'
                                  : 'bg-white border-gray-200 hover:border-amber-400'
                              }`}
                            >
                              <span>Slot #{slotNum}</span>
                              <span>{booked ? `${booked.ign}` : isSelected ? '✓ Selected' : 'Available'}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Team Beta */}
                    <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50 space-y-3">
                      <span className="text-xs font-black text-rose-600 block uppercase">
                        Team Beta (Slots 5-8)
                      </span>
                      <div className="space-y-2">
                        {[5, 6, 7, 8].map((slotNum) => {
                          const booked = bookedSlotsMap[slotNum];
                          const isSelected = selectedSlotNumber === slotNum;
                          return (
                            <button
                              key={slotNum}
                              type="button"
                              disabled={!!booked}
                              onClick={() => handleSelectSlot(slotNum)}
                              className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                                booked
                                  ? 'bg-red-50 text-red-600 border-red-200'
                                  : isSelected
                                  ? 'bg-amber-500 text-black border-amber-400 font-black'
                                  : 'bg-white border-gray-200 hover:border-amber-400'
                              }`}
                            >
                              <span>Slot #{slotNum}</span>
                              <span>{booked ? `${booked.ign}` : isSelected ? '✓ Selected' : 'Available'}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CASE E: 1v1 DUEL (2 SLOTS) */}
              {is1v1 && (
                <div className="grid grid-cols-2 gap-4 py-2">
                  {[1, 2].map((slotNum) => {
                    const booked = bookedSlotsMap[slotNum];
                    const isSelected = selectedSlotNumber === slotNum;
                    return (
                      <button
                        key={slotNum}
                        type="button"
                        disabled={!!booked}
                        onClick={() => handleSelectSlot(slotNum)}
                        className={`p-5 rounded-2xl border text-center space-y-2 transition-all ${
                          booked
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : isSelected
                            ? 'bg-amber-500 text-black border-amber-400 font-black ring-2 ring-amber-400'
                            : 'bg-white border-gray-200 hover:border-amber-400'
                        }`}
                      >
                        <span className="text-xs font-bold uppercase block text-gray-500">
                          Player #{slotNum}
                        </span>
                        <span className="text-sm font-black block">
                          {booked ? booked.ign : isSelected ? '✓ Selected' : 'Select Slot'}
                        </span>
                      </button>
                    );
                  })}
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
                disabled={!activeSelectedSlot}
                className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/30 transition-all flex items-center gap-2"
              >
                <span>Next: Player Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* STEP 2: DEDICATED PLAYER DETAILS SCREEN (আলাদা পেজ) */}
        {currentStep === 'PLAYER_DETAILS' && (
          <>
            {/* Header with Selected Slot Badge & Back button */}
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200">
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
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                  {isSquad
                    ? `Team #${selectedTeam}`
                    : `Slot #${selectedSlotNumber}`}
                </span>
                <span className="text-xs font-bold text-gray-500">
                  Fee: ৳{match.entryFee}
                </span>
              </div>
            </div>

            {/* Instruction Alert */}
            <div className="text-xs text-gray-600 bg-blue-50/70 border border-blue-200 p-2.5 rounded-xl">
              {isSquad
                ? 'Please enter Free Fire UID & In-Game Name (IGN) for all 4 squad players.'
                : isDuo
                ? 'Please enter Free Fire UID & In-Game Name (IGN) for both duo players.'
                : 'Please enter your Free Fire UID and In-Game Name (IGN).'}
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto py-1 space-y-3.5 pr-1">
              {/* SQUAD: 4 PLAYERS */}
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
                        {/* Free Fire UID Input + Verify Button */}
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="Free Fire UID (e.g. 123456789)"
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

                        {/* In-Game Name (IGN) Input */}
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

              {/* DUO: 2 PLAYERS */}
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
                          {idx === 0 ? 'Player 1 (Leader)' : `Player ${idx + 1}`}
                        </span>
                        {player.verified && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Free Fire UID Input + Verify Button */}
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="Free Fire UID (e.g. 123456789)"
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

                        {/* In-Game Name (IGN) Input */}
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

              {/* SOLO: 1 PLAYER */}
              {!isSquad && !isDuo && (
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-gray-900">
                      Player Details
                    </span>
                    {soloPlayer.verified && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                      </span>
                    )}
                  </div>

                  {/* Free Fire UID Input + Verify Button */}
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
                        className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-red-500 shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={handleVerifySoloPlayer}
                        disabled={soloPlayer.checking}
                        className="px-3.5 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold transition-all flex items-center gap-1"
                      >
                        {soloPlayer.checking ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                        ) : (
                          'Verify'
                        )}
                      </button>
                    </div>
                  </div>

                  {/* In-Game Name (IGN) Input */}
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
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-900 focus:outline-none focus:border-red-500 shadow-xs"
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
                onClick={() => {
                  setCurrentStep('SELECT_SLOT');
                  setErrorMessage(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmBooking}
                className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/30 transition-all flex items-center gap-2"
              >
                <span>Confirm & Book Slot (৳{match.entryFee})</span>
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
