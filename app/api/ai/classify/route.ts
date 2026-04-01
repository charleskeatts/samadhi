import { NextRequest, NextResponse } from 'next/server';
import { getAuthProfile } from '@/lib/supabase/server';
import { classifyFeatureRequest } from '@/lib/anthropic/classify';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feature_request_id } = body;

    if (!feature_request_id) {
      return NextResponse.json({ error: 'feature_request_id is required' }, { status: 400 });
    }

    const auth = await getAuthProfile();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: feature } = await auth.admin
      .from('feature_requests')
      .select('id, feature_name, notes, account_id, accounts:account_id(name, arr)')
      .eq('id', feature_request_id)
      .eq('organization_id', auth.orgId)
      .single();

    if (!feature) {
      return NextResponse.json({ error: 'Feature request not found' }, { status: 404 });
    }

    const accounts = feature.accounts as any;
    const result = await classifyFeatureRequest(
      feature.id,
      feature.feature_name,
      feature.notes || '',
      accounts?.name || 'Unknown',
      accounts?.arr || 0
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error classifying feature request:', error);
    return NextResponse.json({ error: 'Failed to classify' }, { status: 500 });
  }
}
