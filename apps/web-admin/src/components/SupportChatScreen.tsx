'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Send,
  Upload,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Bot,
  User,
  Sparkles,
  Zap,
  Image as ImageIcon,
  X,
  Phone,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import {
  SupportTicket,
  TicketMessage,
  addTicketReply,
  getSupportTickets,
  syncSupportTicketsFromServer,
} from '@/lib/support-store';

interface SupportChatScreenProps {
  ticket: SupportTicket;
  onBack: () => void;
  lang: 'bn' | 'en';
  onUpdateTicket?: (updated: SupportTicket) => void;
}

export default function SupportChatScreen({
  ticket: initialTicket,
  onBack,
  lang,
  onUpdateTicket,
}: SupportChatScreenProps) {
  const [ticket, setTicket] = useState<SupportTicket>(initialTicket);
  const [replyText, setReplyText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [activeImageZoom, setActiveImageZoom] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Slide-Back Gesture Handling
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [slideOffset, setSlideOffset] = useState<number>(0);
  const [isSlidingBack, setIsSlidingBack] = useState(false);

  const t = (bn: string, en: string) => (lang === 'en' ? en : bn);

  // Sync ticket messages live
  const reloadTicket = () => {
    const all = getSupportTickets();
    const found = all.find((t) => t.id === ticket.id);
    if (found) {
      setTicket(found);
      if (onUpdateTicket) onUpdateTicket(found);
    }
  };

  useEffect(() => {
    reloadTicket();
    syncSupportTicketsFromServer(ticket.userId, ticket.userPhone).then((list) => {
      const found = list.find((t) => t.id === ticket.id);
      if (found) {
        setTicket(found);
        if (onUpdateTicket) onUpdateTicket(found);
      }
    }).catch(() => {});

    const interval = setInterval(() => {
      reloadTicket();
    }, 2500);

    const handleUpdate = () => reloadTicket();
    window.addEventListener('ff_support_tickets_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('ff_support_tickets_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [ticket.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket.messages]);

  // Touch Gesture Listeners for edge slide back
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch.clientX < 45) {
      // User touched the left edge ("পকেট টান দিলে")
      setTouchStart({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = Math.abs(touch.clientY - touchStart.y);

    if (deltaX > 10 && deltaX > deltaY) {
      setSlideOffset(Math.max(0, deltaX));
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart) return;
    if (slideOffset > 75) {
      // Trigger smooth slide back!
      setIsSlidingBack(true);
      setTimeout(() => {
        onBack();
      }, 200);
    } else {
      setSlideOffset(0);
    }
    setTouchStart(null);
  };

  // Bot Quick Commands
  const botCommands = [
    {
      label: t('🎮 রুম পাসওয়ার্ড', '🎮 Room ID & Pass'),
      query: t('রুম আইডি ও পাসওয়ার্ড কখন পাবো?', 'When will I get Custom Room ID and Password?'),
    },
    {
      label: t('💳 টাকা আসেনি (TrxID)', '💳 Deposit Issue'),
      query: t('আমার বিকাশ/নগদ ডিপোজিট ব্যালেন্সে আসেনি', 'My bKash/Nagad deposit is not reflected in balance'),
    },
    {
      label: t('💸 উইথড্র কবে পাবো?', '💸 Withdraw Time'),
      query: t('আমার উইথড্র রিকোয়েস্ট কতক্ষণে অ্যাপ্রুভ হবে?', 'How long does withdrawal payout take?'),
    },
    {
      label: t('👥 স্কোয়াড স্লট নিয়ম', '👥 Squad Slot Rules'),
      query: t('স্কোয়াড ও সোলো ম্যাচে স্লট কীভাবে সিলেক্ট করব?', 'How are slots assigned for squad and solo matches?'),
    },
    {
      label: t('🛡️ অ্যান্টি-চিট পলিসি', '🛡️ Anti-Cheat Policy'),
      query: t('টুর্নামেন্টে ফেয়ার প্লে ও অ্যান্টি-চিট নিয়ম কী?', 'What are the tournament anti-cheat and fair play rules?'),
    },
  ];

  const handleSend = (textToSend?: string) => {
    const msg = (textToSend || replyText).trim();
    if (!msg && !imagePreview) return;

    setIsSending(true);
    const updated = addTicketReply(ticket.id, {
      senderRole: 'USER',
      senderName: ticket.userIgn || 'Player',
      message: msg || (imagePreview ? t('স্ক্রিনশট অ্যাটাচমেন্ট পাঠানো হয়েছে', 'Screenshot attachment sent') : ''),
      imageUrl: imagePreview || undefined,
    });

    if (updated) {
      setTicket(updated);
      if (onUpdateTicket) onUpdateTicket(updated);
    }

    setReplyText('');
    setImagePreview(null);
    setIsSending(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: isSlidingBack ? 'translateX(100%)' : `translateX(${slideOffset}px)`,
        transition: isSlidingBack ? 'transform 0.2s ease-out' : slideOffset ? 'none' : 'transform 0.25s ease-out',
      }}
      className="fixed inset-0 z-[100] flex flex-col bg-[#f8fafc] text-gray-900 select-none animate-slideInRight"
    >
      {/* Top Header Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-1 rounded-full hover:bg-gray-100 active:scale-90 text-gray-700 transition-all flex items-center gap-1 font-bold text-xs"
            title={t('স্লাইড ব্যাক', 'Slide Back')}
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
            <span className="hidden sm:inline">{t('ফিরে যান', 'Back')}</span>
          </button>

          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                #{ticket.id}
              </span>
              <span
                className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                  ticket.status === 'OPEN'
                    ? 'bg-rose-100 text-rose-700'
                    : ticket.status === 'IN_PROGRESS'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {ticket.status === 'OPEN'
                  ? t('খোলা আছে', 'OPEN')
                  : ticket.status === 'IN_PROGRESS'
                  ? t('চলমান', 'IN PROGRESS')
                  : t('সমাধান হয়েছে', 'RESOLVED')}
              </span>
            </div>
            <h3 className="text-xs font-black text-gray-900 truncate max-w-[200px] sm:max-w-[320px] mt-0.5">
              {ticket.subject}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black shadow-xs">
            <Bot className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI Support</span>
          </span>
        </div>
      </div>

      {/* AI Payment Auto-Verified Banner */}
      {ticket.paymentVerified && (
        <div className="mx-4 mt-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm flex items-center justify-between text-xs flex-shrink-0 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-black text-emerald-800">
                {t('পেমেন্ট স্বয়ংক্রিয়ভাবে ভেরিফাই হয়েছে ✅', 'Payment Auto-Verified by AI ✅')}
              </p>
              <p className="text-[10px] font-mono text-emerald-700">
                TrxID: {ticket.verifiedTrxId || 'APPROVED'}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-black font-mono text-xs shadow-sm">
            +৳{ticket.verifiedAmount || 100} Credited
          </span>
        </div>
      )}

      {/* Messages Thread Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {/* Welcome Header notice */}
        <div className="text-center py-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-200/60 text-gray-600 text-[10px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>
              {t(
                'AI সাপোর্ট অ্যাসিস্ট্যান্ট ২৪/৭ সক্রিয়। যেকোনো প্রশ্ন করুন।',
                'AI Support Assistant is active 24/7. Ask any inquiry.'
              )}
            </span>
          </div>
        </div>

        {ticket.messages.map((m) => {
          const isUser = m.senderRole === 'USER';
          const isAi = m.senderRole === 'AI_BOT' || m.senderName.toLowerCase().includes('ai support');
          const isAdmin = m.senderRole === 'ADMIN';

          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fadeIn`}
            >
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-1 px-1">
                {isAi ? (
                  <span className="inline-flex items-center gap-1 font-black text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-1.5 py-0.5 rounded text-[9px]">
                    <Bot className="w-2.5 h-2.5" /> AI Support
                  </span>
                ) : isAdmin ? (
                  <span className="inline-flex items-center gap-1 font-black text-blue-700 bg-blue-100/70 border border-blue-300 px-1.5 py-0.5 rounded text-[9px]">
                    👑 Admin Support
                  </span>
                ) : (
                  <span className="font-bold text-gray-700">{m.senderName}</span>
                )}
                <span>•</span>
                <span className="font-mono text-[9px]">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs space-y-2 shadow-sm ${
                  isUser
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white rounded-br-xs'
                    : isAi
                    ? 'bg-white border border-emerald-300 text-gray-900 rounded-bl-xs shadow-emerald-500/5'
                    : 'bg-white border border-blue-300 text-gray-900 rounded-bl-xs'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{m.message}</p>

                {m.imageUrl && (
                  <div className="pt-1">
                    <img
                      src={m.imageUrl}
                      alt="Attachment"
                      onClick={() => setActiveImageZoom(m.imageUrl || null)}
                      className="max-h-48 rounded-xl object-contain border border-black/10 cursor-pointer hover:opacity-90 transition-all bg-black/5"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Bot Quick Commands Scrollable Row */}
      <div className="bg-white border-t border-gray-200 px-3 py-2 overflow-x-auto scrollbar-none flex-shrink-0">
        <div className="flex items-center gap-1.5 min-w-max">
          <span className="text-[10px] font-black text-purple-600 uppercase flex items-center gap-1 mr-1">
            <Zap className="w-3 h-3 text-purple-600 fill-purple-600" />
            {t('কমান্ড:', 'Commands:')}
          </span>
          {botCommands.map((cmd, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isSending}
              onClick={() => handleSend(cmd.query)}
              className="px-3 py-1 rounded-full text-[10px] font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 hover:border-purple-300 active:scale-95 transition-all shadow-xs"
            >
              {cmd.label}
            </button>
          ))}
        </div>
      </div>

      {/* Image Preview Thumbnail if attached */}
      {imagePreview && (
        <div className="bg-white px-4 py-2 border-t border-gray-100 flex items-center gap-3 flex-shrink-0">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-300 shadow-sm">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setImagePreview(null)}
              className="absolute top-1 right-1 p-0.5 bg-black/70 text-white rounded-full text-[10px]"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <span className="text-[11px] font-bold text-emerald-600">
            ✓ {t('স্ক্রিনশট রেডি আছে', 'Screenshot attached')}
          </span>
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="bg-white border-t border-gray-200 p-3 flex items-center gap-2 flex-shrink-0 shadow-lg">
        <label className="p-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 cursor-pointer active:scale-95 transition-all flex items-center justify-center">
          <Upload className="w-4 h-4 text-red-600" />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>

        <input
          type="text"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={t('এখানে মেসেজ লিখুন বা উপরের কমান্ড চাপুন...', 'Type message or tap command above...')}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-medium focus:outline-none focus:border-red-500 focus:bg-white text-gray-900 transition-all placeholder-gray-400"
        />

        <button
          type="button"
          disabled={isSending || (!replyText.trim() && !imagePreview)}
          onClick={() => handleSend()}
          className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-red-600/30 active:scale-95 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Image Zoom Modal */}
      {activeImageZoom && (
        <div
          onClick={() => setActiveImageZoom(null)}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer"
        >
          <div className="relative max-w-xl max-h-[85vh]">
            <img
              src={activeImageZoom}
              alt="Zoomed"
              className="max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setActiveImageZoom(null)}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/70 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
