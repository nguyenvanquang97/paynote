import uuid from 'react-native-uuid';
import {getDatabase} from './database';
import type {Transaction, ParsedTransaction} from '../shared/types';
import {generateDedupeKey} from '../modules/banking/services/deduplication';
import {cloudTransactionsApi, hasCloudSession} from '../services/cloud/apiClient';
import type {Transaction as CloudTransaction} from '@paynote/shared';

const mapCloudTransaction = (transaction: CloudTransaction): Transaction => ({
  id: transaction.id,
  bank: transaction.bank,
  amount: transaction.amount,
  balanceAfter: transaction.balanceAfter ?? undefined,
  description: transaction.description ?? undefined,
  category: transaction.category ?? undefined,
  transactionType: transaction.transactionType,
  timestamp: transaction.timestamp,
  rawText: transaction.rawText,
  isSuspectedGap: transaction.isSuspectedGap,
  createdAt: transaction.createdAt,
});

export const insertTransaction = async (
  bank: string,
  parsed: ParsedTransaction,
  category?: string,
): Promise<Transaction | null> => {
  if (hasCloudSession()) {
    const transaction = await cloudTransactionsApi.create({
      ...parsed,
      bank,
      category: category || undefined,
    });
    return transaction ? mapCloudTransaction(transaction) : null;
  }

  const db = await getDatabase();
  const dedupeKey = generateDedupeKey(
    bank,
    parsed.amount,
    parsed.timestamp,
    parsed.transactionType,
    parsed.description,
    parsed.balanceAfter,
    parsed.rawText,
  );

  const transaction: Transaction = {
    ...parsed,
    id: uuid.v4() as string,
    bank,
    category: category || undefined,
    isSuspectedGap: false,
    createdAt: Date.now(),
  };

  await db.executeSql(
    `INSERT OR IGNORE INTO transactions
      (id, bank, amount, balance_after, description, category,
       transaction_type, timestamp, raw_text, is_suspected_gap, created_at, dedupe_key)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      dedupeKey,
    ],
  );

  const [insertCheck] = await db.executeSql(
    `SELECT id FROM transactions WHERE dedupe_key = ? LIMIT 1`,
    [dedupeKey],
  );
  const insertedId = insertCheck.rows.length > 0 ? insertCheck.rows.item(0).id : null;
  if (insertedId !== transaction.id) {
    return null;
  }

  return transaction;
};

export const getTransactions = async (
  limit: number = 50,
  offset: number = 0,
): Promise<Transaction[]> => {
  if (hasCloudSession()) {
    const transactions = await cloudTransactionsApi.list({limit, offset});
    return transactions.map(mapCloudTransaction);
  }

  return [];
};

export const getTransactionsByDateRange = async (
  startDate: number,
  endDate: number,
): Promise<Transaction[]> => {
  if (hasCloudSession()) {
    const transactions = await cloudTransactionsApi.list({startDate, endDate, limit: 500});
    return transactions.map(mapCloudTransaction);
  }

  return [];
};

export const getTransactionsByCategory = async (
  category: string,
): Promise<Transaction[]> => {
  if (hasCloudSession()) {
    const transactions = await cloudTransactionsApi.list({limit: 500});
    return transactions
      .filter(transaction => transaction.category === category)
      .map(mapCloudTransaction);
  }

  return [];
};

export const updateTransactionCategory = async (
  id: string,
  category: string,
): Promise<void> => {
  if (hasCloudSession()) {
    await cloudTransactionsApi.update(id, {category});
    return;
  }

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
  if (hasCloudSession()) {
    await cloudTransactionsApi.update(id, {isSuspectedGap});
    return;
  }

  const db = await getDatabase();

  await db.executeSql(
    `UPDATE transactions SET is_suspected_gap = ? WHERE id = ?`,
    [isSuspectedGap ? 1 : 0, id],
  );
};

export const deleteTransaction = async (id: string): Promise<void> => {
  if (hasCloudSession()) {
    await cloudTransactionsApi.remove(id);
    return;
  }

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
  if (hasCloudSession()) {
    await cloudTransactionsApi.update(id, fields);
    return;
  }

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
  if (hasCloudSession()) {
    const transactions = await cloudTransactionsApi.list({limit: 500});
    await Promise.all(transactions.map(transaction => cloudTransactionsApi.remove(transaction.id)));
    return;
  }

  const db = await getDatabase();
  await db.executeSql(`DELETE FROM transactions`);
};

export const importTransactions = async (transactions: Transaction[]): Promise<void> => {
  if (hasCloudSession()) {
    for (const transaction of transactions) {
      await cloudTransactionsApi.create({
        bank: transaction.bank,
        amount: transaction.amount,
        balanceAfter: transaction.balanceAfter,
        description: transaction.description,
        transactionType: transaction.transactionType,
        timestamp: transaction.timestamp,
        rawText: transaction.rawText,
        category: transaction.category,
      });
    }
    return;
  }

  const db = await getDatabase();
  await db.transaction(tx => {
    for (const transaction of transactions) {
      const dedupeKey = generateDedupeKey(
        transaction.bank,
        transaction.amount,
        transaction.timestamp,
        transaction.transactionType,
        transaction.description,
        transaction.balanceAfter,
        transaction.rawText,
      );
      tx.executeSql(
        `INSERT OR IGNORE INTO transactions
          (id, bank, amount, balance_after, description, category,
           transaction_type, timestamp, raw_text, is_suspected_gap, created_at, dedupe_key)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          dedupeKey,
        ],
      );
    }
  });
};

export const getMonthlyStats = async (
  year: number,
  month: number,
): Promise<{totalIncome: number; totalExpense: number}> => {
  if (hasCloudSession()) {
    return cloudTransactionsApi.monthlyStats(year, month);
  }

  return {totalIncome: 0, totalExpense: 0};
};

export const getCategoryStats = async (
  startDate: number,
  endDate: number,
): Promise<Array<{category: string; total: number; count: number}>> => {
  if (hasCloudSession()) {
    return cloudTransactionsApi.categoryStats(startDate, endDate);
  }

  return [];
};

export const getLatestTransaction = async (
  bank?: string,
): Promise<Transaction | null> => {
  if (hasCloudSession()) {
    const transactions = await cloudTransactionsApi.list({limit: 1});
    const transaction = bank ? transactions.find(item => item.bank === bank) || null : transactions[0] || null;
    return transaction ? mapCloudTransaction(transaction) : null;
  }

  return null;
};

export const getPreviousTransaction = async (
  bank: string,
  timestamp: number,
  createdAt: number,
  excludeId: string,
): Promise<Transaction | null> => {
  if (hasCloudSession()) {
    const transactions = await cloudTransactionsApi.list({limit: 500, endDate: timestamp});
    const transaction = transactions.find(item =>
      item.bank === bank &&
      item.id !== excludeId &&
      (item.timestamp < timestamp ||
        (item.timestamp === timestamp && item.createdAt < createdAt)),
    ) || null;
    return transaction ? mapCloudTransaction(transaction) : null;
  }

  return null;
};
