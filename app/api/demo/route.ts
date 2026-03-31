/**
 * Demo Session API
 * Creates a temporary demo user + org + profile in Supabase,
 * seeds dummy data, and returns session credentials so the
 * client can sign in without a magic link email.
 *
 * Flow:
 *   1. Generate a unique demo email (demo-{uuid}@clairio-demo.local)
 *   2. Create the user via Supabase Admin API (auto-confirms)
 *   3. Create org + profile via service role client
 *   4. Seed demo data
 *   5. Return { email, password } so the client can call signInWithPassword
 *
 * NOTE: This route is for beta/MVP demo testing only.
 * In production, remove or gate behind an env flag.
 */

import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { seedDemoData } from '@/lib/supabase/seed-demo';

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Server misconfigured — missing Supabase keys' },
      { status: 500 }
    );
  }

  // Service role client with explicit server-side options.
  // The service role key bypasses RLS when auth options disable
  // browser-oriented session persistence.
  const admin = createServiceClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // 1. Generate unique demo identity
    const demoId = crypto.randomUUID().slice(0, 8);
    const email = `demo-${demoId}@clairio-demo.local`;
    const password = `demo-${crypto.randomUUID()}`; // strong random, never shown to user
    const companyName = `Demo Co ${demoId.toUpperCase()}`;

    // 2. Create user via Admin API (auto-confirms, no email sent)
    const { data: userData, error: userError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { demo: true, full_name: 'Demo User' },
    });

    if (userError || !userData.user) {
      console.error('[demo] createUser failed:', userError?.message, userError);
      return NextResponse.json(
        { error: `Failed to create demo user: ${userError?.message || 'unknown'}` },
        { status: 500 }
      );
    }

    const userId = userData.user.id;
    console.log(`[demo] created user ${userId} (${email})`);

    // 3. Create org
    const slug = `demo-${demoId}`;
    const { data: org, error: orgError } = await admin
      .from('organizations')
      .insert({ name: companyName, slug })
      .select('id')
      .single();

    if (orgError || !org) {
      console.error('[demo] org creation failed:', orgError?.message, orgError);
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: `Failed to create demo organization: ${orgError?.message || 'unknown'}` },
        { status: 500 }
      );
    }

    console.log(`[demo] created org ${org.id} (${companyName})`);

    // 4. Create profile
    // The auth.users FK may need a moment to propagate after admin.createUser.
    // Retry up to 3 times with a short delay.
    let profileData = null;
    let profileError = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const result = await admin
        .from('profiles')
        .insert({
          id: userId,
          org_id: org.id,
          full_name: 'Demo User',
          role: 'admin',
        })
        .select('id')
        .single();

      if (!result.error) {
        profileData = result.data;
        profileError = null;
        break;
      }

      profileError = result.error;
      console.warn(`[demo] profile insert attempt ${attempt} failed:`, result.error.message, result.error.code);

      if (attempt < 3) {
        // Wait 500ms before retry — gives auth.users FK time to propagate
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    if (profileError) {
      console.error('[demo] profile creation failed after retries:', profileError.message, profileError.code, profileError.details, profileError.hint);
      // Clean up
      await admin.from('organizations').delete().eq('id', org.id);
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: `Failed to create demo profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    console.log(`[demo] created profile for user ${userId}`, profileData);

    // 5. Seed demo data
    try {
      await seedDemoData(org.id, userId);
    } catch (err) {
      console.error('[demo] seedDemoData failed (non-fatal):', err);
      // Continue — user can still explore the empty dashboard
    }

    // 6. Return credentials for client-side sign-in
    return NextResponse.json({
      email,
      password,
      orgName: companyName,
    });
  } catch (err) {
    console.error('[demo] unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
