import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Block known vulnerability scanner scripts and exploit probes immediately
const MALICIOUS_PATTERNS = [
  /\.(php|asp|aspx|jsp|env|git|sql|bak|yaml|yml|ini|conf|sh)$/i,
  /(wp-admin|wp-login|xmlrpc|phpmyadmin|cgi-bin|\/etc\/passwd|\/eval-stdin|actuator|\.aws|\.ssh)/i,
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Fast Drop for Malicious Scanners / Vulnerability Exploits
  if (MALICIOUS_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return new NextResponse('Access Denied', {
      status: 403,
      headers: { 'X-Shield': 'BLOCKED_MALICIOUS_PROBE' },
    });
  }

  // Smooth unlimited pass-through for all legitimate web & app users
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|images|avatars|banners).*)',
  ],
};
