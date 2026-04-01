export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // Using brute-force approach since we can't query pg_constraint directly
  const admin = createClient(supabaseUrl, serviceRoleKey);

  // Approach: try to extract constraint text by trying lots of values quickly
  // We already know: Integration, Analytics, Security, Performance work for category
  // and Negotiation works for deal_stage
  // Let's try systematic single-word PascalCase from product management domain

  const orgId = (await admin.from('organizations').select('id').limit(1)).data?.[0]?.id;
  const accountId = (await admin.from('accounts').select('id').limit(1)).data?.[0]?.id;

  if (!orgId || !accountId) {
    return NextResponse.json({ error: 'No org or account found' });
  }

  // Comprehensive category sweep
  const catValues = [
    // Already found: Integration, Analytics, Security, Performance
    'Scalability', 'Reliability', 'Usability', 'Accessibility',
    'Compliance', 'Pricing', 'Billing', 'Authentication',
    'Authorization', 'Deployment', 'Monitoring', 'Logging',
    'Testing', 'Documentation', 'Training', 'Migration',
    'Customization', 'Configuration', 'Notification', 'Communication',
    'Collaboration', 'Search', 'Navigation', 'Visualization',
    'Export', 'Import', 'Sync', 'Backup', 'Recovery',
    'AI', 'ML', 'Automation', 'Workflow', 'Pipeline',
    'Dashboard', 'Report', 'Alert', 'Webhook',
    'Plugin', 'Extension', 'Widget', 'Theme',
    'Other', 'Misc', 'Unknown', 'None',
    'UX', 'UI', 'Design', 'Frontend', 'Backend',
    'Database', 'API', 'SDK', 'CLI',
    'Mobile', 'Desktop', 'Web', 'Native',
  ];

  // Comprehensive deal_stage sweep  
  const dsValues = [
    // Already found: Negotiation
    'Prospecting', 'Qualification', 'Discovery', 'Evaluation',
    'Proposal', 'Closed Won', 'Closed Lost', 'Demo',
    'Closed-Won', 'Closed-Lost', 'ClosedWon', 'ClosedLost',
    // Single-word stages
    'Lead', 'Contact', 'Opportunity', 'Customer',
    'Churned', 'Trial', 'Pilot', 'POC',
    'Onboarding', 'Renewal', 'Upsell', 'Expansion',
    // Number-based stages
    'Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', 'Stage 5',
    'S1', 'S2', 'S3', 'S4', 'S5',
    // With slashes or dashes
    'Pre-Sales', 'Post-Sales', 'Pre-sale', 'Post-sale',
    // Initial/Exploration stages
    'Awareness', 'Interest', 'Consideration', 'Intent',
    'Purchase', 'Retention', 'Advocacy',
  ];

  const catResults: Record<string, string> = {};
  for (const cat of catValues) {
    const { error } = await admin.from('feature_requests').insert({
      organization_id: orgId, account_id: accountId,
      feature_name: `sweep-${cat}`, category: cat,
      deal_stage: 'Negotiation', blocker_score: 1,
    });
    if (error) {
      catResults[cat] = error.message.includes('category') ? 'REJECTED' : `OTHER: ${error.message}`;
    } else {
      catResults[cat] = 'ACCEPTED';
      await admin.from('feature_requests').delete().eq('feature_name', `sweep-${cat}`).eq('organization_id', orgId);
    }
  }

  const dsResults: Record<string, string> = {};
  for (const ds of dsValues) {
    const { error } = await admin.from('feature_requests').insert({
      organization_id: orgId, account_id: accountId,
      feature_name: `sweep-ds-${ds}`, category: 'Integration',
      deal_stage: ds, blocker_score: 1,
    });
    if (error) {
      dsResults[ds] = error.message.includes('deal_stage') ? 'REJECTED' : `OTHER: ${error.message}`;
    } else {
      dsResults[ds] = 'ACCEPTED';
      await admin.from('feature_requests').delete().eq('feature_name', `sweep-ds-${ds}`).eq('organization_id', orgId);
    }
  }

  const acceptedCats = Object.entries(catResults).filter(([_, v]) => v === 'ACCEPTED').map(([k]) => k);
  const acceptedDS = Object.entries(dsResults).filter(([_, v]) => v === 'ACCEPTED').map(([k]) => k);

  return NextResponse.json({
    summary: {
      acceptedCategories: ['Integration', 'Analytics', 'Security', 'Performance', ...acceptedCats],
      acceptedDealStages: ['Negotiation', ...acceptedDS],
    },
    newCategoryResults: catResults,
    newDealStageResults: dsResults,
  });
}
