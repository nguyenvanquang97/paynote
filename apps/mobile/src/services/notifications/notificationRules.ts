import type {NotificationSeverity, NotificationTrigger} from './notificationTypes';

export const COOLDOWN_BY_TRIGGER: Record<NotificationTrigger, number> = {
  budget_50: 6 * 60 * 60 * 1000,
  budget_80: 4 * 60 * 60 * 1000,
  budget_100: 6 * 60 * 60 * 1000,
  budget_120: 8 * 60 * 60 * 1000,
  large_transaction: 60 * 60 * 1000,
  repeat_category_today: 2 * 60 * 60 * 1000,
  repeat_category_week: 12 * 60 * 60 * 1000,
  late_night_spending: 2 * 60 * 60 * 1000,
  bank_transaction_detected: 10 * 60 * 1000,
  salary_received: 24 * 60 * 60 * 1000,
  income_received: 12 * 60 * 60 * 1000,
  no_spend_day: 24 * 60 * 60 * 1000,
  saving_streak: 24 * 60 * 60 * 1000,
  duplicate_transaction: 30 * 60 * 1000,
  missed_transaction: 2 * 60 * 60 * 1000,
  end_of_day_summary: 24 * 60 * 60 * 1000,
  end_of_month_warning: 24 * 60 * 60 * 1000,
};

export const severityFromBudgetThreshold = (threshold: 50 | 80 | 100 | 120): NotificationSeverity => {
  if (threshold === 120) {return 'critical';}
  if (threshold === 100) {return 'high';}
  if (threshold === 80) {return 'medium';}
  return 'low';
};

export const triggerFromBudgetThreshold = (threshold: 50 | 80 | 100 | 120): NotificationTrigger => {
  if (threshold === 120) {return 'budget_120';}
  if (threshold === 100) {return 'budget_100';}
  if (threshold === 80) {return 'budget_80';}
  return 'budget_50';
};

export const severityFromLateNightHour = (hour: number): NotificationSeverity => {
  if (hour >= 3 && hour < 5) {return 'critical';}
  if (hour >= 0 && hour < 3) {return 'high';}
  return 'medium';
};
