/**
 * Feedback by ID endpoint - STUB
 * The "feedback" table does not exist in the actual DB schema.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  _request: NextRequest,
  { params: _params }: { params: { id: string } }
) {
  return NextResponse.json(
    { error: 'Feedback table is not available.' },
    { status: 501 }
  );
}
