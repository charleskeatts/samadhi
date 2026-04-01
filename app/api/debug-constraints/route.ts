import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get a valid org and account to reference
  const { data: orgs } = await admin.from('organizations').select('id').limit(1);
  const { data: accts } = await admin.from('accounts').select('id').limit(1);

  if (!orgs?.[0] || !accts?.[0]) {
    return NextResponse.json({ error: 'No org or account found to test with' });
  }

  const orgId = orgs[0].id;
  const accountId = accts[0].id;

  // Test category values
  const categoryValues = ['Integration', 'Analytics', 'feature_request', 'bug_report', 'churn_risk', 'competitive_intel', 'pricing_concern', 'general', 'uncategorized', 'test'];
  const categoryResults: Record<string, string> = {};

  for (const cat of categoryValues) {
    const { error } = await admin
      .from('feature_requests')
      .insert({
        organization_id: orgId,
        account_id: accountId,
        feature_name: `cat-test-${cat}`,
        category: cat,
        blocker_score: 1,
      });
    
    if (error) {
      categoryResults[cat] = `REJECTED: ${error.message}`;
    } else {
      categoryResults[cat] = 'ACCEPTED';
      await admin.from('feature_requests').delete().eq('feature_name', `cat-test-${cat}`).eq('organization_id', orgId);
    }
  }

  // Test deal_stage values (use a known-good category)
  const goodCategory = Object.entries(categoryResults).find(([_, v]) => v === 'ACCEPTED')?.[0];
  const dealStageValues = ['discovery', 'evaluation', 'negotiation', 'closed_won', 'closed_lost', 'active', 'backlog', 'planned', 'in_progress', 'shipped', 'Renewal', 'Active', 'At Risk', 'Expansion', 'New Business', null];
  const dealStageResults: Record<string, string> = {};

  if (goodCategory) {
    for (const ds of dealStageValues) {
      const key = ds === null ? 'null' : ds;
      const { error } = await admin
        .from('feature_requests')
        .insert({
          organization_id: orgId,
          account_id: accountId,
          feature_name: `ds-test-${key}`,
          category: goodCategory,
          deal_stage: ds,
          blocker_score: 1,
        });
      
      if (error) {
        dealStageResults[key] = `REJECTED: ${error.message}`;
      } else {
        dealStageResults[key] = 'ACCEPTED';
        await admin.from('feature_requests').delete().eq('feature_name', `ds-test-${key}`).eq('organization_id', orgId);
      }
    }
  }

  return NextResponse.json({ categoryResults, goodCategory, dealStageResults });
}
