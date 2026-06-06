import {Injectable} from '@nestjs/common';
import type {CustomCategory} from '@paynote/shared';
import {DatabaseService} from '../database/database.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly db: DatabaseService) {}

  async list(userId: string): Promise<CustomCategory[]> {
    const result = await this.db.query<{payload: CustomCategory}>(
      'SELECT payload FROM custom_categories WHERE user_id = $1 ORDER BY created_at_ms ASC',
      [userId],
    );
    return result.rows.map(row => row.payload);
  }

  async upsert(userId: string, category: CustomCategory): Promise<CustomCategory> {
    await this.db.query(
      `INSERT INTO custom_categories (id, user_id, payload, created_at_ms, updated_at_ms)
       VALUES ($1, $2, $3, $4, $4)
       ON CONFLICT (user_id, id)
       DO UPDATE SET payload = EXCLUDED.payload, updated_at_ms = EXCLUDED.updated_at_ms`,
      [category.id, userId, JSON.stringify(category), Date.now()],
    );
    return category;
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.db.query('DELETE FROM custom_categories WHERE user_id = $1 AND id = $2', [userId, id]);
  }

  async favoriteCategories(userId: string): Promise<string[]> {
    const result = await this.db.query<{category_id: string}>(
      'SELECT category_id FROM favorite_categories WHERE user_id = $1 ORDER BY created_at_ms ASC',
      [userId],
    );
    return result.rows.map(row => row.category_id);
  }

  async setFavoriteCategories(userId: string, categoryIds: string[]): Promise<string[]> {
    await this.db.query('DELETE FROM favorite_categories WHERE user_id = $1', [userId]);
    for (const categoryId of categoryIds) {
      await this.db.query(
        `INSERT INTO favorite_categories (user_id, category_id, created_at_ms)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, category_id) DO NOTHING`,
        [userId, categoryId, Date.now()],
      );
    }
    return categoryIds;
  }
}
