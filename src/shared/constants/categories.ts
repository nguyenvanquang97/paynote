export const CATEGORY_ICONS: Record<string, string> = {
  food: 'food',
  cafe: 'coffee',
  rent: 'bills',
  transport: 'transport',
  shopping: 'shopping',
  transfer: 'transfer',
  salary: 'salary',
  bills: 'bills',
  other: 'other',
};

export const CATEGORY_EMOJI: Record<string, string> = {
  food: '🍔',
  cafe: '☕',
  rent: '🏠',
  transport: '🚗',
  shopping: '🛒',
  transfer: '💸',
  salary: '💰',
  bills: '📄',
  other: '📌',
};

export const CATEGORY_LABELS: Record<string, string> = {
  food: 'Ăn uống',
  cafe: 'Cà phê',
  rent: 'Tiền thuê nhà',
  transport: 'Di chuyển',
  shopping: 'Mua sắm',
  transfer: 'Chuyển khoản',
  salary: 'Lương',
  bills: 'Hóa đơn',
  other: 'Khác',
  // Legacy labels (để hiển thị dữ liệu cũ rõ ràng)
  subscription: 'Đăng ký',
  entertainment: 'Giải trí',
  health: 'Sức khỏe',
  education: 'Giáo dục',
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
  cafe: 'cafe',
  'cà phê': 'cafe',
  coffee: 'cafe',

  // Transport
  grab: 'transport',
  be: 'transport',
  xanh: 'transport',

  // Food
  'circle k': 'food',
  'family mart': 'food',
  baemin: 'food',
  shopeefood: 'food',
  'now.vn': 'food',

  // Rent / Bills
  'tien nha': 'rent',
  'thuê nhà': 'rent',
  'thue nha': 'rent',
  'can ho': 'rent',
  apartment: 'rent',
  rent: 'rent',

  // Subscriptions -> Bills
  spotify: 'bills',
  netflix: 'bills',
  youtube: 'bills',
  apple: 'bills',
  google: 'bills',

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
