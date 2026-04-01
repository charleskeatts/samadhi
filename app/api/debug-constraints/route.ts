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

  // We know Integration is a valid category, test more deal_stage PascalCase values
  const dealStageValues = [
    // PascalCase variants
    'Prospecting', 'Qualification', 'Proposal', 'Negotiation',
    'Closed Won', 'Closed Lost', 'Discovery', 'Evaluation',
    'Active', 'Renewal', 'Expansion', 'Onboarding',
    'Demo', 'Trial', 'Contract', 'Implementation',
    'At Risk', 'New Business', 'Upsell', 'Cross-Sell',
    // Title Case single words
    'New', 'Open', 'Won', 'Lost', 'Pending', 'Review',
    // Exactly like Salesforce standard stages
    'Perception Analysis', 'Value Proposition', 'Id. Decision Makers',
    'Needs Analysis', 'Proposal/Price Quote',
    // Common CRM stages
    'Lead', 'Opportunity', 'Decision', 'Verbal Commitment',
  ];

  const results: Record<string, string> = {};

  for (const ds of dealStageValues) {
    const { error } = await admin
      .from('feature_requests')
      .insert({
        organization_id: orgId,
        account_id: accountId,
        feature_name: `ds2-test-${ds}`,
        category: 'Integration',
        deal_stage: ds,
        blocker_score: 1,
      });
    
    if (error) {
      results[ds] = error.message.includes('deal_stage') ? 'REJECTED' : `OTHER: ${error.message}`;
    } else {
      results[ds] = 'ACCEPTED';
      await admin.from('feature_requests').delete().eq('feature_name', `ds2-test-${ds}`).eq('organization_id', orgId);
    }
  }

  // Also test more categories with known-good deal_stage 'Negotiation'
  const moreCategories = [
    'UX', 'Security', 'Performance', 'Infrastructure', 'Platform',
    'API', 'Mobile', 'Reporting', 'Data', 'Billing',
    'Compliance', 'Onboarding', 'Support', 'Documentation',
    'Automation', 'Workflow', 'Dashboard', 'Notification',
    'Export', 'Import', 'Search', 'Admin',
  ];
  const catResults: Record<string, string> = {};

  for (const cat of moreCategories) {
    const { error } = await admin
      .from('feature_requests')
      .insert({
        organization_id: orgId,
        account_id: accountId,
        feature_name: `cat2-test-${cat}`,
        category: cat,
        deal_stage: 'Negotiation',
        blocker_score: 1,
      });
    
    if (error) {
      catResults[cat] = error.message.includes('category') ? 'REJECTED' : `OTHER: ${error.message}`;
    } else {
      catResults[cat] = 'ACCEPTED';
      await admin.from('feature_requests').delete().eq('feature_name', `cat2-test-${cat}`).eq('organization_id', orgId);
    }
  }

  return NextResponse.json({
    knownGood: { category: 'Integration', dealStage: 'Negotiation' },
    dealStageResults: results,
    categoryResults: catResults,
  });
}
