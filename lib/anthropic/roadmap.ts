/**
 * Claude-powered roadmap brief generation
 * Creates a product brief from a consolidated feature request
 */

import Anthropic from '@anthropic-ai/sdk';
import { RoadmapBriefResult } from '@/types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Generate a product brief/one-pager for a feature request
 */
export async function generateRoadmapBrief(
  featureRequestId: string,
  title: string,
  description: string,
  totalRevenueWeight: number,
  accountCount: number
): Promise<RoadmapBriefResult> {
  const context = `You are a senior product manager writing a product brief.

Feature: ${title}
Description: ${description}
Total ARR at Stake: $${totalRevenueWeight.toLocaleString()}
Number of Accounts Requesting: ${accountCount}

Write a product brief that includes:
1. A clear problem statement (2-3 sentences)
2. Proposed solution (2-3 sentences)
3. Acceptance criteria as a JSON array of strings (5-7 items)

Respond with ONLY valid JSON (no markdown) in this format:
{
  "one_pager_md": "# ${title}\n\n## Problem\n[problem statement]\n\n## Solution\n[proposed solution]",
  "acceptance_criteria": ["Criterion 1", "Criterion 2"],
  "priority_rationale": "2-sentence explanation of priority based on revenue impact"
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: context,
        },
      ],
    });

    const responseText =
      response.content[0].type === 'text' ? response.content[0].text : '';
    const briefData = JSON.parse(responseText);

    return {
      feature_request_id: featureRequestId,
      one_pager_md: briefData.one_pager_md || '',
      acceptance_criteria: briefData.acceptance_criteria || [],
      priority_rationale: briefData.priority_rationale || '',
    };
  } catch (error) {
    console.error('Error generating roadmap brief:', error);
    
    // Return a fallback brief
    return {
      feature_request_id: featureRequestId,
      one_pager_md: `# ${title}\n\n${description}`,
      acceptance_criteria: [
        'Feature is implemented',
        'Feature is tested',
        'Documentation is updated',
      ],
      priority_rationale: `This feature impacts $${totalRevenueWeight.toLocaleString()} in ARR across ${accountCount} accounts.`,
    };
  }
}
