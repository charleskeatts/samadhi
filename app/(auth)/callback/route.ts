import { createClient, getAuthProfile } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);

    // Use service-role client for profile check to avoid RLS circular policy
    const auth = await getAuthProfile();
    if (auth === null) {
      // Authenticated but no profile — new user, send to onboarding
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  // Returning user with profile — go to dashboard
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
