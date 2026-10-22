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
  Bot,
  Zap,
} from 'lucide-react';
import { useCMS, MatchItem, getEffectiveMatchRules, INITIAL_CATEGORIES } from '@/lib/cms-store';
import { getUpcomingScheduleTime } from '@/components/LiveMatchCountdown';
import ImageUploadInput from '@/components/ImageUploadInput';
import {
  autoDeliverRoomCredentials,
  dispatchDevicePushNotification,
  getScheduledBotMatches,
  addScheduledBotMatch,
  publishScheduledBotMatch,
  publishAllScheduledBotMatches,
  deleteScheduledBotMatch,
  clearAllScheduledBotMatches,
  ScheduledBotMatch,
} from '@/lib/match-scheduler';

export default function AdminTournamentsPage() {
  const { categories, matches, settings, addMatch, updateMatch, deleteMatch, clearAllMatches } = useCMS();

  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRoomMatch, setEditingRoomMatch] = useState<MatchItem | null>(null);
  const [roomId, setRoomId] = useState('');
  const [roomPass, setRoomPass] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Scheduled Bot Matches State
  const [scheduledBotMatches, setScheduledBotMatches] = useState<ScheduledBotMatch[]>([]);
  const [showBotScheduleManagerModal, setShowBotScheduleManagerModal] = useState(false);
  const [botPublishAt, setBotPublishAt] = useState('');

  // Quick Bot Room Dispatcher Form
  const [botCatSlug, setBotCatSlug] = useState('classic-match');
  const [botSelectedMatchId, setBotSelectedMatchId] = useState('');
  const [botRoomId, setBotRoomId] = useState('');
  const [botRoomPass, setBotRoomPass] = useState('');

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
  const getNextHourSchedule = () => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    const h = d.getHours();
    const m = d.getMinutes();
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const padH = h12 < 10 ? `0${h12}` : `${h12}`;
    const padM = m < 10 ? `0${m}` : `${m}`;
    return `Today ${padH}:${padM} ${period}`;
  };
  const [time, setTime] = useState(() => getUpcomingScheduleTime(1));
  const [bannerImage, setBannerImage] = useState(
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=640'
  );
  const [rules, setRules] = useState('');

  const refreshScheduledQueue = () => {
    if (typeof window !== 'undefined') {
      setScheduledBotMatches(getScheduledBotMatches());
    }
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setScheduledBotMatches(getScheduledBotMatches());
      const handleUpdate = () => {
        setScheduledBotMatches(getScheduledBotMatches());
      };
      window.addEventListener('ff_scheduled_matches_updated', handleUpdate);
      window.addEventListener('ff_match_added', handleUpdate);
      return () => {
        window.removeEventListener('ff_scheduled_matches_updated', handleUpdate);
        window.removeEventListener('ff_match_added', handleUpdate);
      };
    }
  }, []);

  // Auto-inherit category banner & rules when create modal opens or category changes
  React.useEffect(() => {
    const cat = categories[categorySlug] || INITIAL_CATEGORIES[categorySlug];
    if (cat) {
      const catImg = cat.bannerImage || cat.avatarImage || INITIAL_CATEGORIES[categorySlug]?.bannerImage || '';
      if (catImg) {
        setBannerImage(catImg);
      }
      const catRule = getEffectiveMatchRules(
        { categorySlug, type: type, totalSlots } as MatchItem,
        categories,
        settings
      );
      if (catRule) {
        setRules(catRule);
      }
    }
  }, [showCreateModal, categorySlug, type, totalSlots, categories, settings]);

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
      showNotification('Please enter at least one winning player IGN', 'error');
      return;
    }

    updateMatch(resultMatch.id, {
      status: 'COMPLETED',
      results: validResults,
    });

    showNotification(`Results published for match "${resultMatch.title}"!`);
    setResultMatch(null);
  };

  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showNotification('Please provide a match title', 'error');
      return;
    }

    const isSingle = categorySlug === 'lone-wolf' || categorySlug === 'clash-squad' || categorySlug === 'cs-only-headshot';
    const finalPerKill = isSingle ? 0 : Number(perKill);
    const finalFirstPrize = isSingle ? Number(prizePool) : Number(firstPrize);
    const finalSecondPrize = isSingle ? 0 : Number(secondPrize);
    const finalThirdPrize = isSingle ? 0 : Number(thirdPrize);
    let finalSlots = Number(totalSlots);
    let finalType = type;
    if (categorySlug === 'lone-wolf') {
      const isDuo = finalSlots === 4 || type === '2 vs 2' || type === '2v2' || type.toLowerCase().includes('duo');
      finalSlots = isDuo ? 4 : 2;
      finalType = isDuo ? '2 vs 2' : '1 vs 1';
    } else if (categorySlug === 'clash-squad' || categorySlug === 'cs-only-headshot') {
      finalSlots = type === '1 vs 1' ? 2 : type === '2 vs 2' ? 4 : 8;
    }

    const cat = categories[categorySlug] || INITIAL_CATEGORIES[categorySlug];
    const finalBanner = (bannerImage && bannerImage !== '/logo.png' && !bannerImage.includes('default.png')) ? bannerImage : (cat?.bannerImage || cat?.avatarImage || '/logo.png');

    addMatch({
      categorySlug,
      title,
      map: mapType,
      type: finalType,
      entryFee: Number(entryFee),
      prizePool: Number(prizePool),
      firstPrize: finalFirstPrize,
      secondPrize: finalSecondPrize,
      thirdPrize: finalThirdPrize,
      perKill: finalPerKill,
      totalSlots: finalSlots,
      time,
      bannerImage: finalBanner,
      rules,
    });

    showNotification(`Match "${title}" created successfully!`);
    setShowCreateModal(false);
    setTitle('');
  };

  const handleSaveMatchForBot = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      showNotification('অনুগ্রহ করে একটি ম্যাচ নাম (Title) লিখুন', 'error');
      return;
    }

    const isSingle = categorySlug === 'lone-wolf' || categorySlug === 'clash-squad' || categorySlug === 'cs-only-headshot';
    const finalPerKill = isSingle ? 0 : Number(perKill);
    const finalFirstPrize = isSingle ? Number(prizePool) : Number(firstPrize);
    const finalSecondPrize = isSingle ? 0 : Number(secondPrize);
    const finalThirdPrize = isSingle ? 0 : Number(thirdPrize);
    let finalSlots = Number(totalSlots);
    if (categorySlug === 'lone-wolf') {
      finalSlots = (type === '2 vs 2' || type === '2v2' || type.toLowerCase() === 'duo' || type.includes('2 vs 2')) ? 4 : 2;
    } else if (categorySlug === 'clash-squad' || categorySlug === 'cs-only-headshot') {
      finalSlots = type === '1 vs 1' ? 2 : type === '2 vs 2' ? 4 : 8;
    }

    const cat = categories[categorySlug];
    const catImg = cat?.bannerImage || cat?.avatarImage || '/logo.png';
    const finalBanner = bannerImage && bannerImage.trim() !== '' && bannerImage !== '/logo.png' ? bannerImage : catImg;

    addScheduledBotMatch({
      categorySlug,
      title: title.trim(),
      map: mapType,
      type,
      version: 'MOBILE',
      entryFee: Number(entryFee),
      prizePool: Number(prizePool),
      firstPrize: finalFirstPrize,
      secondPrize: finalSecondPrize,
      thirdPrize: finalThirdPrize,
      perKill: finalPerKill,
      totalSlots: finalSlots,
      matchPlayTime: time,
      publishAt: botPublishAt.trim() || time,
      rules: rules || 'সব নিয়ম মেনে খেলুন। কোনো হ্যাকিং বা ইললিগ্যাল কার্যকলাপ নিষিদ্ধ।',
      bannerImage: finalBanner,
    });

    refreshScheduledQueue();
    showNotification(`🤖 ম্যাচ "${title}" সফলভাবে বটের কাছে সেভ করা হয়েছে! নির্ধারিত সময়ে বট স্বয়ংক্রিয়ভাবে ক্যাটাগরিতে লাইভ পাবলিশ করে দিবে।`);
    setShowCreateModal(false);
    setTitle('');
  };

  const handleDirectDeliverRoom = (m: MatchItem) => {
    if (!m.roomId) {
      setEditingRoomMatch(m);
      setRoomId('');
      setRoomPass('1234');
      return;
    }

    const currentPass = m.roomPass || '1234';
    updateMatch(m.id, {
      status: 'ROOM_OPEN',
      roomDeliveredAt: new Date().toISOString(),
    });

    autoDeliverRoomCredentials(m.id, m.roomId, currentPass);
    dispatchDevicePushNotification(
      '🎮 কাস্টম রুম আইডি ও পাসওয়ার্ড ডেলিভারি!',
      `ম্যাচ: "${m.title}" | Room ID: ${m.roomId} | Password: ${currentPass}। এখনই নির্দিষ্ট স্লটে বসুন!`
    );

    showNotification(`⚡ ম্যাচ "${m.title}"-এর Room ID (${m.roomId}) সফলভাবে সকল প্লেয়ারকে ডেলিভার করা হয়েছে!`);
  };

  const handleSaveOnlyRoomPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoomMatch) return;
    if (!roomId.trim()) {
      showNotification('রুম আইডি লিখুন', 'error');
      return;
    }
    updateMatch(editingRoomMatch.id, {
      roomId: roomId.trim(),
      roomPass: roomPass.trim() || '1234',
    });
    showNotification(`ম্যাচ "${editingRoomMatch.title}"-এর Room ID সেভ হয়েছে! প্রয়োজন হলে "⚡ Deliver Room ID" বাটনে ক্লিক করে যেকোনো সময় ডেলিভার করতে পারবেন।`);
    setEditingRoomMatch(null);
    setRoomId('');
    setRoomPass('');
  };

  const handleSaveAndDeliverRoomPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoomMatch) return;
    if (!roomId.trim()) {
      showNotification('রুম আইডি লিখুন', 'error');
      return;
    }
    const cleanId = roomId.trim();
    const cleanPass = roomPass.trim() || '1234';
    updateMatch(editingRoomMatch.id, {
      roomId: cleanId,
      roomPass: cleanPass,
      status: 'ROOM_OPEN',
      roomDeliveredAt: new Date().toISOString(),
    });

    autoDeliverRoomCredentials(editingRoomMatch.id, cleanId, cleanPass);
    dispatchDevicePushNotification(
      '🎮 কাস্টম রুম আইডি ও পাসওয়ার্ড ডেলিভারি!',
      `ম্যাচ: "${editingRoomMatch.title}" | Room ID: ${cleanId} | Password: ${cleanPass}। এখনই নির্দিষ্ট স্লটে বসুন!`
    );

    showNotification(`⚡ Room ID (${cleanId}) সেভ এবং সফলভাবে সকল প্লেয়ারকে ডেলিভার করা হয়েছে!`);
    setEditingRoomMatch(null);
    setRoomId('');
    setRoomPass('');
  };

  const handleSaveRoomPass = (e: React.FormEvent) => {
    handleSaveAndDeliverRoomPass(e);
  };

  const handleBotRoomDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    const target = matches.find((m) => m.id === botSelectedMatchId);
    if (!target) {
      showNotification('অনুগ্রহ করে একটি ম্যাচ সিলেক্ট করুন', 'error');
      return;
    }
    if (!botRoomId.trim() || !botRoomPass.trim()) {
      showNotification('রুম আইডি এবং পাসওয়ার্ড উভয়ই লিখুন', 'error');
      return;
    }

    updateMatch(target.id, {
      roomId: botRoomId.trim(),
      roomPass: botRoomPass.trim(),
      status: 'ROOM_OPEN',
    });

    autoDeliverRoomCredentials(target.id, botRoomId.trim(), botRoomPass.trim());
    dispatchDevicePushNotification(
      '🎮 কাস্টম রুম আইডি ও পাসওয়ার্ড ডেলিভারি!',
      `ম্যাচ: "${target.title}" | Room ID: ${botRoomId.trim()} | Password: ${botRoomPass.trim()}। এখনই নির্দিষ্ট স্লটে বসুন!`
    );

    showNotification(
      `ম্যাচ "${target.title}"-এর রুম আইডি ও পাসওয়ার্ড বটের মাধ্যমে পাঠানো হয়েছে এবং প্লেয়ারদের পুশ নোটিফিকেশন ডেলিভারি দেওয়া হয়েছে!`
    );
    setBotRoomId('');
    setBotRoomPass('');
  };

  const handleDelete = (matchId: string, matchTitle: string) => {
    if (confirm(`Are you sure you want to delete match "${matchTitle}"?`)) {
      deleteMatch(matchId);
      showNotification('Match deleted successfully!');
    }
  };

  const handleClearAll = () => {
    if (confirm('⚠️ Are you sure you want to delete ALL matches across all categories?')) {
      clearAllMatches();
      showNotification('All matches cleared! Match pool is now zero.');
    }
  };

  const isLoneWolf = categorySlug === 'lone-wolf';
  const isClashSquad = categorySlug === 'clash-squad' || categorySlug === 'cs-only-headshot';

  const handleEntryFeeChange = (fee: number, currentType: string) => {
    setEntryFee(fee);
    if (categorySlug === 'lone-wolf') {
      const slots = (currentType === '2 vs 2' || currentType === '2v2' || currentType.toLowerCase() === 'duo' || currentType.includes('2 vs 2')) ? 4 : 2;
      const winnerPrize = Math.max(10, Math.round(fee * slots * 0.85));
      setPrizePool(winnerPrize);
      setFirstPrize(winnerPrize);
      setSecondPrize(0);
      setThirdPrize(0);
      setPerKill(0);
      setTotalSlots(slots);
    } else if (categorySlug === 'clash-squad' || categorySlug === 'cs-only-headshot') {
      const slots = currentType === '1 vs 1' ? 2 : currentType === '2 vs 2' ? 4 : 8;
      const winnerPrize = Math.max(10, Math.round(fee * slots * 0.8));
      setPrizePool(winnerPrize);
      setFirstPrize(winnerPrize);
      setSecondPrize(0);
      setThirdPrize(0);
      setPerKill(0);
      setTotalSlots(slots);
    } else if (currentType === '1 vs 1') {
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

  const handleCategorySelect = (slug: string) => {
    setCategorySlug(slug);
    const cat = categories[slug] || INITIAL_CATEGORIES[slug];
    const catImg = cat?.bannerImage || cat?.avatarImage || INITIAL_CATEGORIES[slug]?.bannerImage || '';
    if (catImg) {
      setBannerImage(catImg);
    }
    if (slug === 'lone-wolf') {
      setType('1 vs 1');
      setTotalSlots(2);
      setMapType('Iron Cage');
      setPerKill(0);
      setSecondPrize(0);
      setThirdPrize(0);
      const pool = Math.max(10, Math.round(entryFee * 2 * 0.85));
      setPrizePool(pool);
      setFirstPrize(pool);
    } else if (slug === 'clash-squad' || slug === 'cs-only-headshot') {
      setType('4 vs 4');
      setTotalSlots(8);
      setMapType('Bermuda');
      setPerKill(0);
      setSecondPrize(0);
      setThirdPrize(0);
      const pool = Math.max(20, Math.round(entryFee * 8 * 0.75));
      setPrizePool(pool);
      setFirstPrize(pool);
    } else {
      setType('Squad');
      setTotalSlots(48);
      setMapType('Bermuda');
      handleEntryFeeChange(entryFee, 'Squad');
    }
  };

  const handleTypeSelect = (newType: string) => {
    setType(newType);
    if (categorySlug === 'lone-wolf') {
      const isDuo = newType === '2 vs 2' || newType === '2v2' || newType.toLowerCase() === 'duo' || newType.includes('2 vs 2');
      const slots = isDuo ? 4 : 2;
      setTotalSlots(slots);
      setType(isDuo ? '2 vs 2' : '1 vs 1');
      const pool = Math.max(10, Math.round(entryFee * slots * 0.85));
      setPrizePool(pool);
      setFirstPrize(pool);
      setSecondPrize(0);
      setThirdPrize(0);
      setPerKill(0);
    } else if (categorySlug === 'clash-squad' || categorySlug === 'cs-only-headshot') {
      const slots = newType === '1 vs 1' ? 2 : newType === '2 vs 2' ? 4 : 8;
      setTotalSlots(slots);
      const pool = Math.max(10, Math.round(entryFee * slots * 0.8));
      setPrizePool(pool);
      setFirstPrize(pool);
      setSecondPrize(0);
      setThirdPrize(0);
      setPerKill(0);
    } else {
      if (newType === 'Squad' || newType === 'Solo' || newType === 'Duo') setTotalSlots(48);
      else if (newType === '4 vs 4') setTotalSlots(8);
      else if (newType === '1 vs 1') setTotalSlots(2);
      else if (newType === '2 vs 2') setTotalSlots(4);
      handleEntryFeeChange(entryFee, newType);
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
            Tournament & Match Dispatcher
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Create custom matches by category, configure entry fees, prize pools, and release room credentials.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {matches.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-100 transition-all border border-red-200 dark:border-red-900 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All ({matches.length})
            </button>
          )}

          <button
            onClick={() => {
              refreshScheduledQueue();
              setShowBotScheduleManagerModal(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/30 text-xs font-black flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Bot className="w-4 h-4 text-purple-400 animate-pulse" />
            বটের সেভ ম্যাচ ({scheduledBotMatches.length})
          </button>

          <button
            onClick={() => {
              setTime(getUpcomingScheduleTime(1));
              const cat = categories[categorySlug] || INITIAL_CATEGORIES[categorySlug];
              if (cat?.bannerImage) setBannerImage(cat.bannerImage);
              setShowCreateModal(true);
            }}
            className="px-4 py-2.5 rounded-xl btn-red text-xs font-black flex items-center gap-1.5 shadow-md shadow-red-600/30"
          >
            <Plus className="w-4 h-4" /> Create New Match
          </button>
        </div>
      </div>

      {/* 🤖 Quick Bot Room ID & Password Dispatcher (User Request #5) */}
      <div className="rounded-2xl border-2 border-red-500/30 bg-gradient-to-r from-red-950/20 via-black/40 to-red-950/20 p-5 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/30">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                🤖 Quick Bot Room ID & Password Dispatcher
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  ৫ মিনিট আগে পুশ অ্যালার্ট
                </span>
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                যেকোনো ক্যাটাগরি এবং নির্দিষ্ট ম্যাচ বেছে নিয়ে রুম আইডি ও পাসওয়ার্ড লিখে বাটনে ক্লিক করুন। প্লেয়ারদের ডিভাইসে নোটিফিকেশন পৌঁছে যাবে।
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleBotRoomDispatch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Category Picker */}
          <div>
            <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
              ১. ক্যাটাগরি সিলেক্ট করুন
            </label>
            <select
              value={botCatSlug}
              onChange={(e) => {
                setBotCatSlug(e.target.value);
                setBotSelectedMatchId('');
              }}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black font-bold focus:outline-none focus:border-red-500"
            >
              {categoriesList.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Match Picker */}
          <div>
            <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
              ২. ম্যাচ সিলেক্ট করুন
            </label>
            <select
              value={botSelectedMatchId}
              onChange={(e) => {
                const mid = e.target.value;
                setBotSelectedMatchId(mid);
                const found = matches.find((m) => m.id === mid);
                if (found) {
                  setBotRoomId(found.roomId || '');
                  setBotRoomPass(found.roomPass || '');
                }
              }}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black font-bold focus:outline-none focus:border-red-500"
            >
              <option value="">-- ম্যাচ বেছে নিন --</option>
              {matches
                .filter((m) => m.categorySlug === botCatSlug && m.status !== 'COMPLETED')
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({m.time})
                  </option>
                ))}
            </select>
          </div>

          {/* Room ID */}
          <div>
            <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
              ৩. রুম আইডি (Room ID)
            </label>
            <input
              type="text"
              placeholder="e.g. 849201"
              value={botRoomId}
              onChange={(e) => setBotRoomId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black font-mono font-bold focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Room Password */}
          <div>
            <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
              ৪. পাসওয়ার্ড (Password)
            </label>
            <input
              type="text"
              placeholder="e.g. 12"
              value={botRoomPass}
              onChange={(e) => setBotRoomPass(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black font-mono font-bold focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Dispatch Button */}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={!botSelectedMatchId || !botRoomId || !botRoomPass}
              className="w-full py-2 px-3 rounded-xl btn-red text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-red-600/30 disabled:opacity-40 transition-all active:scale-95"
            >
              <Zap className="w-3.5 h-3.5" /> 🚀 বট দিয়ে পাঠান
            </button>
          </div>
        </form>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        <button
          onClick={() => setFilterCategory('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filterCategory === 'ALL'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'
          }`}
        >
          All Categories ({matches.length})
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
              No Matches Found
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              There are currently no active matches under this category. Click 'Create New Match' above to schedule one.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-black/40 border-b border-gray-200 dark:border-white/10 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Match Title & Category</th>
                <th className="p-4">Type & Map</th>
                <th className="p-4">Fee / Prize Pool</th>
                <th className="p-4">Slots</th>
                <th className="p-4">Room Credentials</th>
                <th className="p-4 text-right">Actions</th>
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
                      <div className="flex flex-col gap-0.5">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-mono font-bold text-[11px] border border-emerald-200 dark:border-emerald-900/40 inline-flex items-center gap-1">
                          ✅ {m.roomId} : {m.roomPass}
                        </span>
                        {m.roomDeliveredAt && (
                          <span className="text-[9px] text-emerald-600 font-bold">ডেলিভার সম্পন্ন</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-[11px]">সেভ করা হয়নি</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {/* ⚡ DIRECT DELIVER ROOM ID BUTTON */}
                      <button
                        onClick={() => handleDirectDeliverRoom(m)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black flex items-center gap-1 transition-all shadow-md active:scale-95 ${
                          m.roomId
                            ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-600/30'
                            : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-amber-500/30'
                        }`}
                        title={m.roomId ? 'Save & Deliver Room ID to all joined players' : 'Set and Deliver Room ID'}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>{m.roomId ? '⚡ Deliver Room ID' : '⚡ সেট ও ডেলিভার'}</span>
                      </button>

                      <button
                        onClick={() => handleOpenResultModal(m)}
                        className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all ${
                          m.status === 'COMPLETED'
                            ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-amber-100 dark:bg-amber-950/40 hover:bg-amber-200 text-amber-700 dark:text-amber-300'
                        }`}
                        title="Publish match winner results"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        {m.status === 'COMPLETED' ? 'Edit Result' : 'Publish Result'}
                      </button>

                      <button
                        onClick={() => {
                          setEditingRoomMatch(m);
                          setRoomId(m.roomId || '');
                          setRoomPass(m.roomPass || '');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 text-gray-800 dark:text-gray-200 font-bold text-[11px] flex items-center gap-1"
                        title="Edit Room ID & Password"
                      >
                        <Key className="w-3.5 h-3.5 text-amber-500" /> Room Pass
                      </button>

                      <button
                        onClick={() => handleDelete(m.id, m.title)}
                        className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-100 transition-colors"
                        title="Delete Match"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* CREATE TOURNAMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-[#14141c] rounded-2xl p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-white/10 shadow-2xl">
            <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-red-600" />
              Create New Custom Match
            </h3>

            <form onSubmit={handleCreateTournament} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Select Category
                </label>
                <select
                  value={categorySlug}
                  onChange={(e) => handleCategorySelect(e.target.value)}
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
                  Match Title
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    isLoneWolf
                      ? 'e.g. Lone Wolf 1v1 Iron Cage Duel #1'
                      : isClashSquad
                      ? 'e.g. Clash Squad 4v4 Bermuda Battle #1'
                      : 'e.g. Bermuda Squad Grand Cup #1'
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-xs font-bold focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Mode (Type)
                  </label>
                  <select
                    value={type}
                    onChange={(e) => handleTypeSelect(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-xs font-bold focus:outline-none focus:border-red-500"
                  >
                    {isLoneWolf ? (
                      <>
                        <option value="1 vs 1">1 vs 1 (Solo)</option>
                        <option value="2 vs 2">2 vs 2 (Duo)</option>
                      </>
                    ) : isClashSquad ? (
                      <>
                        <option value="1 vs 1">1 vs 1</option>
                        <option value="2 vs 2">2 vs 2</option>
                        <option value="4 vs 4">4 vs 4 (Squad)</option>
                      </>
                    ) : (
                      <>
                        <option value="Squad">Squad</option>
                        <option value="Solo">Solo</option>
                        <option value="Duo">Duo</option>
                        <option value="4 vs 4">4 vs 4</option>
                        <option value="1 vs 1">1 vs 1</option>
                        <option value="2 vs 2">2 vs 2</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Map
                  </label>
                  <select
                    value={mapType}
                    onChange={(e) => setMapType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-xs font-bold focus:outline-none focus:border-red-500"
                  >
                    <option value="Iron Cage">Iron Cage</option>
                    <option value="Bermuda">Bermuda</option>
                    <option value="Purgatory">Purgatory</option>
                    <option value="Kalahari">Kalahari</option>
                    <option value="Alpine">Alpine</option>
                  </select>
                </div>
              </div>

              {/* Fee & Prize Grid */}
              <div className={`grid ${isLoneWolf || isClashSquad ? 'grid-cols-2' : 'grid-cols-3'} gap-3`}>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Entry Fee (৳)
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
                    {isLoneWolf
                      ? 'Winning Prize (৳)'
                      : isClashSquad
                      ? 'Winning Team Prize (৳)'
                      : 'Prize Pool (৳)'}
                  </label>
                  <input
                    type="number"
                    value={prizePool}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPrizePool(val);
                      if (isLoneWolf || isClashSquad) {
                        setFirstPrize(val);
                        setSecondPrize(0);
                        setThirdPrize(0);
                        setPerKill(0);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-xs font-bold focus:outline-none focus:border-red-500"
                  />
                </div>

                {!isLoneWolf && !isClashSquad && (
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      Per Kill (৳)
                    </label>
                    <input
                      type="number"
                      value={perKill}
                      onChange={(e) => setPerKill(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-xs font-bold focus:outline-none focus:border-red-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Schedule Time
                    </label>
                    <span className="text-[10px] text-gray-500 font-mono">Live Countdown</span>
                  </div>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="e.g. Today 08:30 PM"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-xs font-bold focus:outline-none focus:border-red-500"
                  />
                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      { label: '+1 Hour', offset: 1 },
                      { label: '+2 Hours', offset: 2 },
                      { label: '+4 Hours', offset: 4 },
                      { label: 'Tonight 08:00 PM', fixed: 'Today 08:00 PM' },
                      { label: 'Tonight 10:00 PM', fixed: 'Today 10:00 PM' },
                      { label: 'Tomorrow 10:00 AM', fixed: 'Tomorrow 10:00 AM' },
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
                    Total Slots
                  </label>
                  <select
                    value={totalSlots}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setTotalSlots(val);
                      if (categorySlug === 'lone-wolf') {
                        const isDuo = val === 4;
                        setType(isDuo ? '2 vs 2' : '1 vs 1');
                        const pool = Math.max(10, Math.round(entryFee * val * 0.85));
                        setPrizePool(pool);
                        setFirstPrize(pool);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-xs font-bold focus:outline-none focus:border-red-500"
                  >
                    {isLoneWolf ? (
                      <>
                        <option value="2">2 Slots (1 vs 1 Solo)</option>
                        <option value="4">4 Slots (2 vs 2 Duo)</option>
                      </>
                    ) : isClashSquad ? (
                      <>
                        <option value="2">2 Slots (1 vs 1)</option>
                        <option value="4">4 Slots (2 vs 2)</option>
                        <option value="8">8 Slots (4 vs 4 Squad)</option>
                      </>
                    ) : (
                      <>
                        <option value="48">48 Slots</option>
                        <option value="24">24 Slots</option>
                        <option value="12">12 Slots</option>
                        <option value="8">8 Slots</option>
                        <option value="4">4 Slots</option>
                        <option value="2">2 Slots</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Bot Schedule Timing Section */}
              <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-purple-400" />
                    বট শিডিউল পাবলিশ সময় (Save for Bot Release)
                  </label>
                  <span className="text-[10px] text-purple-400 font-semibold">ঐচ্ছিক • নির্দিষ্ট সময়ে বট ম্যাচটি লাইভ করবে</span>
                </div>
                <input
                  type="text"
                  value={botPublishAt}
                  onChange={(e) => setBotPublishAt(e.target.value)}
                  placeholder={time ? `যেমন: ${time} অথবা কাস্টম শিডিউল সময়` : 'Today 08:00 PM'}
                  className="w-full px-3 py-2 rounded-xl border border-purple-500/30 bg-black/40 text-xs font-bold text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'ম্যাচ টাইমে', val: time },
                    { label: 'এখনই লাইভ', val: 'NOW' },
                    { label: '+১ ঘণ্টা', offset: 1 },
                    { label: '+২ ঘণ্টা', offset: 2 },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (p.val === 'NOW') {
                          setBotPublishAt(new Date().toISOString());
                        } else if (p.val) {
                          setBotPublishAt(p.val);
                        } else if (p.offset) {
                          const d = new Date(Date.now() + p.offset * 3600000);
                          const h = d.getHours();
                          const m = d.getMinutes();
                          const period = h >= 12 ? 'PM' : 'AM';
                          const h12 = h % 12 === 0 ? 12 : h % 12;
                          const padM = m < 10 ? `0${m}` : `${m}`;
                          const padH = h12 < 10 ? `0${h12}` : `${h12}`;
                          setBotPublishAt(`Today ${padH}:${padM} ${period}`);
                        }
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 hover:bg-purple-500 hover:text-white transition-colors border border-purple-500/30"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <ImageUploadInput
                label="Match Banner Image"
                value={bannerImage}
                onChange={setBannerImage}
                helperText="Select or drop match banner image file (স্বয়ংক্রিয়ভাবে ক্যাটাগরির ব্যানার সেট হবে)"
              />

              {/* Match Rules Field */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Match Rules ({categories[categorySlug]?.name || categorySlug} ক্যাটাগরির রুলস):
                  </label>
                  <span className="text-[10px] text-amber-500 font-bold">
                    ক্যাটাগরির রুল স্বয়ংক্রিয়ভাবে লোড হয়েছে
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  placeholder="ক্যাটাগরির নির্ধারিত নিয়মাবলী..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-xs font-medium focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveMatchForBot}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all"
                >
                  <Bot className="w-4 h-4" />
                  🤖 বটের কাছে সেভ করুন
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl btn-red text-xs font-black flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-all"
                >
                  <Zap className="w-4 h-4" />
                  🚀 সরাসরি লাইভ পাবলিশ
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
              Room ID & Password Manager
            </h3>
            <p className="text-xs text-gray-500">
              {editingRoomMatch.title} — সেভ করে রাখতে পারেন অথবা এখনই প্লেয়ারদের পুশ নোটিফিকেশনসহ ডেলিভার করতে পারেন।
            </p>

            <form onSubmit={handleSaveAndDeliverRoomPass} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Custom Room ID (কাস্টম রুম আইডি)
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
                  Room Password (রুম পাসওয়ার্ড)
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

              <div className="flex flex-wrap items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingRoomMatch(null)}
                  className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-bold hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveOnlyRoomPass}
                  className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-white/15 text-gray-800 dark:text-white text-xs font-bold hover:bg-gray-300 transition-all"
                  title="Save Room ID without dispatching push notification right now"
                >
                  সেভ করে রাখুন (Save Only)
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl btn-red text-xs font-black shadow-md flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>⚡ সেভ ও এখনই ডেলিভার</span>
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
                Publish Match Results & Winner Prizes
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
                Type: {resultMatch.type} • Map: {resultMatch.map} • Total Prize Pool: ৳{resultMatch.prizePool}
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
                        {idx === 0 ? '👑 1st Place (Winner)' : idx === 1 ? '🥈 2nd Place' : '🥉 3rd Place'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="text-[10px] font-bold text-gray-500 block mb-0.5">
                          Player IGN / Team
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
                          Kills
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
                          Prize Money (৳)
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
                💡 Upon saving, match status will transition to &quot;MATCH FINISHED&quot; and display under the <strong>Match Results</strong> tab on category pages.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResultMatch(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl btn-red font-black shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Publish Results
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* BOT SAVED MATCHES MANAGER MODAL */}
      {showBotScheduleManagerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-[#14141c] rounded-2xl p-6 sm:p-8 space-y-4 border border-purple-500/30 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/30">
                  <Bot className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                    🤖 বটের সেভকৃত ম্যাচ ম্যানেজার (Bot Schedule Queue)
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-bold border border-purple-500/30">
                      {scheduledBotMatches.length} টি ম্যাচ সংরক্ষিত
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ম্যাচ সেভ করে রাখলে নির্দিষ্ট শিডিউল সময়ে বট স্বয়ংক্রিয়ভাবে পুশ নোটিফিকেশনসহ সব ক্যাটাগরিতে পাবলিশ করে দেবে।
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBotScheduleManagerModal(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-500 dark:text-gray-300 flex items-center justify-center font-bold text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Quick Actions Bar */}
            {scheduledBotMatches.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-purple-950/20 border border-purple-500/30">
                <div className="text-xs text-purple-300 font-semibold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>বট ব্যাকগ্রাউন্ডে সক্রিয় রয়েছে — শিডিউল পূর্ণ হলেই অটো পাবলিশ হবে</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('বটের কাছে সংরক্ষিত সকল ম্যাচ কি মুছে ফেলতে চান?')) {
                        clearAllScheduledBotMatches();
                        refreshScheduledQueue();
                        showNotification('বটের সকল ম্যাচ মুছে ফেলা হয়েছে (বট একদম ফ্রেশ)!');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 border border-red-500/30 transition-all flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    সব ক্লিয়ার
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const count = publishAllScheduledBotMatches();
                      refreshScheduledQueue();
                      showNotification(`⚡ সফলভাবে ${count}টি ম্যাচ সব ক্যাটাগরিতে একযোগে লাইভ পাবলিশ করা হয়েছে!`);
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/30 transition-all flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    সবগুলো একসাথে পাবলিশ করুন
                  </button>
                </div>
              </div>
            )}

            {/* Scheduled Matches List */}
            {scheduledBotMatches.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-gray-300 dark:border-white/10 text-gray-400 space-y-3">
                <Bot className="w-12 h-12 mx-auto text-purple-400 opacity-60" />
                <div>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                    বটের কাছে কোনো সেভ করা ম্যাচ নেই (বট একদম ফ্রেশ!)
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    ম্যাচ তৈরির সময়ে &quot;🤖 বটের কাছে সেভ করুন&quot; বাটনে ক্লিক করলে ম্যাচটি এখানে সেভ থাকবে এবং নির্ধারিত সময়ে বট সব ক্যাটাগরিতে পোস্ট করে দেবে।
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowBotScheduleManagerModal(false);
                    setShowCreateModal(true);
                  }}
                  className="px-4 py-2 rounded-xl btn-red text-xs font-black inline-flex items-center gap-1.5 shadow-md shadow-red-600/30"
                >
                  <Plus className="w-4 h-4" /> নতুন ম্যাচ তৈরি ও সেভ করুন
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledBotMatches.map((item) => {
                  const cat = categories[item.categorySlug];
                  const displayBanner = item.bannerImage || cat?.bannerImage || cat?.avatarImage || '/logo.png';
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-purple-500/40 transition-all"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img
                          src={displayBanner}
                          alt={item.title}
                          className="w-16 h-12 rounded-lg object-cover bg-black/40 border border-white/10 flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                              {cat?.name || item.categorySlug}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-white/10 text-gray-300">
                              {item.type}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400">
                              ফি: ৳{item.entryFee} • প্রাইজ: ৳{item.prizePool}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-gray-900 dark:text-white truncate">
                            {item.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-purple-400" />
                              খেলার সময়: <strong className="text-gray-700 dark:text-gray-300">{item.matchPlayTime}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <Bot className="w-3 h-3 text-indigo-400" />
                              বট শিডিউল: <strong className="text-purple-400">{item.publishAt || item.matchPlayTime}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            deleteScheduledBotMatch(item.id);
                            refreshScheduledQueue();
                            showNotification(`ম্যাচ "${item.title}" বটের তালিকা থেকে মুছে ফেলা হয়েছে।`);
                          }}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 border border-red-500/20 transition-all"
                          title="Delete from bot queue"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const ok = publishScheduledBotMatch(item.id);
                            if (ok) {
                              refreshScheduledQueue();
                              showNotification(`🚀 ম্যাচ "${item.title}" অবিলম্বে ${cat?.name || item.categorySlug} ক্যাটাগরিতে লাইভ পাবলিশ করা হয়েছে!`);
                            }
                          }}
                          className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          এখনই লাইভ
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowBotScheduleManagerModal(false)}
                className="px-5 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 transition-all"
              >
                বন্ধ করুন (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
