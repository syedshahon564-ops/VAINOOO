import { NextRequest, NextResponse } from 'next/server';

function cleanIgnString(raw: string): string {
  if (!raw) return '';
  // Normalize Free Fire invisible space characters (\u1160, \u3164, \uFFA0, \u200B-\u200F, \uFEFF)
  // to regular spaces so they display cleanly without broken squares or font corruptions
  const cleaned = raw
    .replace(/[\u1160\u3164\uFFA0]/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || raw.trim();
}

// In-memory runtime cache ONLY for freshly fetched live Garena results (TTL: 10 minutes)
// This avoids repeated 8s latency when a user types UID, then submits booking 5s later.
// NO hardcoded static UIDs or database lookups.
interface LiveCachedPlayer {
  ign: string;
  level: number;
  region: string;
  likes: number;
  cachedAt: number;
}
const LIVE_RESOLVED_CACHE = new Map<string, LiveCachedPlayer>();
const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * High-Speed Live Free Fire Protocol Gateway
 * Directly queries active Free Fire account servers for any UID in BD, SG, IND, PK, ME.
 */
async function queryLiveFreeFireServer(cleanUid: string): Promise<{ ign: string; level: number; region: string; likes: number } | 'NOT_FOUND' | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9500);

    const res = await fetch(`https://infoxvisits.tsunxkittens.app/info/${cleanUid}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    clearTimeout(timeout);

    if (res.status === 404) {
      return 'NOT_FOUND';
    }

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const rawIgn =
        data?.AccountInfo?.AccountName ||
        data?.basicInfo?.nickname ||
        data?.basicInfo?.name ||
        data?.nickname ||
        data?.AccountName ||
        data?.name;

      if (rawIgn && typeof rawIgn === 'string' && rawIgn.trim().length > 0) {
        const ign = cleanIgnString(rawIgn);
        return {
          ign,
          level: Number(data?.AccountInfo?.AccountLevel || data?.basicInfo?.level || data?.level || 60),
          region: String(data?.AccountInfo?.AccountRegion || data?.basicInfo?.region || data?.region || 'BD'),
          likes: Number(data?.AccountInfo?.AccountLikes || data?.basicInfo?.liked || data?.likes || 0),
        };
      }
    }
  } catch (err) {
    console.warn(`[FF-LOOKUP] Live query error for ${cleanUid}:`, err);
  }
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get('uid') || '';
  return handleLookup(uid);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const uid = (body.uid || '').toString();
    return handleLookup(uid);
  } catch {
    return NextResponse.json(
      { success: false, isValid: false, error: 'ভুল রিকোয়েস্ট ফরম্যাট।' },
      { status: 400 }
    );
  }
}

function toEnDigits(input: string | number | null | undefined): string {
  if (!input) return '';
  const bnToEn: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  };
  return String(input)
    .replace(/[০-৯٠-٩]/g, (d) => bnToEn[d] || d)
    .replace(/\D/g, '');
}

async function handleLookup(rawUid: string) {
  const cleanUid = toEnDigits(rawUid);

  // 1. Strict numeric check - must be only digits, 8 to 12 digits
  if (!cleanUid || cleanUid.length < 8 || cleanUid.length > 12) {
    return NextResponse.json({
      success: false,
      isValid: false,
      error: '❌ সঠিক ৮-১২ ডিজিটের সংখ্যাযুক্ত Free Fire UID লিখুন (কোনো অক্ষর বা প্রতীক দেওয়া যাবে না)।',
    });
  }

  // 2. Dynamic live session memory cache (avoids duplicate 8s live queries within 10 minutes)
  const cached = LIVE_RESOLVED_CACHE.get(cleanUid);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return NextResponse.json({
      success: true,
      isValid: true,
      uid: cleanUid,
      ign: cached.ign,
      level: cached.level,
      region: cached.region,
      likes: cached.likes,
      source: 'live_freefire_protocol',
    });
  }

  // 3. Query Live Free Fire Server directly (Try 1)
  let liveServerResult = await queryLiveFreeFireServer(cleanUid);

  if (liveServerResult === 'NOT_FOUND') {
    return NextResponse.json({
      success: false,
      isValid: false,
      uid: cleanUid,
      error: '❌ এই Free Fire UID দিয়ে কোনো সক্রিয় প্লেয়ার অ্যাকাউন্ট পাওয়া যায়নি। সঠিক UID লিখুন।',
    });
  }

  // If first attempt had network hiccup, retry once
  if (!liveServerResult) {
    await new Promise((r) => setTimeout(r, 600));
    liveServerResult = await queryLiveFreeFireServer(cleanUid);
    if (liveServerResult === 'NOT_FOUND') {
      return NextResponse.json({
        success: false,
        isValid: false,
        uid: cleanUid,
        error: '❌ এই Free Fire UID দিয়ে কোনো সক্রিয় প্লেয়ার অ্যাকাউন্ট পাওয়া যায়নি। সঠিক UID লিখুন।',
      });
    }
  }

  // If live server returned a valid player
  if (liveServerResult && typeof liveServerResult === 'object' && liveServerResult.ign) {
    LIVE_RESOLVED_CACHE.set(cleanUid, {
      ...liveServerResult,
      cachedAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      isValid: true,
      uid: cleanUid,
      ign: liveServerResult.ign,
      level: liveServerResult.level,
      region: liveServerResult.region,
      likes: liveServerResult.likes,
      source: 'live_freefire_protocol',
    });
  }

  // If live server was completely unreachable
  return NextResponse.json({
    success: false,
    isValid: false,
    uid: cleanUid,
    error: '⚠️ ফ্রি ফায়ার সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। দয়া করে আপনার নেটওয়ার্ক চেক করে আবার চেষ্টা করুন।',
  });
}
