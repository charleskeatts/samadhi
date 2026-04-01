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

  // We know: Negotiation, Qualified work
  // These are standard Salesforce-like opportunity stages
  // Standard SFDC has: Prospecting, Qualification, Needs Analysis, Value Proposition,
  //   Id. Decision Makers, Perception Analysis, Proposal/Price Quote, Negotiation/Review, Closed Won, Closed Lost
  // But "Qualification" was rejected while "Qualified" works
  // And "Negotiation" works but "Negotiation/Review" was likely rejected
  // This suggests a CUSTOM enum. Let me try systematic patterns.

  const stages = [
    // Single-word past tense / adjective forms (like "Qualified", "Negotiation")
    'Contacted', 'Presented', 'Proposed', 'Committed', 'Converted',
    'Engaged', 'Evaluated', 'Assessed', 'Confirmed', 'Signed',
    'Renewed', 'Churned', 'Escalated', 'Resolved',
    // Single-word nouns (like "Negotiation")
    'Presentation', 'Confirmation', 'Assessment', 'Engagement',
    'Implementation', 'Conversion', 'Procurement', 'Onboarding',
    'Retention', 'Advocacy', 'Exploration',
    // Common pipeline stages
    'Prospect', 'Lead', 'Champion', 'Stakeholder',
    // Status-like
    'Active', 'Inactive', 'Stalled', 'Pending', 'Paused',
    // Opportunity result stages
    'Won', 'Lost', 'Closed',
    // MEDDIC
    'Identified', 'Validated', 'Confirmed',
    // Custom product stages (since this is a product intelligence tool)
    'Requested', 'Acknowledged', 'Planned', 'Developing', 'Shipped',
    'Rejected', 'Deferred', 'Archived',
    // More deal stage variations
    'Initial', 'Discovery', 'Solution', 'Proposal', 'Review',
    'Trial', 'Pilot', 'POC', 'Demo', 'Contract',
    // Possibly the constraint mirrors common CRM deal_stage values
    'Open', 'InProgress', 'ClosedWon', 'ClosedLost',
    // Try with spaces
    'In Progress', 'Closed Won', 'Closed Lost', 'At Risk',
    'New Business', 'Under Review',
    // camelCase
    'inProgress', 'closedWon', 'closedLost', 'atRisk', 'newBusiness',
    // Standard Salesforce exactly
    'Prospecting', 'Needs Analysis', 'Value Proposition',
    'Id. Decision Makers', 'Perception Analysis',
    'Proposal/Price Quote', 'Negotiation/Review',
  ];

  const stageResults: Record<string, string> = {};
  for (const ds of stages) {
    const { error } = await admin.from('feature_requests').insert({
      organization_id: orgId, account_id: accountId,
      feature_name: `sweep5-${ds}`, category: 'Integration',
      deal_stage: ds, blocker_score: 1,
    });
    if (error) {
      stageResults[ds] = 'REJECTED';
    } else {
      stageResults[ds] = 'ACCEPTED';
      await admin.from('feature_requests').delete()
        .eq('feature_name', `sweep5-${ds}`)
        .eq('organization_id', orgId);
    }
  }

  const accepted = Object.entries(stageResults)
    .filter(([_, v]) => v === 'ACCEPTED')
    .map(([k]) => k);

  return NextResponse.json({
    knownValid: {
      categories: ['Integration', 'Analytics', 'Security', 'Performance'],
      dealStages: ['Negotiation', 'Qualified'],
    },
    newlyAccepted: accepted,
    stageResults,
  });
}
