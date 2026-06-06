import dayjs from 'dayjs';
import type {NotificationTrigger} from './notificationTypes';

export type NotificationActionTarget =
  | 'transactions'
  | 'dashboard'
  | 'budget_settings'
  | 'notifications';

export type NotificationActionFilter = 'all' | 'income' | 'expense';

export type NotificationAction = {
  target: NotificationActionTarget;
  filter?: NotificationActionFilter;
  categoryId?: string;
  transactionId?: string;
  monthKey?: string;
  ts: number;
};

const toMonthKeyFromTimestamp = (timestamp?: number): string =>
  dayjs(typeof timestamp === 'number' ? timestamp : Date.now()).format('YYYY-MM');

type BuildActionInput = {
  trigger: NotificationTrigger;
  monthKey?: string;
  categoryId?: string;
  transactionId?: string;
  timestamp?: number;
};

export const createNotificationActionFromTrigger = (input: BuildActionInput): NotificationAction => {
  const ts = Date.now();
  const monthKey = input.monthKey || toMonthKeyFromTimestamp(input.timestamp);

  if (
    input.trigger === 'budget_50' ||
    input.trigger === 'budget_80' ||
    input.trigger === 'budget_100' ||
    input.trigger === 'budget_120' ||
    input.trigger === 'repeat_category_today' ||
    input.trigger === 'repeat_category_week' ||
    input.trigger === 'late_night_spending' ||
    input.trigger === 'large_transaction'
  ) {
    return {
      target: 'transactions',
      filter: 'expense',
      categoryId: input.categoryId,
      transactionId: input.transactionId,
      monthKey,
      ts,
    };
  }

  if (input.trigger === 'salary_received' || input.trigger === 'income_received') {
    return {
      target: 'transactions',
      filter: 'income',
      transactionId: input.transactionId,
      monthKey,
      ts,
    };
  }

  if (input.trigger === 'missed_transaction' || input.trigger === 'duplicate_transaction') {
    return {
      target: 'transactions',
      filter: 'all',
      transactionId: input.transactionId,
      monthKey,
      ts,
    };
  }

  if (input.trigger === 'bank_transaction_detected' || input.trigger === 'end_of_day_summary') {
    return {
      target: 'dashboard',
      monthKey,
      ts,
    };
  }

  if (input.trigger === 'end_of_month_warning') {
    return {
      target: 'budget_settings',
      monthKey,
      ts,
    };
  }

  if (input.trigger === 'no_spend_day' || input.trigger === 'saving_streak') {
    return {
      target: 'dashboard',
      monthKey,
      ts,
    };
  }

  return {
    target: 'notifications',
    ts,
  };
};

export const isNotificationAction = (value: unknown): value is NotificationAction => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const raw = value as Record<string, unknown>;
  const target = raw.target;
  if (
    target !== 'transactions' &&
    target !== 'dashboard' &&
    target !== 'budget_settings' &&
    target !== 'notifications'
  ) {
    return false;
  }

  const filter = raw.filter;
  if (typeof filter !== 'undefined' && filter !== 'all' && filter !== 'income' && filter !== 'expense') {
    return false;
  }

  if (typeof raw.ts !== 'number' || !Number.isFinite(raw.ts)) {
    return false;
  }

  if (typeof raw.categoryId !== 'undefined' && typeof raw.categoryId !== 'string') {
    return false;
  }
  if (typeof raw.transactionId !== 'undefined' && typeof raw.transactionId !== 'string') {
    return false;
  }
  if (typeof raw.monthKey !== 'undefined' && typeof raw.monthKey !== 'string') {
    return false;
  }

  return true;
};
