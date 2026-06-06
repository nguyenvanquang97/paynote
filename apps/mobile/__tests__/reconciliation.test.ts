import type {Transaction} from '../src/shared/types';
import {checkReconciliation} from '../src/modules/banking/reconciliation';
import {getPreviousTransaction, markAsSuspectedGap} from '../src/database';

jest.mock('../src/database', () => ({
  getPreviousTransaction: jest.fn(),
  markAsSuspectedGap: jest.fn(),
}));

const mockGetPreviousTransaction = getPreviousTransaction as jest.Mock;
const mockMarkAsSuspectedGap = markAsSuspectedGap as jest.Mock;

const makeTransaction = (
  overrides: Partial<Transaction> = {},
): Transaction => ({
  id: 'tx-new',
  bank: 'mbbank',
  amount: 25000,
  balanceAfter: 75125,
  description: 'NGUYEN VAN QUANG chuyen tien',
  transactionType: 'expense',
  timestamp: new Date(2026, 4, 14, 12, 18, 0, 0).getTime(),
  rawText: 'raw',
  isSuspectedGap: false,
  createdAt: 1000,
  ...overrides,
});

describe('checkReconciliation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not compare the inserted transaction against itself', async () => {
    mockGetPreviousTransaction.mockResolvedValue(null);

    const transaction = makeTransaction();
    const result = await checkReconciliation(transaction);

    expect(mockGetPreviousTransaction).toHaveBeenCalledWith(
      'mbbank',
      transaction.timestamp,
      transaction.createdAt,
      transaction.id,
    );
    expect(mockMarkAsSuspectedGap).not.toHaveBeenCalled();
    expect(result).toEqual({isSuspected: false});
  });

  it('does not mark a gap when previous balance reconciles with the new expense', async () => {
    mockGetPreviousTransaction.mockResolvedValue(
      makeTransaction({
        id: 'tx-prev',
        amount: 60000,
        balanceAfter: 100125,
        timestamp: new Date(2026, 4, 14, 12, 15, 0, 0).getTime(),
        createdAt: 900,
      }),
    );

    const result = await checkReconciliation(makeTransaction());

    expect(mockMarkAsSuspectedGap).not.toHaveBeenCalled();
    expect(result).toEqual({isSuspected: false});
  });

  it('marks a gap when balances do not reconcile', async () => {
    mockGetPreviousTransaction.mockResolvedValue(
      makeTransaction({
        id: 'tx-prev',
        amount: 60000,
        balanceAfter: 100125,
        timestamp: new Date(2026, 4, 14, 12, 15, 0, 0).getTime(),
        createdAt: 900,
      }),
    );

    const transaction = makeTransaction({balanceAfter: 70125});
    const result = await checkReconciliation(transaction);

    expect(mockMarkAsSuspectedGap).toHaveBeenCalledWith('tx-new', true);
    expect(result).toEqual({isSuspected: true, missingAmount: -5000});
  });
});
