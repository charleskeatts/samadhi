/**
 * Claude-powered roadmap brief generation
 * Creates a product brief from a feature request.
 * Uses actual DB schema columns (feature_name, notes, etc.)
 */

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface RoadmapBriefResult {
  feature_request_id: string;
  one_pager_md: string;
  acceptance_criteria: string[];
  priority_rationale: string;
}

/**
 * Generate a product brief/one-pager for a feature request
 */
export async function generateRoadmapBrief(
  featureRequestId: string,
  featureName: string,
  notes: string,
  accountARR: number,
  accountName: string
): Promise<RoadmapBriefResult> {
  const context = `You are a senior product manager writing a product brief.

Feature: ${featureName}
Notes: ${notes}
Account: ${accountName}
Account ARR: $${accountARR.toLocaleString()}

Write a product brief that includes:
1. A clear problem statement (2-3 sentences)
2. Proposed solution (2-3 sentences)
3. Acceptance criteria as a JSON array of strings (5-7 items)

Respond with ONLY valid JSON (no markdown) in this format:
{
  "one_pager_md": "# ${featureName}\\n\\n## Problem\\n[problem statement]\\n\\n## Solution\\n[proposed solution]",
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
      one_pager_md: `# ${featureName}\n\n${notes}`,
      acceptance_criteria: [
        'Feature is implemented',
        'Feature is tested',
        'Documentation is updated',
      ],
      priority_rationale: `This feature impacts $${accountARR.toLocaleString()} in ARR for ${accountName}.`,
    };
  }
}
