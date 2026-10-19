import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface ClientTracker {
  count: number;
  windowStart: number;
  blockedUntil?: number;
}

const clientTrackers = new Map<string, ClientTracker>();
const WINDOW_MS = 10_000; // 10 second sliding window
const MAX_REQUESTS_PER_WINDOW = 200; // 200 reqs / 10s per IP (unlimited for real humans/devices, stops DDoS bots)
const BLOCK_DURATION_MS = 20_000; // 20 second cooldown for aggressive flood scripts

// Block known vulnerability scanner scripts and exploit probes immediately
const MALICIOUS_PATTERNS = [
  /\.(php|asp|aspx|jsp|env|git|sql|bak|yaml|yml|ini|conf|sh)$/i,
  /(wp-admin|wp-login|xmlrpc|phpmyadmin|cgi-bin|\/etc\/passwd|\/eval-stdin|actuator|\.aws|\.ssh)/i,
];

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip') || 'unknown-client';
}

function pruneOldClients() {
  const now = Date.now();
  if (clientTrackers.size > 5000) {
    for (const [ip, tracker] of clientTrackers.entries()) {
      if (now - tracker.windowStart > WINDOW_MS * 2 && (!tracker.blockedUntil || now > tracker.blockedUntil)) {
        clientTrackers.delete(ip);
      }
    }
  }
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 1. Fast Drop for Malicious Scanners / Vulnerability Exploits
  if (MALICIOUS_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return new NextResponse('Access Denied', {
      status: 403,
      headers: { 'X-DDoS-Shield': 'BLOCKED_MALICIOUS_PROBE' },
    });
  }

  // 2. High-Capacity Anti-DDoS Rate Limiter
  const ip = getClientIp(request);
  const now = Date.now();

  let tracker = clientTrackers.get(ip);
  if (!tracker || now - tracker.windowStart > WINDOW_MS) {
    tracker = { count: 1, windowStart: now };
    clientTrackers.set(ip, tracker);
  } else {
    tracker.count++;
  }

  // Check if IP is currently under temporary DDoS block
  if (tracker.blockedUntil && now < tracker.blockedUntil) {
    const retrySec = Math.ceil((tracker.blockedUntil - now) / 1000);
    return new NextResponse(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'Anti-DDoS Shield Active. Please wait a few seconds.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retrySec),
          'X-DDoS-Shield': 'RATE_LIMITED',
        },
      }
    );
  }

  // If IP exceeds threshold in window, apply block
  if (tracker.count > MAX_REQUESTS_PER_WINDOW) {
    tracker.blockedUntil = now + BLOCK_DURATION_MS;
    return new NextResponse(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'High traffic burst detected. Anti-DDoS protection triggered.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '20',
          'X-DDoS-Shield': 'BURST_BLOCKED',
        },
      }
    );
  }

  if (Math.random() < 0.05) {
    pruneOldClients();
  }

  const setSecurityAndFreshnessHeaders = (res: NextResponse) => {
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');
    res.headers.set('X-DDoS-Shield', 'Active');
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('X-Frame-Options', 'SAMEORIGIN');
    return res;
  };

  // 3. Root Page Mobile App / Desktop Web View Detection
  if (pathname === '/') {
    const viewParam = searchParams.get('view') || searchParams.get('mode') || (searchParams.get('app') === 'true' ? 'app' : null);
    const cookieView = request.cookies.get('ff_view_mode')?.value;

    // Explicit request to view desktop website
    if (viewParam === 'web' || cookieView === 'web') {
      const response = NextResponse.next();
      if (viewParam === 'web') {
        response.cookies.set('ff_view_mode', 'web', { path: '/', maxAge: 60 * 60 * 24 });
      }
      return setSecurityAndFreshnessHeaders(response);
    }

    // Explicit request to view mobile app
    if (viewParam === 'app' || cookieView === 'app') {
      const url = request.nextUrl.clone();
      url.pathname = '/mobile-app-view';
      const response = NextResponse.redirect(url);
      if (viewParam === 'app') {
        response.cookies.set('ff_view_mode', 'app', { path: '/', maxAge: 60 * 60 * 24 });
      }
      return setSecurityAndFreshnessHeaders(response);
    }
  }

  const response = NextResponse.next();
  return setSecurityAndFreshnessHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - downloads/ or ffrivals.apk (app download file)
     */
    '/((?!_next/static|_next/image|favicon.ico|downloads/|ffrivals.apk).*)',
  ],
};
