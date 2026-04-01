import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ClassifyResult {
  feature_request_id: string;
  category: string;
  blocker_score: number;
  tags: string[];
}

export async function classifyFeatureRequest(
  featureRequestId: string,
  featureName: string,
  notes: string,
  accountName: string,
  arr: number
): Promise<ClassifyResult> {
  const context = `You are a product manager analyzing customer feature requests from sales calls.

Customer: ${accountName}
Account ARR: $${arr.toLocaleString()}
Feature Request: "${featureName}"
Notes: "${notes}"

Analyze this and respond with ONLY valid JSON (no markdown, no code blocks):
{
  "category": "Integration|Analytics|Core Product|UX|Performance|Security|Reporting|API",
  "blocker_score": 1-5,
  "tags": ["tag1", "tag2"]
}

blocker_score: 5=Critical deal blocker, 4=High priority, 3=Medium, 2=Nice to have, 1=Minimal impact`;

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 300,
      messages: [{ role: 'user', content: context }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const parsed = JSON.parse(text);

    return {
      feature_request_id: featureRequestId,
      category: parsed.category || 'Core Product',
      blocker_score: Math.max(1, Math.min(5, parseInt(parsed.blocker_score) || 3)),
      tags: parsed.tags || [],
    };
  } catch (error) {
    console.error('Error classifying feature request:', error);
    return {
      feature_request_id: featureRequestId,
      category: 'Core Product',
      blocker_score: 3,
      tags: [],
    };
  }
}
