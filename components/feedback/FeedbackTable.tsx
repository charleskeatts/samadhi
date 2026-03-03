/**
 * Feedback table component
 * Displays all feedback with sorting and status filters
 */

'use client';

import { useState } from 'react';
import { FeedbackWithAccount, FeedbackStatus } from '@/types';
import { formatARR, timeAgo, getCategoryColor, getSentimentColor, capitalize } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface FeedbackTableProps {
  initialData: FeedbackWithAccount[];
}

export default function FeedbackTable({ initialData }: FeedbackTableProps) {
  const [feedback, setFeedback] = useState<FeedbackWithAccount[]>(initialData);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (
    id: string,
    newStatus: FeedbackStatus
  ) => {
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update local state
        setFeedback(
          feedback.map((f) =>
            f.id === id ? { ...f, status: newStatus } : f
          )
        );
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
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
          {feedback.length > 0 ? (
            feedback.map((item) => (
              <tr
                key={item.id}
                className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <td className="py-3 px-4 text-sm font-medium text-slate-900">
                  {(item.account as any)?.name || 'Unknown'}
                </td>
                <td className="py-3 px-4 text-sm text-slate-700 max-w-xs truncate">
                  {item.raw_text}
                </td>
                <td className="py-3 px-4 text-sm">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getSentimentColor(item.sentiment)}`}>
                    {capitalize(item.sentiment)}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-slate-900">
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
                </td>
                <td className="py-3 px-4 text-sm">
                  <select
                    value={item.status}
                    onChange={(e) =>
                      handleStatusChange(item.id, e.target.value as FeedbackStatus)
                    }
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
                No feedback yet. Start logging customer feedback!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
