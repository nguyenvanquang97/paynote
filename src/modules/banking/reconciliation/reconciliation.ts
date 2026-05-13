import type {Transaction} from '../../../shared/types';
import {getLatestTransaction, markAsSuspectedGap} from '../../../database';

/**
 * Reconciliation System
 *
 * Detects missed transactions by comparing expected balance
 * with actual balance after each transaction.
 *
 * Example:
 *   Notification 1: +500,000 → Balance: 5,000,000
 *   Notification 2: -50,000  → Balance: 4,750,000
 *   Expected: 5,000,000 - 50,000 = 4,950,000
 *   Actual: 4,750,000
 *   => Missing 200,000 transaction detected!
 */
export const checkReconciliation = async (
  newTransaction: Transaction,
): Promise<{isSuspected: boolean; missingAmount?: number}> => {
  // Can't reconcile without balance info
  if (newTransaction.balanceAfter === undefined) {
    return {isSuspected: false};
  }

  // Get the last transaction for the same bank
  const prevTransaction = await getLatestTransaction(newTransaction.bank);

  if (!prevTransaction || prevTransaction.balanceAfter === undefined) {
    return {isSuspected: false};
  }

  // Calculate expected balance
  const amountWithSign =
    newTransaction.transactionType === 'expense'
      ? -newTransaction.amount
      : newTransaction.amount;

  const expectedBalance = prevTransaction.balanceAfter + amountWithSign;

  // Compare with actual balance (allow small rounding differences)
  const difference = Math.abs(expectedBalance - newTransaction.balanceAfter);

  if (difference > 1) {
    // Significant difference detected
    await markAsSuspectedGap(newTransaction.id, true);

    return {
      isSuspected: true,
      missingAmount: newTransaction.balanceAfter - expectedBalance,
    };
  }

  return {isSuspected: false};
};
