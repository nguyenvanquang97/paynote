import {getDatabase} from '../../../database/database';

const normalizeText = (input?: string): string =>
  (input || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const normalizeAmount = (value?: number): string =>
  typeof value === 'number' && Number.isFinite(value) ? value.toFixed(2) : '';

export const generateDedupeKey = (
  bank: string,
  amount: number,
  timestamp: number,
  transactionType: 'income' | 'expense',
  description?: string,
  balanceAfter?: number,
  rawText?: string,
): string => {
  const roundedTimestampByMinute = Math.floor(timestamp / 60000) * 60000;
  const parts = [
    normalizeText(bank),
    transactionType,
    normalizeAmount(amount),
    normalizeAmount(balanceAfter),
    String(roundedTimestampByMinute),
    normalizeText(description),
    normalizeText(rawText),
  ];

  return parts.join('|');
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
  const dedupeKey = generateDedupeKey(
    bank,
    amount,
    timestamp,
    transactionType,
    description,
    balanceAfter,
    rawText,
  );
  const [results] = await db.executeSql(
    `SELECT COUNT(*) as count FROM transactions WHERE dedupe_key = ?`,
    [dedupeKey],
  );
  return results.rows.item(0).count > 0;
};
