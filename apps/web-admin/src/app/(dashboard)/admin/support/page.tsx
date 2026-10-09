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
  Trash2,
  Settings,
  Plus,
  RefreshCw,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import {
  getSupportTickets,
  syncSupportTicketsFromServer,
  addTicketReply,
  updateTicketStatus,
  resetAllSupportTickets,
  deleteSupportTicket,
  playSupportAlertSound,
  SupportTicket,
} from '@/lib/support-store';

interface AiCustomRule {
  id: string;
  keywords: string[];
  response: string;
  category?: string;
  enabled: boolean;
}

interface AiSupportConfig {
  systemPrompt: string;
  autoVerifyPayments: boolean;
  autoReplyDelayMs: number;
  customRules: AiCustomRule[];
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeImageZoom, setActiveImageZoom] = useState<string | null>(null);

  // Reset Confirmation Modal
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // AI Bot Rules Manager Modal / Drawer
  const [showAiConfigModal, setShowAiConfigModal] = useState(false);
  const [aiConfig, setAiConfig] = useState<AiSupportConfig | null>(null);
  const [savingAiConfig, setSavingAiConfig] = useState(false);
  const [newRuleKeywords, setNewRuleKeywords] = useState('');
  const [newRuleResponse, setNewRuleResponse] = useState('');

  const refreshTickets = async () => {
    try {
      const serverTickets = await syncSupportTicketsFromServer();
      setTickets(serverTickets);
      if (!selectedTicketId && serverTickets.length > 0) {
        setSelectedTicketId(serverTickets[0].id);
      }
    } catch (e) {
      const list = getSupportTickets();
      setTickets(list);
    }
  };

  const loadAiConfig = async () => {
    try {
      const res = await fetch('/api/support/ai-config');
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.config) {
          setAiConfig(data.config);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    refreshTickets();
    loadAiConfig();

    // Auto-poll every 3.5 seconds for incoming mobile app tickets
    const pollInterval = setInterval(() => {
      syncSupportTicketsFromServer().then((list) => {
        setTickets(list);
      }).catch(() => {});
    }, 3500);

    const handleUpdate = () => {
      const list = getSupportTickets();
      setTickets(list);
    };

    window.addEventListener('ff_support_tickets_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      clearInterval(pollInterval);
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
      showToast('Official response sent to player!', 'success');
    }
  };

  const handleStatusChange = (status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') => {
    if (!selectedTicket) return;
    updateTicketStatus(selectedTicket.id, status);
    refreshTickets();
    showToast(`Ticket status updated to "${status}"!`, 'success');
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (confirm(`Are you sure you want to delete ticket #${ticketId}?`)) {
      await deleteSupportTicket(ticketId);
      refreshTickets();
      if (selectedTicketId === ticketId) {
        setSelectedTicketId(null);
      }
      showToast(`Ticket #${ticketId} deleted.`, 'success');
    }
  };

  const handleResetAllTickets = async () => {
    setIsResetting(true);
    try {
      await resetAllSupportTickets();
      setTickets([]);
      setSelectedTicketId(null);
      setShowResetConfirm(false);
      showToast('All support tickets have been reset to 0.', 'success');
    } catch (e) {
      showToast('Failed to reset tickets', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleAddAiRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleKeywords.trim() || !newRuleResponse.trim() || !aiConfig) return;

    const keywords = newRuleKeywords
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    const newRule: AiCustomRule = {
      id: 'rule-' + Date.now(),
      keywords,
      response: newRuleResponse.trim(),
      enabled: true,
    };

    const updatedConfig: AiSupportConfig = {
      ...aiConfig,
      customRules: [newRule, ...aiConfig.customRules],
    };

    setAiConfig(updatedConfig);
    setNewRuleKeywords('');
    setNewRuleResponse('');
    saveAiConfigToServer(updatedConfig);
    showToast('New AI Support Rule added!', 'success');
  };

  const handleToggleAiRule = (ruleId: string) => {
    if (!aiConfig) return;
    const updatedRules = aiConfig.customRules.map((r) =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    );
    const updated = { ...aiConfig, customRules: updatedRules };
    setAiConfig(updated);
    saveAiConfigToServer(updated);
  };

  const handleDeleteAiRule = (ruleId: string) => {
    if (!aiConfig) return;
    const updatedRules = aiConfig.customRules.filter((r) => r.id !== ruleId);
    const updated = { ...aiConfig, customRules: updatedRules };
    setAiConfig(updated);
    saveAiConfigToServer(updated);
    showToast('AI Rule removed.', 'success');
  };

  const saveAiConfigToServer = async (cfg: AiSupportConfig) => {
    setSavingAiConfig(true);
    try {
      const res = await fetch('/api/support/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      });
      if (res.ok) {
        showToast('AI Support Bot rules saved successfully!', 'success');
      }
    } catch (e) {
      showToast('Failed to save AI configuration', 'error');
    } finally {
      setSavingAiConfig(false);
    }
  };

  // Quick reply presets in English
  const quickReplies = [
    'Your issue has been resolved. Please check your balance.',
    'bKash/Nagad deposit verified and added to wallet.',
    'Room ID & Password posted in My Matches. Please join room.',
    'Scoreboard verification completed. Prize money credited.',
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
      {/* Toast Alert */}
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

      {/* Page Header */}
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
            Resolve player inquiries, manage payment verifications, and customize AI Support Bot answers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Bot Rules Config Button */}
          <button
            onClick={() => setShowAiConfigModal(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all"
          >
            <Bot className="w-4 h-4" /> AI Bot Answers & Rules
          </button>

          {/* Reset All Tickets to 0 */}
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 border border-rose-500/20 transition-all"
            title="Reset All Tickets to 0"
          >
            <Trash2 className="w-4 h-4" /> Reset Tickets to 0
          </button>

          {/* Sound Alert Test */}
          <button
            onClick={() => {
              playSupportAlertSound();
              showToast('Chime alert sound tested successfully!');
            }}
            className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold flex items-center gap-1.5 hover:bg-gray-200 transition-all border border-gray-200 dark:border-white/10"
          >
            <Volume2 className="w-4 h-4 text-amber-500" /> Sound Alert
          </button>
        </div>
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
                    : `Resolved (${resolvedCount})`}
                </button>
              ))}
            </div>
          </div>

          {/* List Scroll */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredTickets.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-xs space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto opacity-40" />
                <p>No support tickets found.</p>
                <p className="text-[10px] text-gray-500">Tickets submitted from mobile app or portal will appear here in real time.</p>
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
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-gray-400">
                          #{t.id}
                        </span>
                        {t.paymentVerified && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <ShieldCheck className="w-3 h-3" /> AI Verified
                          </span>
                        )}
                      </div>
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
                      <span className="font-mono">
                        {new Date(t.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
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

                {/* Status Switcher & Delete Buttons */}
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
                  <button
                    type="button"
                    onClick={() => handleDeleteTicket(selectedTicket.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 dark:hover:bg-rose-950/40 transition-all"
                    title="Delete Ticket"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* AI Payment Verification Highlight Banner */}
              {selectedTicket.paymentVerified && (
                <div className="my-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="font-black text-emerald-700 dark:text-emerald-400">
                        AI Payment Auto-Verification Succeeded ✅
                      </p>
                      <p className="text-[11px] font-mono text-gray-600 dark:text-gray-300">
                        TrxID: {selectedTicket.verifiedTrxId || 'CONFIRMED'} • Credited Amount: ৳{selectedTicket.verifiedAmount || 100}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-black text-[10px] uppercase">
                    Wallet Credited
                  </span>
                </div>
              )}

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
                        <span className="font-mono">
                          {new Date(m.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
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
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs space-y-2">
              <LifeBuoy className="w-8 h-8 opacity-40" />
              <p>No ticket selected.</p>
              <p className="text-[10px]">Select a ticket from the left panel to review or respond.</p>
            </div>
          )}
        </div>
      </div>

      {/* AI BOT CONFIGURATION MODAL */}
      {showAiConfigModal && aiConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#12121a] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-purple-800 via-indigo-700 to-black text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Bot className="w-6 h-6 text-purple-300" />
                <div>
                  <h3 className="text-base font-black uppercase">
                    AI Support Bot Knowledge & Custom Rules
                  </h3>
                  <p className="text-[11px] text-purple-200">
                    Define exact trigger keywords and automated answers. Whatever you configure here, the AI will reply!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiConfigModal(false)}
                className="p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 overflow-y-auto space-y-6">
              {/* Payment Auto-Verification Switch */}
              <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Automatic Payment Verification & Wallet Credit
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    When players submit TrxIDs or payment screenshots, the AI verifies the proof and credits balance automatically.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiConfig.autoVerifyPayments}
                    onChange={(e) => {
                      const updated = { ...aiConfig, autoVerifyPayments: e.target.checked };
                      setAiConfig(updated);
                      saveAiConfigToServer(updated);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Add New Custom Rule Form */}
              <form onSubmit={handleAddAiRule} className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 space-y-3 bg-gray-50 dark:bg-black/30">
                <h4 className="text-xs font-black uppercase text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add New Keyword Trigger & Bot Answer
                </h4>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Trigger Keywords (comma separated):
                  </label>
                  <input
                    type="text"
                    required
                    value={newRuleKeywords}
                    onChange={(e) => setNewRuleKeywords(e.target.value)}
                    placeholder="e.g. room password, custom room, pass, পাসওয়ার্ড"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-xs font-medium focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    AI Bot Answer:
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={newRuleResponse}
                    onChange={(e) => setNewRuleResponse(e.target.value)}
                    placeholder="e.g. Room ID and password are automatically posted 15 minutes before match start under My Matches tab."
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-xs font-medium focus:outline-none focus:border-purple-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingAiConfig}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" /> Save Rule
                </button>
              </form>

              {/* Existing Rules List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-gray-700 dark:text-gray-300">
                  Active Bot Rules ({aiConfig.customRules.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {aiConfig.customRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap gap-1">
                          {rule.keywords.map((kw, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-[10px]"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-xs mt-1">
                          {rule.response}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleAiRule(rule.id)}
                          className={`px-2 py-1 rounded text-[10px] font-black ${
                            rule.enabled
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {rule.enabled ? 'ACTIVE' : 'OFF'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAiRule(rule.id)}
                          className="p-1 hover:text-rose-600 transition-colors"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-white/5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAiConfigModal(false)}
                className="px-5 py-2 rounded-xl bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET CONFIRMATION MODAL */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#12121a] border border-gray-200 dark:border-white/10 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-base font-black">Reset Support Tickets to 0?</h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              This action will permanently delete all open, in-progress, and resolved support tickets across all devices and start fresh from zero.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleResetAllTickets}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/30 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isResetting ? 'Resetting...' : 'Yes, Reset All to 0'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
