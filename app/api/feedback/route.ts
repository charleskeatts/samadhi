/**
 * Feedback API endpoints - STUB
 * The "feedback" table does not exist in the actual DB schema.
 * These endpoints return empty/501 to avoid runtime errors.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  // No feedback table in DB — return empty array
  return NextResponse.json([]);
}

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: 'Feedback table is not available. Use feature_requests instead.' },
    { status: 501 }
  );
}
