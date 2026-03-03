# Samadhi — Sales-to-Product Intelligence

Capture customer feedback from sales calls, use AI to classify and consolidate it, and surface prioritized feature requests ranked by revenue impact.

## What This Does

- **Feedback Capture**: Sales reps log customer feedback with account name and ARR
- **AI Classification**: Claude automatically categorizes feedback, scores urgency, detects sentiment
- **Consolidation**: Similar feedback is grouped into feature requests by revenue impact
- **Roadmap View**: Product teams see features by status (Backlog → Planned → In Progress → Shipped)
- **CRM Integration** (Phase 6): Sync leads and opportunities from Salesforce or HubSpot

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Edge functions
- **Database**: Supabase (PostgreSQL + Auth)
- **AI**: Anthropic Claude API (classification & consolidation)
- **Hosting**: Vercel (with scheduled cron jobs)
- **Charts**: Recharts

## Project Structure

```
samadhi/
├── app/
│   ├── (auth)/               # Login/signup pages
│   ├── (dashboard)/          # Main app (protected)
│   │   ├── page.tsx          # Overview dashboard
│   │   ├── feedback/         # Feedback list
│   │   ├── insights/         # AI insights & features
│   │   ├── roadmap/          # Kanban roadmap view
│   │   └── settings/         # Profile & CRM setup
│   ├── api/
│   │   ├── feedback/         # Feedback CRUD
│   │   ├── features/         # Feature list
│   │   ├── ai/
│   │   │   ├── classify/     # Claude classification
│   │   │   ├── consolidate/  # Claude consolidation
│   │   │   └── roadmap-brief/
│   │   └── crm/              # CRM stubs (Phase 6)
│   ├── globals.css           # Tailwind + theme
│   └── layout.tsx            # Root layout
├── components/
│   ├── feedback/
│   │   ├── FeedbackForm.tsx  # Submit feedback form
│   │   └── FeedbackTable.tsx # Feedback list table
│   └── dashboard/
│       ├── KPICards.tsx      # 4 metric cards
│       └── FeatureRankingChart.tsx # Bar chart
├── lib/
│   ├── supabase/            # Supabase client setup
│   ├── anthropic/           # Claude agents
│   │   ├── classify.ts      # Classification logic
│   │   ├── consolidate.ts   # Consolidation logic
│   │   └── roadmap.ts       # Brief generation
│   └── utils/               # Formatting & helpers
├── types/                    # TypeScript types
├── hooks/                    # Custom React hooks
├── supabase/migrations/      # Database schema
├── middleware.ts            # Auth middleware
├── next.config.js
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── vercel.json              # Cron job config
├── package.json
├── .env.example
├── .gitignore
└── README.md (this file)
```

## Setup (5 Steps)

### Step 1: Get API Keys

**Supabase:**
1. Go to https://supabase.com → Create new project
2. Go to Settings → API → Copy `Project URL` and `anon public key`

**Anthropic:**
1. Go to https://console.anthropic.com → API Keys
2. Create new key, copy it

### Step 2: Set Environment Variables

```bash
cp .env.example .env.local
```

Then fill in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxx...
ANTHROPIC_API_KEY=sk-ant-xxx
NEXTAUTH_SECRET=your-secret-here
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### Step 3: Set Up Database

1. Open Supabase dashboard → SQL Editor
2. Copy content from `supabase/migrations/001_initial.sql`
3. Paste and run it

This creates all tables, indexes, and row-level security policies.

### Step 4: Create an Organization

Since auth creates users but needs an org, run this SQL:

```sql
INSERT INTO organizations (name, slug) VALUES ('My Company', 'my-company');

-- Then insert a profile for your user (replace with your auth user ID)
INSERT INTO profiles (id, org_id, full_name, role) 
VALUES ('your-uuid-here', 'org-uuid-here', 'Your Name', 'admin');
```

After signing up, check the Supabase auth dashboard to get your user UUID.

### Step 5: Run Locally

```bash
npm install
npm run dev
```

Visit http://localhost:3000 → you'll be redirected to /login

### Step 6: Deploy to Vercel

```bash
npm i -g vercel
vercel
```

In Vercel dashboard:
1. Go to Settings → Environment Variables
2. Add all keys from `.env.local`
3. Redeploy

Cron job (consolidate feedback every night at 2 AM) will run automatically.

## How It Works

### 1. Sales Rep Submits Feedback

1. Go to /dashboard/feedback
2. Enter account name, ARR, and what customer said
3. Click "Submit Feedback"

Behind the scenes:
- Feedback is stored in `feedback` table
- Account is created or found
- Async classification job is triggered

### 2. Claude Classifies Feedback (Async)

Claude reads the raw text and returns:
- **Category**: feature_request, bug_report, churn_risk, competitive_intel, pricing_concern, etc.
- **Sentiment**: positive, neutral, negative
- **Urgency Score**: 1-10 scale
- **Tags**: Custom labels

This updates the feedback record.

### 3. Every Night: Consolidate Feedback

At 2 AM UTC (configurable in `vercel.json`), a cron job runs:

1. Fetches all `feature_request` feedback items
2. Sends them to Claude with instruction to "group by theme"
3. Claude groups similar items and returns:
   - Feature title (max 8 words)
   - Description (2-3 sentences)
   - List of feedback IDs in that group
4. Creates `feature_requests` records with:
   - Total revenue weight (sum of ARR)
   - Account count
   - Feedback IDs

### 4. Product Manager Views Insights

Go to /dashboard/insights:
- See consolidated features sorted by revenue impact
- Select a feature to view full details
- Click "Generate Roadmap Brief" to have Claude write a product spec
- Claude generates:
  - One-pager markdown
  - Acceptance criteria checklist
  - Priority rationale (based on ARR at stake)

### 5. View on Roadmap

Go to /dashboard/roadmap:
- Kanban-style board with 4 columns: Backlog, Planned, In Progress, Shipped
- Each card shows feature title, total ARR, and number of accounts
- (Drag-to-move is a Phase 5 feature)

## API Endpoints

### Feedback
- `GET /api/feedback` - Fetch all feedback for org
- `POST /api/feedback` - Create new feedback
- `PATCH /api/feedback/[id]` - Update feedback status

### Features
- `GET /api/features` - Fetch consolidated features

### AI Agents
- `POST /api/ai/classify` - Classify a feedback item
- `POST /api/ai/consolidate` - Run consolidation (called by cron)
- `POST /api/ai/roadmap-brief` - Generate product brief

### CRM (Phase 6)
- `POST /api/crm/salesforce` - Coming soon
- `POST /api/crm/hubspot` - Coming soon
- `POST /api/webhooks/crm` - CRM webhook handler

## Build Phases

- ✅ **Phase 1**: Foundation (project scaffold)
- ✅ **Phase 2**: Auth (magic link login via Supabase)
- ✅ **Phase 3**: Feedback capture + AI classification
- ✅ **Phase 4**: AI consolidation + feature dashboard
- 🔲 **Phase 5**: Product roadmap view (Kanban drag-to-move)
- 🔲 **Phase 6**: Salesforce + HubSpot CRM integration
- 🔲 **Phase 7**: Email notifications (Resend) + Slack alerts

## Key Design Decisions

1. **Fire-and-Forget Classification**: Feedback submission returns immediately while classification happens async
2. **Server-Side Rendering**: Dashboard pages are SSR for fast loads and SEO
3. **Row-Level Security**: All data access controlled at the database level
4. **Vercel Cron**: Consolidation runs on a schedule, not on-demand (cheaper, more stable)
5. **Claude Opus 4.6**: Best quality for classification and consolidation (vs. faster models)

## Common Tasks

### Add a New Feedback Category

1. Update `FeedbackCategory` type in `types/index.ts`
2. Update SQL enum check in `supabase/migrations/001_initial.sql`
3. Update Claude prompts in `lib/anthropic/classify.ts`
4. Update UI colors in `lib/utils/index.ts` (getCategoryColor)

### Change Cron Schedule

Edit `vercel.json`:
```json
"schedule": "0 3 * * *"  // 3 AM instead of 2 AM
```

### Query Raw Data

In Supabase SQL Editor:
```sql
-- All feedback for org
SELECT f.*, a.name as account_name 
FROM feedback f
JOIN accounts a ON f.account_id = a.id
WHERE f.org_id = 'your-org-id'
ORDER BY f.created_at DESC;

-- Features by revenue
SELECT * FROM feature_requests
WHERE org_id = 'your-org-id'
ORDER BY total_revenue_weight DESC;
```

## Debugging

### Check Classification Worker

If feedback isn't getting classified:
1. Check Vercel Function Logs (Deployments → Function Logs)
2. Check Supabase Logs (SQL Editor → View query logs)
3. Manually trigger: `POST /api/ai/classify` with `{ feedback_id: "..." }`

### Check Cron Job

1. Go to Vercel dashboard → Cron Jobs
2. See when it last ran and any errors
3. Manually trigger consolidation: `curl -X POST https://your-domain.com/api/ai/consolidate`

### Database Issues

If you can't query data:
1. Check RLS policies: Supabase → Authentication → Policies
2. Check your org_id matches: `SELECT org_id FROM profiles WHERE id = 'your-user-id'`
3. Test with service role key (bypass RLS): Change client to use `SUPABASE_SERVICE_ROLE_KEY`

## Costs Estimate (Monthly)

- **Supabase**: $50 (1GB database)
- **Anthropic API**: $100-500 (depends on feedback volume)
  - Classification: ~$0.003 per request
  - Consolidation: ~$0.01 per batch
- **Vercel**: $20 (pro plan for cron jobs)

**Total**: ~$170-570/month depending on usage

## Support & Questions

- Check the code comments—they explain the logic
- Read the types in `types/index.ts` for data shapes
- Look at example API calls in the React components

---

**Built with Next.js, Supabase, and Claude API.**
