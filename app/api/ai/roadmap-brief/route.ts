/**
 * Roadmap brief generation API endpoint
 * Generates a product brief for a feature request
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

    // Fetch the feature request
    const { data: feature, error } = await supabase
      .from('feature_requests')
      .select('*')
      .eq('id', feature_request_id)
      .single();

    if (error || !feature) {
      return NextResponse.json(
        { error: 'Feature request not found' },
        { status: 404 }
      );
    }

    // Generate the roadmap brief
    const brief = await generateRoadmapBrief(
      feature.id,
      feature.title,
      feature.description || '',
      feature.total_revenue_weight,
      feature.account_count
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
