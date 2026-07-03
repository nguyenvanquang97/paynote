import type {AIIntent} from '../types/aiChat.types';

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const hasAny = (text: string, keywords: string[]): boolean =>
  keywords.some(keyword => text.includes(keyword));

export function detectAIIntent(input: string): AIIntent {
  const text = normalize(input);
  if (!text) {return 'unknown';}

  if (hasAny(text, ['duplicate', 'trung', 'giao dich trung', 'bi trung', 'trung lap'])) {
    return 'duplicate_check';
  }

  if (hasAny(text, ['miss', 'thieu giao dich', 'sot giao dich', 'bi sot'])) {
    return 'missed_transaction_check';
  }

  if (hasAny(text, ['ngan sach', 'han muc', 'budget', 'dat ngan sach', 'set budget'])) {
    return 'budget_setup';
  }

  if (hasAny(text, ['so sanh', 'thang truoc', 'tuan truoc', 'hon hay kem'])) {
    return 'period_compare';
  }

  if (hasAny(text, ['bat thuong', 'la', 'tang manh', 'dot bien'])) {
    return 'abnormal_spending';
  }

  if (hasAny(text, ['tiet kiem', 'cat giam', 'nen giam'])) {
    return 'saving_advice';
  }

  if (hasAny(text, ['tieu nhieu nhat', 'danh muc', 'an uong', 'cafe', 'mua sam'])) {
    return 'category_breakdown';
  }

  if (hasAny(text, ['tieu bao nhieu', 'tong chi', 'hom nay tieu', 'thang nay tieu', 'tom tat'])) {
    return 'spending_summary';
  }

  return 'unknown';
}
