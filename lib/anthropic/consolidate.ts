/**
 * Claude-powered feedback consolidation agent - STUB
 * The "feedback" table does not exist in the actual DB schema.
 * This module is kept as a no-op stub to avoid breaking imports.
 */

export interface ConsolidateResult {
  groups: any[];
  processed_feedback_count: number;
  created_features_count: number;
}

export async function consolidateFeedback(): Promise<ConsolidateResult> {
  console.warn('[consolidate] Feedback table does not exist — consolidation skipped.');
  return {
    groups: [],
    processed_feedback_count: 0,
    created_features_count: 0,
  };
}
