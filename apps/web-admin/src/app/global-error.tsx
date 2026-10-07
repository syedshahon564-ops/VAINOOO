'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Root application crash caught by global-error:', error);
  }, [error]);

  const handleReload = () => {
    try {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch {
      reset();
    }
  };

  return (
    <html lang="bn">
      <body style={{ margin: 0, padding: 0, background: '#07070a', color: '#ffffff', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ maxWidth: '420px', width: '100%', background: '#12121a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '24px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '8px', color: '#ff4444' }}>
              লোড করতে সমস্যা হয়েছে
            </h2>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '20px' }}>
              নেটওয়ার্ক সমস্যার কারণে অ্যাপটি লোড হতে পারেনি। অনুগ্রহ করে রিলোড দিন।
            </p>
            <button
              onClick={handleReload}
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: '12px',
                background: '#ff4444',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              আবার চেষ্টা করুন (Reload)
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
