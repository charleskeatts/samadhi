/**
 * Feedback by ID endpoint
 * PATCH: update feedback status
 */

import { createClient } from '@/lib/supabase/server';
import { FeedbackStatus } from '@/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const UpdateFeedbackSchema = z.object({
  status: z.enum(['new', 'reviewed', 'in_roadmap', 'shipped']).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = UpdateFeedbackSchema.parse(body);

    // Update feedback record
    const { data: updatedFeedback, error } = await supabase
      .from('feedback')
      .update(validatedData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;
    if (!updatedFeedback) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedFeedback);
  } catch (error) {
    console.error('Error updating feedback:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update feedback' },
      { status: 500 }
    );
  }
}
