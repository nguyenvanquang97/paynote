import dayjs from 'dayjs';
import {useAppStore} from '../../../app/store';
import {getCategoryLabel} from '../../../shared/constants';
import type {Transaction} from '../../../shared/types';
import type {AIIntent} from '../types/aiChat.types';

type CategoryLike = {name?: string};

export type FinancialContext = {
  now: number;
  period: {
    startDate: string;
    endDate: string;
    label: string;
  };
  totals: {
    income: number;
    expense: number;
    balance: number;
  };
  categoryBreakdown: Array<{
    categoryId?: string;
    categoryName: string;
    amount: number;
    transactionCount: number;
    percentage: number;
  }>;
  topTransactions: Array<{
    id: string;
    amount: number;
    description?: string;
    categoryName?: string;
    transactionDate: string;
  }>;
  duplicateCandidates?: Array<{
    transactionIds: string[];
    reason: string;
    amount: number;
    transactionDate: string;
  }>;
  missedTransactionWarnings?: Array<{
    reason: string;
    expectedPattern?: string;
  }>;
  comparison?: {
    currentExpense: number;
    previousExpense: number;
    deltaAmount: number;
    deltaPercent: number;
    trend: 'up' | 'down' | 'flat';
  };
};

type PeriodRange = {
  start: number;
  end: number;
  label: string;
};

type BuildOptions = {
  transactions: Transaction[];
  customCategories?: Record<string, CategoryLike>;
  now?: number;
  intent: AIIntent;
  input: string;
};

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const resolveCategoryName = (
  categoryId: string | undefined,
  customCategories: Record<string, CategoryLike>,
): string => {
  if (categoryId && customCategories[categoryId]?.name) {
    return customCategories[categoryId]?.name || getCategoryLabel(categoryId);
  }
  return getCategoryLabel(categoryId || 'other');
};

const resolvePeriod = (intent: AIIntent, input: string, now: number): PeriodRange => {
  const normalized = normalize(input);
  if (normalized.includes('hom nay') || normalized.includes('today')) {
    const start = dayjs(now).startOf('day');
    const end = dayjs(now).endOf('day');
    return {
      start: start.valueOf(),
      end: end.valueOf(),
      label: 'Hôm nay',
    };
  }

  if (intent === 'period_compare') {
    const start = dayjs(now).startOf('month');
    const end = dayjs(now).endOf('day');
    return {
      start: start.valueOf(),
      end: end.valueOf(),
      label: 'Tháng này',
    };
  }

  const start = dayjs(now).startOf('month');
  const end = dayjs(now).endOf('day');
  return {
    start: start.valueOf(),
    end: end.valueOf(),
    label: 'Tháng này',
  };
};

export const getCurrentMonthSummary = (transactions: Transaction[], now = Date.now()) => {
  const start = dayjs(now).startOf('month').valueOf();
  const end = dayjs(now).endOf('day').valueOf();
  const list = transactions.filter(tx => tx.timestamp >= start && tx.timestamp <= end);
  return buildTotals(list);
};

export const getTodaySummary = (transactions: Transaction[], now = Date.now()) => {
  const start = dayjs(now).startOf('day').valueOf();
  const end = dayjs(now).endOf('day').valueOf();
  const list = transactions.filter(tx => tx.timestamp >= start && tx.timestamp <= end);
  return buildTotals(list);
};

export const getPreviousMonthSummary = (transactions: Transaction[], now = Date.now()) => {
  const start = dayjs(now).subtract(1, 'month').startOf('month').valueOf();
  const end = dayjs(now).subtract(1, 'month').endOf('month').valueOf();
  const list = transactions.filter(tx => tx.timestamp >= start && tx.timestamp <= end);
  return buildTotals(list);
};

const buildTotals = (transactions: Transaction[]) => {
  const income = transactions
    .filter(tx => tx.transactionType === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const expense = transactions
    .filter(tx => tx.transactionType === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);
  return {
    income,
    expense,
    balance: income - expense,
  };
};

export const getCategoryBreakdown = (
  transactions: Transaction[],
  customCategories: Record<string, CategoryLike>,
) => {
  const expenses = transactions.filter(tx => tx.transactionType === 'expense');
  const totalExpense = expenses.reduce((sum, tx) => sum + tx.amount, 0);

  if (totalExpense <= 0) {
    return [];
  }

  const map = new Map<string, {amount: number; count: number; categoryId?: string}>();
  expenses.forEach(tx => {
    const key = tx.category || 'other';
    const item = map.get(key) || {amount: 0, count: 0, categoryId: tx.category};
    item.amount += tx.amount;
    item.count += 1;
    map.set(key, item);
  });

  return Array.from(map.entries())
    .map(([categoryId, item]) => ({
      categoryId,
      categoryName: resolveCategoryName(categoryId, customCategories),
      amount: item.amount,
      transactionCount: item.count,
      percentage: Number(((item.amount / totalExpense) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);
};

export const getTopExpenseTransactions = (
  transactions: Transaction[],
  customCategories: Record<string, CategoryLike>,
) => {
  return transactions
    .filter(tx => tx.transactionType === 'expense')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)
    .map(tx => ({
      id: tx.id,
      amount: tx.amount,
      description: tx.description,
      categoryName: resolveCategoryName(tx.category, customCategories),
      transactionDate: dayjs(tx.timestamp).format('DD/MM/YYYY HH:mm'),
    }));
};

const normalizeDescription = (value: string | undefined): string =>
  (value || '').trim().toLowerCase();

export const getDuplicateCandidates = (transactions: Transaction[]) => {
  const group = new Map<string, Transaction[]>();

  transactions.forEach(tx => {
    const rounded5m = Math.floor(tx.timestamp / (5 * 60 * 1000));
    const key = [
      tx.transactionType,
      tx.amount,
      dayjs(tx.timestamp).format('YYYY-MM-DD'),
      rounded5m,
      normalizeDescription(tx.description),
    ].join('|');
    const items = group.get(key) || [];
    items.push(tx);
    group.set(key, items);
  });

  return Array.from(group.values())
    .filter(items => items.length >= 2)
    .map(items => {
      const first = items[0];
      return {
        transactionIds: items.map(tx => tx.id),
        reason: 'Cùng số tiền, cùng mô tả và gần thời điểm nhau',
        amount: first?.amount || 0,
        transactionDate: dayjs(first?.timestamp || Date.now()).format('DD/MM/YYYY'),
      };
    })
    .sort((a, b) => b.transactionIds.length - a.transactionIds.length)
    .slice(0, 5);
};

export const getMissedTransactionWarnings = (transactions: Transaction[]) => {
  const suspected = transactions.filter(tx => tx.isSuspectedGap).slice(0, 5);
  return suspected.map(tx => ({
    reason: `Có dấu hiệu thiếu giao dịch gần ${dayjs(tx.timestamp).format('DD/MM/YYYY HH:mm')}`,
    expectedPattern: tx.description?.trim() || undefined,
  }));
};

export const buildFinancialContextFromTransactions = (options: BuildOptions): FinancialContext => {
  const now = options.now || Date.now();
  const period = resolvePeriod(options.intent, options.input, now);
  const customCategories = options.customCategories || {};

  const periodTransactions = options.transactions.filter(
    tx => tx.timestamp >= period.start && tx.timestamp <= period.end,
  );

  const totals = buildTotals(periodTransactions);
  const categoryBreakdown = getCategoryBreakdown(periodTransactions, customCategories);
  const topTransactions = getTopExpenseTransactions(periodTransactions, customCategories);
  const duplicateCandidates = getDuplicateCandidates(options.transactions);
  const missedTransactionWarnings = getMissedTransactionWarnings(options.transactions);

  const previous = getPreviousMonthSummary(options.transactions, now);
  const current = getCurrentMonthSummary(options.transactions, now);
  const deltaAmount = current.expense - previous.expense;
  const deltaPercent = previous.expense > 0
    ? Number(((deltaAmount / previous.expense) * 100).toFixed(1))
    : 0;

  return {
    now,
    period: {
      startDate: dayjs(period.start).format('YYYY-MM-DD'),
      endDate: dayjs(period.end).format('YYYY-MM-DD'),
      label: period.label,
    },
    totals,
    categoryBreakdown,
    topTransactions,
    duplicateCandidates,
    missedTransactionWarnings,
    comparison: {
      currentExpense: current.expense,
      previousExpense: previous.expense,
      deltaAmount,
      deltaPercent,
      trend: deltaAmount > 0 ? 'up' : deltaAmount < 0 ? 'down' : 'flat',
    },
  };
};

export const buildFinancialContextForIntent = async (
  intent: AIIntent,
  input: string,
): Promise<FinancialContext> => {
  const state = useAppStore.getState();
  return buildFinancialContextFromTransactions({
    transactions: state.transactions,
    customCategories: state.customCategories,
    intent,
    input,
    now: Date.now(),
  });
};
