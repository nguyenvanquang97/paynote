import uuid from 'react-native-uuid';
import {getDatabase} from './database';
import type {Transaction, ParsedTransaction} from '../shared/types';

export const insertTransaction = async (
  bank: string,
  parsed: ParsedTransaction,
  category?: string,
): Promise<Transaction> => {
  const db = await getDatabase();

  const transaction: Transaction = {
    ...parsed,
    id: uuid.v4() as string,
    bank,
    category: category || undefined,
    isSuspectedGap: false,
    createdAt: Date.now(),
  };

  await db.executeSql(
    `INSERT INTO transactions
      (id, bank, amount, balance_after, description, category,
       transaction_type, timestamp, raw_text, is_suspected_gap, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      transaction.id,
      transaction.bank,
      transaction.amount,
      transaction.balanceAfter || null,
      transaction.description || null,
      transaction.category || null,
      transaction.transactionType,
      transaction.timestamp,
      transaction.rawText,
      transaction.isSuspectedGap ? 1 : 0,
      transaction.createdAt,
    ],
  );

  return transaction;
};

export const getTransactions = async (
  limit: number = 50,
  offset: number = 0,
): Promise<Transaction[]> => {
  const db = await getDatabase();

  const [results] = await db.executeSql(
    `SELECT * FROM transactions ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
    [limit, offset],
  );

  const transactions: Transaction[] = [];

  for (let i = 0; i < results.rows.length; i++) {
    const row = results.rows.item(i);
    transactions.push(mapRowToTransaction(row));
  }

  return transactions;
};

export const getTransactionsByDateRange = async (
  startDate: number,
  endDate: number,
): Promise<Transaction[]> => {
  const db = await getDatabase();

  const [results] = await db.executeSql(
    `SELECT * FROM transactions
     WHERE timestamp >= ? AND timestamp <= ?
     ORDER BY timestamp DESC`,
    [startDate, endDate],
  );

  const transactions: Transaction[] = [];

  for (let i = 0; i < results.rows.length; i++) {
    const row = results.rows.item(i);
    transactions.push(mapRowToTransaction(row));
  }

  return transactions;
};

export const getTransactionsByCategory = async (
  category: string,
): Promise<Transaction[]> => {
  const db = await getDatabase();

  const [results] = await db.executeSql(
    `SELECT * FROM transactions WHERE category = ? ORDER BY timestamp DESC`,
    [category],
  );

  const transactions: Transaction[] = [];

  for (let i = 0; i < results.rows.length; i++) {
    const row = results.rows.item(i);
    transactions.push(mapRowToTransaction(row));
  }

  return transactions;
};

export const updateTransactionCategory = async (
  id: string,
  category: string,
): Promise<void> => {
  const db = await getDatabase();

  await db.executeSql(
    `UPDATE transactions SET category = ? WHERE id = ?`,
    [category, id],
  );
};

export const markAsSuspectedGap = async (
  id: string,
  isSuspectedGap: boolean,
): Promise<void> => {
  const db = await getDatabase();

  await db.executeSql(
    `UPDATE transactions SET is_suspected_gap = ? WHERE id = ?`,
    [isSuspectedGap ? 1 : 0, id],
  );
};

export const deleteTransaction = async (id: string): Promise<void> => {
  const db = await getDatabase();

  await db.executeSql(
    `DELETE FROM transactions WHERE id = ?`,
    [id],
  );
};

export const updateTransaction = async (
  id: string,
  fields: {
    amount: number;
    transactionType: 'income' | 'expense';
    description?: string;
    category?: string;
    timestamp: number;
  },
): Promise<void> => {
  const db = await getDatabase();

  await db.executeSql(
    `UPDATE transactions SET amount = ?, transaction_type = ?, description = ?, category = ?, timestamp = ? WHERE id = ?`,
    [
      fields.amount,
      fields.transactionType,
      fields.description || null,
      fields.category || null,
      fields.timestamp,
      id,
    ],
  );
};


export const deleteAllTransactions = async (): Promise<void> => {
  const db = await getDatabase();
  await db.executeSql(`DELETE FROM transactions`);
};

export const importTransactions = async (transactions: Transaction[]): Promise<void> => {
  const db = await getDatabase();
  await db.transaction(tx => {
    for (const transaction of transactions) {
      tx.executeSql(
        `INSERT INTO transactions
          (id, bank, amount, balance_after, description, category,
           transaction_type, timestamp, raw_text, is_suspected_gap, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transaction.id,
          transaction.bank,
          transaction.amount,
          transaction.balanceAfter || null,
          transaction.description || null,
          transaction.category || null,
          transaction.transactionType,
          transaction.timestamp,
          transaction.rawText,
          transaction.isSuspectedGap ? 1 : 0,
          transaction.createdAt,
        ],
      );
    }
  });
};

export const getMonthlyStats = async (
  year: number,
  month: number,
): Promise<{totalIncome: number; totalExpense: number}> => {
  const db = await getDatabase();

  const startDate = new Date(year, month - 1, 1).getTime();
  const endDate = new Date(year, month, 0, 23, 59, 59, 999).getTime();

  const [incomeResult] = await db.executeSql(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM transactions
     WHERE transaction_type = 'income'
     AND timestamp >= ? AND timestamp <= ?`,
    [startDate, endDate],
  );

  const [expenseResult] = await db.executeSql(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM transactions
     WHERE transaction_type = 'expense'
     AND timestamp >= ? AND timestamp <= ?`,
    [startDate, endDate],
  );

  return {
    totalIncome: incomeResult.rows.item(0).total,
    totalExpense: expenseResult.rows.item(0).total,
  };
};

export const getCategoryStats = async (
  startDate: number,
  endDate: number,
): Promise<Array<{category: string; total: number; count: number}>> => {
  const db = await getDatabase();

  const [results] = await db.executeSql(
    `SELECT
       COALESCE(category, 'other') as category,
       SUM(amount) as total,
       COUNT(*) as count
     FROM transactions
     WHERE transaction_type = 'expense'
     AND timestamp >= ? AND timestamp <= ?
     GROUP BY category
     ORDER BY total DESC`,
    [startDate, endDate],
  );

  const stats: Array<{category: string; total: number; count: number}> = [];

  for (let i = 0; i < results.rows.length; i++) {
    const row = results.rows.item(i);
    stats.push({
      category: row.category,
      total: row.total,
      count: row.count,
    });
  }

  return stats;
};

export const getLatestTransaction = async (
  bank?: string,
): Promise<Transaction | null> => {
  const db = await getDatabase();

  const query = bank
    ? `SELECT * FROM transactions WHERE bank = ? ORDER BY timestamp DESC LIMIT 1`
    : `SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 1`;

  const params = bank ? [bank] : [];

  const [results] = await db.executeSql(query, params);

  if (results.rows.length === 0) {
    return null;
  }

  return mapRowToTransaction(results.rows.item(0));
};

export const getPreviousTransaction = async (
  bank: string,
  timestamp: number,
  createdAt: number,
  excludeId: string,
): Promise<Transaction | null> => {
  const db = await getDatabase();

  const [results] = await db.executeSql(
    `SELECT * FROM transactions
     WHERE bank = ?
     AND id != ?
     AND (
       timestamp < ?
       OR (timestamp = ? AND created_at < ?)
     )
     ORDER BY timestamp DESC, created_at DESC
     LIMIT 1`,
    [bank, excludeId, timestamp, timestamp, createdAt],
  );

  if (results.rows.length === 0) {
    return null;
  }

  return mapRowToTransaction(results.rows.item(0));
};

// Helper function to map DB row to Transaction type
const mapRowToTransaction = (row: any): Transaction => ({
  id: row.id,
  bank: row.bank,
  amount: row.amount,
  balanceAfter: row.balance_after,
  description: row.description,
  category: row.category,
  transactionType: row.transaction_type,
  timestamp: row.timestamp,
  rawText: row.raw_text,
  isSuspectedGap: row.is_suspected_gap === 1,
  createdAt: row.created_at,
});
