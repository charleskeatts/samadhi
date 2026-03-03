/**
 * Classify feedback API endpoint
 * Triggered by POST requests with a feedback ID
 * Calls the Claude classification agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { classifyFeedback } from '@/lib/anthropic/classify';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feedback_id } = body;

    if (!feedback_id) {
      return NextResponse.json(
        { error: 'feedback_id is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch the feedback item
    const { data: feedback, error } = await supabase
      .from('feedback')
      .select(
        `
        id,
        raw_text,
        revenue_weight,
        accounts:account_id (name)
      `
      )
      .eq('id', feedback_id)
      .single();

    if (error || !feedback) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    // Call the classification agent
    const result = await classifyFeedback(
      feedback.id,
      feedback.raw_text,
      (feedback.accounts as any)?.name || 'Unknown',
      feedback.revenue_weight
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error classifying feedback:', error);
    return NextResponse.json(
      { error: 'Failed to classify feedback' },
      { status: 500 }
    );
  }
}
