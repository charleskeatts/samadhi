-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CORE TABLES
-- ============================================================

-- organizations: Samadhi customer companies
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- profiles: Samadhi users (linked to Supabase auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'sales_rep' CHECK (role IN ('sales_rep','product_manager','admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- accounts: Customer companies tracked in Samadhi
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations ON DELETE CASCADE,
  name TEXT NOT NULL,
  arr NUMERIC NOT NULL DEFAULT 0,
  crm_id TEXT,
  crm_source TEXT DEFAULT 'manual' CHECK (crm_source IN ('manual','salesforce','hubspot')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- feedback: Raw feedback from sales calls
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts ON DELETE CASCADE,
  rep_id UUID REFERENCES profiles ON DELETE SET NULL,
  raw_text TEXT NOT NULL,
  category TEXT DEFAULT 'uncategorized' CHECK (category IN ('feature_request','bug_report','churn_risk','competitive_intel','pricing_concern','general','uncategorized')),
  revenue_weight NUMERIC DEFAULT 0,
  urgency_score INTEGER DEFAULT 5 CHECK (urgency_score BETWEEN 1 AND 10),
  sentiment TEXT DEFAULT 'neutral' CHECK (sentiment IN ('positive','neutral','negative')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new','reviewed','in_roadmap','shipped')),
  crm_note_id TEXT,
  ai_processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- feature_requests: AI-consolidated feature requests
CREATE TABLE feature_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  total_revenue_weight NUMERIC DEFAULT 0,
  account_count INTEGER DEFAULT 0,
  feedback_ids UUID[] DEFAULT '{}',
  roadmap_status TEXT DEFAULT 'backlog' CHECK (roadmap_status IN ('backlog','planned','in_progress','shipped')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_profiles_org_id ON profiles(org_id);
CREATE INDEX idx_accounts_org_id ON accounts(org_id);
CREATE INDEX idx_feedback_org_id ON feedback(org_id);
CREATE INDEX idx_feedback_account_id ON feedback(account_id);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_category ON feedback(category);
CREATE INDEX idx_feedback_ai_processed ON feedback(ai_processed);
CREATE INDEX idx_feature_requests_org_id ON feature_requests(org_id);
CREATE INDEX idx_feature_requests_roadmap_status ON feature_requests(roadmap_status);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's org_id
CREATE OR REPLACE FUNCTION my_org_id() RETURNS UUID AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION my_role() RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Organizations: members can read their own org
CREATE POLICY "orgs_read" ON organizations FOR SELECT USING (id = my_org_id());

-- Profiles: users can read all profiles in their org, update own
CREATE POLICY "profiles_read" ON profiles FOR SELECT USING (org_id = my_org_id());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Accounts: org members read/write
CREATE POLICY "accounts_read" ON accounts FOR SELECT USING (org_id = my_org_id());
CREATE POLICY "accounts_insert" ON accounts FOR INSERT WITH CHECK (org_id = my_org_id());
CREATE POLICY "accounts_update" ON accounts FOR UPDATE USING (org_id = my_org_id());

-- Feedback: org members read; all roles write
CREATE POLICY "feedback_read" ON feedback FOR SELECT USING (org_id = my_org_id());
CREATE POLICY "feedback_insert" ON feedback FOR INSERT WITH CHECK (org_id = my_org_id());
CREATE POLICY "feedback_update" ON feedback FOR UPDATE USING (org_id = my_org_id());

-- Feature requests: org members read; product_manager/admin write
CREATE POLICY "fr_read" ON feature_requests FOR SELECT USING (org_id = my_org_id());
CREATE POLICY "fr_insert" ON feature_requests FOR INSERT WITH CHECK (org_id = my_org_id());
CREATE POLICY "fr_update" ON feature_requests FOR UPDATE USING (org_id = my_org_id());
