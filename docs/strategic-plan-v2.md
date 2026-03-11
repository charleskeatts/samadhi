# CLAIRIO — INTERNAL STRATEGIC PLAN
**CONFIDENTIAL · NOT FOR DISTRIBUTION**
Samadi Consulting LLC · Charles Keatts, Founder & CEO · March 2026
Version 2.0 · Revised with external advisor feedback

---

## 00 EXECUTIVE SUMMARY

Clairio is a revenue-weighted sales intelligence platform that transforms B2B SaaS customer feedback into structured, ARR-weighted insights for Sales, Product, and Engineering teams. Founded February 1, 2026, by Charles Keatts following nine years at IBM where he closed $200M+ in cloud revenue across 250+ enterprise accounts.

> **Clairio shows a VP of Sales exactly which unbuilt features are putting the most ARR at risk — automatically, from their existing Salesforce data.**

### External Advisor Scorecard

| Score | Area | Notes |
|-------|------|-------|
| 8/10 | Idea Quality | ARR-weighted backlog is simple, intuitive, and easy to explain. Competitors solve adjacent problems, not this one. |
| 9/10 | Founder-Market Fit | 250 enterprise accounts, IBM network, NVIDIA/Salesforce/Airbnb relationships. Most AI founders have none of that. |
| 7/10 | Execution Plan | Solid — but biggest risk is over-engineering early. MVP must be radically simpler than the full architecture. |
| ⚠️ | Biggest Risk | Over-engineering the AI stack before validating the core demo. The entire outcome depends on whether the MVP feels magical. |

### The Five Most Important Strategic Insights

1. **The Core Idea Is Legitimately Good** — The insight is strong and the positioning is clean: Sales hears the signal, Product never receives it in structured form. Competitors (Productboard, Gong, Gainsight) solve adjacent problems — not this one. That gap is real and Clairio fills it.

2. **Simplify the MVP — Radically** — The full architecture (Claude + watsonx + Perplexity + Gemini + Slack + email + Zendesk) is a Series A product. The MVP is one thing:
   ```
   Salesforce CSV → Claude → Simple database → Dashboard
   ```
   watsonx, Perplexity, Gemini, pattern agents, proactive signals — all v2/v3. Do not build them yet.

3. **Reprice — $35/User Is Too Low** — $35/user is collaboration software pricing. Clairio is revenue intelligence. Gong charges $120+/seat. Gainsight charges $80K+/year. Clairio should price at $12K–$30K per company annually — flat pricing, not per-seat.

4. **The Real Moat Is Distribution, Not the Model** — The data flywheel matters — but the actual unfair advantage is Charles's enterprise relationships. 250 accounts, IBM co-sell network, direct relationships at NVIDIA, Salesforce, Airbnb, and Lyft.

5. **Design Partners Before Partnerships** — Perplexity, IBM, and Google won't matter until Clairio has customers. Get 3 design partners first. Partnerships follow proof — not the other way around.

### The Magic Moment

> 🎯 A design partner sees: **'Enterprise SSO → $4.1M ARR requesting it'** and says: **'Wait… how did we not know this already?'** That moment is the product. Everything else is infrastructure.

### 5-Year Financial Snapshot

| Year | Customers | ARR | Revenue | Net Income |
|------|-----------|-----|---------|------------|
| 2026 (Yr 1) | 21 | $222K | $282K | ($303K) |
| 2027 (Yr 2) | 66 | $693K | $843K | $186K |
| 2028 (Yr 3) | 153 | $1.84M | $2.08M | $1.2M |
| 2029 (Yr 4) | 291 | $3.94M | $4.27M | $3.1M |
| 2030 (Yr 5) | 529 | $7.9M | $8.3M | $6.8M |

> ⚠️ **Year 1:** In the red (~$303K). Expected and planned. Consulting revenue from Samadi Consulting bridges the gap. Profitable in Year 2. Compounding from Year 3.

---

## 01 FOUNDER & COMPANY

### Charles Keatts — Founder & CEO

20 years of enterprise technology sales. Nine years at IBM closing $200M+ in cloud revenue at 200% quota achievement. Managed 250+ enterprise accounts including NVIDIA, Salesforce, Airbnb, Lyft, BNP Paribas, Intel, AMD, and Elastic. Deep technical expertise in GPU/AI infrastructure.

> 🏆 **Founder-Market Fit: 9/10** — External advisor score. The enterprise access, credibility, and firsthand experience with this problem is the actual moat — not the technology.

**Key Credentials**
- IBM (9 years) — $200M+ cloud revenue, 200% quota, enterprise accounts across Fortune 500
- Technical depth — GPU/AI infrastructure — Intel Gaudi 3, AMD MI300X, NVIDIA H100/A100
- Network — Senior relationships at NVIDIA, Salesforce, Airbnb, Lyft, IBM watsonx, Google Cloud, AWS
- Contacts in motion — Sancia + Mary at IBM (outreach sent), two advisors engaged

### Legal Entity

- **Company** — Samadi Consulting LLC — California LLC
- **Founded** — February 1, 2026
- **Product** — Clairio
- **Stage** — Pre-revenue, pre-seed, bootstrapped
- **HQ** — San Francisco, California
- **Consulting rate** — $250–350/hour — GPU/AI infrastructure advisory (bridges Year 1 cash deficit)

---

## 02 PROBLEM & MARKET

### The Core Problem

In every B2B SaaS company, Sales hears what customers truly need. They're on the calls. They're fielding the objections. They know which missing features are killing deals and which gaps are causing churn. But that signal almost never reaches Product in a structured, prioritized, or revenue-weighted form.

Product makes decisions based on what's loudest — not what's most valuable. Engineering builds what Product asks for — not what customers are paying for. The result: **42% of SaaS products fail because they built the wrong thing**, despite having paying customers telling them exactly what they needed.

### Market Validation — 16 Forbes Leaders Said This First

Forbes Technology Council (2021) published 16 senior technology executives independently describing this exact problem:

- Marc Fischer, Dogtown Media — "Sales is first to learn of a feature request — IT never gets it"
- Nadya Knysh, a1qa — "IT works on innovations sales isn't aware of; sales has feedback IT never sees"
- Magnus Friberg, Icomera — "What I hear from sales and what I hear from IT are completely different conversations"
- Peter Gregory, GCI — "Adding a PM role bridges the gap — but it's costly and incomplete"

### Research Backing

| Source | Finding | Relevance |
|--------|---------|-----------|
| CB Insights | 42% of SaaS products fail — no market need | Core problem Clairio solves |
| McKinsey 2025 | 20–30% value loss from misaligned incentives | Quantifies the cost |
| McKinsey | 20–30% revenue outperformance when product linked to revenue | Quantifies Clairio's upside |
| Forrester | 65% of sales/marketing report leadership misalignment | Market size signal |

### Market Size

- **TAM** — All B2B SaaS companies globally — $500B+ market
- **SAM** — Mid-market B2B SaaS ($10M–$500M ARR) with 10+ Sales and Product — ~50,000 companies
- **ICP** — VP of Sales, CRO, VP Product at B2B SaaS companies with Salesforce CRM and active feedback problem

---

## 03 PRODUCT — CLAIRIO

### Core Value Proposition

Every feature request that enters Clairio is tagged with the ARR of the account requesting it. A $2M ARR customer asking for Feature X carries more weight than a $50K ARR customer asking for Feature Y. Clairio makes that math automatic, transparent, and actionable — from existing Salesforce data.

> 💡 **Evolving Category:** This could become 'Revenue Intelligence for Product Teams' — a category that barely exists yet. Product roadmap decisions driven entirely by revenue data.

### MVP Architecture — Radically Simple

> ⚠️ **Revised per advisor:** Original architecture was too complex for MVP. This is the build plan now. Everything else is v2/v3.

```
Salesforce CSV or OAuth → Claude → Feature extraction → ARR join → Dashboard
```

**Step 1 — Get the Data (Salesforce)**
- CSV upload (build now) — Every Salesforce customer can export CSV in seconds
- OAuth API (build second) — Objects: Accounts, Opportunities, Cases, Notes

**Step 2 — Extract Feature Requests (Claude)**
```
You are analyzing B2B SaaS customer feedback.
Extract product feature requests. Return:
  Feature Request | Account Name | Description | Confidence
```

**Step 3 — Join With ARR**
```
Enterprise SSO ← Acme Corp ($800K) + StripeCo ($1.2M) + NovaTech ($250K)
              → Enterprise SSO = $2.25M ARR requesting
```

**Step 4 — Aggregate Themes**
Group similar requests with Claude (SAML SSO, Okta login, Azure AD → "Enterprise SSO") and sum the ARR across all variations.

**Step 5 — Show the Dashboard**

| Rank | Feature Request | ARR Impact | Priority |
|------|----------------|------------|----------|
| 1 | Enterprise SSO | $4.1M | CRITICAL |
| 2 | Salesforce Sync | $2.8M | HIGH |
| 3 | Advanced Reporting | $1.9M | HIGH |
| 4 | Audit Logs | $1.2M | MEDIUM |

> 🎯 **The Demo Question:** Ask: 'What if you could instantly see which features protect the most ARR?' Then show the table.

### What MVP Does NOT Include (v2/v3 Features)

| Feature | Version | Reason to Wait |
|---------|---------|---------------|
| IBM watsonx integration | v2 | Adds complexity without changing the core demo |
| Perplexity API / live signals | v2 | Real-time market context — not needed to prove value |
| Google Vertex / Gemini | v2 | Claude alone handles MVP extraction and theming |
| Slack ingestion | v2 | Salesforce data alone is sufficient |
| Email ingestion | v2 | Salesforce Cases capture enough signal |
| Multi-agent orchestration | v2 | Single Claude prompt is sufficient |
| Proactive alerts / Slack push | v3 | Retention feature, not acquisition feature |
| Pattern agents | v2 | Manual theming in Claude is good enough for 5 design partners |

### Full Five-Agent Pipeline (v2 Roadmap)

| # | Agent | Model | Function |
|---|-------|-------|---------|
| 01 | Feedback Capture | Claude | Reads CRM, email, tickets, transcripts |
| 02 | Revenue Weighting | watsonx.data | Enriches signals with ARR, churn risk, renewal date |
| 03 | Pattern Recognition | Claude | Revenue-weighted theme identification |
| 04 | Alignment Agent | watsonx.ai | Role-based output for AEs, PMs, engineers |
| 05 | Proactive Signal | Perplexity API | Live market context + 24/7 risk alerts |

### Competitive Positioning

| Competitor | What They Do | Gap Clairio Fills |
|------------|-------------|-------------------|
| Productboard | Collects feedback | Does NOT weight by revenue |
| Gainsight | Customer success | CS-focused, not Sales/Product alignment |
| Gong / Chorus | Call intelligence | Call data only — no backlog integration |
| Jira / Linear | Engineering workflow | No customer signal input at all |
| **Clairio** | **Revenue-weighted sales intelligence** | **Full pipeline: data → ARR weighting → ranked backlog** |

---

## 04 PRICING STRATEGY

> ⚠️ **Original pricing was too low.** $35/user/month is collaboration software pricing. Clairio is revenue intelligence.

### Competitive Pricing Benchmarks

| Product | Pricing | Category |
|---------|---------|---------|
| Productboard | $49–$99/user/month | Product management |
| Gong | $120+/seat/month | Revenue intelligence |
| Gainsight | $80K+/year flat | Customer success |
| **Clairio (revised)** | **$12K–$30K/year flat** | **Revenue-weighted sales intelligence** |

### Revised Pricing Model — Annual Flat

- **Starter** — $12,000/year — up to 10 Salesforce users, CSV + OAuth, core dashboard
- **Growth** — $20,000/year — up to 30 users, all data sources, Slack alerts
- **Enterprise** — $30,000+/year — unlimited users, custom integrations, dedicated support

> 💡 **Why flat pricing:** A VP of Sales approves $20K/year in one line item. $35/user requires headcount math and procurement approval.

### Revised Financial Impact

| Model | Customers | Avg Contract | Year 1 ARR | Year 3 ARR |
|-------|-----------|-------------|------------|------------|
| Original ($35/user) | 21 | $10,500 | $222K | $1.84M |
| Revised ($20K flat) | 21 | $20,000 | $420K | $3.5M+ |

> 📈 Same number of customers. Nearly 2x the revenue. Much easier sales motion.

---

## 05 THE REAL MOAT

### Advisor Insight — Your Moat Is Not the Model

| Moat Component | What It Means | Why It's Hard to Copy |
|---------------|--------------|----------------------|
| 250 IBM enterprise accounts | Direct relationships at VP/C-suite level | Cannot be bought — takes years to build |
| IBM co-sell network | Access to Fortune 500 through existing channels | Requires IBM ISV partnership + history |
| NVIDIA / Salesforce / Airbnb / Lyft | Named accounts with warm relationships | Personal trust, not company-to-company |
| Firsthand problem experience | Built this because you lived it at IBM | Authentic founder-market story |
| Enterprise credibility | 200% quota at IBM at $200M+ scale | Signals to buyers you understand their world |

> 🔑 The technology is replicable. The relationships are not.

### How to Leverage This Now

1. Pick 5 accounts from your IBM network — These are your design partner targets
2. Lead with the problem, not the product — Ask: 'Do you ever struggle with Sales feedback reaching your Product team?'
3. Show the demo before asking for anything
4. Get one 'holy shit' reaction — That's the signal

---

## 06 MVP BUILD PLAN

### The Goal

Not a product. A demo that makes a VP of Sales say 'holy shit.' The MVP is validated when a design partner says: **'Can we run this on our actual Salesforce data?'**

### The 2-Week Build Plan

| Week | Focus | Deliverable |
|------|-------|------------|
| Week 1, Days 1–2 | Sample data setup | 30–50 synthetic B2B SaaS accounts with Opportunities + Cases |
| Week 1, Days 3–4 | Claude prompt engineering | Feature extraction working on sample Cases and Notes |
| Week 1, Day 5 | ARR join logic | Feature requests connected to Opportunity.Amount |
| Week 2, Days 1–2 | Theme aggregation | Claude grouping similar requests, summing ARR |
| Week 2, Days 3–4 | Dashboard build | Simple table or Retool/Streamlit UI showing ranked backlog |
| Week 2, Day 5 | Demo run | Internal walkthrough — does it feel magical? |

### Sample Data Options

- **Option 1 — Synthetic (fastest)** — Generate realistic fake B2B SaaS CRM data using Claude. ✅ Recommended — start here.
- **Option 2 — Kaggle CRM datasets** — Public datasets with real-world CRM structure
- **Option 3 — Friendly startup** — Ask one warm contact for an anonymized Salesforce export

### Tools for MVP

| Component | Tool Options | Notes |
|-----------|-------------|-------|
| Data storage | Google Sheets / Airtable | Simple enough for MVP |
| LLM | Claude API | Core engine — use directly via API |
| Dashboard | Retool / Streamlit / Notion | Even a spreadsheet works for the first 3 demos |
| Data input | CSV upload | Salesforce export in 60 seconds |

---

## 07 GO-TO-MARKET

> ⚠️ **Advisor Priority Reset:** Do not focus on partnerships yet. Get 3 design partners first. Then activate partner channels.

### Phase 1: Design Partners (Priority #1)

| Step | Action | Timeline |
|------|--------|---------|
| 1 | Build the MVP demo (synthetic data) | Week 1–2 |
| 2 | Show to 10 companies from IBM network | Week 3–4 |
| 3 | Get 3 design partner agreements signed | Month 2 |
| 4 | Run Clairio on their real Salesforce data | Month 2–3 |
| 5 | Iterate based on what they actually need | Month 3 |
| 6 | First case study written and approved | Month 4 |
| 7 | Turn case study into partner outreach proof | Month 4+ |

**Design Partner Ask:** Use Clairio free for 90 days in exchange for weekly feedback sessions, the right to a case study, and one reference call with a prospect.

### Ideal Customer Profile

| Attribute | Description |
|-----------|------------|
| Company type | B2B SaaS |
| ARR range | $10M–$500M (sweet spot: $25M–$150M) |
| CRM | Salesforce (primary), HubSpot (secondary) |
| Team | 10+ Sales, 5+ Product |
| Pain | AEs complaining their requests don't reach Product |
| Buyer | VP of Sales, CRO, VP Product, CPO |

### Messaging By Audience

| Buyer | Core Message |
|-------|-------------|
| VP of Sales / CRO | Your AEs know what customers need. Clairio gets that signal into Product automatically — ranked by ARR. |
| VP Product / CPO | Stop guessing what to build. Clairio shows you which features protect the most revenue. |
| CTO / Engineering | Stop building features nobody asked for. Connect your roadmap to real revenue data. |
| CEO | You're losing 20–30% of potential value because Sales and Product aren't aligned. Clairio fixes that. |

### Phase 2: Partner Channels (After Design Partners)

- IBM co-sell — Former relationships at Sancia + Mary
- Perplexity — Domain data partner + API customer
- AWS Marketplace — Enterprise procurement path
- Google Cloud — ISV + Vertex AI + Workspace connectors
- Salesforce AppExchange — One-click install for all Salesforce customers

---

## 08 SALESFORCE DATA ARCHITECTURE

### Three Access Methods — Priority Order

**Method 1: CSV Upload — Build Right Now**
Every Salesforce customer exports in 60 seconds: Reports → Export → CSV.

**Method 2: Salesforce OAuth API — Build Second**

| API Endpoint | Data Retrieved |
|-------------|---------------|
| GET /services/data/v59.0/sobjects/Account/ | Accounts — name, ARR, industry, tier |
| GET /services/data/v59.0/sobjects/Opportunity/ | Opportunities — value, stage, notes |
| GET /services/data/v59.0/sobjects/Case/ | Cases — subject, description, feedback |

**Method 3: Salesforce AppExchange — Build Later**
One-click install. Requires Salesforce security review. Pursue after Method 2 is proven.

### MVP Data Flow

```
Customer exports Salesforce CSV (or connects via OAuth)
         ↓
Clairio reads: Accounts + Opportunities + Cases
         ↓
Claude extracts feature requests from Cases + Opportunity notes
         ↓
Revenue Weighting: join feature requests with Opportunity.Amount
         ↓
Dashboard shows ranked backlog:
  Feature X → $2.4M ARR requesting → CRITICAL
  Feature Y → $890K ARR requesting → HIGH
```

---

## 09 EXECUTION ROADMAP 2026

### Q1 2026 — Foundation (Feb–Mar)

- ✅ Company launched — Samadi Consulting LLC, Feb 1
- ✅ Pitch deck (24 slides)
- ✅ Financial model (5-year P&L, headcount, monthly cash flow)
- ✅ One-pager, partner outreach emails (5 vendors), NDA template
- ✅ Architecture diagrams and flywheel visualization
- ✅ Claude Code build started
- ✅ IBM contacts (Sancia + Mary) — outreach sent
- ✅ Two advisors approached
- ✅ External advisor review — strategic plan revised (this document)
- 🔄 Google Cloud intro email — drafted, ready to send
- 🔄 Perplexity outreach — email drafted, ready to send
- 🔄 Synthetic demo data — to be generated this week

### Q2 2026 — Build & Validate (Apr–Jun)

- Synthetic demo data built — 30–50 realistic B2B SaaS accounts
- Claude extraction prompt working on sample data
- ARR join logic complete — feature requests linked to revenue
- MVP dashboard live — ARR-weighted backlog visible
- CSV upload fallback built
- Salesforce OAuth integration live
- Demo shown to 10 companies from IBM network
- 3 design partner agreements signed
- Developer #1 hired (Full Stack)
- Developer #2 hired (AI/ML)
- Trademark application filed for 'Clairio'

### Q3 2026 — Design Partners & First Revenue (Jul–Sep)

- 3–5 design partners live on real Salesforce data
- First 'holy shit' moment documented as case study
- First paying customer (converted from design partner)
- Partner Sales Rep hired
- IBM co-sell motion activated
- ARR: $50K–$100K

### Q4 2026 — Revenue & Scale (Oct–Dec)

- 21 customers by December 31
- $420K ARR at revised pricing
- At least 1 formal partner agreement signed
- AWS Marketplace listing in process
- SOC 2 roadmap defined

---

## 10 IP & LEGAL

### IP Protection — Five Immediate Actions

1. **Copyright** — All Clairio materials auto-copyrighted at creation. Maintain dated copies.
2. **Trademark** — File USPTO trademark for 'Clairio' now. $250–350. Filing date = priority date.
3. **NDA** — Mutual NDA drafted. Send before every detailed technical conversation.
4. **IP Assignment** — All IP assigned to Samadi Consulting LLC — not held personally. Attorney review recommended.
5. **Partner Contracts** — Read every IP clause before signing.

### What Stays Internal

- Revenue-weighting algorithm — Describe the outcome, not the mechanism
- Agent architecture details — Show the flow, not the implementation
- Pricing model assumptions — Share tiers, not the financial model internals

---

## 11 RISKS & MITIGATIONS

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Over-engineering the MVP | HIGH | Critical | Apply advisor feedback: Salesforce → Claude → Dashboard only. Ship in 2 weeks. |
| Year 1 cash runs out | Medium | Critical | Consulting revenue at $250–350/hr bridges the gap. |
| Design partners don't convert | Medium | High | Set conversion expectations upfront. 90-day trial with defined success metrics. |
| Key developer hire takes too long | Medium | High | Start with contractors. Claude Code reduces initial dev dependency. |
| Salesforce blocks API access | Low | Low | Companies own their data. CSV fallback available. |
| Competitor launches similar product | Medium | Medium | Move fast. Distribution advantage not replicable quickly. |

---

## 12 DOCUMENT LIBRARY

| File | Type | Description |
|------|------|------------|
| Clairio_Pitch_Deck.pptx | Deck | Main 24-slide investor/partner deck |
| Clairio_MultiModel_Slides_v2.pptx | Deck | Architecture + Ecosystem + Partner pitch guide |
| Clairio_VoiceOfMarket.pptx | Deck | Forbes quote grid + 3-pattern synthesis |
| Clairio_Financial_Model.xlsx | Spreadsheet | 4-sheet model: Assumptions, 5-Yr P&L, Headcount, Cash Flow |
| Clairio_One_Pager.docx | Document | One-pager with flywheel section |
| Clairio_Partner_Outreach_Emails_v2.docx | Document | 5 vendor emails — Perplexity, IBM, Google, Anthropic, AWS |
| Clairio_Google_Intro_Email.docx | Document | Short Google intro |
| Clairio_Google_Outreach_v2.docx | Document | Full Google outreach with STATIC framework reference |
| Clairio_Mutual_NDA.docx | Legal | Mutual NDA — review with CA attorney before use |
| Clairio_Claude_Code_Context.md | Technical | Full Claude Code context brief with Salesforce architecture |
| Clairio_Strategic_Plan.docx | Strategy | This document — v2 with advisor revisions |

---

*CLAIRIO · INTERNAL STRATEGIC PLAN · v2.0*
*Confidential · March 2026 · Samadi Consulting LLC*
*"The opportunity is real. The entire outcome depends on whether the MVP demo feels magical."*
