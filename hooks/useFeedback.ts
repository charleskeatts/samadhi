/**
 * Custom hook for feedback operations
 * Handles fetching feedback and submitting new feedback
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { FeedbackWithAccount } from '@/types';

interface UseFeedbackReturn {
  feedback: FeedbackWithAccount[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  submitFeedback: (data: {
    account_name: string;
    arr: number;
    raw_text: string;
  }) => Promise<FeedbackWithAccount>;
}

export function useFeedback(): UseFeedbackReturn {
  const [feedback, setFeedback] = useState<FeedbackWithAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all feedback
  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/feedback');
      if (!response.ok) throw new Error('Failed to fetch feedback');
      const data = await response.json();
      setFeedback(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Submit new feedback
  const submitFeedback = useCallback(
    async (data: {
      account_name: string;
      arr: number;
      raw_text: string;
    }): Promise<FeedbackWithAccount> => {
      try {
        setError(null);
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to submit feedback');
        }

        const newFeedback = await response.json();
        setFeedback((prev) => [newFeedback, ...prev]);
        return newFeedback;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setError(message);
        throw err;
      }
    },
    []
  );

  // Fetch on mount
  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    feedback,
    loading,
    error,
    refetch,
    submitFeedback,
  };
}
