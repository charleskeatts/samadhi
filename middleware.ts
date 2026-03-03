/**
 * Next.js Middleware
 * - Refreshes Supabase session on every request
 * - Redirects unauthenticated users from /dashboard to /login
 * - Redirects authenticated users from / and /login to /dashboard
 */

import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  
  const pathname = request.nextUrl.pathname;

  // Allow auth callbacks and public paths
  if (pathname.startsWith('/api/auth') || pathname === '/') {
    return response;
  }

  // If trying to access dashboard without session, redirect to login
  if (pathname.startsWith('/dashboard')) {
    const session = response.headers.get('x-supabase-session');
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      return Response.redirect(loginUrl);
    }
  }

  // If trying to access login with session, redirect to dashboard
  if (pathname === '/login' || pathname === '/signup') {
    const session = response.headers.get('x-supabase-session');
    if (session) {
      const dashboardUrl = new URL('/dashboard', request.url);
      return Response.redirect(dashboardUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
