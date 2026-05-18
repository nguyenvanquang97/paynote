import dayjs from 'dayjs';
import type {Transaction} from '../../../../shared/types';
jest.mock('../../../../app/store', () => ({
  useAppStore: {
    getState: () => ({transactions: [], customCategories: {}}),
  },
}));
import {
  buildFinancialContextFromTransactions,
  getCurrentMonthSummary,
  getPreviousMonthSummary,
} from '../financialContextService';

const NOW = dayjs('2026-05-17T10:00:00').valueOf();

const tx = (
  id: string,
  type: 'income' | 'expense',
  amount: number,
  timestamp: string,
  extras: Partial<Transaction> = {},
): Transaction => ({
  id,
  transactionType: type,
  amount,
  timestamp: dayjs(timestamp).valueOf(),
  rawText: '',
  bank: 'mb',
  isSuspectedGap: false,
  createdAt: dayjs(timestamp).valueOf(),
  ...extras,
});

describe('financialContextService', () => {
  it('handles empty transactions safely', () => {
    const context = buildFinancialContextFromTransactions({
      transactions: [],
      customCategories: {},
      now: NOW,
      intent: 'spending_summary',
      input: 'tháng này tiêu bao nhiêu',
    });

    expect(context.totals.expense).toBe(0);
    expect(context.totals.income).toBe(0);
    expect(context.categoryBreakdown).toHaveLength(0);
  });

  it('builds current month totals and category percentages', () => {
    const transactions: Transaction[] = [
      tx('1', 'income', 1000000, '2026-05-01T08:00:00', {category: 'salary'}),
      tx('2', 'expense', 300000, '2026-05-03T10:00:00', {category: 'food'}),
      tx('3', 'expense', 200000, '2026-05-04T10:00:00', {category: 'cafe'}),
      tx('4', 'expense', 100000, '2026-05-05T10:00:00', {category: 'transport'}),
      tx('5', 'expense', 50000, '2026-04-18T10:00:00', {category: 'food'}),
    ];

    const context = buildFinancialContextFromTransactions({
      transactions,
      customCategories: {},
      now: NOW,
      intent: 'spending_summary',
      input: 'tháng này tiêu bao nhiêu',
    });

    expect(context.totals.income).toBe(1000000);
    expect(context.totals.expense).toBe(600000);

    const sumPercent = context.categoryBreakdown.reduce((sum, item) => sum + item.percentage, 0);
    expect(sumPercent).toBeGreaterThan(99);
    expect(sumPercent).toBeLessThan(101);
  });

  it('supports month comparison summary', () => {
    const transactions: Transaction[] = [
      tx('1', 'expense', 500000, '2026-05-10T10:00:00', {category: 'food'}),
      tx('2', 'expense', 400000, '2026-04-10T10:00:00', {category: 'food'}),
    ];

    const current = getCurrentMonthSummary(transactions, NOW);
    const previous = getPreviousMonthSummary(transactions, NOW);

    expect(current.expense).toBe(500000);
    expect(previous.expense).toBe(400000);

    const context = buildFinancialContextFromTransactions({
      transactions,
      customCategories: {},
      now: NOW,
      intent: 'period_compare',
      input: 'so sánh tháng này với tháng trước',
    });

    expect(context.comparison?.deltaAmount).toBe(100000);
    expect(context.comparison?.trend).toBe('up');
  });

  it('detects duplicate candidate groups', () => {
    const transactions: Transaction[] = [
      tx('a', 'expense', 250000, '2026-05-12T09:30:00', {description: 'Cafe sáng'}),
      tx('b', 'expense', 250000, '2026-05-12T09:33:00', {description: 'Cafe sáng'}),
      tx('c', 'expense', 100000, '2026-05-12T12:00:00', {description: 'Trà'}),
    ];

    const context = buildFinancialContextFromTransactions({
      transactions,
      customCategories: {},
      now: NOW,
      intent: 'duplicate_check',
      input: 'có giao dịch nào trùng không',
    });

    expect((context.duplicateCandidates || []).length).toBeGreaterThan(0);
    expect(context.duplicateCandidates?.[0]?.transactionIds).toContain('a');
    expect(context.duplicateCandidates?.[0]?.transactionIds).toContain('b');
  });

  it('hides duplicate groups that user already reviewed', () => {
    const transactions: Transaction[] = [
      tx('a', 'expense', 250000, '2026-05-12T09:30:00', {description: 'Cafe sáng'}),
      tx('b', 'expense', 250000, '2026-05-12T09:33:00', {description: 'Cafe sáng'}),
    ];

    const reviewedKey = ['a', 'b'].sort().join('|');
    const context = buildFinancialContextFromTransactions({
      transactions,
      customCategories: {},
      duplicateReviewMap: {
        [reviewedKey]: {
          key: reviewedKey,
          transactionIds: ['a', 'b'],
          status: 'ignored',
          updatedAt: NOW,
        },
      },
      now: NOW,
      intent: 'duplicate_check',
      input: 'có giao dịch nào trùng không',
    });

    expect(context.duplicateCandidates).toHaveLength(0);
  });
});
