/**
 * Feature Requests API
 * POST: create a new feature request (writes to feature_requests table)
 * GET: fetch all feature requests for the org
 */

import { getAuthProfile } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const CreateSchema = z.object({
  account_name: z.string().min(1).max(500),
  arr: z.number().min(0),
  feature_name: z.string().min(1).max(500),
  notes: z.string().min(1).max(5000),
  category: z.string().optional(),
  blocker_score: z.number().min(1).max(5).optional(),
});

export async function GET(_request: NextRequest) {
  try {
    const auth = await getAuthProfile();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await auth.admin
      .from('feature_requests')
      .select('*, accounts:account_id(id, name, arr)')
      .eq('organization_id', auth.orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching feature requests:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthProfile();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const validated = CreateSchema.parse(body);
    const { account_name, arr, feature_name, notes, category, blocker_score } = validated;

    // Find or create account
    const { data: existing } = await auth.admin
      .from('accounts')
      .select('id')
      .eq('organization_id', auth.orgId)
      .eq('name', account_name)
      .single();

    let accountId: string;
    if (existing) {
      accountId = existing.id;
    } else {
      const { data: newAccount, error: accErr } = await auth.admin
        .from('accounts')
        .insert({ organization_id: auth.orgId, name: account_name, arr, crm_source: 'manual' })
        .select()
        .single();
      if (accErr) throw accErr;
      accountId = newAccount.id;
    }

    // Create feature request
    const { data: feature, error: frErr } = await auth.admin
      .from('feature_requests')
      .insert({
        organization_id: auth.orgId,
        account_id: accountId,
        feature_name,
        notes,
        category: category || null,
        blocker_score: blocker_score ?? 3,
        deal_stage: 'backlog',
        submitted_by: auth.user.id,
        source: 'manual',
        confidence: 'medium',
      })
      .select()
      .single();

    if (frErr) throw frErr;
    return NextResponse.json(feature, { status: 201 });
  } catch (error) {
    console.error('Error creating feature request:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
