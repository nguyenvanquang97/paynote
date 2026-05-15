import dayjs from 'dayjs';
import {CATEGORY_ICONS, getCategoryLabel} from '../shared/constants';
import {toMonthKey, useAppStore, type BudgetAlertThreshold} from '../app/store';
import {showBudgetAlertNotification} from '../native';
import {generateBudgetRoast} from './geminiRoastService';
import {getGeminiApiKeyFromEnv} from '../config/env';

const PERIOD_MS = 60 * 60 * 1000;
let lastReminderAt = 0;

type LimitWindow = 'day' | 'month';
interface SystemLimitRule {
  limit: number;
  window: LimitWindow;
}

const SYSTEM_REMINDER_LIMITS: Record<string, SystemLimitRule> = {
  food: {limit: 200_000, window: 'day'},
  cafe: {limit: 50_000, window: 'day'},
  rent: {limit: 4_000_000, window: 'month'},
};

const toPercent = (spent: number, limit: number): number => (limit <= 0 ? 0 : (spent / limit) * 100);

const pickThreshold = (percent: number): BudgetAlertThreshold => {
  if (percent >= 120) {return 120;}
  if (percent >= 100) {return 100;}
  return 80;
};

const getResolvedGeminiKey = (): string => {
  const state = useAppStore.getState();
  const userKey = state.geminiApiKey.trim();
  if (userKey.length > 0) {return userKey;}
  return getGeminiApiKeyFromEnv();
};

const getSystemCandidate = (
  categoryId: string,
  year: number,
  month: number,
  dayKey: string,
): {spent: number; limit: number; progress: number} | null => {
  const rule = SYSTEM_REMINDER_LIMITS[categoryId];
  if (!rule) {return null;}
  const state = useAppStore.getState();
  let spent = 0;
  if (rule.window === 'day') {
    spent = state.transactions
      .filter(tx =>
        tx.transactionType === 'expense' &&
        (tx.category || 'other') === categoryId &&
        dayjs(tx.timestamp).format('YYYY-MM-DD') === dayKey,
      )
      .reduce((sum, tx) => sum + tx.amount, 0);
  } else {
    spent = state.getBudgetStatus(categoryId, year, month).spent;
  }
  return {
    spent,
    limit: rule.limit,
    progress: rule.limit > 0 ? spent / rule.limit : 0,
  };
};

export const triggerPeriodicRoastReminder = async (force = false): Promise<void> => {
  const now = Date.now();
  if (!force && now - lastReminderAt < PERIOD_MS) {return;}
  lastReminderAt = now;

  const state = useAppStore.getState();
  if (!state.budgetAlertsEnabled) {return;}
  await state.loadTransactions();
  await state.loadStats();

  const refreshed = useAppStore.getState();
  const year = dayjs().year();
  const month = dayjs().month() + 1;
  const monthKey = toMonthKey(year, month);
  const dayKey = dayjs().format('YYYY-MM-DD');

  const systemIds = Object.keys(CATEGORY_ICONS);
  const budgetIds = Object.values(refreshed.categoryBudgets)
    .filter(item => item.monthKey === monthKey && item.limit > 0)
    .map(item => item.categoryId);
  const candidateIds = Array.from(new Set([...systemIds, ...budgetIds]));

  let winner: {
    categoryId: string;
    label: string;
    spent: number;
    limit: number;
    progress: number;
  } | null = null;

  for (const categoryId of candidateIds) {
    const status = refreshed.getBudgetStatus(categoryId, year, month);
    let spent = status.spent;
    let limit = status.limit;
    let progress = status.progress;

    if (!(status.exists && status.limit > 0)) {
      const system = getSystemCandidate(categoryId, year, month, dayKey);
      if (!system) {continue;}
      spent = system.spent;
      limit = system.limit;
      progress = system.progress;
    }

    if (limit <= 0 || spent <= 0) {continue;}
    if (!winner || progress > winner.progress) {
      winner = {
        categoryId,
        label: getCategoryLabel(categoryId),
        spent,
        limit,
        progress,
      };
    }
  }

  if (!winner) {return;}
  const winnerData = winner;

  const threshold = pickThreshold(toPercent(winnerData.spent, winnerData.limit));
  const aiEnabled = refreshed.aiBudgetAlertsEnabled;
  const defaultTitle = 'Nhắc nhở chi tiêu định kỳ';
  const defaultMessage = `Danh mục ${winnerData.label} đang ở ${Math.round(winnerData.progress * 100)}% ngân sách (${new Intl.NumberFormat('vi-VN').format(winnerData.spent)} ₫ / ${new Intl.NumberFormat('vi-VN').format(winnerData.limit)} ₫). Chi vừa thôi, đừng để ví phản chủ.`;

  let title = defaultTitle;
  let message = defaultMessage;
  let source: 'periodic_reminder_ai' | 'periodic_reminder_template' = 'periodic_reminder_template';
  let toneTag: 'gentle' | 'cute' | 'sarcastic_strong' | 'angry' | undefined;

  if (aiEnabled) {
      const roast = await generateBudgetRoast({
      apiKey: getResolvedGeminiKey(),
      categoryId: winnerData.categoryId,
      categoryLabel: winnerData.label,
      spent: winnerData.spent,
      limit: winnerData.limit,
      progress: winnerData.progress,
      threshold,
      monthKey,
      toneMode: refreshed.aiToneMode,
    });
    title = roast.title || defaultTitle;
    message = roast.message || defaultMessage;
    source = roast.fallbackUsed ? 'periodic_reminder_template' : 'periodic_reminder_ai';
    toneTag = roast.toneTag;
  }

  refreshed.pushInAppNotification({
    type: 'periodic_reminder',
    title,
    message,
    source,
    toneTag,
    categoryId: winnerData.categoryId,
    monthKey,
    threshold,
  });
  showBudgetAlertNotification(title, message);
};
