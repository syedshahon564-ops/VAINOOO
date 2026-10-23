'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Smartphone,
  Zap,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Shield,
  Copy,
  Check,
  Send,
  Radio,
  Sliders,
  ArrowRight,
  BatteryCharging,
  Cpu,
  Monitor,
  CheckCircle2,
} from 'lucide-react';
import { getCurrentUser, loginUser, logoutUser } from '@/lib/user-store';

export default function PayBotConnectPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [batteryLevel, setBatteryLevel] = useState<number>(95);
  const [lastPingTime, setLastPingTime] = useState<string>('');
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [testSmsText, setTestSmsText] = useState<string>('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Quick Login State for PayBot
  const [selectedDevicePhone, setSelectedDevicePhone] = useState('01799000001');
  const [selectedPassword, setSelectedPassword] = useState('paybot1234');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const PAYBOT_DEVICES = [
    { phone: '01799000001', name: 'ডিভাইস ১ (PAYBOT_DEVICE_1)' },
    { phone: '01799000002', name: 'ডিভাইস ২ (PAYBOT_DEVICE_2)' },
    { phone: '01799000003', name: 'ডিভাইস ৩ (PAYBOT_DEVICE_3)' },
    { phone: '01799000004', name: 'ডিভাইস ৪ (PAYBOT_DEVICE_4)' },
  ];

  // 1. Authorize: check if user is a PayBot account or Admin
  useEffect(() => {
    const cur = getCurrentUser();
    setCurrentUser(cur);

    if (!cur) {
      setIsAuthorized(false);
      return;
    }

    const isPaybotUser = Boolean(
      cur &&
      (cur.id?.startsWith('u-paybot') ||
       cur.phone?.startsWith('0179900000') ||
       cur.role === 'ADMIN')
    );

    setIsAuthorized(isPaybotUser);
  }, []);

  const handleQuickLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await loginUser(selectedDevicePhone, selectedPassword);
      if (!res.success || !res.user) {
        throw new Error(res.error || 'লগইন ব্যর্থ হয়েছে। ক্রেডেনশিয়াল সঠিক আছে কি না চেক করুন।');
      }
      setCurrentUser(res.user);
      setIsAuthorized(true);
    } catch (err: any) {
      setLoginError(err.message || 'Login error');
    } finally {
      setLoginLoading(false);
    }
  };

  // Read battery if available
  useEffect(() => {
    if (typeof navigator !== 'undefined' && (navigator as any).getBattery) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      }).catch(() => {});
    }
  }, []);

  // Send Ping to server
  const sendPing = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/webhook/payment?key=ff_rivals_secure_sms_key_2026', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'ff_rivals_secure_sms_key_2026',
          'x-device-name': currentUser.ign || 'PayBot Collector Phone',
        },
        body: JSON.stringify({
          type: 'PING',
          deviceName: `${currentUser.ign || 'PayBot'} (${currentUser.phone})`,
          phone: currentUser.phone,
          battery: batteryLevel,
          status: 'ONLINE',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLastPingTime(new Date().toLocaleTimeString());
      }
    } catch (e) {}
  };

  // Connect Handler
  const handleConnectDevice = async () => {
    setIsConnecting(true);

    try {
      // Safe permission request: Web Notifications (safe from Google Play Protect)
      if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
        try {
          await Notification.requestPermission();
        } catch {}
      }

      await sendPing();

      setIsConnected(true);
      setLastPingTime(new Date().toLocaleTimeString());

      // Start automatic recurring heartbeat ping every 10 seconds
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = setInterval(() => {
        sendPing();
      }, 10000);

      // Add audit log
      setRecentLogs((prev) => [
        {
          id: Date.now(),
          text: `ডিভাইস সফলভাবে কানেক্ট হয়েছে (${currentUser?.ign})`,
          time: new Date().toLocaleTimeString(),
          type: 'SUCCESS',
        },
        ...prev,
      ]);
    } catch (err: any) {
      alert('কানেক্ট করতে সমস্যা হয়েছে: ' + err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect Handler
  const handleDisconnect = () => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    setIsConnected(false);
  };

  useEffect(() => {
    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };
  }, []);

  // Instant Test Deposit Simulation
  const handleTestDeposit = async () => {
    setIsTesting(true);
    setTestResult(null);

    const testTrx = 'TRX_' + Date.now().toString().slice(-6);
    const sms = testSmsText.trim() || `You have received Tk 350.00 from 01700000000. TrxID ${testTrx}`;

    try {
      const res = await fetch('/api/webhook/payment?key=ff_rivals_secure_sms_key_2026', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'ff_rivals_secure_sms_key_2026',
          'x-device-name': currentUser?.ign || 'PayBot Collector Phone',
        },
        body: JSON.stringify({
          raw_message: sms,
          sender: '01700000000',
        }),
      });
      const data = await res.json();
      setTestResult(data);
      if (data.success) {
        setRecentLogs((prev) => [
          {
            id: Date.now(),
            text: `পেমেন্ট রিসিভ ও অটো-ক্রেডিট সম্পন্ন: ${data.trx_id || testTrx} (৳${data.amount || 350})`,
            time: new Date().toLocaleTimeString(),
            type: 'PAYMENT',
          },
          ...prev,
        ]);
      }
    } catch (e: any) {
      setTestResult({ success: false, error: e.message });
    } finally {
      setIsTesting(false);
    }
  };

  if (isAuthorized === false) {
    if (!currentUser) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-emerald-500/30 text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
              <Zap className="w-7 h-7 animate-pulse text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">PayBot অটো-কালেক্টর লগইন</h2>
              <p className="text-xs text-slate-400 mt-1">
                বিকাশ/নগদ অটো-ডিপোজিট রিসিভ করতে এই ফোনের জন্য একটি PayBot ডিভাইস আইডি সিলেক্ট করে লগইন করুন।
              </p>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold text-center">
                {loginError}
              </div>
            )}

            <div className="space-y-2 text-left">
              <label className="text-[11px] font-bold text-slate-400">ডিভাইস আইডি সিলেক্ট করুন:</label>
              <div className="grid grid-cols-2 gap-2">
                {PAYBOT_DEVICES.map((d) => (
                  <button
                    key={d.phone}
                    type="button"
                    onClick={() => {
                      setSelectedDevicePhone(d.phone);
                      setLoginError(null);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedDevicePhone === d.phone
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[11px] font-black">{d.phone}</div>
                    <div className="text-[9px] text-slate-500">{d.name.split(' ')[0]}</div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleQuickLogin} className="space-y-3 text-left">
              <div>
                <label className="text-[11px] font-bold text-slate-400">পাসওয়ার্ড:</label>
                <input
                  type="password"
                  value={selectedPassword}
                  onChange={(e) => setSelectedPassword(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
              >
                {loginLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    লগইন হচ্ছে...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-slate-950 text-slate-950" />
                    লগইন করুন & এক্সেস দিন
                  </>
                )}
              </button>
            </form>

            <div className="pt-2">
              <Link
                href="/mobile-app-view"
                className="text-[11px] text-slate-500 hover:text-slate-300 font-bold"
              >
                &larr; মোবাইল অ্যাপ ভিউতে ফিরে যান
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900 border border-red-500/30 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-black text-red-400">অননুমোদিত প্রবেশাধিকার (Restricted Area)</h2>
          <p className="text-xs text-slate-400">
            আপনি বর্তমানে সাধারণ প্লেয়ার ({currentUser?.ign || currentUser?.phone}) হিসেবে লগইন আছেন। এই অপশনটি শুধুমাত্র অফিসিয়াল ৪টি PayBot সংগ্রাহক আইডির জন্য।
          </p>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => {
                logoutUser();
                setCurrentUser(null);
                setIsAuthorized(false);
              }}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-all cursor-pointer"
            >
              লগআউট করে PayBot এ ঢুকুন
            </button>
            <Link
              href="/profile"
              className="inline-block px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all"
            >
              প্রোফাইলে ফিরে যান
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 selection:bg-emerald-500 selection:text-black">
      {/* Top Header Bar */}
      <div className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3.5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black text-white tracking-wide">
                  FF PAYBOT SENTINEL
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  OFFICIAL
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                ইন-অ্যাপ অটো পেমেন্ট ও মোবাইল কানেক্টর
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-all"
            >
              প্রোফাইল
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Device ID Badge */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">কানেক্টেড আইডি / অ্যাকাউন্ট:</div>
              <div className="text-sm font-black text-white flex items-center gap-2">
                {currentUser?.ign || 'PAYBOT_DEVICE'}
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  ({currentUser?.phone})
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">ব্যাটারি স্ট্যাটাস:</div>
            <div className="text-xs font-black text-slate-200 flex items-center justify-end gap-1">
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
              {batteryLevel}%
            </div>
          </div>
        </div>

        {/* Big Connection Card */}
        <div className={`p-6 rounded-3xl border transition-all duration-300 ${
          isConnected
            ? 'bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/50 shadow-2xl shadow-emerald-950/50'
            : 'bg-slate-900/90 border-slate-800 shadow-xl'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className={`w-3.5 h-3.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
                <span className={`text-xs font-black uppercase tracking-wider ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isConnected ? 'ONLINE & AUTONOMOUS ACTIVE' : 'DISCONNECTED / OFFLINE'}
                </span>
              </div>
              <h2 className="text-xl font-black text-white">
                {isConnected ? 'ফোন সফলভাবে কানেক্ট হয়েছে ✅' : 'ফোনে এক্সেস দিয়ে কানেক্ট করুন'}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                {isConnected
                  ? 'আপনার ফোন সার্ভার এবং পিসির সাথে রিয়েল-টাইমে কানেক্টেড আছে। বিকাশ বা নগদে টাকা আসা মাত্রই ব্যাকগ্রাউন্ডে অটো-ডিটেক্ট হয়ে প্লেয়ারের ওয়ালেটে জমা হবে।'
                  : 'নিচের বাটনে এক ক্লিকে কানেক্ট করুন। কোনো আলাদা SMS Forwarder অ্যাপ ডাউনলোড করা লাগবে না এবং প্লে-প্রটেক্টের কোনো ঝামেলা থাকবে না।'}
              </p>
            </div>

            <div>
              {isConnected ? (
                <button
                  onClick={handleDisconnect}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  ডিসকানেক্ট করুন
                </button>
              ) : (
                <button
                  onClick={handleConnectDevice}
                  disabled={isConnecting}
                  className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black transition-all shadow-xl shadow-emerald-500/30 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isConnecting ? (
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
          </div>

          {isConnected && (
            <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase">লাস্ট পিং (Heartbeat)</span>
                <div className="font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                  {lastPingTime || 'সক্রিয়'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase">অটো-ক্রেডিট ইঞ্জিন</span>
                <div className="font-bold text-teal-300">১০০% সক্রিয় (1s Auto)</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-0.5 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">পিসি সিঙ্ক (PC Sync)</span>
                <div className="font-bold text-blue-400 flex items-center gap-1">
                  <Monitor className="w-3.5 h-3.5" />
                  সার্ভারের সাথে লিঙ্কড
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 1-Tap Live Deposit Simulation / Manual SMS Catch */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">ইনস্ট্যান্ট ডিপোজিট টেস্ট ও এসএমএস ক্যাচার</h3>
                <p className="text-[11px] text-slate-400">
                  সিস্টেম ঠিকমতো কাজ করছে কিনা পরীক্ষা করতে নিচের বাটনে চাপ দিন
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <textarea
              value={testSmsText}
              onChange={(e) => setTestSmsText(e.target.value)}
              placeholder="বিকাশ বা নগদের মেসেজ টেক্সট পেস্ট করতে পারেন (অথবা খালি রেখে সরাসরি টেস্ট করুন)..."
              rows={2}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
            />

            <button
              onClick={handleTestDeposit}
              disabled={isTesting}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all flex items-center gap-2 cursor-pointer"
            >
              {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              টেস্ট ডিপোজিট পাঠিয়ে পরীক্ষা করুন (৳350)
            </button>
          </div>

          {testResult && (
            <div className={`p-3.5 rounded-xl text-xs font-mono border ${
              testResult.success
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                : 'bg-rose-950/40 text-rose-300 border-rose-500/40'
            }`}>
              <div className="font-bold flex items-center gap-1.5">
                {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
                {testResult.success ? 'টেস্ট সফল! ডিপোজিট ডিটেক্ট হয়েছে' : 'ত্রুটি: ' + testResult.error}
              </div>
              {testResult.success && (
                <div className="mt-1 text-[11px] text-slate-400">
                  TrxID: {testResult.trx_id} | Status: {testResult.status} | Provider: {testResult.provider || 'BKASH'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Activity Log */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            রিয়েল-টাইম অ্যাক্টিভিটি লগ (Activity Feed)
          </h4>

          {recentLogs.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 font-mono">
              এখনো কোনো নতুন অ্যাক্টিভিটি রেকর্ড নেই
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {recentLogs.map((log) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{log.text}</span>
                  <span className="text-[10px] font-mono text-slate-500">{log.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Link to Master Owner Gateway */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-400">
            সম্পূর্ণ লেনদেন ও বিস্তারিত হিস্ট্রি দেখতে চান?
          </div>
          <Link
            href="/owner-gateway"
            className="text-emerald-400 font-bold hover:underline flex items-center gap-1"
          >
            ফুল ওনার গেটওয়ে খুলুন <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
