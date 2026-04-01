export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createClient(supabaseUrl, serviceRoleKey);

  // Approach 1: Try to query using the PostgREST schema cache endpoint
  // Supabase exposes /rest/v1/ which is PostgREST
  
  const results: Record<string, any> = {};

  // Approach 2: Try calling a Postgres function if one exists
  // Create a temporary function to read constraint defs
  try {
    // First, try to create an RPC function via SQL
    const createFnRes = await fetch(`${supabaseUrl}/rest/v1/rpc/get_check_constraints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({}),
    });
    results.rpcAttempt = {
      status: createFnRes.status,
      data: await createFnRes.json(),
    };
  } catch (err: any) {
    results.rpcAttempt = { error: err.message };
  }

  // Approach 3: Try to get the OpenAPI spec which may include enum values
  try {
    const openApiRes = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
    });
    const spec = await openApiRes.json();
    // Extract feature_requests column definitions
    const frDef = spec?.definitions?.feature_requests;
    if (frDef) {
      results.openApiFeatureRequests = frDef;
    } else {
      // Try to find it in paths
      results.openApiPaths = Object.keys(spec?.paths || {}).filter(p => p.includes('feature'));
      results.openApiDefinitionKeys = Object.keys(spec?.definitions || {});
    }
  } catch (err: any) {
    results.openApiError = err.message;
  }

  // Approach 4: Additional targeted brute force - focus on what we know
  // The constraint was probably created by Claude Code. Look for patterns
  // that a developer would use. Since "Negotiation" works but "Discovery" doesn't,
  // maybe it's very specific SFDC stage names or completely custom.
  const orgId = (await admin.from('organizations').select('id').limit(1)).data?.[0]?.id;
  const accountId = (await admin.from('accounts').select('id').limit(1)).data?.[0]?.id;

  const moreStages = [
    // Maybe the constraint includes specific product management stages
    'Submitted', 'Under Review', 'Approved', 'In Development', 'Released',
    'Declined', 'Deferred', 'Reviewing', 'Building', 'Testing',
    'Launching', 'Launched', 'Live',
    // Deal-specific (maybe exact match with specific format)
    'New', 'Working', 'Nurturing', 'Qualified', 'Converted',
    'Unqualified', 'Lost', 'Closed',
    // CamelCase/PascalCase deal stages
    'InitialContact', 'QualifyLead', 'SendProposal',
    'HandleObjections', 'CloseTheDeal',
    // Pipeline terms
    'Pipeline', 'Commit', 'Best Case', 'Upside', 'Omitted',
    // Maybe simple status words that match PascalCase exactly
    'Identified', 'Validated', 'Prioritized', 'Scheduled', 'Completed',
    'Assessment', 'Selection', 'Decision', 'Commitment', 'Onboarded',
  ];

  const stageResults: Record<string, string> = {};
  if (orgId && accountId) {
    for (const ds of moreStages) {
      const { error } = await admin.from('feature_requests').insert({
        organization_id: orgId, account_id: accountId,
        feature_name: `sweep4-${ds}`, category: 'Integration',
        deal_stage: ds, blocker_score: 1,
      });
      if (error) {
        stageResults[ds] = 'REJECTED';
      } else {
        stageResults[ds] = 'ACCEPTED';
        await admin.from('feature_requests').delete()
          .eq('feature_name', `sweep4-${ds}`)
          .eq('organization_id', orgId);
      }
    }
  }

  const newAccepted = Object.entries(stageResults)
    .filter(([_, v]) => v === 'ACCEPTED')
    .map(([k]) => k);

  return NextResponse.json({
    knownValid: {
      categories: ['Integration', 'Analytics', 'Security', 'Performance'],
      dealStages: ['Negotiation'],
    },
    results,
    newAccepted,
    stageResults,
  });
}
