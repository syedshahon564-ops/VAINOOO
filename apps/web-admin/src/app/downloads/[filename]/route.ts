import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  const candidatePaths = [
    path.join(process.cwd(), 'public', 'downloads', 'ffrivals.apk'),
    path.join(process.cwd(), 'apps', 'web-admin', 'public', 'downloads', 'ffrivals.apk'),
    path.join(process.cwd(), 'public', 'ffrivals.apk'),
    path.join(process.cwd(), 'apps', 'web-admin', 'public', 'ffrivals.apk'),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        const stats = fs.statSync(p);
        if (stats.size > 10 * 1024 * 1024) {
          const apkBuffer = fs.readFileSync(p);
          return new NextResponse(new Uint8Array(apkBuffer), {
            status: 200,
            headers: {
              'Content-Type': 'application/vnd.android.package-archive',
              'Content-Disposition': 'attachment; filename="ffrivals.apk"',
              'Content-Length': String(apkBuffer.length),
              'Cache-Control': 'public, max-age=3600',
            },
          });
        }
      } catch (e) {}
    }
  }

  return NextResponse.redirect(
    'https://raw.githubusercontent.com/syedshahon564-ops/VAINOOO/main/public/downloads/ffrivals.apk',
    302
  );
}
