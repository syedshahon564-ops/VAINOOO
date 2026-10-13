'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Smartphone,
  Zap,
  CheckCircle,
  Clock,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  Key,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Play,
  Volume2,
  VolumeX,
  Send,
  PlusCircle,
  Search,
  ExternalLink,
  ChevronRight,
  UserCheck,
  CreditCard,
  QrCode,
  Sliders,
  Sparkles,
  Link2,
  Globe,
  Radio,
  Layers,
} from 'lucide-react';

interface PaymentItem {
  id: string;
  trxId: string;
  provider: 'BKASH' | 'NAGAD' | string;
  sender: string;
  amount: number;
  status: 'CLAIMED' | 'UNCLAIMED' | string;
  claimedBy?: string | null;
  claimedAt?: string | null;
  rawMessage?: string;
  createdAt: string;
  autoCredited?: boolean;
}

interface ConnectedDevice {
  deviceId: string;
  deviceName: string;
  phone: string;
  status: string;
  battery: number;
  lastPing: string;
}

export default function OwnerGatewayPage() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard Data State
  const [stats, setStats] = useState<any>({
    totalReceived: 0,
    autoCredited: 0,
    unclaimed: 0,
    totalCount: 0,
    unclaimedCount: 0,
    devicesCount: 0,
  });
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [settings, setSettings] = useState({
    autoCreditEnabled: true,
    notifySound: true,
    secretApiKey: 'ff_rivals_secure_sms_key_2026',
    webhookUrl: 'https://web-production-2c40b.up.railway.app/api/webhook/payment',
  });
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Filter & Search
  const [searchTrx, setSearchTrx] = useState('');
  const [providerFilter, setProviderFilter] = useState<'ALL' | 'BKASH' | 'NAGAD'>('ALL');

  // Modals
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [showManualCreditModal, setShowManualCreditModal] = useState<PaymentItem | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showWebhookBridgeModal, setShowWebhookBridgeModal] = useState(false);

  // Webhook Bridge State (Connect with WebhookFlow & External Webhooks)
  const [webhookBridge, setWebhookBridge] = useState({
    enabled: true,
    name: 'nagad',
    externalUrl: 'http://localhost:5000/api/webhooks/whk_345e4ac9587b',
    secret: '',
    lastForwardStatus: 'READY',
    lastForwardAt: null as string | null,
    totalForwarded: 0,
    totalSuccess: 0,
  });
  const [bridgeSaving, setBridgeSaving] = useState(false);
  const [bridgeTesting, setBridgeTesting] = useState(false);
  const [bridgeTestResult, setBridgeTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Simulator Form State
  const [simProvider, setSimProvider] = useState<'BKASH' | 'NAGAD'>('BKASH');
  const [simSender, setSimSender] = useState('017' + Math.floor(10000000 + Math.random() * 90000000));
  const [simAmount, setSimAmount] = useState('300');
  const [simTrxId, setSimTrxId] = useState('BK' + Math.floor(10000000 + Math.random() * 90000000));
  const [simLoading, setSimLoading] = useState(false);

  // Manual Credit Form State
  const [manualTargetUser, setManualTargetUser] = useState('');
  const [manualCreditLoading, setManualCreditLoading] = useState(false);

  // Owner Password Update State
  const [newOwnerId, setNewOwnerId] = useState('');
  const [newOwnerPass, setNewOwnerPass] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  // Copy helper state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 1-Tap Quick SMS Scanner State
  const [quickSmsText, setQuickSmsText] = useState('');
  const [quickSmsLoading, setQuickSmsLoading] = useState(false);
  const [quickSmsResult, setQuickSmsResult] = useState<{ success: boolean; message: string } | null>(null);

  const handlePasteAndDetectSms = async () => {
    try {
      let text = '';
      if (typeof window !== 'undefined' && (window as any).AndroidBridge?.getClipboardText) {
        text = (window as any).AndroidBridge.getClipboardText() || '';
      }
      if (!text && typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        text = await navigator.clipboard.readText();
      }
      if (text) {
        setQuickSmsText(text);
        processQuickSms(text);
      } else {
        alert('ক্লিপবোর্ডে কোনো কপি করা টেক্সট পাওয়া যায়নি। আপনার ফোনের SMS কপি করে নিচের বক্সে পেস্ট করুন।');
      }
    } catch (e) {
      alert('ক্লিপবোর্ড সরাসরি রিড করা যায়নি। অনুগ্রহ করে বক্সে পেস্ট করুন।');
    }
  };

  const processQuickSms = async (textToProcess?: string) => {
    const content = (textToProcess || quickSmsText).trim();
    if (!content) return;
    setQuickSmsLoading(true);
    setQuickSmsResult(null);
    try {
      const res = await fetch('/api/webhook/payment?key=' + (settings.secretApiKey || 'ff_rivals_secure_sms_key_2026'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_message: content }),
      });
      const data = await res.json();
      if (data.success) {
        setQuickSmsResult({
          success: true,
          message: data.message || `✓ সফল হয়েছে! TrxID: ${data.data?.trxId || 'N/A'}, ৳${data.data?.amount || 0} অটো-ডিটেক্ট হয়েছে।`,
        });
        setQuickSmsText('');
        fetchData();
      } else {
        setQuickSmsResult({ success: false, message: data.error || 'এসএমএস থেকে TrxID বা টাকার পরিমাণ পাওয়া যায়নি।' });
      }
    } catch (err: any) {
      setQuickSmsResult({ success: false, message: err.message || 'রিকোয়েস্ট ফেইল্ড।' });
    } finally {
      setQuickSmsLoading(false);
    }
  };

  // Check saved session
  useEffect(() => {
    const saved = localStorage.getItem('ff_owner_token');
    if (saved) {
      setIsAuthenticated(true);
    }
    setAuthChecking(false);
  }, []);

  // Fetch Dashboard data
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/owner-bot', { cache: 'no-store' });
      const data = await res.json();
      if (data.ok) {
        setStats(data.stats || {});
        setPayments(data.payments || []);
        setDevices(data.devices || []);
        if (data.settings) setSettings(data.settings);
        if (data.webhookBridge) setWebhookBridge(data.webhookBridge);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      const interval = setInterval(fetchData, 8000); // Live poll every 8s
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await fetch('/api/owner-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          ownerId: loginId.trim(),
          ownerPass: loginPass.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok && data.token) {
        localStorage.setItem('ff_owner_token', data.token);
        setIsAuthenticated(true);
      } else {
        setLoginError(data.error || 'ভুল Owner ID বা পাসওয়ার্ড');
      }
    } catch (err: any) {
      setLoginError(err.message || 'কানেকশন এরর');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ff_owner_token');
    setIsAuthenticated(false);
  };

  // Toggle Auto-Credit
  const handleToggleAutoCredit = async () => {
    const newVal = !settings.autoCreditEnabled;
    setSettings((prev) => ({ ...prev, autoCreditEnabled: newVal }));
    try {
      await fetch('/api/owner-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_auto_credit', enabled: newVal }),
      });
      playBeep();
    } catch {}
  };

  // Trigger Audio Beep
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  };

  // Copy to clipboard helper
  const handleCopy = (text: string, label: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard?.writeText(text);
      setCopiedKey(label);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // Send Test Simulated SMS to Webhook
  const handleSimulateSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimLoading(true);
    try {
      const amt = parseFloat(simAmount) || 100;
      const rawMsg =
        simProvider === 'BKASH'
          ? `You have received Tk ${amt.toFixed(2)} from ${simSender}. TrxID ${simTrxId}`
          : `Money received. Amount: Tk ${amt.toFixed(2)}. Sender: ${simSender}. TxnID: ${simTrxId}`;

      const res = await fetch('/api/webhook/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.secretApiKey,
          'x-device-name': 'Owner Simulator Phone',
        },
        body: JSON.stringify({
          provider: simProvider,
          sender: simSender,
          amount: amt,
          trx_id: simTrxId,
          raw_message: rawMsg,
        }),
      });

      const data = await res.json();
      playBeep();
      setShowSimulateModal(false);
      // Generate new TrxId for next test
      setSimTrxId('TRX' + Math.floor(10000000 + Math.random() * 90000000));
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setSimLoading(false);
    }
  };

  // Manual Credit Balance
  const handleManualCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showManualCreditModal || !manualTargetUser.trim()) return;
    setManualCreditLoading(true);
    try {
      const res = await fetch('/api/owner-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'manual_credit',
          trxId: showManualCreditModal.trxId,
          userId: manualTargetUser.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setShowManualCreditModal(null);
        setManualTargetUser('');
        playBeep();
        fetchData();
      } else {
        alert(data.error || 'Failed to credit');
      }
    } catch (e: any) {
      alert(e.message || 'Error');
    } finally {
      setManualCreditLoading(false);
    }
  };

  // Update Owner Auth
  const handleUpdateOwnerAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/owner-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_owner_auth',
          newOwnerId: newOwnerId.trim(),
          newOwnerPass: newOwnerPass.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setUpdateSuccess('পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে!');
        setTimeout(() => {
          setUpdateSuccess(null);
          setShowSettingsModal(false);
        }, 1500);
      }
    } catch {}
  };

  // Webhook Bridge Handlers
  const handleSaveWebhookBridge = async () => {
    setBridgeSaving(true);
    setBridgeTestResult(null);
    try {
      const res = await fetch('/api/owner-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_webhook_bridge',
          enabled: webhookBridge.enabled,
          name: webhookBridge.name,
          externalUrl: webhookBridge.externalUrl,
          secret: webhookBridge.secret,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setWebhookBridge(data.webhookBridge);
        setBridgeTestResult({ success: true, message: '✓ Webhook Bridge সফলভাবে সেভ ও কানেক্ট হয়েছে!' });
        setTimeout(() => setShowWebhookBridgeModal(false), 1500);
      } else {
        setBridgeTestResult({ success: false, message: data.error || 'সেভ করা সম্ভব হয়নি।' });
      }
    } catch (err: any) {
      setBridgeTestResult({ success: false, message: err.message || 'রিকোয়েস্ট ফেইল্ড।' });
    } finally {
      setBridgeSaving(false);
    }
  };

  const handleTestWebhookBridge = async () => {
    setBridgeTesting(true);
    setBridgeTestResult(null);
    try {
      const res = await fetch('/api/owner-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_webhook_bridge',
          externalUrl: webhookBridge.externalUrl,
          secret: webhookBridge.secret,
        }),
      });
      const data = await res.json();
      if (data.ok && data.isSuccess) {
        setBridgeTestResult({
          success: true,
          message: data.message || `✓ সফলভাবে টেস্ট পে-লোড পাঠানো হয়েছে! (HTTP ${data.status})`,
        });
        if (data.webhookBridge) setWebhookBridge(data.webhookBridge);
      } else {
        setBridgeTestResult({
          success: false,
          message: data.message || data.error || `⚠️ রেসপন্স এসেছে: HTTP ${data.status || 'Unreachable'}`,
        });
        if (data.webhookBridge) setWebhookBridge(data.webhookBridge);
      }
    } catch (err: any) {
      setBridgeTestResult({
        success: false,
        message: 'কানেকশন ফেইল্ড: ' + (err.message || 'URL এ পৌঁছানো সম্ভব হয়নি'),
      });
    } finally {
      setBridgeTesting(false);
    }
  };

  // Filtered Payments
  const filteredPayments = payments.filter((p) => {
    if (providerFilter !== 'ALL' && p.provider !== providerFilter) return false;
    if (searchTrx) {
      const q = searchTrx.toLowerCase();
      return (
        p.trxId.toLowerCase().includes(q) ||
        p.sender.toLowerCase().includes(q) ||
        (p.claimedBy && p.claimedBy.toLowerCase().includes(q))
      );
    }
    return true;
  });

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a10] text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-md rounded-3xl border border-emerald-500/30 p-8 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Top glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              OWNER CONTROL APP
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              bKash & Nagad Auto-Deposit Verification & Bot Dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Owner ID / Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. admin"
                  className="w-full pl-3.5 pr-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Owner Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3.5 pr-10 py-3 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              {loginLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>প্রবেশ করুন (Access Dashboard)</span>
                </>
              )}
            </button>
          </form>

          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
            <span className="text-[11px] text-slate-400">
              Default Credentials: ID: <code className="text-emerald-400 font-bold">admin</code> | Pass: <code className="text-emerald-400 font-bold">owner1234</code>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD SCREEN
  return (
    <div className="min-h-screen bg-[#07070d] text-slate-100 p-3 sm:p-6 lg:p-8 space-y-6">
      {/* 1. Header Bar */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white">PAY-BOT OWNER HUB</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Free Fire Rivals • Real-time SMS Detection & Auto-Credit Engine
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              soundEnabled
                ? 'bg-slate-800 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-800/50 border-slate-700 text-slate-500'
            }`}
            title="Sound notification on incoming SMS"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'সাউন্ড চালু' : 'মিউট'}</span>
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <button
            onClick={() => setShowWebhookBridgeModal(true)}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
            title="Connect external webhook (WebhookFlow)"
          >
            <Link2 className="w-4 h-4 text-cyan-300" />
            <span>Webhook কানেক্ট</span>
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5"
          >
            <Sliders className="w-4 h-4 text-teal-400" />
            <span>সেটিংস</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>লগআউট</span>
          </button>
        </div>
      </header>

      {/* 2. 1-Tap Smart SMS Scanner Hero Box */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-black text-white">
                ১-ক্লিকে বিকাশ/নগদ SMS ডিটেক্টর (Easy 1-Tap Auto-Deposit)
              </h2>
              <p className="text-xs text-slate-400">
                ফোনে বিকাশ বা নগদ থেকে টাকা আসার যেকোনো SMS কপি করে নিচে পেস্ট করুন—বট স্বয়ংক্রিয়ভাবে টাকা যোগ করে দেবে!
              </p>
            </div>
          </div>
          <button
            onClick={handlePasteAndDetectSms}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 whitespace-nowrap"
          >
            <Copy className="w-4 h-4" />
            <span>📋 ক্লিপবোর্ড থেকে পেস্ট করুন</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <input
            type="text"
            placeholder="যেমন: You have received Tk 200.00 from 017xxxxxxxx... TrxID 9B7XYZ89"
            value={quickSmsText}
            onChange={(e) => setQuickSmsText(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
          />
          <button
            onClick={() => processQuickSms()}
            disabled={quickSmsLoading || !quickSmsText.trim()}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs flex items-center justify-center gap-2 shadow-md disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            {quickSmsLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            <span>অটো-অ্যাড করুন</span>
          </button>
        </div>

        {quickSmsResult && (
          <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
            quickSmsResult.success ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
          }`}>
            {quickSmsResult.success ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{quickSmsResult.message}</span>
          </div>
        )}
      </div>

      {/* 3. Top Control Panel (4 Feature Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Bot Auto-Credit Switch */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 shadow-lg space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-400" /> Auto-Credit Bot
            </span>
            <span
              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                settings.autoCreditEnabled
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {settings.autoCreditEnabled ? '● ACTIVE' : '○ PAUSED'}
            </span>
          </div>

          <div>
            <h3 className="text-base font-black text-white">
              স্বয়ংক্রিয় ব্যালেন্স অ্যাড (Auto-Deposit)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {settings.autoCreditEnabled
                ? 'এসএমএস আসা মাত্রই ইউজারের ওয়ালেটে ব্যালেন্স সরাসরি যুক্ত হয়ে যাবে।'
                : 'বট এখন বিরতিতে আছে, ম্যানুয়ালি ক্লিক করে ব্যালেন্স দিতে হবে।'}
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleToggleAutoCredit}
              className={`w-full py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md ${
                settings.autoCreditEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>
                {settings.autoCreditEnabled ? 'অটো-ক্রেডিট চালু আছে (Click to Pause)' : 'অটো-ক্রেডিট চালু করুন (Turn ON)'}
              </span>
            </button>
          </div>
        </div>

        {/* Card 2: Phone Connect Status */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-teal-400" /> Phone Listener
            </span>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30">
              {devices.length > 0 ? `${devices.length} Connected` : 'Not Linked'}
            </span>
          </div>

          <div>
            <h3 className="text-base font-black text-white truncate">
              {devices.length > 0 ? devices[0].deviceName : 'কোনো ফোন যুক্ত নেই'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {devices.length > 0
                ? `স্ট্যাটাস: 🟢 অনলাইন (Battery: ${devices[0].battery || 95}%) • bKash/Nagad লিসেনার রানিং`
                : 'আপনার মোবাইল ফোন কানেক্ট করুন যাতে পেমেন্ট এসএমএস স্বয়ংক্রিয়ভাবে ডিটেক্ট হয়।'}
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setShowConnectModal(true)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <QrCode className="w-4 h-4" />
              <span>ফোন কানেক্ট করুন (Setup Device)</span>
            </button>
          </div>
        </div>

        {/* Card 3: Test Simulator */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> Instant Tester
            </span>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Simulator
            </span>
          </div>

          <div>
            <h3 className="text-base font-black text-white">বট টেস্ট করুন (Simulate SMS)</h3>
            <p className="text-xs text-slate-400 mt-1">
              আসল টাকা না পাঠিয়েও ডেমো এসএমএস পাঠিয়ে বটের ডিটেকশন ও ব্যালেন্স অ্যাড পরীক্ষা করুন।
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setShowSimulateModal(true)}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <Send className="w-4 h-4 text-black" />
              <span>টেস্ট এসএমএস পাঠান (Simulate)</span>
            </button>
          </div>
        </div>

        {/* Card 4: Webhook Bridge / WebhookFlow Connector */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-indigo-500/30 shadow-lg space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-indigo-400" /> WebhookFlow
            </span>
            <span
              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                webhookBridge.enabled
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse'
                  : 'bg-slate-700/50 text-slate-400 border-slate-600'
              }`}
            >
              {webhookBridge.enabled ? '● LIVE' : '○ OFF'}
            </span>
          </div>

          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>{webhookBridge.name || 'nagad'}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Bridge
              </span>
            </h3>
            <p className="text-[11px] font-mono text-slate-400 mt-1 truncate bg-slate-950/80 p-1.5 rounded-lg border border-slate-800">
              {webhookBridge.externalUrl || 'URL সেট করা হয়নি'}
            </p>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
              <span>ফরওয়ার্ড: <strong className="text-white">{webhookBridge.totalForwarded || 0}</strong></span>
              <span>সফল: <strong className="text-emerald-400">{webhookBridge.totalSuccess || 0}</strong></span>
              <span>স্ট্যাটাস: <strong className="text-cyan-400">{webhookBridge.lastForwardStatus || 'READY'}</strong></span>
            </div>
          </div>

          <div className="pt-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowWebhookBridgeModal(true)}
              className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>কানেক্ট / এডিট</span>
            </button>
            <button
              onClick={handleTestWebhookBridge}
              disabled={bridgeTesting}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
            >
              {bridgeTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" /> : <Send className="w-3.5 h-3.5" />}
              <span>টেস্ট পিং</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 block uppercase">
            মোট পেমেন্ট এসেছে
          </span>
          <span className="text-2xl font-black text-white mt-1 block">
            ৳{stats.totalReceived?.toLocaleString() || 0}
          </span>
          <span className="text-[10px] text-slate-500">
            {stats.totalCount || 0} টি এসএমএস প্রসেসড
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-emerald-900/40">
          <span className="text-[11px] font-bold text-emerald-400 block uppercase">
            অটো-ক্রেডিট হয়েছে
          </span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block">
            ৳{stats.autoCredited?.toLocaleString() || 0}
          </span>
          <span className="text-[10px] text-emerald-500/80">
            সরাসরি অ্যাকাউন্টে যুক্ত
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-amber-900/40">
          <span className="text-[11px] font-bold text-amber-400 block uppercase">
            ক্লেইম না হওয়া (Unclaimed)
          </span>
          <span className="text-2xl font-black text-amber-400 mt-1 block">
            ৳{stats.unclaimed?.toLocaleString() || 0}
          </span>
          <span className="text-[10px] text-amber-500/80">
            {stats.unclaimedCount || 0} টি পেন্ডিং আছে
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
          <span className="text-[11px] font-bold text-cyan-400 block uppercase">
            কানেক্টেড ফোন
          </span>
          <span className="text-2xl font-black text-cyan-400 mt-1 block">
            {devices.length || 0}
          </span>
          <span className="text-[10px] text-cyan-500/80">
            🟢 লাইভ লিসেনার সক্রিয়
          </span>
        </div>
      </div>

      {/* 4. Live Payment Stream & Transaction Feed */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              লাইভ পেমেন্ট ও এসএমএস স্ট্রিম (Live Payments Stream)
            </h2>
            <p className="text-xs text-slate-400">
              ফোনে আসা bKash ও Nagad পেমেন্টের সার্বক্ষণিক রেকর্ড
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Filter buttons */}
            <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
              {(['ALL', 'BKASH', 'NAGAD'] as const).map((prov) => (
                <button
                  key={prov}
                  onClick={() => setProviderFilter(prov)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    providerFilter === prov
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {prov}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-48">
              <input
                type="text"
                placeholder="Search TrxID / Phone"
                value={searchTrx}
                onChange={(e) => setSearchTrx(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* Transactions Table / List */}
        <div className="overflow-x-auto">
          {filteredPayments.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Clock className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-400">কোনো পেমেন্ট নোটিফিকেশন পাওয়া যায়নি</p>
              <p className="text-xs text-slate-500">
                উপরের 'টেস্ট এসএমএস পাঠান' বাটনে ক্লিক করে একটি টেস্ট পেমেন্ট পাঠিয়ে পরীক্ষা করতে পারেন।
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">প্রোভাইডার</th>
                  <th className="py-3 px-3">TrxID</th>
                  <th className="py-3 px-3">প্রেরকের নম্বর</th>
                  <th className="py-3 px-3">পরিমাণ</th>
                  <th className="py-3 px-3">স্ট্যাটাস</th>
                  <th className="py-3 px-3">ইউজার</th>
                  <th className="py-3 px-3">সময়</th>
                  <th className="py-3 px-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredPayments.map((p) => {
                  const isBkash = p.provider === 'BKASH';
                  const isClaimed = p.status === 'CLAIMED';

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-black text-[10px] ${
                            isBkash
                              ? 'bg-pink-600/20 text-pink-400 border border-pink-500/30'
                              : 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                          }`}
                        >
                          {p.provider}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-white flex items-center gap-1.5">
                        <span>{p.trxId}</span>
                        <button
                          onClick={() => handleCopy(p.trxId, p.id)}
                          className="p-1 text-slate-500 hover:text-emerald-400"
                        >
                          {copiedKey === p.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-300">
                        {p.sender || 'N/A'}
                      </td>

                      <td className="py-3 px-3 font-black text-sm text-emerald-400">
                        ৳{p.amount}
                      </td>

                      <td className="py-3 px-3">
                        {isClaimed ? (
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            {p.autoCredited ? '⚡ AUTO-CREDITED' : 'CLAIMED'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            UNCLAIMED
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {p.claimedBy ? (
                          <span className="font-bold text-white flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                            {p.claimedBy}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">এখনো ক্লেইম করেনি</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                        {new Date(p.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-3 px-3 text-right">
                        {!isClaimed ? (
                          <button
                            onClick={() => setShowManualCreditModal(p)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm transition-all"
                          >
                            ⚡ ব্যালেন্স দিন
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-500 font-bold">✓ সম্পন্ন</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 5. MODAL: CONNECT PHONE / SMS FORWARDER GUIDE */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-teal-500/30 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-black text-white">ফোন কানেক্ট করার নিয়ম</h3>
              </div>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <p className="leading-relaxed">
                আপনার bKash ও Nagad সিম যে ফোনে আছে, সেই ফোনে প্লে-স্টোর থেকে যেকোনো ফ্রি <strong>SMS Forwarder</strong> (যেমন: <em className="text-white">SMS Forwarder - auto forward to Webhook</em> বা <em className="text-white">MacroDroid</em>) নামিয়ে নিচের কনফিগারেশন সেট করুন:
              </p>

              {/* Webhook URL */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Webhook URL (POST Destination)
                </span>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-teal-400 text-xs font-mono break-all">
                    {settings.webhookUrl}
                  </code>
                  <button
                    onClick={() => handleCopy(settings.webhookUrl, 'url')}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                  >
                    {copiedKey === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Secret API Key */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Header Key (x-api-key)
                </span>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-emerald-400 text-xs font-mono">
                    {settings.secretApiKey}
                  </code>
                  <button
                    onClick={() => handleCopy(settings.secretApiKey, 'key')}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                  >
                    {copiedKey === 'key' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Payload template */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  JSON Body Template
                </span>
                <pre className="text-[10px] font-mono text-slate-300 overflow-x-auto p-2 rounded bg-slate-900">
{`{
  "provider": "%sender_address%",
  "sender": "%from_number%",
  "amount": "%extracted_amount%",
  "trx_id": "%extracted_trxid%",
  "raw_message": "%sms_body%"
}`}
                </pre>
              </div>
            </div>

            <button
              onClick={() => setShowConnectModal(false)}
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs"
            >
              ঠিক আছে, বুঝতে পেরেছি
            </button>
          </div>
        </div>
      )}

      {/* 6. MODAL: TEST SIMULATE SMS */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">বট টেস্ট করুন (Simulate SMS)</h3>
              </div>
              <button
                onClick={() => setShowSimulateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSimulateSms} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">প্রোভাইডার</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimProvider('BKASH')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      simProvider === 'BKASH'
                        ? 'bg-pink-600/20 text-pink-400 border-pink-500'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    bKash
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimProvider('NAGAD')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      simProvider === 'NAGAD'
                        ? 'bg-orange-600/20 text-orange-400 border-orange-500'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    Nagad
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">প্রেরকের নম্বর</label>
                <input
                  type="text"
                  required
                  value={simSender}
                  onChange={(e) => setSimSender(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">টাকার পরিমাণ (৳)</label>
                  <input
                    type="number"
                    required
                    value={simAmount}
                    onChange={(e) => setSimAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">TrxID</label>
                  <input
                    type="text"
                    required
                    value={simTrxId}
                    onChange={(e) => setSimTrxId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono uppercase"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={simLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-xs hover:from-amber-400 hover:to-amber-500 shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {simLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>টেস্ট পেমেন্ট পাঠান (Trigger Bot)</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: MANUAL CREDIT BALANCE */}
      {showManualCreditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-black text-white">ম্যানুয়াল ব্যালেন্স ক্রেডিট</h3>
              <button
                onClick={() => setShowManualCreditModal(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>TrxID:</span>
                <span className="font-mono text-white font-bold">{showManualCreditModal.trxId}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>টাকার পরিমাণ:</span>
                <span className="font-bold text-emerald-400">৳{showManualCreditModal.amount}</span>
              </div>
            </div>

            <form onSubmit={handleManualCredit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  ইউজারের Username অথবা Phone নম্বর দিন
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BDX_STRIKER"
                  value={manualTargetUser}
                  onChange={(e) => setManualTargetUser(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={manualCreditLoading}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                {manualCreditLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span>ব্যালেন্স যুক্ত করুন (Confirm Credit)</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL: OWNER SETTINGS */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-black text-white">Owner Credentials চেঞ্জ</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateOwnerAuth} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">নতুন Owner ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. myowner"
                  value={newOwnerId}
                  onChange={(e) => setNewOwnerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">নতুন পাসওয়ার্ড</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newOwnerPass}
                  onChange={(e) => setNewOwnerPass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              {updateSuccess && (
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold">
                  {updateSuccess}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs"
              >
                পাসওয়ার্ড সেভ করুন
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 9. MODAL: WEBHOOK BRIDGE & URL CONNECTOR (WebhookFlow Integration) */}
      {showWebhookBridgeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 space-y-4 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>Webhook Bridge Connector</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      LIVE
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    WebhookFlow বা অন্য যেকোনো Webhook URL এর সাথে সরাসরি লিংক করুন
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWebhookBridgeModal(false)}
                className="text-slate-400 hover:text-white text-base"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Name & Active Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Webhook নাম (Identifier)
                  </label>
                  <input
                    type="text"
                    value={webhookBridge.name}
                    onChange={(e) => setWebhookBridge((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="যেমন: nagad"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    কানেকশন স্ট্যাটাস
                  </label>
                  <button
                    type="button"
                    onClick={() => setWebhookBridge((prev) => ({ ...prev, enabled: !prev.enabled }))}
                    className={`w-full py-2 px-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-1.5 ${
                      webhookBridge.enabled
                        ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    <span>{webhookBridge.enabled ? '● Active' : '○ Disabled'}</span>
                  </button>
                </div>
              </div>

              {/* External Webhook URL */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-300">
                    External Webhook URL (কানেক্ট করার URL):
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        let text = '';
                        if (typeof window !== 'undefined' && (window as any).AndroidBridge?.getClipboardText) {
                          text = (window as any).AndroidBridge.getClipboardText() || '';
                        }
                        if (!text && typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
                          text = await navigator.clipboard.readText();
                        }
                        if (text) {
                          setWebhookBridge((prev) => ({ ...prev, externalUrl: text.trim() }));
                        }
                      } catch {}
                    }}
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20"
                  >
                    <Copy className="w-2.5 h-2.5" />
                    <span>পেস্ট করুন</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={webhookBridge.externalUrl}
                  onChange={(e) => setWebhookBridge((prev) => ({ ...prev, externalUrl: e.target.value }))}
                  placeholder="যেমন: http://localhost:5000/api/webhooks/whk_345e4ac9587b"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>

              {/* Secret Header / Key */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Webhook Secret / Header Key (ঐচ্ছিক):
                </label>
                <input
                  type="text"
                  value={webhookBridge.secret}
                  onChange={(e) => setWebhookBridge((prev) => ({ ...prev, secret: e.target.value }))}
                  placeholder="Header x-api-key বা Secret Token (থাকলে দিন)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200"
                />
              </div>

              {/* Quick Info Box: Our System's Inbound Webhook URL */}
              <div className="p-3 rounded-2xl bg-slate-950/90 border border-indigo-500/20 space-y-2">
                <span className="text-[10px] font-bold text-indigo-300 uppercase block tracking-wider">
                  💡 আপনার নিজস্ব রিসিভিং Webhook URL (WebhookFlow তে বসানোর জন্য):
                </span>
                <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                  <code className="text-[11px] font-mono text-emerald-400 break-all select-all">
                    {`https://web-production-2c40b.up.railway.app/api/webhooks/${webhookBridge.name || 'whk_345e4ac9587b'}`}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy(`https://web-production-2c40b.up.railway.app/api/webhooks/${webhookBridge.name || 'whk_345e4ac9587b'}`, 'whk_direct')}
                    className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                  >
                    {copiedKey === 'whk_direct' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Test Result Message Box */}
              {bridgeTestResult && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                    bridgeTestResult.success
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {bridgeTestResult.success ? <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
                  <span>{bridgeTestResult.message}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 grid grid-cols-2 gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleTestWebhookBridge}
                disabled={bridgeTesting || !webhookBridge.externalUrl}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-indigo-500/30 text-indigo-300 font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {bridgeTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>টেস্ট পিং পাঠান</span>
              </button>

              <button
                type="button"
                onClick={handleSaveWebhookBridge}
                disabled={bridgeSaving}
                className="py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                {bridgeSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>সেভ ও কানেক্ট করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
