/**
 * Accounts API endpoint
 * GET:  Fetch all accounts for the org
 * POST: Create a new account
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('id, name, arr, crm_source, created_at')
      .eq('organization_id', profile.organization_id)
      .order('arr', { ascending: false });

    if (error) throw error;

    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, arr } = body;

    if (!name) {
      return NextResponse.json({ error: 'Account name is required' }, { status: 400 });
    }

    const { data: account, error } = await supabase
      .from('accounts')
      .insert({
        organization_id: profile.organization_id,
        name,
        arr: arr || 0,
        crm_source: 'manual',
      })
      .select('id, name, arr, crm_source, created_at')
      .single();

    if (error) {
      console.error('Error creating account:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
