/**
 * Utility functions for formatting and common operations
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with support for overrides
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as USD currency (ARR)
 * Examples: 1234567 -> "$1.2M", 123456 -> "$123K", 1234 -> "$1,234"
 */
export function formatARR(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString()}`;
}

/**
 * Format an ISO date string as human-readable (e.g., "Jan 15, 2024")
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a timestamp as relative time (e.g., "5m ago", "2h ago")
 */
export function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;

  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

/**
 * Generate a color for a badge based on a category string
 */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    feature_request: 'bg-blue-100 text-blue-800',
    bug_report: 'bg-red-100 text-red-800',
    churn_risk: 'bg-orange-100 text-orange-800',
    competitive_intel: 'bg-purple-100 text-purple-800',
    pricing_concern: 'bg-amber-100 text-amber-800',
    general: 'bg-gray-100 text-gray-800',
    uncategorized: 'bg-slate-100 text-slate-800',
  };
  return colors[category] || colors.uncategorized;
}

/**
 * Generate a color for sentiment badges
 */
export function getSentimentColor(sentiment: string): string {
  const colors: Record<string, string> = {
    positive: 'bg-green-100 text-green-800',
    neutral: 'bg-gray-100 text-gray-800',
    negative: 'bg-red-100 text-red-800',
  };
  return colors[sentiment] || colors.neutral;
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
