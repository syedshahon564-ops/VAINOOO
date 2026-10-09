'use client';

import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  Phone,
  User,
  Image as ImageIcon,
  Check,
  X,
  Search,
  Filter,
  Volume2,
  Sparkles,
  Bot,
  Zap,
} from 'lucide-react';
import {
  getSupportTickets,
  addTicketReply,
  updateTicketStatus,
  playSupportAlertSound,
  SupportTicket,
} from '@/lib/support-store';

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeImageZoom, setActiveImageZoom] = useState<string | null>(null);

  const refreshTickets = () => {
    const list = getSupportTickets();
    setTickets(list);
    if (!selectedTicketId && list.length > 0) {
      setSelectedTicketId(list[0].id);
    }
  };

  useEffect(() => {
    refreshTickets();

    const handleUpdate = () => refreshTickets();
    window.addEventListener('ff_support_tickets_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('ff_support_tickets_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    const res = addTicketReply(selectedTicket.id, {
      senderRole: 'ADMIN',
      senderName: 'Admin Support Desk',
      message: replyText.trim(),
    });

    if (res) {
      setReplyText('');
      refreshTickets();
      showToast('Reply dispatched and push notification sent to player!', 'success');
    }
  };

  const handleStatusChange = (status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') => {
    if (!selectedTicket) return;
    updateTicketStatus(selectedTicket.id, status);
    refreshTickets();
    showToast(`Ticket status updated to "${status}"!`, 'success');
  };

  // Quick reply presets in English
  const quickReplies = [
    'Your issue has been resolved. Please verify your balance.',
    'Your bKash/Nagad payment was verified and added to wallet.',
    'Room ID & password are now posted in My Matches. Please join room.',
    'Scoreboard verification completed. Prize money credited to wallet.',
  ];

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.subject.toLowerCase().includes(q) ||
        t.userPhone.includes(q) ||
        t.userIgn.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Toast */}
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
      <div className="pb-4 border-b border-gray-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <LifeBuoy className="w-6 h-6 text-red-600" />
              Live Support & Ticketing Desk
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black border border-emerald-500/20 shadow-sm animate-pulse">
              <Bot className="w-3.5 h-3.5" /> AI Support Active 24/7
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Resolve player inquiries, manage payment proofs, and monitor automated AI Support Bot responses.
          </p>
        </div>

        <button
          onClick={() => {
            playSupportAlertSound();
            showToast('Chime alert sound tested successfully!');
          }}
          className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold flex items-center gap-1.5 hover:bg-gray-200 transition-all border border-gray-200 dark:border-white/10"
        >
          <Volume2 className="w-4 h-4 text-amber-500" /> Test Sound Alert
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a]">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Total Tickets</span>
          <span className="text-xl font-black text-gray-900 dark:text-white font-mono">
            {tickets.length}
          </span>
        </div>
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5">
          <span className="text-[10px] text-rose-500 font-bold uppercase block">New Open Tickets</span>
          <span className="text-xl font-black text-rose-600 font-mono flex items-center gap-2">
            {openCount} {openCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />}
          </span>
        </div>
        <div className="p-4 rounded-2xl border border-blue-500/30 bg-blue-500/5">
          <span className="text-[10px] text-blue-500 font-bold uppercase block">In Progress</span>
          <span className="text-xl font-black text-blue-600 font-mono">
            {inProgressCount}
          </span>
        </div>
        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
          <span className="text-[10px] text-emerald-500 font-bold uppercase block">Resolved</span>
          <span className="text-xl font-black text-emerald-600 font-mono">
            {resolvedCount}
          </span>
        </div>
      </div>

      {/* Main Support Grid: Ticket List + Conversation Thread */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ticket List (Left 5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-4 space-y-4 shadow-sm flex flex-col h-[650px]">
          {/* Search & Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by phone, IGN, or subject..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black text-xs font-medium focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px]">
              {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition-all ${
                    filterStatus === st
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {st === 'ALL'
                    ? 'All'
                    : st === 'OPEN'
                    ? `Open (${openCount})`
                    : st === 'IN_PROGRESS'
                    ? `Processing (${inProgressCount})`
                    : `Resolved`}
                </button>
              ))}
            </div>
          </div>

          {/* List Scroll */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredTickets.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                No support tickets found matching criteria.
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20 shadow-md'
                        : 'border-gray-100 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/15 bg-gray-50/50 dark:bg-black/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] font-bold text-gray-400">
                        #{t.id}
                      </span>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          t.status === 'OPEN'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse'
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {t.status === 'OPEN'
                          ? 'NEW'
                          : t.status === 'IN_PROGRESS'
                          ? 'IN PROGRESS'
                          : 'RESOLVED'}
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-gray-900 dark:text-white line-clamp-1 mb-1">
                      {t.subject}
                    </h4>

                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                      <span className="font-bold text-gray-700 dark:text-gray-300">
                        {t.userIgn} ({t.userPhone})
                      </span>
                      <span className="font-mono">{new Date(t.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Ticket Thread (Right 7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#12121a] p-5 shadow-sm flex flex-col h-[650px]">
          {selectedTicket ? (
            <>
              {/* Ticket Header & Actions */}
              <div className="pb-3 border-b border-gray-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-red-600 font-mono">
                      #{selectedTicket.id}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                      {selectedTicket.category}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      {selectedTicket.priority} Priority
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white mt-1">
                    {selectedTicket.subject}
                  </h3>
                  <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-1">
                    <span className="font-bold flex items-center gap-1">
                      <User className="w-3 h-3" /> {selectedTicket.userIgn}
                    </span>
                    <span className="font-mono flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {selectedTicket.userPhone}
                    </span>
                  </div>
                </div>

                {/* Status Switcher Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleStatusChange('IN_PROGRESS')}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-blue-950/60 dark:text-blue-300 text-blue-800 text-[10px] font-bold transition-all"
                  >
                    Set In Progress
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange('RESOLVED')}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3 h-3" /> Mark Resolved
                  </button>
                </div>
              </div>

              {/* Chat Thread Messages */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-2">
                {selectedTicket.messages.map((m) => {
                  const isAdmin = m.senderRole === 'ADMIN';
                  const isAi = m.senderRole === 'AI_BOT' || m.senderName.toLowerCase().includes('ai support');
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-1 px-1">
                        {isAi ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px]">
                            <Bot className="w-3 h-3" /> AI Support
                          </span>
                        ) : (
                          <span className="font-bold text-gray-700 dark:text-gray-300">
                            {m.senderName}
                          </span>
                        )}
                        <span>•</span>
                        <span className="font-mono">{new Date(m.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div
                        className={`max-w-[85%] p-3.5 rounded-2xl text-xs space-y-2 shadow-sm ${
                          isAdmin
                            ? 'bg-red-600 text-white rounded-br-xs'
                            : isAi
                            ? 'bg-emerald-950/10 dark:bg-emerald-950/30 border border-emerald-500/30 text-gray-900 dark:text-gray-100 rounded-bl-xs'
                            : 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-gray-100 rounded-bl-xs'
                        }`}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap">{m.message}</p>

                        {m.imageUrl && (
                          <div className="pt-1">
                            <img
                              src={m.imageUrl}
                              alt="Screenshot Attachment"
                              onClick={() => setActiveImageZoom(m.imageUrl || null)}
                              className="max-h-40 rounded-xl cursor-pointer hover:opacity-90 transition-all border border-black/20"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Reply Presets */}
              <div className="py-2 border-t border-gray-100 dark:border-white/5 overflow-x-auto flex gap-1.5">
                {quickReplies.map((qr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReplyText(qr)}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 whitespace-nowrap transition-colors border border-gray-200 dark:border-white/10"
                  >
                    ⚡ {qr.slice(0, 32)}...
                  </button>
                ))}
              </div>

              {/* Admin Reply Input */}
              <form onSubmit={handleSendReply} className="pt-2 flex gap-2">
                <input
                  type="text"
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type official response to player..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black text-xs font-medium focus:outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl btn-red text-xs font-black flex items-center gap-1.5 shadow-md shadow-red-600/30 active:scale-95 transition-all"
                >
                  <Send className="w-3.5 h-3.5" /> Send
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-xs">
              Select a support ticket from the list on the left.
            </div>
          )}
        </div>
      </div>

      {/* Image Zoom Modal */}
      {activeImageZoom && (
        <div
          onClick={() => setActiveImageZoom(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[85vh]">
            <img
              src={activeImageZoom}
              alt="Zoomed Attachment"
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
