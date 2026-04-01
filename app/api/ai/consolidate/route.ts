import { NextRequest, NextResponse } from 'next/server';
import { consolidateFeatureRequests } from '@/lib/anthropic/consolidate';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: features } = await admin
      .from('feature_requests')
      .select('id, feature_name, notes, blocker_score, accounts:account_id(name, arr)')
      .order('created_at', { ascending: false })
      .limit(100);

    const result = await consolidateFeatureRequests((features || []) as any);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Error consolidating:', error);
    return NextResponse.json({ error: 'Failed to consolidate' }, { status: 500 });
  }
}
