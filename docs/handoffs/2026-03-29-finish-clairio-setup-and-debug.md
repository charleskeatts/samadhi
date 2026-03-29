# Handoff: Finish Clairio Setup & Debug
**Date:** 2026-03-29
**Branch:** `claude/finish-clairio-setup-Xs4cj`
**Session goal:** Fix build errors and routing so Clairio is ready to deploy to Vercel for user testing.

---

## What We Did

### 1. Installed dependencies
`node_modules` was absent. Ran `npm install` to restore it before any build checks.

### 2. Fixed build-time Supabase SSR initialization errors

**Problem:** Multiple client components (`DashboardLayout`, `login`, `signup`, `settings`, `insights`, `backlog`) called `createClient()` at the top level of the component body. During Next.js build-time prerendering, React runs component functions on the server — where `NEXT_PUBLIC_SUPABASE_*` env vars may not be set — causing `@supabase/ssr` to throw and fail the build.

**Fix:** Moved `createClient()` out of component-level scope into the places where it's actually used:
- `DashboardLayout` (`app/(dashboard)/dashboard/layout.tsx`) → moved into `handleSignOut`
- `login/page.tsx`, `signup/page.tsx` → moved inside event handlers
- `settings/page.tsx`, `insights/page.tsx`, `backlog/page.tsx` → moved inside `useEffect` callbacks; removed `supabase` from dependency arrays

### 3. Fixed server component prerender failures

**Problem:** Server component pages (`dashboard/page.tsx`, `feedback/page.tsx`, `roadmap/page.tsx`) call `cookies()` via the Supabase server client. Next.js 14 tries to statically prerender all pages by default, which throws `DYNAMIC_SERVER_USAGE` for any page using `cookies()`.

**Fix:** Added `export const dynamic = 'force-dynamic'` to each of these three pages.

### 4. Fixed critical routing mismatch

**Problem:** All dashboard pages were inside `app/(dashboard)/` — a Next.js route group, which adds NO path segment to URLs. This meant routes resolved to `/`, `/feedback`, `/insights`, etc. But:
- The middleware auth guard checked `pathname.startsWith('/dashboard')`
- All sidebar nav links pointed to `/dashboard/*`
- The callback/onboarding redirected to `/dashboard`

So authenticated users were being sent to a non-existent route.

**Fix:** Moved all dashboard pages from `app/(dashboard)/[page].tsx` into `app/(dashboard)/dashboard/[page].tsx`. Routes now correctly resolve to `/dashboard`, `/dashboard/feedback`, `/dashboard/insights`, `/dashboard/backlog`, `/dashboard/roadmap`, `/dashboard/settings`.

### 5. Updated deployment guide

Updated `docs/VERCEL_DEPLOY.md` to add a new **Step 0** instructing Charles to run both SQL migrations (in order) before deploying:
- `supabase/migrations/001_initial.sql`
- `supabase/migrations/002_backlog_columns.sql`

The original guide only mentioned the first migration; the second was added in a prior session.

---

## Decisions Made

- **`force-dynamic` over `export const dynamic = 'auto'`**: Server component dashboard pages require auth/cookies on every request — static generation is never appropriate for them.
- **Lazy `createClient()` in useEffect/handlers**: Cleaner than a `useRef`-based singleton. The browser Supabase client is cheap to create and only ever used client-side.
- **Route group restructure instead of middleware rewrite**: Moving pages to `app/(dashboard)/dashboard/` is the idiomatic Next.js fix. A middleware rewrite would be fragile.
- **Not upgrading Next.js** (still 14.1.0): The security advisory exists but upgrading is a breaking-change risk during the pre-deploy crunch. This is a known TODO for after the MVP ships.

---

## Current Build State

```
Route (app)
λ /dashboard              — server component, force-dynamic
○ /dashboard/backlog      — client component, static shell + client fetch
λ /dashboard/feedback     — server component, force-dynamic
○ /dashboard/insights     — client component, static shell + client fetch
λ /dashboard/roadmap      — server component, force-dynamic
○ /dashboard/settings     — client component, static shell + client fetch
○ /login                  — client component, static
○ /signup                 — client component, static
○ /onboarding             — client component, static
λ /callback               — route handler
λ /api/*                  — all dynamic route handlers
```

Build is clean. SIGTERM warning on edge compiler is non-blocking (documented in CLAUDE.md).

---

## What Remains Before Launch

### Charles must do manually (no code changes needed):
1. **Supabase:** Create project → run both migrations in SQL Editor
2. **Vercel:** Connect repo → add 5 env vars → deploy
3. **Supabase auth redirect:** Add `/callback` URL, update Site URL
4. **Test:** Sign up in incognito → magic link → dashboard with demo data

Full instructions in `docs/VERCEL_DEPLOY.md`.

### Known technical debt (not blocking launch):
- Next.js 14.1.0 has a security advisory — upgrade to latest 14.x after MVP
- Several `any` type casts in dashboard pages and AI agent code (low priority)
- Phase 6 CRM stubs (`/api/crm/salesforce`, `/api/crm/hubspot`) return 501 — by design
- Consolidation cron (`/api/ai/consolidate`) is only tested manually via POST; needs Vercel Cron validation post-deploy

### MVP next priorities (from CLAUDE.md):
1. Feedback Capture Agent polish (highest demo value)
2. Salesforce CRM integration (Phase 6 stubs exist)
3. ARR-weighted backlog dashboard improvements
4. Perplexity Enterprise connector PoC

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `app/(dashboard)/dashboard/layout.tsx` | Sidebar nav + sign-out — wraps all /dashboard/* pages |
| `app/(dashboard)/dashboard/page.tsx` | Overview KPIs (`force-dynamic`) |
| `app/(dashboard)/dashboard/feedback/page.tsx` | Feedback table (`force-dynamic`) |
| `app/(dashboard)/dashboard/insights/page.tsx` | AI feature insights (client) |
| `app/(dashboard)/dashboard/backlog/page.tsx` | Revenue priority backlog (client) |
| `app/(dashboard)/dashboard/roadmap/page.tsx` | Kanban roadmap (`force-dynamic`) |
| `lib/anthropic/classify.ts` | Agent 01: classify feedback → category/sentiment/urgency |
| `lib/anthropic/consolidate.ts` | Agent 02: daily cron consolidation |
| `lib/anthropic/roadmap.ts` | Agent 03: on-demand roadmap brief |
| `lib/supabase/seed-demo.ts` | Auto-seeds new orgs with demo data on onboarding |
| `supabase/migrations/001_initial.sql` | Full schema + RLS |
| `supabase/migrations/002_backlog_columns.sql` | Adds category + blocker_score to feature_requests |
| `docs/VERCEL_DEPLOY.md` | Step-by-step deploy guide for Charles |
| `middleware.ts` | Auth guard: protects /dashboard/*, redirects /login for authed users |

---

## How to Pick Up

```bash
git checkout claude/finish-clairio-setup-Xs4cj
npm install
npm run dev   # → http://localhost:3000
```

The branch is ahead of main with all fixes committed and pushed. When Charles completes the Vercel deploy steps, the MVP will be live and ready for testers.
