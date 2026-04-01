/**
 * Demo seed
 * Populates a new org with realistic feature requests so testers
 * land on a fully-populated dashboard instead of blank empty states.
 *
 * Uses actual DB schema: organization_id, feature_name, deal_stage, notes, etc.
 * No feedback table — feature requests are the core entity.
 */

import { createClient } from '@supabase/supabase-js';

export async function seedDemoData(orgId: string, userId: string): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[seed-demo] Missing env vars — skipping seed');
    return;
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  // Guard: skip if org already has data (idempotent)
  const { count } = await admin
    .from('accounts')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId);

  if (count !== null && count > 0) {
    console.log('[seed-demo] Org already seeded — skipping');
    return;
  }

  // ── 1. Accounts ────────────────────────────────────────────────────────────
  const { data: accounts, error: accountsError } = await admin
    .from('accounts')
    .insert([
      { organization_id: orgId, name: 'Acme Corp',    arr: 240000, crm_source: 'manual' },
      { organization_id: orgId, name: 'TechFlow Inc', arr: 180000, crm_source: 'manual' },
      { organization_id: orgId, name: 'DataStar',     arr:  95000, crm_source: 'manual' },
      { organization_id: orgId, name: 'BuildBright',  arr:  55000, crm_source: 'manual' },
      { organization_id: orgId, name: 'SalesCo',      arr:  30000, crm_source: 'manual' },
    ])
    .select('id, name');

  if (accountsError || !accounts) {
    throw new Error(`seed accounts: ${accountsError?.message}`);
  }

  const byName = Object.fromEntries(accounts.map((a) => [a.name, a.id]));

  // ── 2. Feature Requests ────────────────────────────────────────────────────
  const featureRows = [
    {
      organization_id: orgId,
      account_id: byName['Acme Corp'],
      feature_name: 'Salesforce CRM Integration',
      category: 'Integration',
      deal_stage: 'backlog',
      notes: 'We need a Salesforce sync — our team lives in SFDC and manually copying notes is killing adoption. Hard requirement for Q2 renewal.',
      submitted_by: userId,
      source: 'Sales call',
      confidence: 'high',
      blocker_score: 5,
    },
    {
      organization_id: orgId,
      account_id: byName['TechFlow Inc'],
      feature_name: 'Salesforce CRM Integration',
      category: 'Integration',
      deal_stage: 'backlog',
      notes: 'Salesforce integration is a hard requirement for our Q2 renewal conversation.',
      submitted_by: userId,
      source: 'Sales call',
      confidence: 'high',
      blocker_score: 5,
    },
    {
      organization_id: orgId,
      account_id: byName['DataStar'],
      feature_name: 'Salesforce CRM Integration',
      category: 'Integration',
      deal_stage: 'backlog',
      notes: 'If we can\'t connect our CRM by end of quarter, we\'ll have to look at other tools.',
      submitted_by: userId,
      source: 'Email',
      confidence: 'high',
      blocker_score: 5,
    },
    {
      organization_id: orgId,
      account_id: byName['Acme Corp'],
      feature_name: 'Bulk Data Export',
      category: 'Analytics',
      deal_stage: 'planned',
      notes: 'Bulk CSV export would save us hours every sprint planning session. We want to pull data into our BI tool for exec reporting.',
      submitted_by: userId,
      source: 'Sales call',
      confidence: 'high',
      blocker_score: 4,
    },
    {
      organization_id: orgId,
      account_id: byName['DataStar'],
      feature_name: 'Bulk Data Export',
      category: 'Analytics',
      deal_stage: 'planned',
      notes: 'Need bulk export for exec reporting. Looking at BI integration.',
      submitted_by: userId,
      source: 'Support ticket',
      confidence: 'medium',
      blocker_score: 4,
    },
    {
      organization_id: orgId,
      account_id: byName['TechFlow Inc'],
      feature_name: 'Slack Notifications',
      category: 'Integration',
      deal_stage: 'in_progress',
      notes: 'Would love Slack notifications when a feature we requested moves to In Progress.',
      submitted_by: userId,
      source: 'Sales call',
      confidence: 'high',
      blocker_score: 3,
    },
    {
      organization_id: orgId,
      account_id: byName['BuildBright'],
      feature_name: 'Slack Notifications',
      category: 'Integration',
      deal_stage: 'in_progress',
      notes: 'Slack notifications would be huge — our team is async and misses email.',
      submitted_by: userId,
      source: 'Sales call',
      confidence: 'high',
      blocker_score: 3,
    },
    {
      organization_id: orgId,
      account_id: byName['SalesCo'],
      feature_name: 'Slack Notifications',
      category: 'Integration',
      deal_stage: 'in_progress',
      notes: 'Can we get Slack alerts when feedback is classified? Our PM wants to stay in the loop.',
      submitted_by: userId,
      source: 'Email',
      confidence: 'medium',
      blocker_score: 3,
    },
    {
      organization_id: orgId,
      account_id: byName['BuildBright'],
      feature_name: 'Custom Reporting Dashboard',
      category: 'Analytics',
      deal_stage: 'shipped',
      notes: 'A configurable dashboard would let us share product priorities with our board.',
      submitted_by: userId,
      source: 'Sales call',
      confidence: 'medium',
      blocker_score: 2,
    },
    {
      organization_id: orgId,
      account_id: byName['SalesCo'],
      feature_name: 'Revenue-Weighted Backlog View',
      category: 'Core Product',
      deal_stage: 'backlog',
      notes: 'Productboard doesn\'t weight by revenue — that\'s your biggest differentiator, lean into it.',
      submitted_by: userId,
      source: 'Sales call',
      confidence: 'high',
      blocker_score: 4,
    },
    {
      organization_id: orgId,
      account_id: byName['TechFlow Inc'],
      feature_name: 'Duplicate Feedback Detection',
      category: 'Core Product',
      deal_stage: 'backlog',
      notes: 'The feedback form sometimes submits twice — we get duplicate entries. Need deduplication.',
      submitted_by: userId,
      source: 'Support ticket',
      confidence: 'high',
      blocker_score: 3,
    },
    {
      organization_id: orgId,
      account_id: byName['Acme Corp'],
      feature_name: 'Gong Integration',
      category: 'Integration',
      deal_stage: 'backlog',
      notes: 'Gong just added a product backlog feature. Our VP asks why Clairio can\'t pull from Gong calls automatically.',
      submitted_by: userId,
      source: 'Sales call',
      confidence: 'medium',
      blocker_score: 3,
    },
  ];

  const { error: frError } = await admin.from('feature_requests').insert(featureRows);
  if (frError) throw new Error(`seed feature_requests: ${frError.message}`);

  console.log(
    `[seed-demo] ✓ Org ${orgId} seeded: ${accounts.length} accounts, ${featureRows.length} feature requests`
  );
}
