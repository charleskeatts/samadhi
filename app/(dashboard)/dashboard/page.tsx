/**
 * Dashboard overview page
 * Shows key metrics and recent activity
 */

export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import KPICards from '@/components/dashboard/KPICards';
import FeatureRankingChart from '@/components/dashboard/FeatureRankingChart';
import { formatARR, timeAgo } from '@/lib/utils';

async function getStats() {
  const supabase = await createClient();

  // Get current user's org
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  const orgId = profile.org_id;

  // Get feedback count
  const { count: feedbackCount } = await supabase
    .from('feedback')
    .select('id', { count: 'exact' })
    .eq('org_id', orgId);

  // Get total ARR at stake
  const { data: feedbackData } = await supabase
    .from('feedback')
    .select('revenue_weight')
    .eq('org_id', orgId);
  const totalARR = feedbackData?.reduce((sum, f) => sum + (f.revenue_weight || 0), 0) || 0;

  // Get feature requests count
  const { count: featureCount } = await supabase
    .from('feature_requests')
    .select('id', { count: 'exact' })
    .eq('org_id', orgId);

  // Get average urgency
  const { data: urgencyData } = await supabase
    .from('feedback')
    .select('urgency_score')
    .eq('org_id', orgId);
  const avgUrgency =
    urgencyData && urgencyData.length > 0
      ? Math.round(urgencyData.reduce((sum, f) => sum + f.urgency_score, 0) / urgencyData.length)
      : 0;

  // Get recent feedback
  const { data: recentFeedback } = await supabase
    .from('feedback')
    .select(
      `
      id,
      raw_text,
      revenue_weight,
      category,
      created_at,
      accounts:account_id (name)
    `
    )
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get top features
  const { data: topFeatures } = await supabase
    .from('feature_requests')
    .select('id, org_id, title, description, total_revenue_weight, account_count, feedback_ids, roadmap_status, category, blocker_score, created_at, updated_at')
    .eq('org_id', orgId)
    .order('total_revenue_weight', { ascending: false })
    .limit(3);

  return {
    totalARR,
    feedbackCount: feedbackCount || 0,
    featureCount: featureCount || 0,
    avgUrgency,
    recentFeedback,
    topFeatures,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  if (!stats) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Overview</h1>
        <p className="text-slate-600 mt-2">
          Capture, analyze, and prioritize customer feedback from sales calls
        </p>
      </div>

      {/* KPI Cards */}
      <KPICards
        totalARR={stats.totalARR}
        feedbackCount={stats.feedbackCount}
        featureCount={stats.featureCount}
        avgUrgency={stats.avgUrgency}
      />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent feedback */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Feedback</h2>
          <div className="space-y-4">
            {stats.recentFeedback && stats.recentFeedback.length > 0 ? (
              stats.recentFeedback.map((feedback: any) => (
                <div
                  key={feedback.id}
                  className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-medium text-slate-900 text-sm">
                      {(feedback.accounts as any)?.name || 'Unknown Account'}
                    </p>
                    <span className="text-xs text-slate-500">
                      {timeAgo(feedback.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 line-clamp-2">
                    {feedback.raw_text}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {feedback.category}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatARR(feedback.revenue_weight)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-2xl mb-2">💬</p>
                <p className="text-slate-700 font-medium text-sm mb-1">No feedback yet</p>
                <p className="text-slate-500 text-xs mb-4">
                  Submit your first piece of customer feedback to get started.
                </p>
                <a
                  href="/dashboard/feedback"
                  className="inline-block px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#1565C0' }}
                >
                  Add Feedback
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Top features */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Top Features</h2>
          <div className="space-y-4">
            {stats.topFeatures && stats.topFeatures.length > 0 ? (
              stats.topFeatures.map((feature: any) => (
                <div
                  key={feature.id}
                  className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <p className="font-medium text-slate-900 text-sm mb-2">
                    {feature.title}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">
                      {feature.account_count} account{feature.account_count !== 1 ? 's' : ''}
                    </span>
                    <span className="text-sm font-semibold text-sky-600">
                      {formatARR(feature.total_revenue_weight)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-2xl mb-2">🧠</p>
                <p className="text-slate-700 font-medium text-sm mb-1">No features yet</p>
                <p className="text-slate-500 text-xs mb-4">
                  Features are automatically grouped from feedback by AI. Add feedback to get started.
                </p>
                <a
                  href="/dashboard/feedback"
                  className="inline-block px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#1565C0' }}
                >
                  Add Feedback
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feature ranking chart */}
      {stats.topFeatures && stats.topFeatures.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Feature Revenue Impact</h2>
          <FeatureRankingChart features={stats.topFeatures} />
        </div>
      )}
    </div>
  );
}
