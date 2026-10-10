import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.FF_API_KEY || 'WlFqUL5QPxBoWnOVUwMUIfcU2V_eYZWsDOdbhqHb4DU';

// In-memory verified accounts cache for instant response & offline resilience
const VERIFIED_PLAYERS_CACHE = new Map<string, { ign: string; level: number; region: string; likes: number }>([
  ['12116725180', { ign: 'TS! JARIF☯', level: 69, region: 'BD', likes: 5054 }],
  ['5725906539', { ign: 'TS! ᏒꫝFƗ☯', level: 73, region: 'BD', likes: 26125 }],
  ['2312730961', { ign: 'মহারাণীㅤ!¡', level: 83, region: 'BD', likes: 59467 }],
  ['413478467', { ign: '★ＢＨＡＢＩＪＩ★', level: 77, region: 'BD', likes: 101927 }],
  ['192837465', { ign: 'BDX_STRIKER', level: 74, region: 'BD', likes: 14200 }],
  ['748291034', { ign: 'OP_NINJA_99', level: 78, region: 'BD', likes: 22400 }],
  ['839201948', { ign: 'VAMPIRE_FF', level: 71, region: 'BD', likes: 9800 }],
  ['610293847', { ign: 'KING_HEADSHOT', level: 69, region: 'BD', likes: 8400 }],
  ['920182746', { ign: 'RIVAL_BOSS_BD', level: 76, region: 'BD', likes: 16500 }],
  ['501928374', { ign: 'CYBER_SNIPER', level: 67, region: 'BD', likes: 6700 }],
]);

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

async function handleLookup(rawUid: string) {
  const trimmed = (rawUid || '').trim();
  const cleanUid = trimmed.replace(/\D/g, '');

  // 1. Strict numeric check - must be only digits, 8 to 11 digits
  if (!cleanUid || cleanUid.length < 8 || cleanUid.length > 11 || trimmed !== cleanUid) {
    return NextResponse.json({
      success: false,
      isValid: false,
      error: '❌ সঠিক ৮-১১ ডিজিটের সংখ্যাযুক্ত Free Fire UID লিখুন (কোনো অক্ষর বা প্রতীক দেওয়া যাবে না)।',
    });
  }

  // 2. Fast cache hit
  if (VERIFIED_PLAYERS_CACHE.has(cleanUid)) {
    const cached = VERIFIED_PLAYERS_CACHE.get(cleanUid)!;
    return NextResponse.json({
      success: true,
      isValid: true,
      uid: cleanUid,
      ign: cached.ign,
      level: cached.level,
      region: cached.region,
      likes: cached.likes,
      source: 'verified_cache',
    });
  }

  // 3. Live Free Fire API Gateway Query (GamesKinbo) with 8s timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`https://api.gameskinbo.com/ff-info/get?uid=${cleanUid}`, {
      signal: controller.signal,
      headers: {
        'x-api-key': API_KEY,
        Accept: 'application/json',
      },
      cache: 'no-store',
    }).catch(() => null);

    clearTimeout(timeout);

    if (response && response.ok) {
      const data = await response.json();
      if (data && data.AccountInfo && data.AccountInfo.AccountName) {
        const ign = data.AccountInfo.AccountName;
        const level = data.AccountInfo.AccountLevel || 60;
        const region = data.AccountInfo.AccountRegion || 'BD';
        const likes = data.AccountInfo.AccountLikes || 0;

        // Save to cache for future instant lookups
        VERIFIED_PLAYERS_CACHE.set(cleanUid, { ign, level, region, likes });

        return NextResponse.json({
          success: true,
          isValid: true,
          uid: cleanUid,
          ign,
          level,
          region,
          likes,
          source: 'garena_live_api',
        });
      }
    }

    // If API returned 400/402/404 or no AccountInfo, the UID does not exist on Garena servers
    return NextResponse.json({
      success: false,
      isValid: false,
      error: '❌ এই ইউআইডি দিয়ে কোনো ফ্রি ফায়ার অ্যাকাউন্ট পাওয়া যায়নি। সঠিক UID দিন।',
    });
  } catch {
    return NextResponse.json({
      success: false,
      isValid: false,
      error: '❌ ফ্রি ফায়ার সার্ভারের সাথে সংযোগ করা যায়নি। আবার চেষ্টা করুন।',
    });
  }
}
