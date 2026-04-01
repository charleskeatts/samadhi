'use client';

import { useState, useEffect, useCallback } from 'react';
import { FeatureRequest } from '@/types';

interface UseFeedbackReturn {
  features: FeatureRequest[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useFeedback(): UseFeedbackReturn {
  const [features, setFeatures] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/feedback');
      if (!response.ok) throw new Error('Failed to fetch feature requests');
      const data = await response.json();
      setFeatures(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { features, loading, error, refetch };
}
