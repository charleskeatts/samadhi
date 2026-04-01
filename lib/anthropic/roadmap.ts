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

export async function generateRoadmapBrief(
  featureRequestId: string,
  featureName: string,
  notes: string,
  totalArr: number,
  accountCount: number
): Promise<RoadmapBriefResult> {
  const context = `You are a senior product manager writing a product brief.

Feature: ${featureName}
Customer Notes: ${notes}
Total ARR at Stake: $${totalArr.toLocaleString()}
Number of Accounts Requesting: ${accountCount}

Write a product brief. Respond with ONLY valid JSON:
{
  "one_pager_md": "# ${featureName}\\n\\n## Problem\\n[problem]\\n\\n## Solution\\n[solution]",
  "acceptance_criteria": ["Criterion 1", "Criterion 2"],
  "priority_rationale": "2-sentence explanation of priority based on revenue impact"
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: context }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const data = JSON.parse(text);

    return {
      feature_request_id: featureRequestId,
      one_pager_md: data.one_pager_md || '',
      acceptance_criteria: data.acceptance_criteria || [],
      priority_rationale: data.priority_rationale || '',
    };
  } catch (error) {
    console.error('Error generating roadmap brief:', error);
    return {
      feature_request_id: featureRequestId,
      one_pager_md: `# ${featureName}\n\n${notes}`,
      acceptance_criteria: ['Feature implemented', 'Tested', 'Documentation updated'],
      priority_rationale: `This feature impacts $${totalArr.toLocaleString()} ARR across ${accountCount} accounts.`,
    };
  }
}
