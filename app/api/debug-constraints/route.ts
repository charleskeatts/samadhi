export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const orgId = (await admin.from('organizations').select('id').limit(1)).data?.[0]?.id;
  const accountId = (await admin.from('accounts').select('id').limit(1)).data?.[0]?.id;

  if (!orgId || !accountId) {
    return NextResponse.json({ error: 'No org or account found' });
  }

  // Test confidence values
  const confidenceValues = [
    null, 0, 0.1, 0.5, 0.9, 1, 1.0, 1.5, 2, 3, 4, 5, 10,
    -1, 0.0, 0.01, 0.99,
  ];

  const confResults: Record<string, string> = {};
  for (const conf of confidenceValues) {
    const key = String(conf);
    const { error } = await admin.from('feature_requests').insert({
      organization_id: orgId, account_id: accountId,
      feature_name: `conf-test-${key}`, category: 'Integration',
      deal_stage: 'Negotiation', blocker_score: 1,
      confidence: conf,
    });
    if (error) {
      confResults[key] = error.message.includes('confidence')
        ? 'REJECTED'
        : `OTHER: ${error.message.slice(0, 100)}`;
    } else {
      confResults[key] = 'ACCEPTED';
      await admin.from('feature_requests').delete()
        .eq('feature_name', `conf-test-${key}`)
        .eq('organization_id', orgId);
    }
  }

  const accepted = Object.entries(confResults)
    .filter(([_, v]) => v === 'ACCEPTED')
    .map(([k]) => k);

  return NextResponse.json({
    knownValid: {
      categories: ['Integration', 'Analytics', 'Security', 'Performance'],
      dealStages: ['Prospect', 'Qualified', 'Negotiation'],
    },
    confidenceTest: {
      accepted,
      allResults: confResults,
    },
  });
}
