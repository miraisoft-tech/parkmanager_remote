import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken, COOKIE_NAME } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypassed paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const user = token ? await verifySessionToken(token) : null;

  // Protected paths: /dashboard, /reports, /api/reports
  const isProtectedPath =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/api/reports');

  if (isProtectedPath) {
    if (!user || user.role !== 'admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
      }
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If user is already authenticated and visits /login or root /, redirect to /dashboard
  if (user && user.role === 'admin' && (pathname === '/login' || pathname === '/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If root / and not authenticated, go to /login
  if (!user && pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
