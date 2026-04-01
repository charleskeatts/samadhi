/**
 * Roadmap brief generation API endpoint
 * Generates a product brief for a feature request
 * Uses actual DB schema columns.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateRoadmapBrief } from '@/lib/anthropic/roadmap';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feature_request_id } = body;

    if (!feature_request_id) {
      return NextResponse.json(
        { error: 'feature_request_id is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch the feature request with account data
    const { data: feature, error } = await supabase
      .from('feature_requests')
      .select('*, accounts:account_id (id, name, arr)')
      .eq('id', feature_request_id)
      .single();

    if (error || !feature) {
      return NextResponse.json(
        { error: 'Feature request not found' },
        { status: 404 }
      );
    }

    // Generate the roadmap brief using actual column names
    const brief = await generateRoadmapBrief(
      feature.id,
      feature.feature_name,
      feature.notes || '',
      feature.accounts?.arr ?? 0,
      feature.accounts?.name ?? 'Unknown'
    );

    return NextResponse.json(brief);
  } catch (error) {
    console.error('Error generating roadmap brief:', error);
    return NextResponse.json(
      { error: 'Failed to generate roadmap brief' },
      { status: 500 }
    );
  }
}
