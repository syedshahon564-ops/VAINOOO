'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Smartphone,
  Trophy,
  Wallet,
  User,
  Bell,
  ArrowLeft,
  ChevronRight,
  Shield,
  Key,
  Copy,
  CheckCircle,
  Clock,
  Users,
  Sun,
  Moon,
  Zap,
  Award,
  Medal,
  Crosshair,
  TrendingUp,
  Eye,
  Check,
  X,
  Volume2,
  Globe,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Camera,
  ArrowDownRight,
  ArrowUpRight,
  LogOut,
  LogIn,
  Gamepad2,
  Coins,
  Lock,
  Phone,
} from 'lucide-react';
import { useCMS, MatchItem, TopPlayerItem } from '@/lib/cms-store';
import RoomDetailsModal from '@/components/RoomDetailsModal';
import SlotBookingModal from '@/components/SlotBookingModal';
import PlayerDetailsModal, { PlayerDetailsData } from '@/components/PlayerDetailsModal';
import TotalPrizeDetailsModal from '@/components/TotalPrizeDetailsModal';
import MatchDetailsPage from '@/components/MatchDetailsPage';
import ImageUploadInput from '@/components/ImageUploadInput';
import LiveMatchCountdown, { formatMatchSchedule } from '@/components/LiveMatchCountdown';
import DepositWithdrawModal from '@/components/DepositWithdrawModal';
import { useLanguage } from '@/components/LanguageProvider';
import {
  getCurrentUser,
  loginUser,
  registerUser,
  logoutUser,
  addBalance,
  deductBalance,
  getTransactions,
  UserAccount,
} from '@/lib/user-store';
import {
  getNotifications,
  markNotificationsAsRead,
  AppNotification,
} from '@/lib/match-scheduler';

export default function MobileAppViewPage(props: any) {
  const {
    standalone = false,
    onSwitchToWeb,
  }: {
    standalone?: boolean;
    onSwitchToWeb?: () => void;
  } = props || {};
  const { categories, matches, settings, topPlayers, updateMatch } = useCMS();
  const { language: globalLang, setLanguage: setGlobalLang } = useLanguage();

  const handleSwitchToWeb = () => {
    if (typeof onSwitchToWeb === 'function') {
      onSwitchToWeb();
    } else {
      try {
        sessionStorage.setItem('ff_manual_view_mode', 'web');
        document.cookie = 'ff_view_mode=web; path=/; max-age=86400';
      } catch (e) {}
      window.location.href = '/?view=web';
    }
  };

  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [forceFullscreen, setForceFullscreen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileUA =
        typeof navigator !== 'undefined' &&
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmall = typeof window !== 'undefined' && window.innerWidth < 768;
      setIsMobileScreen(Boolean(standalone || isSmall || isMobileUA));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [standalone]);

  const isMobileView = standalone || isMobileScreen || forceFullscreen;

  // Active Tab & Screen Navigation
  const [activeTab, setActiveTab] = useState<'home' | 'my-matches' | 'top-players' | 'wallet' | 'profile'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryTab, setCategoryTab] = useState<'PLAY' | 'RESULT'>('PLAY');

  // Phone Theme & Language (English & Bangla system on the phone side)
  const [phoneTheme, setPhoneTheme] = useState<'dark' | 'light'>('dark');
  const [phoneLang, setPhoneLang] = useState<'bn' | 'en'>(globalLang || 'bn');

  // Copying & Feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [joinedSuccess, setJoinedSuccess] = useState(false);
  const [userBalance, setUserBalance] = useState(0.0);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authIgn, setAuthIgn] = useState('');
  const [authUid, setAuthUid] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Finance Modal (Deposit & Withdraw)
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [financeModalTab, setFinanceModalTab] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');

  // Modals & Screens
  const [roomDetailsMatch, setRoomDetailsMatch] = useState<MatchItem | null>(null);
  const [bookingModalMatch, setBookingModalMatch] = useState<MatchItem | null>(null);
  const [totalPrizeMatch, setTotalPrizeMatch] = useState<MatchItem | null>(null);
  const [expandedRoomRulesMatchId, setExpandedRoomRulesMatchId] = useState<string | null>(null);
  const [matchDetailsScreen, setMatchDetailsScreen] = useState<MatchItem | null>(null);
  const [selectedPlayerForDetails, setSelectedPlayerForDetails] = useState<PlayerDetailsData | null>(null);
  const [matchScreenshots, setMatchScreenshots] = useState<{ [matchId: string]: string }>({});

  // Notifications
  const [notificationsList, setNotificationsList] = useState<AppNotification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Translation helper for the phone side
  const tPhone = (bn: string, en: string) => (phoneLang === 'en' ? en : bn);

  const togglePhoneLang = () => {
    const next = phoneLang === 'bn' ? 'en' : 'bn';
    setPhoneLang(next);
    setGlobalLang(next);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      if (authMode === 'REGISTER') {
        if (!authPhone || !authPassword || !authIgn) {
          throw new Error('অনুগ্রহ করে মোবাইল নম্বর, পাসওয়ার্ড ও IGN পূরণ করুন');
        }
        const res = registerUser({
          phone: authPhone.trim(),
          ign: authIgn.trim().toUpperCase(),
          uid: authUid.trim() || String(Math.floor(100000000 + Math.random() * 900000000)),
          password: authPassword,
        });
        if (!res.success) throw new Error(res.error || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে');
        setAuthSuccess(`রেজিস্ট্রেশন সফল! স্বাগতম ${res.user?.ign}`);
        setTimeout(() => {
          setShowAuthModal(false);
          setAuthSuccess(null);
        }, 800);
      } else {
        if (!authPhone || !authPassword) {
          throw new Error('ফোন নম্বর এবং পাসওয়ার্ড লিখুন');
        }
        const res = loginUser(authPhone.trim(), authPassword);
        if (!res.success) throw new Error(res.error || 'লগইন ব্যর্থ হয়েছে।');
        setAuthSuccess(`লগইন সফল! স্বাগতম ${res.user?.ign}`);
        setTimeout(() => {
          setShowAuthModal(false);
          setAuthSuccess(null);
        }, 800);
      }
    } catch (err: any) {
      setAuthError(err.message || 'ত্রুটি ঘটেছে');
    } finally {
      setAuthLoading(false);
    }
  };

  const fillAuthDemo = (phone: string, pass: string) => {
    setAuthMode('LOGIN');
    setAuthPhone(phone);
    setAuthPassword(pass);
    setAuthError(null);
  };

  // Booked matches list (starts empty with 0 fake participants)
  const [bookedMatchesList, setBookedMatchesList] = useState<
    Array<{
      id: string;
      title: string;
      slot: number;
      team?: number;
      ign: string;
      uid: string;
      time: string;
      roomId: string;
      roomPass: string;
    }>
  >([]);

  // Deposit simulation
  const [depositMethod, setDepositMethod] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [depositAmount, setDepositAmount] = useState('100');
  const [depositSuccess, setDepositSuccess] = useState(false);

  useEffect(() => {
    const stored = getNotifications();
    if (stored.length > 0) {
      setNotificationsList(stored);
    } else {
      setNotificationsList([
        {
          id: 'notif-1',
          title: phoneLang === 'en' ? '🤖 Auto Scheduler Active' : '🤖 অটো সিডিউলার বট সক্রিয়!',
          message: phoneLang === 'en'
            ? 'Fresh batches across all 6 categories are being generated automatically every 4 hours.'
            : 'প্রতি ৪ ঘণ্টা পর পর নতুন ৬টি ক্যাটাগরির টুর্নামেন্ট যুক্ত হচ্ছে।',
          timestamp: phoneLang === 'en' ? 'Just Now' : 'এখনই',
          read: false,
        },
        {
          id: 'notif-2',
          title: phoneLang === 'en' ? '🏆 Top Players Leaderboard Live' : '🏆 নতুন টপ প্লেয়ার রেজাল্ট আপডেট',
          message: phoneLang === 'en'
            ? 'Top killer OP_NINJA_99 won Booyah 1st prize!'
            : 'গত টুর্নামেন্টের চ্যাম্পিয়ন OP_NINJA_99 উইনিং প্রাইজ পেয়েছেন!',
          timestamp: phoneLang === 'en' ? '10m ago' : '১০ মি. আগে',
          read: true,
        },
      ]);
    }

    const onNotif = () => {
      setNotificationsList(getNotifications());
    };
    window.addEventListener('ff_notification_received', onNotif);
    window.addEventListener('ff_notifications_read', onNotif);

    const onUserUpdate = () => {
      const cur = getCurrentUser();
      setCurrentUser(cur);
      if (cur) {
        setUserBalance(cur.walletBalance || 0);
      } else {
        setUserBalance(0);
      }
    };
    onUserUpdate();
    window.addEventListener('ff_users_updated', onUserUpdate);
    window.addEventListener('storage', onUserUpdate);

    return () => {
      window.removeEventListener('ff_notification_received', onNotif);
      window.removeEventListener('ff_notifications_read', onNotif);
      window.removeEventListener('ff_users_updated', onUserUpdate);
      window.removeEventListener('storage', onUserUpdate);
    };
  }, [phoneLang]);

  const unreadCount = notificationsList.filter((n) => !n.read).length;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDeposit = () => {
    const amt = parseFloat(depositAmount);
    if (!amt || amt < 20) return;
    const current = getCurrentUser();
    if (current) {
      addBalance(current.id, amt, `মোবাইল অ্যাপ ডিপোজিট (${depositMethod.toUpperCase()})`);
    } else {
      setUserBalance((prev) => prev + amt);
    }
    setDepositSuccess(true);
    setTimeout(() => setDepositSuccess(false), 2500);
  };

  const handleBookingSuccess = (slotInfo: {
    slotNumber: number;
    teamNumber?: number;
    slotInTeam?: number;
    ign: string;
    uid: string;
    players?: Array<{ ign: string; uid: string; slotInTeam: number }>;
  }) => {
    if (bookingModalMatch) {
      const current = getCurrentUser();
      if (current) {
        deductBalance(
          current.id,
          bookingModalMatch.entryFee,
          `ম্যাচ স্লট বুকিং: ${bookingModalMatch.title}`
        );
      }
      setUserBalance((prev) => Math.max(0, prev - bookingModalMatch.entryFee));

      const registeredCount =
        slotInfo.players && slotInfo.players.length > 0 ? slotInfo.players.length : 1;

      updateMatch(bookingModalMatch.id, {
        filledSlots: Math.min(
          bookingModalMatch.totalSlots,
          (bookingModalMatch.filledSlots || 0) + registeredCount
        ),
      });

      const newEntries =
        slotInfo.players && slotInfo.players.length > 0
          ? slotInfo.players.map((p, i) => ({
              id: 'bm-' + Date.now() + '-' + i,
              title: bookingModalMatch.title,
              slot: slotInfo.slotNumber,
              team: slotInfo.teamNumber,
              ign: p.ign,
              uid: p.uid,
              time: bookingModalMatch.time,
              roomId: bookingModalMatch.roomId || '9948210',
              roomPass: bookingModalMatch.roomPass || '1234',
            }))
          : [
              {
                id: 'bm-' + Date.now(),
                title: bookingModalMatch.title,
                slot: slotInfo.slotNumber,
                team: slotInfo.teamNumber,
                ign: slotInfo.ign,
                uid: slotInfo.uid,
                time: bookingModalMatch.time,
                roomId: bookingModalMatch.roomId || '9948210',
                roomPass: bookingModalMatch.roomPass || '1234',
              },
            ];

      setBookedMatchesList((prev) => [...newEntries, ...prev]);

      setJoinedSuccess(true);
      setTimeout(() => {
        setJoinedSuccess(false);
        setActiveTab('my-matches');
      }, 1500);
    }
    setBookingModalMatch(null);
  };

  const categoriesList = React.useMemo(() => Object.values(categories), [categories]);
  const currentCategoryData = selectedCategory ? categories[selectedCategory] : null;
  const currentCategoryMatches = React.useMemo(
    () =>
      selectedCategory
        ? matches.filter((m) => m.categorySlug === selectedCategory && m.status !== 'COMPLETED')
        : [],
    [selectedCategory, matches]
  );
  const completedCategoryMatches = React.useMemo(
    () =>
      selectedCategory
        ? matches.filter((m) => m.categorySlug === selectedCategory && m.status === 'COMPLETED')
        : [],
    [selectedCategory, matches]
  );

  return (
    <div
      className={
        isMobileView
          ? 'w-full min-h-screen transition-colors'
          : 'min-h-screen bg-slate-100 dark:bg-[#07070a] py-8 px-4 transition-colors'
      }
    >
      <div className={isMobileView ? 'w-full min-h-screen' : 'max-w-7xl mx-auto'}>
        {/* Top Breadcrumb & Controls */}
        {!isMobileView && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-white dark:bg-white/5 p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                <Link href="/" className="hover:text-red-600 transition-colors">
                  {tPhone('হোম', 'Home')}
                </Link>
                <span>/</span>
                <span className="text-red-600 font-bold">
                  FF RIVAL TOUR BD - {tPhone('মোবাইল অ্যাপ লাইভ সিমুলেটর', 'Mobile App Live Simulator')}
                </span>
              </div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-6 h-6 text-red-600" />
                FF RIVAL TOUR BD - {tPhone('মোবাইল অ্যাপ ইন্টারঅ্যাক্টিভ ভিউ', 'Mobile App Interactive Simulator')}
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {tPhone(
                  'রুম রুলস, রেজিস্টার্ড প্লেয়ার্স লিস্ট (৩ নং ছবি), টোটাল প্রাইজ ডিটেইলস (২ নং ছবি) ও বাংলা/ইংরেজি সিস্টেম টেস্ট করুন।',
                  'Test Room Rules, Registered Participants list (Image 3), Total Prize Details (Image 2), and bilingual system.'
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setForceFullscreen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all"
                title="Fullscreen App Mode"
              >
                <Smartphone className="w-4 h-4" />
                <span>{tPhone('ফুলস্ক্রিন অ্যাপ ভিউ', 'Fullscreen App Mode')}</span>
              </button>

              {/* Bilingual System Switcher for Phone */}
              <button
                onClick={togglePhoneLang}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-red-600/10 to-amber-500/10 border border-red-500/30 text-red-600 dark:text-amber-400 hover:scale-105 transition-all shadow-sm"
                title="Toggle Bangla and English for Mobile Phone"
              >
                <Globe className="w-4 h-4 text-amber-500" />
                <span>
                  {phoneLang === 'bn' ? '🌐 Switch App to English' : '🌐 অ্যাপ বাংলায় দেখুন'}
                </span>
              </button>

              <Link
                href="/leaderboard"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-amber-500 text-black hover:bg-amber-400 transition-all shadow-md shadow-amber-500/20"
              >
                <Trophy className="w-4 h-4" /> {tPhone('ওয়েব লিডারবোর্ড', 'Web Leaderboard')}
              </Link>

              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-600/20"
              >
                <Shield className="w-4 h-4" /> {tPhone('অ্যাডমিন প্যানেল', 'Admin Panel')}
              </Link>

              <button
                onClick={() => setPhoneTheme(phoneTheme === 'dark' ? 'light' : 'dark')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 transition-all text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10"
              >
                {phoneTheme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" /> {tPhone('অ্যাপ লাইট মোড', 'Light Mode')}
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-slate-700" /> {tPhone('অ্যাপ ডার্ক মোড', 'Dark Mode')}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Workspace: Phone Mockup on Left + Feature Highlights on Right */}
        <div
          className={
            isMobileView
              ? 'w-full min-h-screen'
              : 'grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'
          }
        >
          {/* LEFT: Phone Simulator */}
          <div
            className={
              isMobileView
                ? 'w-full min-h-screen flex flex-col'
                : 'lg:col-span-5 flex justify-center'
            }
          >
            {/* Realistic Smartphone Chassis */}
            <div
              className={
                isMobileView
                  ? 'w-full min-h-screen flex flex-col p-0 border-0 rounded-none shadow-none bg-transparent'
                  : 'relative w-[370px] sm:w-[390px] h-[780px] bg-slate-900 rounded-[50px] p-3 shadow-2xl ring-1 ring-white/20 shadow-red-500/10 border-4 border-slate-700 flex flex-col'
              }
            >
              {/* Dynamic Island / Camera Notch */}
              {!isMobileView && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 flex items-center justify-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-800"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-950"></div>
                </div>
              )}

              {/* Inside Screen Content */}
              <div
                className={`relative w-full ${
                  isMobileView ? 'min-h-screen rounded-none' : 'h-full rounded-[40px]'
                } overflow-hidden flex flex-col font-sans transition-colors ${
                  phoneTheme === 'dark' ? 'bg-[#0f0f15] text-white' : 'bg-slate-50 text-slate-900'
                }`}
              >
                {/* Status Bar */}
                {!isMobileView && (
                  <div className="pt-3 px-6 pb-2 flex justify-between items-center text-[11px] font-bold tracking-tight opacity-75 z-40 select-none">
                    <span>3:41</span>
                    <div className="flex items-center gap-1.5">
                      <span>5G</span>
                      <span>100%</span>
                    </div>
                  </div>
                )}

                {/* Guest Notice Bar if not logged in */}
                {!currentUser && (
                  <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 px-3 py-1.5 text-white flex items-center justify-between text-[11px] font-bold select-none z-40 shadow-sm">
                    <div className="flex items-center gap-1.5 truncate">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 flex-shrink-0 animate-pulse" />
                      <span className="truncate text-[10px]">
                        {tPhone('টুর্নামেন্টে খেলতে ও উইথড্র করতে লগইন করুন!', 'Sign in to join tournaments & withdraw!')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-1.5">
                      <button
                        onClick={() => {
                          setAuthMode('LOGIN');
                          setShowAuthModal(true);
                        }}
                        className="px-2 py-0.5 rounded bg-white text-red-600 font-black text-[9px] hover:bg-gray-100 shadow-sm"
                      >
                        {tPhone('লগইন', 'Login')}
                      </button>
                      <button
                        onClick={() => {
                          setAuthMode('REGISTER');
                          setShowAuthModal(true);
                        }}
                        className="px-2 py-0.5 rounded bg-black/40 text-white font-black text-[9px] hover:bg-black/60 border border-white/20"
                      >
                        {tPhone('রেজিস্টার', 'Register')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Mobile App Header (Matching Image 1 when in category: < Solo Full Map 🔄) */}
                <div
                  className={`px-4 py-2.5 flex items-center justify-between border-b relative z-30 ${
                    phoneTheme === 'dark'
                      ? 'bg-[#14141c] border-white/10'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  {selectedCategory && currentCategoryData ? (
                    /* EXACT IMAGE 1 TOP HEADER: < Solo Full Map 🔄 */
                    <div className="w-full flex items-center justify-between">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="flex items-center gap-2 text-sm font-black text-gray-900 dark:text-white hover:text-red-500 transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                        <span>{currentCategoryData.name}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {/* In-app Language Switcher */}
                        <button
                          onClick={togglePhoneLang}
                          className="px-2 py-0.5 rounded-full text-[9px] font-black border border-gray-300 dark:border-white/20 bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-white"
                        >
                          {phoneLang === 'bn' ? 'বাং' : 'EN'}
                        </button>

                        {/* Image 1 Refresh Icon */}
                        <button
                          onClick={() => {
                            setExpandedRoomRulesMatchId(null);
                          }}
                          className="p-1 rounded-full text-blue-500 hover:text-blue-400 active:rotate-180 transition-transform"
                          title="Refresh"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Home Header */
                    <div className="w-full flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg overflow-hidden bg-black/60 border border-amber-500/40 flex items-center justify-center p-0.5">
                          <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <span className="text-xs font-black tracking-wide">
                            FF RIVAL <span className="text-red-600">TOUR BD</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={handleSwitchToWeb}
                          title={tPhone('ওয়েবসাইট সংস্করণ', 'Switch to Website')}
                          className={`px-2 py-1 rounded-full text-[9px] font-black border transition-all flex items-center gap-1 shadow-sm ${
                            phoneTheme === 'dark'
                              ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/30'
                              : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                          }`}
                        >
                          <span>🌐 Web</span>
                        </button>
                        <button
                          onClick={togglePhoneLang}
                          className={`px-2 py-1 rounded-full text-[9px] font-black border transition-all flex items-center gap-1 shadow-sm ${
                            phoneTheme === 'dark'
                              ? 'bg-white/10 hover:bg-white/20 text-white border-white/15'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                          }`}
                        >
                          <Globe className="w-2.5 h-2.5 text-amber-400" />
                          <span>{phoneLang === 'bn' ? 'বাং' : 'EN'}</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('wallet')}
                          className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-600/10 text-red-600 border border-red-500/20 text-[10px] font-black"
                        >
                          <Wallet className="w-3 h-3" /> ৳{userBalance.toFixed(0)}
                        </button>

                        <button
                          onClick={() => {
                            setShowNotifDropdown(!showNotifDropdown);
                            if (!showNotifDropdown) {
                              markNotificationsAsRead();
                            }
                          }}
                          className={`p-1.5 rounded-full relative ${
                            phoneTheme === 'dark' ? 'bg-white/5' : 'bg-slate-100'
                          }`}
                        >
                          <Bell className={`w-3.5 h-3.5 ${unreadCount > 0 ? 'text-amber-400 animate-wiggle' : 'text-gray-400'}`} />
                          {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 text-white rounded-full text-[8px] flex items-center justify-center font-bold">
                              {unreadCount}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Notification Dropdown inside phone */}
                  {showNotifDropdown && (
                    <div
                      className={`absolute right-2 top-11 w-64 rounded-2xl shadow-2xl border p-3 z-50 space-y-2 text-xs ${
                        phoneTheme === 'dark'
                          ? 'bg-[#181824] border-white/15 text-white'
                          : 'bg-white border-slate-200 text-slate-900 shadow-slate-400/30'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-1 border-b border-white/10">
                        <span className="font-black text-[11px] flex items-center gap-1">
                          <Bell className="w-3 h-3 text-red-500" /> {tPhone('নোটিফিকেশন অ্যালার্ট', 'Notification Alerts')}
                        </span>
                        <button
                          onClick={() => setShowNotifDropdown(false)}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                        {notificationsList.map((n) => (
                          <div
                            key={n.id}
                            className={`p-2 rounded-xl border text-[10px] space-y-1 ${
                              phoneTheme === 'dark'
                                ? 'bg-black/30 border-white/5'
                                : 'bg-slate-50 border-slate-100'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span className="text-red-500">{n.title}</span>
                              <span className="text-[8px] text-gray-400">{n.timestamp}</span>
                            </div>
                            <p className="text-gray-400 leading-snug">{n.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Success Banner */}
                {joinedSuccess && (
                  <div className="bg-emerald-600 text-white text-xs px-3 py-2 text-center font-bold flex items-center justify-center gap-1.5 animate-pulse">
                    <CheckCircle className="w-4 h-4" /> {tPhone('ম্যাচ স্লট বুকিং সফল হয়েছে!', 'Match slot booking confirmed!')}
                  </div>
                )}

                {/* SCROLLABLE BODY */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {/* FULL DETAILS PAGE (Screenshot 4, 3, 2, 1) */}
                  {matchDetailsScreen ? (
                    <MatchDetailsPage
                      match={matchDetailsScreen}
                      participants={bookedMatchesList
                        .filter((bm) => bm.title === matchDetailsScreen.title)
                        .map((bm) => bm.ign)}
                      onBack={() => setMatchDetailsScreen(null)}
                      onJoinClick={(m) => {
                        setMatchDetailsScreen(null);
                        setBookingModalMatch(m);
                      }}
                      language={phoneLang}
                      isPhoneView={true}
                    />
                  ) : (
                    <>
                      {/* TAB 1: HOME */}
                      {activeTab === 'home' && (
                    <>
                      {/* Inside a Selected Category (Exact replica of User's Image 1) */}
                      {selectedCategory && currentCategoryData ? (
                        <div className="space-y-3">
                          {/* Sub-tabs: PLAY vs RESULT */}
                          <div
                            className={`grid grid-cols-2 p-1 rounded-xl border text-xs font-black ${
                              phoneTheme === 'dark'
                                ? 'bg-black/30 border-white/10'
                                : 'bg-slate-200/70 border-slate-300'
                            }`}
                          >
                            <button
                              onClick={() => setCategoryTab('PLAY')}
                              className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-[11px] ${
                                categoryTab === 'PLAY'
                                  ? 'bg-red-600 text-white shadow-sm font-black'
                                  : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              <span>
                                {tPhone('সক্রিয় ম্যাচ', 'Active Matches')} ({currentCategoryMatches.length})
                              </span>
                            </button>
                            <button
                              onClick={() => setCategoryTab('RESULT')}
                              className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-[11px] ${
                                categoryTab === 'RESULT'
                                  ? 'bg-red-600 text-white shadow-sm font-black'
                                  : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              <Award className="w-3.5 h-3.5 text-amber-400" />
                              <span>
                                {tPhone('ম্যাচ ফলাফল', 'Match Results')} ({completedCategoryMatches.length})
                              </span>
                            </button>
                          </div>

                          {categoryTab === 'PLAY' ? (
                            currentCategoryMatches.length === 0 ? (
                            <div className="p-8 text-center rounded-2xl border border-dashed border-gray-500/30 text-gray-400 space-y-2">
                              <Trophy className="w-8 h-8 mx-auto text-gray-500" />
                              <p className="text-xs font-bold">
                                {tPhone('বর্তমানে কোনো ম্যাচ নেই', 'No Matches Active Currently')}
                              </p>
                              <p className="text-[10px] text-gray-500">
                                {tPhone('অ্যাডমিন প্যানেলে গিয়ে "অটো বট" বাটনে চাপ দিন।', 'Go to admin panel and tap "Generate Batch" button.')}
                              </p>
                            </div>
                          ) : (
                            currentCategoryMatches.map((m) => {
                              const matchBookings = bookedMatchesList
                                .filter((bm) => bm.title === m.title)
                                .map((bm) => bm.ign);
                              const filled = m.filledSlots || matchBookings.length || 0;
                              const spotsLeft = Math.max(0, m.totalSlots - filled);

                              return (
                                <div
                                  key={m.id}
                                  className={`p-3.5 rounded-2xl border space-y-3 shadow-sm transition-all ${
                                    phoneTheme === 'dark'
                                      ? 'bg-[#181824] border-white/10'
                                      : 'bg-white border-slate-200'
                                  }`}
                                >
                                  {/* 1. Top Notice Row with Left Thumbnail (Exact Image 1) - Clickable to open Details Page */}
                                  <div
                                    onClick={() => setMatchDetailsScreen(m)}
                                    className="flex items-start gap-3 cursor-pointer hover:opacity-90 transition-opacity"
                                    title="Click to view full Details Page & Rules"
                                  >
                                    {/* Thumbnail on left */}
                                    <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-amber-900 border border-amber-500/30 flex items-center justify-center relative shadow-sm">
                                      <img
                                        src={m.bannerImage || '/logo.png'}
                                        alt={m.title}
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black/30" />
                                      <span className="absolute text-[8px] font-black text-amber-300 text-center leading-tight drop-shadow px-0.5 uppercase">
                                        {m.type}
                                      </span>
                                    </div>

                                    {/* Notice text on right */}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[10px] font-bold text-gray-800 dark:text-gray-200 leading-snug">
                                        কাস্টমে নিজের জায়গায় বসতে হবে বাধ্যতামূলক - আইডি লেভেল ৫৫+ থাকতে হবে -
                                        Normal {m.type} ম্যাচের নিয়ম পড়ে নিন, নিয়ম না মানলে রিফান্ড বা উইনিং
                                        পাবেন না! {settings?.siteName || 'FF RIVAL TOUR BD'}
                                      </p>
                                      <div className="flex items-center justify-between pt-1">
                                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                          {formatMatchSchedule(m.time)}
                                        </span>
                                        <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900/40">
                                          Details Page ➔
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* 2. 6-Cell Stat Grid (Exact Image 1) */}
                                  <div className="grid grid-cols-3 gap-y-2 gap-x-1 py-1.5 text-center border-t border-b border-gray-100 dark:border-white/5">
                                    <div>
                                      <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-tight">
                                        WIN PRIZE
                                      </span>
                                      <span className="font-black text-gray-900 dark:text-white text-xs">
                                        {m.prizePool} TK
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-tight">
                                        ENTRY TYPE
                                      </span>
                                      <span className="font-black text-gray-900 dark:text-white text-xs">
                                        {m.type}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-tight">
                                        ENTRY FEE
                                      </span>
                                      <span className="font-black text-gray-900 dark:text-white text-xs">
                                        {m.entryFee} TK
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-tight">
                                        PER KILL
                                      </span>
                                      <span className="font-black text-gray-900 dark:text-white text-xs">
                                        {m.perKill} TK
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-tight">
                                        MAP
                                      </span>
                                      <span className="font-black text-gray-900 dark:text-white text-xs">
                                        {m.map}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-tight">
                                        VERSION
                                      </span>
                                      <span className="font-black text-gray-900 dark:text-white text-xs">
                                        MOBILE
                                      </span>
                                    </div>
                                  </div>

                                  {/* 3. Progress Bar + Join Button Row (Exact Image 1) */}
                                  <div className="flex items-center gap-3 pt-0.5">
                                    <div className="flex-1 space-y-1">
                                      <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                                        <div
                                          className="bg-emerald-500 h-full rounded-full transition-all"
                                          style={{
                                            width: `${Math.min(
                                              100,
                                              (filled / m.totalSlots) * 100
                                            )}%`,
                                          }}
                                        />
                                      </div>
                                      <div className="flex items-center justify-between text-[9px] text-gray-400 font-semibold">
                                        <span>Only {spotsLeft} spots are left</span>
                                        <span className="text-gray-500 font-bold">
                                          {filled}/{m.totalSlots}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Join Button (Image 1 Style) */}
                                    <button
                                      onClick={() => {
                                        if (!currentUser) {
                                          setShowAuthModal(true);
                                          return;
                                        }
                                        setBookingModalMatch(m);
                                      }}
                                      className="px-5 py-1.5 rounded-lg border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 font-bold text-xs hover:bg-blue-600 hover:text-white transition-all flex-shrink-0"
                                    >
                                      Join
                                    </button>
                                  </div>

                                  {/* 4. Dual Action Buttons: Room Rules and Total Prize Details */}
                                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                                    {/* Button 1: Room Rules ➔ (Navigates directly to full Details Page) */}
                                    <button
                                      onClick={() => setMatchDetailsScreen(m)}
                                      className="py-1.5 px-2 rounded-lg border border-blue-400/50 dark:border-blue-500/40 text-blue-600 dark:text-blue-400 text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all shadow-sm"
                                    >
                                      <Key className="w-3.5 h-3.5 text-blue-500" />
                                      <span>Room Rules</span>
                                      <span className="text-[10px] text-blue-400 font-mono">➔</span>
                                    </button>

                                    {/* Button 2: Total Prize Details ⌄ (Opens Image 2 Modal) */}
                                    <button
                                      onClick={() => setTotalPrizeMatch(m)}
                                      className="py-1.5 px-2 rounded-lg border border-blue-400/50 dark:border-blue-500/40 text-blue-600 dark:text-blue-400 text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all"
                                    >
                                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                                      <span>Total Prize Details</span>
                                      <span className="text-[10px]">▼</span>
                                    </button>
                                  </div>

                                  {/* 5. Real Live Countdown Bar */}
                                  <LiveMatchCountdown
                                    matchTime={m.time}
                                    roomId={m.roomId}
                                    status={m.status}
                                    compact={true}
                                  />
                                </div>
                              );
                            }))
                          ) : (
                            /* MATCH RESULTS VIEW (TAB 2) */
                            completedCategoryMatches.length === 0 ? (
                              <div className="p-8 text-center rounded-2xl border border-dashed border-gray-500/30 text-gray-400 space-y-2">
                                <Trophy className="w-8 h-8 mx-auto text-gray-500" />
                                <p className="text-xs font-bold">
                                  {tPhone('কোনো পূর্ববর্তী ম্যাচ রেজাল্ট পাওয়া যায়নি', 'No Match Results Found')}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                  {tPhone(
                                    'ম্যাচ শেষ হওয়ার পর সমস্ত রেজাল্ট ও প্রাইজ এখানে দেখাবে।',
                                    'Once matches conclude, results and prizes will appear here.'
                                  )}
                                </p>
                              </div>
                            ) : (
                              completedCategoryMatches.map((m) => (
                                <div
                                  key={m.id}
                                  className={`p-3.5 rounded-2xl border space-y-2.5 shadow-sm ${
                                    phoneTheme === 'dark' ? 'bg-[#181824] border-white/10' : 'bg-white border-slate-200'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <h4 className="text-xs font-black text-gray-900 dark:text-white leading-tight">
                                        {m.title}
                                      </h4>
                                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold mt-0.5">
                                        {formatMatchSchedule(m.time)} • {m.type} • {m.map}
                                      </p>
                                    </div>
                                    <span className="text-[9px] font-black px-2 py-0.5 rounded bg-gray-600 text-white flex-shrink-0">
                                      FINISHED
                                    </span>
                                  </div>

                                  {m.results && m.results.length > 0 ? (
                                    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/5 text-[11px]">
                                      <table className="w-full text-left">
                                        <thead className="bg-black/20 text-gray-400 font-bold uppercase text-[9px]">
                                          <tr>
                                            <th className="p-2">#</th>
                                            <th className="p-2">{tPhone('প্লেয়ার', 'Player')}</th>
                                            <th className="p-2 text-center">{tPhone('কিল', 'Kills')}</th>
                                            <th className="p-2 text-right">{tPhone('প্রাইজ', 'Prize')}</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 font-bold">
                                          {m.results.map((r) => (
                                            <tr key={`${m.id}-${r.rank}-${r.ign}`}>
                                              <td className="p-2 text-amber-400">#{r.rank}</td>
                                              <td className="p-2 font-mono text-gray-900 dark:text-white truncate max-w-[100px]">{r.ign}</td>
                                              <td className="p-2 text-center text-red-500">{r.kills}</td>
                                              <td className="p-2 text-right text-emerald-400">৳{r.prize}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 font-bold text-center">
                                      {tPhone('রেজাল্ট প্রক্রিয়াধীন রয়েছে (Pending Admin Verification)', 'Results Pending Admin Verification')}
                                    </div>
                                  )}
                                </div>
                              ))
                            )
                          )}
                        </div>
                      ) : (
                        /* Main Home Category Feed */
                        <div className="space-y-3">
                          {/* Announcement Ticker */}
                          <div className="p-2 rounded-xl bg-gradient-to-r from-red-600/10 via-rose-600/10 to-transparent border border-red-500/20 flex items-center gap-2 text-[10px]">
                            <span className="px-1.5 py-0.5 rounded bg-red-600 text-white font-black text-[9px]">
                              LIVE
                            </span>
                            <span className="truncate text-gray-700 dark:text-gray-300 font-semibold">
                              {tPhone(
                                'রুম আইডি ও পাসওয়ার্ড ম্যাচ শুরুর ১৫ মিনিট আগে দেওয়া হবে।',
                                'Room ID & Password will be released 15 mins before match.'
                              )}
                            </span>
                          </div>

                          {/* Quick Banner */}
                          <div className="relative rounded-2xl overflow-hidden h-28 bg-gradient-to-tr from-red-900 to-slate-900 p-3 flex flex-col justify-end text-white shadow-lg">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
                              FF RIVAL TOUR BD 2026
                            </span>
                            <h3 className="text-sm font-black leading-tight">
                              {tPhone('দৈনিক কাস্টম টুর্নামেন্ট লাইভ!', 'Daily Custom Tournaments Live!')}
                            </h3>
                            <p className="text-[9px] text-gray-300 mt-0.5">
                              {tPhone(
                                'স্বল্প এন্ট্রি ফি • দ্রুত বিকাশ/নগদে প্রাইজ উইথড্র',
                                'Low Entry Fee • Instant bKash/Nagad Prize Withdrawal'
                              )}
                            </p>
                          </div>

                          {/* Category Cards Section */}
                          <div className="space-y-2">
                            <div className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 px-1">
                              {tPhone('গেম ক্যাটাগরি (Select Mode)', 'Game Categories (Select Mode)')}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              {categoriesList.map((cat) => {
                                const count = matches.filter((m) => m.categorySlug === cat.slug).length;
                                return (
                                  <div
                                    key={cat.slug}
                                    onClick={() => setSelectedCategory(cat.slug)}
                                    className="group cursor-pointer rounded-xl overflow-hidden relative border border-white/10 shadow hover:border-red-500 transition-all h-28 flex flex-col justify-end p-2 bg-slate-800"
                                  >
                                    <img
                                      src={cat.bannerImage}
                                      alt={cat.name}
                                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform opacity-75"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-red-950 via-black/50 to-transparent"></div>
                                    <div className="relative z-10">
                                      <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-red-600 text-white inline-block mb-0.5">
                                        {count} {tPhone('ম্যাচ', 'Matches')}
                                      </span>
                                      <h4 className="text-[11px] font-black text-white leading-tight">
                                        {cat.name}
                                      </h4>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* TAB 2: MY MATCHES */}
                  {activeTab === 'my-matches' && (
                    <div className="space-y-3">
                      <div className="text-xs font-black uppercase tracking-wider text-red-500">
                        {tPhone(`আপনার বুক করা ম্যাচ (${bookedMatchesList.length})`, `Your Booked Matches (${bookedMatchesList.length})`)}
                      </div>

                      {bookedMatchesList.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 border border-dashed border-gray-500/30 rounded-xl">
                          <Clock className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                          <p className="text-xs font-bold">
                            {tPhone('আপনি এখনও কোনো ম্যাচে জয়েন করেননি', 'You have not joined any match yet')}
                          </p>
                        </div>
                      ) : (
                        bookedMatchesList.map((bm) => (
                          <div
                            key={bm.id}
                            className={`p-3.5 rounded-xl border space-y-3 ${
                              phoneTheme === 'dark'
                                ? 'bg-[#181824] border-white/10'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-gray-900 dark:text-white truncate max-w-[200px]">
                                {bm.title}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                CONFIRMED
                              </span>
                            </div>

                            {/* Player IGN & Slot Info with Click to View Player Details */}
                            <div
                              onClick={() =>
                                setSelectedPlayerForDetails({
                                  ign: bm.ign,
                                  uid: bm.uid,
                                  kills: 142,
                                  earnings: 8600,
                                  matchesPlayed: 38,
                                  booyahs: 12,
                                  winRate: '42.8%',
                                  level: 72,
                                  guild: 'BD_RIVALS_ELITE',
                                })
                              }
                              className="p-2 rounded-lg bg-black/20 hover:bg-black/30 cursor-pointer border border-white/5 flex items-center justify-between text-[11px] transition-all"
                              title={tPhone('প্লেয়ার ডিটেইলস দেখুন', 'Click to view player details')}
                            >
                              <div>
                                <span className="text-gray-400 block text-[9px] flex items-center gap-1">
                                  Verified IGN <Eye className="w-2.5 h-2.5 text-amber-400" />
                                </span>
                                <span className="font-bold text-amber-400">{bm.ign}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-gray-400 block text-[9px]">
                                  {bm.team ? tPhone(`টিম #${bm.team}`, `Team #${bm.team}`) : tPhone('স্লট নম্বর', 'Slot #')}
                                </span>
                                <span className="font-black text-emerald-400">
                                  #{bm.slot}
                                </span>
                              </div>
                            </div>

                            {/* Room Credentials Card */}
                            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400 flex items-center gap-1 text-[11px]">
                                  <Key className="w-3.5 h-3.5 text-red-500" /> {tPhone('রুম আইডি:', 'Room ID:')}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-black text-white bg-black/40 px-2 py-0.5 rounded text-[11px]">
                                    {bm.roomId}
                                  </span>
                                  <button
                                    onClick={() => handleCopy(bm.roomId, `room-${bm.id}`)}
                                    className="text-red-500 hover:text-red-400"
                                  >
                                    {copiedKey === `room-${bm.id}` ? (
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400 flex items-center gap-1 text-[11px]">
                                  <Key className="w-3.5 h-3.5 text-red-500" /> {tPhone('পাসওয়ার্ড:', 'Password:')}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-black text-white bg-black/40 px-2 py-0.5 rounded text-[11px]">
                                    {bm.roomPass}
                                  </span>
                                  <button
                                    onClick={() => handleCopy(bm.roomPass, `pass-${bm.id}`)}
                                    className="text-red-500 hover:text-red-400"
                                  >
                                    {copiedKey === `pass-${bm.id}` ? (
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-between items-center text-[10px] text-gray-400 pt-1">
                              <span>UID: {bm.uid}</span>
                              <span className="text-amber-400 font-bold">{bm.time}</span>
                            </div>

                            {/* Match Result Screenshot Proof Upload */}
                            <div className="pt-2 border-t border-gray-100 dark:border-white/5 space-y-1.5">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                  <Camera className="w-3 h-3 text-red-500" />
                                  {tPhone('রেজাল্ট স্ক্রিনশট প্রুফ', 'Result Screenshot Proof')}
                                </span>
                                {matchScreenshots[bm.id] && (
                                  <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                                    <CheckCircle className="w-3 h-3" /> {tPhone('আপলোড সফল', 'Uploaded')}
                                  </span>
                                )}
                              </div>

                              <ImageUploadInput
                                label={tPhone('ম্যাচ শেষের স্ক্রিনশট আপলোড করুন', 'Upload Result Screenshot')}
                                value={matchScreenshots[bm.id] || ''}
                                onChange={(url) => setMatchScreenshots((prev) => ({ ...prev, [bm.id]: url }))}
                                helperText={tPhone('কাস্টম রেজাল্ট বা র‍্যাঙ্কিং স্ক্রিনশট বেছে নিন', 'Upload match history / ranking screenshot')}
                                previewHeight="h-28"
                              />
                            </div>
                          </div>
                        ))
                      )}

                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-500 leading-relaxed font-semibold">
                        ⚠️ {tPhone(
                          'সতর্কতা: রুম আইডি ও পাসওয়ার্ড অন্য কাউকে শেয়ার করলে অ্যাকাউন্ট স্থায়ীভাবে ব্যান করা হবে।',
                          'Warning: Sharing Room ID & Password with outsiders will result in an instant permanent ban.'
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: TOP PLAYERS (WITH PLAYER DETAILS MODAL) */}
                  {activeTab === 'top-players' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                          <Trophy className="w-4 h-4 text-amber-400" />
                          {tPhone('টপ প্লেয়ার ফলাফল (Leaderboard)', 'Top Players Leaderboard')}
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold">
                          Live Results
                        </span>
                      </div>

                      {/* Top 1 Hero Card */}
                      {topPlayers[0] && (
                        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 text-white shadow-lg space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded text-amber-300">
                              👑 #1 Champion
                            </span>
                            <span className="text-xs font-mono font-bold">UID: {topPlayers[0].uid}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-400 shadow-md flex-shrink-0">
                              <img src={topPlayers[0].avatar} alt={topPlayers[0].ign} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <h3 className="text-sm font-black">{topPlayers[0].ign}</h3>
                              <p className="text-[10px] text-amber-200">
                                {topPlayers[0].booyahs} Booyahs • Win Rate: {topPlayers[0].winRate}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 pt-1 text-center bg-black/30 rounded-xl p-1.5 text-[10px]">
                            <div>
                              <span className="text-gray-300 block text-[9px]">{tPhone('মোট কিল', 'Total Kills')}</span>
                              <span className="font-black text-red-400">{topPlayers[0].kills} Kills</span>
                            </div>
                            <div>
                              <span className="text-gray-300 block text-[9px]">{tPhone('মোট আয়', 'Total Won')}</span>
                              <span className="font-black text-emerald-400">৳{topPlayers[0].earnings}</span>
                            </div>
                            <div>
                              <span className="text-gray-300 block text-[9px]">{tPhone('ম্যাচ খেলা', 'Matches')}</span>
                              <span className="font-black text-amber-300">{topPlayers[0].matchesPlayed}</span>
                            </div>
                          </div>

                          {/* ACTION BUTTON: VIEW PLAYER DETAILS */}
                          <button
                            onClick={() => setSelectedPlayerForDetails(topPlayers[0])}
                            className="w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{tPhone('প্লেয়ার ডিটেইলস দেখুন', 'View Full Player Details')}</span>
                          </button>
                        </div>
                      )}

                      {/* Ranked Players List */}
                      <div className="space-y-2">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider px-1">
                          {tPhone('অন্যান্য শীর্ষ প্লেয়ারদের রেজাল্ট', 'Other Top Players & Results')}
                        </div>

                        {topPlayers.slice(1).map((p) => (
                          <div
                            key={p.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 shadow-sm transition-all ${
                              phoneTheme === 'dark'
                                ? 'bg-[#181824] border-white/10'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] font-black ${
                                  p.rank === 2
                                    ? 'bg-slate-300 text-black'
                                    : p.rank === 3
                                    ? 'bg-amber-700/60 text-white'
                                    : 'bg-white/10 text-gray-400'
                                }`}
                              >
                                #{p.rank}
                              </span>

                              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
                                <img src={p.avatar} alt={p.ign} className="w-full h-full object-cover" />
                              </div>

                              <div>
                                <span className="text-xs font-black text-gray-900 dark:text-white block truncate max-w-[95px]">
                                  {p.ign}
                                </span>
                                <span className="text-[9px] text-gray-400 font-mono">
                                  UID: {p.uid}
                                </span>
                              </div>
                            </div>

                            {/* Stats Columns & Details Trigger */}
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div className="text-xs font-black text-emerald-500">
                                  ৳{p.earnings.toLocaleString()}
                                </div>
                                <div className="text-[9px] text-gray-400">
                                  <span className="text-red-500 font-bold">{p.kills} K</span> • {p.matchesPlayed} M
                                </div>
                              </div>

                              <button
                                onClick={() => setSelectedPlayerForDetails(p)}
                                className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-black transition-all"
                                title={tPhone('প্লেয়ার ডিটেইলস', 'Player Details')}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: WALLET */}
                  {activeTab === 'wallet' && (
                    <div className="space-y-3">
                      {/* Wallet Balance Card */}
                      <div className="p-4 rounded-2xl bg-gradient-to-tr from-red-700 via-rose-600 to-red-900 text-white shadow-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-red-200 uppercase tracking-wider">
                            {tPhone('মোট ওয়ালেট ব্যালেন্স', 'Total Wallet Balance')}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-bold">
                            100% Safe & Instant
                          </span>
                        </div>
                        <div className="text-3xl font-black">৳ {userBalance.toFixed(2)}</div>
                        <div className="text-[10px] text-red-200 pt-1 flex justify-between border-t border-white/20">
                          <span>{tPhone('উইথড্র যোগ্য: ৳', 'Withdrawable: ৳')} {(userBalance * 0.85).toFixed(2)}</span>
                          <span>{tPhone('ম্যাচ বোনাস: ৳', 'Bonus: ৳')} {(userBalance * 0.15).toFixed(2)}</span>
                        </div>

                        {/* Direct Withdraw & Deposit Buttons inside Wallet */}
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <button
                            onClick={() => {
                              if (!currentUser) {
                                setShowAuthModal(true);
                                return;
                              }
                              setFinanceModalTab('WITHDRAW');
                              setShowFinanceModal(true);
                            }}
                            className="py-2.5 px-3 rounded-xl bg-white text-gray-900 hover:bg-gray-100 font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                          >
                            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                            <span>{tPhone('উইথড্র (টাকা তোলা)', 'Withdraw Money')}</span>
                          </button>

                          <button
                            onClick={() => {
                              if (!currentUser) {
                                setShowAuthModal(true);
                                return;
                              }
                              setFinanceModalTab('DEPOSIT');
                              setShowFinanceModal(true);
                            }}
                            className="py-2.5 px-3 rounded-xl bg-black/40 hover:bg-black/60 text-white font-black text-xs flex items-center justify-center gap-1.5 border border-white/30 active:scale-95 transition-all"
                          >
                            <ArrowDownRight className="w-4 h-4 text-amber-400" />
                            <span>{tPhone('ডিপোজিট (টাকা যোগ)', 'Add Money')}</span>
                          </button>
                        </div>
                      </div>

                      {/* Payment Methods Card */}
                      <div
                        className={`p-3.5 rounded-2xl border space-y-2.5 ${
                          phoneTheme === 'dark' ? 'bg-[#181824] border-white/10' : 'bg-white border-slate-200'
                        }`}
                      >
                        <span className="text-xs font-black text-gray-900 dark:text-white block">
                          {tPhone('ইনস্ট্যান্ট পেমেন্ট গেটওয়ে (bKash / Nagad / Rocket)', 'Instant Payment Methods')}
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { name: 'bKash', number: settings?.bkashNumber || '01712345678', color: 'border-pink-500/40 text-pink-500' },
                            { name: 'Nagad', number: settings?.nagadNumber || '01812345678', color: 'border-orange-500/40 text-orange-500' },
                            { name: 'Rocket', number: '01912345678', color: 'border-purple-500/40 text-purple-500' },
                          ].map((gw) => (
                            <div
                              key={gw.name}
                              className={`p-2 rounded-xl border bg-gray-50 dark:bg-white/5 text-center ${gw.color}`}
                            >
                              <div className="text-[11px] font-black uppercase">{gw.name}</div>
                              <div className="text-[9px] text-gray-400 font-mono truncate">{gw.number}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recent History */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                          {tPhone('সাম্প্রতিক লেনদেন হিস্ট্রি', 'Recent Transactions')}
                        </span>
                        <div className="space-y-1.5">
                          {getTransactions().slice(0, 4).map((tx) => (
                            <div
                              key={tx.id}
                              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                                phoneTheme === 'dark' ? 'bg-[#181824] border-white/10' : 'bg-white border-slate-200'
                              }`}
                            >
                              <div>
                                <span
                                  className={`font-black text-[11px] block ${
                                    tx.type === 'CREDIT' ? 'text-emerald-500' : 'text-red-500'
                                  }`}
                                >
                                  {tx.type === 'CREDIT' ? '+ টাকা যোগ (ডিপোজিট)' : '- টাকা উত্তোলন (উইথড্র)'}
                                </span>
                                <span className="text-[9px] text-gray-400">{tx.reason}</span>
                              </div>
                              <span
                                className={`font-black text-xs ${
                                  tx.type === 'CREDIT' ? 'text-emerald-500' : 'text-red-500'
                                }`}
                              >
                                {tx.type === 'CREDIT' ? '+' : '-'}৳{tx.amount.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: PROFILE & CAREER STATS */}
                  {activeTab === 'profile' && (
                    <div className="space-y-3">
                      {/* If Guest (Not Logged In) -> Show Auth Screen Directly in Tab */}
                      {!currentUser ? (
                        <div
                          className={`p-4 rounded-2xl border text-center space-y-3 ${
                            phoneTheme === 'dark' ? 'bg-[#181824] border-white/10' : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-red-500/30">
                            <Lock className="w-7 h-7" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-gray-900 dark:text-white">
                              {tPhone('লগইন বা রেজিস্টার করুন', 'Login or Create Account')}
                            </h3>
                            <p className="text-[11px] text-gray-400">
                              {tPhone(
                                'প্রোফাইল দেখতে, উইথড্র করতে ও টুর্নামেন্টে জয়েন করতে অ্যাকাউন্টে প্রবেশ করুন',
                                'Sign in to access your profile, wallet, withdraw and tournaments'
                              )}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              onClick={() => {
                                setAuthMode('LOGIN');
                                setShowAuthModal(true);
                              }}
                              className="py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-md shadow-red-600/30"
                            >
                              {tPhone('লগইন করুন', 'Login')}
                            </button>
                            <button
                              onClick={() => {
                                setAuthMode('REGISTER');
                                setShowAuthModal(true);
                              }}
                              className="py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-xs shadow-md shadow-amber-500/30"
                            >
                              {tPhone('নতুন রেজিস্টার', 'Register')}
                            </button>
                          </div>

                          {/* 5 Owner ID 1-Click Access for Admins */}
                          <div className="pt-2 border-t border-gray-200 dark:border-white/10 space-y-1.5 text-left">
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider block text-center flex items-center justify-center gap-1">
                              <Shield className="w-3 h-3 text-amber-500" /> ওনার / অ্যাডমিন আইডি (১-ক্লিক লগইন)
                            </span>
                            <div className="grid grid-cols-2 gap-1.5">
                              {[
                                { label: 'ওনার ১', phone: '01700000001', pass: 'admin@owner1' },
                                { label: 'ওনার ২', phone: '01700000002', pass: 'admin@owner2' },
                                { label: 'ওনার ৩', phone: '01700000003', pass: 'admin@owner3' },
                                { label: 'ওনার ৪', phone: '01700000004', pass: 'admin@owner4' },
                                { label: 'ওনার ৫', phone: '01700000005', pass: 'admin@owner5' },
                                { label: 'মাস্টার অ্যাডমিন', phone: '01700000000', pass: 'admin123' },
                              ].map((adm) => (
                                <button
                                  key={adm.phone}
                                  onClick={() => {
                                    loginUser(adm.phone, adm.pass);
                                  }}
                                  className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 text-left transition-all"
                                >
                                  <div className="text-[10px] font-black text-amber-500">{adm.label}</div>
                                  <div className="text-[8px] text-gray-400 font-mono">{adm.phone}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* 1. OWNER / ADMIN DIRECT ACCESS BANNER (IF ADMIN) */}
                          {currentUser.role === 'ADMIN' && (
                            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-950 via-amber-950 to-black border-2 border-amber-500/40 text-white shadow-xl space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-black font-black text-sm shadow-md shadow-amber-500/30">
                                    👑
                                  </div>
                                  <div>
                                    <div className="text-xs font-black text-amber-400 flex items-center gap-1">
                                      {currentUser.ign}
                                      <span className="text-[9px] bg-red-600 px-1.5 py-0.2 rounded text-white font-bold">OWNER</span>
                                    </div>
                                    <p className="text-[10px] text-gray-300 font-mono">{currentUser.phone}</p>
                                  </div>
                                </div>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold">
                                  Full Master Access
                                </span>
                              </div>

                              <Link
                                href="/admin"
                                className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/30 active:scale-95 transition-all"
                              >
                                <Shield className="w-4 h-4 text-black" />
                                <span>👑 {tPhone('অ্যাডমিন প্যানেল প্রবেশ করুন', 'Enter Admin Dashboard')}</span>
                              </Link>
                            </div>
                          )}

                          {/* 2. USER PROFILE HEADER CARD */}
                          <div
                            className={`p-4 rounded-2xl border text-center space-y-2.5 ${
                              phoneTheme === 'dark' ? 'bg-[#181824] border-white/10' : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 mx-auto flex items-center justify-center text-white text-xl font-black shadow-lg shadow-red-500/30">
                              {(currentUser?.ign || 'PL').slice(0, 2).toUpperCase()}
                              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#181824] flex items-center justify-center text-[10px]">
                                ✓
                              </span>
                            </div>

                            <div>
                              <div className="flex items-center justify-center gap-1.5">
                                <h3 className="text-sm font-black text-gray-900 dark:text-white">
                                  {currentUser?.ign || 'Player'}
                                </h3>
                                {currentUser?.role === 'ADMIN' ? (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black text-[9px] font-black">
                                    OWNER
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-black">
                                    PRO
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400 font-mono">
                                UID: {currentUser?.uid || '---'} | {currentUser?.phone || '---'}
                              </span>
                            </div>

                            <div className="flex items-center justify-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold">
                                <Shield className="w-3 h-3" /> Anti-Cheat Verified
                              </span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold">
                                ৳ {userBalance.toFixed(2)}
                              </span>
                            </div>

                            {/* 3. WITHDRAW & DEPOSIT PRIMARY ACTION BUTTONS */}
                            <div className="grid grid-cols-2 gap-2 pt-2">
                              <button
                                onClick={() => {
                                  setFinanceModalTab('WITHDRAW');
                                  setShowFinanceModal(true);
                                }}
                                className="py-2.5 px-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                              >
                                <ArrowUpRight className="w-4 h-4" />
                                <span>{tPhone('উইথড্র (টাকা তোলা)', 'Withdraw Money')}</span>
                              </button>

                              <button
                                onClick={() => {
                                  setFinanceModalTab('DEPOSIT');
                                  setShowFinanceModal(true);
                                }}
                                className="py-2.5 px-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20 active:scale-95 transition-all"
                              >
                                <ArrowDownRight className="w-4 h-4" />
                                <span>{tPhone('ডিপোজিট (টাকা যোগ)', 'Add Money')}</span>
                              </button>
                            </div>
                          </div>

                          {/* 4. CAREER STATISTICS (6-GRID) */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                              📊 {tPhone('ক্যারিয়ার পরিসংখ্যান ও পারফরম্যান্স', 'Career Performance & Stats')}
                            </span>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              {/* TOTAL EARNINGS */}
                              <div
                                className={`p-2.5 rounded-xl border ${
                                  phoneTheme === 'dark' ? 'bg-[#181824] border-white/10' : 'bg-white border-slate-200'
                                }`}
                              >
                                <span className="text-[9px] text-gray-400 block">{tPhone('মোট ইনকাম', 'Earnings')}</span>
                                <span className="text-xs font-black text-amber-500">
                                  ৳{Number(currentUser.totalEarnings ?? (currentUser.matchesPlayed * 250)).toLocaleString()}
                                </span>
                              </div>

                              {/* BOOYAH COUNT */}
                              <div
                                className={`p-2.5 rounded-xl border ${
                                  phoneTheme === 'dark' ? 'bg-[#181824] border-white/10' : 'bg-white border-slate-200'
                                }`}
                              >
                                <span className="text-[9px] text-gray-400 block">{tPhone('বুইয়াহ কাউন্ট', 'Booyahs')}</span>
                                <span className="text-xs font-black text-emerald-500">
                                  {currentUser.totalWins ?? 12} 🏆
                                </span>
                              </div>

                              {/* TOTAL KILLS */}
                              <div
                                className={`p-2.5 rounded-xl border ${
                                  phoneTheme === 'dark' ? 'bg-[#181824] border-white/10' : 'bg-white border-slate-200'
                                }`}
                              >
                                <span className="text-[9px] text-gray-400 block">{tPhone('মোট কিল', 'Kills')}</span>
                                <span className="text-xs font-black text-blue-500">
                                  {currentUser.totalKills ?? 142} 🎯
                                </span>
                              </div>

                              {/* MATCHES PLAYED */}
                              <div
                                className={`p-2.5 rounded-xl border ${
                                  phoneTheme === 'dark' ? 'bg-[#181824] border-white/10' : 'bg-white border-slate-200'
                                }`}
                              >
                                <span className="text-[9px] text-gray-400 block">{tPhone('খেলা ম্যাচ', 'Matches')}</span>
                                <span className="text-xs font-black text-red-500">
                                  {currentUser?.matchesPlayed ?? 38}
                                </span>
                              </div>

                              {/* WIN RATE */}
                              <div
                                className={`p-2.5 rounded-xl border ${
                                  phoneTheme === 'dark' ? 'bg-[#181824] border-white/10' : 'bg-white border-slate-200'
                                }`}
                              >
                                <span className="text-[9px] text-gray-400 block">{tPhone('উইন রেট', 'Win Rate')}</span>
                                <span className="text-xs font-black text-purple-500">
                                  {(
                                    (((currentUser?.totalWins || 12) / Math.max(1, currentUser?.matchesPlayed || 38)) * 100)
                                  ).toFixed(1)}
                                  %
                                </span>
                              </div>

                              {/* K/D RATIO */}
                              <div
                                className={`p-2.5 rounded-xl border ${
                                  phoneTheme === 'dark' ? 'bg-[#181824] border-white/10' : 'bg-white border-slate-200'
                                }`}
                              >
                                <span className="text-[9px] text-gray-400 block">{tPhone('কে/ডি রেশিও', 'K/D Ratio')}</span>
                                <span className="text-xs font-black text-teal-500">
                                  {(
                                    ((currentUser?.totalKills || 142) /
                                      Math.max(1, (currentUser?.matchesPlayed || 38) - (currentUser?.totalWins || 12)))
                                  ).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 5. MATCH STORY / MATCH RECORDS */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <Gamepad2 className="w-3.5 h-3.5 text-red-500" />
                                {tPhone('ম্যাচ স্টোরি ও হিস্ট্রি', 'Match Story & Records')}
                              </span>
                              <span className="text-[9px] text-gray-400 font-mono">
                                {(currentUser.matchHistory && currentUser.matchHistory.length) || 4} টি ম্যাচ
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              {(
                                currentUser.matchHistory || [
                                  {
                                    id: 'rec-1',
                                    matchTitle: 'BR SURVIVAL #108 (CLASSIC)',
                                    category: 'Classic BR',
                                    date: '2026-10-06 19:00',
                                    slotNumber: 4,
                                    kills: 8,
                                    rank: 1,
                                    isBooyah: true,
                                    prizeEarned: 1200,
                                  },
                                  {
                                    id: 'rec-2',
                                    matchTitle: 'CLASH SQUAD 4V4 #92',
                                    category: 'Clash Squad',
                                    date: '2026-10-05 20:30',
                                    slotNumber: 1,
                                    kills: 14,
                                    rank: 1,
                                    isBooyah: true,
                                    prizeEarned: 800,
                                  },
                                  {
                                    id: 'rec-3',
                                    matchTitle: 'CS HEADSHOT SPECIAL #44',
                                    category: 'Headshot Only',
                                    date: '2026-10-04 18:00',
                                    slotNumber: 2,
                                    kills: 11,
                                    rank: 2,
                                    isBooyah: false,
                                    prizeEarned: 450,
                                  },
                                  {
                                    id: 'rec-4',
                                    matchTitle: 'LONE WOLF 1V1 #31',
                                    category: 'Lone Wolf',
                                    date: '2026-10-03 21:15',
                                    slotNumber: 1,
                                    kills: 5,
                                    rank: 1,
                                    isBooyah: true,
                                    prizeEarned: 300,
                                  },
                                ]
                              ).map((rec: any, idx: number) => (
                                <div
                                  key={rec.id || idx}
                                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                                    phoneTheme === 'dark' ? 'bg-[#181824] border-white/10' : 'bg-white border-slate-200'
                                  }`}
                                >
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-black text-gray-900 dark:text-white text-[11px]">
                                        {rec.matchTitle}
                                      </span>
                                      {rec.isBooyah ? (
                                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-black text-[9px] border border-emerald-500/30">
                                          🏆 বুইয়াহ
                                        </span>
                                      ) : (
                                        <span className="px-1.5 py-0.2 rounded bg-gray-500/20 text-gray-300 font-bold text-[9px]">
                                          র‍্যাংক #{rec.rank}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[9px] text-gray-400 font-mono">
                                      {rec.date} | স্লট: {rec.slotNumber} | কিল: {rec.kills}
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <span className="text-[11px] font-black text-emerald-500 block">
                                      +৳{rec.prizeEarned}
                                    </span>
                                    <span className="text-[8px] text-gray-400">পুরস্কার প্রাপ্ত</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 6. SWITCH TO WEB & LOGOUT */}
                          <div className="pt-2 space-y-2">
                            <button
                              onClick={handleSwitchToWeb}
                              className="w-full py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 text-xs font-bold transition-all flex items-center justify-center gap-2"
                            >
                              <Globe className="w-3.5 h-3.5 text-blue-500" />
                              <span>{tPhone('ওয়েবসাইট সংস্করণে যান', 'Switch to Website Version')}</span>
                            </button>

                            <button
                              onClick={() => {
                                logoutUser();
                                setCurrentUser(null);
                              }}
                              className="w-full py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span>{tPhone('অ্যাকাউন্ট থেকে লগআউট করুন', 'Logout from Account')}</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                    </>
                  )}
                </div>

                {/* 5-ICON BOTTOM NAVIGATION BAR (BILINGUAL SYSTEM) */}
                <div
                  className={`sticky bottom-0 h-16 px-2 flex items-center justify-around border-t z-40 select-none backdrop-blur-md pb-safe ${
                    phoneTheme === 'dark'
                      ? 'bg-[#14141c]/95 border-white/10'
                      : 'bg-white/95 border-slate-200'
                  }`}
                >
                  {/* 1. MATCH */}
                  <button
                    onClick={() => {
                      setActiveTab('home');
                      setSelectedCategory(null);
                    }}
                    className={`flex flex-col items-center gap-0.5 text-[9px] font-bold ${
                      activeTab === 'home' ? 'text-red-500 font-black' : 'text-gray-400'
                    }`}
                  >
                    <Trophy className="w-4 h-4" />
                    <span>{tPhone('ম্যাচ', 'Matches')}</span>
                  </button>

                  {/* 2. MY MATCHES */}
                  <button
                    onClick={() => setActiveTab('my-matches')}
                    className={`flex flex-col items-center gap-0.5 text-[9px] font-bold ${
                      activeTab === 'my-matches' ? 'text-red-500 font-black' : 'text-gray-400'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>{tPhone('আমার ম্যাচ', 'My Matches')}</span>
                  </button>

                  {/* 3. TOP PLAYERS */}
                  <button
                    onClick={() => setActiveTab('top-players')}
                    className={`flex flex-col items-center gap-0.5 text-[9px] font-bold ${
                      activeTab === 'top-players' ? 'text-amber-500 font-black' : 'text-gray-400'
                    }`}
                  >
                    <Award className={`w-4 h-4 ${activeTab === 'top-players' ? 'text-amber-500 animate-bounce' : ''}`} />
                    <span>{tPhone('টপ প্লেয়ার', 'Top Players')}</span>
                  </button>

                  {/* 4. WALLET */}
                  <button
                    onClick={() => setActiveTab('wallet')}
                    className={`flex flex-col items-center gap-0.5 text-[9px] font-bold ${
                      activeTab === 'wallet' ? 'text-red-500 font-black' : 'text-gray-400'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    <span>{tPhone('ওয়ালেট', 'Wallet')}</span>
                  </button>

                  {/* 5. PROFILE */}
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex flex-col items-center gap-0.5 text-[9px] font-bold ${
                      activeTab === 'profile' ? 'text-red-500 font-black' : 'text-gray-400'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>{tPhone('প্রোফাইল', 'Profile')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Architecture & Feature Highlights */}
          {!isMobileView && (
            <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-900/50">
                {tPhone('নতুন ডিজাইন: ইমেজ ১, ২ ও ৩ হুবহু বাস্তবায়িত', 'New Design: Image 1, 2 & 3 Exactly Implemented')}
              </span>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">
                {tPhone(
                  'রুম রুলস, রেজিস্টার্ড প্লেয়ার্স ও টোটাল প্রাইজ ডিটেইলস',
                  'Room Rules, Registered Participants & Total Prize Details'
                )}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {tPhone(
                  'আপনার আপলোড করা ৩টি ছবির আদলে মোবাইল অ্যাপ ও ওয়েবসাইটের কার্ড সম্পূর্ণ আপডেট করা হয়েছে:',
                  'The mobile app and web match cards now match your uploaded screenshots:'
                )}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-red-600">
                    <Key className="w-4 h-4" />
                    {tPhone('Room Rules ⌄ (ছবি ১ ও ৩)', 'Room Rules ⌄ (Img 1 & 3)')}
                  </div>
                  <p className="text-xs text-gray-500">
                    {tPhone(
                      'রুম ডিটেইলস এর বদলে Room Rules বোতাম। নিচে ফেসবুক সাপোর্ট নোটিশ ও নিবন্ধিত খেলোয়াড়দের তালিকা।',
                      'Replaced room details with Room Rules. Shows support notice and Registered Participants list.'
                    )}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-600">
                    <Trophy className="w-4 h-4" />
                    {tPhone('Total Prize Details (ছবি ২)', 'Total Prize Details (Img 2)')}
                  </div>
                  <p className="text-xs text-gray-500">
                    {tPhone(
                      'হলুদ হেডার ও সাদা কার্ডে Winner, 2nd, 3rd এবং Per Kill টাকার হিসেব পপআপ।',
                      'Yellow header and clean card showing Winner, 2nd, 3rd, and Per Kill BDT payout.'
                    )}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-blue-500">
                    <Clock className="w-4 h-4" />
                    {tPhone('STARTS IN কাউন্টডাউন', 'STARTS IN Countdown')}
                  </div>
                  <p className="text-xs text-gray-500">
                    {tPhone(
                      'সবুজ বারে ম্যাচ শুরুর সময় ও ৩টি কলামের ৬টি স্ট্যাট গ্রিড (WIN PRIZE, ENTRY, VERSION etc)।',
                      'Green countdown bar and 6-stat grid matching the exact layout of Image 1.'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Navigation Links */}
            <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                {tPhone('কুইক নেভিগেশন ও টেস্ট', 'Quick Navigation & Testing')}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {tPhone(
                  'ওয়েবসাইটের সম্পূর্ণ লিডারবোর্ড দেখতে বা অ্যাডমিন থেকে নিয়ন্ত্রণ করতে পারেন:',
                  'Inspect web leaderboards or manage match schedules in the admin panel:'
                )}
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/leaderboard"
                  className="px-5 py-3 rounded-xl text-xs font-black bg-amber-500 text-black hover:bg-amber-400 transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Trophy className="w-4 h-4" /> {tPhone('ওয়েবসাইটের সম্পূর্ণ লিডারবোর্ড দেখুন', 'View Full Web Leaderboard')}
                </Link>

                <Link
                  href="/admin"
                  className="px-5 py-3 rounded-xl text-xs font-black btn-red flex items-center gap-1.5 shadow-md shadow-red-600/20"
                >
                  <Shield className="w-4 h-4" /> {tPhone('অ্যাডমিন প্যানেল', 'Admin Panel')}
                </Link>

                <Link
                  href="/"
                  className="px-5 py-3 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-900 dark:text-white transition-all flex items-center gap-1.5"
                >
                  {tPhone('হোমপেজে যান', 'Go to Homepage')}
                </Link>
              </div>
            </div>
            </div>
          )}
        </div>
      </div>

      {/* 1. ROOM DETAILS MODAL (FALLBACK) */}
      {roomDetailsMatch && (
        <RoomDetailsModal
          match={roomDetailsMatch}
          onClose={() => setRoomDetailsMatch(null)}
          onJoinClick={() => {
            const m = roomDetailsMatch;
            setRoomDetailsMatch(null);
            setBookingModalMatch(m);
          }}
        />
      )}

      {/* 2. DYNAMIC 12-TEAM SQUAD SLOT BOOKING MODAL WITH FREE FIRE UID VERIFICATION */}
      {bookingModalMatch && (
        <SlotBookingModal
          match={bookingModalMatch}
          userBalance={userBalance}
          onClose={() => setBookingModalMatch(null)}
          onSuccess={handleBookingSuccess}
        />
      )}

      {/* 3. RICH BILINGUAL PLAYER DETAILS MODAL */}
      {selectedPlayerForDetails && (
        <PlayerDetailsModal
          player={selectedPlayerForDetails}
          language={phoneLang}
          onClose={() => setSelectedPlayerForDetails(null)}
        />
      )}

      {/* 4. TOTAL PRIZE DETAILS MODAL (EXACT USER IMAGE 2) */}
      {totalPrizeMatch && (
        <TotalPrizeDetailsModal
          match={totalPrizeMatch}
          language={phoneLang}
          onClose={() => setTotalPrizeMatch(null)}
        />
      )}

      {/* 5. DEPOSIT & WITHDRAW MODAL */}
      {showFinanceModal && (
        <DepositWithdrawModal
          isOpen={showFinanceModal}
          initialTab={financeModalTab}
          onClose={() => setShowFinanceModal(false)}
        />
      )}

      {/* 6. AUTH LOGIN & REGISTER MODAL FOR MOBILE CLIENT */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#12121a] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden p-6 space-y-4">
            <button
              onClick={() => {
                setShowAuthModal(false);
                setAuthError(null);
                setAuthSuccess(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-red-600 mx-auto flex items-center justify-center text-white shadow-lg shadow-red-600/30">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">
                {authMode === 'LOGIN' ? 'অ্যাকাউন্টে লগইন করুন' : 'নতুন প্লেয়ার রেজিস্টার'}
              </h3>
              <p className="text-[11px] text-gray-400">
                {authMode === 'LOGIN'
                  ? 'আপনার ফোন নম্বর ও পাসওয়ার্ড দিয়ে প্রবেশ করুন'
                  : 'IGN ও UID দিয়ে অ্যাকাউন্ট খুলুন এবং ১০০ টাকা বোনাস পান'}
              </p>
            </div>

            {/* Auth Mode Toggle */}
            <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('LOGIN');
                  setAuthError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                  authMode === 'LOGIN' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
              >
                লগইন (Login)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('REGISTER');
                  setAuthError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                  authMode === 'REGISTER' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
              >
                রেজিস্টার (Register)
              </button>
            </div>

            {authError && (
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold text-center">
                {authError}
              </div>
            )}
            {authSuccess && (
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold text-center flex items-center justify-center gap-1">
                <CheckCircle className="w-4 h-4" /> {authSuccess}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  মোবাইল নম্বর (Phone Number)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="017XXXXXXXX"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              {authMode === 'REGISTER' && (
                <>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      ইন-গেম নেম (In-Game Name / IGN)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. OP_STRIKER"
                      value={authIgn}
                      onChange={(e) => setAuthIgn(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      ফ্রি ফায়ার ইউআইডি (Free Fire UID)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 192837465"
                      value={authUid}
                      onChange={(e) => setAuthUid(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  পাসওয়ার্ড (Password)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg shadow-red-600/30 disabled:opacity-50"
              >
                {authLoading
                  ? 'অপেক্ষা করুন...'
                  : authMode === 'LOGIN'
                  ? 'লগইন করুন'
                  : 'রেজিস্ট্রেশন সম্পূর্ণ করুন'}
              </button>
            </form>

            {/* 1-Click Fast Fill for 5 Owners */}
            <div className="pt-2 border-t border-gray-200 dark:border-white/10 space-y-1.5">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider block text-center flex items-center justify-center gap-1">
                <Shield className="w-3 h-3 text-amber-500" /> ওনার / অ্যাডমিন আইডি (১-ক্লিক লগইন)
              </span>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { label: 'ওনার ১', phone: '01700000001', pass: 'admin@owner1' },
                  { label: 'ওনার ২', phone: '01700000002', pass: 'admin@owner2' },
                  { label: 'ওনার ৩', phone: '01700000003', pass: 'admin@owner3' },
                  { label: 'ওনার ৪', phone: '01700000004', pass: 'admin@owner4' },
                  { label: 'ওনার ৫', phone: '01700000005', pass: 'admin@owner5' },
                  { label: 'মাস্টার', phone: '01700000000', pass: 'admin123' },
                ].map((adm) => (
                  <button
                    key={adm.phone}
                    type="button"
                    onClick={() => fillAuthDemo(adm.phone, adm.pass)}
                    className="p-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-center border border-amber-500/25"
                  >
                    <div className="text-[9px] font-black text-amber-500">{adm.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
