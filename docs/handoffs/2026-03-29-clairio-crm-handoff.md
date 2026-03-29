# Clairio CRM — Session Handoff
**Date:** 2026-03-29
**Branch:** `claude/create-simple-crm-A7SYe`
**Repo:** `charleskeatts/samadhi`
**Working directory:** `/home/user/samadhi/webapp/`

---

## What Was Built

This session completed a full-stack production-ready CRM called **Clairio** inside the monorepo at `samadhi/webapp/`. It is a Next.js 15 App Router app with TypeScript, Tailwind CSS, Prisma v6, NextAuth v5, and Stripe.

### Feature Inventory (all complete)

| Step | Feature | Status |
|------|---------|--------|
| 1 | Project skeleton, layout, placeholder pages | ✅ |
| Revenue ext. | Subscription + RevenueSnapshot models, MRR/ARR/usage helpers, seed data | ✅ |
| 2 | Auth — login/signup forms, JWT session, middleware | ✅ |
| 3 | Full CRUD — Contacts, Companies, Deals | ✅ |
| 4 | Tasks — quick-complete toggle, overdue alerts, dashboard wiring | ✅ |
| 5 | Kanban pipeline board with @dnd-kit drag-and-drop | ✅ |
| 6 | Stripe billing — checkout, webhook, portal, trial banner, billing page | ✅ |
| This session | Contracts, Invoices, renewal alerts, actual revenue on company page | ✅ |

---

## This Session's Changes

### New Prisma Models (schema updated, client regenerated, **migration not yet run**)

**`Contract`**
- Fields: `title`, `status` (draft/active/expired/terminated), `value`, `startDate`, `renewalDate` (nullable), `autoRenews`, `notes`
- Relations: belongs to `Account` + `Company`, has many `Invoice`
- Index on `[accountId, renewalDate]` for dashboard renewal queries

**`Invoice`**
- Fields: `number`, `status` (draft/sent/paid/overdue/void), `amount`, `invoiceDate`, `dueDate`, `paidDate` (nullable), `notes`
- Relations: belongs to `Account` + `Company`, optionally belongs to `Contract`
- Index on `[accountId, status]` and `[accountId, companyId]`

### New Server Actions
- `webapp/app/actions/contracts.ts` — `createContract`, `updateContract`, `deleteContract`
- `webapp/app/actions/invoices.ts` — `createInvoice`, `updateInvoice`, `deleteInvoice`, `markInvoicePaid`

### New Components
- `webapp/components/companies/ContractsSection.tsx` — inline CRUD table, renewal countdown badges (red ≤30d, yellow ≤60d), auto-renews indicator
- `webapp/components/companies/InvoicesSection.tsx` — inline CRUD table, status badges, per-row "Mark paid" quick-action button on sent/overdue invoices

### Updated Pages
- **Company detail** (`webapp/app/(app)/companies/[id]/page.tsx`):
  - 4-stat header: MRR · ARR · Usage revenue (current month) · Actual revenue (sum of paid invoices)
  - Right column now has: Subscriptions → Contracts → Invoices → Revenue history
- **Dashboard** (`webapp/app/(app)/dashboard/page.tsx`):
  - Contract renewal alerts panel — active contracts due within 60 days, sorted ascending
  - Overdue invoices banner — count + total outstanding amount

### Stripe Billing (completed last session, this session)
- `webapp/app/api/stripe/checkout/route.ts` — creates Checkout session, auto-creates Stripe customer
- `webapp/app/api/stripe/webhook/route.ts` — handles `checkout.session.completed`, `customer.subscription.updated/deleted`, `invoice.payment_failed`
- `webapp/app/api/stripe/portal/route.ts` — creates Customer Portal session
- `webapp/app/api/billing/info/route.ts` — GET endpoint for billing state
- `webapp/app/(app)/billing/page.tsx` — full UI: status badge, trial countdown, upgrade/manage buttons
- `webapp/components/layout/TrialBanner.tsx` — dismissible top banner for trial ≤5 days, past_due, canceled

---

## Architecture Decisions

### Stack
- **Next.js 15 App Router** — Server Components + Server Actions (no API routes for CRM CRUD, only for Stripe/auth)
- **Prisma v6** — intentionally pinned at v6, NOT v7 (v7 broke `url = env("DATABASE_URL")`)
- **NextAuth v5 beta** — Credentials provider, JWT strategy (no DB sessions), `PrismaAdapter` for session tables only
- **JWT embeds** `accountId`, `role`, `subscriptionStatus`, `trialEndsAt` — no Prisma calls in middleware
- **Supabase PostgreSQL** — project ref `zvgzqhvobutgjqyqbgwn`

### Multi-tenancy
Every Prisma query is scoped by `accountId` from the session. `requireAccountId()` in `webapp/lib/session.ts` throws a redirect to `/login` if no session.

### Revenue model
- **MRR** computed live from `Subscription.monthlyRecurringAmount` where `isActive = true`
- **Usage revenue** stored per month in `RevenueSnapshot.monthlyUsageRevenue`
- **Actual revenue** = sum of `Invoice` records where `status = "paid"` (all-time per company)
- `RevenueSnapshot` has `@@unique([accountId, companyId, month])` — upserted when usage is logged

### Stripe billing flow
1. User hits `/billing` → clicks "Upgrade" → POST `/api/stripe/checkout` → Stripe-hosted checkout
2. On success, Stripe fires `checkout.session.completed` webhook → sets `subscriptionStatus = active`
3. Subsequent subscription changes come via `customer.subscription.updated/deleted`
4. Failed payments fire `invoice.payment_failed` → sets `past_due`
5. JWT is issued at login with the status from DB — **status changes from webhooks are only reflected after next login**

---

## Environment / Config

### `.env.local` (not committed, create locally)
```
DATABASE_URL=postgresql://postgres:Transweb45%23@db.zvgzqhvobutgjqyqbgwn.supabase.co:5432/postgres
AUTH_SECRET=<any 32+ char random string>
NEXTAUTH_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Database (Supabase)
- Project URL: `https://zvgzqhvobutgjqyqbgwn.supabase.co`
- Password: `Transweb45#` (URL-encoded as `Transweb45%23` in DATABASE_URL)
- **The sandbox has no external network** — all `prisma migrate` and `prisma db seed` must be run locally

### Pending migration commands (run locally)
```bash
cd samadhi/webapp
npx prisma migrate dev --name contracts-invoices
# (if starting fresh, run the init migration first)
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
```

---

## Key File Locations

```
webapp/
├── prisma/
│   ├── schema.prisma          # All models including new Contract + Invoice
│   └── seed.ts                # Demo account: demo@example.com / password123
├── lib/
│   ├── auth.ts                # NextAuth config, JWT callbacks
│   ├── db.ts                  # Prisma client singleton
│   ├── revenue.ts             # MRR/ARR helpers, fmtCurrency, fmtMonth
│   ├── session.ts             # requireAccountId() helper
│   └── stripe.ts              # Stripe client + STRIPE_PRICE_ID export
├── middleware.ts               # Route gating by subscriptionStatus from JWT
├── app/
│   ├── (auth)/                # login, signup pages
│   ├── (app)/                 # all authenticated app routes
│   │   ├── layout.tsx         # Sidebar + TrialBanner wrapper
│   │   ├── dashboard/page.tsx # Renewal alerts + overdue invoices + revenue
│   │   ├── companies/[id]/page.tsx  # 4-stat header + all sections
│   │   ├── contacts/          # List + detail + new + edit
│   │   ├── deals/             # List + board (Kanban) + new + edit
│   │   ├── tasks/             # List + new + edit
│   │   └── billing/page.tsx   # Stripe billing UI
│   ├── actions/
│   │   ├── companies.ts, contacts.ts, deals.ts, tasks.ts
│   │   ├── subscriptions.ts, revenue.ts
│   │   ├── contracts.ts       # NEW
│   │   └── invoices.ts        # NEW
│   └── api/
│       ├── auth/signup/       # POST signup handler
│       ├── billing/info/      # GET billing state
│       └── stripe/checkout, webhook, portal
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── TrialBanner.tsx
│   ├── companies/
│   │   ├── SubscriptionsSection.tsx
│   │   ├── ContractsSection.tsx   # NEW
│   │   ├── InvoicesSection.tsx    # NEW
│   │   └── RevenueSection.tsx
│   ├── deals/
│   │   ├── KanbanBoard.tsx, KanbanColumn.tsx, KanbanCard.tsx
│   ├── tasks/TaskRow.tsx
│   ├── dashboard/RevenuePanel.tsx
│   └── ui/
│       ├── button.tsx (Button + LinkButton)
│       ├── badge.tsx, card.tsx, input.tsx
│       └── delete-button.tsx
```

---

## Potential Next Steps

These were not requested but are natural next features:

1. **Invoice PDF generation** — use `@react-pdf/renderer` or similar to export an invoice as PDF
2. **Invoice email sending** — send invoice to customer contact via Resend/SendGrid
3. **Contract → Invoice linking** — the `Invoice.contractId` FK exists but the UI form doesn't expose it yet; add a contract selector dropdown to the invoice form
4. **Activity feed / audit log** — log CRM actions (contact created, deal stage changed, invoice paid) per account
5. **Company list MRR column** — already computed in the companies list page; could also show contract count and unpaid invoice total
6. **Renewal notifications** — email the account owner when a contract renewal is within 30 days (could be a cron job or Stripe scheduled event)
7. **Reports page** — MRR growth chart over time, invoice payment rate, revenue by company bar chart
8. **User invites** — allow account owner to invite additional team members (the `role` field on User already supports owner/member)
9. **CSV export** — export contacts, companies, or revenue data to CSV

---

## Known Issues / Gotchas

- **Subscription status staleness in JWT**: after a Stripe webhook updates `subscriptionStatus` in the DB, the user's JWT still has the old status until they log out and back in. Middleware reads JWT only, not DB, by design (perf). Fix: force session refresh after webhook, or add a `sessionVersion` field.
- **Overdue invoice status**: invoices marked `sent` past their due date display as "Overdue" in the UI (computed on the fly by `isOverdue()` helper), but the DB `status` field stays as `"sent"`. A background job would be needed to flip them in the DB.
- **Prisma generate required after schema changes**: the sandbox can't connect to the DB, so run with `DATABASE_URL="postgresql://x:x@localhost/x" npx prisma generate` to regenerate types without migrating.
