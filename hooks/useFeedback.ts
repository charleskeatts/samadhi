/**
 * Custom hook for feedback operations - STUB
 * The "feedback" table does not exist in the actual DB schema.
 * This hook returns empty data to avoid breaking any remaining imports.
 */

'use client';

import { useCallback } from 'react';

interface UseFeedbackReturn {
  feedback: any[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  submitFeedback: (data: {
    account_name: string;
    arr: number;
    raw_text: string;
  }) => Promise<any>;
}

export function useFeedback(): UseFeedbackReturn {
  const refetch = useCallback(async () => {
    // No feedback table — nothing to fetch
  }, []);

  const submitFeedback = useCallback(
    async (_data: { account_name: string; arr: number; raw_text: string }) => {
      throw new Error('Feedback table is not available. Use feature_requests instead.');
    },
    []
  );

  return {
    feedback: [],
    loading: false,
    error: null,
    refetch,
    submitFeedback,
  };
}
