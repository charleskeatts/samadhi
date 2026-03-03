/**
 * Roadmap page
 * Kanban-style view of features by status
 */

import { createClient } from '@/lib/supabase/server';
import { RoadmapStatus } from '@/types';
import { formatARR } from '@/lib/utils';

async function getFeatures() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (!profile) return {};

  const { data: features } = await supabase
    .from('feature_requests')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('total_revenue_weight', { ascending: false });

  // Group by status
  const grouped: Record<RoadmapStatus, any[]> = {
    backlog: [],
    planned: [],
    in_progress: [],
    shipped: [],
  };

  features?.forEach((feature) => {
    const status = feature.roadmap_status as RoadmapStatus;
    grouped[status].push(feature);
  });

  return grouped;
}

export default async function RoadmapPage() {
  const grouped = await getFeatures();

  const columns: { status: RoadmapStatus; label: string; color: string }[] = [
    { status: 'backlog', label: 'Backlog', color: 'bg-slate-100' },
    { status: 'planned', label: 'Planned', color: 'bg-blue-100' },
    { status: 'in_progress', label: 'In Progress', color: 'bg-yellow-100' },
    { status: 'shipped', label: 'Shipped', color: 'bg-green-100' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Product Roadmap</h1>
        <p className="text-slate-600 mt-2">
          View features by status. Drag to move between columns (coming soon).
        </p>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => (
          <div key={column.status} className="space-y-4">
            {/* Column header */}
            <div className={`p-3 rounded-lg ${column.color}`}>
              <h2 className="font-semibold text-slate-900">
                {column.label}{' '}
                <span className="text-sm font-normal text-slate-600">
                  ({(grouped[column.status] || []).length})
                </span>
              </h2>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {(grouped[column.status] || []).length > 0 ? (
                (grouped[column.status] || []).map((feature) => (
                  <div
                    key={feature.id}
                    className="card bg-white hover:shadow-md transition-shadow cursor-move"
                  >
                    <p className="font-semibold text-slate-900 line-clamp-2 mb-2">
                      {feature.title}
                    </p>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-sky-600 font-semibold">
                        {formatARR(feature.total_revenue_weight)}
                      </span>
                      <span className="text-slate-500">
                        {feature.account_count} account{feature.account_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No features
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
