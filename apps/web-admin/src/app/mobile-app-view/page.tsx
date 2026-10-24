'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  ShieldAlert,
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
  Clipboard,
  ShieldCheck,
} from 'lucide-react';
import { useCMS, MatchItem, TopPlayerItem, INITIAL_SETTINGS, INITIAL_CATEGORIES, INITIAL_BANNERS } from '@/lib/cms-store';
import { checkFreeFireUID } from '@/lib/ff-uid-checker';
import RoomDetailsModal from '@/components/RoomDetailsModal';
import SlotBookingModal from '@/components/SlotBookingModal';
import PlayerDetailsModal, { PlayerDetailsData } from '@/components/PlayerDetailsModal';
import TotalPrizeDetailsModal from '@/components/TotalPrizeDetailsModal';
import MatchDetailsPage from '@/components/MatchDetailsPage';
import ImageUploadInput from '@/components/ImageUploadInput';
import LiveMatchCountdown, {
  formatMatchSchedule,
  parseScheduleTimeToDate,
  isMatchFinished,
} from '@/components/LiveMatchCountdown';
import DepositWithdrawModal from '@/components/DepositWithdrawModal';
import SupportChatScreen from '@/components/SupportChatScreen';
import { SupportTicket, getOrCreateUserConversation } from '@/lib/support-store';
import { useLanguage } from '@/components/LanguageProvider';
import { readClipboardText, toEnDigits } from '@/lib/clipboard';
import {
  getCurrentUser,
  fetchUsersFromServer,
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
  const isMobileView = true;

  // Premium Animated Splash Loading Screen State
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [splashProgress, setSplashProgress] = useState(15);

  useEffect(() => {
    setMounted(true);

    // Smooth, premium esports splash loading sequence (~1.6s)
    const t1 = setTimeout(() => setSplashProgress(38), 200);
    const t2 = setTimeout(() => setSplashProgress(68), 500);
    const t3 = setTimeout(() => setSplashProgress(88), 900);
    const t4 = setTimeout(() => setSplashProgress(100), 1300);
    const t5 = setTimeout(() => setSplashFading(true), 1550);
    const t6 = setTimeout(() => {
      setSplashVisible(false);
      // Immediately after splash loading finishes, prompt Sign In / Login modal if not logged in
      const cur = getCurrentUser();
      if (!cur) {
        setShowAuthModal(true);
      }
    }, 1850);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
    };
  }, []);

  // Active Tab & Screen Navigation
  const [activeTab, setActiveTab] = useState<'home' | 'my-matches' | 'top-players' | 'wallet' | 'profile'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryTab, setCategoryTab] = useState<'PLAY' | 'RESULT'>('PLAY');

  // Phone Theme & Language (Light White Mode permanent)
  const [phoneTheme, setPhoneTheme] = useState<'dark' | 'light'>('light');
  const [phoneLang, setPhoneLang] = useState<'bn' | 'en'>(globalLang || 'bn');

  // Interactive Carousel Banner State
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const bannerSlides = React.useMemo(() => {
    if (settings?.banners && settings.banners.length > 0) {
      const valid = settings.banners.filter((b) => b && b.image && b.image.trim() !== '' && b.image !== '/logo.png');
      if (valid.length > 0) return valid;
    }
    return INITIAL_SETTINGS.banners || [];
  }, [settings?.banners, settings]);

  useEffect(() => {
    if (activeTab !== 'home' || bannerSlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % bannerSlides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [activeTab, bannerSlides.length]);

  // Copying & Feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [joinedSuccess, setJoinedSuccess] = useState(false);
  const [userBalance, setUserBalance] = useState(0.0);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOverlayModal, setShowOverlayModal] = useState(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authUsername, setAuthUsername] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authIgn, setAuthIgn] = useState('');
  const [authUid, setAuthUid] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Profile modal states (matching uploaded user screenshot)
  const [showEditInfoModal, setShowEditInfoModal] = useState(false);
  const [editUsernameInput, setEditUsernameInput] = useState('');
  const [editEmailInput, setEditEmailInput] = useState('');
  const [editIgnInput, setEditIgnInput] = useState('');
  const [editUidInput, setEditUidInput] = useState('');
  const [editAvatarInput, setEditAvatarInput] = useState('');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [passMessage, setPassMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showDevInfoModal, setShowDevInfoModal] = useState(false);
  // App Download / Update Modal state (defaults to false so users are never blocked)
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [updateDownloading, setUpdateDownloading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);

  // Auth modal prompt is triggered automatically upon splash screen completion (t6)
  useEffect(() => {
    // Keep user state in sync on storage events
    const syncCur = () => {
      const cur = getCurrentUser();
      setCurrentUser(cur);
    };
    window.addEventListener('storage', syncCur);
    window.addEventListener('ff_users_updated', syncCur);
    return () => {
      window.removeEventListener('storage', syncCur);
      window.removeEventListener('ff_users_updated', syncCur);
    };
  }, []);

  // Pull-to-refresh state
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartYRef = React.useRef(0);
  const pullDistRef = React.useRef(0);
  const rafRef = React.useRef<number | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop <= 2) {
      touchStartYRef.current = e.touches[0].clientY;
      pullDistRef.current = 0;
    } else {
      touchStartYRef.current = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartYRef.current || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartYRef.current;
    if (diff > 0 && scrollContainerRef.current && scrollContainerRef.current.scrollTop <= 2) {
      const dist = Math.min(65, diff * 0.4);
      pullDistRef.current = dist;
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          setPullDistance(pullDistRef.current);
          setIsPulling(true);
          rafRef.current = null;
        });
      }
    } else if (diff < 0) {
      touchStartYRef.current = 0;
      pullDistRef.current = 0;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setIsPulling(false);
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const currentPull = pullDistRef.current || pullDistance;
    if (currentPull > 35 && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(35);
      if (typeof window !== 'undefined') {
        try {
          const [usersRes] = await Promise.allSettled([
            fetchUsersFromServer(),
            fetch(`/api/cms?t=${Date.now()}`, { cache: 'no-store' }).then(async (res) => {
              if (res.ok) {
                const serverData = await res.json();
                if (serverData && !serverData.error) {
                  window.dispatchEvent(new CustomEvent('ff_cms_updated', { detail: serverData }));
                }
              }
            }),
          ]);

          if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) {
            const logged = getCurrentUser();
            if (logged) {
              const matched = usersRes.value.find(
                (u) => u.id === logged.id || (u.phone && logged.phone && u.phone === logged.phone)
              );
              if (matched) {
                setCurrentUser(matched);
                setUserBalance(matched.walletBalance ?? 0);
              }
            }
          }
        } catch (e) {}
        const cur = getCurrentUser();
        if (cur) {
          setCurrentUser(cur);
          setUserBalance(cur.walletBalance ?? 0);
        }
      }
      setIsRefreshing(false);
    }
    setIsPulling(false);
    setPullDistance(0);
    pullDistRef.current = 0;
    touchStartYRef.current = 0;
  };

  const handleUidChange = async (val: string) => {
    setAuthUid(val);
    const clean = toEnDigits(val);
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
    if (typeof window !== 'undefined' && (window as any).AndroidBridge?.requestNotificationPermission) {
      try {
        (window as any).AndroidBridge.requestNotificationPermission();
      } catch (e) {}
    }
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

  // PayBot In-App Connector States (24/7 Always-Connected with Native Android & Local Storage Persistence)
  const [showPayBotModal, setShowPayBotModal] = useState(false);
  const [isPaybotConnected, setIsPaybotConnected] = useState(false);
  const [isPaybotConnecting, setIsPaybotConnecting] = useState(false);
  const [paybotBattery, setPaybotBattery] = useState(96);
  const [paybotLastPing, setPaybotLastPing] = useState('');
  const [paybotTestResult, setPaybotTestResult] = useState<any>(null);
  const [selectedPaybotPhone, setSelectedPaybotPhone] = useState('01799000001');
  const [selectedPaybotPass, setSelectedPaybotPass] = useState('paybot1234');
  const paybotIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resume PayBot connection on mount: ALWAYS stays connected even when app is closed / phone reboots
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const isAlwaysOn = localStorage.getItem('ff_paybot_always_connected') === 'true';
      const savedPhone = localStorage.getItem('ff_paybot_connected_phone') || '01799000001';
      const savedName = localStorage.getItem('ff_paybot_connected_name') || 'PAYBOT_DEVICE_1';

      let nativeRunning = false;
      if ((window as any).AndroidBridge?.isPayBotAlwaysOn) {
        try {
          nativeRunning = (window as any).AndroidBridge.isPayBotAlwaysOn();
        } catch {}
      }

      if (isAlwaysOn || nativeRunning) {
        setIsPaybotConnected(true);
        setPaybotLastPing(new Date().toLocaleTimeString());
        if (savedPhone) setSelectedPaybotPhone(savedPhone);

        // Ensure native Android 24/7 background service is active
        if ((window as any).AndroidBridge?.startPayBotAlwaysOn) {
          try {
            (window as any).AndroidBridge.startPayBotAlwaysOn(savedPhone, savedName);
          } catch {}
        }

        // Maintain web-level heartbeat interval
        if (paybotIntervalRef.current) clearInterval(paybotIntervalRef.current);
        paybotIntervalRef.current = setInterval(async () => {
          try {
            await fetch('/api/webhook/payment?key=ff_rivals_secure_sms_key_2026', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'ff_rivals_secure_sms_key_2026',
                'x-device-name': savedName,
              },
              body: JSON.stringify({
                type: 'PING',
                deviceName: `${savedName} (${savedPhone})`,
                phone: savedPhone,
                battery: paybotBattery,
                status: 'ONLINE',
              }),
            });
            setPaybotLastPing(new Date().toLocaleTimeString());
          } catch {}
        }, 10000);
      }
    } catch {}
  }, []);

  const handlePaybotConnect = async (customUser?: any) => {
    setIsPaybotConnecting(true);
    try {
      let activeCur = customUser || currentUser;
      if (!activeCur || (!activeCur.id?.startsWith('u-paybot') && !activeCur.phone?.startsWith('0179900000') && activeCur.role !== 'ADMIN')) {
        const loginRes = await loginUser(selectedPaybotPhone, selectedPaybotPass);
        if (!loginRes.success || !loginRes.user) {
          throw new Error(loginRes.error || 'লগইন ব্যর্থ হয়েছে');
        }
        activeCur = loginRes.user;
        setCurrentUser(activeCur);
      }

      const activePhone = activeCur?.phone || selectedPaybotPhone;
      const activeName = activeCur?.ign || 'PAYBOT_DEVICE_1';

      if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
        try { await Notification.requestPermission(); } catch {}
      }

      // 1. Trigger Native Android 24/7 Background Service
      if (typeof window !== 'undefined' && (window as any).AndroidBridge?.startPayBotAlwaysOn) {
        try {
          (window as any).AndroidBridge.startPayBotAlwaysOn(activePhone, activeName);
        } catch {}
      }

      // 2. Persist in localStorage so app closing or exit NEVER disconnects
      try {
        localStorage.setItem('ff_paybot_always_connected', 'true');
        localStorage.setItem('ff_paybot_connected_phone', activePhone);
        localStorage.setItem('ff_paybot_connected_name', activeName);
      } catch {}

      await fetch('/api/webhook/payment?key=ff_rivals_secure_sms_key_2026', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'ff_rivals_secure_sms_key_2026',
          'x-device-name': activeName,
        },
        body: JSON.stringify({
          type: 'PING',
          deviceName: `${activeName} (${activePhone})`,
          phone: activePhone,
          battery: paybotBattery,
          status: 'ONLINE',
        }),
      });

      setIsPaybotConnected(true);
      setPaybotLastPing(new Date().toLocaleTimeString());

      if (paybotIntervalRef.current) clearInterval(paybotIntervalRef.current);
      paybotIntervalRef.current = setInterval(async () => {
        try {
          await fetch('/api/webhook/payment?key=ff_rivals_secure_sms_key_2026', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': 'ff_rivals_secure_sms_key_2026',
              'x-device-name': activeName,
            },
            body: JSON.stringify({
              type: 'PING',
              deviceName: `${activeName} (${activePhone})`,
              phone: activePhone,
              battery: paybotBattery,
              status: 'ONLINE',
            }),
          });
          setPaybotLastPing(new Date().toLocaleTimeString());
        } catch {}
      }, 10000);

      showPhoneToast('ডিভাইস সর্বদা সক্রিয় মোডে কানেক্ট হয়েছে ✅ (গেম খেললেও কানেক্ট থাকবে)');
    } catch (e: any) {
      showPhoneToast('কানেক্ট ব্যর্থ: ' + e.message);
    } finally {
      setIsPaybotConnecting(false);
    }
  };

  const handlePaybotDisconnect = () => {
    if (paybotIntervalRef.current) clearInterval(paybotIntervalRef.current);
    setIsPaybotConnected(false);
    try {
      localStorage.removeItem('ff_paybot_always_connected');
      localStorage.removeItem('ff_paybot_connected_phone');
      localStorage.removeItem('ff_paybot_connected_name');
      if (typeof window !== 'undefined' && (window as any).AndroidBridge?.stopPayBotAlwaysOn) {
        (window as any).AndroidBridge.stopPayBotAlwaysOn();
      }
    } catch {}
    showPhoneToast('ডিভাইস ডিসকানেক্ট করা হয়েছে');
  };

  // Tab Navigation History
  const [tabHistory, setTabHistory] = useState<('home' | 'my-matches' | 'top-players' | 'wallet' | 'profile')[]>(['home']);

  // Distinct Hash Navigation and In-App Back Manager
  const pushHash = (hash: string) => {
    if (typeof window === 'undefined') return;
    try {
      const fullHash = hash.startsWith('#') ? hash : '#' + hash;
      if (window.location.hash !== fullHash) {
        window.history.pushState({ screen: fullHash, time: Date.now() }, '', fullHash);
      }
    } catch {}
  };

  const pushHistory = (screenName: string) => {
    pushHash(screenName);
  };

  const switchTab = (tab: 'home' | 'my-matches' | 'top-players' | 'wallet' | 'profile') => {
    if (tab === activeTab) return;
    setTabHistory((prev) => [...prev, tab]);
    setActiveTab(tab);
    pushHash('tab-' + tab);
  };

  const handleOpenSupport = () => {
    const cur = getCurrentUser();
    const conv = getOrCreateUserConversation(cur);
    setActiveChatTicket(conv);
    pushHistory('support-chat');
  };

  const lastBackPressTimeRef = useRef<number>(0);

  const handleInAppBack = (): boolean => {
    // 0. Priority: if user is typing or keyboard is open, blur input first
    if (typeof document !== 'undefined' && document.activeElement) {
      const tag = document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        (document.activeElement as HTMLElement).blur();
        return true;
      }
    }

    // 0.1 Check if any global modal/dialog in DOM is open (Important Notice or Permission modal)
    if (typeof document !== 'undefined') {
      const noticeModal = document.querySelector('[aria-labelledby="important-notice-title"]');
      if (noticeModal) {
        const btn = noticeModal.querySelector<HTMLElement>('button');
        if (btn) {
          btn.click();
          return true;
        }
      }
      const notifModal = document.querySelector('[aria-modal="true"]');
      if (notifModal) {
        const btn = notifModal.querySelector<HTMLElement>('button');
        if (btn) {
          btn.click();
          return true;
        }
      }
    }

    // If update modal is open, allow closing it so user is never trapped
    if (showUpdateModal) {
      setShowUpdateModal(false);
      return true;
    }

    // 1. Modals & sub-screens (close top-most first)
    if (activeChatTicket) {
      setActiveChatTicket(null);
      return true;
    }
    if (showFinanceModal) {
      setShowFinanceModal(false);
      return true;
    }
    if (bookingModalMatch) {
      setBookingModalMatch(null);
      return true;
    }
    if (roomDetailsMatch) {
      setRoomDetailsMatch(null);
      return true;
    }
    if (totalPrizeMatch) {
      setTotalPrizeMatch(null);
      return true;
    }
    if (selectedPlayerForDetails) {
      setSelectedPlayerForDetails(null);
      return true;
    }
    if (matchDetailsScreen) {
      setMatchDetailsScreen(null);
      return true;
    }
    if (showEditInfoModal) {
      setShowEditInfoModal(false);
      return true;
    }
    if (showChangePasswordModal) {
      setShowChangePasswordModal(false);
      return true;
    }
    if (showRulesModal) {
      setShowRulesModal(false);
      return true;
    }
    if (showDevInfoModal) {
      setShowDevInfoModal(false);
      return true;
    }
    if (showAuthModal) {
      setShowAuthModal(false);
      return true;
    }
    if (showOverlayModal) {
      setShowOverlayModal(false);
      return true;
    }
    if (showNotifDropdown) {
      setShowNotifDropdown(false);
      return true;
    }

    // 2. Category selection
    if (selectedCategory) {
      setSelectedCategory(null);
      return true;
    }

    // 3. Tab history navigation
    if (tabHistory.length > 1) {
      const updated = [...tabHistory];
      updated.pop();
      const prevTab = updated[updated.length - 1] || 'home';
      setTabHistory(updated);
      setActiveTab(prevTab);
      return true;
    }
    if (activeTab !== 'home') {
      setActiveTab('home');
      setTabHistory(['home']);
      return true;
    }

    // 4. Root Home screen reached: double back press within 2000ms prevention
    const now = Date.now();
    if (now - lastBackPressTimeRef.current < 2000) {
      // Exit confirmed!
      if (typeof window !== 'undefined' && (window as any)?.Capacitor?.Plugins?.App?.exitApp) {
        (window as any).Capacitor.Plugins.App.exitApp();
      }
      return false; // Tells MainActivity.java to call finish()
    } else {
      lastBackPressTimeRef.current = now;
      showPhoneToast(tPhone('অ্যাপ থেকে বের হতে আবার ব্যাক চাপুন', 'Press back again to exit'));
      return true; // Toast shown, stay in app!
    }
  };

  const handleInAppBackRef = useRef(handleInAppBack);
  useEffect(() => {
    handleInAppBackRef.current = handleInAppBack;
  });

  // Automatically synchronize active modal, category, or subview to browser history hash
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (activeChatTicket) pushHash('chat-' + activeChatTicket.id);
    else if (showFinanceModal) pushHash('modal-finance');
    else if (bookingModalMatch) pushHash('modal-booking-' + bookingModalMatch.id);
    else if (roomDetailsMatch) pushHash('modal-room-' + roomDetailsMatch.id);
    else if (totalPrizeMatch) pushHash('modal-prize-' + totalPrizeMatch.id);
    else if (selectedPlayerForDetails) pushHash('modal-player');
    else if (matchDetailsScreen) pushHash('screen-match-' + matchDetailsScreen.id);
    else if (showEditInfoModal) pushHash('modal-edit-info');
    else if (showChangePasswordModal) pushHash('modal-password');
    else if (showRulesModal) pushHash('modal-rules');
    else if (showDevInfoModal) pushHash('modal-dev');
    else if (showAuthModal) pushHash('modal-auth');
    else if (showOverlayModal) pushHash('modal-overlay');
    else if (selectedCategory) pushHash('cat-' + selectedCategory);
  }, [
    activeChatTicket,
    showFinanceModal,
    bookingModalMatch,
    roomDetailsMatch,
    totalPrizeMatch,
    selectedPlayerForDetails,
    matchDetailsScreen,
    showEditInfoModal,
    showChangePasswordModal,
    showRulesModal,
    showDevInfoModal,
    showAuthModal,
    showOverlayModal,
    selectedCategory,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    (window as any).__inAppMobileViewActive = true;

    // Seed history stack with distinct entries so Android webView.canGoBack() is always true
    try {
      if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#base') {
        window.history.replaceState({ screen: 'base' }, '', '#base');
        window.history.pushState({ screen: 'home' }, '', '#home');
      }
    } catch {}

    const onPopState = (e: PopStateEvent) => {
      const handled = handleInAppBackRef.current();
      if (handled) {
        // Handled in-app. Ensure base history depth so Android gesture never falls through
        try {
          if (!window.location.hash || window.location.hash === '' || window.location.hash === '#base') {
            window.history.pushState({ screen: 'home' }, '', '#home');
          }
        } catch {}
      } else {
        // Double press exit confirmed
        if ((window as any)?.Capacitor?.Plugins?.App?.exitApp) {
          (window as any).Capacitor.Plugins.App.exitApp();
        }
      }
    };

    window.addEventListener('popstate', onPopState);

    // Global listener for Android MainActivity.java to invoke directly via evaluateJavascript
    (window as any).__handleAndroidBack = () => {
      return handleInAppBackRef.current();
    };

    // Native Capacitor back button listener for Android APK
    let capListenerHandle: any = null;
    try {
      const capApp = (window as any)?.Capacitor?.Plugins?.App;
      if (capApp && capApp.addListener) {
        capListenerHandle = capApp.addListener('backButton', () => {
          (window as any).__handleAndroidBack?.();
        });
      }
    } catch {}

    return () => {
      (window as any).__inAppMobileViewActive = false;
      window.removeEventListener('popstate', onPopState);
      delete (window as any).__handleAndroidBack;
      if (capListenerHandle && capListenerHandle.remove) {
        capListenerHandle.remove();
      }
    };
  }, []);

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

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    if (!file.type.startsWith('image/')) {
      showPhoneToast('Please select a valid image file');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showPhoneToast('Image size should be under 8 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const updated = updateUser(currentUser.id, { avatar: base64 });
      if (updated) {
        setCurrentUser(updated);
        showPhoneToast('Profile picture updated successfully!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      if (authMode === 'REGISTER') {
        const uName = authUsername.trim();
        const email = authEmail.trim();

        if (!uName) {
          throw new Error('Please enter a username');
        }
        if (uName.length < 3) {
          throw new Error('Username must be at least 3 characters');
        }
        if (!email) {
          throw new Error('Please enter your email address (Gmail)');
        }
        if (!email.includes('@')) {
          throw new Error('Please enter a valid email address');
        }
        if (!authPassword) {
          throw new Error('Please enter a password');
        }
        if (authPassword.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        if (authPassword !== authConfirmPassword) {
          throw new Error('Passwords do not match');
        }

        // Maximum 3 accounts per device limit enforcement
        if (typeof window !== 'undefined') {
          try {
            const regRaw = localStorage.getItem('ff_device_registered_accounts');
            let registeredList: string[] = [];
            if (regRaw) {
              try {
                const parsed = JSON.parse(regRaw);
                if (Array.isArray(parsed)) registeredList = parsed;
              } catch {
                registeredList = [regRaw];
              }
            } else {
              const legacy = localStorage.getItem('ff_device_registered_account');
              if (legacy) registeredList = [legacy];
            }
            if (registeredList.length >= 3) {
              throw new Error('ডিভাইস লিমিট পূর্ণ হয়েছে! একটি ফোনে সর্বোচ্চ ৩টি অ্যাকাউন্ট খোলা যাবে (Maximum 3 accounts allowed per device).');
            }
          } catch (e: any) {
            if (e.message?.includes('ডিভাইস লিমিট') || e.message?.includes('3 accounts')) throw e;
          }
        }

        const res = await registerUser({
          username: uName,
          email: email.toLowerCase(),
          password: authPassword,
        });

        if (!res.success) {
          throw new Error(res.error || 'Registration failed');
        }
        if (res.user) {
          setCurrentUser(res.user);
        }
        setAuthSuccess(`Registration successful! Welcome, ${res.user?.username || res.user?.ign}`);
        setTimeout(() => {
          setShowAuthModal(false);
          setAuthSuccess(null);
          setAuthUsername('');
          setAuthEmail('');
          setAuthPassword('');
          setAuthConfirmPassword('');
        }, 800);
      } else {
        // LOGIN
        const identifier = (authUsername || authEmail || authPhone).trim();
        if (!identifier) {
          throw new Error('Please enter your username or email');
        }
        if (!authPassword) {
          throw new Error('Please enter your password');
        }

        const res = await loginUser(identifier, authPassword);
        if (!res.success) {
          throw new Error(res.error || 'Login failed. Please check your credentials.');
        }
        if (res.user) {
          setCurrentUser(res.user);
        }
        setAuthSuccess(`Login successful! Welcome, ${res.user?.username || res.user?.ign}`);
        setTimeout(() => {
          setShowAuthModal(false);
          setAuthSuccess(null);
          setAuthUsername('');
          setAuthEmail('');
          setAuthPassword('');
          setAuthConfirmPassword('');
        }, 800);
      }
    } catch (err: any) {
      setAuthError(err.message || 'An error occurred');
    } finally {
      setAuthLoading(false);
    }
  };


  // Booked matches list (hydrated from persistent storage, starts 0)
  const [bookedMatchesList, setBookedMatchesList] = useState<UserBookedMatch[]>([]);
  const [currentTickTime, setCurrentTickTime] = useState<number>(() => Date.now());
  const [botToast, setBotToast] = useState<string | null>(null);

  const showPhoneToast = (msg: string) => {
    setBotToast(msg);
    setTimeout(() => setBotToast(null), 3000);
  };

  useEffect(() => {
    // Hydrate user booked matches from persistent storage
    const storedBookings = getUserBookedMatches();
    setBookedMatchesList(storedBookings);

    const handleBookingsUpdated = (e: any) => {
      setBookedMatchesList(e.detail || getUserBookedMatches());
    };
    const handleCredentialsDelivered = () => {
      setBookedMatchesList(getUserBookedMatches());
    };

    const onBotCmsTrigger = () => {
      runBotRoomManagerCycle();
    };

    window.addEventListener('ff_user_bookings_updated', handleBookingsUpdated);
    window.addEventListener('ff_room_credentials_delivered', handleCredentialsDelivered);
    window.addEventListener('ff_cms_updated', onBotCmsTrigger);
    window.addEventListener('ff_match_added', onBotCmsTrigger);

    // Initial check & interval runner for Bot Room Credentials Manager
    runBotRoomManagerCycle();
    const botInterval = setInterval(() => {
      runBotRoomManagerCycle();
    }, 5000);

    return () => {
      window.removeEventListener('ff_user_bookings_updated', handleBookingsUpdated);
      window.removeEventListener('ff_room_credentials_delivered', handleCredentialsDelivered);
      window.removeEventListener('ff_cms_updated', onBotCmsTrigger);
      window.removeEventListener('ff_match_added', onBotCmsTrigger);
      clearInterval(botInterval);
    };
  }, []);

  // 1-second countdown timer: ONLY runs when activeTab === 'my-matches' to eliminate 60fps frame drops on Home and other screens
  useEffect(() => {
    if (activeTab !== 'my-matches') return;
    setCurrentTickTime(Date.now());
    const secondTimer = setInterval(() => {
      setCurrentTickTime(Date.now());
    }, 1000);
    return () => clearInterval(secondTimer);
  }, [activeTab]);

  // Auto-prune and synchronize expired bookings when 8-minute window finishes (only runs when on my-matches tab)
  useEffect(() => {
    if (activeTab !== 'my-matches' || bookedMatchesList.length === 0) return;
    const fresh = getUserBookedMatches();
    if (fresh.length !== bookedMatchesList.length) {
      setBookedMatchesList(fresh);
    }
  }, [activeTab, currentTickTime, bookedMatchesList.length]);

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
    window.addEventListener('ff_user_profile_updated', onUserUpdate);
    window.addEventListener('storage', onUserUpdate);

    return () => {
      window.removeEventListener('ff_notification_received', onNotif);
      window.removeEventListener('ff_notifications_read', onNotif);
      window.removeEventListener('ff_users_updated', onUserUpdate);
      window.removeEventListener('ff_user_profile_updated', onUserUpdate);
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
                roomDeliveredAt: bookingModalMatch.status === 'ROOM_OPEN' ? (bookingModalMatch.roomDeliveredAt || new Date().toISOString()) : undefined,
                userId: current?.id,
                userPhone: current?.phone,
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
                roomDeliveredAt: bookingModalMatch.status === 'ROOM_OPEN' ? (bookingModalMatch.roomDeliveredAt || new Date().toISOString()) : undefined,
                userId: current?.id,
                userPhone: current?.phone,
              }),
            ];

      setJoinedSuccess(true);
      setTimeout(() => {
        setJoinedSuccess(false);
        switchTab('my-matches');
      }, 1500);
    }
    setBookingModalMatch(null);
  };

  const categoriesList = React.useMemo(() => {
    const list = Object.values(categories || {});
    if (list.length > 0) return list;
    return Object.values(INITIAL_CATEGORIES);
  }, [categories]);
  const currentCategoryData = selectedCategory ? categories[selectedCategory] : null;
  const currentCategoryMatches = React.useMemo(
    () =>
      selectedCategory
        ? matches.filter((m) => m.categorySlug === selectedCategory && !isMatchFinished(m))
        : [],
    [selectedCategory, matches]
  );
  const completedCategoryMatches = React.useMemo(
    () =>
      selectedCategory
        ? matches.filter((m) => m.categorySlug === selectedCategory && isMatchFinished(m))
        : [],
    [selectedCategory, matches]
  );

  const [subTypeFilter, setSubTypeFilter] = useState<'ALL' | 'SOLO' | 'DUO' | 'SQUAD'>('ALL');
  const filteredCurrentMatches = React.useMemo(() => {
    return currentCategoryMatches.filter((m) => {
      const typeStr = (m.type || m.matchType || '').toUpperCase();
      const titleStr = (m.title || '').toUpperCase();
      const isDuoMatch =
        m.totalSlots === 4 ||
        typeStr === 'DUO' ||
        typeStr === '2 VS 2' ||
        typeStr === '2V2' ||
        typeStr.includes('2 VS 2') ||
        typeStr.includes('2V2') ||
        typeStr.includes('DUO') ||
        titleStr.includes('DUO') ||
        titleStr.includes('ডুও') ||
        titleStr.includes('2V2') ||
        titleStr.includes('2 VS 2') ||
        (m.totalSlots === 24 && !typeStr.includes('SQUAD'));

      const isSquadMatch =
        !isDuoMatch &&
        (m.totalSlots === 8 ||
          m.totalSlots === 48 ||
          typeStr === 'SQUAD' ||
          typeStr.includes('SQUAD') ||
          titleStr.includes('SQUAD') ||
          titleStr.includes('স্কোয়াড') ||
          typeStr.includes('4V4') ||
          typeStr.includes('4 VS 4') ||
          titleStr.includes('4V4') ||
          titleStr.includes('4 VS 4'));

      const is1v1OrSolo = !isDuoMatch && !isSquadMatch;

      if (subTypeFilter === 'ALL') return true;
      if (subTypeFilter === 'SOLO') {
        return is1v1OrSolo;
      }
      if (subTypeFilter === 'DUO') {
        return isDuoMatch;
      }
      if (subTypeFilter === 'SQUAD') {
        return isSquadMatch;
      }
      return true;
    });
  }, [currentCategoryMatches, subTypeFilter]);

  // Reset filter to SOLO whenever selected category changes
  useEffect(() => {
    setSubTypeFilter('ALL');
  }, [selectedCategory]);

  return (
    <div className="fixed inset-0 w-full h-full h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col transition-colors bg-white select-none lg:relative lg:inset-auto lg:h-auto lg:max-h-none lg:min-h-screen lg:overflow-visible lg:bg-slate-100 lg:dark:bg-[#07070a] lg:py-8 lg:px-4">
      {/* Premium Animated Esports Splash Loading Screen */}
      {splashVisible && (
        <div
          className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#07070a] select-none transition-opacity duration-300 ease-out ${
            splashFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          style={{ willChange: 'opacity' }}
        >
          {/* Ambient Esports Glow Background */}
          <div className="absolute w-80 h-80 rounded-full bg-red-600/20 blur-3xl -translate-y-8 pointer-events-none" />
          <div className="absolute w-60 h-60 rounded-full bg-amber-500/15 blur-2xl translate-y-16 pointer-events-none" />

          {/* Logo with pulsing glow aura */}
          <div className="relative mb-6 flex items-center justify-center">
            <div className="absolute -inset-3 rounded-3xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 opacity-40 blur-lg animate-pulse" />
            <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-b from-slate-900 to-black p-2.5 border border-red-500/40 shadow-2xl shadow-red-600/30 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="FF RIVAL TOUR BD"
                className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
            </div>
          </div>

          {/* App Title & Tagline */}
          <div className="text-center space-y-1 z-10 px-4">
            <h1 className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-gray-300 uppercase">
              FF RIVAL <span className="text-red-500 font-black">TOUR BD</span>
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/30 text-[10px] font-black tracking-widest text-amber-400 uppercase shadow-inner">
              <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>{tPhone('গেমিং প্ল্যাটফর্মে স্বাগতম', 'BANGLADESH ESPORTS TOURNAMENT')}</span>
            </div>
          </div>

          {/* Sleek Progress Bar */}
          <div className="w-56 mt-8 flex flex-col items-center gap-2 z-10">
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden border border-white/5 relative p-0.5">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-400 rounded-full transition-all duration-200 ease-out shadow-[0_0_12px_rgba(239,68,68,0.8)]"
                style={{ width: `${splashProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between w-full text-[10px] font-bold text-gray-400 px-0.5">
              <span>{splashProgress < 100 ? tPhone('লোড হচ্ছে...', 'Loading...') : tPhone('প্রস্তুত!', 'Ready!')}</span>
              <span className="font-mono text-amber-400 font-black">{splashProgress}%</span>
            </div>
          </div>

          {/* Verified Gaming Tag */}
          <div className="absolute bottom-7 flex items-center gap-1.5 text-[10px] text-gray-500 font-bold z-10">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>100% Safe & Instant Match Payouts</span>
          </div>
        </div>
      )}

      {/* Bot Action Toast */}
      {botToast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[110] bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-2xl animate-bounce flex items-center gap-2 border border-emerald-400">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{botToast}</span>
        </div>
      )}

      <div className="w-full h-full flex flex-col flex-1 min-h-0 overflow-hidden lg:max-w-7xl lg:mx-auto lg:h-auto lg:overflow-visible">
        {/* Top Breadcrumb & Controls (Desktop Only) */}
        <div className="hidden lg:flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-white dark:bg-white/5 p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
              <Link href="/" className="hover:text-red-600 transition-colors">
                {tPhone('হোম', 'Home')}
              </Link>
              <span>/</span>
              <span className="text-red-600 font-bold">
                FF RIVAL TOUR BD - {tPhone('মোবাইল অ্যাপ ভিউ', 'Mobile App View')}
              </span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-red-600" />
              FF RIVAL TOUR BD - {tPhone('মোবাইল অ্যাপ ইন্টারঅ্যাক্টিভ ভিউ', 'Mobile App Interactive Simulator')}
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {tPhone(
                'রুম রুলস, রেজিস্টার্ড প্লেয়ার্স লিস্ট ও টোটাল প্রাইজ ডিটেইলস লাইভ ইন্টারঅ্যাকশন।',
                'Live interactive testing for Room Rules, Registered Participants list, and Total Prize Details.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
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

            <button
              onClick={() => setPhoneTheme(phoneTheme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 transition-all text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10"
            >
              {phoneTheme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" /> {tPhone('লাইট মোড', 'Light Mode')}
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-700" /> {tPhone('ডার্ক মোড', 'Dark Mode')}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Workspace: Phone Mockup on Left + Image Column on Right */}
        <div className="w-full h-full flex flex-col flex-1 min-h-0 overflow-hidden lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start lg:overflow-visible">
          {/* LEFT: Phone Simulator */}
          <div className="w-full h-full flex flex-col flex-1 min-h-0 overflow-hidden lg:col-span-5 lg:flex lg:justify-center lg:overflow-visible">
            {/* Phone Chassis */}
            <div className="w-full h-full flex flex-col flex-1 min-h-0 p-0 border-0 rounded-none shadow-none bg-transparent overflow-hidden lg:relative lg:w-[380px] lg:h-[780px] lg:bg-slate-900 lg:rounded-[50px] lg:p-3 lg:shadow-2xl lg:ring-1 lg:ring-white/20 lg:border-4 lg:border-slate-700 flex flex-col">
              {/* Dynamic Island Notch (Desktop Only) */}
              <div className="hidden lg:flex absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 items-center justify-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-800"></div>
                <div className="w-2 h-2 rounded-full bg-blue-950"></div>
              </div>

              {/* Inside Screen Content */}
              <div
                onTouchStart={(e) => {
                  const t = e.touches[0];
                  if (t.clientX < 28) {
                    setEdgeTouchStart({ x: t.clientX, y: t.clientY });
                  }
                }}
                onTouchEnd={(e) => {
                  if (!edgeTouchStart) return;
                  const t = e.changedTouches[0];
                  const deltaX = t.clientX - edgeTouchStart.x;
                  const deltaY = Math.abs(t.clientY - edgeTouchStart.y);
                  if (deltaX > 40 && deltaX > deltaY) {
                    handleInAppBack();
                  }
                  setEdgeTouchStart(null);
                }}
                className="relative w-full h-full flex-1 min-h-0 overflow-hidden flex flex-col font-sans bg-white text-gray-900 rounded-none lg:rounded-[40px]"
              >


                {/* Guest Notice Bar if not logged in */}
                {!currentUser && (
                  <div className="flex-shrink-0 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 px-3.5 py-2 text-white flex items-center justify-between text-xs font-bold select-none z-40 shadow-sm">
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
                  className="flex-shrink-0 px-4 py-3 flex items-center justify-between border-b border-gray-200 bg-white relative z-30 shadow-sm"
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

                        {/* Support Icon */}
                        {(currentUser?.role === 'ADMIN' ||
                          currentUser?.id?.startsWith('u-paybot') ||
                          currentUser?.phone?.startsWith('0179900000')) && (
                          <button
                            type="button"
                            onClick={() => setShowPayBotModal(true)}
                            title="PayBot Mobile Connector"
                            className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-600 border border-emerald-500/40 text-[10px] font-black flex items-center gap-1 shadow-xs active:scale-95"
                          >
                            <Zap className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                            <span>PayBot</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleOpenSupport}
                          title={tPhone('২৪/৭ লাইভ সাপোর্ট', '24/7 Live Support')}
                          className="p-1.5 rounded-full relative transition-all bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-500/30 flex items-center justify-center active:scale-95 shadow-xs"
                        >
                          <Headphones className="w-3.5 h-3.5 text-emerald-600" />
                        </button>
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
                            FF Rivals
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Balance Pill [ 🪙 0.00 BDT ] */}
                        <button
                          type="button"
                          onClick={() => switchTab('wallet')}
                          className="px-2.5 py-1 rounded-full bg-[#4f46e5] hover:bg-[#4338ca] text-white text-[11px] font-black flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                        >
                          <Wallet className="w-3.5 h-3.5 text-white" />
                          <span>{userBalance.toFixed(2)} BDT</span>
                        </button>

                        {/* Circular User Avatar Preview */}
                        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-red-500 bg-slate-900 shadow-xs flex-shrink-0">
                          <img
                            src={currentUser?.avatar || '/avatars/avatar-1.png'}
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
                          onClick={() => switchTab('wallet')}
                          className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-600/10 text-red-600 border border-red-500/20 text-[10px] font-black"
                        >
                          <Wallet className="w-3 h-3" /> ৳{userBalance.toFixed(0)}
                        </button>

                        {/* PayBot Header Button */}
                        <button
                          type="button"
                          onClick={() => setShowPayBotModal(true)}
                          title="PayBot Mobile Connector"
                          className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 text-[10px] font-black flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                          <span>PayBot</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleOpenSupport}
                          title={tPhone('২৪/৭ লাইভ সাপোর্ট', '24/7 Live Support')}
                          className={`p-1.5 rounded-full relative transition-all flex items-center justify-center active:scale-95 shadow-xs ${
                            phoneTheme === 'dark'
                              ? 'bg-white/5 text-emerald-400 hover:text-white border border-emerald-500/30'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-500/30'
                          }`}
                        >
                          <Headphones className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* PAYBOT HOME FLOATING BANNER */}
                {(currentUser?.role === 'ADMIN' ||
                  currentUser?.id?.startsWith('u-paybot') ||
                  currentUser?.phone?.startsWith('0179900000')) && (
                  <div
                    onClick={() => setShowPayBotModal(true)}
                    className="flex-shrink-0 cursor-pointer bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white px-3.5 py-2 flex items-center justify-between text-xs font-bold shadow-md shadow-emerald-950/20 border-b border-emerald-400/30"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${isPaybotConnected ? 'bg-emerald-200 animate-ping' : 'bg-amber-300'}`} />
                      <span className="font-black tracking-wide text-[11px]">⚡ PayBot অটো-কালেক্টর</span>
                      <span className="text-[9px] bg-black/30 px-2 py-0.5 rounded-full text-emerald-200">
                        {currentUser?.ign || 'PAYBOT_DEVICE'}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="px-2.5 py-0.5 rounded-lg bg-black/40 hover:bg-black/60 text-[10px] font-black flex items-center gap-1 text-white border border-white/20"
                    >
                      <span>{isPaybotConnected ? 'ONLINE ✅' : 'ফোনে এক্সেস দিন'}</span> &rarr;
                    </button>
                  </div>
                )}

                {/* Success Banner */}
                {joinedSuccess && (
                  <div className="flex-shrink-0 bg-emerald-600 text-white text-xs px-3 py-2 text-center font-bold flex items-center justify-center gap-1.5 animate-pulse">
                    <CheckCircle className="w-4 h-4" /> {tPhone('ম্যাচ স্লট বুকিং সফল হয়েছে!', 'Match slot booking confirmed!')}
                  </div>
                )}

                {/* SCROLLABLE BODY with Touch Pull-to-Refresh */}
                <div
                  ref={scrollContainerRef}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 relative overscroll-y-contain [-webkit-overflow-scrolling:touch] touch-pan-y pb-24"
                >
                  {/* Pull-to-refresh spinner indicator (GPU accelerated, zero layout reflow) */}
                  {(isPulling || isRefreshing) && (
                    <div
                      className="flex items-center justify-center overflow-hidden pointer-events-none will-change-transform"
                      style={{
                        height: '42px',
                        marginTop: '-42px',
                        transform: `translate3d(0, ${Math.min(pullDistance, 55)}px, 0)`,
                        opacity: Math.min(1, pullDistance / 30),
                        transition: isPulling ? 'none' : 'transform 0.25s ease-out, opacity 0.25s ease-out',
                      }}
                    >
                      <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-white text-[11px] font-black shadow-xl border border-white/10 backdrop-blur-md">
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
                                Active Matches ({filteredCurrentMatches.length})
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
                                Match Results ({completedCategoryMatches.length})
                              </span>
                            </button>
                          </div>

                          {/* Match Sub-Type Switcher (All Category Options strictly in English) */}
                          {(() => {
                            const isLostToWin = selectedCategory === 'lost-to-win' || (selectedCategory || '').toLowerCase().includes('lost');
                            const isLoneWolf = selectedCategory === 'lone-wolf' || (selectedCategory || '').toLowerCase().includes('lone') || (selectedCategory || '').toLowerCase().includes('wolf');

                            let items = [
                              { key: 'SOLO', label: 'Solo' },
                              { key: 'DUO', label: 'Duo' },
                              { key: 'SQUAD', label: 'Squad' },
                            ];

                            if (isLostToWin) {
                              items = [{ key: 'SOLO', label: 'Solo' }];
                            } else if (isLoneWolf) {
                              // Squad completely removed from all Lone Wolf variants!
                              items = [
                                { key: 'SOLO', label: 'Solo' },
                                { key: 'DUO', label: 'Duo' },
                              ];
                            }

                            return (
                              <div className="flex items-center gap-1 p-1 rounded-xl border border-gray-200 bg-white shadow-xs">
                                {items.map((item) => (
                                  <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setSubTypeFilter(item.key as any)}
                                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all text-center cursor-pointer ${
                                      subTypeFilter === item.key
                                        ? 'bg-red-600 text-white shadow font-black'
                                        : 'text-gray-600 hover:text-gray-900 font-bold'
                                    }`}
                                  >
                                    {item.label}
                                  </button>
                                ))}
                              </div>
                            );
                          })()}

                          {categoryTab === 'PLAY' ? (
                            filteredCurrentMatches.length === 0 ? (
                            <div className="p-8 text-center rounded-2xl border border-dashed border-gray-300 bg-white text-gray-500 space-y-2">
                              <Trophy className="w-8 h-8 mx-auto text-gray-400" />
                              <p className="text-xs font-bold text-gray-700">
                                {tPhone('বর্তমানে কোনো ম্যাচ নেই', 'No Matches Active Currently')}
                              </p>
                              <p className="text-[10px] text-gray-500">
                                {tPhone(`এই ফিল্টারে (${subTypeFilter}) কোনো ম্যাচ পাওয়া যায়নি। অন্য ফিল্টার সিলেক্ট করুন।`, `No matches found for ${subTypeFilter}.`)}
                              </p>
                            </div>
                          ) : (
                            filteredCurrentMatches.map((m) => {
                              const matchBookings = bookedMatchesList
                                .filter((bm) => bm.title === m.title || bm.matchId === m.id)
                                .map((bm) => bm.ign);
                              const filled = Math.max(m.filledSlots || 0, Array.isArray(m.participants) ? m.participants.length : 0, matchBookings.length);
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
                                        কাস্টমে নিজের জায়গায় বসতে হবে বাধ্যতামূলক - আইডি লেভেল ৪০+ থাকতে হবে -
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
                                  {(() => {
                                    const userJoined = hasUserJoinedMatch(m.id, currentUser) ||
                                      bookedMatchesList.some((bm) => bm.matchId === m.id) ||
                                      (currentUser &&
                                        (m.participants || []).some(
                                          (p) =>
                                            (currentUser.ign && p.ign && p.ign.toLowerCase() === currentUser.ign.toLowerCase()) ||
                                            (currentUser.uid && p.uid && p.uid === currentUser.uid)
                                        ));
                                    const matchDate = parseScheduleTimeToDate(m.time);
                                    const isMatchLive = m.status === 'LIVE' || m.status === 'COMPLETED' || (m.status as string) === 'MATCHING' || spotsLeft <= 0 || (matchDate ? matchDate.getTime() <= Date.now() : false);

                                    return (
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
                                            <span>{isMatchLive ? tPhone('ম্যাচ লাইভ / সমাপ্ত', 'Match Live / Closed') : `Only ${spotsLeft} spots are left`}</span>
                                            <span className="text-gray-800 font-extrabold">
                                              {filled}/{m.totalSlots}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Join / Joined Button */}
                                        {userJoined ? (
                                          <button
                                            disabled
                                            className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md opacity-95 cursor-not-allowed flex items-center gap-1.5 flex-shrink-0"
                                          >
                                            <Check className="w-3.5 h-3.5" />
                                            {tPhone('জয়েন করা হয়েছে', 'JOINED')}
                                          </button>
                                        ) : isMatchLive ? (
                                          <span className="px-4 py-2 rounded-xl bg-red-600/10 border border-red-500/20 text-red-600 font-black text-xs flex-shrink-0">
                                            {tPhone('রেজিস্ট্রেশন বন্ধ', 'CLOSED')}
                                          </span>
                                        ) : (
                                          <button
                                            onClick={() => {
                                              if (!currentUser) {
                                                setShowAuthModal(true);
                                                return;
                                              }
                                              setBookingModalMatch(m);
                                            }}
                                            className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md active:scale-95 transition-all flex-shrink-0 cursor-pointer"
                                          >
                                            Join
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  {/* 4. Dual Action Buttons: Room Rules and Total Prize Details */}
                                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                                    <button
                                      onClick={() => setMatchDetailsScreen(m)}
                                      className="py-2 px-2.5 rounded-xl border border-blue-200 bg-blue-50/70 text-blue-700 text-[11px] font-black flex items-center justify-center gap-1.5 hover:bg-blue-100 active:scale-95 transition-all shadow-xs"
                                    >
                                      <Key className="w-3.5 h-3.5 text-blue-600" />
                                      <span>Room Rules</span>
                                      <span className="text-[10px] text-blue-500 font-mono">➔</span>
                                    </button>

                                    <button
                                      onClick={() => setTotalPrizeMatch(m)}
                                      className="py-2 px-2.5 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-800 text-[11px] font-black flex items-center justify-center gap-1 hover:bg-amber-100 active:scale-95 transition-all shadow-xs"
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
                              <div className="animate-train-marquee text-[11px] font-black text-gray-900 tracking-wide inline-flex items-center gap-8">
                                <span>
                                  {settings?.noticeText || tPhone(
                                    '🔥 FF RIVAL TOUR BD-তে স্বাগতম! প্রতিদিন টুর্নামেন্ট খেলুন এবং বিকাশ/নগদে প্রাইজ গ্রহণ করুন! 🏆 আইডি লেভেল ৪০+ বাধ্যতামূলক • ১০০% ফেয়ার ও হ্যাকমুক্ত টুর্নামেন্ট!',
                                    '🔥 Welcome to FF RIVAL TOUR BD! Play daily tournaments & win cash via bKash/Nagad! 🏆 Level 40+ Required • 100% Fair Gameplay!'
                                  )}
                                </span>
                                <span aria-hidden="true" className="text-red-600 font-black">•</span>
                                <span aria-hidden="true">
                                  {settings?.noticeText || tPhone(
                                    '🔥 FF RIVAL TOUR BD-তে স্বাগতম! প্রতিদিন টুর্নামেন্ট খেলুন এবং বিকাশ/নগদে প্রাইজ গ্রহণ করুন! 🏆 আইডি লেভেল ৪০+ বাধ্যতামূলক • ১০০% ফেয়ার ও হ্যাকমুক্ত টুর্নামেন্ট!',
                                    '🔥 Welcome to FF RIVAL TOUR BD! Play daily tournaments & win cash via bKash/Nagad! 🏆 Level 40+ Required • 100% Fair Gameplay!'
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 2. Interactive Image Carousel Slider (Admin Controlled - Pure Banner Graphic) */}
                          <div className="relative rounded-2xl overflow-hidden h-36 sm:h-44 bg-slate-950 border border-gray-200 shadow-md select-none">
                            {bannerSlides.map((slide, idx) => {
                              const isCurrent = idx === currentSlideIndex;
                              const bannerImgSrc = (slide.image && !slide.image.includes('unsplash.com'))
                                ? slide.image
                                : (INITIAL_BANNERS.find((b: any) => b.id === slide.id)?.image || INITIAL_BANNERS[idx]?.image || INITIAL_BANNERS[0]?.image || '/logo.png');
                              const slideContent = (
                                <div
                                  key={slide.id || idx}
                                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                                    isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                                  }`}
                                >
                                  <img
                                    src={bannerImgSrc}
                                    alt={slide.title || 'Banner'}
                                    loading="eager"
                                    decoding="async"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = INITIAL_BANNERS[idx]?.image || INITIAL_BANNERS[0]?.image || '/logo.png';
                                    }}
                                    className="w-full h-full object-cover object-center"
                                  />
                                </div>
                              );

                              if (slide.actionUrl) {
                                return (
                                  <a
                                    key={slide.id || idx}
                                    href={slide.actionUrl}
                                    target={slide.actionUrl.startsWith('http') ? '_blank' : '_self'}
                                    rel="noreferrer"
                                    className="cursor-pointer"
                                  >
                                    {slideContent}
                                  </a>
                                );
                              }
                              return slideContent;
                            })}

                            {/* Pagination Dot Indicators (Clean, no distracting side buttons) */}
                            {bannerSlides.length > 1 && (
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
                            )}
                          </div>

                          {/* Category Cards Grouped by Parent Section */}
                          {(() => {
                            const allCats = categoriesList;
                            const norm = (s: string = '') => (s || '').trim().toUpperCase();

                            const ffMatches = allCats.filter((c) => {
                              const s = norm(c.section);
                              return s === 'FREE FIRE MATCHES' || (!c.section && ['classic-match', 'clash-squad', 'lone-wolf', 'special-match'].includes(c.slug));
                            });

                            const match1v1 = allCats.filter((c) => {
                              const s = norm(c.section);
                              return s === 'FREE FIRE MATCH 1 VS 1' || s.includes('1 VS 1') || s.includes('1V1') || (!c.section && c.slug === 'lost-to-win');
                            });

                            const headshot = allCats.filter((c) => {
                              const s = norm(c.section);
                              return s === 'ONLY HEADSHOT' || s.includes('HEADSHOT') || (!c.section && c.slug === 'cs-only-headshot');
                            });

                            const placedSlugs = new Set([
                              ...ffMatches.map((c) => c.slug),
                              ...match1v1.map((c) => c.slug),
                              ...headshot.map((c) => c.slug),
                            ]);
                            const customCats = allCats.filter((c) => !placedSlugs.has(c.slug));

                            const renderCard = (cat: any) => {
                              const count = matches.filter((m) => m.categorySlug === cat.slug && !isMatchFinished(m)).length;
                              const catImgSrc = (cat.bannerImage && !cat.bannerImage.includes('unsplash.com'))
                                ? cat.bannerImage
                                : (INITIAL_CATEGORIES[cat.slug]?.bannerImage || cat.avatarImage || '/logo.png');
                              return (
                                <div
                                  key={cat.slug}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => setSelectedCategory(cat.slug)}
                                  className="group cursor-pointer rounded-xl overflow-hidden relative border border-white/10 shadow hover:border-red-500 active:scale-[0.96] transition-transform duration-100 ease-out h-28 flex flex-col justify-end p-2 bg-slate-900 touch-manipulation hover:shadow-lg"
                                >
                                  <img
                                    src={catImgSrc}
                                    alt={cat.name}
                                    loading="eager"
                                    decoding="async"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = INITIAL_CATEGORIES[cat.slug]?.bannerImage || '/logo.png';
                                    }}
                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform opacity-90"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent"></div>
                                  <div className="relative z-10">
                                    <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-red-600 text-white inline-block mb-0.5">
                                      {count} {tPhone('ম্যাচ', 'Matches')}
                                    </span>
                                    <h4 className="text-[11px] font-black text-white leading-tight truncate">
                                      {cat.name}
                                    </h4>
                                  </div>
                                </div>
                              );
                            };

                            return (
                              <div className="space-y-4">
                                {/* SECTION 1: FREE FIRE MATCHES (Header removed as requested) */}
                                {ffMatches.length > 0 && (
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                      {ffMatches.map(renderCard)}
                                    </div>
                                  </div>
                                )}

                                {/* SECTION 2: FREE FIRE MATCH 1 VS 1 */}
                                {match1v1.length > 0 && (
                                  <div className="space-y-2">
                                    <div className="text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 px-1 flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-1">
                                      <span>⚔️ {tPhone('ফ্রি ফায়ার ম্যাচ ১ VS ১ (FREE FIRE MATCH 1 VS 1)', 'FREE FIRE MATCH 1 VS 1')}</span>
                                      <span className="text-[9px] text-gray-400 font-bold">{match1v1.length} Categories</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      {match1v1.map(renderCard)}
                                    </div>
                                  </div>
                                )}

                                {/* SECTION 3: ONLY HEADSHOT */}
                                {headshot.length > 0 && (
                                  <div className="space-y-2">
                                    <div className="text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 px-1 flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-1">
                                      <span>🎯 {tPhone('ওনলি হেডশট (ONLY HEADSHOT)', 'ONLY HEADSHOT')}</span>
                                      <span className="text-[9px] text-gray-400 font-bold">{headshot.length} Categories</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      {headshot.map(renderCard)}
                                    </div>
                                  </div>
                                )}

                                {/* SECTION 4: OTHER CUSTOM CATEGORIES */}
                                {customCats.length > 0 && (
                                  <div className="space-y-2">
                                    <div className="text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 px-1 flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-1">
                                      <span>⭐ {tPhone('অন্যান্য টুর্নামেন্ট (OTHER TOURNAMENTS)', 'OTHER TOURNAMENTS')}</span>
                                      <span className="text-[9px] text-gray-400 font-bold">{customCats.length} Categories</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      {customCats.map(renderCard)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </>
                  )}

                  {/* TAB 2: MY MATCHES */}
                  {activeTab === 'my-matches' && (() => {
                    const activeBookedMatches = bookedMatchesList.filter((bm) => {
                      // Filter by current user: only show bookings belonging to this user
                      if (currentUser) {
                        if (bm.userId && bm.userId !== currentUser.id) return false;
                        if (bm.userPhone && bm.userPhone !== currentUser.phone) return false;
                        if (bm.uid && bm.uid !== currentUser.uid && !bm.userId) return false;
                      }

                      const liveMatch = matches.find((m) => m.id === bm.matchId || m.title === bm.title);

                      // If match is finished or completed, auto-expire ("time sesh hoi gele cole jbe")
                      if (liveMatch && (liveMatch.status === 'COMPLETED' || (liveMatch as any).isFinished || isMatchFinished(liveMatch))) {
                        return false;
                      }

                      const matchDate = parseScheduleTimeToDate(liveMatch?.time || bm.time, (liveMatch as any)?.startTimeIso);
                      const diffMs = matchDate ? matchDate.getTime() - currentTickTime : 999999;

                      // If match scheduled time has passed by 2 minutes, match has ended -> auto-expire!
                      if (matchDate && currentTickTime - matchDate.getTime() >= 2 * 60 * 1000) {
                        return false;
                      }

                      const isWithin5Minutes = diffMs > 0 && diffMs <= 5 * 60 * 1000;
                      const isRoomOpenStatus = liveMatch?.status === 'ROOM_OPEN' || liveMatch?.status === 'LIVE';
                      const hasCredentials = Boolean(liveMatch?.roomId || bm.roomId);
                      const isRoomReady = Boolean(hasCredentials && (isWithin5Minutes || isRoomOpenStatus));

                      const deliveredIso = bm.roomDeliveredAt || (liveMatch as any)?.roomDeliveredAt || (liveMatch as any)?.deliveredAt;
                      let deliveredMs: number | null = null;
                      if (deliveredIso) {
                        const parsed = new Date(deliveredIso).getTime();
                        if (!isNaN(parsed)) deliveredMs = parsed;
                      } else if (isRoomReady && matchDate) {
                        deliveredMs = Math.min(matchDate.getTime() - 5 * 60 * 1000, currentTickTime);
                      } else if (isRoomReady) {
                        deliveredMs = currentTickTime;
                      }

                      // 8 minutes = 8 * 60 * 1000 = 480,000 ms
                      const FIVE_MIN_MS = 5 * 60 * 1000;
                      if (deliveredMs && currentTickTime - deliveredMs >= FIVE_MIN_MS) {
                        return false; // Auto expired after 8 minutes ("৮ মিনিট এর পরে অটো চলে যাবে")
                      }

                      return true;
                    });

                    const formatRemainingTime = (totalSec: number) => {
                      const m = Math.floor(totalSec / 60);
                      const s = totalSec % 60;
                      return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
                    };

                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-red-600">
                            {tPhone(`আপনার বুক করা ম্যাচ (${activeBookedMatches.length})`, `Your Booked Matches (${activeBookedMatches.length})`)}
                          </span>
                          <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                            🔒 100% Private Pass
                          </span>
                        </div>

                        {activeBookedMatches.length === 0 ? (
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
                          activeBookedMatches.map((bm) => {
                            const liveMatch = matches.find((m) => m.id === bm.matchId || m.title === bm.title);

                            // Only reveal Room ID and Password if liveMatch status is ROOM_OPEN/LIVE, OR strictly within 5 minutes before match start
                            const matchDate = parseScheduleTimeToDate(liveMatch?.time || bm.time, (liveMatch as any)?.startTimeIso);
                            const diffMs = matchDate ? matchDate.getTime() - currentTickTime : 999999;
                            const isWithin5Minutes = diffMs > 0 && diffMs <= 5 * 60 * 1000;
                            const isRoomOpenStatus = liveMatch?.status === 'ROOM_OPEN' || liveMatch?.status === 'LIVE';
                            const hasCredentials = Boolean(liveMatch?.roomId || bm.roomId);
                            const isRoomReady = Boolean(hasCredentials && (isWithin5Minutes || isRoomOpenStatus));
                            const currentRoomId = isRoomReady ? (liveMatch?.roomId || bm.roomId) : null;
                            const currentRoomPass = isRoomReady ? (liveMatch?.roomPass || bm.roomPass || '1234') : null;

                            const deliveredIso = bm.roomDeliveredAt || (liveMatch as any)?.roomDeliveredAt || (liveMatch as any)?.deliveredAt;
                            let deliveredMs: number | null = null;
                            if (deliveredIso) {
                              const parsed = new Date(deliveredIso).getTime();
                              if (!isNaN(parsed)) deliveredMs = parsed;
                            } else if (isRoomReady && matchDate) {
                              deliveredMs = Math.min(matchDate.getTime() - 5 * 60 * 1000, currentTickTime);
                            } else if (isRoomReady) {
                              deliveredMs = currentTickTime;
                            }

                            const FIVE_MIN_MS = 5 * 60 * 1000;
                            const remainingSeconds = deliveredMs ? Math.max(0, Math.floor((deliveredMs + FIVE_MIN_MS - currentTickTime) / 1000)) : null;

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
                                  <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-300 space-y-2.5 shadow-xs">
                                    <div className="flex items-center justify-between text-[11px] pb-1 border-b border-emerald-200">
                                      <span className="font-black text-emerald-800 flex items-center gap-1">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                        🤖 {tPhone('রুম আইডি ও পাসওয়ার্ড ডেলিভারি সম্পন্ন', 'Room ID & Password Delivered')}
                                      </span>
                                      <span className="text-[9px] font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                                        ROOM OPEN
                                      </span>
                                    </div>

                                    {/* 8-Minute Auto-Expiry Live Countdown Banner */}
                                    {remainingSeconds !== null && (
                                      <div className="p-2 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between text-[11px]">
                                        <span className="font-black text-red-700 flex items-center gap-1.5">
                                          <Clock className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                                          {tPhone('পাসওয়ার্ডের মেয়াদ বাকি:', 'Password Expires In:')}
                                        </span>
                                        <span className="font-mono font-black text-red-700 bg-white px-2.5 py-0.5 rounded border border-red-300 shadow-xs">
                                          ⏱️ {formatRemainingTime(remainingSeconds)}
                                        </span>
                                      </div>
                                    )}

                                    {/* Room ID Row */}
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-gray-800 flex items-center gap-1.5 font-extrabold text-xs">
                                        <Key className="w-4 h-4 text-emerald-600" /> {tPhone('রুম আইডি:', 'Room ID:')}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono font-black text-gray-950 bg-white px-3 py-1 rounded-lg border border-emerald-300 text-xs shadow-xs select-all">
                                          {currentRoomId}
                                        </span>
                                        <button
                                          onClick={() => handleCopy(currentRoomId!, `room-${bm.id}`)}
                                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black flex items-center gap-1 shadow-xs transition-colors active:scale-95"
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

                                    {/* Room Password Row */}
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-gray-800 flex items-center gap-1.5 font-extrabold text-xs">
                                        <Lock className="w-4 h-4 text-emerald-600" /> {tPhone('রুম পাসওয়ার্ড:', 'Password:')}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono font-black text-gray-950 bg-white px-3 py-1 rounded-lg border border-emerald-300 text-xs shadow-xs select-all">
                                          {currentRoomPass}
                                        </span>
                                        <button
                                          onClick={() => handleCopy(currentRoomPass!, `pass-${bm.id}`)}
                                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black flex items-center gap-1 shadow-xs transition-colors active:scale-95"
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

                                    <p className="text-[9px] text-emerald-900 bg-white/80 p-2 rounded-lg border border-emerald-200 leading-tight">
                                      🎮 {tPhone(`ফ্রি ফায়ারে কাস্টম রুমে গিয়ে রুম আইডি ও পাসওয়ার্ড দিন এবং নির্দিষ্ট স্লট #${bm.slot} এ বসুন। পাসওয়ার্ড দেওয়ার ৮ মিনিট পর রুম স্বয়ংক্রিয়ভাবে বন্ধ হয়ে যাবে এবং ম্যাচটি তালিকা থেকে চলে যাবে।`, `Enter Room ID & Password in Free Fire custom room and take Slot #${bm.slot}. 8 minutes after password release, room closes and automatically disappears.`)}
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
                                        {tPhone('রুম আইডি ও পাসওয়ার্ড এখনও দেওয়া হয়নি (অ্যাডমিন দেওয়ার পর প্রদর্শিত হবে)', 'Room ID and Password will be provided by admin before match.')}
                                      </p>
                                      <p className="text-[10px] text-gray-500">
                                        {tPhone('ম্যাচ শুরু হওয়ার ৫ মিনিট পূর্বে অ্যাডমিন রুম আইডি দিলে এখানে প্রদর্শিত হবে।', 'Credentials will appear here once released by admin.')}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                <div className="flex justify-between items-center text-[10px] text-gray-500 pt-1 font-semibold">
                                  <span>{bm.ign ? `Player: ${bm.ign}` : 'Registered Player'}</span>
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
                            'সতর্কতা: রুম আইডি ও পাসওয়ার্ড অন্য কাউকে শেয়ার করলে অ্যাকাউন্ট স্থায়ীভাবে ব্যান করা হবে। পাসওয়ার্ড দেওয়ার ৮ মিনিট পর রুম ক্লোজ হয়ে যাবে।',
                            'Warning: Sharing Room ID & Password with outsiders will result in an instant permanent ban. Room closes 8 minutes after release.'
                          )}
                        </div>
                      </div>
                    );
                  })()}

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

                      {topPlayers.length === 0 ? (
                        <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5 my-3 shadow-xs">
                          <Trophy className="w-12 h-12 text-amber-500/40 mx-auto animate-pulse" />
                          <h4 className="text-sm font-black text-slate-800">
                            {tPhone('লিডারবোর্ড এখনো উন্মুক্ত হয়নি', 'Leaderboard Not Live Yet')}
                          </h4>
                          <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                            {tPhone(
                              'টুর্নামেন্টের অফিসিয়াল লাইভ ম্যাচ শুরু হওয়ার পর বিজয়ী ও সেরা প্লেয়ারদের কিল, র‍্যাংক ও প্রাইজমানি স্বয়ংক্রিয়ভাবে এখানে প্রদর্শিত হবে।',
                              'Player kills, wins, and ranks will automatically appear here once live tournament matches begin.'
                            )}
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Top 1 Hero Card */}
                          {topPlayers[0] && (
                        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 text-white shadow-lg space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded text-amber-300">
                              👑 #1 Champion
                            </span>
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
                                <span className="text-xs font-black text-gray-900 dark:text-white block truncate max-w-[120px]">
                                  {p.ign}
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
                        </>
                      )}
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
                            { name: 'Rocket', number: 'সাময়িক বন্ধ', color: 'border-gray-300 dark:border-white/10 text-gray-400 opacity-60' },
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
                          {(() => {
                            const userTxs = currentUser
                              ? getTransactions().filter((tx) => tx.userId === currentUser.id)
                              : [];

                            if (userTxs.length === 0) {
                              return (
                                <div className="p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 text-center text-[11px] text-gray-500 font-semibold">
                                  {tPhone('কোনো সাম্প্রতিক লেনদেন নেই', 'No recent transactions found')}
                                </div>
                              );
                            }

                            return userTxs.slice(0, 5).map((tx) => (
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
                                      ? (tx.category === 'manual_adjustment' || tx.reason?.includes('অ্যাডমিন') || tx.reason?.toLowerCase().includes('admin')
                                          ? '+ অ্যাডমিন কর্তৃক যোগ (Added by Admin)'
                                          : tx.category === 'match_winning' || tx.reason?.includes('প্রাইজ') || tx.reason?.includes('Prize')
                                          ? '+ টুর্নামেন্ট প্রাইজ (Winning)'
                                          : '+ ডিপোজিট (Deposit)')
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
                            ));
                          })()}
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
                              Login or Create Account
                            </h3>
                            <p className="text-[11px] text-gray-400">
                              Sign in to access your profile, wallet, withdraw and tournaments
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              onClick={() => {
                                setAuthMode('LOGIN');
                                setShowAuthModal(true);
                              }}
                              className="py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-md shadow-red-600/30 cursor-pointer"
                            >
                              Login
                            </button>
                            <button
                              onClick={() => {
                                setAuthMode('REGISTER');
                                setShowAuthModal(true);
                              }}
                              className="py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-xs shadow-md shadow-amber-500/30 cursor-pointer"
                            >
                              Register
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* PAYBOT DEDICATED CONNECTOR CARD */}
                          {(currentUser?.role === 'ADMIN' ||
                            currentUser?.id?.startsWith('u-paybot') ||
                            currentUser?.phone?.startsWith('0179900000')) && (
                            <div
                              onClick={() => setShowPayBotModal(true)}
                              className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-900 border border-emerald-500/50 p-4 rounded-3xl text-white shadow-lg shadow-emerald-950/30 flex items-center justify-between gap-3 cursor-pointer active:scale-98 transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                                  <Zap className="w-5 h-5 animate-pulse" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs font-black text-white">⚡ PayBot অটো-কালেক্টর</h4>
                                    <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full">
                                      {isPaybotConnected ? 'ONLINE' : 'OFFLINE'}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    বিকাশ ও নগদ অটো-ডিপোজিট রিসিভ করতে ফোনে এক্সেস দিন
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-black shadow-sm flex items-center gap-1"
                              >
                                কানেক্ট &rarr;
                              </button>
                            </div>
                          )}

                          {/* 1. PROFILE CARD (EXACT USER SCREENSHOT) */}
                          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                            {/* Blue-Violet Top Banner */}
                            <div className="h-16 bg-gradient-to-r from-[#6366f1] via-[#6d5dfc] to-[#8b5cf6] relative" />

                            <div className="px-4 pb-4 pt-0">
                              {/* Avatar and User Identity */}
                              <div className="flex items-end gap-3.5 -mt-9 mb-3">
                                <div className="relative group flex-shrink-0">
                                  <div className="relative w-20 h-20 rounded-full border-4 border-white shadow-md overflow-hidden bg-slate-900 flex-shrink-0">
                                    <img
                                      src={currentUser?.avatar || '/avatars/avatar-1.png'}
                                      alt="Avatar"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  {/* Camera / Edit Badge to upload directly from gallery */}
                                  <label
                                    htmlFor="profile-avatar-file-input"
                                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-md cursor-pointer border-2 border-white transition-transform active:scale-90"
                                    title="Upload photo from gallery"
                                  >
                                    <Camera className="w-3.5 h-3.5" />
                                  </label>
                                  <input
                                    id="profile-avatar-file-input"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarFileUpload}
                                  />
                                </div>
                                <div className="space-y-0.5 pb-1 min-w-0">
                                  <h3 className="text-base font-black text-slate-900 truncate">
                                    {currentUser?.username || currentUser?.ign || 'Abu Numan'}
                                  </h3>
                                  <p className="text-[11px] text-slate-400 font-mono">
                                    @{currentUser?.username || currentUser?.ign || 'player'}
                                  </p>
                                  <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                                    <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                    <span className="truncate">{currentUser?.email || (currentUser?.phone ? `${currentUser.phone}@gmail.com` : 'oahriahcna@gmail.com')}</span>
                                  </p>
                                </div>
                              </div>

                              {/* Action Buttons: [ ✏ Edit Info ] [ 🔑 Change Password ] */}
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditUsernameInput(currentUser?.username || currentUser?.ign || '');
                                    setEditEmailInput(currentUser?.email || '');
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
                              onClick={() => switchTab('top-players')}
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
                              onClick={handleOpenSupport}
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
                              onClick={handleOpenSupport}
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
                  className={`flex-shrink-0 h-16 w-full px-2 flex items-center justify-around border-t z-40 select-none pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.06)] ${
                    phoneTheme === 'dark'
                      ? 'bg-[#14141c] border-white/10'
                      : 'bg-white border-slate-200'
                  }`}
                  style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
                >
                  {/* 1. MATCH */}
                  <button
                    onClick={() => {
                      switchTab('home');
                      setSelectedCategory(null);
                    }}
                    className={`flex flex-col items-center gap-0.5 text-[9px] font-bold active:scale-90 transition-transform duration-100 ${
                      activeTab === 'home' ? 'text-red-500 font-black' : 'text-gray-400'
                    }`}
                  >
                    <Trophy className="w-4 h-4" />
                    <span>{tPhone('ম্যাচ', 'Matches')}</span>
                  </button>

                  {/* 2. MY MATCHES */}
                  <button
                    onClick={() => switchTab('my-matches')}
                    className={`flex flex-col items-center gap-0.5 text-[9px] font-bold active:scale-90 transition-transform duration-100 ${
                      activeTab === 'my-matches' ? 'text-red-500 font-black' : 'text-gray-400'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>{tPhone('আমার ম্যাচ', 'My Matches')}</span>
                  </button>

                  {/* 3. TOP PLAYERS */}
                  <button
                    onClick={() => switchTab('top-players')}
                    className={`flex flex-col items-center gap-0.5 text-[9px] font-bold active:scale-90 transition-transform duration-100 ${
                      activeTab === 'top-players' ? 'text-amber-500 font-black' : 'text-gray-400'
                    }`}
                  >
                    <Award className={`w-4 h-4 ${activeTab === 'top-players' ? 'text-amber-500 animate-bounce' : ''}`} />
                    <span>{tPhone('টপ প্লেয়ার', 'Top Players')}</span>
                  </button>

                  {/* 4. WALLET */}
                  <button
                    onClick={() => switchTab('wallet')}
                    className={`flex flex-col items-center gap-0.5 text-[9px] font-bold active:scale-90 transition-transform duration-100 ${
                      activeTab === 'wallet' ? 'text-red-500 font-black' : 'text-gray-400'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    <span>{tPhone('ওয়ালেট', 'Wallet')}</span>
                  </button>

                  {/* 5. PROFILE */}
                  <button
                    onClick={() => switchTab('profile')}
                    className={`flex flex-col items-center gap-0.5 text-[9px] font-bold active:scale-90 transition-transform duration-100 ${
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

          {/* RIGHT: Architecture & Feature Highlights (THE IMAGE COLUMN) */}
          <div className="hidden lg:block lg:col-span-7 space-y-6">
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
                  href="/"
                  className="px-5 py-3 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-900 dark:text-white transition-all flex items-center gap-1.5"
                >
                  {tPhone('হোমপেজে যান', 'Go to Homepage')}
                </Link>
              </div>
            </div>
          </div>
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

      {/* 6. AUTH LOGIN & REGISTER MODAL FOR MOBILE CLIENT (100% ENGLISH) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#12121a] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden p-6 space-y-4">
            <button
              type="button"
              onClick={() => {
                setShowAuthModal(false);
                setAuthError(null);
                setAuthSuccess(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-red-600 mx-auto flex items-center justify-center text-white shadow-lg shadow-red-600/30">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">
                {authMode === 'LOGIN' ? 'Account Login' : 'Create Account'}
              </h3>
              <p className="text-[11px] text-gray-400">
                {authMode === 'LOGIN'
                  ? 'Enter your username or email and password to enter'
                  : 'Register your account with username and email'}
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
                className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  authMode === 'LOGIN' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('REGISTER');
                  setAuthError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  authMode === 'REGISTER' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>

            {authError && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold text-center">
                {authError}
              </div>
            )}
            {authSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> {authSuccess}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {authMode === 'LOGIN' ? (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                        Username or Email
                      </label>
                      <button
                        type="button"
                        onClick={async () => {
                          const text = await readClipboardText();
                          if (text) setAuthUsername(text.trim());
                        }}
                        className="text-[10px] text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1 cursor-pointer"
                        title="Paste from clipboard"
                      >
                        <Clipboard className="w-3 h-3" />
                        <span>পেস্ট</span>
                      </button>
                    </div>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        autoComplete="username"
                        placeholder="Enter your username or email"
                        value={authUsername}
                        onChange={(e) => setAuthUsername(e.target.value)}
                        onPaste={(e) => {
                          const text = e.clipboardData?.getData('text');
                          if (text) {
                            e.preventDefault();
                            setAuthUsername(text.trim());
                          }
                        }}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={async () => {
                          const text = await readClipboardText();
                          if (text) setAuthPassword(text.trim());
                        }}
                        className="text-[10px] text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1 cursor-pointer"
                        title="Paste password"
                      >
                        <Clipboard className="w-3 h-3" />
                        <span>পেস্ট</span>
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showAuthPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        onPaste={(e) => {
                          const text = e.clipboardData?.getData('text');
                          if (text) {
                            e.preventDefault();
                            setAuthPassword(text.trim());
                          }
                        }}
                        className="w-full pl-9 pr-9 py-2 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAuthPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                      >
                        {showAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* REGISTER FORM: 1. Username 2. Gmail ID 3. Password 4. Confirm Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                        1. Username
                      </label>
                      <button
                        type="button"
                        onClick={async () => {
                          const text = await readClipboardText();
                          if (text) setAuthUsername(text.trim());
                        }}
                        className="text-[10px] text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1 cursor-pointer"
                        title="Paste from clipboard"
                      >
                        <Clipboard className="w-3 h-3" />
                        <span>পেস্ট</span>
                      </button>
                    </div>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        autoComplete="username"
                        placeholder="e.g. shadow_hunter"
                        value={authUsername}
                        onChange={(e) => setAuthUsername(e.target.value)}
                        onPaste={(e) => {
                          const text = e.clipboardData?.getData('text');
                          if (text) {
                            e.preventDefault();
                            setAuthUsername(text.trim());
                          }
                        }}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                        2. Gmail ID (Email)
                      </label>
                      <button
                        type="button"
                        onClick={async () => {
                          const text = await readClipboardText();
                          if (text) setAuthEmail(text.trim());
                        }}
                        className="text-[10px] text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1 cursor-pointer"
                        title="Paste from clipboard"
                      >
                        <Clipboard className="w-3 h-3" />
                        <span>পেস্ট</span>
                      </button>
                    </div>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="e.g. yourname@gmail.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        onPaste={(e) => {
                          const text = e.clipboardData?.getData('text');
                          if (text) {
                            e.preventDefault();
                            setAuthEmail(text.trim());
                          }
                        }}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                        3. Password
                      </label>
                      <button
                        type="button"
                        onClick={async () => {
                          const text = await readClipboardText();
                          if (text) setAuthPassword(text.trim());
                        }}
                        className="text-[10px] text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1 cursor-pointer"
                        title="Paste password"
                      >
                        <Clipboard className="w-3 h-3" />
                        <span>পেস্ট</span>
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showAuthPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        placeholder="At least 6 characters"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        onPaste={(e) => {
                          const text = e.clipboardData?.getData('text');
                          if (text) {
                            e.preventDefault();
                            setAuthPassword(text.trim());
                          }
                        }}
                        className="w-full pl-9 pr-9 py-2 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAuthPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                      >
                        {showAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                        4. Confirm Password
                      </label>
                      <button
                        type="button"
                        onClick={async () => {
                          const text = await readClipboardText();
                          if (text) setAuthConfirmPassword(text.trim());
                        }}
                        className="text-[10px] text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1 cursor-pointer"
                        title="Paste confirm password"
                      >
                        <Clipboard className="w-3 h-3" />
                        <span>পেস্ট</span>
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        placeholder="Re-enter password"
                        value={authConfirmPassword}
                        onChange={(e) => setAuthConfirmPassword(e.target.value)}
                        onPaste={(e) => {
                          const text = e.clipboardData?.getData('text');
                          if (text) {
                            e.preventDefault();
                            setAuthConfirmPassword(text.trim());
                          }
                        }}
                        className="w-full pl-9 pr-9 py-2 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Device Limitation Notice */}
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] flex items-center gap-1.5 font-medium">
                    <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Device Security: Only 1 account is permitted per device.</span>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg shadow-red-600/30 disabled:opacity-50 transition-all cursor-pointer"
              >
                {authLoading
                  ? 'Please wait...'
                  : authMode === 'LOGIN'
                  ? 'Login'
                  : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 7. EDIT INFO MODAL (WITH GALLERY AVATAR EDIT) */}
      {showEditInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Edit className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900">Edit Profile & Avatar</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditInfoModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Profile Avatar Gallery Picker */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="relative w-14 h-14 rounded-full border-2 border-white shadow-sm overflow-hidden bg-slate-900 flex-shrink-0">
                <img
                  src={editAvatarInput || currentUser?.avatar || '/avatars/avatar-1.png'}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-xs font-bold text-slate-900">Profile Picture</p>
                <label
                  htmlFor="edit-modal-avatar-file"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] shadow-sm cursor-pointer transition-all active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Choose from Gallery</span>
                </label>
                <input
                  id="edit-modal-avatar-file"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      setEditAvatarInput(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (currentUser) {
                  const updated = updateUser(currentUser.id, {
                    username: editUsernameInput.trim() || currentUser.username,
                    email: editEmailInput.trim() || currentUser.email,
                    ign: editIgnInput.trim().toUpperCase() || currentUser.ign,
                    uid: editUidInput.trim() || currentUser.uid,
                    avatar: editAvatarInput || currentUser.avatar,
                  });
                  if (updated) {
                    setCurrentUser(updated);
                    showPhoneToast('Profile updated successfully!');
                  }
                }
                setShowEditInfoModal(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={editUsernameInput}
                  onChange={(e) => setEditUsernameInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-bold"
                  placeholder="e.g. shadow_hunter"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Email Address (Gmail)
                </label>
                <input
                  type="email"
                  value={editEmailInput}
                  onChange={(e) => setEditEmailInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  placeholder="e.g. yourname@gmail.com"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  In-Game Name (IGN)
                </label>
                <input
                  type="text"
                  value={editIgnInput}
                  onChange={(e) => setEditIgnInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-bold"
                  placeholder="e.g. ABU NUMAN"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Free Fire UID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={editUidInput}
                    onChange={(e) => setEditUidInput(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-mono font-bold"
                    placeholder="e.g. 102910574942"
                  />
                  <button
                    type="button"
                    title="ক্লিপবোর্ড থেকে UID পেস্ট করুন"
                    onClick={async () => {
                      try {
                        const text = await readClipboardText();
                        if (text) setEditUidInput(text.trim());
                      } catch {}
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 active:scale-95 transition-all"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                Save Changes
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

      {/* 10. MANDATORY 20 MB LATEST APP UPDATE MODAL */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#180a0a] via-[#11111a] to-[#0a0a10] border-2 border-red-500/50 p-5 sm:p-6 text-white shadow-2xl shadow-red-600/30 text-center space-y-4">
            
            {/* Animated Badge Icon */}
            <div className="relative w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-red-600 via-amber-500 to-rose-600 p-0.5 shadow-2xl shadow-red-600/40">
              <div className="w-full h-full rounded-2xl bg-[#0f0a12] flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
              </div>
              <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-red-600 text-[10px] font-black tracking-wider text-white border-2 border-[#11111a] shadow-md animate-bounce">
                NEW 30 MB
              </span>
            </div>

            {/* Title & Warning */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-black uppercase tracking-wider mb-1">
                <ShieldAlert className="w-3 h-3 text-red-400" />
                অফিসিয়াল Android অ্যাপ
              </div>
              <h3 className="text-xl font-black tracking-wide text-white">
                FF RIVALS অ্যাপ ডাউনলোড করুন! 🚀
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed pt-1">
                সুপারফাস্ট টুর্নামেন্ট অভিজ্ঞতা ও নোটিফিকেশন পেতে আমাদের <span className="text-amber-400 font-bold">৩০ MB</span> অফিশিয়াল অ্যাপটি ফোনে ইনস্টল করুন।
              </p>
            </div>

            {/* Specs Badges */}
            <div className="flex items-center justify-center gap-2 text-[11px] font-bold">
              <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                📦 সাইজ: ৩০ এমবি (30 MB)
              </span>
              <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ⚡ ভার্সন: v3.5.0 Latest
              </span>
            </div>

            {/* What's New Feature List */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3 text-left space-y-2 text-[11px]">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider pb-0.5 border-b border-white/10">
                লেটেস্ট সংস্করণের নতুন সুবিধাসমূহ:
              </p>
              <div className="flex items-start gap-2 text-emerald-400 font-medium">
                <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>আসল ফ্রি ফায়ার UID অটো-ভেরিফাই ও রিয়েল ইন-গেম নেম</span>
              </div>
              <div className="flex items-start gap-2 text-emerald-400 font-medium">
                <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>ম্যাচ শুরুর ৫ মিনিট আগে অটোমেটিক রুম আইডি ও পাসওয়ার্ড</span>
              </div>
              <div className="flex items-start gap-2 text-amber-300 font-medium">
                <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>ইনস্ট্যান্ট bKash / Nagad ডিপোজিট ও উইথড্র সিস্টেম</span>
              </div>
              <div className="flex items-start gap-2 text-rose-300 font-medium">
                <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>মোবাইল সাইড-ব্যাক ফিক্সড ও সুপারফাস্ট ল্যাগ-ফ্রি পারফরম্যান্স</span>
              </div>
            </div>

            {/* Progress Bar (Visible while downloading) */}
            {updateDownloading && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[10px] font-bold text-gray-300">
                  <span>ডাউনলোড হচ্ছে...</span>
                  <span>{updateProgress}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-red-600 to-amber-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${updateProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Downloaded Success Notice */}
            {updateSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold space-y-1">
                <div className="flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>APK ফাইলটি ডাউনলোড শুরু হয়েছে!</span>
                </div>
                <p className="text-[10px] text-gray-300 font-normal">
                  আপনার ফোনের Downloads ফোল্ডার বা নোটিফিকেশন বার থেকে <span className="text-white font-bold">ffrivals.apk</span> ফাইলটি ওপেন করে &apos;Install&apos; বা &apos;Update&apos; করুন।
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              {!updateSuccess ? (
                <button
                  type="button"
                  onClick={() => {
                    setUpdateDownloading(true);
                    setUpdateProgress(20);
                    try {
                      // Trigger direct download via API endpoint with attachment header
                      window.location.href = '/api/download';
                      try {
                        if ((window as any)?.Capacitor?.Plugins?.App) {
                          window.open('/api/download', '_system');
                        }
                      } catch {}

                      const int = setInterval(() => {
                        setUpdateProgress((prev) => {
                          if (prev >= 95) {
                            clearInterval(int);
                            return 100;
                          }
                          return prev + 25;
                        });
                      }, 400);

                      setTimeout(() => {
                        setUpdateDownloading(false);
                        setUpdateSuccess(true);
                      }, 1800);
                    } catch {
                      window.location.href = '/api/download';
                      setUpdateDownloading(false);
                      setUpdateSuccess(true);
                    }
                  }}
                  disabled={updateDownloading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:brightness-110 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-red-600/40 transition-all border border-amber-400/30 cursor-pointer"
                >
                  <Download className={`w-5 h-5 ${updateDownloading ? 'animate-bounce' : ''}`} />
                  <span>
                    {updateDownloading ? 'ডাউনলোড হচ্ছে (৩০ MB)...' : '📥 অ্যাপ ডাউনলোড করুন (৩০ MB)'}
                  </span>
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        localStorage.setItem('ff_app_installed_version_v350', 'v3.5.0');
                      } catch {}
                      setShowUpdateModal(false);
                    }}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>ইনস্টল সম্পন্ন করেছি, অ্যাপে প্রবেশ করুন</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = '/api/download';
                    }}
                    className="w-full py-2 rounded-xl text-gray-400 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>পুনরায় ডাউনলোড করতে ক্লিক করুন (30 MB)</span>
                  </button>
                </div>
              )}

              {/* Direct APK Link */}
              <a
                href="/api/download"
                download="ffrivals.apk"
                className="block text-[11px] text-amber-400 hover:text-amber-300 font-bold underline pt-1"
              >
                📥 সরাসরি APK ডাউনলোড করুন (Direct Link - 30 MB)
              </a>

              {/* Skip / Continue button so player is never locked out */}
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem('ff_app_installed_version_v350', 'v3.5.0');
                  } catch {}
                  setShowUpdateModal(false);
                }}
                className="w-full py-2 text-[11px] text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
              >
                পরে আপডেট করব / সরাসরি অ্যাপে প্রবেশ করুন (Skip)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. PAYBOT CONNECT IN-APP MODAL */}
      {showPayBotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-slate-950 border border-emerald-500/40 p-5 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Zap className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">PayBot অটো-কালেক্টর</h3>
                  <p className="text-[10px] text-slate-400">{currentUser?.ign || 'PAYBOT_DEVICE'} ({currentUser?.phone})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPayBotModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isPaybotConnected ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
                <span className={`text-xs font-black uppercase ${isPaybotConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPaybotConnected ? 'ডিভাইস অনলাইন ও সিঙ্কড ✅' : 'ডিভাইস অফলাইন'}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isPaybotConnected
                  ? 'আপনার ফোন সার্ভারের সাথে সর্বদা সক্রিয় (Always Connected 24/7) আছে। গেম খেললেও বা অ্যাপ কেটে দিলেও ব্যাকগ্রাউন্ডে অলওয়েজ কানেক্টেড থাকবে। বিকাশ ও নগদে টাকা আসা মাত্রই সাথে সাথে প্লেয়ারের ব্যালেন্সে জমা হবে।'
                  : 'নিচের বাটনে চাপ দিয়ে ফোনে এক্সেস কানেক্ট করুন। একবার কানেক্ট করলে অ্যাপ কেটে দিলেও সর্বদা কানেক্টেড থাকবে। কোনো এসএমএস ফরওয়ার্ডার লাগবে না।'}
              </p>
              {isPaybotConnected && (
                <div className="pt-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 py-1 px-2 rounded-lg border border-emerald-500/20">
                  🛡️ অ্যাপ আনইনস্টল না করা পর্যন্ত সর্বদা ব্যাকগ্রাউন্ডে রানিং থাকবে
                </div>
              )}
            </div>

            {(!currentUser || (!currentUser.id?.startsWith('u-paybot') && !currentUser.phone?.startsWith('0179900000') && currentUser.role !== 'ADMIN')) && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-300 text-left">
                  কালেক্টর ডিভাইস আইডি সিলেক্ট করুন:
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { phone: '01799000001', label: 'ডিভাইস ১' },
                    { phone: '01799000002', label: 'ডিভাইস ২' },
                    { phone: '01799000003', label: 'ডিভাইস ৩' },
                    { phone: '01799000004', label: 'ডিভাইস ৪' },
                  ].map((d) => (
                    <button
                      key={d.phone}
                      type="button"
                      onClick={() => setSelectedPaybotPhone(d.phone)}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedPaybotPhone === d.phone
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-xs'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-[10px] font-black">{d.phone}</div>
                      <div className="text-[9px] text-slate-500">{d.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              {isPaybotConnected ? (
                <button
                  type="button"
                  onClick={() => {
                    handlePaybotDisconnect();
                  }}
                  className="w-full py-3 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-black"
                >
                  ডিসকানেক্ট করুন
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePaybotConnect}
                  disabled={isPaybotConnecting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  {isPaybotConnecting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      এক্সেস কানেক্ট হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-slate-950 text-slate-950" />
                      ফোনে এক্সেস দিয়ে কানেক্ট করুন
                    </>
                  )}
                </button>
              )}
            </div>

            {isPaybotConnected && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span>লাস্ট পিং (Heartbeat):</span>
                  <span className="font-mono text-emerald-400 font-bold">{paybotLastPing || 'সক্রিয়'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>সার্ভার স্ট্যাটাস:</span>
                  <span className="text-teal-300 font-bold">1s Realtime Auto-Credit</span>
                </div>
              </div>
            )}

            <div className="pt-1 flex items-center justify-between text-[11px]">
              <a
                href="/paybot-connect"
                className="text-emerald-400 hover:underline font-bold"
              >
                ফুল স্ক্রিন মোডে খুলুন &rarr;
              </a>
              <a
                href="/owner-gateway"
                className="text-slate-400 hover:underline font-bold"
              >
                ওনার গেটওয়ে
              </a>
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
                <span className="font-mono font-bold text-slate-900">FF Rivals</span>
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
                  <span>ফোনের <b>Settings ➔ Apps</b> এ গিয়ে <b>FF Rivals</b> সিলেক্ট করুন।</span>
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
                    window.location.href = 'intent:#Intent;action=android.settings.action.MANAGE_OVERLAY_PERMISSION;package=com.ffrivalstour.app;end';
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
