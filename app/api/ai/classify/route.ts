/**
 * Classify feedback API endpoint - STUB
 * The "feedback" table does not exist in the actual DB schema.
 * This endpoint returns 501 to indicate the feature is not available.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: 'Feedback table is not available. Classification is disabled.' },
    { status: 501 }
  );
}
