import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ConsolidatedGroup {
  feature_name: string;
  notes: string;
  account_ids: string[];
  total_arr: number;
}

export interface ConsolidateResult {
  groups: ConsolidatedGroup[];
  processed_count: number;
}

export async function consolidateFeatureRequests(
  featureRequests: Array<{
    id: string;
    feature_name: string;
    notes: string | null;
    blocker_score: number;
    accounts?: { name: string; arr: number } | null;
  }>
): Promise<ConsolidateResult> {
  if (featureRequests.length === 0) {
    return { groups: [], processed_count: 0 };
  }

  const itemsText = featureRequests
    .map((f) => `[ID: ${f.id}] ${f.feature_name} — ${f.notes || ''} (Account: ${f.accounts?.name || 'Unknown'}, ARR: $${f.accounts?.arr || 0})`)
    .join('\n\n');

  const context = `You are a product manager consolidating customer feature requests.

Group these feature requests by theme. For each group:
1. Write a clear feature title (max 8 words)
2. Write a brief summary (2-3 sentences)
3. List the IDs in the group

Feature requests:
${itemsText}

Respond with ONLY valid JSON:
{
  "groups": [
    {
      "feature_name": "Title",
      "notes": "Summary",
      "ids": ["id1", "id2"]
    }
  ]
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: context }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const result = JSON.parse(text);

    const groups: ConsolidatedGroup[] = (result.groups || []).map((g: any) => {
      const ids: string[] = g.ids || [];
      const matchedItems = featureRequests.filter((f) => ids.includes(f.id));
      const totalArr = matchedItems.reduce((sum, f) => sum + (f.accounts?.arr || 0), 0);
      const accountIds = matchedItems.map((f) => f.id);

      return {
        feature_name: g.feature_name,
        notes: g.notes,
        account_ids: accountIds,
        total_arr: totalArr,
      };
    });

    return { groups, processed_count: featureRequests.length };
  } catch (error) {
    console.error('Error consolidating feature requests:', error);
    return { groups: [], processed_count: featureRequests.length };
  }
}
