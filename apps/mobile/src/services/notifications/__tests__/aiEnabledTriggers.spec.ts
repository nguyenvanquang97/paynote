import {isAiEnabledTrigger} from '../aiEnabledTriggers';
import type {NotificationTrigger} from '../notificationTypes';

describe('AI enabled triggers', () => {
  it('enables AI for configured spending triggers only', () => {
    const enabled: NotificationTrigger[] = [
      'budget_50',
      'budget_80',
      'budget_100',
      'budget_120',
      'large_transaction',
      'repeat_category_today',
      'repeat_category_week',
      'late_night_spending',
    ];

    for (const trigger of enabled) {
      expect(isAiEnabledTrigger(trigger)).toBe(true);
    }
  });

  it('keeps AI disabled for all other triggers', () => {
    const disabled: NotificationTrigger[] = [
      'bank_transaction_detected',
      'salary_received',
      'income_received',
      'no_spend_day',
      'saving_streak',
      'duplicate_transaction',
      'missed_transaction',
      'end_of_day_summary',
      'end_of_month_warning',
    ];

    for (const trigger of disabled) {
      expect(isAiEnabledTrigger(trigger)).toBe(false);
    }
  });
});
