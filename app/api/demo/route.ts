/**
 * Demo Session API
 * Creates a temporary demo user + org + profile in Supabase,
 * seeds dummy data, and returns session credentials so the
 * client can sign in without a magic link email.
 *
 * NOTE: This route is for beta/MVP demo testing only.
 *
 * ACTUAL DB SCHEMA (as of 2026-03-31):
 *   profiles:         id, organization_id, full_name, role, created_at
 *   organizations:    id, name, slug, created_at
 *   accounts:         id, organization_id, name, arr, crm_source, crm_id, created_at
 *   feature_requests: id, organization_id, account_id, feature_name, category,
 *                     deal_stage, notes, submitted_by, source, confidence,
 *                     confidence_note, created_at, blocker_score
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
      await seedDemoAccounts(admin, org.id, userId);
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
 * Seed demo data directly (avoids the old seed-demo.ts which uses wrong column names).
 * Matches the ACTUAL database schema.
 */
async function seedDemoAccounts(
  admin: any,
  orgId: string,
  userId: string
) {
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
  // Schema: organization_id, account_id, feature_name, category, deal_stage,
  //         notes, submitted_by, source, confidence, confidence_note, blocker_score
  const featureRows = [
    {
      organization_id: orgId,
      account_id: byName['Acme Corp'],
      feature_name: 'Salesforce CRM Integration',
      category: 'Integration',
      deal_stage: 'Renewal',
      notes: 'Team lives in SFDC — manually copying notes is killing adoption. Hard requirement for Q2 renewal.',
      submitted_by: userId,
      source: 'Sales Call',
      confidence: 'High',
      confidence_note: 'VP of Sales confirmed this is a blocker',
      blocker_score: 5,
    },
    {
      organization_id: orgId,
      account_id: byName['Acme Corp'],
      feature_name: 'Bulk Data Export (CSV)',
      category: 'Analytics',
      deal_stage: 'Expansion',
      notes: 'Wants to pull data into BI tool for exec reporting. Would save hours every sprint planning session.',
      submitted_by: userId,
      source: 'Sales Call',
      confidence: 'Medium',
      confidence_note: 'Mentioned in QBR but not a deal blocker',
      blocker_score: 3,
    },
    {
      organization_id: orgId,
      account_id: byName['TechFlow Inc'],
      feature_name: 'Salesforce CRM Integration',
      category: 'Integration',
      deal_stage: 'Renewal',
      notes: 'Salesforce integration is a hard requirement for Q2 renewal conversation.',
      submitted_by: userId,
      source: 'Email',
      confidence: 'High',
      confidence_note: 'CTO stated this directly in renewal email',
      blocker_score: 5,
    },
    {
      organization_id: orgId,
      account_id: byName['TechFlow Inc'],
      feature_name: 'Slack Notifications',
      category: 'Integration',
      deal_stage: 'Active',
      notes: 'Would love Slack notifications when a feature they requested moves to In Progress.',
      submitted_by: userId,
      source: 'Sales Call',
      confidence: 'Medium',
      confidence_note: 'Nice-to-have, not a blocker',
      blocker_score: 2,
    },
    {
      organization_id: orgId,
      account_id: byName['DataStar'],
      feature_name: 'Salesforce CRM Integration',
      category: 'Integration',
      deal_stage: 'At Risk',
      notes: 'If we can\'t connect their CRM by end of quarter, they\'ll look at other tools.',
      submitted_by: userId,
      source: 'Sales Call',
      confidence: 'High',
      confidence_note: 'Churn risk — account manager flagged urgency',
      blocker_score: 5,
    },
    {
      organization_id: orgId,
      account_id: byName['DataStar'],
      feature_name: 'Bulk Data Export (CSV)',
      category: 'Analytics',
      deal_stage: 'Active',
      notes: 'Need bulk export — want to pull data into their BI tool for exec reporting.',
      submitted_by: userId,
      source: 'Support Ticket',
      confidence: 'Medium',
      confidence_note: 'Submitted via support, not directly from decision maker',
      blocker_score: 3,
    },
    {
      organization_id: orgId,
      account_id: byName['BuildBright'],
      feature_name: 'Custom Reporting Dashboard',
      category: 'Analytics',
      deal_stage: 'Expansion',
      notes: 'A configurable dashboard would let them share product priorities with their board.',
      submitted_by: userId,
      source: 'Sales Call',
      confidence: 'Medium',
      confidence_note: 'Board presentation prep drove the request',
      blocker_score: 2,
    },
    {
      organization_id: orgId,
      account_id: byName['BuildBright'],
      feature_name: 'Slack Notifications',
      category: 'Integration',
      deal_stage: 'Active',
      notes: 'Team is fully async and misses email notifications. Slack would be huge for them.',
      submitted_by: userId,
      source: 'Sales Call',
      confidence: 'Low',
      confidence_note: 'Mentioned casually, not a formal request',
      blocker_score: 1,
    },
    {
      organization_id: orgId,
      account_id: byName['SalesCo'],
      feature_name: 'Slack Notifications',
      category: 'Integration',
      deal_stage: 'Active',
      notes: 'PM wants Slack alerts when feedback is classified. Wants to stay in the loop.',
      submitted_by: userId,
      source: 'Email',
      confidence: 'Medium',
      confidence_note: 'PM sent a follow-up email about this',
      blocker_score: 2,
    },
    {
      organization_id: orgId,
      account_id: byName['SalesCo'],
      feature_name: 'HubSpot Integration',
      category: 'Integration',
      deal_stage: 'New Business',
      notes: 'They use HubSpot, not Salesforce. Need an equivalent integration for their CRM.',
      submitted_by: userId,
      source: 'Sales Call',
      confidence: 'High',
      confidence_note: 'Brought up as a requirement during initial demo',
      blocker_score: 4,
    },
  ];

  const { error: frErr } = await admin.from('feature_requests').insert(featureRows);
  if (frErr) throw new Error(`seed feature_requests: ${frErr.message}`);

  console.log(`[demo] seeded ${featureRows.length} feature requests`);
}
