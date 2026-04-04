# CLAUDE.md — Clairio (samadhi repo)

**Product:** Clairio — revenue-weighted product intelligence platform
**Legal entity:** Samadi Consulting LLC
**Founder:** Charles Keatts (non-technical — explain technical decisions clearly)
**Stage:** Pre-revenue, pre-seed, bootstrapped. MVP in active development.

---

## Code Quality Rules (Anti-AI-Tell Guidelines)

These rules apply to **all UI work** across every page and component:

- **No emojis in UI.** Use icon libraries only (lucide-react is already installed). Emojis are an immediate AI tell.
- **No filler copy.** Avoid phrases like "Get started", "No items yet", "Something went wrong" with no context. Write specific, product-aware microcopy.
- **No generic placeholder states.** Empty states should be purposeful — explain what the user needs to do and why, not just that the list is empty.
- **No rainbow badge colors.** Stick to the design system palette. Avoid using Tailwind's default blue/green/red/yellow for status chips without justification.
- **No excessive shadows and rounded corners.** This codebase uses sharp rectangles. `border-radius` should be 0 or very small. No `shadow-xl` on everything.
- **No commented-out code or `// TODO` left in production files.**

---

## Commands

```bash
npm run dev        # Start dev server → http://localhost:3000
npm run build      # Production build (runs TypeScript + ESLint)
npm run lint       # ESLint only
npm install        # Install dependencies
```

**Cron job:** `/api/ai/consolidate` runs daily at 2 AM UTC via Vercel Cron. Test manually with POST.

---

## Environment Variables

Required in `.env.local` (copy from `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
NEXTAUTH_SECRET=          # Generate: openssl rand -base64 32
```

Database schema: run `supabase/migrations/001_initial.sql` in Supabase SQL Editor.

---

## Architecture

**Stack:** Next.js 14 (App Router) · TypeScript · Supabase (Postgres + Auth) · Anthropic Claude · Tailwind CSS · Vercel

**Multi-tenant:** All tables scoped by `org_id` with Supabase Row-Level Security. Always include `org_id` in queries.

**Auth:** Supabase magic link (passwordless). No passwords. Session managed via cookies in middleware.

### Directory Structure

```
app/
  (auth)/login         # Login page (magic link)
  (auth)/callback      # OAuth callback route
  (dashboard)/         # Protected dashboard pages
    page.tsx           # Main dashboard (KPIs)
    feedback/          # Feedback submission + table
    insights/          # AI-ranked feature requests
    roadmap/           # Kanban: Backlog → Shipped
    settings/          # Profile + CRM setup
  api/
    feedback/          # CRUD for feedback items
    features/          # Feature request queries
    ai/classify/       # Claude classification trigger
    ai/consolidate/    # Daily consolidation cron
    ai/roadmap-brief/  # Generate product brief on demand
    crm/               # Salesforce + HubSpot stubs (Phase 6)

lib/
  anthropic/
    classify.ts        # Agent 01: classify feedback → category/sentiment/urgency
    consolidate.ts     # Agent 02: group feature_requests by theme + revenue
    roadmap.ts         # Agent 03: generate one-pager brief for a feature
  supabase/
    client.ts          # Browser Supabase client
    server.ts          # Server Supabase client
    middleware.ts      # Session refresh middleware

components/
  dashboard/KPICards.tsx
  dashboard/FeatureRankingChart.tsx
  feedback/FeedbackForm.tsx
  feedback/FeedbackTable.tsx
```

### Three AI Agents (all Claude Opus 4.6)

| Agent | File | Trigger | Input → Output |
|-------|------|---------|----------------|
| Classification | `lib/anthropic/classify.ts` | Async on feedback submit (fire-and-forget) | raw_text + arr → category, sentiment, urgency_score |
| Consolidation | `lib/anthropic/consolidate.ts` | Vercel Cron 2 AM UTC | all feature_request feedback → grouped feature_requests |
| Roadmap Brief | `lib/anthropic/roadmap.ts` | On-demand ("Generate Brief" button) | feature title + revenue → one_pager_md, acceptance_criteria |

### Supabase Tables

`organizations` → `profiles` (users, roles)
`accounts` (customer companies with ARR) → `feedback` (raw + classified)
`feature_requests` (consolidated, revenue-weighted, roadmap_status)

---

## Gotchas

- **Classification is async/fire-and-forget.** Feedback saves immediately; `ai_processed=false` until Claude responds. Do not block UI on it.
- **Cron security:** `/api/ai/consolidate` validates a Bearer token. Don't remove that check.
- **org_id everywhere.** RLS will silently return 0 rows if `org_id` is missing from a query — not an error.
- **No N+1 queries.** Use SQL joins, not sequential fetches.
- **Vercel cron:** Defined in `vercel.json`. Only runs in production — test locally with direct POST.
- **Claude model:** Use `claude-opus-4-6` (already in codebase). Do not downgrade without checking impact on output quality.
- **Git paths with parentheses:** Quote `app/(auth)/` and `app/(dashboard)/` in all git commands — zsh glob-expands unquoted parens: `git add "app/(auth)/login/page.tsx"`
- **Port 3000 conflict:** Before `preview_start`, check for stale servers: `lsof -i :3000 -t | xargs kill`
- **Post-response Supabase writes:** The SSR cookie client closes when the HTTP response is sent. For fire-and-forget writes after the response (e.g. seeding), use `createClient` from `@supabase/supabase-js` with `SUPABASE_SERVICE_ROLE_KEY` directly — see `lib/supabase/seed-demo.ts`
- **Build SIGTERM warning:** `Compiler edge-server unexpectedly exited with SIGTERM` is non-blocking on Mac — build still passes, safe to ignore
- **Demo seed theme tags:** `lib/supabase/seed-demo.ts` uses `crm_note_id` as a lookup key (`demo:salesforce`, `demo:slack`, etc.) to map feedback rows to feature_requests without relying on insert order

---

## Design System (for slides, diagrams, and UI artifacts)

**Colors:**
| Name | Hex | Use |
|------|-----|-----|
| Navy | `#0D1B3E` | Primary background |
| Blue | `#1565C0` | Section headers |
| Light Blue | `#1E88E5` | Accents |
| Ice Blue | `#CADCFC` | Subtext on dark |
| Gold | `#F0A500` | Highlights, data sources |
| Green | `#00897B` | Positive metrics, outputs |
| Muted | `#7A9CC0` | Secondary text |
| Dark | `#0A1628` | Card backgrounds |
| Off-white | `#F4F7FC` | Light slide backgrounds |

**Typography:** Headers → Trebuchet MS · Body → Calibri · Technical → Space Mono

**Partner colors:** Perplexity `#20B2AA` · Anthropic `#E8763A` · IBM `#0062FF` · Google `#34A853` · AWS `#FF9900`

Always match this design system when building new slides or UI components.

---

## Product Context

**The problem:** Sales hears customer needs. That signal never reaches Product. 42% of SaaS fails from no market need (CB Insights). 20-30% value lost from Sales/Product misalignment (McKinsey).

**The solution:** Clairio ingests CRM/tickets/email/transcripts, weights every signal by ARR, and surfaces a revenue-ranked product backlog Sales, Product, and Engineering can all act on.

**Competitive moat:** Revenue-weighted intelligence graph (vs Productboard = no revenue weighting; vs Gainsight = CS-only; vs Gong = no backlog integration).

**Pricing:** $35/user/month → $50 by Year 5. ~25 users/customer avg.

**Five-agent vision (current MVP = Agents 01–03 only):**
- Agent 01: Feedback Capture (Claude) ← built
- Agent 02: Revenue Weighting (watsonx.data) ← stub
- Agent 03: Pattern Recognition (Claude) ← built
- Agent 04: Alignment Agent (watsonx.ai) ← future
- Agent 05: Proactive Signal (Perplexity API) ← future

---

## Lars — Personal AI Agent

**What it is:** Lars is Charles's personal AI chief-of-staff. Runs daily morning briefs, manages calendar context, tracks open questions, and handles personal/professional task flow. Not part of the Clairio product — runs in separate Claude sessions.

**Key files in this repo:**
| File | Purpose |
|------|---------|
| `LARS.md` | Lars's hot memory — read this at every Lars session start |
| `lars_brain_upload.md` | Charles's full professional context (IBM background, values, communication style, non-negotiables) — Q1–Q50 |
| `lars_template.md` | Generic brain upload template (licensable product for other consultants) |
| `lars_morning_brief_YYYY-MM-DD.md` | Daily brief output files |
| `lars_dashboard.html` | Live dashboard (regenerated each morning) |
| `lars_landing.html` | Lars product landing page |

**How Lars works:** At session start, Lars reads `LARS.md` + `lars_brain_upload.md` to load Charles's context, then pulls calendar + email to generate the morning brief. Updates `LARS.md` with anything new learned.

> **For Lars sessions:** Always start by reading `LARS.md` and `lars_brain_upload.md`. Those are the source of truth for Charles's context, people, and open questions.

---

## CRM Integration (Phase 6)

**What it is:** Salesforce + HubSpot connectors that feed customer ARR data into the Clairio revenue-weighting pipeline. Currently Phase 6 stubs — not yet implemented.

**Files:**
- `app/api/crm/salesforce/route.ts` — stub (returns 501)
- `app/api/crm/hubspot/route.ts` — stub (returns 501)
- `app/(dashboard)/settings/page.tsx` — CRM setup UI (org-level config)

**When building Phase 6:** The goal is to pull `account.arr` values from Salesforce/HubSpot into the `accounts` table so the consolidation agent can weight feature requests by real revenue. Start with Salesforce (higher priority per partner outreach order).

---

## Current Status

**Built:**
- Full Next.js MVP: auth, dashboard, feedback, insights, roadmap
- 3 Claude agents: classify, consolidate, roadmap-brief
- Supabase schema with multi-tenant RLS
- Pitch deck (24 slides), financial model, one-pager, partner emails
- Phase B: full Clairio rebrand (login, signup, dashboard, empty states, error handling)
- Phase C: user testing setup — auto-seed demo data on onboarding (`lib/supabase/seed-demo.ts`), `docs/VERCEL_DEPLOY.md`

**Next manual step:** Charles follows `docs/VERCEL_DEPLOY.md` to deploy to Vercel (add 5 env vars in dashboard, update Supabase redirect URLs)

**MVP next priorities:**
1. Feedback Capture Agent polish (highest demo value)
2. Salesforce CRM integration (Phase 6 stubs exist in `app/api/crm/`)
3. Simple ARR-weighted backlog dashboard
4. Perplexity Enterprise connector PoC

**Partner outreach priority:** Perplexity → IBM → Google → Anthropic → AWS

---

## Output Files (non-code deliverables)

Slides, docs, and diagrams built in prior sessions live in `/mnt/user-data/outputs/`:
- `Clairio_Pitch_Deck.pptx` — 24-slide main deck (source of truth for messaging)
- `Clairio_Financial_Model.xlsx` — 4-sheet model (blue cells = editable inputs)
- `Clairio_One_Pager.docx`
- `clairio_diagram.html` / `clairio_flywheel_ring.html`

When building new slides: use pptxgenjs (Node.js). Match existing branding exactly.
When building new docs: use docx (Node.js).
When building spreadsheets: use openpyxl (Python).
