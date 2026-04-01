/**
 * Samadhi Type Definitions
 * Matches the ACTUAL database schema (as of 2026-03-31)
 *
 * ACTUAL TABLES:
 *   organizations: id, name, slug, created_at
 *   profiles:      id, organization_id, full_name, role, created_at
 *   accounts:      id, organization_id, name, arr, crm_source, crm_id, created_at
 *   feature_requests: id, organization_id, account_id, feature_name, category,
 *                     deal_stage, notes, submitted_by, source, confidence,
 *                     confidence_note, created_at, blocker_score
 *
 * NOTE: There is NO "feedback" table in the database.
 */

// ============================================================
// ENUMS
// ============================================================

export type Role = 'sales_rep' | 'product_manager' | 'admin';
export type CRMSource = 'manual' | 'salesforce' | 'hubspot';

// ============================================================
// DATABASE ENTITIES
// ============================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Profile {
  id: string;
  organization_id: string;
  full_name: string | null;
  role: Role;
  created_at: string;
}

export interface Account {
  id: string;
  organization_id: string;
  name: string;
  arr: number;
  crm_id: string | null;
  crm_source: CRMSource;
  created_at: string;
}

export interface FeatureRequest {
  id: string;
  organization_id: string;
  account_id: string;
  feature_name: string;
  category: string;
  deal_stage: string | null;
  notes: string | null;
  submitted_by: string | null;
  source: string | null;
  confidence: number | null;
  confidence_note: string | null;
  blocker_score: number;
  created_at: string;
}

// ============================================================
// JOINED ENTITIES (for API responses)
// ============================================================

export interface FeatureRequestWithAccount extends FeatureRequest {
  accounts?: Account;
}

// ============================================================
// UI COMPONENT PROPS
// ============================================================

export interface KPICardsProps {
  totalARR: number;
  featureCount: number;
  accountCount: number;
  avgBlocker: number;
}

export interface FeatureRankingChartProps {
  features: FeatureRequestWithAccount[];
  maxItems?: number;
}
