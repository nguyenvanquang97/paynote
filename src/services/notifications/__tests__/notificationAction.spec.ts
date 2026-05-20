import {createNotificationActionFromTrigger} from '../notificationAction';

describe('notification action mapping', () => {
  it('maps budget trigger to expense transactions with category and month', () => {
    const action = createNotificationActionFromTrigger({
      trigger: 'budget_80',
      categoryId: 'food',
      monthKey: '2026-05',
    });

    expect(action.target).toBe('transactions');
    expect(action.filter).toBe('expense');
    expect(action.categoryId).toBe('food');
    expect(action.monthKey).toBe('2026-05');
  });

  it('maps income triggers to income filter', () => {
    const action = createNotificationActionFromTrigger({
      trigger: 'salary_received',
      monthKey: '2026-05',
      transactionId: 'tx_1',
    });

    expect(action.target).toBe('transactions');
    expect(action.filter).toBe('income');
    expect(action.transactionId).toBe('tx_1');
  });

  it('maps month-end warning to budget settings', () => {
    const action = createNotificationActionFromTrigger({
      trigger: 'end_of_month_warning',
      monthKey: '2026-05',
    });

    expect(action.target).toBe('budget_settings');
  });

  it('maps no-spend day to dashboard', () => {
    const action = createNotificationActionFromTrigger({
      trigger: 'no_spend_day',
      monthKey: '2026-05',
    });

    expect(action.target).toBe('dashboard');
  });
});
