import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/', '/pricing', '/demo', '/blog', '/privacy', '/terms', '/security', '/status'];
const AUTH_PATHS = ['/sign-in', '/sign-up', '/forgot-password'];
const APP_PREFIX = ['/dashboard', '/configurators', '/leads', '/customers', '/analytics', '/embed', '/settings'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Let API routes and static files pass through
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/onboarding')
  ) {
    return NextResponse.next();
  }

  const sessionCookieName = 'auth_session';
  const hasSession = !!req.cookies.get(sessionCookieName)?.value;

  // Authenticated user on auth pages → send to dashboard
  if (hasSession && AUTH_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Unauthenticated user on app pages → send to sign-in
  if (!hasSession && APP_PREFIX.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    const url = new URL('/sign-in', req.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
