import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: orgs } = await admin.from('organizations').select('id').limit(1);
  const { data: accts } = await admin.from('accounts').select('id').limit(1);

  if (!orgs?.[0] || !accts?.[0]) {
    return NextResponse.json({ error: 'No org or account found' });
  }

  const orgId = orgs[0].id;
  const accountId = accts[0].id;

  // Step 1: Find a valid deal_stage by trying values with a simple category
  const dealStageValues = ['discovery', 'evaluation', 'negotiation', 'closed_won', 'closed_lost', 'active', 'backlog', 'planned', 'in_progress', 'shipped', 'new', 'open', 'won', 'lost', 'prospect', 'demo', 'trial', 'onboarding'];
  const dealStageResults: Record<string, string> = {};

  for (const ds of dealStageValues) {
    const { error } = await admin
      .from('feature_requests')
      .insert({
        organization_id: orgId,
        account_id: accountId,
        feature_name: `ds-test-${ds}`,
        category: 'general',
        deal_stage: ds,
        blocker_score: 1,
      });
    
    if (error) {
      dealStageResults[ds] = `REJECTED: ${error.message}`;
    } else {
      dealStageResults[ds] = 'ACCEPTED';
      await admin.from('feature_requests').delete().eq('feature_name', `ds-test-${ds}`).eq('organization_id', orgId);
    }
  }

  // Step 2: Find a valid category using a known-good deal_stage
  const goodDealStage = Object.entries(dealStageResults).find(([_, v]) => v === 'ACCEPTED')?.[0];
  const categoryValues = ['Integration', 'Analytics', 'feature_request', 'bug_report', 'churn_risk', 'competitive_intel', 'pricing_concern', 'general', 'uncategorized', 'enhancement', 'infrastructure', 'ux', 'security'];
  const categoryResults: Record<string, string> = {};

  if (goodDealStage) {
    for (const cat of categoryValues) {
      const { error } = await admin
        .from('feature_requests')
        .insert({
          organization_id: orgId,
          account_id: accountId,
          feature_name: `cat-test-${cat}`,
          category: cat,
          deal_stage: goodDealStage,
          blocker_score: 1,
        });
      
      if (error) {
        categoryResults[cat] = `REJECTED: ${error.message}`;
      } else {
        categoryResults[cat] = 'ACCEPTED';
        await admin.from('feature_requests').delete().eq('feature_name', `cat-test-${cat}`).eq('organization_id', orgId);
      }
    }
  }

  // Step 3: Also get existing data to see what values are already used
  const { data: existing } = await admin
    .from('feature_requests')
    .select('category, deal_stage')
    .limit(20);

  return NextResponse.json({
    goodDealStage,
    dealStageResults,
    categoryResults,
    existingData: existing,
  });
}
