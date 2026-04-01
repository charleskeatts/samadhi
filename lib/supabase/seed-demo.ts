/**
 * Demo seed
 * Populates a new org with realistic sample data so testers land on
 * a fully-populated dashboard instead of blank empty states.
 *
 * Uses the ACTUAL DB schema:
 *   accounts:         id, organization_id, name, arr, crm_source, crm_id, created_at
 *   feature_requests: id, organization_id, account_id, feature_name, category,
 *                     deal_stage, notes, submitted_by, source, confidence,
 *                     confidence_note, blocker_score, created_at
 *
 * NOTE: There is NO "feedback" table in the database.
 */

import { createClient } from '@supabase/supabase-js';

export async function seedDemoData(orgId: string, _repId: string): Promise<void> {
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

  // ── 1. Accounts ──────────────────────────────────────────────────────────
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

  // ── 2. Feature Requests ─────────────────────────────────────────────────
  const featureRows = [
    {
      organization_id: orgId,
      account_id: byName['Acme Corp'],
      feature_name: 'Salesforce CRM Integration',
      category: 'Integration',
      deal_stage: 'negotiation',
      notes: 'Sales teams need a native Salesforce sync to eliminate manual note copying. $240K ARR at risk — renewal conversation contingent on this.',
      submitted_by: 'Demo Seed',
      source: 'Salesforce Notes',
      confidence: 5,
      confidence_note: 'Mentioned in 3 calls',
      blocker_score: 5,
    },
    {
      organization_id: orgId,
      account_id: byName['TechFlow Inc'],
      feature_name: 'Salesforce Integration (TechFlow)',
      category: 'Integration',
      deal_stage: 'evaluation',
      notes: 'Salesforce integration is a hard requirement for Q2 renewal. $180K ARR account.',
      submitted_by: 'Demo Seed',
      source: 'Sales Call',
      confidence: 5,
      confidence_note: 'Hard requirement per CRO',
      blocker_score: 5,
    },
    {
      organization_id: orgId,
      account_id: byName['DataStar'],
      feature_name: 'Bulk Data Export to CSV',
      category: 'Analytics',
      deal_stage: 'evaluation',
      notes: 'Need bulk export — want to pull data into BI tool for exec reporting. $95K ARR.',
      submitted_by: 'Demo Seed',
      source: 'Support Ticket',
      confidence: 3,
      confidence_note: 'Requested twice in last month',
      blocker_score: 4,
    },
    {
      organization_id: orgId,
      account_id: byName['Acme Corp'],
      feature_name: 'Bulk CSV Export',
      category: 'Analytics',
      deal_stage: 'negotiation',
      notes: 'Bulk CSV export would save hours every sprint planning session.',
      submitted_by: 'Demo Seed',
      source: 'Slack',
      confidence: 3,
      confidence_note: null,
      blocker_score: 4,
    },
    {
      organization_id: orgId,
      account_id: byName['TechFlow Inc'],
      feature_name: 'Slack Notifications for Feature Updates',
      category: 'Integration',
      deal_stage: 'closed_won',
      notes: 'Would love Slack notifications when a feature moves to In Progress. Async team misses email.',
      submitted_by: 'Demo Seed',
      source: 'Slack',
      confidence: 3,
      confidence_note: null,
      blocker_score: 3,
    },
    {
      organization_id: orgId,
      account_id: byName['BuildBright'],
      feature_name: 'Custom Reporting Dashboard',
      category: 'Analytics',
      deal_stage: 'closed_won',
      notes: 'A configurable dashboard for sharing product priorities with the board.',
      submitted_by: 'Demo Seed',
      source: 'Gong Calls',
      confidence: 1,
      confidence_note: 'Nice-to-have, not blocking',
      blocker_score: 2,
    },
    {
      organization_id: orgId,
      account_id: byName['SalesCo'],
      feature_name: 'Slack Alerts on Classification',
      category: 'Integration',
      deal_stage: 'discovery',
      notes: 'PM wants Slack alerts when feedback is classified. $30K ARR.',
      submitted_by: 'Demo Seed',
      source: 'Sales Call',
      confidence: 1,
      confidence_note: null,
      blocker_score: 2,
    },
    {
      organization_id: orgId,
      account_id: byName['DataStar'],
      feature_name: 'CRM Connection (Churn Risk)',
      category: 'Integration',
      deal_stage: 'negotiation',
      notes: 'If we can\'t connect our CRM by end of quarter, we\'ll have to look at other tools. $95K at risk.',
      submitted_by: 'Demo Seed',
      source: 'Sales Call',
      confidence: 5,
      confidence_note: 'Explicit churn threat',
      blocker_score: 5,
    },
  ];

  const { error: frError } = await admin.from('feature_requests').insert(featureRows);
  if (frError) throw new Error(`seed feature_requests: ${frError.message}`);

  console.log(
    `[seed-demo] ✓ Org ${orgId} seeded: ${accounts.length} accounts, ${featureRows.length} feature requests`
  );
}
