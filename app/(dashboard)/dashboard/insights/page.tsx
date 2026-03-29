/**
 * AI Insights page
 * Shows consolidated feature requests ranked by revenue impact
 */

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FeatureRequest } from '@/types';
import { formatARR } from '@/lib/utils';
import { Zap } from 'lucide-react';

export default function InsightsPage() {
  const [features, setFeatures] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState<FeatureRequest | null>(null);
  const [generatingBrief, setGeneratingBrief] = useState<string | null>(null);
  const [briefError, setBriefError] = useState<string | null>(null);
  useEffect(() => {
    const supabase = createClient();
    const fetchFeatures = async () => {
      try {
        const { data } = await supabase
          .from('feature_requests')
          .select('*')
          .order('total_revenue_weight', { ascending: false });

        setFeatures(data || []);
      } catch (error) {
        console.error('Error fetching features:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatures();
  }, []);

  const handleGenerateBrief = async (featureId: string) => {
    setGeneratingBrief(featureId);
    setBriefError(null);
    try {
      const feature = features.find((f) => f.id === featureId);
      if (!feature) return;

      const response = await fetch('/api/ai/roadmap-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature_request_id: featureId }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${response.status})`);
      }

      const brief = await response.json();
      setSelectedFeature({
        ...feature,
        description: `${feature.description}\n\n## Roadmap Brief\n\n${brief.one_pager_md}`,
      });
    } catch (error) {
      setBriefError(error instanceof Error ? error.message : 'Failed to generate brief. Please try again.');
    } finally {
      setGeneratingBrief(null);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading insights...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">AI Insights</h1>
        <p className="text-slate-600 mt-2">
          AI-consolidated feature requests ranked by revenue impact
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Features list */}
        <div className="lg:col-span-1">
          <div className="card p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h2 className="font-semibold text-slate-900">
                {features.length} Features
              </h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {features.length > 0 ? (
                features.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => setSelectedFeature(feature)}
                    className={`w-full text-left p-4 border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                      selectedFeature?.id === feature.id ? 'bg-sky-50' : ''
                    }`}
                  >
                    <p className="font-medium text-sm text-slate-900 line-clamp-2">
                      {feature.title}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <span className="text-sky-600 font-semibold">
                        {formatARR(feature.total_revenue_weight)}
                      </span>
                      <span className="text-slate-500">
                        {feature.account_count} account{feature.account_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-6 text-center">
                  <p className="text-2xl mb-2">🧠</p>
                  <p className="text-slate-700 font-medium text-sm mb-1">No features yet</p>
                  <p className="text-slate-500 text-xs mb-4">
                    AI consolidates feedback into features overnight. Add feedback first.
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

        {/* Feature detail */}
        <div className="lg:col-span-2">
          {selectedFeature ? (
            <div className="space-y-4">
              <div className="card">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  {selectedFeature.title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                  <span>{formatARR(selectedFeature.total_revenue_weight)} ARR</span>
                  <span>
                    {selectedFeature.account_count} account
                    {selectedFeature.account_count !== 1 ? 's' : ''}
                  </span>
                  <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 capitalize">
                    {selectedFeature.roadmap_status}
                  </span>
                </div>
                <p className="text-slate-700 whitespace-pre-wrap">
                  {selectedFeature.description}
                </p>
              </div>

              <button
                onClick={() => handleGenerateBrief(selectedFeature.id)}
                disabled={generatingBrief === selectedFeature.id}
                className="w-full py-2 px-4 rounded-lg font-semibold text-white transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#1565C0' }}
              >
                <Zap className="w-4 h-4" />
                {generatingBrief === selectedFeature.id
                  ? 'Generating...'
                  : 'Generate Roadmap Brief'}
              </button>

              {briefError && (
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{ backgroundColor: '#3B0000', color: '#FCA5A5' }}
                >
                  {briefError}
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-12 text-slate-500">
              <p>Select a feature to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
