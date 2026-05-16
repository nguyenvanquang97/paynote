/**
 * Duplicate Detection System
 *
 * Creates a hash from transaction key fields to detect
 * and skip duplicate notifications.
 *
 * Hash = amount + timestamp (rounded to minute) + description
 */

import {getDatabase} from '../../../database';

export const generateTransactionHash = (
  amount: number,
  timestamp: number,
  description?: string,
): string => {
  // Round timestamp to nearest minute to catch near-duplicate notifications
  const roundedTimestamp = Math.floor(timestamp / 60000) * 60000;

  const hashInput = `${amount}_${roundedTimestamp}_${description || ''}`;

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < hashInput.length; i++) {
    const char = hashInput.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }

  return hash.toString(36);
};

export const isDuplicate = async (
  bank: string,
  amount: number,
  timestamp: number,
  transactionType: 'income' | 'expense',
  description?: string,
  balanceAfter?: number,
  rawText?: string,
): Promise<boolean> => {
  const db = await getDatabase();

  const normalizedDescription = (description || '').trim().toLowerCase();

  // Strong check: same bank + same raw notification text means duplicate.
  if (rawText && rawText.trim().length > 0) {
    const [rawTextResults] = await db.executeSql(
      `SELECT COUNT(*) as count FROM transactions
       WHERE bank = ?
       AND raw_text = ?`,
      [bank, rawText],
    );

    if (rawTextResults.rows.item(0).count > 0) {
      return true;
    }
  }

  // Fallback check: match key fields within a short time window.
  const timeWindow = 120000; // 2 minutes
  const startTime = timestamp - timeWindow;
  const endTime = timestamp + timeWindow;

  const [results] = await db.executeSql(
    `SELECT COUNT(*) as count FROM transactions
     WHERE bank = ?
     AND transaction_type = ?
     AND amount = ?
     AND timestamp >= ? AND timestamp <= ?
     AND lower(trim(COALESCE(description, ''))) = ?
     AND (
       (balance_after = ?)
       OR (balance_after IS NULL AND ? IS NULL)
     )`,
    [
      bank,
      transactionType,
      amount,
      startTime,
      endTime,
      normalizedDescription,
      balanceAfter ?? null,
      balanceAfter ?? null,
    ],
  );

  return results.rows.item(0).count > 0;
};
