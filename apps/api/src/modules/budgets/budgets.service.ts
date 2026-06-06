import {Injectable} from '@nestjs/common';
import type {CategoryBudget} from '@paynote/shared';
import {DatabaseService} from '../database/database.service';

@Injectable()
export class BudgetsService {
  constructor(private readonly db: DatabaseService) {}

  async list(userId: string, monthKey?: string): Promise<CategoryBudget[]> {
    const params: unknown[] = [userId];
    const where = ['user_id = $1'];
    if (monthKey) {
      params.push(monthKey);
      where.push(`month_key = $${params.length}`);
    }
    const result = await this.db.query<{category_id: string; month_key: string; budget_limit: string | number; spent: string | number | null; updated_at_ms: string | number}>(
      `SELECT category_id, month_key, budget_limit, spent, updated_at_ms
       FROM category_budgets
       WHERE ${where.join(' AND ')}
       ORDER BY month_key DESC, category_id ASC`,
      params,
    );
    return result.rows.map(row => ({
      categoryId: row.category_id,
      monthKey: row.month_key,
      limit: Number(row.budget_limit),
      spent: row.spent === null ? undefined : Number(row.spent),
      updatedAt: Number(row.updated_at_ms),
    }));
  }

  async upsert(userId: string, budget: CategoryBudget): Promise<CategoryBudget> {
    const updatedAt = Date.now();
    await this.db.query(
      `INSERT INTO category_budgets (user_id, category_id, month_key, budget_limit, spent, updated_at_ms)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, category_id, month_key)
       DO UPDATE SET budget_limit = EXCLUDED.budget_limit, spent = EXCLUDED.spent, updated_at_ms = EXCLUDED.updated_at_ms`,
      [userId, budget.categoryId, budget.monthKey, budget.limit, budget.spent ?? null, updatedAt],
    );
    return {...budget, updatedAt};
  }

  async remove(userId: string, categoryId: string, monthKey: string): Promise<void> {
    await this.db.query(
      'DELETE FROM category_budgets WHERE user_id = $1 AND category_id = $2 AND month_key = $3',
      [userId, categoryId, monthKey],
    );
  }

  async monthlyNotes(userId: string): Promise<Record<string, string>> {
    const result = await this.db.query<{month_key: string; note: string}>(
      'SELECT month_key, note FROM monthly_notes WHERE user_id = $1 ORDER BY month_key DESC',
      [userId],
    );
    return Object.fromEntries(result.rows.map(row => [row.month_key, row.note]));
  }

  async setMonthlyNote(userId: string, monthKey: string, note: string): Promise<Record<string, string>> {
    await this.db.query(
      `INSERT INTO monthly_notes (user_id, month_key, note, updated_at_ms)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, month_key)
       DO UPDATE SET note = EXCLUDED.note, updated_at_ms = EXCLUDED.updated_at_ms`,
      [userId, monthKey, note, Date.now()],
    );
    return this.monthlyNotes(userId);
  }
}
