/**
 * Feedback page
 * Shows all feedback with filters and bulk actions
 */

export const dynamic = 'force-dynamic';

import { getAuthProfile } from '@/lib/supabase/server';
import FeedbackTable from '@/components/feedback/FeedbackTable';

async function getFeedback() {
  const auth = await getAuthProfile();
  if (!auth) return [];

  const { data: feedback } = await auth.admin
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
    .eq('org_id', auth.orgId)
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
