'use client';

import { toEnDigits } from './clipboard';

export interface VerifiedPlayerProfile {
  isValid: boolean;
  uid: string;
  ign: string;
  level: number;
  region: string;
  likeCount: number;
  avatarUrl: string;
  badge?: string;
  error?: string;
}

function cleanIgnString(raw: string): string {
  if (!raw) return '';
  const cleaned = raw
    .replace(/[\u1160\u3164\uFFA0]/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || raw.trim();
}

export function saveUIDIgnCache(uid: string, ign: string): void {
  if (typeof window === 'undefined' || !uid || !ign) return;
  const clean = toEnDigits(uid);
  const cleanIgn = cleanIgnString(ign);
  if (clean && cleanIgn && cleanIgn.length >= 2) {
    try {
      sessionStorage.setItem('ff_live_ign_' + clean, cleanIgn);
    } catch {}
  }
}

/**
 * Free Fire UID Checker Client API
 * Calls /api/ff-lookup directly to fetch the real in-game player name from Garena.
 * No hardcoded database or static fake names.
 */
export async function checkFreeFireUID(uid: string): Promise<VerifiedPlayerProfile> {
  const cleanUID = toEnDigits(uid);

  if (!cleanUID || cleanUID.length < 8 || cleanUID.length > 12) {
    return {
      isValid: false,
      uid: cleanUID,
      ign: '',
      level: 0,
      region: '',
      likeCount: 0,
      avatarUrl: '',
      error: '❌ সঠিক ৮-১২ ডিজিটের ফ্রি ফায়ার UID লিখুন।',
    };
  }

  // Check current session memory
  if (typeof window !== 'undefined') {
    try {
      const sessionIgn = sessionStorage.getItem('ff_live_ign_' + cleanUID);
      if (sessionIgn && sessionIgn.trim().length > 0) {
        return {
          isValid: true,
          uid: cleanUID,
          ign: sessionIgn.trim(),
          level: 60,
          region: 'Bangladesh (BD)',
          likeCount: 1000,
          avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=120',
          badge: 'HEROIC',
        };
      }
    } catch {}
  }

  // Fetch live from server
  try {
    const res = await fetch(`/api/ff-lookup?uid=${cleanUID}`, {
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      if (data.isValid && data.ign) {
        saveUIDIgnCache(cleanUID, data.ign);
        return {
          isValid: true,
          uid: cleanUID,
          ign: data.ign,
          level: data.level || 60,
          region: data.region || 'Bangladesh (BD)',
          likeCount: data.likes || 0,
          avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=120',
          badge: (data.level || 60) >= 70 ? 'GRANDMASTER' : 'HEROIC',
        };
      }

      if (data.error) {
        return {
          isValid: false,
          uid: cleanUID,
          ign: '',
          level: 0,
          region: '',
          likeCount: 0,
          avatarUrl: '',
          error: data.error,
        };
      }
    }

    return {
      isValid: false,
      uid: cleanUID,
      ign: '',
      level: 0,
      region: '',
      likeCount: 0,
      avatarUrl: '',
      error: '❌ ফ্রি ফায়ার প্লেয়ার তথ্য পাওয়া যায়নি। অনুগ্রহ করে সঠিক UID দিন।',
    };
  } catch (err) {
    return {
      isValid: false,
      uid: cleanUID,
      ign: '',
      level: 0,
      region: '',
      likeCount: 0,
      avatarUrl: '',
      error: '⚠️ নেটওয়ার্ক সমস্যা হয়েছে। আবার চেষ্টা করুন।',
    };
  }
}
