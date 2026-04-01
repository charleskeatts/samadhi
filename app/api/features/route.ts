/**
 * Features API endpoint
 * GET:  Fetch all feature requests for the org
 * POST: Create a new feature request
 *
 * Uses getAuthProfile() which provides a service-role admin client
 * to bypass RLS issues (the DB RLS policies reference the old org_id column).
 *
 * VALID ENUMS:
 *   category:   Integration | Analytics | Security | Performance
 *   deal_stage: Prospect | Qualified | Negotiation
 */

import { getAuthProfile } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const auth = await getAuthProfile();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: features, error } = await auth.admin
      .from('feature_requests')
      .select('*, accounts:account_id (id, name, arr)')
      .eq('organization_id', auth.orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(features || []);
  } catch (error) {
    console.error('Error fetching features:', error);
    return NextResponse.json({ error: 'Failed to fetch features' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthProfile();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    const { account_id, feature_name, category, deal_stage, notes, blocker_score, source } = body;

    if (!account_id || !feature_name || !category || !deal_stage) {
      return NextResponse.json(
        { error: 'Missing required fields: account_id, feature_name, category, deal_stage' },
        { status: 400 }
      );
    }

    // Validate enums
    const validCategories = ['Integration', 'Analytics', 'Security', 'Performance'];
    const validDealStages = ['Prospect', 'Qualified', 'Negotiation'];

    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    if (!validDealStages.includes(deal_stage)) {
      return NextResponse.json(
        { error: `Invalid deal stage. Must be one of: ${validDealStages.join(', ')}` },
        { status: 400 }
      );
    }

    const { data: feature, error } = await auth.admin
      .from('feature_requests')
      .insert({
        organization_id: auth.orgId,
        account_id,
        feature_name,
        category,
        deal_stage,
        notes: notes || '',
        submitted_by: auth.user.id,
        source: source || 'manual',
        confidence: 1,
        confidence_note: body.confidence_note || '',
        blocker_score: blocker_score ?? 3,
      })
      .select('*, accounts:account_id (id, name, arr)')
      .single();

    if (error) {
      console.error('Error creating feature request:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(feature, { status: 201 });
  } catch (error) {
    console.error('Error creating feature request:', error);
    return NextResponse.json({ error: 'Failed to create feature request' }, { status: 500 });
  }
}
