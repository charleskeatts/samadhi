/**
 * HubSpot CRM integration endpoint
 * Phase 6: Coming soon
 */

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      message: 'HubSpot integration coming in Phase 6',
      status: 'not_implemented',
    },
    { status: 501 }
  );
}
