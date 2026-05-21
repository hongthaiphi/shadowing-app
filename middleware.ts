import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/progress', '/admin', '/shadowing', '/dictation'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const sessionCookie = request.cookies.get('user_session');
  if (!sessionCookie?.value) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protect admin routes by role
  if (pathname.startsWith('/admin')) {
    try {
      const session = JSON.parse(decodeURIComponent(sessionCookie.value));
      if (session.role !== 'admin' && session.role !== 'teacher') {
        return NextResponse.redirect(new URL('/lessons', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/progress/:path*', '/admin/:path*', '/shadowing/:path*', '/dictation/:path*'],
};
