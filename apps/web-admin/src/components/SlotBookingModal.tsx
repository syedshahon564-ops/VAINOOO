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
} from 'lucide-react';
import { MatchItem } from '@/lib/cms-store';
import { checkFreeFireUID, VerifiedPlayerProfile } from '@/lib/ff-uid-checker';
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
  const isSquad =
    match.type.toLowerCase().includes('squad') ||
    match.totalSlots === 48 ||
    match.type === 'Squad';
  const isDuo = match.type.toLowerCase().includes('duo');
  const isClashSquad = match.type.includes('4') && match.totalSlots === 8;
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

  // Initial booked slots starts EMPTY or uses props
  const [bookedSlotsMap, setBookedSlotsMap] = useState<
    Record<number, { ign: string; uid: string; badge?: string }>
  >(initialBookedSlots || {});

  // Pre-fill logged-in user info for Player 1 / Leader
  useEffect(() => {
    const cur = getCurrentUser();
    if (cur) {
      if (isSquad) {
        setSquadPlayers((prev) => [
          { ign: cur.ign, uid: cur.uid, checking: false, verified: true },
          prev[1],
          prev[2],
          prev[3],
        ]);
      } else if (isDuo) {
        setDuoPlayers((prev) => [
          { ign: cur.ign, uid: cur.uid, checking: false, verified: true },
          prev[1],
        ]);
      } else {
        setSoloPlayer({ ign: cur.ign, uid: cur.uid, checking: false, verified: true });
      }
    }
  }, [isSquad, isDuo]);

  // Handler to verify a specific squad player's UID
  async function handleVerifySquadPlayer(index: number) {
    const player = squadPlayers[index];
    if (!player.uid || player.uid.trim().length < 8) {
      setErrorMessage(`প্লেয়ার #${index + 1} এর সঠিক ৮-১১ ডিজিটের Free Fire UID দিন।`);
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
        setErrorMessage(`প্লেয়ার #${index + 1} এর UID পাওয়া যায়নি। ম্যানুয়ালি IGN লিখুন।`);
      }
    } catch (e) {
      setSquadPlayers((prev) =>
        prev.map((p, i) => (i === index ? { ...p, checking: false } : p))
      );
    }
  }

  // Handler to verify duo player UID
  async function handleVerifyDuoPlayer(index: number) {
    const player = duoPlayers[index];
    if (!player.uid || player.uid.trim().length < 8) {
      setErrorMessage(`প্লেয়ার #${index + 1} এর সঠিক ৮-১১ ডিজিটের UID দিন।`);
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
      }
    } catch (e) {
      setDuoPlayers((prev) =>
        prev.map((p, i) => (i === index ? { ...p, checking: false } : p))
      );
    }
  }

  // Handler to verify solo player UID
  async function handleVerifySoloPlayer() {
    if (!soloPlayer.uid || soloPlayer.uid.trim().length < 8) {
      setErrorMessage('সঠিক ৮-১১ ডিজিটের Free Fire UID দিন।');
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
      }
    } catch (e) {
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
    setErrorMessage(null);
  };

  const handleConfirmBooking = () => {
    if (userBalance < match.entryFee) {
      setErrorMessage(`অপর্যাপ্ত ব্যালেন্স! আপনার ওয়ালেটে ৳${match.entryFee} টাকা প্রয়োজন।`);
      return;
    }

    // Validation for Squad (Requires all 4 players)
    if (isSquad) {
      if (!selectedTeam) {
        setErrorMessage('দয়া করে আপনার পছন্দের স্কোয়াড টিম / স্লট নির্বাচন করুন (যেমন স্লট #৩)।');
        return;
      }

      for (let i = 0; i < 4; i++) {
        const p = squadPlayers[i];
        if (!p.ign.trim()) {
          setErrorMessage(`প্লেয়ার #${i + 1} এর ইন-গেম নাম (IGN) লিখুন। ৪ জন প্লেয়ার বাধ্যতামূলক!`);
          return;
        }
        if (!p.uid.trim()) {
          setErrorMessage(`প্লেয়ার #${i + 1} এর Free Fire UID লিখুন। ৪ জন প্লেয়ার বাধ্যতামূলক!`);
          return;
        }
      }

      // Mark the team slot as booked
      setBookedSlotsMap((prev) => ({
        ...prev,
        [selectedTeam]: {
          ign: squadPlayers[0].ign,
          uid: squadPlayers[0].uid,
          badge: 'SQUAD',
        },
      }));

      onSuccess({
        slotNumber: selectedTeam,
        teamNumber: selectedTeam,
        ign: squadPlayers[0].ign,
        uid: squadPlayers[0].uid,
        players: squadPlayers.map((p, idx) => ({
          ign: p.ign.trim(),
          uid: p.uid.trim(),
          slotInTeam: idx + 1,
        })),
      });
      return;
    }

    // Validation for Duo (Requires 2 players)
    if (isDuo) {
      if (!selectedSlotNumber) {
        setErrorMessage('দয়া করে ডুও টিম নির্বাচন করুন।');
        return;
      }
      for (let i = 0; i < 2; i++) {
        if (!duoPlayers[i].ign.trim() || !duoPlayers[i].uid.trim()) {
          setErrorMessage(`প্লেয়ার #${i + 1} এর নাম ও UID পূরণ করা বাধ্যতামূলক।`);
          return;
        }
      }

      setBookedSlotsMap((prev) => ({
        ...prev,
        [selectedSlotNumber]: {
          ign: duoPlayers[0].ign,
          uid: duoPlayers[0].uid,
          badge: 'DUO',
        },
      }));

      onSuccess({
        slotNumber: selectedSlotNumber,
        teamNumber: selectedSlotNumber,
        ign: duoPlayers[0].ign,
        uid: duoPlayers[0].uid,
        players: duoPlayers.map((p, idx) => ({
          ign: p.ign.trim(),
          uid: p.uid.trim(),
          slotInTeam: idx + 1,
        })),
      });
      return;
    }

    // Validation for Solo / CS / 1v1
    if (!selectedSlotNumber) {
      setErrorMessage('দয়া করে একটি খালি স্লট নির্বাচন করুন।');
      return;
    }
    if (!soloPlayer.ign.trim() || !soloPlayer.uid.trim()) {
      setErrorMessage('আপনার Free Fire নাম (IGN) ও UID পূরণ করা বাধ্যতামূলক।');
      return;
    }

    setBookedSlotsMap((prev) => ({
      ...prev,
      [selectedSlotNumber]: {
        ign: soloPlayer.ign,
        uid: soloPlayer.uid,
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

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-[#14141c] rounded-3xl p-5 sm:p-7 space-y-5 border border-gray-200 dark:border-white/10 shadow-2xl my-6 flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="flex items-start justify-between pb-3 border-b border-gray-200 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-600 uppercase">
                {match.type} • {match.map}
              </span>
              <span className="text-[10px] font-bold text-gray-500">
                ফি: ৳{match.entryFee} • প্রাইজ: ৳{match.prizePool}
              </span>
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">
              {isSquad
                ? 'স্কোয়াড স্লট নির্বাচন ও ৪ জন প্লেয়ার এন্ট্রি'
                : isDuo
                ? 'ডুও স্লট নির্বাচন ও ২ জন প্লেয়ার এন্ট্রি'
                : 'পছন্দের স্লট নির্বাচন ও প্লেয়ার ভেরিফিকেশন'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs font-bold text-gray-600 dark:text-gray-300 px-1 py-1 bg-gray-50 dark:bg-white/5 rounded-xl">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span> ফাঁকা (Available)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500 inline-block"></span> আপনার নির্বাচিত
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-600 inline-block"></span> বুকড (Booked)
          </div>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* CASE A: SQUAD MODE (12 TEAMS / SLOTS) */}
          {isSquad && (
            <div className="space-y-4">
              <div className="text-xs font-black uppercase text-gray-700 dark:text-gray-300 flex items-center justify-between">
                <span>১. আপনার স্কোয়াড টিম / স্লট বেছে নিন (Select Slot):</span>
                <span className="text-red-500 font-bold">১২টি টিম (৪৮ জন প্লেয়ার)</span>
              </div>

              {/* 12 Squad Team Slots */}
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
                          ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/40 text-red-600 cursor-not-allowed opacity-80'
                          : isSelected
                          ? 'bg-amber-500 text-black border-amber-400 shadow-lg ring-2 ring-amber-400 font-black scale-102'
                          : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-amber-400 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          টিম #{teamNum}
                        </span>
                        <span className="text-[9px] opacity-75">৪ জন</span>
                      </div>
                      <div className="text-xs font-black truncate">
                        {booked
                          ? `${booked.ign} (বুকড)`
                          : isSelected
                          ? '✓ নির্বাচিত'
                          : 'স্লট বেছে নিন'}
                      </div>
                      <span className="text-[9px] font-mono opacity-80">
                        {booked ? 'Slot Occupied' : isSelected ? 'Ready to Book' : 'Available'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 4-PLAYER REGISTRATION FORM (Mandatory 4 Players) */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-red-600/10 via-amber-500/10 to-transparent border border-red-500/20 space-y-3.5">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-red-600" />
                    <h4 className="text-xs font-black text-gray-900 dark:text-white">
                      ২. টিম {selectedTeam ? `#${selectedTeam}` : ''} এর ৪ জন প্লেয়ারের তথ্য (All 4 Players Required):
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-950/50 px-2 py-0.5 rounded-full">
                    ৪ জনই বাধ্যতামূলক
                  </span>
                </div>

                <div className="space-y-3">
                  {squadPlayers.map((player, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white dark:bg-[#1a1a26] border border-gray-200 dark:border-white/10 space-y-2 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          {idx === 0
                            ? 'প্লেয়ার ১ (টিম লিডার / ক্যাপ্টেন)'
                            : `প্লেয়ার ${idx + 1}`}
                        </span>
                        {player.verified && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* UID Input with verify button */}
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="Free Fire UID (e.g. 192837465)"
                            value={player.uid}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSquadPlayers((prev) =>
                                prev.map((p, i) => (i === idx ? { ...p, uid: val } : p))
                              );
                            }}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-xs font-mono font-bold focus:outline-none focus:border-red-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleVerifySquadPlayer(idx)}
                            disabled={player.checking}
                            className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-gray-200 dark:bg-white/10 hover:bg-red-600 hover:text-white transition-colors"
                            title="Auto fetch player name from Free Fire"
                          >
                            {player.checking ? '...' : 'যাচাই'}
                          </button>
                        </div>

                        {/* In-Game Name (IGN) */}
                        <input
                          type="text"
                          placeholder="ইন-গেম নাম / IGN (e.g. BDX_STRIKER)"
                          value={player.ign}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSquadPlayers((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, ign: val } : p))
                            );
                          }}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-xs font-bold focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CASE B: DUO MODE (24 TEAMS x 2 PLAYERS) */}
          {isDuo && (
            <div className="space-y-4">
              <div className="text-xs font-black uppercase text-gray-700 dark:text-gray-300">
                ১. ডুও টিম নির্বাচন করুন (Select Duo Team):
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
                          ? 'bg-red-50 text-red-600 cursor-not-allowed opacity-80'
                          : isSelected
                          ? 'bg-amber-500 text-black border-amber-400 font-black'
                          : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10'
                      }`}
                    >
                      <span className="text-xs font-bold block">টিম #{teamNum}</span>
                      <span className="text-[10px] truncate block">
                        {booked ? 'বুকড' : isSelected ? '✓ নির্বাচিত' : 'ফাঁকা'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 2 Players Form */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-3">
                <h4 className="text-xs font-black text-gray-900 dark:text-white">
                  ২ জন প্লেয়ারের তথ্য (Both Players Required):
                </h4>
                {duoPlayers.map((player, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder={`প্লেয়ার #${idx + 1} UID`}
                        value={player.uid}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDuoPlayers((prev) =>
                            prev.map((p, i) => (i === idx ? { ...p, uid: val } : p))
                          );
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleVerifyDuoPlayer(idx)}
                        className="px-2 py-1 bg-gray-200 dark:bg-white/10 rounded text-[10px]"
                      >
                        যাচাই
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder={`প্লেয়ার #${idx + 1} IGN`}
                      value={player.ign}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDuoPlayers((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, ign: val } : p))
                        );
                      }}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CASE C: SOLO MODE (48 INDIVIDUAL SLOTS) */}
          {!isSquad && !isDuo && match.totalSlots > 8 && (
            <div className="space-y-4">
              <div className="text-xs font-black uppercase text-gray-700 dark:text-gray-300">
                সোলো স্লট গ্রিড (১ থেকে {match.totalSlots}):
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
                          ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/40 text-red-600 cursor-not-allowed'
                          : isSelected
                          ? 'bg-amber-500 text-black border-amber-400 shadow-md ring-2 ring-amber-400 font-bold'
                          : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-red-400 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      <span className="text-[10px] font-bold">#{slotNum}</span>
                      <span className="text-[10px] font-black truncate block">
                        {booked ? booked.ign.slice(0, 7) : isSelected ? '✓ আপনি' : 'ফাঁকা'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Solo Player Details */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-3">
                <h4 className="text-xs font-black text-gray-900 dark:text-white">
                  আপনার প্লেয়ার ডিটেইলস:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="Free Fire UID"
                      value={soloPlayer.uid}
                      onChange={(e) =>
                        setSoloPlayer((prev) => ({ ...prev, uid: e.target.value }))
                      }
                      className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleVerifySoloPlayer}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-gray-200 dark:bg-white/10"
                    >
                      যাচাই
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="ইন-গেম নাম / IGN"
                    value={soloPlayer.ign}
                    onChange={(e) =>
                      setSoloPlayer((prev) => ({ ...prev, ign: e.target.value }))
                    }
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CASE D: CLASH SQUAD (8 SLOTS: TEAM ALPHA vs TEAM BETA) */}
          {isClashSquad && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Team Alpha */}
                <div className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#181824] space-y-3">
                  <span className="text-xs font-black text-blue-600 block uppercase">
                    টিম আলফা (Slots 1-4)
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
                              ? 'bg-red-50 dark:bg-red-950/40 text-red-600 border-red-200'
                              : isSelected
                              ? 'bg-amber-500 text-black border-amber-400 font-black'
                              : 'bg-white dark:bg-white/5 hover:border-red-400'
                          }`}
                        >
                          <span>স্লট #{slotNum}</span>
                          <span>{booked ? `${booked.ign}` : isSelected ? '✓ নির্বাচিত' : 'খালি'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Team Beta */}
                <div className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#181824] space-y-3">
                  <span className="text-xs font-black text-rose-600 block uppercase">
                    টিম বিটা (Slots 5-8)
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
                              ? 'bg-red-50 dark:bg-red-950/40 text-red-600 border-red-200'
                              : isSelected
                              ? 'bg-amber-500 text-black border-amber-400 font-black'
                              : 'bg-white dark:bg-white/5 hover:border-red-400'
                          }`}
                        >
                          <span>স্লট #{slotNum}</span>
                          <span>{booked ? `${booked.ign}` : isSelected ? '✓ নির্বাচিত' : 'খালি'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Player details */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-2">
                <h4 className="text-xs font-black text-gray-900 dark:text-white">
                  আপনার প্লেয়ার ডিটেইলস:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Free Fire UID"
                    value={soloPlayer.uid}
                    onChange={(e) =>
                      setSoloPlayer((prev) => ({ ...prev, uid: e.target.value }))
                    }
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-mono font-bold"
                  />
                  <input
                    type="text"
                    placeholder="ইন-গেম নাম / IGN"
                    value={soloPlayer.ign}
                    onChange={(e) =>
                      setSoloPlayer((prev) => ({ ...prev, ign: e.target.value }))
                    }
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CASE E: 1v1 DUEL (2 SLOTS) */}
          {is1v1 && (
            <div className="space-y-4">
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
                          ? 'bg-red-50 dark:bg-red-950/40 text-red-600 border-red-200'
                          : isSelected
                          ? 'bg-amber-500 text-black border-amber-400 font-black ring-2 ring-amber-400'
                          : 'bg-white dark:bg-white/5 hover:border-red-400'
                      }`}
                    >
                      <span className="text-xs font-bold uppercase block text-gray-500">
                        প্লেয়ার #{slotNum}
                      </span>
                      <span className="text-sm font-black block">
                        {booked ? booked.ign : isSelected ? '✓ আপনি নির্বাচিত' : 'স্লট বেছে নিন'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Player details */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Free Fire UID"
                    value={soloPlayer.uid}
                    onChange={(e) =>
                      setSoloPlayer((prev) => ({ ...prev, uid: e.target.value }))
                    }
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-mono font-bold"
                  />
                  <input
                    type="text"
                    placeholder="ইন-গেম নাম / IGN"
                    value={soloPlayer.ign}
                    onChange={(e) =>
                      setSoloPlayer((prev) => ({ ...prev, ign: e.target.value }))
                    }
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 border border-red-200 dark:border-red-900 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-gray-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-gray-500">
            {isSquad && selectedTeam ? (
              <span>
                নির্বাচিত: <strong className="text-red-600 font-black">টিম / স্লট #{selectedTeam}</strong> (৪ জন প্লেয়ার)
              </span>
            ) : selectedSlotNumber ? (
              <span>
                নির্বাচিত স্লট: <strong className="text-red-600 font-black">#{selectedSlotNumber}</strong>
              </span>
            ) : (
              <span>একটি খালি স্লট / টিম পছন্দ করুন</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 transition-colors"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={handleConfirmBooking}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs font-black text-white btn-red shadow-lg shadow-red-600/30 transition-all"
            >
              কনফার্ম ও স্লট বুক করুন (৳{match.entryFee})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
