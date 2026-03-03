# Phase B Beta — Clairio Polish & Harden
**Date:** 2026-03-02
**Author:** Charles Keatts
**Status:** Approved

---

## Goal

Make Clairio usable by real beta users without any help from Charles. A stranger should be able to go to the URL, sign up, create their company, and start submitting feedback — on their own.

---

## What We're Fixing (5 Areas)

### 1. Self-Serve Onboarding Flow

**The problem:** Right now, after a user confirms their email and clicks the magic link, they land on a blank dashboard. The database has no company or profile record for them — so everything shows as empty and broken.

**The fix:** After email confirmation, redirect new users to a simple `/onboarding` page that asks for their company name. Clicking "Get Started" creates their organization and profile in the database, then lands them on the dashboard ready to go.

**Flow:**
```
Sign Up → Check Email → Click Magic Link → /onboarding (enter company name) → Dashboard
```

**Returning users** (who already have an org) skip onboarding and go straight to dashboard.

---

### 2. Rebrand: Samadhi → Clairio

**The problem:** Every page says "Samadhi." Beta users will be confused.

**The fix:** Replace all instances of "Samadhi" with "Clairio" across:
- Login page
- Signup page
- Onboarding page
- Dashboard layout / nav
- Page titles (browser tab)
- Any remaining UI text

Apply the Clairio design system colors throughout:
- Primary background: `#0D1B3E` (Navy)
- Section headers: `#1565C0` (Blue)
- Accents: `#1E88E5` (Light Blue)
- Highlights: `#F0A500` (Gold)
- Positive metrics: `#00897B` (Green)

---

### 3. Empty States

**The problem:** When a new user lands on Feedback, Insights, or Roadmap with no data yet, pages show nothing. No guidance on what to do.

**The fix:** Every page gets a friendly "zero state" — a short message and a call-to-action button pointing them to the right next step.

| Page | Empty State Message | CTA |
|------|--------------------|----|
| Dashboard | "Welcome to Clairio. Start by logging your first piece of customer feedback." | → Go to Feedback |
| Feedback | "No feedback yet. Log what your customers are asking for." | → Submit Feedback button |
| Insights | "No insights yet. Insights appear after feedback is submitted and classified by AI." | → Go to Feedback |
| Roadmap | "Your roadmap is empty. Features appear here once AI consolidates your feedback (runs nightly)." | → Go to Insights |

---

### 4. Error Handling

**The problem:** When Claude's AI fails, or the network drops, the app goes silent. Users don't know if something worked or not.

**The fix:**
- **Feedback form:** Show a clear success message after submit ("Feedback saved! AI classification is running in the background.")
- **Claude API failure:** If classification or brief generation fails, show a friendly message ("Something went wrong with AI processing. Your data was saved — try again in a moment.")
- **Form validation:** Highlight missing fields before submit (e.g., if ARR is blank, show "Please enter an ARR value")
- **Network errors:** Generic "Connection error — please check your internet and try again" message

---

### 5. Remove False Claims

**The problem:** The login page displays "SOC 2 Type II" and "TLS 1.3 Encrypted" badges. TLS is real. SOC 2 is not — Clairio is not certified. This is a legal risk with real users.

**The fix:** Remove the SOC 2 badge. Keep TLS if desired, or remove both and replace with a simple "Secured by Supabase" note.

---

## What We Are NOT Building

To keep Phase B focused:
- ❌ Team invites / multi-user orgs
- ❌ Salesforce / HubSpot integration (Phase 6 stubs stay as-is)
- ❌ Email notifications
- ❌ Loading skeletons / animations
- ❌ Mobile responsiveness audit
- ❌ Drag-to-move roadmap

---

## Files That Will Change

| File | Change |
|------|--------|
| `app/(auth)/callback/route.ts` | After session exchange, check if profile exists → redirect to `/onboarding` if not |
| `app/(auth)/signup/page.tsx` | Rebrand to Clairio, apply design system colors |
| `app/(auth)/login/page.tsx` | Rebrand to Clairio, remove SOC 2 badge |
| `app/(auth)/onboarding/page.tsx` | **New file** — collect company name, create org + profile |
| `app/api/onboarding/route.ts` | **New file** — API route to create org + profile in Supabase |
| `app/(dashboard)/layout.tsx` | Rebrand nav to Clairio, apply design system |
| `app/(dashboard)/page.tsx` | Empty state for 0-data dashboard |
| `app/(dashboard)/feedback/page.tsx` | Empty state, success/error messages on submit |
| `app/(dashboard)/insights/page.tsx` | Empty state, error handling for brief generation |
| `app/(dashboard)/roadmap/page.tsx` | Empty state |
| `components/feedback/FeedbackForm.tsx` | Form validation, success/error feedback |

---

## Success Criteria

Phase B is done when:
1. A brand-new user can sign up, create their company, and reach the dashboard — with zero help
2. Every page says "Clairio" — not "Samadhi"
3. No page shows a blank screen — every zero state has a message and next step
4. Submitting feedback shows a clear success or error message
5. The SOC 2 badge is gone
