/**
 * Feedback page
 * Shows all feedback with filters and bulk actions
 */

import { createClient } from '@/lib/supabase/server';
import FeedbackTable from '@/components/feedback/FeedbackTable';

async function getFeedback() {
  const supabase = await createClient();

  // Get current user's org
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (!profile) return [];

  // Get all feedback for this org
  const { data: feedback } = await supabase
    .from('feedback')
    .select(
      `
      id,
      org_id,
      account_id,
      rep_id,
      crm_note_id,
      ai_processed,
      raw_text,
      category,
      sentiment,
      urgency_score,
      revenue_weight,
      status,
      created_at,
      accounts:account_id (id, name, arr)
    `
    )
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false });

  return feedback || [];
}

export default async function FeedbackPage() {
  const feedback = await getFeedback();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Feedback</h1>
        <p className="text-slate-600 mt-2">
          All customer feedback captured from sales calls, classified by AI
        </p>
      </div>

      {/* Table */}
      <FeedbackTable initialData={feedback} />
    </div>
  );
}
