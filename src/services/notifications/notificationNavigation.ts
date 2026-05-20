import dayjs from 'dayjs';
import type {NotificationAction} from './notificationAction';

const toYearMonth = (monthKey?: string): {year: number; month: number} => {
  if (!monthKey) {
    return {
      year: dayjs().year(),
      month: dayjs().month() + 1,
    };
  }
  const parsed = dayjs(`${monthKey}-01`);
  if (!parsed.isValid()) {
    return {
      year: dayjs().year(),
      month: dayjs().month() + 1,
    };
  }
  return {
    year: parsed.year(),
    month: parsed.month() + 1,
  };
};

export const resolveNotificationAction = (
  navigation: any,
  action?: NotificationAction | null,
): boolean => {
  if (!navigation || !action?.target) {
    return false;
  }

  const {year, month} = toYearMonth(action.monthKey);

  if (action.target === 'transactions') {
    navigation.navigate('MainTabs', {
      screen: 'Transactions',
      params: {
        fromDashboard: {
          filter: action.filter || 'all',
          year,
          month,
          categoryId: action.categoryId,
          transactionId: action.transactionId,
          ts: action.ts || Date.now(),
        },
      },
    });
    return true;
  }

  if (action.target === 'dashboard') {
    navigation.navigate('MainTabs', {
      screen: 'Dashboard',
      params: {
        fromNotification: {
          year,
          month,
          ts: action.ts || Date.now(),
        },
      },
    });
    return true;
  }

  if (action.target === 'budget_settings') {
    navigation.navigate('BudgetSettings');
    return true;
  }

  if (action.target === 'notifications') {
    navigation.navigate('Notifications');
    return true;
  }

  return false;
};
