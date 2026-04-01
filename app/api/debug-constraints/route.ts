export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const admin = createClient(supabaseUrl, serviceRoleKey);

  // Strategy: Try to get the constraint text by querying information_schema
  // or pg_catalog via the Supabase REST API (which proxies to PostgREST)

  // First, try to read the actual error message more carefully
  // by inserting with a deliberately wrong value
  const orgId = (await admin.from('organizations').select('id').limit(1)).data?.[0]?.id;
  const accountId = (await admin.from('accounts').select('id').limit(1)).data?.[0]?.id;

  if (!orgId || !accountId) {
    return NextResponse.json({ error: 'No org or account found' });
  }

  // Get the raw error for deal_stage constraint
  const { error: rawError } = await admin.from('feature_requests').insert({
    organization_id: orgId, account_id: accountId,
    feature_name: `constraint-test`, category: 'Integration',
    deal_stage: 'DELIBERATELY_INVALID_VALUE_12345', blocker_score: 1,
  });

  // Now try many more deal_stage patterns - lowercase, snake_case, etc.
  const dsValues = [
    // lowercase versions
    'negotiation', 'prospecting', 'qualification', 'discovery',
    'evaluation', 'proposal', 'closed_won', 'closed_lost',
    'demo', 'active', 'new_business', 'expansion', 'renewal',
    'at_risk', 'backlog', 'planned', 'in_progress', 'shipped',
    'won', 'lost', 'open', 'closed', 'pending', 'stale',
    // UPPER_CASE
    'NEGOTIATION', 'PROSPECTING', 'QUALIFICATION', 'DISCOVERY',
    // MixedCase / CRM-style
    'New Business', 'Active', 'Expansion', 'Renewal', 'At Risk',
    'In Progress', 'Closed Won', 'Closed Lost',
    'Backlog', 'Planned', 'Shipped', 'Stale', 'Won', 'Lost',
    'Open', 'Closed', 'Pending',
    // Salesforce standard stages
    'Value Proposition', 'Id. Decision Makers', 'Perception Analysis',
    'Needs Analysis',
    // Short codes
    'new', 'active', 'risk', 'churn',
    // HubSpot stages
    'appointmentscheduled', 'qualifiedtobuy', 'presentationscheduled',
    'decisionmakerboughtin', 'contractsent', 'closedwon', 'closedlost',
    // Pipeline stages
    'pipeline', 'forecast', 'commit', 'upside', 'omitted',
    // Product stages
    'triage', 'review', 'approved', 'rejected', 'deferred',
    'Todo', 'Doing', 'Done', 'Blocked',
    'todo', 'doing', 'done', 'blocked',
    // snake_case product stages
    'new_business', 'at_risk', 'in_progress',
    'closed_won', 'closed_lost',
  ];

  const dsResults: Record<string, string> = {};
  for (const ds of dsValues) {
    const { error } = await admin.from('feature_requests').insert({
      organization_id: orgId, account_id: accountId,
      feature_name: `sweep2-${ds}`, category: 'Integration',
      deal_stage: ds, blocker_score: 1,
    });
    if (error) {
      dsResults[ds] = error.message.includes('deal_stage')
        ? 'REJECTED'
        : `OTHER: ${error.message.slice(0, 120)}`;
    } else {
      dsResults[ds] = 'ACCEPTED';
      await admin.from('feature_requests').delete()
        .eq('feature_name', `sweep2-${ds}`)
        .eq('organization_id', orgId);
    }
  }

  const accepted = Object.entries(dsResults)
    .filter(([_, v]) => v === 'ACCEPTED')
    .map(([k]) => k);

  return NextResponse.json({
    rawErrorMessage: rawError?.message || 'No error',
    rawErrorDetails: rawError?.details || 'No details',
    rawErrorHint: (rawError as any)?.hint || 'No hint',
    rawErrorCode: (rawError as any)?.code || 'No code',
    previouslyFound: {
      categories: ['Integration', 'Analytics', 'Security', 'Performance'],
      dealStages: ['Negotiation'],
    },
    newAccepted: accepted,
    allNewResults: dsResults,
  });
}
