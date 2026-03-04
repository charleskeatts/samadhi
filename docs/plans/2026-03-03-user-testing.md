# User Testing Setup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deploy Clairio to Vercel and auto-seed each new tester's workspace with realistic demo data on signup.

**Architecture:** A new `lib/supabase/seed-demo.ts` exports `seedDemoData(orgId, repId)` which uses the Supabase service role client (bypasses RLS) to insert 5 accounts, 15 feedback items, and 4 feature requests. It's called fire-and-forget from `/api/onboarding/route.ts` immediately after profile creation. A `docs/VERCEL_DEPLOY.md` guide tells Charles exactly how to set env vars and deploy.

**Tech Stack:** Next.js 14 · Supabase (service role admin client via `@supabase/supabase-js`) · Vercel

---

### Task 1: Create the demo seed function

**Files:**
- Create: `lib/supabase/seed-demo.ts`

**Why service role?** The seed runs fire-and-forget after the HTTP response is sent. The cookie store (needed for the session-based server client) may be closed at that point. The service role key bypasses RLS entirely and lets us insert with an explicit `org_id`. It is already available server-side via `SUPABASE_SERVICE_ROLE_KEY`.

**Step 1: Create `lib/supabase/seed-demo.ts` with the full implementation**

```typescript
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

  if (count && count > 0) {
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
    },
    {
      org_id: orgId,
      title: 'Bulk Data Export',
      description: 'Customers want to export feedback and feature data to CSV or connect to BI tools for exec reporting. Two accounts representing $335K ARR have requested this.',
      total_revenue_weight: 335000,
      account_count: 2,
      feedback_ids: byTheme['demo:bulk_export'] ?? [],
      roadmap_status: 'planned',
    },
    {
      org_id: orgId,
      title: 'Slack Notifications',
      description: 'Teams want real-time Slack alerts when feedback is classified or when a requested feature changes roadmap status. Three accounts representing $265K ARR have requested this.',
      total_revenue_weight: 265000,
      account_count: 3,
      feedback_ids: byTheme['demo:slack'] ?? [],
      roadmap_status: 'in_progress',
    },
    {
      org_id: orgId,
      title: 'Custom Reporting Dashboard',
      description: 'A configurable dashboard for sharing product priorities with boards and executives. One account representing $55K ARR has requested this feature.',
      total_revenue_weight: 55000,
      account_count: 1,
      feedback_ids: byTheme['demo:reporting'] ?? [],
      roadmap_status: 'shipped',
    },
  ];

  const { error: frError } = await admin.from('feature_requests').insert(featureRows);
  if (frError) throw new Error(`seed feature_requests: ${frError.message}`);

  console.log(`[seed-demo] ✓ Org ${orgId} seeded: 5 accounts, 15 feedback, 4 features`);
}
```

**Step 2: Verify TypeScript compiles**

```bash
cd /Users/charleskeatts/Projects/samadhi && npx tsc --noEmit
```

Expected: No errors on `lib/supabase/seed-demo.ts`.

**Step 3: Commit**

```bash
git add lib/supabase/seed-demo.ts
git commit -m "feat: add seedDemoData — auto-populate new org with sample accounts, feedback, features"
```

---

### Task 2: Wire seed into the onboarding API route

**Files:**
- Modify: `app/api/onboarding/route.ts` (line 76 — after the profile INSERT succeeds)

**Step 1: Add the import and fire-and-forget call**

In `app/api/onboarding/route.ts`, make exactly two changes:

**Change A** — add import at top of file, after the existing imports:
```typescript
import { seedDemoData } from '@/lib/supabase/seed-demo';
```

**Change B** — after the profile INSERT success check (just before `return NextResponse.json({ success: true, org_id: org.id })`), add:
```typescript
    // Fire-and-forget: seed demo data for new orgs.
    // Non-fatal — failure is logged but does not block the user.
    seedDemoData(org.id, user.id).catch((err) =>
      console.error('[onboarding] seedDemoData failed:', err)
    );
```

The final shape of the relevant section of the file:
```typescript
    if (profileError) {
      console.error('Error creating profile:', profileError);
      await supabase.from('organizations').delete().eq('id', org.id);
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }

    // Fire-and-forget: seed demo data for new orgs.
    // Non-fatal — failure is logged but does not block the user.
    seedDemoData(org.id, user.id).catch((err) =>
      console.error('[onboarding] seedDemoData failed:', err)
    );

    return NextResponse.json({ success: true, org_id: org.id });
```

**Step 2: Run the build**

```bash
cd /Users/charleskeatts/Projects/samadhi && npm run build 2>&1 | tail -20
```

Expected: Build completes. Route `/api/onboarding` listed as `λ` (dynamic). No TypeScript errors.

**Step 3: Commit**

```bash
git add app/api/onboarding/route.ts
git commit -m "feat: seed demo data on new org creation (fire-and-forget)"
```

---

### Task 3: Create Vercel deployment guide for Charles

**Files:**
- Create: `docs/VERCEL_DEPLOY.md`

**Step 1: Write the guide**

```markdown
# Deploying Clairio to Vercel

Follow these steps once. After this, every `git push` to `main` auto-deploys.

---

## Step 1: Connect repo to Vercel

1. Go to https://vercel.com → Log in (or sign up free)
2. Click **"Add New Project"**
3. Import your `samadhi` GitHub/GitLab repo
4. Framework preset: **Next.js** (auto-detected)
5. Leave all build settings as default
6. **Do NOT click Deploy yet** — set env vars first (Step 2)

---

## Step 2: Add environment variables

In your new Vercel project → **Settings → Environment Variables**, add each of these:

| Variable | Where to find it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API → service_role secret key |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` in Terminal, paste the output |

Set each variable for **all environments** (Production, Preview, Development).

---

## Step 3: Deploy

1. Go back to your project overview → click **Deploy**
2. Wait ~2 minutes for the build
3. Vercel gives you a URL like `clairio-abc123.vercel.app`

---

## Step 4: Update Supabase auth redirect URL

Magic links need to know where to send users after email confirmation.

1. Supabase dashboard → **Authentication → URL Configuration**
2. Under **Redirect URLs**, add: `https://your-vercel-url.vercel.app/callback`
3. Also update **Site URL** to: `https://your-vercel-url.vercel.app`
4. Save

---

## Step 5: Test the live URL

1. Open `https://your-vercel-url.vercel.app/signup` in an incognito window
2. Sign up with your own email
3. Click the magic link in your email
4. Complete onboarding → should land on a populated dashboard within a few seconds

---

## Sharing with testers

Send them: `"Sign up at https://your-vercel-url.vercel.app/signup"`

That's it. Each tester gets their own isolated workspace with demo data pre-loaded.

---

## Future: custom domain

If you want `app.clairio.co` instead of the Vercel URL:
- Vercel project → Settings → Domains → Add `app.clairio.co`
- Update your domain DNS with the CNAME Vercel provides
- Update Supabase redirect URLs to use the new domain
```

**Step 2: Commit**

```bash
git add docs/VERCEL_DEPLOY.md
git commit -m "docs: Vercel deployment guide for Charles"
```

---

### Task 4: End-to-end verification

**Goal:** Confirm the seed runs correctly when a new user completes onboarding on the local dev server.

**Step 1: Start the dev server**

The preview server should already be running on port 3000. If not:
```bash
cd /Users/charleskeatts/Projects/samadhi && npm run dev
```

**Step 2: Take a screenshot of the dashboard**

Navigate to `http://localhost:3000` in the preview browser. If redirected to `/login`, that confirms auth guard is working.

**Step 3: Check the build passes cleanly**

```bash
cd /Users/charleskeatts/Projects/samadhi && npm run build 2>&1 | grep -E "(error|Error|✓|λ|Route)"
```

Expected output includes:
```
✓ Compiled successfully
λ /api/onboarding
```
No TypeScript or ESLint errors.

**Step 4: Verify no "Samadhi" strings remain in app source**

```bash
grep -r "Samadhi" /Users/charleskeatts/Projects/samadhi/app --include="*.tsx" --include="*.ts"
```

Expected: no output (zero matches).

**Step 5: Commit verification**

```bash
git log --oneline -5
```

Expected: 3 new commits on top of the Phase B work.

**Step 6: Merge to main**

```bash
git checkout main && git merge phase-b-beta && git checkout phase-b-beta
```

---

## Summary of files changed

| File | Status |
|------|--------|
| `lib/supabase/seed-demo.ts` | CREATE |
| `app/api/onboarding/route.ts` | MODIFY (add import + 3 lines) |
| `docs/VERCEL_DEPLOY.md` | CREATE |
