/**
 * Consolidate feedback API endpoint
 * Called by Vercel cron job every night at 2 AM
 * Groups similar feature_request feedback and creates consolidated features
 */

import { NextRequest, NextResponse } from 'next/server';
import { consolidateFeedback } from '@/lib/anthropic/consolidate';

export async function POST(request: NextRequest) {
  try {
    // Validate cron secret if this is being called by Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Allow requests without secret during development
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Run consolidation
    const result = await consolidateFeedback();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error consolidating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to consolidate feedback' },
      { status: 500 }
    );
  }
}
