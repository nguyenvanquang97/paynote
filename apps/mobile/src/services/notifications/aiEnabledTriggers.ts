import type {NotificationTrigger} from './notificationTypes';

export const AI_ENABLED_TRIGGERS = new Set<NotificationTrigger>([
  'budget_50',
  'budget_80',
  'budget_100',
  'budget_120',
  'large_transaction',
  'repeat_category_today',
  'repeat_category_week',
  'late_night_spending',
]);

export const isAiEnabledTrigger = (trigger: NotificationTrigger): boolean =>
  AI_ENABLED_TRIGGERS.has(trigger);
