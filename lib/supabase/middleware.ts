/**
 * Middleware helper to update session
 * Used in Next.js middleware to keep auth session fresh
 */

import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function updateSession(request: NextRequest) {
  // Guard against missing env vars at runtime (! assertions are compile-time only)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[middleware] Supabase env vars are missing.');
    // Fail closed: treat as unauthenticated so dashboard routes redirect to login
    return {
      response: NextResponse.next({ request: { headers: request.headers } }),
      user: null,
    };
  }

  // `let` is intentional — setAll rebuilds this to propagate updated cookie headers
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        // Two-pass: write cookies to request first, then build one response
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request: { headers: request.headers } });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error('[middleware] getUser error:', error.message);
      return { response, user: null };
    }

    return { response, user };
  } catch (err) {
    console.error('[middleware] Supabase unreachable:', err);
    // Fail closed: unauthenticated users redirected to login
    return { response, user: null };
  }
}
