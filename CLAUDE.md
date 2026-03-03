# CLAUDE.md — Clairio (samadhi repo)

**Product:** Clairio — revenue-weighted product intelligence platform
**Legal entity:** Samadi Consulting LLC
**Founder:** Charles Keatts (non-technical — explain technical decisions clearly)
**Stage:** Pre-revenue, pre-seed, bootstrapped. MVP in active development.

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

## Current Status

**Built:**
- Full Next.js MVP: auth, dashboard, feedback, insights, roadmap
- 3 Claude agents: classify, consolidate, roadmap-brief
- Supabase schema with multi-tenant RLS
- Pitch deck (24 slides), financial model, one-pager, partner emails

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
