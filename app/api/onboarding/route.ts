/**
 * Onboarding API
 * Creates org + profile for a newly confirmed user.
 * Called once per user, right after email confirmation.
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { company_name, full_name, role } = await request.json();

    if (!company_name?.trim()) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if profile already exists (prevent duplicate orgs)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (existingProfile) {
      return NextResponse.json({ error: 'Profile already exists' }, { status: 409 });
    }

    // Create slug from company name (lowercase, hyphens)
    const slug = company_name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Create the organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: company_name.trim(), slug })
      .select('id')
      .single();

    if (orgError) {
      console.error('Error creating org:', orgError);
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
    }

    // Create the user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        org_id: org.id,
        full_name: full_name || user.email?.split('@')[0] || 'Admin',
        role: role || 'admin',
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Clean up the org we just created
      await supabase.from('organizations').delete().eq('id', org.id);
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true, org_id: org.id });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
