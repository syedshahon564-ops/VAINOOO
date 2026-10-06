import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function getDataFilePath(): string {
  const possiblePaths = [
    path.join(process.cwd(), 'apps', 'web-admin', 'data', 'cms-data.json'),
    path.join(process.cwd(), 'data', 'cms-data.json'),
    path.join('/tmp', 'cms-data.json'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }

  // If in Vercel serverless environment, fallback to tmp
  if (process.env.VERCEL) {
    return path.join('/tmp', 'cms-data.json');
  }

  // Default path
  return path.join(process.cwd(), 'data', 'cms-data.json');
}

function ensureDataFile(targetPath: string) {
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      // ignore
    }
  }
}

export async function GET() {
  try {
    const dataFile = getDataFilePath();
    if (fs.existsSync(dataFile)) {
      const content = fs.readFileSync(dataFile, 'utf-8');
      const data = JSON.parse(content);
      return NextResponse.json(data);
    }
    return NextResponse.json({ ok: true, data: null });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let dataFile = getDataFilePath();

    try {
      ensureDataFile(dataFile);
      fs.writeFileSync(dataFile, JSON.stringify(body, null, 2), 'utf-8');
    } catch (writeErr) {
      // If disk is read-only (e.g. on Vercel), fallback to /tmp
      const tmpFile = path.join('/tmp', 'cms-data.json');
      ensureDataFile(tmpFile);
      fs.writeFileSync(tmpFile, JSON.stringify(body, null, 2), 'utf-8');
    }

    return NextResponse.json({ ok: true, timestamp: Date.now() });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
