/**
 * Demo seed
 * Populates a new org with realistic sample data so testers land on
 * a fully-populated dashboard instead of blank empty states.
 *
 * Called fire-and-forget from /api/onboarding after profile creation.
 * Uses the service-role client so it works even after the HTTP response
 * has been sent (cookie store is closed by then).
 */

import { createClient } from '@supabase/supabase-js';

export async function seedDemoData(orgId: string, repId: string): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[seed-demo] Missing env vars — skipping seed');
    return;
  }

  // Service-role client: bypasses RLS, server-only, never exposed to browser
  const admin = createClient(supabaseUrl, serviceRoleKey);

  // Guard: skip if org already has data (idempotent)
  const { count } = await admin
    .from('accounts')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId);

  if (count !== null && count > 0) {
    console.log('[seed-demo] Org already seeded — skipping');
    return;
  }

  // ── 1. Accounts ──────────────────────────────────────────────────────────
  const { data: accounts, error: accountsError } = await admin
    .from('accounts')
    .insert([
      { org_id: orgId, name: 'Acme Corp',    arr: 240000, crm_source: 'manual' },
      { org_id: orgId, name: 'TechFlow Inc', arr: 180000, crm_source: 'manual' },
      { org_id: orgId, name: 'DataStar',     arr:  95000, crm_source: 'manual' },
      { org_id: orgId, name: 'BuildBright',  arr:  55000, crm_source: 'manual' },
      { org_id: orgId, name: 'SalesCo',      arr:  30000, crm_source: 'manual' },
    ])
    .select('id, name');

  if (accountsError || !accounts) {
    throw new Error(`seed accounts: ${accountsError?.message}`);
  }

  const byName = Object.fromEntries(accounts.map((a) => [a.name, a.id]));

  // ── 2. Feedback ───────────────────────────────────────────────────────────
  // crm_note_id is repurposed as a theme tag (demo:*) so we can reliably
  // map feedback IDs → feature requests without depending on insert order.
  const feedbackRows = [
    // Acme Corp — $240K
    { org_id: orgId, account_id: byName['Acme Corp'],    rep_id: repId, crm_note_id: 'demo:salesforce',   category: 'feature_request',  sentiment: 'negative', urgency_score: 9,  revenue_weight: 240000, status: 'reviewed', ai_processed: true, raw_text: "We need a Salesforce sync — our team lives in SFDC and manually copying notes is killing adoption." },
    { org_id: orgId, account_id: byName['Acme Corp'],    rep_id: repId, crm_note_id: 'demo:bulk_export',  category: 'feature_request',  sentiment: 'neutral',  urgency_score: 7,  revenue_weight: 240000, status: 'reviewed', ai_processed: true, raw_text: "Bulk CSV export would save us hours every sprint planning session." },
    { org_id: orgId, account_id: byName['Acme Corp'],    rep_id: repId, crm_note_id: null,                category: 'competitive_intel', sentiment: 'negative', urgency_score: 8,  revenue_weight: 240000, status: 'reviewed', ai_processed: true, raw_text: "Gong just added a product backlog feature — our VP keeps asking why Clairio doesn't have that." },
    // TechFlow Inc — $180K
    { org_id: orgId, account_id: byName['TechFlow Inc'], rep_id: repId, crm_note_id: 'demo:salesforce',   category: 'feature_request',  sentiment: 'negative', urgency_score: 10, revenue_weight: 180000, status: 'reviewed', ai_processed: true, raw_text: "Salesforce integration is a hard requirement for our Q2 renewal conversation." },
    { org_id: orgId, account_id: byName['TechFlow Inc'], rep_id: repId, crm_note_id: 'demo:slack',        category: 'feature_request',  sentiment: 'positive', urgency_score: 6,  revenue_weight: 180000, status: 'reviewed', ai_processed: true, raw_text: "Would love Slack notifications when a feature we requested moves to In Progress." },
    { org_id: orgId, account_id: byName['TechFlow Inc'], rep_id: repId, crm_note_id: null,                category: 'bug_report',       sentiment: 'negative', urgency_score: 7,  revenue_weight: 180000, status: 'reviewed', ai_processed: true, raw_text: "The feedback form sometimes submits twice — we get duplicate entries." },
    // DataStar — $95K
    { org_id: orgId, account_id: byName['DataStar'],     rep_id: repId, crm_note_id: 'demo:salesforce',   category: 'churn_risk',       sentiment: 'negative', urgency_score: 10, revenue_weight:  95000, status: 'reviewed', ai_processed: true, raw_text: "If we can't connect our CRM by end of quarter, we'll have to look at other tools." },
    { org_id: orgId, account_id: byName['DataStar'],     rep_id: repId, crm_note_id: 'demo:bulk_export',  category: 'feature_request',  sentiment: 'neutral',  urgency_score: 8,  revenue_weight:  95000, status: 'reviewed', ai_processed: true, raw_text: "Need bulk export — we want to pull data into our BI tool for exec reporting." },
    { org_id: orgId, account_id: byName['DataStar'],     rep_id: repId, crm_note_id: null,                category: 'pricing_concern',  sentiment: 'negative', urgency_score: 5,  revenue_weight:  95000, status: 'reviewed', ai_processed: true, raw_text: "At our current usage we'd need 8 seats — that's $280/mo which is steep for a pilot." },
    // BuildBright — $55K
    { org_id: orgId, account_id: byName['BuildBright'],  rep_id: repId, crm_note_id: 'demo:reporting',    category: 'feature_request',  sentiment: 'positive', urgency_score: 6,  revenue_weight:  55000, status: 'reviewed', ai_processed: true, raw_text: "A custom reporting dashboard would let us share product priorities with our board." },
    { org_id: orgId, account_id: byName['BuildBright'],  rep_id: repId, crm_note_id: 'demo:slack',        category: 'feature_request',  sentiment: 'positive', urgency_score: 5,  revenue_weight:  55000, status: 'reviewed', ai_processed: true, raw_text: "Slack notifications would be huge — our team is async and misses email." },
    { org_id: orgId, account_id: byName['BuildBright'],  rep_id: repId, crm_note_id: null,                category: 'general',          sentiment: 'positive', urgency_score: 4,  revenue_weight:  55000, status: 'reviewed', ai_processed: true, raw_text: "Overall loving the revenue weighting concept — nothing else does this." },
    // SalesCo — $30K
    { org_id: orgId, account_id: byName['SalesCo'],      rep_id: repId, crm_note_id: 'demo:slack',        category: 'feature_request',  sentiment: 'positive', urgency_score: 6,  revenue_weight:  30000, status: 'reviewed', ai_processed: true, raw_text: "Can we get Slack alerts when feedback is classified? Our PM wants to stay in the loop." },
    { org_id: orgId, account_id: byName['SalesCo'],      rep_id: repId, crm_note_id: null,                category: 'general',          sentiment: 'positive', urgency_score: 3,  revenue_weight:  30000, status: 'reviewed', ai_processed: true, raw_text: "Dashboard loads fast, the team is happy with it so far." },
    { org_id: orgId, account_id: byName['SalesCo'],      rep_id: repId, crm_note_id: null,                category: 'competitive_intel', sentiment: 'positive', urgency_score: 4,  revenue_weight:  30000, status: 'reviewed', ai_processed: true, raw_text: "Productboard doesn't weight by revenue — that's your biggest differentiator, lean into it." },
  ];

  const { error: feedbackError } = await admin.from('feedback').insert(feedbackRows);
  if (feedbackError) throw new Error(`seed feedback: ${feedbackError.message}`);

  // Fetch feedback IDs grouped by theme tag
  const { data: taggedFeedback, error: fetchError } = await admin
    .from('feedback')
    .select('id, crm_note_id')
    .eq('org_id', orgId)
    .like('crm_note_id', 'demo:%');

  if (fetchError || !taggedFeedback) {
    throw new Error(`seed fetch tags: ${fetchError?.message}`);
  }

  const byTheme: Record<string, string[]> = {};
  for (const row of taggedFeedback) {
    const tag = row.crm_note_id as string;
    if (!byTheme[tag]) byTheme[tag] = [];
    byTheme[tag].push(row.id);
  }

  // ── 3. Feature requests ───────────────────────────────────────────────────
  const featureRows = [
    {
      org_id: orgId,
      title: 'Salesforce CRM Integration',
      description: 'Sales teams need a native Salesforce sync to eliminate manual note copying. Three accounts representing $515K ARR have flagged this as a requirement for renewal.',
      total_revenue_weight: 515000,
      account_count: 3,
      feedback_ids: byTheme['demo:salesforce'] ?? [],
      roadmap_status: 'backlog',
      category: 'Integration',
      blocker_score: 5,
    },
    {
      org_id: orgId,
      title: 'Bulk Data Export',
      description: 'Customers want to export feedback and feature data to CSV or connect to BI tools for exec reporting. Two accounts representing $335K ARR have requested this.',
      total_revenue_weight: 335000,
      account_count: 2,
      feedback_ids: byTheme['demo:bulk_export'] ?? [],
      roadmap_status: 'planned',
      category: 'Analytics',
      blocker_score: 4,
    },
    {
      org_id: orgId,
      title: 'Slack Notifications',
      description: 'Teams want real-time Slack alerts when feedback is classified or when a requested feature changes roadmap status. Three accounts representing $265K ARR have requested this.',
      total_revenue_weight: 265000,
      account_count: 3,
      feedback_ids: byTheme['demo:slack'] ?? [],
      roadmap_status: 'in_progress',
      category: 'Integration',
      blocker_score: 3,
    },
    {
      org_id: orgId,
      title: 'Custom Reporting Dashboard',
      description: 'A configurable dashboard for sharing product priorities with boards and executives. One account representing $55K ARR has requested this feature.',
      total_revenue_weight: 55000,
      account_count: 1,
      feedback_ids: byTheme['demo:reporting'] ?? [],
      roadmap_status: 'shipped',
      category: 'Analytics',
      blocker_score: 2,
    },
  ];

  const { error: frError } = await admin.from('feature_requests').insert(featureRows);
  if (frError) throw new Error(`seed feature_requests: ${frError.message}`);

  console.log(
    `[seed-demo] ✓ Org ${orgId} seeded: ${accounts.length} accounts, ` +
    `${feedbackRows.length} feedback, ${featureRows.length} features`
  );
}
