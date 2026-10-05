'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Plus,
  Key,
  Check,
  AlertCircle,
  Trash2,
  Filter,
  Users,
  Clock,
  ArrowLeft,
  Award,
} from 'lucide-react';
import { useCMS, MatchItem } from '@/lib/cms-store';
import ImageUploadInput from '@/components/ImageUploadInput';

export default function AdminTournamentsPage() {
  const { categories, matches, addMatch, updateMatch, deleteMatch, clearAllMatches } = useCMS();

  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRoomMatch, setEditingRoomMatch] = useState<MatchItem | null>(null);
  const [roomId, setRoomId] = useState('');
  const [roomPass, setRoomPass] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Result publishing modal state
  const [resultMatch, setResultMatch] = useState<MatchItem | null>(null);
  const [resultEntries, setResultEntries] = useState([
    { rank: 1, ign: '', kills: 0, prize: 0 },
    { rank: 2, ign: '', kills: 0, prize: 0 },
    { rank: 3, ign: '', kills: 0, prize: 0 },
  ]);

  // Form states
  const [categorySlug, setCategorySlug] = useState('classic-match');
  const [title, setTitle] = useState('');
  const [mapType, setMapType] = useState('Bermuda');
  const [type, setType] = useState('Squad');
  const [entryFee, setEntryFee] = useState(20);
  const [prizePool, setPrizePool] = useState(240);
  const [firstPrize, setFirstPrize] = useState(140);
  const [secondPrize, setSecondPrize] = useState(70);
  const [thirdPrize, setThirdPrize] = useState(30);
  const [perKill, setPerKill] = useState(3);
  const [totalSlots, setTotalSlots] = useState(48);
  const [time, setTime] = useState('Today 08:30 PM');
  const [bannerImage, setBannerImage] = useState(
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=640'
  );
  const [rules, setRules] = useState('');

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenResultModal = (m: MatchItem) => {
    setResultMatch(m);
    if (m.results && m.results.length > 0) {
      setResultEntries(m.results);
    } else {
      setResultEntries([
        { rank: 1, ign: '', kills: 0, prize: m.firstPrize || Math.round(m.prizePool * 0.6) },
        { rank: 2, ign: '', kills: 0, prize: m.secondPrize || Math.round(m.prizePool * 0.25) },
        { rank: 3, ign: '', kills: 0, prize: m.thirdPrize || Math.round(m.prizePool * 0.15) },
      ]);
    }
  };

  const handleSaveMatchResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultMatch) return;
    const validResults = resultEntries.filter((r) => r.ign.trim().length > 0);
    if (validResults.length === 0) {
      showNotification('অনুগ্রহ করে অন্তত একজন বিজয়ীর নাম (IGN) দিন', 'error');
      return;
    }

    updateMatch(resultMatch.id, {
      status: 'COMPLETED',
      results: validResults,
    });

    showNotification(`"${resultMatch.title}" ম্যাচের রেজাল্ট সফলভাবে প্রকাশ করা হয়েছে!`);
    setResultMatch(null);
  };

  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showNotification('অনুগ্রহ করে ম্যাচের একটি নাম দিন', 'error');
      return;
    }

    addMatch({
      categorySlug,
      title,
      map: mapType,
      type,
      entryFee: Number(entryFee),
      prizePool: Number(prizePool),
      firstPrize: Number(firstPrize),
      secondPrize: Number(secondPrize),
      thirdPrize: Number(thirdPrize),
      perKill: Number(perKill),
      totalSlots: Number(totalSlots),
      time,
      bannerImage,
      rules,
    });

    showNotification(`ম্যাচ "${title}" সফলভাবে তৈরি করা হয়েছে!`);
    setShowCreateModal(false);
    setTitle('');
  };

  const handleSaveRoomPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoomMatch) return;

    updateMatch(editingRoomMatch.id, {
      roomId,
      roomPass,
      status: 'ROOM_OPEN',
    });

    showNotification('রুম আইডি ও পাসওয়ার্ড সফলভাবে পাবলিশ করা হয়েছে!');
    setEditingRoomMatch(null);
    setRoomId('');
    setRoomPass('');
  };

  const handleDelete = (matchId: string, matchTitle: string) => {
    if (confirm(`আপনি কি "${matchTitle}" ম্যাচটি ডিলিট করতে চান?`)) {
      deleteMatch(matchId);
      showNotification('ম্যাচটি সফলভাবে ডিলিট করা হয়েছে!');
    }
  };

  const handleClearAll = () => {
    if (confirm('⚠️ আপনি কি নিশ্চিত যে সমস্ত ক্যাটাগরির সব ম্যাচ ডিলিট করে শূন্য করতে চান?')) {
      clearAllMatches();
      showNotification('সব ম্যাচ মুছে ফেলা হয়েছে! বর্তমানে কোনো ম্যাচ নেই।');
    }
  };

  const handleEntryFeeChange = (fee: number, currentType: string) => {
    setEntryFee(fee);
    if (currentType === '1 vs 1') {
      const winnerPrize = Math.max(10, Math.round(fee * 2 * 0.85));
      setPrizePool(winnerPrize);
      setFirstPrize(winnerPrize);
      setSecondPrize(0);
      setThirdPrize(0);
      setPerKill(0);
    } else if (currentType === '4 vs 4') {
      const winnerPrize = Math.max(20, Math.round(fee * 8 * 0.75));
      setPrizePool(winnerPrize);
      setFirstPrize(winnerPrize);
      setSecondPrize(0);
      setThirdPrize(0);
      setPerKill(0);
    } else {
      // Solo / Duo / Squad (Battle Royale)
      const totalCollected = fee * 48;
      const pool = Math.max(20, Math.round(totalCollected * 0.55));
      const first = Math.round(pool * 0.5);
      const second = Math.round(pool * 0.3);
      const third = Math.max(0, pool - first - second);
      setPrizePool(first + second + third);
      setFirstPrize(first);
      setSecondPrize(second);
      setThirdPrize(third);
      setPerKill(Math.max(1, Math.round(fee / 10)));
    }
  };

  const categoriesList = Object.values(categories);
  const filteredMatches =
    filterCategory === 'ALL'
      ? matches
      : matches.filter((m) => m.categorySlug === filterCategory);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-white/10">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-red-600" />
            টুর্নামেন্ট ও ম্যাচ ম্যানেজমেন্ট (Tournament Dispatcher)
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            ক্যাটাগরি অনুযায়ী কাস্টম ম্যাচ তৈরি করুন, এন্ট্রি ফি ও প্রাইজ নির্ধারণ করুন এবং রুম আইডি প্রকাশ করুন।
          </p>
        </div>

        <div className="flex items-center gap-2">
          {matches.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-100 transition-all border border-red-200 dark:border-red-900 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> সব ক্লিয়ার করুন ({matches.length})
            </button>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl btn-red text-xs font-black flex items-center gap-1.5 shadow-md shadow-red-600/30"
          >
            <Plus className="w-4 h-4" /> নতুন ম্যাচ তৈরি করুন
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> ফিল্টার:
        </span>
        <button
          onClick={() => setFilterCategory('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filterCategory === 'ALL'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'
          }`}
        >
          সব ক্যাটাগরি ({matches.length})
        </button>
        {categoriesList.map((cat) => {
          const count = matches.filter((m) => m.categorySlug === cat.slug).length;
          return (
            <button
              key={cat.slug}
              onClick={() => setFilterCategory(cat.slug)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                filterCategory === cat.slug
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'
              }`}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Matches Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] overflow-hidden shadow-sm">
        {filteredMatches.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-3">
            <Trophy className="w-12 h-12 mx-auto text-gray-400" />
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
              কোনো ম্যাচ পাওয়া যায়নি
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              এই ফিল্টারে বর্তমানে কোনো সক্রিয় ম্যাচ নেই। আপনি নতুন ম্যাচ যোগ করতে উপরের 'নতুন ম্যাচ তৈরি করুন' বাটনে ক্লিক করতে পারেন।
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-black/40 border-b border-gray-200 dark:border-white/10 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">ম্যাচ টাইটেল ও ক্যাটাগরি</th>
                <th className="p-4">মোড ও ম্যাপ</th>
                <th className="p-4">ফি / প্রাইজপুল</th>
                <th className="p-4">স্লট সংখ্যা</th>
                <th className="p-4">রুম পাসওয়ার্ড</th>
                <th className="p-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-700 dark:text-gray-300">
              {filteredMatches.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {m.bannerImage && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                          <img src={m.bannerImage} alt={m.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <span className="font-black text-gray-900 dark:text-white block text-sm">
                          {m.title}
                        </span>
                        <span className="text-[10px] text-red-600 font-bold uppercase">
                          {categories[m.categorySlug]?.name || m.categorySlug}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-600 font-bold text-[10px]">
                      {m.type}
                    </span>{' '}
                    <span className="text-gray-500">• {m.map}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-red-600 font-bold">৳{m.entryFee}</span> /{' '}
                    <span className="text-emerald-600 font-bold">৳{m.prizePool}</span>
                  </td>
                  <td className="p-4 font-mono font-bold">
                    {m.filledSlots} / {m.totalSlots}
                  </td>
                  <td className="p-4">
                    {m.roomId ? (
                      <span className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-mono font-bold text-[11px] border border-emerald-200 dark:border-emerald-900/40">
                        {m.roomId} : {m.roomPass}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-[11px]">পাবলিশ করা হয়নি</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenResultModal(m)}
                        className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all ${
                          m.status === 'COMPLETED'
                            ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-amber-100 dark:bg-amber-950/40 hover:bg-amber-200 text-amber-700 dark:text-amber-300'
                        }`}
                        title="ম্যাচ শেষে রেজাল্ট ও উইনার প্রকাশ করুন"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        {m.status === 'COMPLETED' ? 'রেজাল্ট এডিট' : 'রেজাল্ট দিন'}
                      </button>

                      <button
                        onClick={() => {
                          setEditingRoomMatch(m);
                          setRoomId(m.roomId || '');
                          setRoomPass(m.roomPass || '');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 text-gray-800 dark:text-gray-200 font-bold text-[11px] flex items-center gap-1"
                      >
                        <Key className="w-3.5 h-3.5 text-amber-500" /> রুম পাস
                      </button>

                      <button
                        onClick={() => handleDelete(m.id, m.title)}
                        className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-100 transition-colors"
                        title="ম্যাচ ডিলিট করুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE TOURNAMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-[#14141c] rounded-2xl p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-white/10 shadow-2xl">
            <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-red-600" />
              নতুন কাস্টম ম্যাচ তৈরি করুন
            </h3>

            <form onSubmit={handleCreateTournament} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  ক্যাটাগরি নির্বাচন
                </label>
                <select
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-xs font-bold focus:outline-none focus:border-red-500"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.name} ({cat.section})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  ম্যাচ টাইটেল
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bermuda Squad Grand Cup #1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-xs font-bold focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    মোড (Type)
                  </label>
                  <select
                    value={type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setType(newType);
                      if (newType === 'Squad' || newType === 'Solo' || newType === 'Duo') setTotalSlots(48);
                      else if (newType === '4 vs 4') setTotalSlots(8);
                      else if (newType === '1 vs 1') setTotalSlots(2);
                      handleEntryFeeChange(entryFee, newType);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-xs font-bold focus:outline-none focus:border-red-500"
                  >
                    <option value="Squad">Squad</option>
                    <option value="Solo">Solo</option>
                    <option value="Duo">Duo</option>
                    <option value="4 vs 4">4 vs 4</option>
                    <option value="1 vs 1">1 vs 1</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    ম্যাপ (Map)
                  </label>
                  <select
                    value={mapType}
                    onChange={(e) => setMapType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-xs font-bold focus:outline-none focus:border-red-500"
                  >
                    <option value="Bermuda">Bermuda</option>
                    <option value="Purgatory">Purgatory</option>
                    <option value="Kalahari">Kalahari</option>
                    <option value="Alpine">Alpine</option>
                    <option value="Iron Cage">Iron Cage</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    এন্ট্রি ফি (৳)
                  </label>
                  <input
                    type="number"
                    value={entryFee}
                    onChange={(e) => handleEntryFeeChange(Number(e.target.value), type)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-xs font-bold focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    প্রাইজপুল (৳)
                  </label>
                  <input
                    type="number"
                    value={prizePool}
                    onChange={(e) => setPrizePool(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-xs font-bold focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    পার কিল (৳)
                  </label>
                  <input
                    type="number"
                    value={perKill}
                    onChange={(e) => setPerKill(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-xs font-bold focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      ম্যাচ সময়সূচী (Schedule Time)
                    </label>
                    <span className="text-[10px] text-gray-500 font-mono">লাইভ কাউন্টডাউন</span>
                  </div>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="e.g. Today 08:30 PM বা আজ রাত ০৮:০০ PM"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-xs font-bold focus:outline-none focus:border-red-500"
                  />
                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      { label: '+১ ঘণ্টা', offset: 1 },
                      { label: '+২ ঘণ্টা', offset: 2 },
                      { label: '+৪ ঘণ্টা', offset: 4 },
                      { label: 'আজ রাত ৮:০০ PM', fixed: 'আজ রাত ০৮:০০ PM' },
                      { label: 'আজ রাত ১০:০০ PM', fixed: 'আজ রাত ১০:০০ PM' },
                      { label: 'আগামীকাল সকাল ১০:০০ AM', fixed: 'আগামীকাল ১০:০০ AM' },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (preset.fixed) {
                            setTime(preset.fixed);
                          } else if (preset.offset) {
                            const d = new Date(Date.now() + preset.offset * 3600000);
                            const h = d.getHours();
                            const m = d.getMinutes();
                            const period = h >= 12 ? 'PM' : 'AM';
                            const h12 = h % 12 === 0 ? 12 : h % 12;
                            const padM = m < 10 ? `0${m}` : `${m}`;
                            const padH = h12 < 10 ? `0${h12}` : `${h12}`;
                            setTime(`Today ${padH}:${padM} ${period}`);
                          }
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-white/10 hover:bg-red-500 hover:text-white transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    মোট স্লট
                  </label>
                  <select
                    value={totalSlots}
                    onChange={(e) => setTotalSlots(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-xs font-bold focus:outline-none focus:border-red-500"
                  >
                    <option value="48">48 Slots</option>
                    <option value="12">12 Slots</option>
                    <option value="8">8 Slots</option>
                    <option value="2">2 Slots</option>
                  </select>
                </div>
              </div>

              <ImageUploadInput
                label="ম্যাচ ব্যানার ফটো (Match Banner Image)"
                value={bannerImage}
                onChange={setBannerImage}
                helperText="ম্যাচের ব্যানার ফটো ডিভাইস থেকে সিলেক্ট বা ড্রপ করুন"
              />

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-bold hover:bg-gray-200"
                >
                  বাতিল
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl btn-red text-xs font-black shadow-md">
                  ম্যাচ তৈরি করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROOM PASS INJECT MODAL */}
      {editingRoomMatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#14141c] rounded-2xl p-6 space-y-4 border border-gray-200 dark:border-white/10 shadow-2xl">
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-red-600" />
              রুম ক্রেডেনশিয়াল প্রকাশ করুন
            </h3>
            <p className="text-xs text-gray-500">{editingRoomMatch.title}</p>

            <form onSubmit={handleSaveRoomPass} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Custom Room ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 7892182"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-xs font-mono font-bold focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Room Password
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1234"
                  value={roomPass}
                  onChange={(e) => setRoomPass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-xs font-mono font-bold focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingRoomMatch(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-bold hover:bg-gray-200"
                >
                  বাতিল
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl btn-red text-xs font-black shadow-md">
                  পাবলিশ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESULT PUBLISHING MODAL */}
      {resultMatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#14141c] rounded-2xl p-6 sm:p-8 space-y-4 border border-gray-200 dark:border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-white/10">
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                ম্যাচ রেজাল্ট ও উইনার তালিকা প্রকাশ
              </h3>
              <button
                onClick={() => setResultMatch(null)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-xs">
              <span className="font-black text-gray-900 dark:text-white block">{resultMatch.title}</span>
              <span className="text-gray-500 font-semibold">
                মোড: {resultMatch.type} • ম্যাপ: {resultMatch.map} • মোট প্রাইজপুল: ৳{resultMatch.prizePool}
              </span>
            </div>

            <form onSubmit={handleSaveMatchResult} className="space-y-4 text-xs">
              <div className="space-y-3">
                {resultEntries.map((entry, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] space-y-2"
                  >
                    <div className="flex items-center justify-between font-black">
                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        {idx === 0 ? '👑 ১ম স্থান (Winner)' : idx === 1 ? '🥈 ২য় স্থান (2nd)' : '🥉 ৩য় স্থান (3rd)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="text-[10px] font-bold text-gray-500 block mb-0.5">
                          প্লেয়ার IGN / টিম
                        </label>
                        <input
                          type="text"
                          required={idx === 0}
                          placeholder="Player IGN"
                          value={entry.ign}
                          onChange={(e) => {
                            const updated = [...resultEntries];
                            updated[idx].ign = e.target.value;
                            setResultEntries(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 font-bold focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-500 block mb-0.5">
                          কিল সংখ্যা
                        </label>
                        <input
                          type="number"
                          value={entry.kills}
                          onChange={(e) => {
                            const updated = [...resultEntries];
                            updated[idx].kills = Number(e.target.value);
                            setResultEntries(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 font-bold focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-500 block mb-0.5">
                          প্রাইজ মানি (৳)
                        </label>
                        <input
                          type="number"
                          value={entry.prize}
                          onChange={(e) => {
                            const updated = [...resultEntries];
                            updated[idx].prize = Number(e.target.value);
                            setResultEntries(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 font-bold focus:outline-none focus:border-red-500 text-emerald-600"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-gray-500">
                💡 সেভ করার সাথে সাথে ম্যাচটি &quot;MATCH FINISHED&quot; স্ট্যাটাসে চলে যাবে এবং ইউজারদের জন্য ক্যাটাগরি পেজের <strong>ম্যাচ ফলাফল (Match Results)</strong> ট্যাবে প্রদর্শিত হবে।
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResultMatch(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl btn-red font-black shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> রেজাল্ট প্রকাশ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
