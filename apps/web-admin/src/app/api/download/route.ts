import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const candidatePaths = [
    path.join(process.cwd(), 'public', 'downloads', 'ffrivals.apk'),
    path.join(process.cwd(), 'apps', 'web-admin', 'public', 'downloads', 'ffrivals.apk'),
    path.join(process.cwd(), 'public', 'ffrivals.apk'),
    path.join(process.cwd(), 'apps', 'web-admin', 'public', 'ffrivals.apk'),
  ];

  let apkBuffer: Buffer | null = null;
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        apkBuffer = fs.readFileSync(p);
        break;
      } catch (e) {
        // continue
      }
    }
  }

  if (!apkBuffer) {
    return NextResponse.json({ error: 'APK file not found' }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(apkBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Disposition': 'attachment; filename="ffrivals.apk"',
      'Content-Length': String(apkBuffer.length),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
