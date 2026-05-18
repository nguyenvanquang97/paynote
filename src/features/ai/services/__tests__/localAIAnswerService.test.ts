import {generateLocalAnswer, generateLocalAnswerPayload} from '../localAIAnswerService';
import type {FinancialContext} from '../financialContextService';

const baseContext: FinancialContext = {
  now: Date.now(),
  period: {
    startDate: '2026-05-01',
    endDate: '2026-05-17',
    label: 'Tháng này',
  },
  totals: {
    income: 1000000,
    expense: 600000,
    balance: 400000,
  },
  categoryBreakdown: [
    {
      categoryId: 'food',
      categoryName: 'Ăn uống',
      amount: 300000,
      transactionCount: 3,
      percentage: 50,
    },
    {
      categoryId: 'cafe',
      categoryName: 'Cà phê',
      amount: 180000,
      transactionCount: 4,
      percentage: 30,
    },
  ],
  topTransactions: [],
  duplicateCandidates: [
    {
      transactionIds: ['a', 'b'],
      reason: 'Cùng số tiền, cùng mô tả và gần thời điểm nhau',
      amount: 250000,
      transactionDate: '12/05/2026',
    },
  ],
  missedTransactionWarnings: [],
  comparison: {
    currentExpense: 600000,
    previousExpense: 500000,
    deltaAmount: 100000,
    deltaPercent: 20,
    trend: 'up',
  },
};

describe('localAIAnswerService', () => {
  it('returns helpful answer for spending summary', () => {
    const answer = generateLocalAnswer('tháng này tiêu bao nhiêu', 'spending_summary', baseContext);
    expect(answer).toContain('Tháng này bạn đã chi');
    expect(answer).toContain('Top danh mục');
  });

  it('returns compare answer', () => {
    const answer = generateLocalAnswer('so sánh tháng này với tháng trước', 'period_compare', baseContext);
    expect(answer).toContain('Tháng này bạn chi');
    expect(answer).toContain('tháng trước');
  });

  it('returns duplicate check answer', () => {
    const answer = generateLocalAnswer('có giao dịch bị trùng không', 'duplicate_check', baseContext);
    expect(answer).toContain('khả năng bị trùng');
  });

  it('returns suggestions for unknown intent', () => {
    const answer = generateLocalAnswer('abc xyz', 'unknown', baseContext);
    expect(answer).toContain('Bạn có thể thử một trong các gợi ý sau');
  });

  it('does not crash with empty data', () => {
    const emptyContext: FinancialContext = {
      ...baseContext,
      totals: {income: 0, expense: 0, balance: 0},
      categoryBreakdown: [],
      duplicateCandidates: [],
    };
    const answer = generateLocalAnswer('tháng này tiêu bao nhiêu', 'spending_summary', emptyContext);
    expect(answer).toContain('chưa có dữ liệu');
  });

  it('returns rich cards payload', () => {
    const payload = generateLocalAnswerPayload('tháng này tiêu bao nhiêu', 'spending_summary', baseContext);
    expect(payload.text.length).toBeGreaterThan(0);
    expect(payload.cards.length).toBeGreaterThan(0);
    expect(payload.cards.some(card => card.type === 'summary')).toBe(true);
  });

  it('adds duplicate action buttons for duplicate intent', () => {
    const payload = generateLocalAnswerPayload('có giao dịch nào bị trùng không', 'duplicate_check', baseContext);
    const warning = payload.cards.find(card => card.type === 'warning');
    expect(warning).toBeDefined();
    if (!warning || warning.type !== 'warning') {
      return;
    }
    expect((warning.actions || []).length).toBeGreaterThan(0);
  });
});
