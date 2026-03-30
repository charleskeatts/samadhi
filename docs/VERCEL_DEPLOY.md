# Deploying Clairio to Vercel

Follow these steps once. After this, every `git push` to `main` auto-deploys.

---

## Step 0: Set up Supabase database

Before deploying, run both migrations in your Supabase project's SQL Editor
(Dashboard → SQL Editor → New query):

1. Copy and run `supabase/migrations/001_initial.sql` — creates all tables, indexes, and RLS policies
2. Copy and run `supabase/migrations/002_backlog_columns.sql` — adds `category` and `blocker_score` to feature_requests

Run them **in order**. Each one only needs to be run once.

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
