# User Testing Setup — Design Doc
**Date:** 2026-03-03
**Branch:** phase-c-user-testing

---

## Goal

Enable potential customers to self-serve sign up, complete onboarding, and immediately land on a populated Clairio workspace — without Charles doing anything per tester.

## Approach: Auto-seed on onboarding (Option B)

Two parts:
1. **Deploy to Vercel** — get the app live at a public URL
2. **Auto-seed demo data** — plant realistic sample data into each new org immediately after onboarding completes

---

## Part 1: Vercel Deployment

**What gets built:**
- Verify `vercel.json` is present (it is — cron job config already there)
- Add a deployment checklist doc for Charles to follow manually (env vars must be entered by Charles in Vercel dashboard — they contain real API keys)
- Confirm build passes (`npm run build` already passing)

**Environment variables Charles must set in Vercel dashboard (Settings → Environment Variables):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `NEXTAUTH_SECRET`

**Deploy trigger:** Push `main` → Vercel auto-deploys → live at `clairio.vercel.app` (or custom domain)

---

## Part 2: Auto-seed Demo Data

### New file: `lib/supabase/seed-demo.ts`

A single exported async function `seedDemoData(orgId: string, repId: string)` called from `/api/onboarding/route.ts` after org + profile creation.

**Guard:** Checks if org already has accounts — skips seed if count > 0. Safe to call multiple times.

### Seed content

**5 customer accounts:**
| Name | ARR |
|------|-----|
| Acme Corp | $240,000 |
| TechFlow Inc | $180,000 |
| DataStar | $95,000 |
| BuildBright | $55,000 |
| SalesCo | $30,000 |

**15 feedback items** (3 per account, spread across categories):

| Account | Category | Text excerpt | Sentiment | Urgency |
|---------|----------|-------------|-----------|---------|
| Acme Corp | feature_request | "We need a Salesforce sync — our team lives in SFDC and manually copying notes is killing adoption" | negative | 9 |
| Acme Corp | feature_request | "Bulk CSV export would save us hours every sprint planning session" | neutral | 7 |
| Acme Corp | competitive_intel | "Gong just added a product backlog feature — our VP keeps asking why Clairio doesn't have that" | negative | 8 |
| TechFlow Inc | feature_request | "Salesforce integration is a hard requirement for our Q2 renewal conversation" | negative | 10 |
| TechFlow Inc | feature_request | "Would love Slack notifications when a feature we requested moves to In Progress" | positive | 6 |
| TechFlow Inc | bug_report | "The feedback form sometimes submits twice — we get duplicate entries" | negative | 7 |
| DataStar | churn_risk | "If we can't connect our CRM by end of quarter, we'll have to look at other tools" | negative | 10 |
| DataStar | feature_request | "Need bulk export — we want to pull data into our BI tool for exec reporting" | neutral | 8 |
| DataStar | pricing_concern | "At our current usage we'd need 8 seats — that's $280/mo which is steep for a pilot" | negative | 5 |
| BuildBright | feature_request | "A custom reporting dashboard would let us share product priorities with our board" | positive | 6 |
| BuildBright | feature_request | "Slack notifications would be huge — our team is async and misses email" | positive | 5 |
| BuildBright | general | "Overall loving the revenue weighting concept — nothing else does this" | positive | 4 |
| SalesCo | feature_request | "Can we get Slack alerts when feedback is classified? Our PM wants to stay in the loop" | positive | 6 |
| SalesCo | general | "Dashboard loads fast, the team is happy with it so far" | positive | 3 |
| SalesCo | competitive_intel | "Productboard doesn't weight by revenue — that's your biggest differentiator, lean into it" | positive | 4 |

All feedback: `ai_processed: true`, `status: 'reviewed'`, `revenue_weight` = account ARR.

**4 feature requests:**
| Title | Total ARR | Accounts | Status |
|-------|-----------|----------|--------|
| Salesforce CRM Integration | $515,000 | 3 (Acme, TechFlow, DataStar) | backlog |
| Bulk Data Export | $270,000 | 2 (Acme, DataStar) | planned |
| Slack Notifications | $265,000 | 3 (TechFlow, BuildBright, SalesCo) | in_progress |
| Custom Reporting Dashboard | $55,000 | 1 (BuildBright) | shipped |

Each feature_request includes a 2-sentence description and links to the relevant feedback_ids.

### Integration point

In `/api/onboarding/route.ts`, after the profile INSERT succeeds:
```ts
// Fire-and-forget — don't block the response
seedDemoData(org.id, profile.id).catch(err =>
  console.error('[onboarding] seed failed:', err)
);
```

Seed failure is non-fatal — user still gets their org and can use the app.

---

## Tester Experience (end-to-end)

1. Charles sends: `"Sign up at https://clairio.vercel.app/signup"`
2. Tester enters name, email, role → receives magic link email
3. Clicks magic link → `/onboarding` → enters company name → Continue
4. `/api/onboarding` creates org + profile → triggers `seedDemoData` in background
5. Tester redirected to `/dashboard` — KPIs populated, feedback table full, features ranked
6. Tester clicks through freely — no instructions needed

---

## Files Changed

| File | Change |
|------|--------|
| `lib/supabase/seed-demo.ts` | NEW — `seedDemoData()` function |
| `app/api/onboarding/route.ts` | ADD — fire-and-forget `seedDemoData` call after profile creation |
| `docs/VERCEL_DEPLOY.md` | NEW — step-by-step instructions for Charles to set env vars and deploy |

---

## Out of Scope

- Custom domain (clairio.co) — can be added after initial deploy
- Email customization (magic link email branding) — Supabase default is fine for testing
- Analytics / session recording — not needed for this round of testing
