import type {BankNotification, Transaction} from '../../shared/types';
import {detectBank} from './detectors';
import {parseNotification} from './parsers';
import {categorizeTransaction} from './categorization';
import {checkReconciliation} from './reconciliation';
import {insertTransaction} from '../../database';
import {useAppStore} from '../../app/store';

/**
 * Main notification processing pipeline
 *
 * Flow:
 * 1. Detect bank from package name
 * 2. Parse notification text
 * 3. Categorize transaction
 * 4. Save to database (DB-level dedupe with unique key)
 * 5. Run reconciliation check
 */
export const processNotification = async (
  notification: BankNotification,
): Promise<{
  transaction: Transaction | null;
  isSuspectedGap: boolean;
  missingAmount?: number;
  skippedReason?: string;
}> => {
  // Step 1: Detect bank
  const bank = detectBank(notification.packageName, notification.title);

  if (bank === 'unknown') {
    return {
      transaction: null,
      isSuspectedGap: false,
      skippedReason: 'Unknown bank',
    };
  }

  // Step 2: Parse notification
  const parsed = parseNotification(bank, notification.text || '');

  if (!parsed) {
    return {
      transaction: null,
      isSuspectedGap: false,
      skippedReason: 'Could not parse notification',
    };
  }

  // Step 3: Categorize
  const customCategories = useAppStore.getState().customCategories;
  const category = categorizeTransaction(parsed.description, customCategories);

  // Step 4: Save to database
  const transaction = await insertTransaction(bank, parsed, category);
  if (!transaction) {
    return {
      transaction: null,
      isSuspectedGap: false,
      skippedReason: 'Duplicate transaction',
    };
  }

  // Step 5: Reconciliation
  const reconciliationResult = await checkReconciliation(transaction);

  return {
    transaction,
    isSuspectedGap: reconciliationResult.isSuspected,
    missingAmount: reconciliationResult.missingAmount,
  };
};

export {detectBank} from './detectors';
export {parseNotification} from './parsers';
export {categorizeTransaction, getAllCategories} from './categorization';
export {isDuplicate, generateDedupeKey} from './services';
export {checkReconciliation} from './reconciliation';
