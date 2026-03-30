/**
 * Feedback page
 * Shows all feedback with filters and bulk actions
 */

export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import FeedbackTable from '@/components/feedback/FeedbackTable';

async function getFeedback() {
  const supabase = await createClient();

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h1 className="page-title">Feedback</h1>
        <p className="page-subtitle">Customer signals captured from sales calls · AI classified</p>
      </div>

      {/* Table */}
      <FeedbackTable initialData={feedback} />
    </div>
  );
}
