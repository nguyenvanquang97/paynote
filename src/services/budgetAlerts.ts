import dayjs from 'dayjs';
import {getCategoryLabel} from '../shared/constants';
import {toast} from '../shared/components/Toast';
import {useAppStore, toMonthKey} from '../app/store';
import {showBudgetAlertNotification} from '../native';
import type {Transaction} from '../shared/types';
import {pickBudgetAlertThreshold} from './budgetAlertUtils';

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('vi-VN').format(Math.max(0, amount)) + ' ₫';

const toPercent = (spent: number, limit: number): number => {
  if (limit <= 0) {return 0;}
  return (spent / limit) * 100;
};

export const triggerBudgetAlertsForTransaction = async (transaction: Transaction): Promise<void> => {
  if (transaction.transactionType !== 'expense') {return;}
  const categoryId = transaction.category || 'other';
  const year = dayjs(transaction.timestamp).year();
  const month = dayjs(transaction.timestamp).month() + 1;
  const monthKey = toMonthKey(year, month);

  const state = useAppStore.getState();
  if (!state.budgetAlertsEnabled) {return;}

  await state.loadStats();
  const refreshedState = useAppStore.getState();
  const status = refreshedState.getBudgetStatus(categoryId, year, month);
  if (!status.exists || status.limit <= 0) {return;}

  const percent = toPercent(status.spent, status.limit);
  const threshold = pickBudgetAlertThreshold(
    percent,
    (t) => refreshedState.hasBudgetAlertTriggered(monthKey, categoryId, t),
  );
  if (!threshold) {return;}

  refreshedState.markBudgetAlertTriggered(monthKey, categoryId, threshold, {
    spent: status.spent,
    limit: status.limit,
  });

  const label = getCategoryLabel(categoryId);
  const percentText = `${percent.toFixed(0)}%`;
  const message = `Danh mục ${label} đã dùng ${percentText} ngân sách tháng (${formatCurrency(status.spent)} / ${formatCurrency(status.limit)}).`;
  refreshedState.pushInAppNotification({
    type: 'budget_alert',
    title: 'Cảnh báo chi tiêu',
    message,
    categoryId,
    monthKey,
    threshold,
  });
  toast.warning(message, 4500);
  showBudgetAlertNotification('Cảnh báo chi tiêu', message);
};
