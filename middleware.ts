/**
 * Next.js Middleware
 * - Refreshes Supabase session on every request
 * - Redirects unauthenticated users from /dashboard and /onboarding to /login
 * - Redirects authenticated users from /login and /signup to /dashboard
 *
 * NOTE: API routes (/api/*) are NOT protected here by design.
 * Each route in app/api/ must independently verify the session
 * via createServerClient + supabase.auth.getUser().
 */

import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  // Always allow: API auth callback
  if (pathname.startsWith('/api/auth')) {
    return response;
  }

  // Protect dashboard AND onboarding — both require an authenticated session
  // (Onboarding is only reached after clicking a magic link, so user must be authed)
  if (pathname.startsWith('/dashboard') || pathname === '/onboarding') {
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
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)',
  ],
};
