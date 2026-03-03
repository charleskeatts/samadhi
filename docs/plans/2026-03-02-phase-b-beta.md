# Phase B Beta — Clairio Polish & Harden Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Clairio usable by real beta users without any help from Charles — self-serve signup, correct branding, friendly empty states, and visible error messages.

**Architecture:** Add a `/onboarding` page between email confirmation and dashboard that creates the user's org + profile in Supabase. Fix the middleware auth guard (currently broken). Rebrand all UI from Samadhi → Clairio using the design system. Add error/empty states throughout.

**Tech Stack:** Next.js 14 App Router · TypeScript · Supabase (server + client) · Tailwind CSS · Lucide React icons

**Verification method:** No test suite exists. After each task, run `npm run build` to confirm no TypeScript errors, then manually verify in browser at `http://localhost:3000`.

---

## Task 1: Fix the Middleware Auth Guard

**The problem:** `middleware.ts` checks `response.headers.get('x-supabase-session')` — a header that is never set. Dashboard protection is currently broken; anyone can access `/dashboard` without logging in.

**Files:**
- Modify: `middleware.ts`
- Modify: `lib/supabase/middleware.ts`

**Step 1: Update `lib/supabase/middleware.ts` to return user info**

Replace the entire file with:

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response = NextResponse.next({
              request: { headers: request.headers },
            });
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session and return whether user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  return { response, user };
}
```

**Step 2: Update `middleware.ts` to use the returned user**

Replace the entire file with:

```typescript
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  // Always allow: static files, API auth callback, onboarding
  if (
    pathname.startsWith('/api/auth') ||
    pathname === '/onboarding'
  ) {
    return response;
  }

  // Protect dashboard — redirect to login if not authenticated
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect authenticated users away from login/signup to dashboard
  if (pathname === '/login' || pathname === '/signup') {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

**Step 3: Verify it compiles**

```bash
npm run build
```
Expected: Build completes with no TypeScript errors.

**Step 4: Commit**

```bash
git add middleware.ts lib/supabase/middleware.ts
git commit -m "fix: repair middleware auth guard — was checking non-existent header"
```

---

## Task 2: Create the Onboarding API Route

This API endpoint receives a company name, creates the `organizations` record, then creates the `profiles` record linking the new user to that org.

**Files:**
- Create: `app/api/onboarding/route.ts`

**Step 1: Create the file**

```typescript
/**
 * Onboarding API
 * Creates org + profile for a newly confirmed user.
 * Called once per user, right after email confirmation.
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { company_name, full_name, role } = await request.json();

    if (!company_name?.trim()) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if profile already exists (prevent duplicate orgs)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (existingProfile) {
      return NextResponse.json({ error: 'Profile already exists' }, { status: 409 });
    }

    // Create slug from company name (lowercase, hyphens)
    const slug = company_name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Create the organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: company_name.trim(), slug })
      .select('id')
      .single();

    if (orgError) {
      console.error('Error creating org:', orgError);
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
    }

    // Create the user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        org_id: org.id,
        full_name: full_name || user.email?.split('@')[0] || 'Admin',
        role: role || 'admin',
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Clean up the org we just created
      await supabase.from('organizations').delete().eq('id', org.id);
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true, org_id: org.id });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Step 2: Verify it compiles**

```bash
npm run build
```
Expected: No errors.

**Step 3: Commit**

```bash
git add app/api/onboarding/route.ts
git commit -m "feat: add onboarding API route — creates org + profile for new users"
```

---

## Task 3: Create the Onboarding Page

A simple page that appears after email confirmation for brand-new users. Collects company name and calls the API from Task 2.

**Files:**
- Create: `app/(auth)/onboarding/page.tsx`

**Step 1: Create the file**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';

export default function OnboardingPage() {
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: companyName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Success — go to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #0D1B3E 0%, #1565C0 100%)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="w-10 h-10" style={{ color: '#F0A500' }} />
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Trebuchet MS, sans-serif' }}>
              Clairio
            </h1>
          </div>
          <p style={{ color: '#CADCFC' }} className="font-medium">One last step — set up your workspace</p>
        </div>

        {/* Card */}
        <div className="rounded-xl shadow-2xl p-8 border" style={{ backgroundColor: '#0A1628', borderColor: '#1565C0' }}>
          <h2 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: 'Trebuchet MS, sans-serif' }}>
            What&apos;s your company called?
          </h2>
          <p className="text-sm mb-6" style={{ color: '#7A9CC0' }}>
            This creates your Clairio workspace. You can&apos;t change this later.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-white mb-1">
                Company name
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Inc."
                required
                autoFocus
                className="w-full px-4 py-2 rounded-lg border text-white placeholder-slate-400 focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: '#0D1B3E',
                  borderColor: '#1565C0',
                  fontFamily: 'Calibri, sans-serif',
                }}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: '#3B0000', borderColor: '#7F0000', color: '#FCA5A5' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !companyName.trim()}
              className="w-full py-2 px-4 rounded-lg font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#1565C0', fontFamily: 'Trebuchet MS, sans-serif' }}
            >
              {loading ? 'Setting up your workspace...' : 'Get Started →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify it compiles**

```bash
npm run build
```
Expected: No errors.

**Step 3: Commit**

```bash
git add app/(auth)/onboarding/page.tsx
git commit -m "feat: add onboarding page — collects company name for new users"
```

---

## Task 4: Update the Auth Callback to Route New Users to Onboarding

After a user confirms their email, the callback currently always redirects to `/`. We need to check if they have a profile yet — if not, send them to `/onboarding`.

**Files:**
- Modify: `app/(auth)/callback/route.ts`

**Step 1: Replace the entire file**

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);

    // Check if this user already has a profile (returning user)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      // New user — no profile yet → onboarding
      if (!profile) {
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }
    }
  }

  // Returning user — go straight to dashboard
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
```

**Step 2: Verify it compiles**

```bash
npm run build
```
Expected: No errors.

**Step 3: Manual verification plan** (do this after `npm run dev`)

1. Open an incognito browser window
2. Go to `http://localhost:3000/signup`
3. Sign up with a new email
4. Click the link in your email
5. You should land on `/onboarding` — not `/dashboard`
6. Enter a company name and click "Get Started"
7. You should land on `/dashboard`

**Step 4: Commit**

```bash
git add app/(auth)/callback/route.ts
git commit -m "feat: route new users to onboarding after email confirmation"
```

---

## Task 5: Rebrand Login Page to Clairio

Replace "Samadhi" with "Clairio", apply design system colors, and remove the fake SOC 2 badge.

**Files:**
- Modify: `app/(auth)/login/page.tsx`

**Step 1: Replace the entire file**

```tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Zap } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #0D1B3E 0%, #1565C0 100%)' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="w-10 h-10" style={{ color: '#F0A500' }} />
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Trebuchet MS, sans-serif' }}>
              Clairio
            </h1>
          </div>
          <p style={{ color: '#CADCFC' }} className="font-medium">Revenue-weighted product intelligence</p>
        </div>

        {/* Card */}
        <div className="rounded-xl shadow-2xl p-8 border" style={{ backgroundColor: '#0A1628', borderColor: '#1565C0' }}>
          {!submitted ? (
            <>
              <h2 className="text-xl font-semibold text-white mb-6" style={{ fontFamily: 'Trebuchet MS, sans-serif' }}>
                Sign in to your account
              </h2>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                    Work email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full px-4 py-2 rounded-lg border text-white placeholder-slate-400 focus:outline-none focus:ring-2"
                    style={{ backgroundColor: '#0D1B3E', borderColor: '#1565C0' }}
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: '#3B0000', color: '#FCA5A5' }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 rounded-lg font-semibold text-white transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: '#1565C0', fontFamily: 'Trebuchet MS, sans-serif' }}
                >
                  {loading ? 'Sending...' : 'Send Magic Link'}
                </button>
              </form>

              <p className="text-center text-sm mt-6" style={{ color: '#7A9CC0' }}>
                New to Clairio?{' '}
                <Link href="/signup" className="font-medium hover:underline" style={{ color: '#1E88E5' }}>
                  Create account
                </Link>
              </p>
            </>
          ) : (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#00897B' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: 'Trebuchet MS, sans-serif' }}>
                Check your email
              </h3>
              <p className="text-sm mb-4" style={{ color: '#7A9CC0' }}>
                We sent a magic link to <span className="font-medium text-white">{email}</span>
              </p>
              <p className="text-xs" style={{ color: '#7A9CC0' }}>
                Click the link to sign in. It expires in 24 hours.
              </p>
              <button
                onClick={() => { setSubmitted(false); setEmail(''); }}
                className="mt-6 text-sm font-medium hover:underline"
                style={{ color: '#1E88E5' }}
              >
                Try a different email
              </button>
            </div>
          )}
        </div>

        {/* Footer — honest security note */}
        <p className="text-center text-xs mt-6" style={{ color: '#7A9CC0' }}>
          Secured by Supabase · Passwordless sign-in
        </p>
      </div>
    </div>
  );
}
```

**Step 2: Verify + commit**

```bash
npm run build
git add app/(auth)/login/page.tsx
git commit -m "rebrand: login page → Clairio design system, remove SOC 2 badge"
```

---

## Task 6: Rebrand Signup Page to Clairio

**Files:**
- Modify: `app/(auth)/signup/page.tsx`

**Step 1: Replace the entire file**

```tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Zap } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'sales_rep' | 'product_manager'>('sales_rep');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: Math.random().toString(36).slice(2),
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          data: { full_name: fullName, role },
        },
      });
      if (signUpError) throw signUpError;
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #0D1B3E 0%, #1565C0 100%)' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="w-10 h-10" style={{ color: '#F0A500' }} />
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Trebuchet MS, sans-serif' }}>
              Clairio
            </h1>
          </div>
          <p style={{ color: '#CADCFC' }} className="font-medium">Revenue-weighted product intelligence</p>
        </div>

        {/* Card */}
        <div className="rounded-xl shadow-2xl p-8 border" style={{ backgroundColor: '#0A1628', borderColor: '#1565C0' }}>
          {!submitted ? (
            <>
              <h2 className="text-xl font-semibold text-white mb-6" style={{ fontFamily: 'Trebuchet MS, sans-serif' }}>
                Create your account
              </h2>

              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-white mb-1">
                    Full name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    className="w-full px-4 py-2 rounded-lg border text-white placeholder-slate-400 focus:outline-none focus:ring-2"
                    style={{ backgroundColor: '#0D1B3E', borderColor: '#1565C0' }}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                    Work email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full px-4 py-2 rounded-lg border text-white placeholder-slate-400 focus:outline-none focus:ring-2"
                    style={{ backgroundColor: '#0D1B3E', borderColor: '#1565C0' }}
                  />
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-white mb-1">
                    Your role
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'sales_rep' | 'product_manager')}
                    className="w-full px-4 py-2 rounded-lg border text-white focus:outline-none focus:ring-2"
                    style={{ backgroundColor: '#0D1B3E', borderColor: '#1565C0' }}
                  >
                    <option value="sales_rep">Sales Representative</option>
                    <option value="product_manager">Product Manager</option>
                  </select>
                </div>

                {error && (
                  <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: '#3B0000', color: '#FCA5A5' }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 rounded-lg font-semibold text-white transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: '#1565C0', fontFamily: 'Trebuchet MS, sans-serif' }}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>

              <p className="text-center text-sm mt-6" style={{ color: '#7A9CC0' }}>
                Already have an account?{' '}
                <Link href="/login" className="font-medium hover:underline" style={{ color: '#1E88E5' }}>
                  Sign in
                </Link>
              </p>
            </>
          ) : (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#00897B' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: 'Trebuchet MS, sans-serif' }}>
                Check your email
              </h3>
              <p className="text-sm mb-4" style={{ color: '#7A9CC0' }}>
                We sent a confirmation link to <span className="font-medium text-white">{email}</span>
              </p>
              <p className="text-xs" style={{ color: '#7A9CC0' }}>
                Click the link in your email to confirm your account. It expires in 24 hours.
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#7A9CC0' }}>
          Secured by Supabase · Passwordless sign-in
        </p>
      </div>
    </div>
  );
}
```

**Step 2: Verify + commit**

```bash
npm run build
git add app/(auth)/signup/page.tsx
git commit -m "rebrand: signup page → Clairio design system"
```

---

## Task 7: Rebrand Dashboard Layout / Nav

Replace "Samadhi" with "Clairio" in the sidebar and mobile header. Apply design system navy background.

**Files:**
- Modify: `app/(dashboard)/layout.tsx`

**Step 1: Replace the two "Samadhi" text occurrences and update sidebar background color**

Find this block (mobile header, line ~43):
```tsx
<span className="font-bold text-slate-900">Samadhi</span>
```
Replace with:
```tsx
<span className="font-bold" style={{ color: '#0D1B3E', fontFamily: 'Trebuchet MS, sans-serif' }}>Clairio</span>
```

Find this block (sidebar logo, line ~65):
```tsx
<span className="font-bold text-lg">Samadhi</span>
```
Replace with:
```tsx
<span className="font-bold text-lg" style={{ fontFamily: 'Trebuchet MS, sans-serif' }}>Clairio</span>
```

Update the Zap icon in sidebar to use Gold color (line ~64):
```tsx
<Zap className="w-6 h-6 text-sky-400" />
```
Replace with:
```tsx
<Zap className="w-6 h-6" style={{ color: '#F0A500' }} />
```

Update the sidebar background from `bg-slate-900` to use Navy (line ~57):
```tsx
className={cn(
  'fixed md:static inset-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out md:transform-none',
```
Replace with:
```tsx
className={cn(
  'fixed md:static inset-0 z-40 w-64 text-white transform transition-transform duration-200 ease-in-out md:transform-none',
```
And add `style={{ backgroundColor: '#0D1B3E' }}` to the `<aside>` element.

Update the active nav item from `bg-sky-500` to use Light Blue:
```tsx
? 'bg-sky-500 text-white'
```
Replace with:
```tsx
? 'text-white'
```
And handle the active state with inline style. Or simply: replace `bg-sky-500` with `bg-blue-700`.

**Step 2: Verify + commit**

```bash
npm run build
git add app/(dashboard)/layout.tsx
git commit -m "rebrand: dashboard layout → Clairio name and navy sidebar"
```

---

## Task 8: Improve Dashboard Empty State for New Users

When `stats` is null (user has no profile) OR when all counts are zero, show a welcoming first-time message.

**Files:**
- Modify: `app/(dashboard)/page.tsx`

**Step 1: Replace the `if (!stats)` block and add an isEmpty check**

Find:
```tsx
if (!stats) {
  return <div className="text-center py-12">Loading...</div>;
}
```

Replace with:
```tsx
if (!stats) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-5xl mb-4">🧠</div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2" style={{ fontFamily: 'Trebuchet MS, sans-serif' }}>
        Welcome to Clairio
      </h2>
      <p className="text-slate-500 max-w-sm mb-6">
        Your workspace is ready. Start by logging your first piece of customer feedback.
      </p>
      <a
        href="/dashboard/feedback"
        className="px-6 py-2 rounded-lg text-white font-semibold"
        style={{ backgroundColor: '#1565C0', fontFamily: 'Trebuchet MS, sans-serif' }}
      >
        Log First Feedback →
      </a>
    </div>
  );
}
```

Also add an `isEmpty` check after the stats block (add this before the `return` statement):

```tsx
const isEmpty = stats.feedbackCount === 0;
```

Then wrap the KPI cards + grid in a conditional. After `<KPICards ... />`, add:

```tsx
{isEmpty && (
  <div className="rounded-xl border-2 border-dashed border-slate-200 p-10 text-center">
    <div className="text-4xl mb-3">📥</div>
    <h3 className="text-lg font-semibold text-slate-700 mb-2" style={{ fontFamily: 'Trebuchet MS, sans-serif' }}>
      No feedback yet
    </h3>
    <p className="text-slate-500 text-sm mb-4">
      Log feedback from a customer call to see revenue-weighted insights here.
    </p>
    <a
      href="/dashboard/feedback"
      className="inline-block px-5 py-2 rounded-lg text-white text-sm font-semibold"
      style={{ backgroundColor: '#1565C0' }}
    >
      Log Feedback →
    </a>
  </div>
)}
```

**Step 2: Verify + commit**

```bash
npm run build
git add app/(dashboard)/page.tsx
git commit -m "ux: improve dashboard empty state for new users"
```

---

## Task 9: Fix Insights Page Error Handling

The "Generate Brief" button silently fails on error. Show a visible error message when it fails.

**Files:**
- Modify: `app/(dashboard)/insights/page.tsx`

**Step 1: Add a `briefError` state**

After the existing state declarations (around line 17), add:
```tsx
const [briefError, setBriefError] = useState<string | null>(null);
```

**Step 2: Update `handleGenerateBrief` to set the error**

Replace the `catch` block in `handleGenerateBrief`:
```tsx
} catch (error) {
  console.error('Error generating brief:', error);
}
```
With:
```tsx
} catch (error) {
  console.error('Error generating brief:', error);
  setBriefError('AI brief generation failed. Your data is safe — please try again in a moment.');
}
```

Also add `setBriefError(null)` at the top of `handleGenerateBrief`:
```tsx
const handleGenerateBrief = async (featureId: string) => {
  setGeneratingBrief(featureId);
  setBriefError(null);   // ← add this line
  try {
```

**Step 3: Add error display below the Generate button**

After the Generate Brief `<button>`, add:
```tsx
{briefError && (
  <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: '#3B0000', color: '#FCA5A5' }}>
    {briefError}
  </div>
)}
```

**Step 4: Improve the no-features empty state**

Find the no-features empty state in the features list:
```tsx
<div className="p-4 text-center text-slate-500 text-sm">
  No features yet. Feedback items will be consolidated by AI.
</div>
```
Replace with:
```tsx
<div className="p-6 text-center">
  <div className="text-3xl mb-3">🧠</div>
  <p className="text-sm font-medium text-slate-700 mb-1">No insights yet</p>
  <p className="text-xs text-slate-500 mb-4">
    Insights appear after feedback is submitted and the AI runs its nightly consolidation.
  </p>
  <a href="/dashboard/feedback" className="text-xs font-semibold" style={{ color: '#1E88E5' }}>
    Log feedback first →
  </a>
</div>
```

**Step 5: Verify + commit**

```bash
npm run build
git add app/(dashboard)/insights/page.tsx
git commit -m "ux: show error message when AI brief generation fails; improve empty state"
```

---

## Task 10: Improve Roadmap Empty State

**Files:**
- Modify: `app/(dashboard)/roadmap/page.tsx`

**Step 1: Replace the per-column empty state**

Find:
```tsx
<div className="text-center py-8 text-slate-400 text-sm">
  No features
</div>
```
Replace with (only for the `backlog` column — check `column.status === 'backlog'` for the special message):

```tsx
{column.status === 'backlog' ? (
  <div className="text-center py-8">
    <p className="text-slate-400 text-sm mb-2">No features yet</p>
    <a href="/dashboard/feedback" className="text-xs font-semibold" style={{ color: '#1E88E5' }}>
      Log feedback to populate →
    </a>
  </div>
) : (
  <div className="text-center py-8 text-slate-400 text-sm">
    Empty
  </div>
)}
```

To do this, update the empty state section inside `.map()`:

```tsx
) : (
  column.status === 'backlog' ? (
    <div className="text-center py-8">
      <p className="text-slate-400 text-sm mb-2">No features yet</p>
      <a href="/dashboard/feedback" className="text-xs font-semibold" style={{ color: '#1E88E5' }}>
        Log feedback to populate →
      </a>
    </div>
  ) : (
    <div className="text-center py-8 text-slate-400 text-sm">
      Empty
    </div>
  )
)}
```

**Step 2: Verify + commit**

```bash
npm run build
git add app/(dashboard)/roadmap/page.tsx
git commit -m "ux: improve roadmap empty state with link to feedback"
```

---

## Task 11: Full End-to-End Verification

**Step 1: Start dev server**
```bash
npm run dev
```

**Step 2: New user flow (open incognito browser)**

1. Go to `http://localhost:3000`
   ✅ Should redirect to `/login`
2. Click "Create account"
   ✅ Should see Clairio branding (not Samadhi), navy background, gold Zap icon
3. Fill in name, email, role → click "Create Account"
   ✅ Should see "Check your email" confirmation
4. Click the email link
   ✅ Should land on `/onboarding` (not dashboard)
5. Enter company name → click "Get Started"
   ✅ Should land on `/dashboard`
6. Check dashboard shows welcome empty state (not blank or "Loading...")
   ✅ Should see "No feedback yet" with a "Log Feedback" button
7. Click "Log Feedback", submit one feedback entry
   ✅ Should see green success message
8. Check Insights page
   ✅ Should see "No insights yet" with explanation
9. Check Roadmap page
   ✅ Should see "No features yet" with link in Backlog column

**Step 3: Returning user flow (same browser, sign out and back in)**

1. Click "Sign out"
   ✅ Redirects to login
2. Enter same email → click "Send Magic Link"
3. Click email link
   ✅ Should go straight to `/dashboard` (NOT to onboarding)

**Step 4: Check no "Samadhi" remains anywhere**
```bash
grep -r "Samadhi" app/ components/ --include="*.tsx" --include="*.ts"
```
Expected: No results.

**Step 5: Production build check**
```bash
npm run build
```
Expected: Build succeeds with no errors.

**Step 6: Final commit**
```bash
git add -A
git commit -m "chore: Phase B beta complete — Clairio rebrand, onboarding, empty states, error handling"
```

---

## Summary of All Files Changed

| File | Action |
|------|--------|
| `middleware.ts` | Fixed — auth guard now actually works |
| `lib/supabase/middleware.ts` | Fixed — returns user from getUser() |
| `app/api/onboarding/route.ts` | **New** — creates org + profile |
| `app/(auth)/onboarding/page.tsx` | **New** — company name collection UI |
| `app/(auth)/callback/route.ts` | Updated — routes new users to onboarding |
| `app/(auth)/login/page.tsx` | Rebranded + SOC 2 badge removed |
| `app/(auth)/signup/page.tsx` | Rebranded |
| `app/(dashboard)/layout.tsx` | Rebranded sidebar/nav |
| `app/(dashboard)/page.tsx` | Better empty state for new users |
| `app/(dashboard)/insights/page.tsx` | Error handling + empty state |
| `app/(dashboard)/roadmap/page.tsx` | Better empty state |
