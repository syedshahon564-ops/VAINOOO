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
  Bot,
  Sparkles,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/user-store';
import {
  getUserTickets,
  createSupportTicket,
  addTicketReply,
  syncSupportTicketsFromServer,
  SupportTicket,
} from '@/lib/support-store';

interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'bn' | 'en';
  onOpenChat?: (ticket: SupportTicket) => void;
}

export default function SupportTicketModal({
  isOpen,
  onClose,
  lang = 'bn',
  onOpenChat,
}: SupportTicketModalProps) {
  const currentUser = getCurrentUser();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE'>('LIST');

  // New Ticket Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'PAYMENT' | 'MATCH' | 'ACCOUNT' | 'OTHER'>('PAYMENT');
  const [message, setMessage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const t = (bn: string, en: string) => (lang === 'en' ? en : bn);

  const refreshUserTickets = () => {
    if (!currentUser) return;
    const list = getUserTickets(currentUser.id, currentUser.phone);
    setTickets(list);

    syncSupportTicketsFromServer(currentUser.id, currentUser.phone)
      .then((serverList) => {
        const filtered = serverList.filter(
          (t) => t.userId === currentUser.id || (currentUser.phone && t.userPhone === currentUser.phone)
        );
        setTickets(filtered);
      })
      .catch(() => {});
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
      setAlertMsg({
        type: 'error',
        text: t('অনুগ্রহ করে বিষয় এবং বিস্তারিত বিবরণ দিন।', 'Please fill in both the Subject and Description.'),
      });
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
    refreshUserTickets();

    // Immediately transition to the dedicated, full-screen Support Chat Screen!
    if (onOpenChat) {
      onClose();
      onOpenChat(newTicket);
    }
  };

  const handleSelectTicket = (tkt: SupportTicket) => {
    if (onOpenChat) {
      onClose();
      onOpenChat(tkt);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-gray-900">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-red-700 via-red-600 to-black text-white relative flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black/40 border border-white/20 flex items-center justify-center text-amber-400 shadow-inner">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black uppercase tracking-wide">
                  {t('হেল্প ডেস্ক ও লাইভ সাপোর্ট', 'Help Desk & Live Support')}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-black border border-emerald-400/30">
                  <Bot className="w-3 h-3" /> AI Active
                </span>
              </div>
              <p className="text-[11px] text-gray-200">
                {t('ডিপোজিট, রুম পাসওয়ার্ড ও টুর্নামেন্ট সমস্যা তৎক্ষণাৎ সমাধান করুন।', 'Instant automated assistance for deposits, room IDs, and inquiries.')}
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
        <div className="flex border-b border-gray-200 bg-gray-50 text-xs font-bold px-4 pt-2">
          <button
            onClick={() => {
              setActiveTab('LIST');
              setAlertMsg(null);
            }}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'LIST'
                ? 'border-red-600 text-red-600 font-black'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {t(`আমার টিকিটসমূহ (${tickets.length})`, `My Tickets (${tickets.length})`)}
          </button>
          <button
            onClick={() => {
              setActiveTab('CREATE');
              setAlertMsg(null);
            }}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1 ${
              activeTab === 'CREATE'
                ? 'border-red-600 text-red-600 font-black'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> {t('নতুন টিকিট খুলুন', 'Open New Ticket')}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {alertMsg && (
            <div
              className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                alertMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-red-50 border-red-300 text-red-700'
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
            <div className="space-y-2.5">
              {tickets.length === 0 ? (
                <div className="py-12 text-center text-gray-500 space-y-3">
                  <MessageSquare className="w-10 h-10 mx-auto text-gray-400 opacity-60" />
                  <p className="text-xs font-bold text-gray-700">
                    {t('কোনো সক্রিয় সাপোর্ট টিকিট নেই।', 'You have no active support tickets.')}
                  </p>
                  <button
                    onClick={() => setActiveTab('CREATE')}
                    className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-black inline-flex items-center gap-1.5 shadow-md shadow-red-600/30 active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> {t('নতুন টিকিট খুলুন', 'Open New Ticket')}
                  </button>
                </div>
              ) : (
                tickets.map((tkt) => (
                  <div
                    key={tkt.id}
                    onClick={() => handleSelectTicket(tkt)}
                    className="p-3.5 rounded-2xl border border-gray-200 hover:border-red-500 bg-gray-50/70 hover:bg-red-50/20 cursor-pointer transition-all flex items-center justify-between shadow-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-gray-500 font-bold">
                          #{tkt.id}
                        </span>
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            tkt.status === 'OPEN'
                              ? 'bg-rose-100 text-rose-700'
                              : tkt.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {tkt.status === 'OPEN'
                            ? t('খোলা আছে', 'Submitted')
                            : tkt.status === 'IN_PROGRESS'
                            ? t('চলমান', 'In Progress')
                            : t('সমাধান হয়েছে', 'Resolved')}
                        </span>
                        {tkt.paymentVerified && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            ✓ {t('পেমেন্ট অ্যাপ্রুভড', 'Payment Verified')}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-black text-gray-900 line-clamp-1">
                        {tkt.subject}
                      </h4>
                      <p className="text-[10px] text-gray-500">
                        {new Date(tkt.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {tkt.messages.length} {t('টি মেসেজ (চ্যাট করতে ট্যাপ করুন)', 'messages (tap to open chat)')}
                      </p>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: CREATE NEW TICKET */}
          {activeTab === 'CREATE' && (
            <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <Bot className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  <strong>{t('AI সাপোর্ট অ্যাক্টিভ:', 'AI Support Enabled:')}</strong>{' '}
                  {t(
                    'টিকিট খোলার সাথে সাথেই আপনাকে আলাদা ফ্রেশ চ্যাট পেজে নিয়ে যাওয়া হবে এবং AI তৎক্ষণাৎ উত্তর দিবে।',
                    'Upon ticket creation, you will be taken to a dedicated chat page where our AI bot assists you instantly.'
                  )}
                </span>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  {t('ক্যাটাগরি সিলেক্ট করুন:', 'Select Category:')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'PAYMENT', label: t('💳 পেমেন্ট / ডিপোজিট', '💳 Payment / Deposit') },
                    { id: 'MATCH', label: t('🎮 রুম আইডি ও পাস', '🎮 Match / Room ID') },
                    { id: 'ACCOUNT', label: t('👤 অ্যাকাউন্ট ও প্রোফাইল', '👤 Account & Profile') },
                    { id: 'OTHER', label: t('❓ অন্যান্য জিজ্ঞাসা', '❓ Other Issues') },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id as any)}
                      className={`p-2 rounded-xl border text-left font-bold transition-all text-xs ${
                        category === cat.id
                          ? 'border-red-600 bg-red-50 text-red-600 shadow-xs'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  {t('বিষয় (Subject):', 'Subject:')}
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t('যেমন: বিকাশ ৫০০ টাকা ডিপোজিট করেছি আসেনি (TrxID: ...)', 'e.g. bKash deposit not added yet (TrxID: ...)')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white font-medium focus:outline-none focus:border-red-500 text-gray-900"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  {t('বিস্তারিত বিবরণ:', 'Description:')}
                </label>
                <textarea
                  rows={3}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('আপনার সমস্যাটি বিস্তারিত লিখুন (যেমন: TrxID, কোন ম্যাচ, বা নম্বর)...', 'Describe your issue in detail (e.g. TrxID, match title, or phone)...')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white font-medium focus:outline-none focus:border-red-500 text-gray-900 leading-relaxed"
                />
              </div>

              {/* Screenshot Upload */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  {t('স্ক্রিনশট অ্যাটাচ করুন (ঐচ্ছিক):', 'Attach Screenshot (Optional):')}
                </label>
                <div className="flex items-center gap-3">
                  <label className="px-3 py-2 rounded-xl border border-dashed border-gray-300 hover:border-red-500 bg-gray-50 cursor-pointer font-bold flex items-center gap-1.5 text-gray-600">
                    <Upload className="w-3.5 h-3.5 text-red-500" />
                    <span>{t('ইমেজ সিলেক্ট করুন', 'Upload Image')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {imagePreview && (
                    <span className="text-[10px] text-emerald-600 font-bold">
                      ✓ {t('স্ক্রিনশট যোগ করা হয়েছে', 'Screenshot attached')}
                    </span>
                  )}
                </div>
                {imagePreview && (
                  <div className="mt-2 relative w-20 h-20 rounded-xl overflow-hidden border border-gray-300 shadow-sm">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full text-white text-[10px]"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 font-black text-xs uppercase tracking-wider text-white shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>
                  {submitting
                    ? t('সাবমিট হচ্ছে...', 'Submitting...')
                    : t('টিকিট খুলুন এবং লাইভ চ্যাট শুরু করুন', 'Open Ticket & Start Live Chat')}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
