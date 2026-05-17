import {buildLLMMessages, sanitizeFinancialContext} from '../llm/llmPromptBuilder';
import type {FinancialContext} from '../financialContextService';

const context: FinancialContext = {
  now: Date.now(),
  period: {
    startDate: '2026-05-01',
    endDate: '2026-05-17',
    label: 'Tháng này',
  },
  totals: {
    income: 1000000,
    expense: 400000,
    balance: 600000,
  },
  categoryBreakdown: [
    {
      categoryId: 'food',
      categoryName: 'Ăn uống',
      amount: 300000,
      transactionCount: 3,
      percentage: 75,
    },
  ],
  topTransactions: [
    {
      id: '1',
      amount: 100000,
      description: 'Chuyen khoan 123456789012',
      categoryName: 'Ăn uống',
      transactionDate: '17/05/2026 10:00',
    },
  ],
};

describe('llmPromptBuilder', () => {
  it('builds system and user messages with intent/context', () => {
    const messages = buildLLMMessages('Tháng này tôi tiêu bao nhiêu?', 'spending_summary', context);
    expect(messages).toHaveLength(2);
    expect(messages[0]?.role).toBe('system');
    expect(messages[1]?.role).toBe('user');
    expect(messages[1]?.content).toContain('Intent:\nspending_summary');
    expect(messages[1]?.content).toContain('Financial context');
  });

  it('redacts long number sequences in context', () => {
    const sanitized = sanitizeFinancialContext(context);
    const description = sanitized.topTransactions[0]?.description || '';
    expect(description).toContain('[redacted]');
    expect(description).not.toContain('123456789012');
  });
});
