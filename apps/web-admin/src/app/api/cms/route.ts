import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

let inMemoryServerCache: any = null;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getCandidatePaths(): string[] {
  const list = [
    path.join(os.tmpdir(), 'cms-data.json'),
    path.join('/tmp', 'cms-data.json'),
    path.join(process.cwd(), 'apps', 'web-admin', 'data', 'cms-data.json'),
    path.join(process.cwd(), 'data', 'cms-data.json'),
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

    const result = inMemoryServerCache || fileData || { ok: true, data: null };

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

    for (const p of getCandidatePaths()) {
      try {
        ensureDataFile(p);
        fs.writeFileSync(p, JSON.stringify(body, null, 2), 'utf-8');
      } catch (err) {}
    }

    return NextResponse.json({ ok: true, timestamp: Date.now() });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
