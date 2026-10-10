'use client';

import React, { useState, useEffect } from 'react';
import { useCMS } from '@/lib/cms-store';

export default function ImportantNoticeModal() {
  const { settings } = useCMS();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      // Check if disabled by admin
      if (settings?.importantNoticeEnabled === false) {
        setIsOpen(false);
        return;
      }

      // Check if dismissed in this current session
      const dismissed = sessionStorage.getItem('ff_important_notice_dismissed');
      if (!dismissed) {
        // Small delay for smooth entry animation
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 350);
        return () => clearTimeout(timer);
      }
    } catch {
      setIsOpen(true);
    }
  }, [settings?.importantNoticeEnabled]);

  const handleDismiss = () => {
    try {
      sessionStorage.setItem('ff_important_notice_dismissed', 'true');
    } catch {}
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const title = settings?.importantNoticeTitle || 'Important Notice';
  const bodyText = settings?.importantNoticeBody || '';

  return (
    <div className="fixed inset-0 z-[99990] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-sm sm:max-w-md rounded-2xl sm:rounded-3xl bg-white text-gray-900 shadow-2xl p-5 sm:p-6 border border-gray-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="important-notice-title"
      >
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <svg 
              className="w-7 h-7 text-amber-500" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 10h2v4h-2zm0 6h2v2h-2z" />
            </svg>
          </div>
          <h2 
            id="important-notice-title" 
            className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900"
          >
            {title}
          </h2>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto my-3 pr-1 space-y-2 text-xs sm:text-[13px] text-gray-700 leading-relaxed font-medium whitespace-pre-line select-text">
          {bodyText}
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleDismiss}
            className="px-6 py-2.5 sm:px-8 sm:py-3 rounded-xl bg-[#F26A00] hover:bg-[#e06200] active:scale-95 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            GOT IT
          </button>
        </div>
      </div>
    </div>
  );
}
