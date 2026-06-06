import {Injectable} from '@nestjs/common';
import type {InAppNotificationItem} from '@paynote/shared';
import {randomUUID} from 'crypto';
import {DatabaseService} from '../database/database.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly db: DatabaseService) {}

  async list(userId: string): Promise<InAppNotificationItem[]> {
    const result = await this.db.query<{payload: InAppNotificationItem}>(
      'SELECT payload FROM in_app_notifications WHERE user_id = $1 ORDER BY created_at_ms DESC LIMIT 100',
      [userId],
    );
    return result.rows.map(row => row.payload);
  }

  async create(
    userId: string,
    input: Omit<InAppNotificationItem, 'id' | 'createdAt' | 'isRead'>,
  ): Promise<InAppNotificationItem> {
    const item: InAppNotificationItem = {
      ...input,
      id: randomUUID(),
      createdAt: Date.now(),
      isRead: false,
    };
    await this.db.query(
      `INSERT INTO in_app_notifications (id, user_id, payload, created_at_ms, is_read)
       VALUES ($1, $2, $3, $4, false)`,
      [item.id, userId, JSON.stringify(item), item.createdAt],
    );
    return item;
  }

  async markRead(userId: string, id: string, isRead: boolean): Promise<void> {
    const result = await this.db.query<{payload: InAppNotificationItem}>(
      'SELECT payload FROM in_app_notifications WHERE user_id = $1 AND id = $2',
      [userId, id],
    );
    const item = result.rows[0]?.payload;
    if (!item) {
      return;
    }
    const next = {...item, isRead};
    await this.db.query(
      'UPDATE in_app_notifications SET payload = $3, is_read = $4 WHERE user_id = $1 AND id = $2',
      [userId, id, JSON.stringify(next), isRead],
    );
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.db.query('DELETE FROM in_app_notifications WHERE user_id = $1 AND id = $2', [userId, id]);
  }

  async clear(userId: string): Promise<void> {
    await this.db.query('DELETE FROM in_app_notifications WHERE user_id = $1', [userId]);
  }
}
