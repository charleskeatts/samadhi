/**
 * Onboarding API
 * Creates org + profile for a newly confirmed user.
 * Called once per user, right after email confirmation.
 */

import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { seedDemoData } from '@/lib/supabase/seed-demo';

export async function POST(request: NextRequest) {
  try {
    const { company_name, full_name, role } = await request.json();

    if (!company_name?.trim()) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    // Use session client only to verify the user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Use service role client to bypass RLS for bootstrap org/profile creation
    // (new users have no org_id yet, so RLS would block them — chicken-and-egg)
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if profile already exists (prevent duplicate orgs)
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (existingProfile) {
      // Already onboarded — user clicked magic link again or refreshed. Just send them to dashboard.
      return NextResponse.json({ success: true });
    }

    // Create slug from company name (lowercase, hyphens)
    const slug = company_name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Create the organization
    const { data: org, error: orgError } = await admin
      .from('organizations')
      .insert({ name: company_name.trim(), slug })
      .select('id')
      .single();

    if (orgError) {
      console.error('Error creating org:', orgError);
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
    }

    // Create the user profile
    const { error: profileError } = await admin
      .from('profiles')
      .insert({
        id: user.id,
        organization_id: org.id,
        full_name: full_name || user.email?.split('@')[0] || 'Admin',
        role: role || 'admin',
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Clean up the org we just created
      await admin.from('organizations').delete().eq('id', org.id);
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }

    // Seed demo data synchronously so testers land on a populated dashboard.
    // Awaited (not fire-and-forget) because Vercel freezes the lambda after
    // the response — detached promises never resolve.
    try {
      await seedDemoData(org.id, user.id);
    } catch (err) {
      console.error('[onboarding] seedDemoData failed (non-fatal):', err);
    }

    return NextResponse.json({ success: true, organization_id: org.id });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
