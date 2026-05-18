import dayjs from 'dayjs';
import {CATEGORY_ICONS, getCategoryLabel} from '../shared/constants';
import {toast} from '../shared/components/Toast';
import {useAppStore, toMonthKey, type BudgetAlertThreshold} from '../app/store';
import {showBudgetAlertNotification} from '../native';
import type {Transaction} from '../shared/types';
import {pickBudgetAlertThreshold} from './budgetAlertUtils';
import {generateBudgetRoast} from './geminiRoastService';
import {getGeminiApiKeyFromEnv} from '../config/env';
import {
  budgetSeverityFromThreshold,
  budgetTriggerFromThreshold,
  detectCategoryContext,
  generateNotificationMessage,
  type NotificationTrigger,
} from './notifications';

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
const REPEAT_MILESTONES = [3, 5, 7, 10] as const;
const WEEK_REPEAT_MILESTONES = [8, 12, 16, 20] as const;

const trimForToast = (text: string): string =>
  text.length > 155 ? `${text.slice(0, 154).trim()}…` : text;

const pickReachedMilestone = (count: number, milestones: readonly number[]): number | null => {
  for (let i = milestones.length - 1; i >= 0; i -= 1) {
    if (count >= milestones[i]) {return milestones[i];}
  }
  return null;
};

const getGeminiApiKey = (userApiKey: string): string => {
  const userKey = userApiKey.trim();
  if (userKey.length > 0) {return userKey;}
  return getGeminiApiKeyFromEnv();
};

const shouldTriggerLateNight = (timestamp: number): boolean => {
  const hour = dayjs(timestamp).hour();
  return hour >= 22 || hour < 5;
};

const toLateNightSeverity = (timestamp: number): 'medium' | 'high' | 'critical' => {
  const hour = dayjs(timestamp).hour();
  if (hour >= 3 && hour < 5) {return 'critical';}
  if (hour >= 0 && hour < 3) {return 'high';}
  return 'medium';
};

const emitNotification = async (payload: {
  categoryId: string;
  monthKey: string;
  threshold?: BudgetAlertThreshold;
  spent?: number;
  limit?: number;
  progress?: number;
  trigger: NotificationTrigger;
  severity: 'low' | 'medium' | 'high' | 'critical';
  titleFallback: string;
  messageFallback: string;
  context: {
    categoryLabel: string;
    spentText?: string;
    limitText?: string;
    percent?: number;
    amountText?: string;
    count?: number;
  };
}) => {
  const state = useAppStore.getState();

  let title = payload.titleFallback;
  let message = payload.messageFallback;
  let source: 'template' | 'ai_fallback' | 'native_periodic' = 'template';
  let toneTag = state.notificationPersona;
  let templateId: string | undefined;

  const generated = generateNotificationMessage({
    trigger: payload.trigger,
    persona: state.notificationPersona,
    categoryLabel: payload.context.categoryLabel,
    context: payload.context,
    severity: payload.severity,
    intensity: state.notificationIntensity,
    allowStrongLanguage: state.allowStrongLanguage,
  });

  if (generated?.message) {
    title = generated.title;
    message = generated.message;
    toneTag = generated.persona;
    templateId = generated.templateId;
  } else if (
    state.aiBudgetAlertsEnabled &&
    typeof payload.threshold === 'number' &&
    typeof payload.spent === 'number' &&
    typeof payload.limit === 'number' &&
    typeof payload.progress === 'number' &&
    payload.limit > 0
  ) {
    const roast = await generateBudgetRoast({
      apiKey: getGeminiApiKey(state.geminiApiKey),
      categoryId: payload.categoryId,
      categoryLabel: payload.context.categoryLabel,
      spent: payload.spent,
      limit: payload.limit,
      progress: payload.progress,
      threshold: payload.threshold,
      monthKey: payload.monthKey,
      persona: state.notificationPersona,
      allowStrongLanguage: state.allowStrongLanguage,
    });
    title = roast.title || title;
    message = roast.message || message;
    source = 'ai_fallback';
    toneTag = roast.toneTag;
  }

  state.pushInAppNotification({
    type: 'budget_alert',
    title,
    message,
    source,
    toneTag,
    templateId,
    templateOrigin: generated?.templateOrigin,
    escalationTier: generated?.escalationTier,
    scoreMeta: generated?.scoreMeta,
    trigger: payload.trigger,
    severity: payload.severity,
    categoryContext: detectCategoryContext(payload.context.categoryLabel),
    categoryId: payload.categoryId,
    monthKey: payload.monthKey,
    threshold: payload.threshold,
  });
  toast.warning(trimForToast(message), 4500);
  showBudgetAlertNotification(title, message);
};

export const triggerBudgetAlertsForTransaction = async (transaction: Transaction): Promise<void> => {
  if (transaction.transactionType !== 'expense') {return;}
  const categoryId = transaction.category || 'other';
  const isOtherCategory = categoryId === 'other';
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
  let alertPeriodKey = monthKey;
  const hasBudget = status.exists && status.limit > 0;
  if (!hasBudget && isSystemCategory) {
    limit = systemRule.limit;
    if (systemRule.window === 'day') {
      alertPeriodKey = dayKey;
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
  const progress = limit > 0 ? spent / limit : 0;
  const threshold = pickBudgetAlertThreshold(
    percent,
    t => refreshedState.hasBudgetAlertTriggered(alertPeriodKey, categoryId, t),
  );

  if (threshold) {
    if (isOtherCategory && threshold < 100) {
      return;
    }
    const cooldownKey = `${alertPeriodKey}:${categoryId}:${threshold}`;
    const lastAt = alertCooldownMap.get(cooldownKey) || 0;
    if (Date.now() - lastAt >= ALERT_COOLDOWN_MS) {
      alertCooldownMap.set(cooldownKey, Date.now());
      refreshedState.markBudgetAlertTriggered(alertPeriodKey, categoryId, threshold, {
        spent,
        limit,
      });

      const label = getCategoryLabel(categoryId);
      await emitNotification({
        categoryId,
        monthKey,
        threshold,
        spent,
        limit,
        progress,
        trigger: budgetTriggerFromThreshold(threshold),
        severity: budgetSeverityFromThreshold(threshold),
        titleFallback: 'Cảnh báo chi tiêu',
        messageFallback: `Danh mục ${label} đã dùng ${percent.toFixed(0)}% ngân sách (${formatCurrency(spent)} / ${formatCurrency(limit)}).`,
        context: {
          categoryLabel: label,
          percent: Math.round(percent),
          spentText: formatCurrency(spent),
          limitText: formatCurrency(limit),
        },
      });
    }
  }

  const label = getCategoryLabel(categoryId);
  const dayExpensesSameCategory = refreshedState.transactions.filter(tx =>
    tx.transactionType === 'expense' &&
    (tx.category || 'other') === categoryId &&
    dayjs(tx.timestamp).format('YYYY-MM-DD') === dayKey,
  );

  if (!isOtherCategory && dayExpensesSameCategory.length >= 3) {
    const reached = pickReachedMilestone(dayExpensesSameCategory.length, REPEAT_MILESTONES);
    if (!reached) {return;}
    const cooldownKey = `repeat:${dayKey}:${categoryId}:m${reached}`;
    const lastAt = alertCooldownMap.get(cooldownKey) || 0;
    if (Date.now() - lastAt >= 2 * 60 * 1000) {
      alertCooldownMap.set(cooldownKey, Date.now());
      await emitNotification({
        categoryId,
        monthKey,
        trigger: 'repeat_category_today',
        severity: dayExpensesSameCategory.length >= 5 ? 'high' : 'medium',
        titleFallback: 'Chi tiêu lặp lại',
        messageFallback: `Hôm nay bạn đã chi ${label} ${dayExpensesSameCategory.length} lần (mốc ${reached}).`,
        context: {
          categoryLabel: label,
          count: dayExpensesSameCategory.length,
        },
      });
    }
  }

  const weekStart = dayjs(transaction.timestamp).startOf('week').valueOf();
  const weekExpensesSameCategory = refreshedState.transactions.filter(tx =>
    tx.transactionType === 'expense' &&
    (tx.category || 'other') === categoryId &&
    tx.timestamp >= weekStart &&
    tx.timestamp <= transaction.timestamp,
  );
  if (!isOtherCategory && weekExpensesSameCategory.length >= 8) {
    const reachedWeekly = pickReachedMilestone(weekExpensesSameCategory.length, WEEK_REPEAT_MILESTONES);
    if (!reachedWeekly) {return;}
    const weekKey = dayjs(transaction.timestamp).format('YYYY-[W]WW');
    const cooldownKey = `repeat_week:${weekKey}:${categoryId}:m${reachedWeekly}`;
    const lastAt = alertCooldownMap.get(cooldownKey) || 0;
    if (Date.now() - lastAt >= 10 * 60 * 1000) {
      alertCooldownMap.set(cooldownKey, Date.now());
      await emitNotification({
        categoryId,
        monthKey,
        trigger: 'repeat_category_week',
        severity: weekExpensesSameCategory.length >= 14 ? 'high' : 'medium',
        titleFallback: 'Chi tiêu lặp trong tuần',
        messageFallback: `Tuần này bạn đã chi ${label} ${weekExpensesSameCategory.length} lần (mốc ${reachedWeekly}).`,
        context: {
          categoryLabel: label,
          count: weekExpensesSameCategory.length,
        },
      });
    }
  }

  const monthStart = dayjs(transaction.timestamp).startOf('month').valueOf();
  const monthExpenses = refreshedState.transactions.filter(tx =>
    tx.transactionType === 'expense' && tx.timestamp >= monthStart && tx.timestamp <= transaction.timestamp,
  );
  const totalMonthSpend = monthExpenses.reduce((sum, tx) => sum + tx.amount, 0);
  const dayCount = Math.max(dayjs(transaction.timestamp).date(), 1);
  const averageDailySpend = totalMonthSpend / dayCount;

  if (!isOtherCategory && averageDailySpend > 0 && transaction.amount >= averageDailySpend * 2) {
    const cooldownKey = `large:${dayKey}:${categoryId}`;
    const lastAt = alertCooldownMap.get(cooldownKey) || 0;
    if (Date.now() - lastAt >= 60 * 60 * 1000) {
      alertCooldownMap.set(cooldownKey, Date.now());
      const severity = transaction.amount > averageDailySpend * 8
        ? 'critical'
        : transaction.amount > averageDailySpend * 4
          ? 'high'
          : 'medium';
      await emitNotification({
        categoryId,
        monthKey,
        trigger: 'large_transaction',
        severity,
        titleFallback: 'Giao dịch lớn',
        messageFallback: `Bạn vừa chi ${formatCurrency(transaction.amount)} cho ${label}.`,
        context: {
          categoryLabel: label,
          amountText: formatCurrency(transaction.amount),
        },
      });
    }
  }

  if (!isOtherCategory && shouldTriggerLateNight(transaction.timestamp)) {
    const cooldownKey = `night:${dayKey}`;
    const lastAt = alertCooldownMap.get(cooldownKey) || 0;
    if (Date.now() - lastAt >= 2 * 60 * 60 * 1000) {
      alertCooldownMap.set(cooldownKey, Date.now());
      await emitNotification({
        categoryId,
        monthKey,
        trigger: 'late_night_spending',
        severity: toLateNightSeverity(transaction.timestamp),
        titleFallback: 'Chi tiêu khuya',
        messageFallback: 'Khuya rồi, cân nhắc kỹ trước khi chi thêm nhé.',
        context: {
          categoryLabel: label,
          amountText: formatCurrency(transaction.amount),
        },
      });
    }
  }
};
