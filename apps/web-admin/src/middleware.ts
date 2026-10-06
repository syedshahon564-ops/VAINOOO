import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Only handle root page detection
  if (pathname === '/') {
    const viewParam = searchParams.get('view') || searchParams.get('mode');
    const cookieView = request.cookies.get('ff_view_mode')?.value;

    // Explicit request to view desktop website
    if (viewParam === 'web' || cookieView === 'web') {
      const response = NextResponse.next();
      if (viewParam === 'web') {
        response.cookies.set('ff_view_mode', 'web', { path: '/', maxAge: 60 * 60 * 24 });
      }
      return response;
    }

    // Explicit request to view mobile app
    if (viewParam === 'app' || cookieView === 'app') {
      const url = request.nextUrl.clone();
      url.pathname = '/mobile-app-view';
      url.search = '';
      const response = NextResponse.redirect(url);
      if (viewParam === 'app') {
        response.cookies.set('ff_view_mode', 'app', { path: '/', maxAge: 60 * 60 * 24 });
      }
      return response;
    }

    // Auto-detect mobile devices via User-Agent header on the server
    const ua = request.headers.get('user-agent') || '';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);

    if (isMobile) {
      // Clean HTTP redirect to /mobile-app-view so client and server both hydrate /mobile-app-view
      const url = request.nextUrl.clone();
      url.pathname = '/mobile-app-view';
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
