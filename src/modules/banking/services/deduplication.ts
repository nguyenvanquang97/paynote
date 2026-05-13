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
  amount: number,
  timestamp: number,
  description?: string,
): Promise<boolean> => {
  const db = await getDatabase();

  // Check for transactions within 2 minutes with same amount
  const timeWindow = 120000; // 2 minutes
  const startTime = timestamp - timeWindow;
  const endTime = timestamp + timeWindow;

  const [results] = await db.executeSql(
    `SELECT COUNT(*) as count FROM transactions
     WHERE amount = ?
     AND timestamp >= ? AND timestamp <= ?
     AND (description = ? OR (description IS NULL AND ? IS NULL))`,
    [amount, startTime, endTime, description || null, description || null],
  );

  return results.rows.item(0).count > 0;
};
