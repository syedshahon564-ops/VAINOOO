'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, Clock, Users, Shield, Check, AlertCircle, X } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';

export default function MatchesPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<any | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filterMode, setFilterMode] = useState<string>('ALL');

  useEffect(() => {
    fetchTournaments();
  }, []);

  async function fetchTournaments() {
    try {
      const res = await ApiClient.getTournaments();
      setTournaments(res.tournaments || []);
    } catch (err) {
      // Demo match list for web preview
      setTournaments([
        {
          id: 'demo-1',
          title: 'Free Fire Bermuda Squad Championship #42',
          gameMode: 'BR_SQUAD',
          mapType: 'BERMUDA',
          entryFee: 100,
          prizePool: 5000,
          firstPrize: 2500,
          perKillPrize: 25,
          totalSlots: 48,
          filledSlots: 42,
          status: 'UPCOMING',
          matchTime: new Date(Date.now() + 3600000 * 2).toISOString(),
        },
        {
          id: 'demo-2',
          title: 'Purgatory Solo Quick Rush #39',
          gameMode: 'BR_SOLO',
          mapType: 'PURGATORY',
          entryFee: 30,
          prizePool: 1200,
          firstPrize: 600,
          perKillPrize: 10,
          totalSlots: 48,
          filledSlots: 36,
          status: 'UPCOMING',
          matchTime: new Date(Date.now() + 3600000 * 4).toISOString(),
        },
        {
          id: 'demo-3',
          title: 'Clash Squad 4v4 High Stakes Battle',
          gameMode: 'CS_4V4',
          mapType: 'BERMUDA',
          entryFee: 200,
          prizePool: 1500,
          firstPrize: 1500,
          perKillPrize: 0,
          totalSlots: 8,
          filledSlots: 6,
          status: 'UPCOMING',
          matchTime: new Date(Date.now() + 3600000 * 6).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function openSlotModal(tournamentId: string) {
    setMessage(null);
    setSelectedSlot(null);
    try {
      const res = await ApiClient.getTournament(tournamentId);
      setSelectedTournament(res.tournament);
    } catch (err) {
      // If offline demo
      const found = tournaments.find((t) => t.id === tournamentId);
      if (found) {
        const slots = Array.from({ length: found.totalSlots }, (_, i) => ({
          slotNumber: i + 1,
          isOccupied: i < found.filledSlots,
          ign: i < found.filledSlots ? `Player_${i + 1}` : undefined,
        }));
        setSelectedTournament({ ...found, slots });
      }
    }
  }

  async function handleBookSlot() {
    if (!selectedTournament || !selectedSlot) return;
    setBookingLoading(true);
    setMessage(null);
    try {
      const res = await ApiClient.joinSlot(selectedTournament.id, selectedSlot, teamName);
      setMessage({ type: 'success', text: res.message || 'Slot successfully booked!' });
      // Update local view
      openSlotModal(selectedTournament.id);
      fetchTournaments();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to book slot. Please check your wallet balance.' });
    } finally {
      setBookingLoading(false);
    }
  }

  const filteredTournaments = tournaments.filter((t) => {
    if (filterMode === 'ALL') return true;
    return t.gameMode === filterMode;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white">FF RIVALS TOUR Arena</h1>
          <p className="text-sm text-gray-400 mt-1">
            Browse active matches, select your custom room slot, and enter the battlefield.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'BR_SOLO', 'BR_DUO', 'BR_SQUAD', 'CS_4V4'].map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === mode
                  ? 'btn-gold text-black shadow-md'
                  : 'bg-white/[0.05] text-gray-300 hover:bg-white/[0.1] border border-white/10'
              }`}
            >
              {mode.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTournaments.map((tournament) => (
          <div
            key={tournament.id}
            className="glass-panel glass-panel-hover p-6 flex flex-col justify-between border border-white/[0.08] space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-gold/10 text-gold border border-gold/30">
                  {tournament.gameMode.replace('_', ' ')}
                </span>
                <span className="text-xs text-gray-400 font-medium">{tournament.mapType}</span>
              </div>

              <h3 className="text-lg font-bold text-white line-clamp-1">{tournament.title}</h3>

              {/* Financial Box */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-black/40 border border-white/5 text-center">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">Entry</div>
                  <div className="text-sm font-extrabold text-emerald-400">৳{tournament.entryFee}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">Prize</div>
                  <div className="text-sm font-extrabold text-gold">৳{tournament.prizePool}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">Per Kill</div>
                  <div className="text-sm font-extrabold text-neon-cyan">৳{tournament.perKillPrize}</div>
                </div>
              </div>

              {/* Slot Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Slots Booked</span>
                  <span className="font-bold text-white">
                    {tournament.filledSlots} / {tournament.totalSlots}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gold to-neon-cyan"
                    style={{
                      width: `${Math.min(100, (tournament.filledSlots / tournament.totalSlots) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
              <Link
                href={`/room/${tournament.id}`}
                className="text-xs text-gold hover:underline flex items-center gap-1 font-semibold"
              >
                Room Credentials →
              </Link>

              <button
                onClick={() => openSlotModal(tournament.id)}
                className="px-4 py-2 rounded-xl btn-gold text-xs font-bold"
              >
                Select Slot
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Slot Selection Modal */}
      {selectedTournament && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl glass-panel p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto border border-gold/30 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-white">{selectedTournament.title}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Entry Fee: <b className="text-gold">৳{selectedTournament.entryFee}</b> • Map:{' '}
                  {selectedTournament.mapType}
                </p>
              </div>
              <button
                onClick={() => setSelectedTournament(null)}
                className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Feedback Message */}
            {message && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{message.text}</span>
              </div>
            )}

            {/* Slot Grid (1 to 48) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Select a slot number:</span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50" />
                    Available
                  </span>
                  <span className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-white/10 border border-white/20" />
                    Occupied
                  </span>
                  <span className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gold border border-gold" />
                    Selected
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2.5 pt-2">
                {selectedTournament.slots?.map((slot: any) => {
                  const isSelected = selectedSlot === slot.slotNumber;
                  const isTaken = slot.isOccupied;

                  return (
                    <button
                      key={slot.slotNumber}
                      disabled={isTaken}
                      onClick={() => setSelectedSlot(slot.slotNumber)}
                      className={`h-11 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-gold text-black shadow-lg shadow-gold/30 scale-105'
                          : isTaken
                          ? 'bg-white/[0.04] text-gray-600 border border-white/5 cursor-not-allowed'
                          : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 hover:scale-105'
                      }`}
                    >
                      <span>#{slot.slotNumber}</span>
                      {isTaken && <span className="text-[9px] font-normal truncate max-w-[40px]">{slot.ign}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Team Name Input */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-gray-300">Team / Squad Name (Optional)</label>
              <input
                type="text"
                placeholder="Enter your team or clan name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-gold focus:outline-none"
              />
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <div className="text-xs text-gray-400">
                Selected: <b className="text-white">{selectedSlot ? `Slot #${selectedSlot}` : 'None'}</b>
              </div>
              <button
                disabled={!selectedSlot || bookingLoading}
                onClick={handleBookSlot}
                className="px-6 py-3 rounded-xl btn-gold text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bookingLoading ? 'Processing...' : `Confirm & Pay ৳${selectedTournament.entryFee}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
