export const dynamic = 'force-dynamic';

import { getAuthProfile } from '@/lib/supabase/server';
import FeatureRequestTable from '@/components/feedback/FeedbackTable';

async function getFeatureRequests() {
  const auth = await getAuthProfile();
  if (!auth) return [];

  const { data } = await auth.admin
    .from('feature_requests')
    .select('*, accounts:account_id(id, name, arr)')
    .eq('organization_id', auth.orgId)
    .order('created_at', { ascending: false });

  return data || [];
}

export default async function FeedbackPage() {
  const features = await getFeatureRequests();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 className="page-title">Feature Requests</h1>
        <p className="page-subtitle">Customer signals ranked by deal impact · log new requests below</p>
      </div>
      <FeatureRequestTable initialData={features} />
    </div>
  );
}
