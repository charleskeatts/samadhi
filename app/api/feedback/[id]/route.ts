/**
 * Feature Request by ID
 * PATCH: update deal_stage or other fields
 */

import { getAuthProfile } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const UpdateSchema = z.object({
  deal_stage: z.enum(['backlog', 'planned', 'in_progress', 'shipped']).optional(),
  blocker_score: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthProfile();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const validated = UpdateSchema.parse(body);

    const { data, error } = await auth.admin
      .from('feature_requests')
      .update(validated)
      .eq('id', params.id)
      .eq('organization_id', auth.orgId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating feature request:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
