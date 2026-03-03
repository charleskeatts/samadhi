/**
 * Next.js Middleware
 * - Refreshes Supabase session on every request
 * - Redirects unauthenticated users from /dashboard to /login
 * - Redirects authenticated users from /login and /signup to /dashboard
 */

import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  // Always allow: API auth callback, onboarding page
  if (
    pathname.startsWith('/api/auth') ||
    pathname === '/onboarding'
  ) {
    return response;
  }

  // Protect dashboard — redirect to login if not authenticated
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect authenticated users away from login/signup to dashboard
  if (pathname === '/login' || pathname === '/signup') {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
