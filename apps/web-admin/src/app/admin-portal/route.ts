import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function getAdminHtmlContent(): string {
  const candidates = [
    path.join(process.cwd(), 'apps', 'web-admin', 'public', 'admin.html'),
    path.join(process.cwd(), 'public', 'admin.html'),
    path.join(__dirname, '..', '..', '..', 'public', 'admin.html'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return fs.readFileSync(c, 'utf-8');
    }
  }
  return '<h1>Admin Portal Loading...</h1>';
}

export async function GET() {
  const html = getAdminHtmlContent();
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
