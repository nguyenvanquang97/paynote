export const CATEGORY_ICONS: Record<string, string> = {
  food: 'food',
  cafe: 'cafe',
  transport: 'transport',
  shopping: 'shopping',
  subscription: 'subscription',
  transfer: 'transfer',
  salary: 'salary',
  entertainment: 'entertainment',
  health: 'health',
  education: 'education',
  bills: 'bills',
  other: 'other',
};

export const CATEGORY_LABELS: Record<string, string> = {
  food: 'Ăn uống',
  cafe: 'Cà phê',
  transport: 'Di chuyển',
  shopping: 'Mua sắm',
  subscription: 'Đăng ký',
  transfer: 'Chuyển khoản',
  salary: 'Lương',
  entertainment: 'Giải trí',
  health: 'Sức khỏe',
  education: 'Giáo dục',
  bills: 'Hóa đơn',
  other: 'Khác',
};

export const getCategoryLabel = (categoryId?: string | null): string => {
  if (!categoryId) {return CATEGORY_LABELS.other;}
  return CATEGORY_LABELS[categoryId] || categoryId;
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
