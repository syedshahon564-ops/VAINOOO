'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SupportChatScreen from '@/components/SupportChatScreen';
import { getCurrentUser } from '@/lib/user-store';
import { getOrCreateUserConversation, SupportTicket } from '@/lib/support-store';
import { useLanguage } from '@/components/LanguageProvider';

export default function SupportPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);

  useEffect(() => {
    const cur = getCurrentUser();
    const conv = getOrCreateUserConversation(cur);
    setTicket(conv);
  }, []);

  if (!ticket) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <SupportChatScreen
        ticket={ticket}
        onBack={() => {
          if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
          } else {
            router.push('/');
          }
        }}
        lang={(language as any) || 'bn'}
        onUpdateTicket={(updated) => setTicket(updated)}
      />
    </div>
  );
}
