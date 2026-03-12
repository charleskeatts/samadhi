/**
 * Samadhi Type Definitions
 * Complete TypeScript types for all database entities and API responses
 */

// ============================================================
// ENUMS
// ============================================================

export type Role = 'sales_rep' | 'product_manager' | 'admin';
export type FeedbackCategory = 'feature_request' | 'bug_report' | 'churn_risk' | 'competitive_intel' | 'pricing_concern' | 'general' | 'uncategorized';
export type FeedbackStatus = 'new' | 'reviewed' | 'in_roadmap' | 'shipped';
export type RoadmapStatus = 'backlog' | 'planned' | 'in_progress' | 'shipped';
export type Sentiment = 'positive' | 'neutral' | 'negative';
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
  org_id: string;
  full_name: string | null;
  role: Role;
  created_at: string;
}

export interface Account {
  id: string;
  org_id: string;
  name: string;
  arr: number;
  crm_id: string | null;
  crm_source: CRMSource;
  created_at: string;
}

export interface Feedback {
  id: string;
  org_id: string;
  account_id: string;
  rep_id: string | null;
  raw_text: string;
  category: FeedbackCategory;
  revenue_weight: number;
  urgency_score: number;
  sentiment: Sentiment;
  status: FeedbackStatus;
  crm_note_id: string | null;
  ai_processed: boolean;
  created_at: string;
}

export interface FeatureRequest {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  total_revenue_weight: number;
  account_count: number;
  feedback_ids: string[];
  roadmap_status: RoadmapStatus;
  category: string;
  blocker_score: number;
  created_at: string;
  updated_at: string;
}

// ============================================================
// JOINED ENTITIES (for API responses)
// ============================================================

export interface FeedbackWithAccount extends Feedback {
  account?: Account;
}

export interface FeatureRequestWithAccountNames extends FeatureRequest {
  account_names?: string[];
}

// ============================================================
// API REQUEST/RESPONSE TYPES
// ============================================================

export interface CreateFeedbackRequest {
  raw_text: string;
  account_name: string;
  arr: number;
  crm_note_id?: string;
}

export interface UpdateFeedbackRequest {
  status?: FeedbackStatus;
  category?: FeedbackCategory;
  urgency_score?: number;
}

export interface CreateFeatureRequestRequest {
  title: string;
  description?: string;
  feedback_ids: string[];
}

// ============================================================
// AI AGENT RESPONSE TYPES
// ============================================================

export interface ClassifyResult {
  feedback_id: string;
  category: FeedbackCategory;
  sentiment: Sentiment;
  urgency_score: number;
  tags?: string[];
}

export interface ConsolidatedGroup {
  group_id: string;
  title: string;
  description: string;
  feedback_ids: string[];
  total_revenue_weight: number;
  account_count: number;
}

export interface ConsolidateResult {
  groups: ConsolidatedGroup[];
  processed_feedback_count: number;
  created_features_count: number;
}

export interface RoadmapBriefResult {
  feature_request_id: string;
  one_pager_md: string;
  acceptance_criteria: string[];
  priority_rationale: string;
}

// ============================================================
// UI COMPONENT PROPS
// ============================================================

export interface KPICardsProps {
  totalARR: number;
  feedbackCount: number;
  featureCount: number;
  avgUrgency: number;
}

export interface FeedbackCardProps {
  feedback: FeedbackWithAccount;
  onStatusChange?: (newStatus: FeedbackStatus) => void;
}

export interface FeatureRankingChartProps {
  features: FeatureRequestWithAccountNames[];
  maxItems?: number;
}
