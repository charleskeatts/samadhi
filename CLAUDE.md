# CLAUDE.md

This file provides guidance for AI assistants (Claude and others) working in this repository.

## About the Founder

Charles Keatts is the solo founder of Clairio / Samadi Consulting LLC. Background in tech sales (9 years at IBM, $200M+ in cloud revenue, 250+ enterprise accounts). He's re-entering hands-on coding after a gap and has ADHD and autistic tendencies.

**How to communicate and assist effectively:**
- Be direct and concrete. Lead with the answer or next action — skip preamble.
- Break multi-step tasks into small, clearly numbered steps. Don't skip "obvious" steps.
- When context-switching between tools (Supabase, GitHub, Vercel, etc.), briefly orient: "We're now in Vercel — this is where..."
- If something is going sideways, flag it plainly and suggest a reset point.
- Explain *why* a step matters when it's non-obvious. "We do this so that..." helps it stick.
- Avoid walls of text. Use short paragraphs, bullets, and headers.
- If he gives a vague instruction, make a reasonable interpretation, state it, and proceed.

**Stack areas he's actively getting up to speed on:**
- Supabase (database, auth, storage, edge functions)
- GitHub (repos, branches, PRs, Actions)
- Vercel (deployments, env vars, preview URLs)
- Claude API / agentic AI tooling

---

## Project: Clairio

**Repo:** `samadhi` (the repo is named samadhi; the product is Clairio)
**Legal entity:** Samadi Consulting LLC, California LLC, founded February 1, 2026
**Stage:** Pre-revenue, pre-seed, bootstrapped
**HQ:** San Francisco, CA

### What Clairio Does

Clairio is a **revenue-weighted sales intelligence platform** for B2B SaaS companies. It transforms customer feedback from Salesforce into ARR-weighted, ranked feature backlogs for Sales, Product, and Engineering teams.

> "Clairio shows a VP of Sales exactly which unbuilt features are putting the most ARR at risk — automatically, from their existing Salesforce data."

**The core insight:** Sales hears what customers need. Product never receives it in structured, revenue-weighted form. Competitors (Productboard, Gong, Gainsight) solve adjacent problems — not this one.

**The magic moment:** A design partner sees `Enterprise SSO → $4.1M ARR requesting it` and says: *"Wait… how did we not know this already?"*

---

## MVP Architecture

**Radically simple. Do not over-engineer.**

```
Salesforce CSV (or OAuth)  →  Claude  →  Feature extraction  →  ARR join  →  Dashboard
```

### The 5 Steps

1. **Get the data** — CSV upload (build first) or Salesforce OAuth API (build second)
2. **Extract feature requests** — Send Cases + Opportunity notes to Claude with a structured prompt
3. **Join with ARR** — Connect extracted features to `Opportunity.Amount` from Salesforce
4. **Aggregate themes** — Claude groups similar requests (SAML SSO + Okta login + Azure AD → "Enterprise SSO") and sums ARR
5. **Show the dashboard** — A simple ranked table is enough for the first demo:

| Rank | Feature Request | ARR Impact | Priority |
|------|----------------|------------|----------|
| 1 | Enterprise SSO | $4.1M | CRITICAL |
| 2 | Salesforce Sync | $2.8M | HIGH |
| 3 | Advanced Reporting | $1.9M | HIGH |

### What the MVP Does NOT Include (v2/v3)

Do not build these yet:
- IBM watsonx integration
- Perplexity API / live signals
- Google Vertex / Gemini
- Slack or email ingestion
- Multi-agent orchestration
- Proactive alerts / Slack push
- Pattern agents

### MVP Tooling

| Component | Tool |
|-----------|------|
| Data input | CSV upload (Salesforce export) |
| LLM | Claude API |
| Data storage | Google Sheets / Airtable / Supabase (simple) |
| Dashboard | Retool / Streamlit / simple table |

---

## Salesforce Data Architecture

### Access Methods (in priority order)

1. **CSV Upload (build now)** — Every Salesforce customer exports in 60 seconds. Gets design partners using the product immediately.
2. **OAuth API (build second)** — Standard REST API using OAuth 2.0. No Salesforce approval needed.
3. **AppExchange (build later)** — One-click install; requires Salesforce security review (weeks/months).

### Key Salesforce Objects

```
GET /services/data/v59.0/sobjects/Account/      → Accounts (name, ARR, industry)
GET /services/data/v59.0/sobjects/Opportunity/  → Opportunities (value, stage, notes)
GET /services/data/v59.0/sobjects/Case/         → Cases (subject, description, feedback)
```

### Claude Extraction Prompt Pattern

```
You are analyzing B2B SaaS customer feedback.
Extract product feature requests. Return:
  Feature Request | Account Name | Description | Confidence
```

---

## Current Build Status (as of March 2026)

**Done:**
- Company launched (Samadi Consulting LLC, Feb 1)
- Pitch deck, financial model, one-pager
- Partner outreach emails drafted (Perplexity, IBM, Google, Anthropic, AWS)
- Claude Code build started

**In Progress:**
- Synthetic demo data (30–50 realistic B2B SaaS accounts)
- Google Cloud intro email (drafted, ready to send)
- Perplexity outreach (drafted, ready to send)

**Next:**
- Claude extraction prompt working on sample data
- ARR join logic
- MVP dashboard live
- Show demo to 10 companies from IBM network
- 3 design partner agreements signed

---

## Pricing

Flat annual pricing (not per-seat):

| Tier | Price | Includes |
|------|-------|---------|
| Starter | $12,000/year | Up to 10 Salesforce users, CSV + OAuth, core dashboard |
| Growth | $20,000/year | Up to 30 users, all data sources, Slack alerts |
| Enterprise | $30,000+/year | Unlimited users, custom integrations, dedicated support |

---

## Go-to-Market

**Priority #1: Design partners — before any partnerships.**

- Build demo → Show to 10 IBM network companies → Get 3 design partners → Iterate → Case studies
- Design partner ask: free 90-day use in exchange for weekly feedback, case study rights, one reference call
- Partner channels (IBM co-sell, AWS Marketplace, Salesforce AppExchange, Google Cloud) activate *after* first case study

**ICP:** VP of Sales / CRO / VP Product at B2B SaaS companies ($10M–$500M ARR) using Salesforce with 10+ Sales and 5+ Product headcount.

---

## 5-Year Financial Snapshot

| Year | Customers | ARR | Net Income |
|------|-----------|-----|------------|
| 2026 | 21 | $420K (revised) | ~($303K) |
| 2027 | 66 | $693K | $186K |
| 2028 | 153 | $1.84M | $1.2M |
| 2029 | 291 | $3.94M | $3.1M |
| 2030 | 529 | $7.9M | $6.8M |

Year 1 is in the red — expected. Consulting revenue ($250–350/hr GPU/AI advisory) bridges the gap. Profitable in Year 2.

---

## Development Conventions

### Branches
- All AI-assisted development uses branches prefixed `claude/`
- Never push directly to `main` or `master`
- Always push with `-u`: `git push -u origin <branch-name>`

### Commits
- Imperative style: `Add X`, `Fix Y`, `Refactor Z`
- One logical change per commit

### General Rules for AI Assistants
**Do:**
- Read existing files before modifying them
- Keep changes minimal and focused
- Use the simplest solution that works
- Update this CLAUDE.md when the project structure meaningfully changes

**Don't:**
- Add unrequested features, abstractions, or refactors
- Add comments/docstrings to code you didn't change
- Create files unless strictly necessary
- Introduce security vulnerabilities (XSS, SQL injection, command injection, etc.)
- Over-engineer — the biggest risk called out by external advisors is over-engineering before validating the demo

---

## IP Notes

- All materials auto-copyrighted at creation
- Trademark for "Clairio" — USPTO filing in progress (~$250–350)
- Mutual NDA (`Clairio_Mutual_NDA.docx`) — send before detailed technical conversations
- All IP assigned to Samadi Consulting LLC
- Do not expose: revenue-weighting algorithm details, agent architecture implementation details, financial model internals
