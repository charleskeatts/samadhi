import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);

    // Check if this user already has a profile (returning user vs new user)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      // New user — no profile yet → send to onboarding
      if (!profile) {
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }
    }
  }

  // Returning user — go straight to dashboard
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
