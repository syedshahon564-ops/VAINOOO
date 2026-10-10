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
  EyeOff,
  Check,
  X,
  Volume2,
  Globe,
  Sparkles,
  ExternalLink,
  Radio,
  ChevronLeft,
  Camera,
  ArrowDownRight,
  ArrowUpRight,
  LogOut,
  LogIn,
  Gamepad2,
  Coins,
  Lock,
  Phone,
  Download,
  RefreshCw,
  LifeBuoy,
  BookOpen,
  Crown,
  AlertCircle,
  Headphones,
  Code,
  Edit,
  Mail,
  Home,
} from 'lucide-react';
import { useCMS, MatchItem, TopPlayerItem } from '@/lib/cms-store';
import { checkFreeFireUID } from '@/lib/ff-uid-checker';
import RoomDetailsModal from '@/components/RoomDetailsModal';
import SlotBookingModal from '@/components/SlotBookingModal';
import PlayerDetailsModal, { PlayerDetailsData } from '@/components/PlayerDetailsModal';
import TotalPrizeDetailsModal from '@/components/TotalPrizeDetailsModal';
import MatchDetailsPage from '@/components/MatchDetailsPage';
import ImageUploadInput from '@/components/ImageUploadInput';
import LiveMatchCountdown, { formatMatchSchedule, parseScheduleTimeToDate } from '@/components/LiveMatchCountdown';
import DepositWithdrawModal from '@/components/DepositWithdrawModal';
import SupportTicketModal from '@/components/SupportTicketModal';
import SupportChatScreen from '@/components/SupportChatScreen';
import { SupportTicket } from '@/lib/support-store';
import { useLanguage } from '@/components/LanguageProvider';
import {
  getCurrentUser,
  loginUser,
  registerUser,
  logoutUser,
  updateUser,
  addBalance,
  deductBalance,
  getTransactions,
  hasUserJoinedMatch,
  recordUserJoinedMatch,
  UserAccount,
} from '@/lib/user-store';
import {
  getNotifications,
  markNotificationsAsRead,
  AppNotification,
  getUserBookedMatches,
  saveUserBookedMatches,
  addUserBooking,
  autoDeliverRoomCredentials,
  runBotRoomManagerCycle,
  UserBookedMatch,
  requestNotificationPermission,
  dispatchDevicePushNotification,
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

  const [mounted, setMounted] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [forceFullscreen, setForceFullscreen] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  const isMobileView = standalone || (mounted && (isMobileScreen || forceFullscreen));

  // Active Tab & Screen Navigation
  const [activeTab, setActiveTab] = useState<'home' | 'my-matches' | 'top-players' | 'wallet' | 'profile'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryTab, setCategoryTab] = useState<'PLAY' | 'RESULT'>('PLAY');

  // Phone Theme & Language (Light White Mode permanent)
  const [phoneTheme, setPhoneTheme] = useState<'dark' | 'light'>('light');
  const [phoneLang, setPhoneLang] = useState<'bn' | 'en'>(globalLang || 'bn');

  // Esports Splash Loading State
  const [appLoading, setAppLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(25);
  const [loadingStatusText, setLoadingStatusText] = useState('টুর্নামেন্ট সার্ভারের সাথে কানেক্ট হচ্ছে...');

  useEffect(() => {
    const t1 = setTimeout(() => {
      setLoadingProgress(65);
      setLoadingStatusText('অ্যান্টি-চিট সিকিউরিটি ও টুর্নামেন্ট ভেরিফাই হচ্ছে...');
    }, 450);

    const t2 = setTimeout(() => {
      setLoadingProgress(100);
      setLoadingStatusText('স্বাগতম! অ্যাপ প্রস্তুত...');
    }, 950);

    const t3 = setTimeout(() => {
      setAppLoading(false);
    }, 1350);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Interactive Carousel Banner State
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const bannerSlides = React.useMemo(() => {
    if (settings?.banners && settings.banners.length > 0) {
      return settings.banners;
    }
    return [
      {
        id: 'slide-1',
        badge: 'FF RIVAL TOUR BD 2026',
        title: phoneLang === 'en' ? 'Daily Free Fire Tournaments Live!' : 'দৈনিক ফ্রি ফায়ার টুর্নামেন্ট লাইভ!',
        subtitle: phoneLang === 'en' ? 'Low Entry Fee • Instant bKash & Nagad Withdraw' : 'স্বল্প এন্ট্রি ফি • দ্রুত বিকাশ ও নগদে প্রাইজ উইথড্র',
        image: '/logo.png',
      },
      {
        id: 'slide-2',
        badge: 'MEGA CASH PRIZE',
        title: phoneLang === 'en' ? 'Squad & Solo Daily Match Hub' : 'স্কোয়াড ও সোলো মেগা প্রাইজ টুর্নামেন্ট',
        subtitle: phoneLang === 'en' ? 'Fast Automatic Room Pass in My Matches' : 'ম্যাচ শুরুর আগে মাই ম্যাচেসে দ্রুত রুম আইডি ও পাসওয়ার্ড',
        image: '/logo.png',
      },
    ];
  }, [settings?.banners, phoneLang]);

  useEffect(() => {
    if (bannerSlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % bannerSlides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [bannerSlides.length]);

  // Copying & Feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [joinedSuccess, setJoinedSuccess] = useState(false);
  const [userBalance, setUserBalance] = useState(0.0);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOverlayModal, setShowOverlayModal] = useState(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authIgn, setAuthIgn] = useState('');
  const [authUid, setAuthUid] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Profile modal states (matching uploaded user screenshot)
  const [showEditInfoModal, setShowEditInfoModal] = useState(false);
  const [editIgnInput, setEditIgnInput] = useState('');
  const [editUidInput, setEditUidInput] = useState('');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [passMessage, setPassMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showDevInfoModal, setShowDevInfoModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Auto-prompt login/register on first entry for new visitors
  useEffect(() => {
    const cur = getCurrentUser();
    if (!cur) {
      const hasPrompted = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('ff_auth_prompted_once') : null;
      if (!hasPrompted) {
        setShowAuthModal(true);
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('ff_auth_prompted_once', '1');
        }
      }
    }
  }, []);

  // Pull-to-refresh state
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartYRef = React.useRef(0);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop <= 2) {
      touchStartYRef.current = e.touches[0].clientY;
    } else {
      touchStartYRef.current = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartYRef.current || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartYRef.current;
    if (diff > 0 && scrollContainerRef.current && scrollContainerRef.current.scrollTop <= 2) {
      const dist = Math.min(75, diff * 0.45);
      setPullDistance(dist);
      setIsPulling(true);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 45 && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(45);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ff_cms_updated'));
      }
      const cur = getCurrentUser();
      if (cur) setCurrentUser(cur);
      await new Promise((r) => setTimeout(r, 650));
      setIsRefreshing(false);
    }
    setIsPulling(false);
    setPullDistance(0);
    touchStartYRef.current = 0;
  };

  const handleUidChange = async (val: string) => {
    setAuthUid(val);
    const clean = val.trim().replace(/\D/g, '');
    if (clean.length >= 8 && (!authIgn || authIgn.startsWith('OP_') || authIgn.startsWith('BD_') || authIgn.startsWith('RIVAL_'))) {
      try {
        const profile = await checkFreeFireUID(clean);
        if (profile.isValid && profile.ign) {
          setAuthIgn(profile.ign);
        }
      } catch {}
    }
  };

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
  const [showPushBanner, setShowPushBanner] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [activeChatTicket, setActiveChatTicket] = useState<SupportTicket | null>(null);
  const [edgeTouchStart, setEdgeTouchStart] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        setShowPushBanner(true);
      }
    }
  }, []);

  const handleEnablePushNotification = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setShowPushBanner(false);
      dispatchDevicePushNotification(
        '🔔 নোটিফিকেশন চালু হয়েছে!',
        'ম্যাচের রুম আইডি ও পাসওয়ার্ড ডেলিভারি হওয়ার সাথে সাথে নোটিফিকেশন পাবেন।'
      );
    } else {
      setShowPushBanner(false);
    }
  };

  // In-app History and Slide-Back Manager
  const pushHistory = (screenName: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({ screen: screenName, time: Date.now() }, '');
    }
  };

  const handleInAppBack = () => {
    if (activeChatTicket) {
      setActiveChatTicket(null);
      return true;
    }
    if (showSupportModal) {
      setShowSupportModal(false);
      return true;
    }
    if (roomDetailsMatch) {
      setRoomDetailsMatch(null);
      return true;
    }
    if (bookingModalMatch) {
      setBookingModalMatch(null);
      return true;
    }
    if (showFinanceModal) {
      setShowFinanceModal(false);
      return true;
    }
    if (showAuthModal) {
      setShowAuthModal(false);
      return true;
    }
    if (selectedCategory) {
      setSelectedCategory(null);
      return true;
    }
    if (showNotifDropdown) {
      setShowNotifDropdown(false);
      return true;
    }
    if (activeTab !== 'home') {
      setActiveTab('home');
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onPopState = (e: PopStateEvent) => {
      // Smoothly navigate back inside app instead of closing/exiting the whole app
      handleInAppBack();
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [
    activeChatTicket,
    showSupportModal,
    roomDetailsMatch,
    bookingModalMatch,
    showFinanceModal,
    showAuthModal,
    selectedCategory,
    showNotifDropdown,
    activeTab,
  ]);

  // Translation helper for the phone side
  const tPhone = (bn: string, en: string) => (phoneLang === 'en' ? en : bn);

  const setLanguageTo = (next: 'bn' | 'en') => {
    setPhoneLang(next);
    setGlobalLang(next);
    try {
      localStorage.setItem('ff_lang', next);
    } catch {}
  };

  const togglePhoneLang = () => {
    const next = phoneLang === 'bn' ? 'en' : 'bn';
    setLanguageTo(next);
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
        if (res.user) setCurrentUser(res.user);
        setAuthSuccess(`রেজিস্ট্রেশন সফল! স্বাগতম ${res.user?.ign}`);
        setTimeout(() => {
          setShowAuthModal(false);
          setAuthSuccess(null);
        }, 800);
      } else {
        if (!authPhone || !authPassword) {
          throw new Error('ফোন নম্বর বা ওনার আইডি এবং পাসওয়ার্ড লিখুন');
        }
        const res = loginUser(authPhone.trim(), authPassword);
        if (!res.success) throw new Error(res.error || 'লগইন ব্যর্থ হয়েছে।');
        if (res.user) setCurrentUser(res.user);
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


  // Booked matches list (hydrated from persistent storage, starts 0)
  const [bookedMatchesList, setBookedMatchesList] = useState<UserBookedMatch[]>([]);
  const [botToast, setBotToast] = useState<string | null>(null);

  const showPhoneToast = (msg: string) => {
    setBotToast(msg);
    setTimeout(() => setBotToast(null), 3000);
  };

  useEffect(() => {
    // Hydrate user booked matches from persistent storage
    const storedBookings = getUserBookedMatches();
    if (storedBookings.length > 0) {
      setBookedMatchesList(storedBookings);
    }

    const handleBookingsUpdated = (e: any) => {
      setBookedMatchesList(e.detail || getUserBookedMatches());
    };
    const handleCredentialsDelivered = () => {
      setBookedMatchesList(getUserBookedMatches());
    };

    window.addEventListener('ff_user_bookings_updated', handleBookingsUpdated);
    window.addEventListener('ff_room_credentials_delivered', handleCredentialsDelivered);

    // Initial check & interval runner for Bot Room Credentials Manager
    runBotRoomManagerCycle();
    const botInterval = setInterval(() => {
      runBotRoomManagerCycle();
    }, 4000);

    return () => {
      window.removeEventListener('ff_user_bookings_updated', handleBookingsUpdated);
      window.removeEventListener('ff_room_credentials_delivered', handleCredentialsDelivered);
      clearInterval(botInterval);
    };
  }, []);

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
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      }
    } catch (e) {}
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
          `ম্যাচ স্লট বুকিং: ${bookingModalMatch.title}`,
          'match_join'
        );
        recordUserJoinedMatch(bookingModalMatch.id, current, {
          ign: slotInfo.ign,
          uid: slotInfo.uid,
          slot: slotInfo.slotNumber,
        });
      } else {
        recordUserJoinedMatch(bookingModalMatch.id, null, {
          ign: slotInfo.ign,
          uid: slotInfo.uid,
          slot: slotInfo.slotNumber,
        });
      }
      setUserBalance((prev) => Math.max(0, prev - bookingModalMatch.entryFee));

      const registeredCount =
        slotInfo.players && slotInfo.players.length > 0 ? slotInfo.players.length : 1;

      const newParticipantItems =
        slotInfo.players && slotInfo.players.length > 0
          ? slotInfo.players.map((p) => ({
              ign: p.ign,
              uid: p.uid,
              slot: slotInfo.slotNumber,
              team: slotInfo.teamNumber,
            }))
          : [
              {
                ign: slotInfo.ign,
                uid: slotInfo.uid,
                slot: slotInfo.slotNumber,
                team: slotInfo.teamNumber,
              },
            ];

      const existingParticipants = bookingModalMatch.participants || [];
      const updatedParticipants = [...existingParticipants, ...newParticipantItems];

      updateMatch(bookingModalMatch.id, {
        filledSlots: Math.min(
          bookingModalMatch.totalSlots,
          (bookingModalMatch.filledSlots || 0) + registeredCount
        ),
        participants: updatedParticipants,
      });

      const newEntries: UserBookedMatch[] =
        slotInfo.players && slotInfo.players.length > 0
          ? slotInfo.players.map((p) =>
              addUserBooking({
                matchId: bookingModalMatch.id,
                categorySlug: bookingModalMatch.categorySlug,
                title: bookingModalMatch.title,
                map: bookingModalMatch.map,
                type: bookingModalMatch.type,
                slot: slotInfo.slotNumber,
                team: slotInfo.teamNumber,
                ign: p.ign,
                uid: p.uid,
                time: bookingModalMatch.time,
                roomId: bookingModalMatch.status === 'ROOM_OPEN' ? bookingModalMatch.roomId : undefined,
                roomPass: bookingModalMatch.status === 'ROOM_OPEN' ? bookingModalMatch.roomPass : undefined,
              })
            )
          : [
              addUserBooking({
                matchId: bookingModalMatch.id,
                categorySlug: bookingModalMatch.categorySlug,
                title: bookingModalMatch.title,
                map: bookingModalMatch.map,
                type: bookingModalMatch.type,
                slot: slotInfo.slotNumber,
                team: slotInfo.teamNumber,
                ign: slotInfo.ign,
                uid: slotInfo.uid,
                time: bookingModalMatch.time,
                roomId: bookingModalMatch.status === 'ROOM_OPEN' ? bookingModalMatch.roomId : undefined,
                roomPass: bookingModalMatch.status === 'ROOM_OPEN' ? bookingModalMatch.roomPass : undefined,
              }),
            ];

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

  const [subTypeFilter, setSubTypeFilter] = useState<'ALL' | 'SOLO' | 'DUO' | 'SQUAD'>('ALL');
  const filteredCurrentMatches = React.useMemo(() => {
    return currentCategoryMatches.filter((m) => {
      if (subTypeFilter === 'ALL') return true;
      const typeStr = (m.type || m.matchType || '').toUpperCase();
      const titleStr = (m.title || '').toUpperCase();
      if (subTypeFilter === 'SOLO') {
        return (
          typeStr.includes('SOLO') ||
          titleStr.includes('SOLO') ||
          titleStr.includes('সোলো') ||
          (m.totalSlots <= 2 && !typeStr.includes('DUO') && !titleStr.includes('DUO'))
        );
      }
      if (subTypeFilter === 'DUO') {
        return typeStr.includes('DUO') || titleStr.includes('DUO') || titleStr.includes('ডুও');
      }
      if (subTypeFilter === 'SQUAD') {
        return (
          typeStr.includes('SQUAD') ||
          titleStr.includes('SQUAD') ||
          titleStr.includes('স্কোয়াড') ||
          typeStr.includes('4V4') ||
          titleStr.includes('4V4')
        );
      }
      return true;
    });
  }, [currentCategoryMatches, subTypeFilter]);

  if (appLoading) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#07070d] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden animate-fadeIn">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 w-72 h-72 bg-red-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center space-y-6 max-w-xs w-full">
          {/* Logo with esports pulsing aura */}
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-red-600 via-rose-700 to-amber-500 p-1 shadow-2xl shadow-red-600/40 animate-pulse">
              <div className="w-full h-full rounded-[22px] bg-black/90 p-2.5 flex items-center justify-center backdrop-blur-md">
                <img
                  src="/logo.png"
                  alt="FF Rivals Tour BD"
                  className="w-full h-full object-contain filter drop-shadow-md"
                />
              </div>
            </div>
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-black tracking-widest uppercase border border-red-400 shadow-md">
              LIVE ARENA
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wider uppercase">
              FF RIVAL <span className="text-red-500">TOUR BD</span>
            </h1>
            <p className="text-gray-400 text-xs font-bold tracking-wide">
              {loadingStatusText}
            </p>
          </div>

          {/* Progress Bar & Counter */}
          <div className="w-full space-y-2 pt-2">
            <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden border border-white/10 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-400 transition-all duration-300 ease-out shadow-lg shadow-red-500/50"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono font-bold px-1">
              <span className="text-emerald-400 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Anti-Cheat Active
              </span>
              <span className="text-amber-400">{loadingProgress}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        isMobileView
          ? 'w-full min-h-screen transition-colors'
          : 'min-h-screen bg-slate-100 dark:bg-[#07070a] py-8 px-4 transition-colors'
      }
    >
      {/* Bot Action Toast */}
      {botToast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[110] bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-2xl animate-bounce flex items-center gap-2 border border-emerald-400">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{botToast}</span>
        </div>
      )}

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
                onTouchStart={(e) => {
                  const t = e.touches[0];
                  if (t.clientX < 45) {
                    setEdgeTouchStart({ x: t.clientX, y: t.clientY });
                  }
                }}
                onTouchEnd={(e) => {
                  if (!edgeTouchStart) return;
                  const t = e.changedTouches[0];
                  const deltaX = t.clientX - edgeTouchStart.x;
                  const deltaY = Math.abs(t.clientY - edgeTouchStart.y);
                  if (deltaX > 65 && deltaX > deltaY) {
                    handleInAppBack();
                  }
                  setEdgeTouchStart(null);
                }}
                className={`relative w-full ${
                  isMobileView ? 'min-h-screen rounded-none' : 'h-full rounded-[40px]'
                } overflow-hidden flex flex-col font-sans bg-white text-gray-900`}
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
                  <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 px-3.5 py-2 text-white flex items-center justify-between text-xs font-bold select-none z-40 shadow-sm">
                    <div className="flex items-center gap-1.5 truncate">
                      <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0 animate-pulse" />
                      <span className="truncate text-[11px] font-bold">
                        {tPhone('টুর্নামেন্টে খেলতে ও উইথড্র করতে লগইন করুন!', 'Sign in to join tournaments & withdraw!')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      <button
                        onClick={() => {
                          setAuthMode('LOGIN');
                          setShowAuthModal(true);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-white text-red-600 font-black text-xs hover:bg-gray-100 shadow-md active:scale-95 transition-all"
                      >
                        {tPhone('লগইন', 'Login')}
                      </button>
                      <button
                        onClick={() => {
                          setAuthMode('REGISTER');
                          setShowAuthModal(true);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-black/50 text-white font-black text-xs hover:bg-black/70 border border-white/30 active:scale-95 transition-all"
                      >
                        {tPhone('রেজিস্টার', 'Register')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Mobile App Header (Matching Image 1 when in category: < Solo Full Map) */}
                <div
                  className="px-4 py-3 flex items-center justify-between border-b border-gray-200 bg-white relative z-30 shadow-sm"
                >
                  {selectedCategory && currentCategoryData ? (
                    /* EXACT IMAGE 1 TOP HEADER: < Solo Full Map */
                    <div className="w-full flex items-center justify-between">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="flex items-center gap-2 text-sm font-black text-gray-900 hover:text-red-600 transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4 text-gray-800" />
                        <span>{currentCategoryData.name}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {/* In-app Language Switcher */}
                        <div className="flex items-center rounded-full bg-slate-100 p-0.5 border border-slate-300 text-[9px] font-black shadow-inner">
                          <button
                            type="button"
                            onClick={() => setLanguageTo('en')}
                            className={`px-2 py-0.5 rounded-full transition-all ${
                              phoneLang === 'en'
                                ? 'bg-red-600 text-white shadow-xs font-black'
                                : 'text-slate-600 hover:text-slate-900 font-bold'
                            }`}
                          >
                            EN
                          </button>
                          <button
                            type="button"
                            onClick={() => setLanguageTo('bn')}
                            className={`px-2 py-0.5 rounded-full transition-all ${
                              phoneLang === 'bn'
                                ? 'bg-red-600 text-white shadow-xs font-black'
                                : 'text-slate-600 hover:text-slate-900 font-bold'
                            }`}
                          >
                            বাংলা
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : activeTab === 'profile' ? (
                    /* EXACT PROFILE TOP HEADER (AS IN USER SCREENSHOT) */
                    <div className="w-full flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-900 border border-slate-700 flex items-center justify-center p-0.5 shadow-xs">
                          <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <span className="text-sm font-black text-[#1e293b]">
                            Murubbi X Tournament
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Notification Bell with red badge */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowNotifDropdown(!showNotifDropdown);
                            if (!showNotifDropdown) {
                              markNotificationsAsRead();
                            }
                          }}
                          className="relative w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-all shadow-xs"
                        >
                          <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-amber-500' : 'text-slate-700'}`} />
                          {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          )}
                        </button>

                        {/* Balance Pill [ 🪙 0.00 BDT ] */}
                        <button
                          type="button"
                          onClick={() => setActiveTab('wallet')}
                          className="px-2.5 py-1 rounded-full bg-[#4f46e5] hover:bg-[#4338ca] text-white text-[11px] font-black flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                        >
                          <Wallet className="w-3.5 h-3.5 text-white" />
                          <span>{userBalance.toFixed(2)} BDT</span>
                        </button>

                        {/* Circular User Avatar Preview */}
                        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-red-500 bg-slate-900 shadow-xs flex-shrink-0">
                          <img
                            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=240'}
                            alt="User"
                            className="w-full h-full object-cover"
                          />
                        </div>
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
                        {currentUser?.role === 'ADMIN' && (
                          <Link
                            href="/admin"
                            className="px-2.5 py-1 rounded-full text-[9px] font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-black border border-amber-300 shadow-sm flex items-center gap-1"
                            title="Admin / Owner Panel"
                          >
                            <span>👑 ওনার প্যানেল</span>
                          </Link>
                        )}
                        <div className="flex items-center rounded-full bg-slate-100 p-0.5 border border-slate-300 text-[9px] font-black shadow-inner">
                          <button
                            type="button"
                            onClick={() => setLanguageTo('en')}
                            className={`px-2 py-0.5 rounded-full transition-all ${
                              phoneLang === 'en'
                                ? 'bg-red-600 text-white shadow-xs font-black'
                                : 'text-slate-600 hover:text-slate-900 font-bold'
                            }`}
                          >
                            EN
                          </button>
                          <button
                            type="button"
                            onClick={() => setLanguageTo('bn')}
                            className={`px-2 py-0.5 rounded-full transition-all ${
                              phoneLang === 'bn'
                                ? 'bg-red-600 text-white shadow-xs font-black'
                                : 'text-slate-600 hover:text-slate-900 font-bold'
                            }`}
                          >
                            বাংলা
                          </button>
                        </div>

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

                        <button
                          onClick={() => {
                            setShowSupportModal(true);
                            pushHistory('support-modal');
                          }}
                          title="লাইভ সাপোর্ট হেল্প ডেস্ক"
                          className={`p-1.5 rounded-full relative transition-all ${
                            phoneTheme === 'dark'
                              ? 'bg-white/5 text-gray-400 hover:text-white'
                              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <LifeBuoy className="w-3.5 h-3.5 text-blue-500" />
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

                {/* Mobile Push Notification Permission Request Banner */}
                {showPushBanner && (
                  <div className="bg-gradient-to-r from-red-950 via-black to-red-950 border-b border-red-500/30 text-white px-3 py-2 flex items-center justify-between gap-2 shadow-md animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-red-600/30 border border-red-500/50 flex items-center justify-center text-amber-400">
                        <Bell className="w-3.5 h-3.5 animate-bounce" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-amber-300">🔔 নোটিফিকেশন ও ওভারলে পারমিশন</p>
                        <p className="text-[8px] text-gray-300">রুম আইডি ও পাসওয়ার্ড গেমের ওপরে পেতে অন করুন</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleEnablePushNotification}
                        className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[9px] font-black shadow transition-all active:scale-95"
                      >
                        অন করুন
                      </button>
                      <button
                        onClick={() => setShowOverlayModal(true)}
                        className="px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[9px] font-black shadow transition-all active:scale-95"
                      >
                        ওভারলে গাইড
                      </button>
                      <button
                        onClick={() => setShowPushBanner(false)}
                        className="p-1 text-gray-400 hover:text-white"
                        title="বন্ধ করুন"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Success Banner */}
                {joinedSuccess && (
                  <div className="bg-emerald-600 text-white text-xs px-3 py-2 text-center font-bold flex items-center justify-center gap-1.5 animate-pulse">
                    <CheckCircle className="w-4 h-4" /> {tPhone('ম্যাচ স্লট বুকিং সফল হয়েছে!', 'Match slot booking confirmed!')}
                  </div>
                )}

                {/* SCROLLABLE BODY with Touch Pull-to-Refresh */}
                <div
                  ref={scrollContainerRef}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className="flex-1 overflow-y-auto p-3 space-y-3 relative"
                >
                  {/* Pull-to-refresh spinner indicator */}
                  {(isPulling || isRefreshing) && (
                    <div
                      className="flex items-center justify-center transition-all duration-150 overflow-hidden"
                      style={{ height: `${pullDistance}px` }}
                    >
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 text-white text-[10px] font-bold shadow-lg">
                        <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span>{isRefreshing ? 'রিফ্রেশ হচ্ছে...' : 'ছেড়ে দিলে রিফ্রেশ হবে'}</span>
                      </div>
                    </div>
                  )}

                  {/* FULL DETAILS PAGE (Screenshot 4, 3, 2, 1) */}
                  {matchDetailsScreen ? (
                    <MatchDetailsPage
                      match={
                        matches.find((m) => m.id === matchDetailsScreen.id) || matchDetailsScreen
                      }
                      participants={
                        (matches.find((m) => m.id === matchDetailsScreen.id)?.participants) ||
                        bookedMatchesList
                          .filter((bm) => bm.title === matchDetailsScreen.title)
                          .map((bm) => ({
                            ign: bm.ign,
                            uid: bm.uid,
                            slot: bm.slot,
                            team: bm.team,
                          }))
                      }
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
                          <div className="grid grid-cols-2 p-1 rounded-xl border border-gray-200 bg-gray-100 text-xs font-black shadow-inner">
                            <button
                              onClick={() => setCategoryTab('PLAY')}
                              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all text-xs ${
                                categoryTab === 'PLAY'
                                    ? 'bg-red-600 text-white shadow font-black'
                                  : 'text-gray-600 hover:text-gray-900 font-bold'
                              }`}
                            >
                              <span>
                                {tPhone('সক্রিয় ম্যাচ', 'Active Matches')} ({filteredCurrentMatches.length})
                              </span>
                            </button>
                            <button
                              onClick={() => setCategoryTab('RESULT')}
                              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all text-xs ${
                                categoryTab === 'RESULT'
                                  ? 'bg-red-600 text-white shadow font-black'
                                  : 'text-gray-600 hover:text-gray-900 font-bold'
                              }`}
                            >
                              <Award className="w-3.5 h-3.5 text-amber-500" />
                              <span>
                                {tPhone('ম্যাচ ফলাফল', 'Match Results')} ({completedCategoryMatches.length})
                              </span>
                            </button>
                          </div>

                          {/* Match Sub-Type Switcher (Solo, Duo, Squad) */}
                          <div className="flex items-center gap-1 p-1 rounded-xl border border-gray-200 bg-white shadow-xs">
                            {[
                              { key: 'ALL', labelBn: 'সব ম্যাচ', labelEn: 'All' },
                              { key: 'SOLO', labelBn: 'সোলো (Solo)', labelEn: 'Solo' },
                              { key: 'DUO', labelBn: 'ডুও (Duo)', labelEn: 'Duo' },
                              { key: 'SQUAD', labelBn: 'স্কোয়াড (Squad)', labelEn: 'Squad' },
                            ].map((item) => (
                              <button
                                key={item.key}
                                type="button"
                                onClick={() => setSubTypeFilter(item.key as any)}
                                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all text-center ${
                                  subTypeFilter === item.key
                                    ? 'bg-red-600 text-white shadow font-black'
                                    : 'text-gray-600 hover:text-gray-900 font-bold'
                                }`}
                              >
                                {tPhone(item.labelBn, item.labelEn)}
                              </button>
                            ))}
                          </div>

                          {categoryTab === 'PLAY' ? (
                            filteredCurrentMatches.length === 0 ? (
                            <div className="p-8 text-center rounded-2xl border border-dashed border-gray-300 bg-white text-gray-500 space-y-2">
                              <Trophy className="w-8 h-8 mx-auto text-gray-400" />
                              <p className="text-xs font-bold text-gray-700">
                                {tPhone('বর্তমানে কোনো ম্যাচ নেই', 'No Matches Active Currently')}
                              </p>
                              <p className="text-[10px] text-gray-500">
                                {subTypeFilter !== 'ALL'
                                  ? tPhone(`এই ফিল্টারে (${subTypeFilter}) কোনো ম্যাচ পাওয়া যায়নি। অন্য ফিল্টার সিলেক্ট করুন।`, `No matches found for ${subTypeFilter}.`)
                                  : tPhone('অ্যাডমিন প্যানেল থেকে নতুন ম্যাচ শিডিউল করা হলে এখানে দেখতে পাবেন।', 'New tournaments will appear here when scheduled by Admin.')}
                              </p>
                            </div>
                          ) : (
                            filteredCurrentMatches.map((m) => {
                              const matchBookings = bookedMatchesList
                                .filter((bm) => bm.title === m.title)
                                .map((bm) => bm.ign);
                              const filled = m.filledSlots || matchBookings.length || 0;
                              const spotsLeft = Math.max(0, m.totalSlots - filled);

                              return (
                                <div
                                  key={m.id}
                                  className="p-3.5 rounded-2xl border border-gray-200 bg-white space-y-3 shadow-md transition-all"
                                >
                                  {/* 1. Top Notice Row with Left Thumbnail - Clickable to open Details Page */}
                                  <div
                                    onClick={() => setMatchDetailsScreen(m)}
                                    className="flex items-start gap-3 cursor-pointer hover:opacity-90 transition-opacity"
                                    title="Click to view full Details Page & Rules"
                                  >
                                    {/* Thumbnail on left */}
                                    <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-900 border border-amber-500/30 flex items-center justify-center relative shadow-sm">
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
                                      <p className="text-[10px] font-bold text-gray-800 leading-snug">
                                        কাস্টমে নিজের জায়গায় বসতে হবে বাধ্যতামূলক - আইডি লেভেল ৫৫+ থাকতে হবে -
                                        Normal {m.type} ম্যাচের নিয়ম পড়ে নিন, নিয়ম না মানলে রিফান্ড বা উইনিং
                                        পাবেন না! {settings?.siteName || 'FF RIVAL TOUR BD'}
                                      </p>
                                      <div className="flex items-center justify-between pt-1">
                                        <span className="text-[10px] font-extrabold text-rose-600">
                                          {formatMatchSchedule(m.time)}
                                        </span>
                                        <span className="text-[9px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 shadow-xs">
                                          Details Page ➔
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* 2. 6-Cell Stat Grid (Crisp White High-Contrast) */}
                                  <div className="grid grid-cols-3 gap-y-2 gap-x-1 py-2 text-center border-t border-b border-gray-100 bg-gray-50/70 rounded-xl my-1">
                                    <div>
                                      <span className="text-[9px] uppercase font-bold text-gray-500 block tracking-tight">
                                        WIN PRIZE
                                      </span>
                                      <span className="font-black text-rose-600 text-sm">
                                        {m.prizePool} TK
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] uppercase font-bold text-gray-500 block tracking-tight">
                                        ENTRY TYPE
                                      </span>
                                      <span className="font-black text-gray-900 text-xs">
                                        {m.type}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] uppercase font-bold text-gray-500 block tracking-tight">
                                        ENTRY FEE
                                      </span>
                                      <span className="font-black text-emerald-600 text-sm">
                                        {m.entryFee} TK
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] uppercase font-bold text-gray-500 block tracking-tight">
                                        {m.categorySlug === 'lone-wolf' ||
                                        m.categorySlug === 'clash-squad' ||
                                        m.categorySlug === 'cs-only-headshot' ||
                                        m.type === '1 vs 1' ||
                                        m.type === '2 vs 2' ||
                                        m.type === '4 vs 4' ||
                                        !m.perKill
                                          ? 'SLOTS'
                                          : 'PER KILL'}
                                      </span>
                                      <span className="font-black text-gray-900 text-xs">
                                        {m.categorySlug === 'lone-wolf' ||
                                        m.categorySlug === 'clash-squad' ||
                                        m.categorySlug === 'cs-only-headshot' ||
                                        m.type === '1 vs 1' ||
                                        m.type === '2 vs 2' ||
                                        m.type === '4 vs 4' ||
                                        !m.perKill
                                          ? `${m.totalSlots} SLOTS`
                                          : `${m.perKill} TK`}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] uppercase font-bold text-gray-500 block tracking-tight">
                                        MAP
                                      </span>
                                      <span className="font-black text-gray-900 text-xs">
                                        {m.map}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] uppercase font-bold text-gray-500 block tracking-tight">
                                        VERSION
                                      </span>
                                      <span className="font-black text-gray-900 text-xs">
                                        MOBILE
                                      </span>
                                    </div>
                                  </div>

                                  {/* 3. Progress Bar + Join Button Row */}
                                  <div className="flex items-center gap-3 pt-0.5">
                                    <div className="flex-1 space-y-1">
                                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
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
                                      <div className="flex items-center justify-between text-[9px] text-gray-500 font-bold">
                                        <span>Only {spotsLeft} spots are left</span>
                                        <span className="text-gray-800 font-extrabold">
                                          {filled}/{m.totalSlots}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Join / Joined Button */}
                                    {hasUserJoinedMatch(m.id, currentUser) ||
                                    bookedMatchesList.some((bm) => bm.matchId === m.id || bm.title === m.title) ||
                                    (currentUser &&
                                      (m.participants || []).some(
                                        (p) =>
                                          (currentUser.ign && p.ign && p.ign.toLowerCase() === currentUser.ign.toLowerCase()) ||
                                          (currentUser.uid && p.uid && p.uid === currentUser.uid)
                                      )) ? (
                                      <button
                                        disabled
                                        className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md opacity-95 cursor-not-allowed flex items-center gap-1.5 flex-shrink-0"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        {tPhone('জয়েন করা হয়েছে', 'JOINED')}
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          if (!currentUser) {
                                            setShowAuthModal(true);
                                            return;
                                          }
                                          setBookingModalMatch(m);
                                        }}
                                        className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md active:scale-95 transition-all flex-shrink-0"
                                      >
                                        Join
                                      </button>
                                    )}
                                  </div>

                                  {/* 4. Dual Action Buttons: Room Rules and Total Prize Details */}
                                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                                    <button
                                      onClick={() => setMatchDetailsScreen(m)}
                                      className="py-2 px-2.5 rounded-xl border border-blue-200 bg-blue-50/70 text-blue-700 text-[11px] font-black flex items-center justify-center gap-1.5 hover:bg-blue-100 transition-all shadow-xs"
                                    >
                                      <Key className="w-3.5 h-3.5 text-blue-600" />
                                      <span>Room Rules</span>
                                      <span className="text-[10px] text-blue-500 font-mono">➔</span>
                                    </button>

                                    <button
                                      onClick={() => setTotalPrizeMatch(m)}
                                      className="py-2 px-2.5 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-800 text-[11px] font-black flex items-center justify-center gap-1 hover:bg-amber-100 transition-all shadow-xs"
                                    >
                                      <Trophy className="w-3.5 h-3.5 text-amber-600" />
                                      <span>Total Prize Details</span>
                                      <span className="text-[10px]">▼</span>
                                    </button>
                                  </div>

                                  {/* 5. Real Live Countdown Bar (Without public Room ID leak) */}
                                  <LiveMatchCountdown
                                    matchTime={m.time}
                                    status={m.status}
                                    compact={true}
                                  />

                                  {/* Room ID Security Notice */}
                                  <div className="flex items-center justify-center gap-1 text-[9px] text-gray-500 font-semibold pt-0.5">
                                    <Lock className="w-2.5 h-2.5 text-red-500 flex-shrink-0" />
                                    <span>{tPhone('রুম আইডি ও পাসওয়ার্ড কেবল বুকিং করা প্লেয়ারদের "মাই ম্যাচেস" অপশনে দৃশ্যমান', 'Room ID & Password is secure in "My Matches" tab for joined players')}</span>
                                  </div>
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
                          {/* 1. Breaking News Ticker (নিউজ - ট্রেনের মতন স্লাইড) */}
                          <div className="px-2.5 py-2 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 overflow-hidden shadow-xs relative">
                            <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[9px] uppercase tracking-wide flex items-center gap-1 shadow-xs z-10">
                              <Radio className="w-3 h-3 animate-pulse text-white" />
                              <span>{tPhone('📢 নিউজ', '📢 NEWS')}</span>
                            </span>
                            <div className="flex-1 overflow-hidden relative whitespace-nowrap">
                              <div className="animate-train-marquee text-[11px] font-black text-gray-900 tracking-wide inline-block">
                                {settings?.noticeText || tPhone(
                                  '🔥 FF RIVAL TOUR BD-তে স্বাগতম! প্রতিদিন টুর্নামেন্ট খেলুন এবং বিকাশ/নগদে প্রাইজ গ্রহণ করুন! 🏆 আইডি লেভেল ৫৫+ বাধ্যতামূলক • ১০০% ফেয়ার ও হ্যাকমুক্ত টুর্নামেন্ট!',
                                  '🔥 Welcome to FF RIVAL TOUR BD! Play daily tournaments & win cash via bKash/Nagad! 🏆 Level 55+ Required • 100% Fair Gameplay!'
                                )}
                              </div>
                            </div>
                          </div>

                          {/* 2. Interactive Image Carousel Slider (Admin Controlled) */}
                          <div className="relative rounded-2xl overflow-hidden h-36 bg-gradient-to-tr from-slate-900 via-red-950 to-slate-900 border border-gray-200 shadow-md">
                            {bannerSlides.map((slide, idx) => (
                              <div
                                key={slide.id || idx}
                                className={`absolute inset-0 transition-opacity duration-700 ease-in-out p-3.5 flex flex-col justify-end text-white ${
                                  idx === currentSlideIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                                }`}
                              >
                                {slide.image && (
                                  <img
                                    src={slide.image}
                                    alt={slide.title}
                                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                                  />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                <div className="relative z-10 space-y-1">
                                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 bg-black/60 px-2 py-0.5 rounded border border-amber-500/30 inline-block shadow-xs">
                                    {slide.badge || 'FF RIVAL TOUR BD'}
                                  </span>
                                  <h3 className="text-xs sm:text-sm font-black leading-tight text-white drop-shadow">
                                    {slide.title}
                                  </h3>
                                  <p className="text-[9px] text-gray-200 line-clamp-1 leading-snug">
                                    {slide.subtitle}
                                  </p>
                                </div>
                              </div>
                            ))}

                            {/* Slider Prev / Next Controls */}
                            {bannerSlides.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentSlideIndex((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);
                                  }}
                                  className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-black/50 text-white hover:bg-black/80 flex items-center justify-center text-xs shadow"
                                  aria-label="Previous Slide"
                                >
                                  ‹
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentSlideIndex((prev) => (prev + 1) % bannerSlides.length);
                                  }}
                                  className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-black/50 text-white hover:bg-black/80 flex items-center justify-center text-xs shadow"
                                  aria-label="Next Slide"
                                >
                                  ›
                                </button>

                                {/* Pagination Dot Indicators */}
                                <div className="absolute bottom-2 right-3 z-20 flex items-center gap-1">
                                  {bannerSlides.map((_, dotIdx) => (
                                    <button
                                      key={dotIdx}
                                      type="button"
                                      onClick={() => setCurrentSlideIndex(dotIdx)}
                                      className={`h-1.5 rounded-full transition-all ${
                                        dotIdx === currentSlideIndex ? 'w-4 bg-amber-400' : 'w-1.5 bg-white/50'
                                      }`}
                                      aria-label={`Go to slide ${dotIdx + 1}`}
                                    />
                                  ))}
                                </div>
                              </>
                            )}
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
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-red-600">
                          {tPhone(`আপনার বুক করা ম্যাচ (${bookedMatchesList.length})`, `Your Booked Matches (${bookedMatchesList.length})`)}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                          🔒 100% Private Pass
                        </span>
                      </div>

                      {bookedMatchesList.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 bg-white border border-dashed border-gray-300 rounded-2xl space-y-2">
                          <Clock className="w-8 h-8 mx-auto text-gray-400" />
                          <p className="text-xs font-bold text-gray-800">
                            {tPhone('আপনি এখনও কোনো ম্যাচে জয়েন করেননি', 'You have not joined any match yet')}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {tPhone(
                              'হোম পেজ থেকে যেকোনো টুর্নামেন্টে জয়েন করুন। বুকিং কনফার্ম হলে এখানে আপনার গোপন রুম আইডি ও পাসওয়ার্ড দেখতে পাবেন।',
                              'Join any tournament from Home. Your secret Room ID & Password will appear here once booked.'
                            )}
                          </p>
                        </div>
                      ) : (
                        bookedMatchesList.map((bm) => {
                          const liveMatch = matches.find((m) => m.id === bm.matchId || m.title === bm.title);

                          // Only reveal Room ID and Password if liveMatch status is ROOM_OPEN/LIVE, OR strictly within 5 minutes before match start
                          const matchDate = parseScheduleTimeToDate(liveMatch?.time || bm.time, (liveMatch as any)?.startTimeIso);
                          const diffMs = matchDate ? matchDate.getTime() - Date.now() : 999999;
                          const isWithin5Minutes = diffMs > 0 && diffMs <= 5 * 60 * 1000;
                          const isRoomOpenStatus = liveMatch?.status === 'ROOM_OPEN' || liveMatch?.status === 'LIVE';
                          const isRoomReady = Boolean((liveMatch?.roomId || bm.roomId) && (isWithin5Minutes || isRoomOpenStatus));
                          const currentRoomId = isRoomReady ? (liveMatch?.roomId || bm.roomId) : null;
                          const currentRoomPass = isRoomReady ? (liveMatch?.roomPass || bm.roomPass || '1234') : null;

                          return (
                          <div
                            key={bm.id}
                            className="p-4 rounded-2xl border border-gray-200 bg-white space-y-3 shadow-md"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-gray-900 truncate max-w-[200px]">
                                {bm.title}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                CONFIRMED
                              </span>
                            </div>

                            {/* Player IGN & Slot Info */}
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
                              className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer border border-gray-200 flex items-center justify-between text-xs transition-all"
                              title={tPhone('প্লেয়ার ডিটেইলস দেখুন', 'Click to view player details')}
                            >
                              <div>
                                <span className="text-gray-500 block text-[9px] font-bold flex items-center gap-1">
                                  Verified IGN <Eye className="w-2.5 h-2.5 text-amber-500" />
                                </span>
                                <span className="font-extrabold text-gray-900">{bm.ign}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-gray-500 block text-[9px] font-bold">
                                  {bm.team ? tPhone(`টিম #${bm.team}`, `Team #${bm.team}`) : tPhone('স্লট নম্বর', 'Slot #')}
                                </span>
                                <span className="font-black text-emerald-600 text-sm">
                                  #{bm.slot}
                                </span>
                              </div>
                            </div>

                            {/* Private Room Credentials Card (Revealed 5 Minutes Before Start) */}
                            {isRoomReady ? (
                              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2.5 shadow-xs">
                                <div className="flex items-center justify-between text-[11px] pb-1 border-b border-emerald-200/60">
                                  <span className="font-black text-emerald-800 flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                    🤖 {tPhone('বট রুম আইডি ডেলিভারি সম্পন্ন', 'Bot Room Delivered')}
                                  </span>
                                  <span className="text-[9px] font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                                    ROOM OPEN
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-800 flex items-center gap-1.5 font-extrabold text-xs">
                                    <Key className="w-4 h-4 text-emerald-600" /> {tPhone('রুম আইডি:', 'Room ID:')}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-black text-gray-950 bg-white px-3 py-1 rounded-lg border border-emerald-300 text-xs shadow-xs">
                                      {currentRoomId}
                                    </span>
                                    <button
                                      onClick={() => handleCopy(currentRoomId!, `room-${bm.id}`)}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black flex items-center gap-1 shadow-xs transition-colors"
                                    >
                                      {copiedKey === `room-${bm.id}` ? (
                                        <CheckCircle className="w-3 h-3 text-emerald-200" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                      <span>{copiedKey === `room-${bm.id}` ? 'কপি হয়েছে' : 'কপি'}</span>
                                    </button>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-800 flex items-center gap-1.5 font-extrabold text-xs">
                                    <Key className="w-4 h-4 text-emerald-600" /> {tPhone('পাসওয়ার্ড:', 'Password:')}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-black text-gray-950 bg-white px-3 py-1 rounded-lg border border-emerald-300 text-xs shadow-xs">
                                      {currentRoomPass || '1234'}
                                    </span>
                                    <button
                                      onClick={() => handleCopy(currentRoomPass || '1234', `pass-${bm.id}`)}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black flex items-center gap-1 shadow-xs transition-colors"
                                    >
                                      {copiedKey === `pass-${bm.id}` ? (
                                        <CheckCircle className="w-3 h-3 text-emerald-200" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                      <span>{copiedKey === `pass-${bm.id}` ? 'কপি হয়েছে' : 'কপি'}</span>
                                    </button>
                                  </div>
                                </div>

                                <p className="text-[9px] text-emerald-800 bg-white/70 p-1.5 rounded-lg border border-emerald-200 leading-tight">
                                  🎮 {tPhone(`ফ্রি ফায়ারে কাস্টম রুমে গিয়ে আইডি ও পাসওয়ার্ড দিন এবং স্লট #${bm.slot} এ গিয়ে বসুন।`, `Open Free Fire Custom Room, enter credentials, and sit in Slot #${bm.slot}.`)}
                                </p>
                              </div>
                            ) : (
                              <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-300 space-y-2 shadow-xs">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-black text-amber-900 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                                    ⏳ {tPhone('রুম আইডি প্রকাশের সময় বাকি', 'Room Release Pending')}
                                  </span>
                                  <span className="text-[9px] font-black bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                                    ৫ মিনিট আগে
                                  </span>
                                </div>
                                <div className="p-2.5 rounded-lg bg-white/95 border border-amber-200 text-center space-y-1">
                                  <p className="text-xs font-black text-red-600">
                                    {tPhone('রুম খোলার পাঁচ মিনিট আগে এখানে রুম আইডি ও পাসওয়ার্ড দেওয়া হবে।', 'Room ID and Password will be provided here 5 minutes before the match.')}
                                  </p>
                                  <p className="text-[10px] text-gray-500">
                                    {tPhone('ম্যাচ শুরু হওয়ার ৫ মিনিট পূর্বে স্বয়ংক্রিয়ভাবে এখানে আইডি ও পাসওয়ার্ড চলে আসবে।', 'Credentials will appear automatically 5 minutes before match start.')}
                                  </p>
                                </div>
                              </div>
                            )}

                            <div className="flex justify-between items-center text-[10px] text-gray-500 pt-1 font-semibold">
                              <span>UID: {bm.uid}</span>
                              <span className="text-amber-600 font-bold">{bm.time}</span>
                            </div>

                            {/* Match Result Screenshot Proof Upload */}
                            <div className="pt-2 border-t border-gray-200 space-y-1.5">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-bold text-gray-800 flex items-center gap-1">
                                  <Camera className="w-3.5 h-3.5 text-red-600" />
                                  {tPhone('রেজাল্ট স্ক্রিনশট প্রুফ', 'Result Screenshot Proof')}
                                </span>
                                {matchScreenshots[bm.id] && (
                                  <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                                    <CheckCircle className="w-3.5 h-3.5" /> {tPhone('আপলোড সফল', 'Uploaded')}
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
                        );
                      })
                    )}

                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-800 leading-relaxed font-bold">
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
                          {getTransactions().length === 0 ? (
                            <div className="p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 text-center text-[11px] text-gray-500 font-semibold">
                              {tPhone('কোনো সাম্প্রতিক লেনদেন নেই', 'No recent transactions found')}
                            </div>
                          ) : (
                            getTransactions().slice(0, 4).map((tx) => (
                              <div
                                key={tx.id}
                                className="p-2.5 rounded-xl border border-gray-200 bg-white flex items-center justify-between text-xs shadow-xs"
                              >
                                <div>
                                  <span
                                    className={`font-black text-[11px] block ${
                                      tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'
                                    }`}
                                  >
                                    {tx.type === 'CREDIT'
                                      ? '+ টাকা যোগ (ডিপোজিট)'
                                      : (tx as any).category === 'match_join' ||
                                        tx.reason?.toLowerCase().includes('match') ||
                                        tx.reason?.toLowerCase().includes('ম্যাচ') ||
                                        tx.reason?.toLowerCase().includes('slot') ||
                                        tx.reason?.toLowerCase().includes('entry')
                                      ? '- ম্যাচ জয়েন ফি (Match Join)'
                                      : '- টাকা উত্তোলন (উইথড্র)'}
                                  </span>
                                  <span className="text-[9px] text-gray-500">{tx.reason}</span>
                                </div>
                                <span
                                  className={`font-black text-xs ${
                                    tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'
                                  }`}
                                >
                                  {tx.type === 'CREDIT' ? '+' : '-'}৳{tx.amount.toFixed(2)}
                                </span>
                              </div>
                            ))
                          )}
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
                        </div>
                      ) : (
                        <>
                          {/* 1. PROFILE CARD (EXACT USER SCREENSHOT) */}
                          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                            {/* Blue-Violet Top Banner */}
                            <div className="h-16 bg-gradient-to-r from-[#6366f1] via-[#6d5dfc] to-[#8b5cf6] relative" />

                            <div className="px-4 pb-4 pt-0">
                              {/* Avatar and User Identity */}
                              <div className="flex items-end gap-3.5 -mt-9 mb-3">
                                <div className="relative w-20 h-20 rounded-full border-4 border-white shadow-md overflow-hidden bg-slate-900 flex-shrink-0">
                                  <img
                                    src={currentUser?.avatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=240'}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="space-y-0.5 pb-1 min-w-0">
                                  <h3 className="text-base font-black text-slate-900 truncate">
                                    {currentUser?.ign || 'Abu Numan'}
                                  </h3>
                                  <p className="text-[11px] text-slate-400 font-mono">
                                    @{currentUser?.uid ? `g_${currentUser.uid}` : 'g_102910574942'}
                                  </p>
                                  <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                                    <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                    <span className="truncate">{currentUser?.phone ? `${currentUser.phone}@gmail.com` : 'numan06bd1@gmail.com'}</span>
                                  </p>
                                </div>
                              </div>

                              {/* Action Buttons: [ ✏ Edit Info ] [ 🔑 Change Password ] */}
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditIgnInput(currentUser?.ign || '');
                                    setEditUidInput(currentUser?.uid || '');
                                    setShowEditInfoModal(true);
                                  }}
                                  className="flex-1 py-2 px-3 rounded-full bg-[#f1f5f9] hover:bg-[#e2e8f0] text-slate-700 text-xs font-bold border border-slate-200 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-2xs"
                                >
                                  <Edit className="w-3.5 h-3.5 text-slate-500" />
                                  <span>{tPhone('তথ্য পরিবর্তন', 'Edit Info')}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewPassInput('');
                                    setConfirmPassInput('');
                                    setPassMessage(null);
                                    setShowChangePasswordModal(true);
                                  }}
                                  className="flex-1 py-2 px-3 rounded-full bg-[#f1f5f9] hover:bg-[#e2e8f0] text-slate-700 text-xs font-bold border border-slate-200 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-2xs"
                                >
                                  <Key className="w-3.5 h-3.5 text-slate-500" />
                                  <span>{tPhone('পাসওয়ার্ড পরিবর্তন', 'Change Password')}</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* 2. 3-COLUMN STATS GRID (EXACT SCREENSHOT: 0 MATCHES, 0 WINS, 0 BDT) */}
                          <div className="grid grid-cols-3 gap-2.5">
                            {/* MATCHES */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 text-center shadow-xs">
                              <span className="text-2xl font-black text-[#5850ec] block">
                                {currentUser?.matchesPlayed || 0}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                                {tPhone('ম্যাচ', 'MATCHES')}
                              </span>
                            </div>

                            {/* WINS */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 text-center shadow-xs">
                              <span className="text-2xl font-black text-[#5850ec] block">
                                {currentUser?.totalWins || 0}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                                {tPhone('জয়', 'WINS')}
                              </span>
                            </div>

                            {/* BDT */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 text-center shadow-xs">
                              <span className="text-2xl font-black text-[#5850ec] block">
                                {Math.floor(userBalance || 0)}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                                BDT
                              </span>
                            </div>
                          </div>

                          {/* 3. MENU ITEMS LIST (EXACT SCREENSHOT WITH COLORFUL SQUARE ICONS) */}
                          <div className="space-y-2">
                            {/* 1. Rules */}
                            <div
                              onClick={() => setShowRulesModal(true)}
                              className="bg-white rounded-2xl border border-slate-200/80 p-3 flex items-center justify-between shadow-xs hover:border-slate-300 transition-all cursor-pointer active:scale-[0.99]"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#ede9fe] text-[#7c3aed] flex items-center justify-center">
                                  <BookOpen className="w-5 h-5 text-[#7c3aed]" />
                                </div>
                                <span className="font-bold text-slate-800 text-sm">{tPhone('টুর্নামেন্ট নিয়ম', 'Rules')}</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </div>

                            {/* 2. Top Players */}
                            <div
                              onClick={() => setActiveTab('top-players')}
                              className="bg-white rounded-2xl border border-slate-200/80 p-3 flex items-center justify-between shadow-xs hover:border-slate-300 transition-all cursor-pointer active:scale-[0.99]"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#fef3c7] text-[#f59e0b] flex items-center justify-center">
                                  <Crown className="w-5 h-5 text-[#f59e0b]" />
                                </div>
                                <span className="font-bold text-slate-800 text-sm">{tPhone('শীর্ষ খেলোয়াড়', 'Top Players')}</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </div>

                            {/* 3. Report Bug */}
                            <div
                              onClick={() => {
                                setShowSupportModal(true);
                                pushHistory('support-modal');
                              }}
                              className="bg-white rounded-2xl border border-slate-200/80 p-3 flex items-center justify-between shadow-xs hover:border-slate-300 transition-all cursor-pointer active:scale-[0.99]"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#fee2e2] text-[#ef4444] flex items-center justify-center">
                                  <AlertCircle className="w-5 h-5 text-[#ef4444]" />
                                </div>
                                <span className="font-bold text-slate-800 text-sm">{tPhone('সমস্যা রিপোর্ট', 'Report Bug')}</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </div>

                            {/* 4. Update */}
                            <div
                              onClick={() => setShowUpdateModal(true)}
                              className="bg-white rounded-2xl border border-slate-200/80 p-3 flex items-center justify-between shadow-xs hover:border-slate-300 transition-all cursor-pointer active:scale-[0.99]"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#ccfbf1] text-[#0d9488] flex items-center justify-center">
                                  <RefreshCw className="w-5 h-5 text-[#0d9488]" />
                                </div>
                                <span className="font-bold text-slate-800 text-sm">{tPhone('অ্যাপ আপডেট', 'Update')}</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </div>

                            {/* 5. Support */}
                            <div
                              onClick={() => {
                                setShowSupportModal(true);
                                pushHistory('support-modal');
                              }}
                              className="bg-white rounded-2xl border border-slate-200/80 p-3 flex items-center justify-between shadow-xs hover:border-slate-300 transition-all cursor-pointer active:scale-[0.99]"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#d1fae5] text-[#10b981] flex items-center justify-center">
                                  <Headphones className="w-5 h-5 text-[#10b981]" />
                                </div>
                                <span className="font-bold text-slate-800 text-sm">{tPhone('সাপোর্ট ডেস্ক', 'Support')}</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </div>

                            {/* 6. Developer Info */}
                            <div
                              onClick={() => setShowDevInfoModal(true)}
                              className="bg-white rounded-2xl border border-slate-200/80 p-3 flex items-center justify-between shadow-xs hover:border-slate-300 transition-all cursor-pointer active:scale-[0.99]"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center">
                                  <Code className="w-5 h-5 text-[#0284c7]" />
                                </div>
                                <span className="font-bold text-slate-800 text-sm">{tPhone('ডেভেলপার ইনফো', 'Developer Info')}</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </div>

                            {/* Master Owner Admin Access Banner */}
                            {currentUser?.role === 'ADMIN' && (
                              <Link
                                href="/admin"
                                className="bg-gradient-to-r from-amber-50 to-amber-100/60 rounded-2xl border border-amber-300 p-3 flex items-center justify-between shadow-xs hover:border-amber-400 transition-all cursor-pointer active:scale-[0.99]"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black">
                                    👑
                                  </div>
                                  <div>
                                    <span className="font-black text-amber-900 text-sm block">Master Admin Panel</span>
                                    <span className="text-[10px] text-amber-700">Full platform controls & tournaments</span>
                                  </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-amber-500" />
                              </Link>
                            )}

                            {/* 7. Logout */}
                            <div
                              onClick={() => {
                                logoutUser();
                                setCurrentUser(null);
                              }}
                              className="bg-white rounded-2xl border border-slate-200/80 p-3 flex items-center justify-between shadow-xs hover:border-rose-200 transition-all cursor-pointer active:scale-[0.99]"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#ffe4e6] text-[#e11d48] flex items-center justify-center">
                                  <LogOut className="w-5 h-5 text-[#e11d48]" />
                                </div>
                                <span className="font-bold text-rose-600 text-sm">{tPhone('লগআউট', 'Logout')}</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-rose-300" />
                            </div>
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

                  {/* 6. ADMIN (VISIBLE FOR ADMIN / OWNER USERS) */}
                  {currentUser?.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className="flex flex-col items-center gap-0.5 text-[9px] font-black text-amber-500 hover:text-amber-400 transition-colors animate-pulse"
                    >
                      <Shield className="w-4 h-4 text-amber-500" />
                      <span>{tPhone('অ্যাডমিন', 'Admin')}</span>
                    </Link>
                  )}
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
                  {authMode === 'LOGIN' ? 'মোবাইল নম্বর বা ওনার আইডি (Phone / Owner ID)' : 'মোবাইল নম্বর (Phone Number)'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder={authMode === 'LOGIN' ? '017XXXXXXXX বা ওনার আইডি (যেমন: OWNER_MAIN)' : '017XXXXXXXX'}
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
                      placeholder="e.g. 192837465 (স্বয়ংক্রিয় IGN ডিটেক্ট হবে)"
                      value={authUid}
                      onChange={(e) => handleUidChange(e.target.value)}
                      onBlur={() => {
                        if (authUid) handleUidChange(authUid);
                      }}
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
                    type={showAuthPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAuthPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    {showAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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
          </div>
        </div>
      )}

      {/* 7. EDIT INFO MODAL */}
      {showEditInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Edit className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900">{tPhone('প্রোফাইল তথ্য পরিবর্তন', 'Edit Profile Info')}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditInfoModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (currentUser && editIgnInput.trim()) {
                  const updated = updateUser(currentUser.id, {
                    ign: editIgnInput.trim().toUpperCase(),
                    uid: editUidInput.trim() || currentUser.uid,
                  });
                  if (updated) {
                    setCurrentUser(updated);
                  }
                }
                setShowEditInfoModal(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  {tPhone('ইন-গেম নেম (In-Game Name / IGN)', 'In-Game Name (IGN)')}
                </label>
                <input
                  type="text"
                  required
                  value={editIgnInput}
                  onChange={(e) => setEditIgnInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-bold"
                  placeholder="e.g. ABU NUMAN"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  {tPhone('ফ্রি ফায়ার ইউআইডি (Free Fire UID)', 'Free Fire UID')}
                </label>
                <input
                  type="text"
                  value={editUidInput}
                  onChange={(e) => setEditUidInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-mono"
                  placeholder="e.g. 102910574942"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md shadow-indigo-600/30 transition-all active:scale-95"
              >
                {tPhone('সংরক্ষণ করুন', 'Save Changes')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 8. CHANGE PASSWORD MODAL */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900">{tPhone('পাসওয়ার্ড পরিবর্তন', 'Change Password')}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowChangePasswordModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {passMessage && (
              <div className={`p-2.5 rounded-xl text-xs font-bold ${passMessage.isError ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                {passMessage.text}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newPassInput || newPassInput.length < 4) {
                  setPassMessage({ text: 'Password must be at least 4 characters!', isError: true });
                  return;
                }
                if (newPassInput !== confirmPassInput) {
                  setPassMessage({ text: 'Passwords do not match!', isError: true });
                  return;
                }
                if (currentUser) {
                  updateUser(currentUser.id, { password: newPassInput });
                  setPassMessage({ text: 'Password changed successfully! ✓', isError: false });
                  setTimeout(() => setShowChangePasswordModal(false), 1200);
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  {tPhone('নতুন পাসওয়ার্ড (New Password)', 'New Password')}
                </label>
                <input
                  type="password"
                  required
                  value={newPassInput}
                  onChange={(e) => setNewPassInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  {tPhone('পাসওয়ার্ড নিশ্চিত করুন (Confirm Password)', 'Confirm Password')}
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassInput}
                  onChange={(e) => setConfirmPassInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md shadow-indigo-600/30 transition-all active:scale-95"
              >
                {tPhone('পাসওয়ার্ড আপডেট করুন', 'Update Password')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 9. RULES MODAL */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900">{tPhone('টুর্নামেন্ট সার্বিক নিয়মাবলী', 'Tournament Official Rules')}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100">
                <h4 className="font-bold text-purple-900 mb-1">🎮 রুম কোড ও পাসওয়ার্ড</h4>
                <p>ম্যাচ শুরুর ১০-১৫ মিনিট আগে অ্যাপের &quot;আমার ম্যাচ&quot; (My Matches) অপশনে রুম আইডি এবং পাসওয়ার্ড দেয়া হবে। নিজের নির্দিষ্ট স্লটেই বসতে হবে।</p>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100">
                <h4 className="font-bold text-rose-900 mb-1">🛡️ অ্যান্টি-চিট ও ফেয়ার প্লে</h4>
                <p>যেকোনো ধরনের হ্যাক, স্ক্রিপ্ট, কনফিগ ফাইল বা এম্যুলেটর ব্যবহার সম্পূর্ণ নিষিদ্ধ। ধরা পড়লে অ্যাকাউন্ট আজীবনের জন্য ব্যান হবে।</p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <h4 className="font-bold text-emerald-900 mb-1">🏆 পুরস্কার ও টাকা উইথড্র</h4>
                <p>ম্যাচ শেষ হওয়ার পর OCR স্বয়ংক্রিয়ভাবে স্ক্রিনশট ভেরিফাই করে উইনিং প্রাইজ আপনার ওয়ালেটে জমা করবে। বিকাশ ও নগদে ১-২ ঘণ্টার ভেতর উইথড্র সম্পন্ন হয়।</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowRulesModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-black text-xs"
            >
              {tPhone('বুঝেছি (Close)', 'I Understand')}
            </button>
          </div>
        </div>
      )}

      {/* 10. UPDATE MODAL */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 mx-auto flex items-center justify-center shadow-inner">
              <RefreshCw className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">Murubbi X Tournament</h3>
              <p className="text-xs text-slate-500 mt-1">Version 2.4.0 (Latest Official Build)</p>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              আপনার অ্যাপটি সম্পূর্ণ আপ-টু-ডেট রয়েছে। নতুন কোনো আপডেট আসলে নোটিফিকেশনের মাধ্যমে জানানো হবে।
            </p>

            <div className="flex items-center gap-2">
              <a
                href="/ffrivals.apk"
                download="ffrivals.apk"
                className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-teal-600/30"
              >
                <Download className="w-4 h-4" /> Download APK
              </a>
              <button
                type="button"
                onClick={() => setShowUpdateModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. DEVELOPER INFO MODAL */}
      {showDevInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Code className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900">Developer & Platform Info</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDevInfoModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-500">Platform:</span>
                <span className="font-mono font-bold text-slate-900">Murubbi X Tournament BD</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-500">Engine Build:</span>
                <span className="font-mono font-bold text-slate-900">v2.4.0 (Autonomous Cloud)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-500">AI Assistant:</span>
                <span className="font-mono font-bold text-emerald-600">Active (24/7 Engine)</span>
              </div>
            </div>

            <Link
              href="/admin"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/30"
            >
              👑 Open Master Admin Panel
            </Link>
          </div>
        </div>
      )}
      {/* 12. OVERLAY & NOTIFICATION SETTINGS GUIDE MODAL */}
      {showOverlayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  {tPhone('নোটিফিকেশন ও ওভারলে সেটিংস গাইড', 'Notification & Overlay Guide')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOverlayModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                <p className="font-bold">📱 গেম খেলা অবস্থায় রুম আইডি পেতে:</p>
                <p className="text-[11px]">
                  ফ্রি ফায়ার গেম চলা অবস্থাতেও রুম আইডি ও পাসওয়ার্ড ভেসে উঠতে &apos;Display over other apps&apos; (ওভারলে) পারমিশন অন রাখুন।
                </p>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                    ১
                  </span>
                  <span>ফোনের <b>Settings ➔ Apps</b> এ গিয়ে <b>Murubbi X</b> বা <b>FF Rival BD</b> সিলেক্ট করুন।</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                    ২
                  </span>
                  <span><b>Notifications</b> এলাউ (Allow) করে দিন।</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                    ৩
                  </span>
                  <span><b>Display over other apps</b> বা <b>Appear on top</b> অপশনটি অন (ON) করুন।</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleEnablePushNotification();
                  try {
                    window.location.href = 'intent:#Intent;action=android.settings.action.MANAGE_OVERLAY_PERMISSION;package=com.murubbix.tournament;end';
                  } catch (e) {}
                  setShowOverlayModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-md shadow-red-600/30 flex items-center justify-center gap-1.5"
              >
                <span>⚙️ সেটিংস খুলুন ও নোটিফিকেশন অন করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support Ticket Modal */}
      <SupportTicketModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
        lang={phoneLang}
        onOpenChat={(tkt) => {
          setActiveChatTicket(tkt);
          pushHistory('support-chat');
        }}
      />

      {/* Dedicated Fresh Full-Screen Support Chat Screen */}
      {activeChatTicket && (
        <SupportChatScreen
          ticket={activeChatTicket}
          onBack={() => {
            setActiveChatTicket(null);
          }}
          lang={phoneLang}
          onUpdateTicket={(updated) => setActiveChatTicket(updated)}
        />
      )}
    </div>
  );
}
