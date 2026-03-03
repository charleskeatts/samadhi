/**
 * Claude-powered feedback classification agent
 * Takes raw feedback text and classifies it into category, sentiment, urgency, etc.
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { FeedbackCategory, Sentiment, ClassifyResult } from '@/types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Classify a piece of feedback using Claude
 * Returns structured categorization including urgency, sentiment, and category
 */
export async function classifyFeedback(
  feedbackId: string,
  rawText: string,
  accountName: string,
  arr: number
): Promise<ClassifyResult> {
  // Build context for Claude
  const context = `You are a product manager analyzing customer feedback from sales calls.
  
Customer: ${accountName}
Account ARR: $${arr.toLocaleString()}
Raw Feedback: "${rawText}"

Analyze this feedback and respond with ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "category": "feature_request|bug_report|churn_risk|competitive_intel|pricing_concern|general",
  "sentiment": "positive|neutral|negative",
  "urgency_score": 1-10,
  "tags": ["tag1", "tag2"]
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: context,
        },
      ],
    });

    // Extract text content from response
    const responseText =
      response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse JSON response
    const classified = JSON.parse(responseText);

    // Validate and sanitize the response
    const category = validateCategory(classified.category);
    const sentiment = validateSentiment(classified.sentiment);
    const urgency = Math.max(1, Math.min(10, parseInt(classified.urgency_score) || 5));

    // Update the feedback record in Supabase
    const supabase = await createClient();
    await supabase
      .from('feedback')
      .update({
        category,
        sentiment,
        urgency_score: urgency,
        ai_processed: true,
      })
      .eq('id', feedbackId);

    return {
      feedback_id: feedbackId,
      category,
      sentiment,
      urgency_score: urgency,
      tags: classified.tags || [],
    };
  } catch (error) {
    console.error('Error classifying feedback:', error);
    
    // Mark as processed even on error to avoid infinite loops
    const supabase = await createClient();
    await supabase
      .from('feedback')
      .update({ ai_processed: true })
      .eq('id', feedbackId);

    // Return a default classification
    return {
      feedback_id: feedbackId,
      category: 'uncategorized',
      sentiment: 'neutral',
      urgency_score: 5,
      tags: [],
    };
  }
}

/**
 * Validate that category is one of the allowed values
 */
function validateCategory(cat: string): FeedbackCategory {
  const valid = [
    'feature_request',
    'bug_report',
    'churn_risk',
    'competitive_intel',
    'pricing_concern',
    'general',
    'uncategorized',
  ];
  return valid.includes(cat) ? (cat as FeedbackCategory) : 'uncategorized';
}

/**
 * Validate that sentiment is one of the allowed values
 */
function validateSentiment(sent: string): Sentiment {
  const valid = ['positive', 'neutral', 'negative'];
  return valid.includes(sent) ? (sent as Sentiment) : 'neutral';
}
