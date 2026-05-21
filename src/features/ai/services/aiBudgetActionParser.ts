import {CATEGORY_LABELS, KEYWORD_CATEGORIES} from '../../../shared/constants/categories';
import {parseCurrency} from '../../../utils/parseCurrency';

type CategoryLike = {
  name?: string;
  keywords?: string[];
};

export type BudgetSetupParseResult =
  | {
      status: 'ready';
      categoryId: string;
      categoryLabel: string;
      amount: number;
    }
  | {
      status: 'missing_amount' | 'missing_category';
      categoryId?: string;
      categoryLabel?: string;
      amount?: number;
    };

type BudgetSetupParseOptions = {
  customCategories?: Record<string, CategoryLike>;
};

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();

const parseCompactNumber = (rawValue: string, unit?: string): number => {
  const value = rawValue.trim();
  const normalizedUnit = normalize(unit || '');
  const hasMoneySeparator = /[.,\s]/.test(value);
  const integerValue = parseCurrency(value);

  if (['trieu', 'tr', 'm'].includes(normalizedUnit)) {
    const decimalValue = Number(value.replace(',', '.'));
    if (Number.isFinite(decimalValue)) {
      return Math.round(decimalValue * 1_000_000);
    }
    return integerValue * 1_000_000;
  }

  if (['k', 'nghin', 'ngan'].includes(normalizedUnit)) {
    const decimalValue = Number(value.replace(',', '.'));
    if (Number.isFinite(decimalValue)) {
      return Math.round(decimalValue * 1_000);
    }
    return integerValue * 1_000;
  }

  if (normalizedUnit === 'd' || normalizedUnit === 'vnd') {
    return integerValue;
  }

  if (hasMoneySeparator) {
    return integerValue;
  }

  return integerValue >= 1000 ? integerValue : 0;
};

const extractAmount = (input: string): number | undefined => {
  const pattern = /(\d+(?:[.,]\d+)*(?:\s\d{3})*)\s*(triệu|trieu|tr|m|k|nghìn|nghin|ngàn|ngan|đ|d|vnd)?/gi;
  const matches = Array.from(input.matchAll(pattern));

  for (const match of matches) {
    const amount = parseCompactNumber(match[1] || '', match[2]);
    if (Number.isFinite(amount) && amount > 0) {
      return amount;
    }
  }

  return undefined;
};

const buildCategoryCandidates = (customCategories: Record<string, CategoryLike>) => {
  const systemCandidates = Object.entries(CATEGORY_LABELS).flatMap(([id, label]) => [
    {id, label, term: label},
    {id, label, term: id},
  ]);
  const keywordCandidates = Object.entries(KEYWORD_CATEGORIES).map(([term, id]) => ({
    id,
    label: CATEGORY_LABELS[id] || id,
    term,
  }));
  const customCandidates = Object.entries(customCategories).flatMap(([id, item]) => {
    const label = item.name?.trim() || id;
    return [
      {id, label, term: label},
      {id, label, term: id},
      ...(item.keywords || []).map(term => ({id, label, term})),
    ];
  });

  return [...customCandidates, ...systemCandidates, ...keywordCandidates]
    .map(item => ({
      ...item,
      normalizedTerm: normalize(item.term),
    }))
    .filter(item => item.normalizedTerm.length > 0)
    .sort((a, b) => b.normalizedTerm.length - a.normalizedTerm.length);
};

const resolveCategory = (
  input: string,
  customCategories: Record<string, CategoryLike>,
): {categoryId: string; categoryLabel: string} | undefined => {
  const normalizedInput = normalize(input);
  const candidates = buildCategoryCandidates(customCategories);
  const match = candidates.find(item => normalizedInput.includes(item.normalizedTerm));
  if (!match) {
    return undefined;
  }
  return {
    categoryId: match.id,
    categoryLabel: match.label,
  };
};

export const parseBudgetSetupAction = (
  input: string,
  options: BudgetSetupParseOptions = {},
): BudgetSetupParseResult => {
  const amount = extractAmount(input);
  const category = resolveCategory(input, options.customCategories || {});

  if (amount && category) {
    return {
      status: 'ready',
      categoryId: category.categoryId,
      categoryLabel: category.categoryLabel,
      amount,
    };
  }

  if (!amount) {
    return {
      status: 'missing_amount',
      ...category,
    };
  }

  return {
    status: 'missing_category',
    amount,
  };
};
