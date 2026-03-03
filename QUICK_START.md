# Samadhi - Quick Start Guide

For the non-technical user: here's how to get Samadhi running in 15 minutes.

## Prerequisites

You need:
1. A terminal/command line (Mac: Terminal, Windows: PowerShell)
2. Node.js installed (get from nodejs.org - click "LTS")
3. A Supabase account (free at supabase.com)
4. An Anthropic API key (free trial at console.anthropic.com)
5. A Vercel account (optional, for deployment)

## Step 1: Get Your API Keys (5 minutes)

### From Supabase (supabase.com)
1. Create a new project
2. Go to Settings → API
3. Copy the URL (looks like: `https://xxxxx.supabase.co`)
4. Copy the Anon Public Key (starts with `eyJ`)
5. Copy the Service Role Key (longer, also starts with `eyJ`)

### From Anthropic (console.anthropic.com)
1. Click "API Keys"
2. Create new key
3. Copy it

## Step 2: Clone & Setup (5 minutes)

```bash
# Navigate to where you want to put the code
cd ~/Documents

# Copy the samadhi folder here (you got it from the setup)
# OR clone from github if it's there

cd samadhi

# Create your .env.local file
cp .env.example .env.local

# Edit .env.local in your text editor and paste in the keys:
# NEXT_PUBLIC_SUPABASE_URL=your_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# ANTHROPIC_API_KEY=your_anthropic_key
# NEXTAUTH_SECRET=random-string-here
```

To generate NEXTAUTH_SECRET, paste this in terminal:
```bash
openssl rand -base64 32
```

## Step 3: Setup Database (3 minutes)

1. Open Supabase dashboard → SQL Editor
2. Click "New Query"
3. Open the file `supabase/migrations/001_initial.sql` in your text editor
4. Copy the entire content
5. Paste into Supabase SQL Editor
6. Click "Run"

Done! Your database is ready.

## Step 4: Create Your Account (1 minute)

Run this in Supabase SQL Editor:

```sql
-- Find your Org ID first
SELECT id FROM organizations LIMIT 1;

-- If no orgs, create one:
INSERT INTO organizations (name, slug) 
VALUES ('My Company', 'my-company') 
RETURNING id;

-- Now create your profile (replace UUIDs)
-- You'll need:
-- 1. Your user ID (from Auth → Users in Supabase)
-- 2. Your org ID (from above)

INSERT INTO profiles (id, org_id, full_name, role) 
VALUES ('your-user-uuid', 'your-org-uuid', 'Your Name', 'admin');
```

## Step 5: Run It (1 minute)

```bash
npm install
npm run dev
```

Go to http://localhost:3000

You should see the login page!

## Using Samadhi

### Log Feedback
1. Sign in
2. Go to "Feedback"
3. Enter account name, ARR, and what customer said
4. Click Submit

The AI will automatically classify it.

### See Insights
1. Go to "Insights"
2. See features grouped by AI
3. Click "Generate Roadmap Brief" to see product spec

### View Roadmap
1. Go to "Roadmap"
2. See features organized by status
3. (Drag-to-move coming in Phase 5)

## Troubleshooting

**"Cannot find module"**
→ Run `npm install` again

**"Connection refused to Supabase"**
→ Check your NEXT_PUBLIC_SUPABASE_URL in .env.local

**"Unauthorized" errors**
→ Make sure you created a profile (Step 4)

**"API rate limit"**
→ You've submitted too much feedback in one minute. Wait a minute and try again.

## Deploy to Production (Optional)

1. Push code to GitHub
2. Connect GitHub to Vercel
3. Add env vars in Vercel dashboard
4. Deploy!

Cron job (feedback consolidation) runs every night at 2 AM automatically.

## What Happens Automatically

- **When you submit feedback**: AI classifies it (takes 5-10 seconds)
- **Every night at 2 AM**: AI consolidates similar feedback into features
- **When you click "Generate Brief"**: AI writes a product spec (takes 10 seconds)

## What's Coming (Phase 6+)

- Salesforce/HubSpot sync
- Email notifications
- Slack alerts
- Drag-to-move roadmap

## Questions?

Read the README.md file for detailed documentation.

---

**That's it! You're ready to start capturing customer intelligence.**
