/**
 * Accounts API endpoint
 * GET:  Fetch all accounts for the org
 * POST: Create a new account
 *
 * Uses getAuthProfile() which provides a service-role admin client
 * to bypass RLS issues (the DB RLS policies reference the old org_id column).
 */

import { getAuthProfile } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const auth = await getAuthProfile();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: accounts, error } = await auth.admin
      .from('accounts')
      .select('id, name, arr, crm_source, created_at')
      .eq('organization_id', auth.orgId)
      .order('arr', { ascending: false });

    if (error) throw error;

    return NextResponse.json(accounts || []);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthProfile();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, arr } = body;

    if (!name) {
      return NextResponse.json({ error: 'Account name is required' }, { status: 400 });
    }

    const { data: account, error } = await auth.admin
      .from('accounts')
      .insert({
        organization_id: auth.orgId,
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
