import dayjs from 'dayjs';
import {CATEGORY_ICONS, getCategoryLabel} from '../shared/constants';
import {toast} from '../shared/components/Toast';
import {useAppStore, toMonthKey} from '../app/store';
import {showBudgetAlertNotification} from '../native';
import type {Transaction} from '../shared/types';
import {pickBudgetAlertThreshold} from './budgetAlertUtils';
import {generateBudgetRoast} from './geminiRoastService';
import {getGeminiApiKeyFromEnv} from '../config/env';

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('vi-VN').format(Math.max(0, amount)) + ' ₫';

const toPercent = (spent: number, limit: number): number => {
  if (limit <= 0) {return 0;}
  return (spent / limit) * 100;
};

type LimitWindow = 'day' | 'month';
interface SystemLimitRule {
  limit: number;
  window: LimitWindow;
}

const SYSTEM_CATEGORY_DEFAULT_LIMIT: Record<string, SystemLimitRule> = {
  food: {limit: 150_000, window: 'day'},
  cafe: {limit: 50_000, window: 'day'},
  rent: {limit: 4_000_000, window: 'month'},
  transport: {limit: 1_200_000, window: 'month'},
  shopping: {limit: 1_500_000, window: 'month'},
  bills: {limit: 1_200_000, window: 'month'},
  other: {limit: 800_000, window: 'month'},
};

const alertCooldownMap = new Map<string, number>();
const ALERT_COOLDOWN_MS = 45_000;

const trimForToast = (text: string): string =>
  text.length > 155 ? `${text.slice(0, 154).trim()}…` : text;

const getGeminiApiKey = (userApiKey: string): string => {
  const userKey = userApiKey.trim();
  if (userKey.length > 0) {return userKey;}
  return getGeminiApiKeyFromEnv();
};

export const triggerBudgetAlertsForTransaction = async (transaction: Transaction): Promise<void> => {
  if (transaction.transactionType !== 'expense') {return;}
  const categoryId = transaction.category || 'other';
  const year = dayjs(transaction.timestamp).year();
  const month = dayjs(transaction.timestamp).month() + 1;
  const monthKey = toMonthKey(year, month);
  const dayKey = dayjs(transaction.timestamp).format('YYYY-MM-DD');

  const state = useAppStore.getState();
  if (!state.budgetAlertsEnabled) {return;}

  await state.loadTransactions();
  await state.loadStats();
  const refreshedState = useAppStore.getState();
  const status = refreshedState.getBudgetStatus(categoryId, year, month);
  const isSystemCategory = Object.prototype.hasOwnProperty.call(CATEGORY_ICONS, categoryId);

  const systemRule = SYSTEM_CATEGORY_DEFAULT_LIMIT[categoryId] || SYSTEM_CATEGORY_DEFAULT_LIMIT.other;
  let limit = status.limit;
  let spent = status.spent;
  let window: LimitWindow = 'month';
  let alertPeriodKey = monthKey;
  let scopeLabel = 'tháng';
  const hasBudget = status.exists && status.limit > 0;
  if (!hasBudget && isSystemCategory) {
    limit = systemRule.limit;
    window = systemRule.window;
    if (window === 'day') {
      alertPeriodKey = dayKey;
      scopeLabel = 'hôm nay';
      spent = refreshedState.transactions
        .filter(tx =>
          tx.transactionType === 'expense' &&
          (tx.category || 'other') === categoryId &&
          dayjs(tx.timestamp).format('YYYY-MM-DD') === dayKey,
        )
        .reduce((sum, tx) => sum + tx.amount, 0);
    }
  }
  if (limit <= 0) {return;}

  const percent = toPercent(spent, limit);
  const threshold = pickBudgetAlertThreshold(
    percent,
    (t) => refreshedState.hasBudgetAlertTriggered(alertPeriodKey, categoryId, t),
  );
  if (!threshold) {return;}

  const cooldownKey = `${alertPeriodKey}:${categoryId}:${threshold}`;
  const lastAt = alertCooldownMap.get(cooldownKey) || 0;
  if (Date.now() - lastAt < ALERT_COOLDOWN_MS) {return;}
  alertCooldownMap.set(cooldownKey, Date.now());

  refreshedState.markBudgetAlertTriggered(alertPeriodKey, categoryId, threshold, {
    spent,
    limit,
  });

  const label = getCategoryLabel(categoryId);
  const aiEnabled = refreshedState.aiBudgetAlertsEnabled;

  let title = 'Cảnh báo chi tiêu';
  let message = `Danh mục ${label} đã dùng ${percent.toFixed(0)}% ngân sách ${scopeLabel} (${formatCurrency(spent)} / ${formatCurrency(limit)}).`;
  let source: 'budget_alert_ai' | 'budget_alert_template' = 'budget_alert_template';
  let toneTag: 'gentle' | 'cute' | 'sarcastic_strong' | 'angry' | undefined;

  if (aiEnabled) {
    const resolvedApiKey = getGeminiApiKey(refreshedState.geminiApiKey);
    const roast = await generateBudgetRoast({
      apiKey: resolvedApiKey,
      categoryId,
      categoryLabel: label,
      spent,
      limit,
      progress: percent / 100,
      threshold,
      monthKey: alertPeriodKey,
      toneMode: refreshedState.aiToneMode,
    });
    title = roast.title || title;
    message = roast.message || message;
    source = roast.fallbackUsed ? 'budget_alert_template' : 'budget_alert_ai';
    toneTag = roast.toneTag;
  }

  refreshedState.pushInAppNotification({
    type: 'budget_alert',
    title,
    message,
    source,
    toneTag,
    categoryId,
    monthKey,
    threshold,
  });
  toast.warning(trimForToast(message), 4500);
  showBudgetAlertNotification(title, message);
};
