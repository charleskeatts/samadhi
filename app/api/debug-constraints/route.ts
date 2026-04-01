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

  // KNOWN: Prospect, Qualified, Negotiation
  // Pattern: Single PascalCase words that represent CRM deal stages
  // These follow a typical sales pipeline progression:
  //   Prospect -> Qualified -> ??? -> Negotiation -> ???
  // Let's try ALL possible single-word pipeline stages

  const stages = [
    // Between Prospect and Qualified
    'Contacted', 'Connected', 'Engaged', 'Interested',
    'Responded', 'Scheduled', 'Meeting', 'Called',
    
    // Between Qualified and Negotiation  
    'Proposed', 'Presented', 'Demonstrated', 'Evaluated',
    'Reviewed', 'Analyzed', 'Scoped', 'Quoted',
    'Pitched', 'Benchmarked',
    
    // After Negotiation
    'Committed', 'Signed', 'Contracted', 'Purchased',
    'Onboarded', 'Activated', 'Deployed', 'Live',
    'Closed', 'Won', 'Lost', 'Churned',
    'Renewed', 'Expanded', 'Upgraded',
    
    // Stalled / negative outcomes
    'Stalled', 'Paused', 'Dormant', 'Frozen',
    'Rejected', 'Declined', 'Abandoned', 'Disqualified',
    
    // Standard CRM pipeline words (PascalCase)
    'Awareness', 'Interest', 'Consideration', 'Intent',
    'Evaluation', 'Decision', 'Purchase', 'Retention',
    'Advocacy', 'Referral',
    
    // B2B specific
    'Discovery', 'Alignment', 'Validation', 'Justification',
    'Selection', 'Procurement', 'Implementation',
    'Adoption', 'Expansion', 'Renewal',
    
    // Concise sales stages  
    'Lead', 'Opportunity', 'Customer', 'Champion',
    'Sponsor', 'Buyer', 'User',
    
    // Technical sales
    'POC', 'Pilot', 'Trial', 'Beta',
    
    // Product / Feature-specific stages (this IS a product tool)
    'Requested', 'Triaged', 'Prioritized', 'Planned',
    'Building', 'Shipping', 'Shipped', 'Released',
    'Backlog', 'Roadmap',
  ];

  const stageResults: Record<string, string> = {};
  for (const ds of stages) {
    const { error } = await admin.from('feature_requests').insert({
      organization_id: orgId, account_id: accountId,
      feature_name: `sweep6-${ds}`, category: 'Integration',
      deal_stage: ds, blocker_score: 1,
    });
    if (error) {
      stageResults[ds] = 'REJECTED';
    } else {
      stageResults[ds] = 'ACCEPTED';
      await admin.from('feature_requests').delete()
        .eq('feature_name', `sweep6-${ds}`)
        .eq('organization_id', orgId);
    }
  }

  const accepted = Object.entries(stageResults)
    .filter(([_, v]) => v === 'ACCEPTED')
    .map(([k]) => k);

  return NextResponse.json({
    knownValid: {
      categories: ['Integration', 'Analytics', 'Security', 'Performance'],
      dealStages: ['Prospect', 'Qualified', 'Negotiation'],
    },
    newlyAccepted: accepted,
    totalAccepted: ['Prospect', 'Qualified', 'Negotiation', ...accepted],
    stageResults,
  });
}
