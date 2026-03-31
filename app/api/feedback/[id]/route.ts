/**
 * Feedback by ID endpoint
 * PATCH: update feedback status
 */

import { getAuthProfile } from '@/lib/supabase/server';
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
    const auth = await getAuthProfile();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = UpdateFeedbackSchema.parse(body);

    const { data: updatedFeedback, error } = await auth.admin
      .from('feedback')
      .update(validatedData)
      .eq('id', params.id)
      .eq('org_id', auth.orgId)
      .select()
      .single();

    if (error) throw error;
    if (!updatedFeedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
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
