# Samadhi Architecture

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        SAMADHI PLATFORM                         │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                      USER INTERFACE LAYER                        │
├──────────────────────────────────────────────────────────────────┤
│  React 18 Components                                             │
│  - Login/Signup (Magic Link Auth)                                │
│  - Dashboard (Overview with KPIs)                                │
│  - Feedback Form (Submit with Account + ARR)                     │
│  - Feedback Table (Status, Category, Sentiment)                  │
│  - Insights Page (Features ranked by Revenue)                    │
│  - Roadmap Kanban (Backlog → Shipped)                            │
│  - Settings (Profile + CRM Setup)                                │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                      API LAYER (Next.js Routes)                  │
├──────────────────────────────────────────────────────────────────┤
│  RESTful Endpoints:                                              │
│  - POST /api/feedback          → Create feedback                 │
│  - GET /api/feedback           → Fetch feedback                  │
│  - PATCH /api/feedback/[id]    → Update status                   │
│  - GET /api/features           → Fetch consolidated features     │
│  - POST /api/ai/classify       → Manual classification trigger   │
│  - POST /api/ai/consolidate    → Consolidation cron job          │
│  - POST /api/ai/roadmap-brief  → Generate product brief          │
│  - POST /api/crm/*             → CRM stubs (Phase 6)             │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    AI AGENTS LAYER (Claude)                      │
├──────────────────────────────────────────────────────────────────┤
│  1. Classification Agent                                         │
│     Input: raw_text, account_name, arr                          │
│     Output: category, sentiment, urgency_score, tags            │
│     Model: Claude Opus 4.6                                       │
│     Trigger: Async (fire-and-forget on feedback submit)         │
│                                                                  │
│  2. Consolidation Agent                                          │
│     Input: [feedback items with category='feature_request']     │
│     Output: grouped features with titles, descriptions          │
│     Model: Claude Opus 4.6                                       │
│     Trigger: Vercel Cron (daily at 2 AM UTC)                    │
│                                                                  │
│  3. Roadmap Brief Agent                                          │
│     Input: feature_request with title, description, revenue     │
│     Output: one_pager_md, acceptance_criteria, rationale        │
│     Model: Claude Opus 4.6                                       │
│     Trigger: On-demand (user clicks "Generate Brief")           │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    DATA LAYER (Supabase)                         │
├──────────────────────────────────────────────────────────────────┤
│  PostgreSQL Tables:                                              │
│  ┌─────────────────┐                                             │
│  │  organizations  │ (multi-tenant isolation)                    │
│  │  - id, name     │                                             │
│  └─────────────────┘                                             │
│          ↑                                                       │
│          │ org_id                                                │
│  ┌─────────────────┐                                             │
│  │   profiles      │ (users)                                     │
│  │ - id, org_id    │                                             │
│  │ - role, name    │                                             │
│  └─────────────────┘                                             │
│                                                                  │
│  ┌─────────────────┐                                             │
│  │    accounts     │ (customer companies)                        │
│  │ - id, org_id    │                                             │
│  │ - name, arr     │                                             │
│  └─────────────────┘                                             │
│          ↑                                                       │
│          │ account_id                                            │
│  ┌─────────────────────────────────────┐                        │
│  │      feedback                       │ (raw text)             │
│  │ - id, org_id, account_id, rep_id   │                        │
│  │ - raw_text, category, urgency      │                        │
│  │ - sentiment, revenue_weight, status│                        │
│  │ - ai_processed, created_at         │                        │
│  └─────────────────────────────────────┘                        │
│                                                                  │
│  ┌──────────────────────────────────────┐                       │
│  │    feature_requests                  │ (consolidated)        │
│  │ - id, org_id, title, description    │                       │
│  │ - total_revenue_weight, account_count                        │
│  │ - feedback_ids[], roadmap_status    │                       │
│  │ - created_at, updated_at            │                       │
│  └──────────────────────────────────────┘                       │
│                                                                  │
│  Auth: Supabase Auth (PostgreSQL-backed)                        │
│  RLS: All tables have org-level row-level security              │
│  Indexes: On org_id, account_id, status, category               │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
├──────────────────────────────────────────────────────────────────┤
│  - Anthropic Claude API (classification, consolidation, briefs) │
│  - Vercel (hosting, cron jobs, edge functions)                  │
│  - Supabase (database, auth, realtime)                          │
│  - (Coming Phase 6): Salesforce, HubSpot APIs                   │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow: Feedback Journey

```
┌──────────────────┐
│ Sales Rep Inputs │
│ - Account Name   │
│ - ARR Value      │
│ - Raw Feedback   │
└────────┬─────────┘
         │
         ↓
   POST /api/feedback
         │
         ├─→ [Sync] Create feedback record in DB
         │           (status='new', ai_processed=false)
         │
         └─→ [Async] classifyFeedback()
                     ↓
              Claude API Call
              ├─ Input: raw text + context
              ├─ Output: {category, sentiment, urgency_score}
              └─→ Update feedback record
                  (ai_processed=true, category filled)
                  ↓
         ┌─────────────────────────────────┐
         │ Daily Cron Job (2 AM UTC)       │
         └────────────┬────────────────────┘
                      │
                      ↓
         GET /api/ai/consolidate
                      │
                      ├─→ Fetch all category='feature_request'
                      │   feedback with ai_processed=true
                      │
                      ├─→ Send to Claude with grouping prompt
                      │   Input: [feedback items]
                      │   Output: {
                      │     groups: [{
                      │       title: "Feature Name",
                      │       description: "...",
                      │       feedback_ids: [...]
                      │     }]
                      │   }
                      │
                      ├─→ For each group:
                      │   - Insert feature_request record
                      │   - Calculate total_revenue_weight
                      │   - Set account_count
                      │   - Update feedback status='in_roadmap'
                      │
                      └─→ Log completion
                      ↓
         ┌────────────────────────────────────┐
         │ Product Manager Views Insights     │
         │ - Features ranked by revenue       │
         │ - Grouped by demand (# accounts)   │
         │ - Sorted by impact ($ value)       │
         └────────┬───────────────────────────┘
                  │
                  ├─→ Clicks "Generate Roadmap Brief"
                  │
                  ↓
         POST /api/ai/roadmap-brief
                  │
                  ├─→ Fetch feature_request from DB
                  │
                  ├─→ Call Claude with brief prompt
                  │   Input: {title, description, revenue, accounts}
                  │   Output: {
                  │     one_pager_md: "# Title\n...",
                  │     acceptance_criteria: ["Criterion 1", ...],
                  │     priority_rationale: "..."
                  │   }
                  │
                  └─→ Return brief to UI
                      (displayed as Markdown)
                      ↓
         ┌─────────────────────────────────┐
         │ PM Creates Ticket in Jira       │
         │ - Title from brief              │
         │ - Description from brief        │
         │ - Label: "$XXK revenue impact"  │
         │ - Acceptance criteria as tasks  │
         └─────────────────────────────────┘
```

## Authentication Flow

```
User (not logged in)
  │
  ├─→ GET /
  │   Middleware redirects → /login
  │
  ├─→ POST /login
  │   - Enter email
  │   - supabase.auth.signInWithOtp({email, redirectTo: /api/auth/callback})
  │   - Email sent with magic link
  │
  ├─→ Click magic link in email
  │   - Redirects to /api/auth/callback?code=xxx
  │   - supabase.auth.exchangeCodeForSession(code)
  │   - Session created
  │   - Redirects to /dashboard
  │
  ├─→ GET /dashboard
  │   - Middleware calls updateSession() (refreshes token)
  │   - User is authenticated ✓
  │
  └─→ All subsequent requests
      - Cookies contain session
      - Middleware refreshes on every request
      - API routes check auth.getUser()
      - RLS policies filter data by org_id
```

## Scaling Considerations

### Current (Phase 1-4)
- Feedback: Single-digit to hundreds per day
- Users: 1-50 per organization
- Storage: < 1 GB
- Cost: $200-500/month

### Medium (100+ orgs, 1000s feedback/day)
- Add caching layer (Redis for feedback queries)
- Use Vercel KV for session management
- Implement request batching for Claude API
- Consider dedicated Claude API tier

### Large (Enterprise)
- Move to dedicated Postgres instance
- Implement vector DB for semantic search
- Use Claude API batches for consolidation
- Add queue system (Bull/RQ) for async jobs

## Security Measures

1. **Authentication**: Supabase Auth (JWT tokens, secure cookies)
2. **Authorization**: Row-level security at database level
3. **Input Validation**: Zod schema validation on all API routes
4. **Data Isolation**: org_id baked into queries
5. **Secrets**: All API keys in environment variables
6. **HTTPS**: Enforced on production (Vercel)
7. **CORS**: Same-origin (no cross-origin issues)
8. **Cron Security**: Bearer token validation on scheduled jobs

## Error Handling

- **Frontend**: User-facing error messages (network, validation)
- **API**: HTTP status codes + error objects
- **Agents**: Fallback to sensible defaults if Claude fails
- **Database**: Transactions for multi-step operations
- **Logging**: Console.error + external logging (optional: Sentry)

## Performance Optimizations

- **Server Components**: Static/SSR where possible
- **Image Optimization**: None (no heavy images in MVP)
- **Bundle Splitting**: Next.js automatic code splitting
- **Caching**: Supabase connection pooling
- **Database**: Indexes on hot columns (org_id, status, category)
- **API**: No N+1 queries (joins in SQL)

## Deployment Pipeline

```
Git Commit
  ↓
GitHub → Vercel
  ↓
Build (npm run build)
  ├─ TypeScript check
  ├─ ESLint
  ├─ Next.js optimization
  └─ Bundle analysis
  ↓
Deploy to Vercel Edge Network
  ├─ API routes run on V8 Isolates
  ├─ Static assets cached globally
  └─ Environment variables injected
  ↓
Cron Jobs Enabled
  └─ /api/ai/consolidate runs daily at 2 AM
  ↓
✓ Production Live
```

---

**Total Requests per Day (estimate)**
- Feedback submission: 10-100 (async classification adds 1-2 API calls)
- Dashboard views: 10-100
- Consolidation cron: 1 (daily)
- Brief generation: 5-20

**Total API Calls to Claude (estimate)**
- Classification: 10-100 calls/day @ $0.003 each = $0.03-0.30/day
- Consolidation: 1 call/day @ $0.01 = $0.01/day
- Brief generation: 5-20 calls/day @ $0.005 = $0.025-0.10/day

**Monthly**: ~$15-20 in Claude API costs
