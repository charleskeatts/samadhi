/**
 * Feedback table component
 * Displays all feedback with category/sentiment filters, status updates,
 * an AI-processing indicator, and a click-to-expand full-text modal.
 */

'use client';

import { useState } from 'react';
import { Loader2, Expand, X } from 'lucide-react';
import { FeedbackWithAccount, FeedbackStatus, FeedbackCategory, Sentiment } from '@/types';
import { formatARR, timeAgo, getCategoryColor, getSentimentColor, capitalize } from '@/lib/utils';

interface FeedbackTableProps {
  initialData: FeedbackWithAccount[];
}

const CATEGORIES: { value: FeedbackCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'bug_report', label: 'Bug Report' },
  { value: 'churn_risk', label: 'Churn Risk' },
  { value: 'competitive_intel', label: 'Competitive Intel' },
  { value: 'pricing_concern', label: 'Pricing Concern' },
  { value: 'general', label: 'General' },
  { value: 'uncategorized', label: 'Uncategorized' },
];

const SENTIMENTS: { value: Sentiment | 'all'; label: string }[] = [
  { value: 'all', label: 'All Sentiments' },
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' },
];

export default function FeedbackTable({ initialData }: FeedbackTableProps) {
  const [feedback, setFeedback] = useState<FeedbackWithAccount[]>(initialData);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [expandedItem, setExpandedItem] = useState<FeedbackWithAccount | null>(null);

  const handleStatusChange = async (id: string, newStatus: FeedbackStatus) => {
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setFeedback(feedback.map((f) => (f.id === id ? { ...f, status: newStatus } : f)));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = feedback.filter((item) => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (sentimentFilter !== 'all' && item.sentiment !== sentimentFilter) return false;
    return true;
  });

  return (
    <>
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm border border-slate-300 text-slate-700 bg-white"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          value={sentimentFilter}
          onChange={(e) => setSentimentFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm border border-slate-300 text-slate-700 bg-white"
        >
          {SENTIMENTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        {(categoryFilter !== 'all' || sentimentFilter !== 'all') && (
          <button
            onClick={() => { setCategoryFilter('all'); setSentimentFilter('all'); }}
            className="text-sm text-slate-500 hover:text-slate-700 underline"
          >
            Clear filters
          </button>
        )}
        <span className="text-sm text-slate-500 ml-auto">
          {filtered.length} of {feedback.length} items
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto card p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Account</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Feedback</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Category</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Sentiment</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Urgency</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-900">ARR</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-3 px-4 text-sm font-medium text-slate-900">
                    {(item.account as any)?.name || 'Unknown'}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-700 max-w-xs">
                    <div className="flex items-start gap-1.5">
                      <span className="truncate">{item.raw_text}</span>
                      <button
                        onClick={() => setExpandedItem(item)}
                        className="flex-shrink-0 text-slate-400 hover:text-sky-500 transition-colors mt-0.5"
                        title="Read full feedback"
                      >
                        <Expand className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {item.ai_processed ? (
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-500">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Classifying…
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {item.ai_processed ? (
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getSentimentColor(item.sentiment)}`}>
                        {capitalize(item.sentiment)}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-900">
                    {item.ai_processed ? (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-4 rounded-full ${
                              i < item.urgency_score ? 'bg-amber-400' : 'bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value as FeedbackStatus)}
                      disabled={updatingId === item.id}
                      className="px-2 py-1 rounded text-sm border border-slate-300 text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="new">New</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="in_roadmap">In Roadmap</option>
                      <option value="shipped">Shipped</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-sky-600">
                    {formatARR(item.revenue_weight)}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-500">
                    {timeAgo(item.created_at)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-8 px-4 text-center text-slate-500">
                  {feedback.length === 0
                    ? 'No feedback yet. Start logging customer feedback!'
                    : 'No feedback matches the selected filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Full-text expand modal */}
      {expandedItem && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setExpandedItem(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">
                  {(expandedItem.account as any)?.name || 'Unknown Account'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{timeAgo(expandedItem.created_at)}</p>
              </div>
              <button
                onClick={() => setExpandedItem(null)}
                className="text-slate-400 hover:text-slate-600 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              {expandedItem.raw_text}
            </p>

            {expandedItem.ai_processed && (
              <div className="border-t border-slate-100 pt-4 flex flex-wrap gap-2">
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getCategoryColor(expandedItem.category)}`}>
                  {expandedItem.category}
                </span>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getSentimentColor(expandedItem.sentiment)}`}>
                  {capitalize(expandedItem.sentiment)}
                </span>
                <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-amber-50 text-amber-700">
                  Urgency {expandedItem.urgency_score}/10
                </span>
                <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-sky-50 text-sky-700">
                  {formatARR(expandedItem.revenue_weight)} ARR
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
