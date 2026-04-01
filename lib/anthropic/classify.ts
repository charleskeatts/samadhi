/**
 * Claude-powered classification agent - STUB
 * The "feedback" table does not exist in the actual DB schema.
 * This module is kept as a no-op stub to avoid breaking imports.
 */

export async function classifyFeedback(
  feedbackId: string,
  _rawText: string,
  _accountName: string,
  _arr: number
): Promise<{ feedback_id: string; category: string; sentiment: string; urgency_score: number; tags: string[] }> {
  console.warn('[classify] Feedback table does not exist — classification skipped.');
  return {
    feedback_id: feedbackId,
    category: 'uncategorized',
    sentiment: 'neutral',
    urgency_score: 5,
    tags: [],
  };
}
