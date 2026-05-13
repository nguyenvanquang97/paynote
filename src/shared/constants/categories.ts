export const CATEGORY_ICONS: Record<string, string> = {
  food: '🍔',
  cafe: '☕',
  transport: '🚗',
  shopping: '🛒',
  subscription: '📱',
  transfer: '💸',
  salary: '💰',
  entertainment: '🎬',
  health: '🏥',
  education: '📚',
  bills: '📄',
  other: '📌',
};

export const KEYWORD_CATEGORIES: Record<string, string> = {
  // Cafe
  highlands: 'cafe',
  starbucks: 'cafe',
  'the coffee house': 'cafe',
  phuc: 'cafe',

  // Transport
  grab: 'transport',
  be: 'transport',
  xanh: 'transport',

  // Food
  'circle k': 'food',
  'family mart': 'food',
  baemin: 'food',
  shopee: 'food',
  'now.vn': 'food',

  // Subscription
  spotify: 'subscription',
  netflix: 'subscription',
  youtube: 'subscription',
  apple: 'subscription',
  google: 'subscription',

  // Shopping
  lazada: 'shopping',
  tiki: 'shopping',
  sendo: 'shopping',

  // Bills
  'dien luc': 'bills',
  'nuoc': 'bills',
  'internet': 'bills',
  'fpt': 'bills',
  'vnpt': 'bills',
  'viettel': 'bills',
};

export type CategoryId = keyof typeof CATEGORY_ICONS;
