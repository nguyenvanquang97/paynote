import type {BudgetAlertThreshold} from '../app/store';

export const BUDGET_ALERT_THRESHOLDS: BudgetAlertThreshold[] = [80, 100, 120];

export const pickBudgetAlertThreshold = (
  percent: number,
  hasTriggered: (threshold: BudgetAlertThreshold) => boolean,
): BudgetAlertThreshold | null => {
  const threshold = [...BUDGET_ALERT_THRESHOLDS]
    .reverse()
    .find(t => percent >= t && !hasTriggered(t));
  return threshold || null;
};

