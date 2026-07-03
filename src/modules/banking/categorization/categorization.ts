import {KEYWORD_CATEGORIES} from '../../../shared/constants';

import type {CustomCategory} from '../../../app/store';

/**
 * Categorization System
 *
 * Uses keyword matching against transaction description
 * to automatically categorize transactions.
 */
export const categorizeTransaction = (
  description?: string,
  customCategories?: Record<string, CustomCategory>,
): string => {
  if (!description) {
    return 'other';
  }

  const lowerDesc = description.toLowerCase();

  // Check custom categories first
  if (customCategories) {
    for (const cat of Object.values(customCategories)) {
      if (cat.keywords && cat.keywords.length > 0) {
        for (const keyword of cat.keywords) {
          if (lowerDesc.includes(keyword)) {
            return cat.id;
          }
        }
      }
    }
  }

  // Check hardcoded keywords
  for (const [keyword, category] of Object.entries(KEYWORD_CATEGORIES)) {
    if (lowerDesc.includes(keyword.toLowerCase())) {
      return category;
    }
  }

  return 'other';
};

/**
 * Get all available categories
 */
export const getAllCategories = (): string[] => {
  const categories = new Set<string>(Object.values(KEYWORD_CATEGORIES));
  categories.add('other');
  return Array.from(categories);
};
