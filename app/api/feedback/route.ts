/**
 * Feedback API endpoints
 * GET: fetch all feedback for the org
 * POST: create new feedback and trigger async classification
 */

import { getAuthProfile } from '@/lib/supabase/server';
import { classifyFeedback } from '@/lib/anthropic/classify';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for POST requests
const CreateFeedbackSchema = z.object({
  raw_text: z.string().min(1).max(5000),
  account_name: z.string().min(1).max(500),
  arr: z.number().min(0),
  crm_note_id: z.string().optional(),
});

// type CreateFeedbackInput = z.infer<typeof CreateFeedbackSchema>;

/**
 * GET: Fetch all feedback for the user's organization
 */
export async function GET(_request: NextRequest) {
  try {
    const auth = await getAuthProfile();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to bypass RLS for reliable reads
    const { data: feedback, error } = await auth.admin
      .from('feedback')
      .select(`
        id,
        raw_text,
        category,
        sentiment,
        urgency_score,
        revenue_weight,
        status,
        created_at,
        accounts:account_id (id, name, arr)
      `)
      .eq('org_id', auth.orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

/**
 * POST: Create new feedback item
 * Validates input, creates feedback record, and triggers async classification
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthProfile();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = CreateFeedbackSchema.parse(body);

    const { raw_text, account_name, arr, crm_note_id: _crm_note_id } = validatedData;

    // Find or create account (use admin client to bypass RLS)
    const { data: existingAccount } = await auth.admin
      .from('accounts')
      .select('id')
      .eq('org_id', auth.orgId)
      .eq('name', account_name)
      .single();

    let accountId: string;

    if (existingAccount) {
      accountId = existingAccount.id;
    } else {
      const { data: newAccount, error: createError } = await auth.admin
        .from('accounts')
        .insert({
          org_id: auth.orgId,
          name: account_name,
          arr: arr,
          crm_source: 'manual',
        })
        .select()
        .single();

      if (createError) throw createError;
      accountId = newAccount.id;
    }

    // Create feedback record
    const { data: feedback, error: feedbackError } = await auth.admin
      .from('feedback')
      .insert({
        org_id: auth.orgId,
        account_id: accountId,
        rep_id: auth.user.id,
        raw_text,
        revenue_weight: arr,
        status: 'new',
      })
      .select()
      .single();

    if (feedbackError) throw feedbackError;

    // Trigger async classification (fire and forget)
    classifyFeedback(feedback.id, raw_text, account_name, arr).catch((err) => {
      console.error('Error in async classification:', err);
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error('Error creating feedback:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create feedback' },
      { status: 500 }
    );
  }
}
