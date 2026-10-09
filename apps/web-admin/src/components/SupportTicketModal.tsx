'use client';

import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  MessageSquare,
  X,
  Send,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/user-store';
import {
  getUserTickets,
  createSupportTicket,
  addTicketReply,
  SupportTicket,
} from '@/lib/support-store';

interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupportTicketModal({ isOpen, onClose }: SupportTicketModalProps) {
  const currentUser = getCurrentUser();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE' | 'DETAIL'>('LIST');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // New Ticket Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'PAYMENT' | 'MATCH' | 'ACCOUNT' | 'OTHER'>('PAYMENT');
  const [message, setMessage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const refreshUserTickets = () => {
    if (!currentUser) return;
    const list = getUserTickets(currentUser.id, currentUser.phone);
    setTickets(list);
    if (selectedTicket) {
      const refreshed = list.find((t) => t.id === selectedTicket.id);
      if (refreshed) setSelectedTicket(refreshed);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshUserTickets();
    }

    const handleUpdate = () => refreshUserTickets();
    window.addEventListener('ff_support_tickets_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('ff_support_tickets_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [isOpen, currentUser?.id]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setAlertMsg({ type: 'error', text: 'অনুগ্রহ করে বিষয় ও বিস্তারিত বার্তা লিখুন' });
      return;
    }

    setSubmitting(true);
    setAlertMsg(null);

    const userId = currentUser?.id || 'u-guest';
    const userPhone = currentUser?.phone || '01700000000';
    const userIgn = currentUser?.ign || 'GUEST_PLAYER';

    const newTicket = createSupportTicket({
      userId,
      userPhone,
      userIgn,
      subject,
      category,
      message,
      imageUrl: imagePreview || undefined,
    });

    setSubmitting(false);
    setSubject('');
    setMessage('');
    setImagePreview(null);
    setSelectedTicket(newTicket);
    setActiveTab('DETAIL');
    refreshUserTickets();
    setAlertMsg({ type: 'success', text: 'সাপোর্ট টিকেট সফলভাবে জমা দেওয়া হয়েছে! অ্যাডমিন শীঘ্রই উত্তর দিবেন।' });
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    const userIgn = currentUser?.ign || currentUser?.phone || 'Player';
    const updated = addTicketReply(selectedTicket.id, {
      senderRole: 'USER',
      senderName: userIgn,
      message: replyText.trim(),
    });

    if (updated) {
      setReplyText('');
      setSelectedTicket(updated);
      refreshUserTickets();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#12121a] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-red-800 via-red-600 to-black text-white relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black/40 border border-white/20 flex items-center justify-center text-amber-400">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-wide">
                সাপোর্ট ও হেল্প ডেস্ক (Live Support)
              </h3>
              <p className="text-[11px] text-gray-200">
                পেমেন্ট, রুম আইডি বা যেকোনো সমস্যা সরাসরি এডমিনকে জানান।
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black/30 text-xs font-bold px-4 pt-2">
          <button
            onClick={() => {
              setActiveTab('LIST');
              setAlertMsg(null);
            }}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'LIST'
                ? 'border-red-600 text-red-600 dark:text-red-400 font-black'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            আমার টিকেটসমূহ ({tickets.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('CREATE');
              setAlertMsg(null);
            }}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1 ${
              activeTab === 'CREATE'
                ? 'border-red-600 text-red-600 dark:text-red-400 font-black'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> নতুন টিকেট খুলুন
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {alertMsg && (
            <div
              className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                alertMsg.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                  : 'bg-red-500/10 border-red-500/30 text-red-600'
              }`}
            >
              {alertMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{alertMsg.text}</span>
            </div>
          )}

          {/* TAB 1: TICKET LIST */}
          {activeTab === 'LIST' && (
            <div className="space-y-3">
              {tickets.length === 0 ? (
                <div className="py-12 text-center text-gray-500 space-y-3">
                  <MessageSquare className="w-10 h-10 mx-auto text-gray-400 opacity-60" />
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    আপনার কোনো পূর্ববর্তী সাপোর্ট টিকেট নেই।
                  </p>
                  <button
                    onClick={() => setActiveTab('CREATE')}
                    className="px-4 py-2 rounded-xl btn-red text-xs font-black inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> একটি নতুন টিকেট খুলুন
                  </button>
                </div>
              ) : (
                tickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTicket(t);
                      setActiveTab('DETAIL');
                    }}
                    className="p-3.5 rounded-2xl border border-gray-200 dark:border-white/10 hover:border-red-500/50 bg-gray-50/50 dark:bg-black/20 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-gray-400 font-bold">
                          #{t.id}
                        </span>
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            t.status === 'OPEN'
                              ? 'bg-rose-100 text-rose-700'
                              : t.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {t.status === 'OPEN'
                            ? 'জমা হয়েছে'
                            : t.status === 'IN_PROGRESS'
                            ? 'প্রসেসিং হচ্ছে'
                            : 'সমাধানকৃত'}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-gray-900 dark:text-white">
                        {t.subject}
                      </h4>
                      <p className="text-[10px] text-gray-400">
                        {new Date(t.updatedAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {t.messages.length}টি মেসেজ
                      </p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: CREATE NEW TICKET */}
          {activeTab === 'CREATE' && (
            <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  ক্যাটাগরি নির্বাচন করুন:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'PAYMENT', label: '💳 পেমেন্ট / ডিপোজিট' },
                    { id: 'MATCH', label: '🎮 ম্যাচ / রুম আইডি' },
                    { id: 'ACCOUNT', label: '👤 একাউন্ট সংক্রান্ত' },
                    { id: 'OTHER', label: '❓ অন্যান্য' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id as any)}
                      className={`p-2 rounded-xl border text-left font-bold transition-all ${
                        category === cat.id
                          ? 'border-red-600 bg-red-50 text-red-600 dark:bg-red-950/20'
                          : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  বিষয়ের শিরোনাম (Subject):
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="যেমন: বিকাশ ডিপোজিট এখনো যোগ হয়নি"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black font-bold focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  বিস্তারিত বর্ণনা (Description):
                </label>
                <textarea
                  rows={3}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="আপনার সমস্যাটি বিস্তারিত লিখুন (যেমন TrxID বা ম্যাচ নাম)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black font-medium focus:outline-none focus:border-red-500 leading-relaxed"
                />
              </div>

              {/* Screenshot Upload */}
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  স্ক্রিনশট যোগ করুন (ঐচ্ছিক):
                </label>
                <div className="flex items-center gap-3">
                  <label className="px-3 py-2 rounded-xl border border-dashed border-gray-300 dark:border-white/20 hover:border-red-500 bg-gray-50 dark:bg-white/5 cursor-pointer font-bold flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                    <Upload className="w-3.5 h-3.5 text-red-500" />
                    <span>ছবি আপলোড করুন</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {imagePreview && (
                    <span className="text-[10px] text-emerald-500 font-bold">
                      ✓ স্ক্রিনশট যুক্ত হয়েছে
                    </span>
                  )}
                </div>
                {imagePreview && (
                  <div className="mt-2 relative w-24 h-24 rounded-xl overflow-hidden border">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white text-[10px]"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl btn-red font-black text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'জমা হচ্ছে...' : 'টিকেট সাবমিট করুন'}</span>
              </button>
            </form>
          )}

          {/* TAB 3: TICKET DETAIL & CHAT */}
          {activeTab === 'DETAIL' && selectedTicket && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-red-600">
                    #{selectedTicket.id}
                  </span>
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      selectedTicket.status === 'OPEN'
                        ? 'bg-rose-100 text-rose-700'
                        : selectedTicket.status === 'IN_PROGRESS'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {selectedTicket.status === 'OPEN'
                      ? 'অপেক্ষমাণ'
                      : selectedTicket.status === 'IN_PROGRESS'
                      ? 'এডমিন প্রসেস করছেন'
                      : 'সমাধানকৃত'}
                  </span>
                </div>
                <h4 className="text-xs font-black text-gray-900 dark:text-white">
                  {selectedTicket.subject}
                </h4>
              </div>

              {/* Messages Thread */}
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {selectedTicket.messages.map((m) => {
                  const isUser = m.senderRole === 'USER';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[9px] text-gray-400 mb-0.5 px-1">
                        <span className="font-bold">{m.senderName}</span>
                        <span>•</span>
                        <span>{new Date(m.timestamp).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div
                        className={`max-w-[85%] p-3 rounded-2xl text-xs space-y-1.5 ${
                          isUser
                            ? 'bg-red-600 text-white rounded-br-xs'
                            : 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-gray-100 rounded-bl-xs'
                        }`}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap">{m.message}</p>
                        {m.imageUrl && (
                          <img
                            src={m.imageUrl}
                            alt="Attachment"
                            className="max-h-32 rounded-xl object-contain border border-black/20"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="flex gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
                <input
                  type="text"
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="এডমিনের উদ্দেশ্যে মেসেজ লিখুন..."
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black text-xs font-medium focus:outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl btn-red text-xs font-black flex items-center gap-1 shadow-md shadow-red-600/30"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
