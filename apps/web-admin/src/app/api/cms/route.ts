import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { INITIAL_CATEGORIES, INITIAL_BANNERS } from '@/lib/initial-categories';

let inMemoryServerCache: any = null;

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

export async function GET() {
  try {
    const dataFile = getDataFilePath();
    let fileData: any = null;
    if (dataFile && fs.existsSync(dataFile)) {
      try {
        const content = fs.readFileSync(dataFile, 'utf-8');
        fileData = JSON.parse(content);
      } catch (e) {}
    }

    if (!inMemoryServerCache && fileData) {
      inMemoryServerCache = fileData;
    }

    const result = inMemoryServerCache || fileData || { ok: true, data: null };

    // Auto-heal categories to ensure real user base64 images are always present
    if (result && typeof result === 'object') {
      if (!result.categories || typeof result.categories !== 'object') {
        result.categories = { ...INITIAL_CATEGORIES };
      } else {
        for (const [slug, initCat] of Object.entries(INITIAL_CATEGORIES)) {
          const cat = result.categories[slug];
          if (!cat || !cat.bannerImage || cat.bannerImage.includes('unsplash.com') || cat.bannerImage === '/logo.png') {
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
          if (!b.image || b.image.includes('unsplash.com') || b.image === '/logo.png') {
            return {
              ...(INITIAL_BANNERS[idx] || {}),
              ...b,
              image: INITIAL_BANNERS[idx]?.image || INITIAL_BANNERS[0]?.image,
            };
          }
          return b;
        });
      }

      inMemoryServerCache = result;
    }

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    inMemoryServerCache = body;

    const payload = JSON.stringify(body);
    const candidatePaths = getCandidatePaths();

    // Persist to primary candidate synchronously for crash safety
    if (candidatePaths.length > 0) {
      try {
        ensureDataFile(candidatePaths[0]);
        fs.writeFileSync(candidatePaths[0], payload, 'utf-8');
      } catch (e) {}
    }

    // Persist other paths asynchronously without blocking response
    if (candidatePaths.length > 1) {
      Promise.resolve().then(() => {
        for (let i = 1; i < candidatePaths.length; i++) {
          try {
            ensureDataFile(candidatePaths[i]);
            fs.writeFileSync(candidatePaths[i], payload, 'utf-8');
          } catch (err) {}
        }
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, timestamp: Date.now() });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
