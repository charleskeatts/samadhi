# Revenue Priority Backlog Dashboard — Design

**Date:** 2026-03-12
**Status:** Approved

---

## Problem

Product teams can't act on Clairio's revenue-weighted data because it's presented as a flat list. They need a view that looks like a tool they already use (Jira, Linear, Productboard) — a ranked, filterable backlog where revenue priority is immediately obvious.

---

## Solution

A new `/dashboard/backlog` page: a "Revenue Priority" view with table and kanban toggle. Distinct dark styling (`#0A1628` background) to signal "this is the money view." Wired to real Supabase data with two new schema columns.

---

## Route & Nav

- **Route:** `app/(dashboard)/backlog/page.tsx`
- **Sidebar nav:** "Backlog" added between Insights and Roadmap
- **Existing pages:** unchanged

---

## Schema Changes

Two new columns on `feature_requests`:

```sql
ALTER TABLE feature_requests
  ADD COLUMN category TEXT DEFAULT 'General',
  ADD COLUMN blocker_score INTEGER DEFAULT 3
    CHECK (blocker_score BETWEEN 1 AND 5);
```

Migration file: `supabase/migrations/002_backlog_columns.sql`

Charles runs this once in the Supabase SQL Editor.

---

## Seed Data Updates

`lib/supabase/seed-demo.ts` — updated 4 feature rows with realistic values:

| Feature | Category | Blocker Score |
|---|---|---|
| Salesforce CRM Integration | Integration | 5 (Critical) |
| Bulk Data Export | Analytics | 4 (High) |
| Slack Notifications | Integration | 3 (Medium) |
| Advanced Reporting | Analytics | 4 (High) |

---

## Data Flow

Single Supabase query on page load:

```sql
SELECT * FROM feature_requests
WHERE org_id = my_org_id()
ORDER BY total_revenue_weight DESC
```

Signal sources derived client-side: parse `feedback_ids` array → query `feedback` table for distinct `crm_note_id` patterns → display as source labels.

No N+1: one query for features, one batched query for sources.

---

## Components

### KPI Row (4 cards)
- **Total ARR at Risk** — sum of all `total_revenue_weight`
- **Critical Blockers** — count where `blocker_score = 5`
- **Deals Affected** — sum of all `account_count`
- **Filtered ARR** — sum of currently-filtered rows (reactive)

### Controls
- Category filter pills: All + distinct categories from data
- Sort toggle: ARR (default) · Deals · Blocker score

### Table View (default)
Columns:
1. Rank (top 3 highlighted gold)
2. Feature name + auto-tags (category pill + "Deal Blocker" badge if blocker_score ≥ 5)
3. ARR at Risk (formatted: $1.2M, $335K)
4. Deals (account_count)
5. Blocker badge (Critical/High/Medium/Low — color coded red→green)
6. Status badge (mapped from roadmap_status)

Click row → inline detail drawer:
- Revenue impact summary
- Signal sources (derived from feedback crm_note_id)
- Recommended action text (rule-based on blocker_score: 5 → escalate CPO, 4 → add to roadmap, 3 → schedule discovery)

### Kanban View
4 columns matching `roadmap_status`:
- Not Started (backlog)
- Planned
- In Progress
- Shipped

Each column header shows total ARR. Cards show feature name, ARR, blocker dot indicator.

### Bottom Bar
"Showing N features · Total ARR: $X · 🔴 N Critical · 🟠 N High · 🟡 N Medium"

---

## Styling

- Page background: `#0A1628` (Dark, from design system)
- Cards: `#0D1B3E` (Navy)
- Accent/highlight: `#F0A500` (Gold) for top-ranked features
- Blocker colors: Critical `#ef4444` · High `#f97316` · Medium `#eab308` · Low `#22c55e`
- Status colors: styled badges per status value
- Typography: Trebuchet MS headers, existing font stack for body

This page intentionally looks darker/denser than the rest of the dashboard — it's the "revenue war room" view that product teams will recognize from tools like Linear or Notion.

---

## What's Skipped (MVP)

- QoQ trend % — needs historical snapshots (future)
- Quarter target — needs planning workflow (future)
- "Create Jira ticket" button — needs Jira OAuth (future Phase 6)
- Real-time updates — page load query is sufficient for MVP

---

## Files Touched

| File | Change |
|---|---|
| `supabase/migrations/002_backlog_columns.sql` | New migration: add category + blocker_score |
| `lib/supabase/seed-demo.ts` | Add category + blocker_score to 4 feature rows |
| `app/(dashboard)/backlog/page.tsx` | New page — full Revenue Priority UI |
| `app/(dashboard)/layout.tsx` | Add "Backlog" nav item |
| `types/index.ts` | Add category + blocker_score to FeatureRequest type |
