#!/bin/bash
set -e

echo ""
echo "========================================="
echo "  Clairio Beta Preflight Check"
echo "========================================="
echo ""

# ── 1. Kill stale process on port 3000 ──────────────────────────────────────
PIDS=$(lsof -i :3000 -t 2>/dev/null || true)
if [ -n "$PIDS" ]; then
  echo "⚠  Port 3000 in use — killing stale process(es): $PIDS"
  echo "$PIDS" | xargs kill -9
  sleep 1
  echo "✓  Port 3000 cleared"
else
  echo "✓  Port 3000 is free"
fi

# ── 2. Check .env.local exists ───────────────────────────────────────────────
if [ ! -f ".env.local" ]; then
  echo ""
  echo "✗  .env.local not found."
  echo "   Run: cp .env.example .env.local  then fill in your keys."
  exit 1
fi
echo "✓  .env.local found"

# ── 3. Validate required env vars ────────────────────────────────────────────
REQUIRED_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "ANTHROPIC_API_KEY"
  "NEXTAUTH_SECRET"
)

MISSING=()
PLACEHOLDER=()

for VAR in "${REQUIRED_VARS[@]}"; do
  VALUE=$(grep "^${VAR}=" .env.local | cut -d'=' -f2- | tr -d '"' | tr -d "'")
  if [ -z "$VALUE" ]; then
    MISSING+=("$VAR")
  elif echo "$VALUE" | grep -qiE "your-|placeholder|example|change.me|sk-ant-your"; then
    PLACEHOLDER+=("$VAR")
  fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
  echo ""
  echo "✗  Missing env vars:"
  for V in "${MISSING[@]}"; do echo "     - $V"; done
  exit 1
fi

if [ ${#PLACEHOLDER[@]} -gt 0 ]; then
  echo ""
  echo "⚠  These env vars still have placeholder values:"
  for V in "${PLACEHOLDER[@]}"; do echo "     - $V"; done
  echo "   Update .env.local before testing."
  exit 1
fi

echo "✓  All required env vars are set"

# ── 4. Check node_modules ────────────────────────────────────────────────────
if [ ! -d "node_modules" ]; then
  echo ""
  echo "⚠  node_modules missing — running npm install..."
  npm install
fi
echo "✓  Dependencies installed"

# ── 5. TypeScript + ESLint build check ──────────────────────────────────────
echo ""
echo "Running build check (TypeScript + ESLint)..."
echo "-----------------------------------------"

if npm run build 2>&1; then
  echo "-----------------------------------------"
  echo "✓  Build passed"
else
  echo "-----------------------------------------"
  echo "✗  Build failed — fix errors above before running beta."
  exit 1
fi

# ── 6. Start dev server ──────────────────────────────────────────────────────
echo ""
echo "========================================="
echo "  All checks passed — starting dev server"
echo "  http://localhost:3000"
echo "========================================="
echo ""

npm run dev
