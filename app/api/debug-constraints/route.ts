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

  // Broad sweep of category values - every possible option
  const categoryValues = [
    // From feedback table constraint
    'feature_request', 'bug_report', 'churn_risk', 'competitive_intel', 
    'pricing_concern', 'general', 'uncategorized',
    // PascalCase / Mixed case variations
    'Feature Request', 'Bug Report', 'General', 'Integration', 'Analytics',
    // Other possibilities
    'integration', 'analytics', 'ux', 'security', 'performance',
    'infrastructure', 'enhancement', 'platform', 'api', 'mobile',
    'reporting', 'export', 'import', 'automation', 'workflow',
  ];
  
  const categoryResults: Record<string, string> = {};

  for (const cat of categoryValues) {
    const { error } = await admin
      .from('feature_requests')
      .insert({
        organization_id: orgId,
        account_id: accountId,
        feature_name: `cat-test-${cat}`,
        category: cat,
        deal_stage: 'discovery',
        blocker_score: 1,
      });
    
    if (error) {
      // Check if the error is about category or deal_stage
      categoryResults[cat] = error.message.includes('category') 
        ? 'CATEGORY_REJECTED'
        : error.message.includes('deal_stage')
          ? 'DEAL_STAGE_REJECTED'
          : `OTHER: ${error.message}`;
    } else {
      categoryResults[cat] = 'ACCEPTED';
      await admin.from('feature_requests').delete()
        .eq('feature_name', `cat-test-${cat}`)
        .eq('organization_id', orgId);
    }
  }

  // Now test deal_stage using any accepted category
  const goodCategory = Object.entries(categoryResults).find(([_, v]) => v === 'ACCEPTED')?.[0] 
    || Object.entries(categoryResults).find(([_, v]) => v === 'DEAL_STAGE_REJECTED')?.[0];
  
  const dealStageValues = [
    'discovery', 'evaluation', 'negotiation', 'closed_won', 'closed_lost',
    'active', 'backlog', 'planned', 'in_progress', 'shipped',
    'prospecting', 'qualification', 'proposal', 'contract',
    'new', 'open', 'won', 'lost',
    'Discovery', 'Evaluation', 'Negotiation', 'Closed Won', 'Active',
    'Renewal', 'Expansion', 'At Risk', 'New Business',
  ];
  const dealStageResults: Record<string, string> = {};

  if (goodCategory) {
    for (const ds of dealStageValues) {
      const { error } = await admin
        .from('feature_requests')
        .insert({
          organization_id: orgId,
          account_id: accountId,
          feature_name: `ds-test-${ds}`,
          category: goodCategory,
          deal_stage: ds,
          blocker_score: 1,
        });
      
      if (error) {
        dealStageResults[ds] = error.message.includes('deal_stage')
          ? 'DEAL_STAGE_REJECTED'
          : error.message.includes('category')
            ? 'CATEGORY_REJECTED'
            : `OTHER: ${error.message}`;
      } else {
        dealStageResults[ds] = 'ACCEPTED';
        await admin.from('feature_requests').delete()
          .eq('feature_name', `ds-test-${ds}`)
          .eq('organization_id', orgId);
      }
    }
  }

  return NextResponse.json({
    goodCategory,
    categoryResults,
    dealStageResults,
  });
}
