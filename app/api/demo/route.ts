/**
 * Demo Session API
 * Creates a temporary demo user + org + profile in Supabase,
 * seeds dummy data, and returns session credentials so the
 * client can sign in without a magic link email.
 *
 * NOTE: This route is for beta/MVP demo testing only.
 *
 * ACTUAL DB SCHEMA (as of 2026-04-01):
 *   profiles:         id, organization_id, full_name, role, created_at
 *   organizations:    id, name, slug, created_at
 *   accounts:         id, organization_id, name, arr, crm_source, crm_id, created_at
 *   feature_requests: id, organization_id, account_id, feature_name, category,
 *                     deal_stage, notes, submitted_by, source, confidence,
 *                     confidence_note, created_at, blocker_score
 *
 * VALID ENUMS:
 *   category:   Integration | Analytics | Security | Performance
 *   deal_stage: Prospect | Qualified | Negotiation
 */

import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Server misconfigured — missing Supabase keys' },
      { status: 500 }
    );
  }

  const admin = createServiceClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // 1. Generate unique demo identity
    const demoId = crypto.randomUUID().slice(0, 8);
    const email = `demo-${demoId}@clairio-demo.local`;
    const password = `demo-${crypto.randomUUID()}`;
    const companyName = `Demo Co ${demoId.toUpperCase()}`;

    // 2. Create user via Admin API (auto-confirms, no email sent)
    const { data: userData, error: userError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { demo: true, full_name: 'Demo User' },
    });

    if (userError || !userData.user) {
      console.error('[demo] createUser failed:', userError?.message);
      return NextResponse.json(
        { error: `Failed to create demo user: ${userError?.message || 'unknown'}` },
        { status: 500 }
      );
    }

    const userId = userData.user.id;
    console.log(`[demo] created user ${userId} (${email})`);

    // 3. Create org
    const slug = `demo-${demoId}`;
    const { data: org, error: orgError } = await admin
      .from('organizations')
      .insert({ name: companyName, slug })
      .select('id')
      .single();

    if (orgError || !org) {
      console.error('[demo] org creation failed:', orgError?.message);
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: `Failed to create demo org: ${orgError?.message || 'unknown'}` },
        { status: 500 }
      );
    }

    console.log(`[demo] created org ${org.id}`);

    // 4. Create profile — use upsert to handle the case where a DB trigger
    //    or previous failed run already created a profile for this user ID.
    const { error: profileError } = await admin
      .from('profiles')
      .upsert(
        {
          id: userId,
          organization_id: org.id,
          full_name: 'Demo User',
          role: 'admin',
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      console.error('[demo] profile upsert failed:', profileError.message);
      await admin.from('organizations').delete().eq('id', org.id);
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: `Failed to create demo profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    console.log(`[demo] created/updated profile for user ${userId}`);

    // 5. Seed demo data
    let seedError: string | null = null;
    try {
      await seedDemoData(admin, org.id, userId);
    } catch (err: any) {
      console.error('[demo] seed failed (non-fatal):', err);
      seedError = err?.message || String(err);
    }

    // 6. Return credentials for client-side sign-in
    return NextResponse.json({ email, password, orgName: companyName, seedError });
  } catch (err) {
    console.error('[demo] unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Seed demo data with realistic feature requests.
 * Uses only VALID enum values:
 *   category:   Integration | Analytics | Security | Performance
 *   deal_stage: Prospect | Qualified | Negotiation
 */
async function seedDemoData(admin: any, orgId: string, userId: string) {
  // ── Accounts ──
  const { data: accounts, error: accErr } = await admin
    .from('accounts')
    .insert([
      { organization_id: orgId, name: 'Acme Corp',    arr: 240000, crm_source: 'manual' },
      { organization_id: orgId, name: 'TechFlow Inc', arr: 180000, crm_source: 'manual' },
      { organization_id: orgId, name: 'DataStar',     arr:  95000, crm_source: 'manual' },
      { organization_id: orgId, name: 'BuildBright',  arr:  55000, crm_source: 'manual' },
      { organization_id: orgId, name: 'SalesCo',      arr:  30000, crm_source: 'manual' },
    ])
    .select('id, name');

  if (accErr || !accounts) {
    throw new Error(`seed accounts: ${accErr?.message}`);
  }

  const byName = Object.fromEntries(accounts.map((a: any) => [a.name, a.id]));
  console.log(`[demo] seeded ${accounts.length} accounts`);

  // ── Feature Requests ──
  const featureRows = [
    {
      organization_id: orgId,
      account_id: byName['Acme Corp'],
      feature_name: 'Salesforce CRM Integration',
      category: 'Integration',
      deal_stage: 'Negotiation',
      notes: 'Team lives in SFDC — manually copying notes is killing adoption. Hard requirement for Q2 renewal. $240K ARR at risk.',
      submitted_by: userId,
      source: 'manual',
      confidence: 1,
      confidence_note: 'VP of Sales confirmed this is a deal blocker',
      blocker_score: 5,
    },
    {
      organization_id: orgId,
      account_id: byName['Acme Corp'],
      feature_name: 'Bulk Data Export (CSV)',
      category: 'Analytics',
      deal_stage: 'Qualified',
      notes: 'Wants to pull data into BI tool for exec reporting. Would save hours every sprint planning session.',
      submitted_by: userId,
      source: 'manual',
      confidence: 1,
      confidence_note: 'Mentioned in QBR but not a deal blocker',
      blocker_score: 3,
    },
    {
      organization_id: orgId,
      account_id: byName['TechFlow Inc'],
      feature_name: 'Salesforce CRM Integration',
      category: 'Integration',
      deal_stage: 'Negotiation',
      notes: 'CRM integration is a hard requirement for Q2 renewal. $180K ARR account — CTO stated this directly.',
      submitted_by: userId,
      source: 'manual',
      confidence: 1,
      confidence_note: 'CTO stated this directly in renewal email',
      blocker_score: 5,
    },
    {
      organization_id: orgId,
      account_id: byName['TechFlow Inc'],
      feature_name: 'Slack Notifications',
      category: 'Integration',
      deal_stage: 'Prospect',
      notes: 'Would love Slack notifications when a feature they requested moves to In Progress. Team is fully async.',
      submitted_by: userId,
      source: 'manual',
      confidence: 1,
      confidence_note: 'Nice-to-have, not a blocker',
      blocker_score: 2,
    },
    {
      organization_id: orgId,
      account_id: byName['DataStar'],
      feature_name: 'Salesforce CRM Integration',
      category: 'Integration',
      deal_stage: 'Negotiation',
      notes: 'If we can\'t connect their CRM by end of quarter, they\'ll look at other tools. $95K at risk — churn threat.',
      submitted_by: userId,
      source: 'manual',
      confidence: 1,
      confidence_note: 'Account manager flagged explicit churn risk',
      blocker_score: 5,
    },
    {
      organization_id: orgId,
      account_id: byName['DataStar'],
      feature_name: 'Bulk Data Export (CSV)',
      category: 'Analytics',
      deal_stage: 'Qualified',
      notes: 'Need bulk export to pull data into their BI tool for exec reporting. Requested twice in the last month.',
      submitted_by: userId,
      source: 'manual',
      confidence: 1,
      confidence_note: 'Submitted via support, repeated request',
      blocker_score: 3,
    },
    {
      organization_id: orgId,
      account_id: byName['BuildBright'],
      feature_name: 'Custom Reporting Dashboard',
      category: 'Analytics',
      deal_stage: 'Prospect',
      notes: 'A configurable dashboard would let them share product priorities with their board. $55K account.',
      submitted_by: userId,
      source: 'manual',
      confidence: 1,
      confidence_note: 'Board presentation prep drove the request',
      blocker_score: 2,
    },
    {
      organization_id: orgId,
      account_id: byName['BuildBright'],
      feature_name: 'SSO / SAML Integration',
      category: 'Security',
      deal_stage: 'Qualified',
      notes: 'Security team requires SSO before they can approve the tool for broader org rollout.',
      submitted_by: userId,
      source: 'manual',
      confidence: 1,
      confidence_note: 'Came from security review, not sales conversation',
      blocker_score: 4,
    },
    {
      organization_id: orgId,
      account_id: byName['SalesCo'],
      feature_name: 'HubSpot Integration',
      category: 'Integration',
      deal_stage: 'Qualified',
      notes: 'They use HubSpot, not Salesforce. Need an equivalent CRM integration for their workflow.',
      submitted_by: userId,
      source: 'manual',
      confidence: 1,
      confidence_note: 'Brought up as a requirement during initial demo',
      blocker_score: 4,
    },
    {
      organization_id: orgId,
      account_id: byName['SalesCo'],
      feature_name: 'Dashboard Load Time Optimization',
      category: 'Performance',
      deal_stage: 'Prospect',
      notes: 'PM noticed the dashboard takes 3-4 seconds to load on slow connections. Wants sub-second loads.',
      submitted_by: userId,
      source: 'manual',
      confidence: 1,
      confidence_note: 'PM mentioned casually, not a formal request',
      blocker_score: 1,
    },
  ];

  const { data: frData, error: frErr } = await admin
    .from('feature_requests')
    .insert(featureRows)
    .select('id');

  if (frErr) throw new Error(`seed feature_requests: ${frErr.message}`);
  if (!frData || frData.length === 0) throw new Error(`seed feature_requests: insert returned 0 rows`);

  console.log(`[demo] seeded ${frData.length} feature requests`);
}
