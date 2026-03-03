/**
 * Claude-powered feedback consolidation agent
 * Groups similar feedback items and creates feature requests
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { ConsolidateResult, ConsolidatedGroup } from '@/types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface FeedbackItem {
  id: string;
  raw_text: string;
  account_name: string;
  arr: number;
}

/**
 * Fetch unprocessed feature_request feedback and consolidate into feature requests
 */
export async function consolidateFeedback(): Promise<ConsolidateResult> {
  const supabase = await createClient();

  // Fetch all unprocessed feature_request feedback
  const { data: feedbackItems, error } = await supabase
    .from('feedback')
    .select(
      `
      id,
      raw_text,
      urgency_score,
      revenue_weight,
      accounts:account_id (name)
    `
    )
    .eq('category', 'feature_request')
    .eq('ai_processed', true)
    .is('in_roadmap', false);

  if (error || !feedbackItems) {
    console.error('Error fetching feedback:', error);
    return {
      groups: [],
      processed_feedback_count: 0,
      created_features_count: 0,
    };
  }

  if (feedbackItems.length === 0) {
    return {
      groups: [],
      processed_feedback_count: 0,
      created_features_count: 0,
    };
  }

  // Build a list of feedback for Claude to consolidate
  const feedbackText = feedbackItems
    .map((item: any) => `[ID: ${item.id}] ${item.raw_text} (Account: ${item.accounts?.name || 'Unknown'}, ARR: $${item.revenue_weight})`)
    .join('\n\n');

  // Ask Claude to group similar feedback
  const context = `You are a product manager consolidating customer feedback.
  
Given the following feedback items, group them by feature theme. For each group:
1. Create a clear feature title (max 8 words)
2. Write a brief description (2-3 sentences)
3. List the feedback IDs in that group

Feedback items:
${feedbackText}

Respond with ONLY valid JSON (no markdown) in this format:
{
  "groups": [
    {
      "title": "Feature Title",
      "description": "Feature description here",
      "feedback_ids": ["id1", "id2"]
    }
  ]
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: context,
        },
      ],
    });

    const responseText =
      response.content[0].type === 'text' ? response.content[0].text : '';
    const result = JSON.parse(responseText);

    const createdFeatures: ConsolidatedGroup[] = [];

    // For each group, create a feature_request
    for (const group of result.groups || []) {
      const feedbackIds = group.feedback_ids || [];
      
      // Calculate total revenue weight and account count
      let totalRevenue = 0;
      const accountsSet = new Set<string>();
      
      for (const id of feedbackIds) {
        const item = feedbackItems.find((f: any) => f.id === id);
        if (item) {
          totalRevenue += item.revenue_weight;
          if (item.accounts?.name) {
            accountsSet.add(item.accounts.name);
          }
        }
      }

      // Get org_id from first feedback item
      const orgId = feedbackItems[0]?.org_id;

      // Insert feature request
      const { data: createdFeature } = await supabase
        .from('feature_requests')
        .insert({
          org_id: orgId,
          title: group.title,
          description: group.description,
          total_revenue_weight: totalRevenue,
          account_count: accountsSet.size,
          feedback_ids: feedbackIds,
          roadmap_status: 'backlog',
        })
        .select()
        .single();

      if (createdFeature) {
        createdFeatures.push({
          group_id: createdFeature.id,
          title: group.title,
          description: group.description,
          feedback_ids: feedbackIds,
          total_revenue_weight: totalRevenue,
          account_count: accountsSet.size,
        });
      }

      // Mark these feedback items as in_roadmap
      await supabase
        .from('feedback')
        .update({ status: 'in_roadmap' })
        .in('id', feedbackIds);
    }

    return {
      groups: createdFeatures,
      processed_feedback_count: feedbackItems.length,
      created_features_count: createdFeatures.length,
    };
  } catch (error) {
    console.error('Error consolidating feedback:', error);
    return {
      groups: [],
      processed_feedback_count: feedbackItems.length,
      created_features_count: 0,
    };
  }
}
