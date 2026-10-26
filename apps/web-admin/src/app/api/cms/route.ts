import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { INITIAL_CATEGORIES, INITIAL_BANNERS } from '@/lib/initial-categories';
import { sendServerPushNotification } from '@/lib/push-config';

let inMemoryServerCache: any = null;
let serverCmsVersion: number = Date.now();

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getCandidatePaths(): string[] {
  const list = [
    path.join(process.cwd(), 'data', 'cms-data.json'),
    path.join(process.cwd(), 'apps', 'web-admin', 'data', 'cms-data.json'),
    path.join('/tmp', 'cms-data.json'),
    path.join(os.tmpdir(), 'cms-data.json'),
  ];
  return Array.from(new Set(list));
}

function getDataFilePath(): string | null {
  for (const p of getCandidatePaths()) {
    try {
      if (fs.existsSync(p)) {
        return p;
      }
    } catch {}
  }
  return null;
}

function ensureDataFile(targetPath: string) {
  try {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch {}
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const clientV = url.searchParams.get('v');

    if (clientV && inMemoryServerCache && String(clientV) === String(serverCmsVersion)) {
      return NextResponse.json(
        { ok: true, unchanged: true, v: serverCmsVersion },
        {
          headers: {
            'Cache-Control': 'no-cache, must-revalidate',
          },
        }
      );
    }

    if (!inMemoryServerCache) {
      const dataFile = getDataFilePath();
      let fileData: any = null;
      if (dataFile && fs.existsSync(dataFile)) {
        try {
          const content = fs.readFileSync(dataFile, 'utf-8');
          fileData = JSON.parse(content);
        } catch (e) {}
      }
      if (fileData) {
        inMemoryServerCache = fileData;
        if (fileData.matchesUpdatedAt) {
          serverCmsVersion = fileData.matchesUpdatedAt;
        }
      }
    }

    if (clientV && inMemoryServerCache && String(clientV) === String(serverCmsVersion)) {
      return NextResponse.json(
        { ok: true, unchanged: true, v: serverCmsVersion },
        {
          headers: {
            'Cache-Control': 'no-cache, must-revalidate',
          },
        }
      );
    }

    const result = inMemoryServerCache || { ok: true, data: null };

    // Auto-heal categories to ensure real user base64 images are always present
    if (result && typeof result === 'object') {
      if (!result.categories || typeof result.categories !== 'object') {
        result.categories = { ...INITIAL_CATEGORIES };
      } else {
        if (result.categories['special-match']) {
          result.categories['special-match'].section = 'OTHER TOURNAMENTS';
        }
        for (const [slug, initCat] of Object.entries(INITIAL_CATEGORIES)) {
          const cat = result.categories[slug];
          if (!cat || !cat.bannerImage || cat.bannerImage.includes('unsplash.com') || cat.bannerImage === '/logo.png' || cat.bannerImage === '/banners/default.png' || cat.bannerImage.startsWith('/uploads/')) {
            result.categories[slug] = {
              ...(initCat as any),
              ...(cat || {}),
              bannerImage: (initCat as any).bannerImage,
              avatarImage: (initCat as any).avatarImage || (initCat as any).bannerImage,
            };
          }
        }
      }

      // Auto-heal banners to ensure user base64 banners are always present
      if (!result.settings || typeof result.settings !== 'object') {
        result.settings = { banners: INITIAL_BANNERS };
      } else if (!Array.isArray(result.settings.banners) || result.settings.banners.length === 0) {
        result.settings.banners = INITIAL_BANNERS;
      } else {
        result.settings.banners = result.settings.banners.map((b: any, idx: number) => {
          if (!b.image || b.image.includes('unsplash.com') || b.image === '/logo.png' || b.image === '/banners/default.png' || b.image.startsWith('/uploads/')) {
            return {
              ...(INITIAL_BANNERS[idx] || {}),
              ...b,
              image: INITIAL_BANNERS[idx]?.image || INITIAL_BANNERS[0]?.image,
            };
          }
          return b;
        });
      }

      // Auto-heal topPlayers if matches have results
      const currentValidTop = Array.isArray(result.topPlayers)
        ? result.topPlayers.filter((p: any) => p && !p.id?.startsWith('tp-') && p.ign)
        : [];
      result.topPlayers = currentValidTop;
      if (currentValidTop.length === 0 && Array.isArray(result.matches)) {
        const playerMap = new Map<string, any>();
        for (const m of result.matches) {
          if (Array.isArray(m.results)) {
            for (const r of m.results) {
              const ign = String(r.ign || '').trim();
              if (!ign) continue;
              const kills = Number(r.kills || 0);
              const prize = Number(r.prize || 0);
              const isWin = Number(r.rank) === 1;

              const key = ign.toLowerCase();
              const existing = playerMap.get(key);
              if (existing) {
                existing.kills = Math.max(existing.kills, existing.kills + kills);
                existing.earnings = Math.max(existing.earnings, existing.earnings + prize);
                existing.matchesPlayed = (existing.matchesPlayed || 1) + 1;
                if (isWin) existing.booyahs = (existing.booyahs || 0) + 1;
                existing.winRate = `${Math.round(((existing.booyahs || 0) / existing.matchesPlayed) * 100)}%`;
              } else {
                playerMap.set(key, {
                  id: `result-${key}`,
                  rank: 0,
                  ign: ign.toUpperCase(),
                  uid: '',
                  avatar: '/avatars/avatar-1.png',
                  kills,
                  earnings: prize,
                  matchesPlayed: 1,
                  booyahs: isWin ? 1 : 0,
                  winRate: isWin ? '100%' : '0%',
                });
              }
            }
          }
        }
        const aggregated = Array.from(playerMap.values());
        if (aggregated.length > 0) {
          aggregated.sort((a, b) => (Number(b.earnings) || 0) - (Number(a.earnings) || 0) || (Number(b.kills) || 0) - (Number(a.kills) || 0));
          result.topPlayers = aggregated.map((p, idx) => ({ ...p, rank: idx + 1 }));
        }
      }

      result._v = serverCmsVersion;
      inMemoryServerCache = result;
    }

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
    }

    const dataFile = getDataFilePath();
    let current: any = inMemoryServerCache;
    if (!current && dataFile && fs.existsSync(dataFile)) {
      try {
        current = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
      } catch (e) {}
    }
    if (!current || typeof current !== 'object') {
      current = {};
    }

    // Smart merge incoming properties
    const nextCategories = {
      ...(current.categories || {}),
      ...(body.categories || {}),
    };

    if (Array.isArray(body.deletedCategories)) {
      for (const del of body.deletedCategories) {
        delete nextCategories[del];
      }
    }

    let mergedMatches = current.matches || [];
    if (Array.isArray(body.matches)) {
      const existingMap = new Map((current.matches || []).map((m: any) => [m.id, m]));

      // Auto-deliver push notification if Room ID & Password was newly added or changed
      // STRICT REQUIREMENT: Only send to players who bought/joined this match!
      for (const inc of body.matches) {
        if (inc && inc.roomId) {
          const ex: any = existingMap.get(inc.id);
          const wasDelivered = ex && ex.roomId && ex.roomId === inc.roomId;
          if (!wasDelivered) {
            const parts = [...(inc.participants || []), ...(ex?.participants || [])];
            const targetUserIds: string[] = [];
            const targetPhones: string[] = [];
            const targetUids: string[] = [];
            const targetIgns: string[] = [];

            parts.forEach((p: any) => {
              if (p.userId) targetUserIds.push(p.userId);
              if (p.userPhone) targetPhones.push(p.userPhone);
              if (p.uid) targetUids.push(p.uid);
              if (p.ign) targetIgns.push(p.ign);
            });

            sendServerPushNotification(
              '🔑 রুম আইডি ও পাসওয়ার্ড উন্মুক্ত!',
              `ম্যাচ: "${inc.title || 'টুর্নামেন্ট'}" | Room ID: ${inc.roomId} | Password: ${inc.roomPass || '1234'}। দ্রুত ফ্রি ফায়ারে প্রবেশ করুন!`,
              '/matches',
              '/icon-192.png',
              {
                isRoomCredential: true,
                targetUserIds,
                targetPhones,
                targetUids,
                targetIgns,
              }
            ).catch(() => {});
          }
        }
      }

      mergedMatches = body.matches.map((incoming: any) => {
        const existing: any = existingMap.get(incoming.id);
        if (!existing) return incoming;

        // Smart merge participants to avoid race conditions between simultaneous players
        const incParts = Array.isArray(incoming.participants) ? incoming.participants : [];
        const exParts = Array.isArray(existing.participants) ? existing.participants : [];

        const seenKeys = new Set<string>();
        const combinedParts: any[] = [];
        for (const p of [...incParts, ...exParts]) {
          const key = `${p.slot || 0}_${String(p.uid || '').trim().toLowerCase()}_${String(p.ign || '').trim().toLowerCase()}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            combinedParts.push(p);
          }
        }

        const safeFilled = Math.max(
          incoming.filledSlots || 0,
          existing.filledSlots || 0,
          combinedParts.length
        );

        return {
          ...existing,
          ...incoming,
          participants: combinedParts,
          filledSlots: safeFilled,
        };
      });
    }

    // Calculate valid top players: either from incoming payload or dynamically from matches with results
    let nextTopPlayers: any[] = [];
    const incomingTop = Array.isArray(body.topPlayers) ? body.topPlayers : [];
    const validIncomingTop = incomingTop.filter((p: any) => p && !p.id?.startsWith('tp-') && p.ign);

    if (validIncomingTop.length > 0) {
      nextTopPlayers = validIncomingTop;
    } else {
      const playerMap = new Map<string, any>();
      for (const m of mergedMatches) {
        if (Array.isArray(m.results)) {
          for (const r of m.results) {
            const ign = String(r.ign || '').trim();
            if (!ign) continue;
            const kills = Number(r.kills || 0);
            const prize = Number(r.prize || 0);
            const isWin = Number(r.rank) === 1;

            const key = ign.toLowerCase();
            const existing = playerMap.get(key);
            if (existing) {
              existing.kills = Math.max(existing.kills, existing.kills + kills);
              existing.earnings = Math.max(existing.earnings, existing.earnings + prize);
              existing.matchesPlayed = (existing.matchesPlayed || 1) + 1;
              if (isWin) existing.booyahs = (existing.booyahs || 0) + 1;
              existing.winRate = `${Math.round(((existing.booyahs || 0) / existing.matchesPlayed) * 100)}%`;
            } else {
              playerMap.set(key, {
                id: `result-${key}`,
                rank: 0,
                ign: ign.toUpperCase(),
                uid: '',
                avatar: '/avatars/avatar-1.png',
                kills,
                earnings: prize,
                matchesPlayed: 1,
                booyahs: isWin ? 1 : 0,
                winRate: isWin ? '100%' : '0%',
              });
            }
          }
        }
      }
      const aggregated = Array.from(playerMap.values());
      if (aggregated.length > 0) {
        aggregated.sort((a, b) => (Number(b.earnings) || 0) - (Number(a.earnings) || 0) || (Number(b.kills) || 0) - (Number(a.kills) || 0));
        nextTopPlayers = aggregated.map((p, idx) => ({ ...p, rank: idx + 1 }));
      } else {
        nextTopPlayers = validIncomingTop;
      }
    }

    const nextData = {
      ...current,
      ...body,
      categories: nextCategories,
      settings: {
        ...(current.settings || {}),
        ...(body.settings || {}),
      },
      deletedCategories: Array.isArray(body.deletedCategories) ? body.deletedCategories : (current.deletedCategories || []),
      matches: mergedMatches,
      topPlayers: nextTopPlayers,
      matchesUpdatedAt: body.matchesUpdatedAt || Date.now(),
    };

    serverCmsVersion = nextData.matchesUpdatedAt;
    nextData._v = serverCmsVersion;
    inMemoryServerCache = nextData;
    const payload = JSON.stringify(nextData);
    const candidatePaths = getCandidatePaths();

    // Persist to all candidate paths
    for (const p of candidatePaths) {
      try {
        ensureDataFile(p);
        fs.writeFileSync(p, payload, 'utf-8');
      } catch (e) {}
    }

    return NextResponse.json({ ok: true, timestamp: Date.now() });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
