/**
 * CRM webhook handler
 * Receives webhooks from Salesforce, HubSpot, etc.
 * Phase 6: Coming soon
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Validate webhook secret
    const secret = request.headers.get('x-webhook-secret');
    if (!secret || secret !== process.env.CRM_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Invalid webhook secret' },
        { status: 401 }
      );
    }

    // Log webhook payload for debugging
    const body = await request.json();
    console.log('CRM Webhook received:', body);

    // Phase 6: Process webhook and sync data to Supabase
    // Currently just acknowledge receipt

    return NextResponse.json({
      success: true,
      message: 'Webhook processed (Phase 6)',
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
