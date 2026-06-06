import {Injectable, NotFoundException} from '@nestjs/common';
import {
  CategoryStatsItem,
  CreateTransactionDto,
  generateTransactionDedupeKey,
  MonthlyStats,
  Transaction,
  TransactionListQuery,
  UpdateTransactionDto,
} from '@paynote/shared';
import {randomUUID} from 'crypto';
import {DatabaseService} from '../database/database.service';

type TransactionRow = {
  id: string;
  bank: string;
  amount: string | number;
  balance_after: string | number | null;
  description: string | null;
  category: string | null;
  transaction_type: 'income' | 'expense';
  timestamp_ms: string | number;
  raw_text: string;
  is_suspected_gap: boolean;
  created_at_ms: string | number;
  dedupe_key: string | null;
};

const toNumber = (value: string | number | null): number | null =>
  value === null ? null : Number(value);

const mapTransaction = (row: TransactionRow): Transaction => ({
  id: row.id,
  bank: row.bank,
  amount: Number(row.amount),
  balanceAfter: toNumber(row.balance_after),
  description: row.description,
  category: row.category,
  transactionType: row.transaction_type,
  timestamp: Number(row.timestamp_ms),
  rawText: row.raw_text,
  isSuspectedGap: row.is_suspected_gap,
  createdAt: Number(row.created_at_ms),
  dedupeKey: row.dedupe_key,
});

@Injectable()
export class TransactionsService {
  constructor(private readonly db: DatabaseService) {}

  async list(userId: string, query: TransactionListQuery): Promise<Transaction[]> {
    const limit = Math.min(Math.max(Number(query.limit || 100), 1), 500);
    const offset = Math.max(Number(query.offset || 0), 0);
    const params: unknown[] = [userId];
    const where = ['user_id = $1'];

    if (query.startDate !== undefined) {
      params.push(Number(query.startDate));
      where.push(`timestamp_ms >= $${params.length}`);
    }
    if (query.endDate !== undefined) {
      params.push(Number(query.endDate));
      where.push(`timestamp_ms <= $${params.length}`);
    }

    params.push(limit, offset);
    const result = await this.db.query<TransactionRow>(
      `SELECT * FROM transactions
       WHERE ${where.join(' AND ')}
       ORDER BY timestamp_ms DESC, created_at_ms DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return result.rows.map(mapTransaction);
  }

  async create(userId: string, dto: CreateTransactionDto): Promise<Transaction | null> {
    const id = randomUUID();
    const createdAt = Date.now();
    const dedupeKey = generateTransactionDedupeKey(
      dto.bank,
      dto.amount,
      dto.timestamp,
      dto.transactionType,
      dto.description,
      dto.balanceAfter,
      dto.rawText,
    );

    const result = await this.db.query<TransactionRow>(
      `INSERT INTO transactions (
        id, user_id, bank, amount, balance_after, description, category,
        transaction_type, timestamp_ms, raw_text, is_suspected_gap, created_at_ms, dedupe_key
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, $11, $12)
      ON CONFLICT (user_id, dedupe_key) DO NOTHING
      RETURNING *`,
      [
        id,
        userId,
        dto.bank,
        dto.amount,
        dto.balanceAfter ?? null,
        dto.description ?? null,
        dto.category ?? null,
        dto.transactionType,
        dto.timestamp,
        dto.rawText,
        createdAt,
        dedupeKey,
      ],
    );

    return result.rows[0] ? mapTransaction(result.rows[0]) : null;
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto): Promise<Transaction> {
    const existing = await this.find(userId, id);
    const next = {
      amount: dto.amount ?? existing.amount,
      transactionType: dto.transactionType ?? existing.transactionType,
      description: dto.description === undefined ? existing.description : dto.description,
      category: dto.category === undefined ? existing.category : dto.category,
      timestamp: dto.timestamp ?? existing.timestamp,
      isSuspectedGap: dto.isSuspectedGap ?? existing.isSuspectedGap,
    };

    const result = await this.db.query<TransactionRow>(
      `UPDATE transactions
       SET amount = $3,
           transaction_type = $4,
           description = $5,
           category = $6,
           timestamp_ms = $7,
           is_suspected_gap = $8
       WHERE user_id = $1 AND id = $2
       RETURNING *`,
      [
        userId,
        id,
        next.amount,
        next.transactionType,
        next.description,
        next.category,
        next.timestamp,
        next.isSuspectedGap,
      ],
    );
    return mapTransaction(result.rows[0]);
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.db.query(
      'DELETE FROM transactions WHERE user_id = $1 AND id = $2',
      [userId, id],
    );
    if (result.rowCount === 0) {
      throw new NotFoundException('Transaction not found');
    }
  }

  async monthlyStats(userId: string, year: number, month: number): Promise<MonthlyStats> {
    const startDate = new Date(year, month - 1, 1).getTime();
    const endDate = new Date(year, month, 0, 23, 59, 59, 999).getTime();
    const result = await this.db.query<{transaction_type: string; total: string | number}>(
      `SELECT transaction_type, COALESCE(SUM(amount), 0) AS total
       FROM transactions
       WHERE user_id = $1 AND timestamp_ms >= $2 AND timestamp_ms <= $3
       GROUP BY transaction_type`,
      [userId, startDate, endDate],
    );

    return result.rows.reduce<MonthlyStats>(
      (stats, row) => {
        if (row.transaction_type === 'income') {
          stats.totalIncome = Number(row.total);
        }
        if (row.transaction_type === 'expense') {
          stats.totalExpense = Number(row.total);
        }
        return stats;
      },
      {totalIncome: 0, totalExpense: 0},
    );
  }

  async categoryStats(userId: string, startDate: number, endDate: number): Promise<CategoryStatsItem[]> {
    const result = await this.db.query<{category: string; total: string | number; count: string | number}>(
      `SELECT COALESCE(category, 'other') AS category, SUM(amount) AS total, COUNT(*) AS count
       FROM transactions
       WHERE user_id = $1
         AND transaction_type = 'expense'
         AND timestamp_ms >= $2
         AND timestamp_ms <= $3
       GROUP BY category
       ORDER BY total DESC`,
      [userId, startDate, endDate],
    );

    return result.rows.map(row => ({
      category: row.category,
      total: Number(row.total),
      count: Number(row.count),
    }));
  }

  private async find(userId: string, id: string): Promise<Transaction> {
    const result = await this.db.query<TransactionRow>(
      'SELECT * FROM transactions WHERE user_id = $1 AND id = $2 LIMIT 1',
      [userId, id],
    );
    if (!result.rows[0]) {
      throw new NotFoundException('Transaction not found');
    }
    return mapTransaction(result.rows[0]);
  }
}
