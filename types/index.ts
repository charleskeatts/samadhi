/**
 * Samadhi Type Definitions
 * Aligned with actual Supabase schema
 */

export type Role = 'sales_rep' | 'product_manager' | 'admin';
export type DealStage = 'backlog' | 'planned' | 'in_progress' | 'shipped';
export type CRMSource = 'manual' | 'salesforce' | 'hubspot';
export type Confidence = 'low' | 'medium' | 'high';

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
  account_id: string | null;
  feature_name: string;
  category: string | null;
  deal_stage: DealStage;
  notes: string | null;
  submitted_by: string | null;
  source: string | null;
  confidence: Confidence | null;
  confidence_note: string | null;
  blocker_score: number;
  created_at: string;
  // joined
  account?: Account;
}

export interface FeatureRequestWithAccount extends FeatureRequest {
  account?: Account;
}

export interface CreateFeatureRequestInput {
  account_name: string;
  arr: number;
  feature_name: string;
  notes: string;
  category?: string;
  blocker_score?: number;
}

export interface KPICardsProps {
  totalARR: number;
  featureCount: number;
  avgBlockerScore: number;
  accountCount: number;
}

export interface FeatureRankingChartProps {
  features: FeatureRequestWithAccount[];
  maxItems?: number;
}
