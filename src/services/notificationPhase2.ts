import dayjs from 'dayjs';
import {createMMKV} from 'react-native-mmkv';
import {showBudgetAlertNotificationWithAction} from '../native';
import {toast} from '../shared/components/Toast';
import {useAppStore} from '../app/store';
import type {Transaction} from '../shared/types';
import {COOLDOWN_BY_TRIGGER} from './notifications/notificationRules';
import {generateNotificationMessage, type NotificationTrigger, type NotificationSeverity} from './notifications';
import {createNotificationActionFromTrigger} from './notifications/notificationAction';

const phase2Storage = createMMKV();
const KEY_LAST_NO_SPEND = 'phase2_last_no_spend_day';
const KEY_STREAK_DAYS = 'phase2_saving_streak_days';
const KEY_LAST_SPEND_DATE = 'phase2_last_spend_date';
const KEY_LAST_EOD = 'phase2_last_eod_summary';
const KEY_LAST_EOM = 'phase2_last_eom_warning';
const KEY_LAST_TRIGGER_PREFIX = 'phase2_last_trigger_at_';

const formatCurrency = (amount: number): string =>
  `${new Intl.NumberFormat('vi-VN').format(Math.max(0, Math.round(amount)))} ₫`;

const pushGenerated = (params: {
  trigger: NotificationTrigger;
  severity: NotificationSeverity;
  categoryLabel?: string;
  context: Record<string, string | number | undefined>;
  titleFallback: string;
  messageFallback: string;
  categoryId?: string;
  monthKey?: string;
  transactionId?: string;
  timestamp?: number;
}): void => {
  const now = Date.now();
  const triggerCooldown = COOLDOWN_BY_TRIGGER[params.trigger] ?? 30 * 60 * 1000;
  const triggerKey = `${KEY_LAST_TRIGGER_PREFIX}${params.trigger}`;
  const lastTriggerAt = phase2Storage.getNumber(triggerKey) || 0;
  if (now - lastTriggerAt < triggerCooldown) {
    return;
  }

  const state = useAppStore.getState();
  const generated = generateNotificationMessage({
    trigger: params.trigger,
    persona: state.notificationPersona,
    categoryLabel: params.categoryLabel,
    context: params.context,
    severity: params.severity,
    intensity: state.notificationIntensity,
    allowStrongLanguage: state.allowStrongLanguage,
  });
  if (!generated) {
    return;
  }

  const title = generated.title || params.titleFallback;
  const message = generated.message || params.messageFallback;
  const action = createNotificationActionFromTrigger({
    trigger: params.trigger,
    categoryId: params.categoryId,
    monthKey: params.monthKey,
    transactionId: params.transactionId,
    timestamp: params.timestamp,
  });
  phase2Storage.set(triggerKey, now);

  state.pushInAppNotification({
    type: 'periodic_reminder',
    title,
    message,
    source: 'template',
    toneTag: state.notificationPersona,
    templateId: generated.templateId,
    templateOrigin: generated.templateOrigin,
    escalationTier: generated.escalationTier,
    scoreMeta: generated.scoreMeta,
    trigger: params.trigger,
    severity: params.severity,
    categoryContext: generated.categoryContext,
    monthKey: params.monthKey || dayjs().format('YYYY-MM'),
    categoryId: params.categoryId,
    action,
  });

  showBudgetAlertNotificationWithAction(title, message, action);
  if (params.trigger !== 'end_of_day_summary') {
    toast.info(message.length > 145 ? `${message.slice(0, 144).trim()}…` : message, 3500);
  }
};

const isSalaryDescription = (description?: string): boolean => {
  const text = (description || '').toLowerCase();
  return /lương|salary|payroll|thu\s*nhập|luong/.test(text);
};

export const handlePhase2TransactionSignals = (input: {
  transaction: Transaction | null;
  skippedReason?: string;
  isSuspectedGap?: boolean;
  missingAmount?: number;
}): void => {
  const {transaction, skippedReason, isSuspectedGap, missingAmount} = input;

  if (skippedReason === 'Duplicate transaction') {
    pushGenerated({
      trigger: 'duplicate_transaction',
      severity: 'low',
      titleFallback: 'Giao dịch trùng',
      messageFallback: 'App vừa chặn một giao dịch trùng.',
      context: {},
      timestamp: Date.now(),
    });
    return;
  }

  if (isSuspectedGap || skippedReason === 'Could not parse notification') {
    pushGenerated({
      trigger: 'missed_transaction',
      severity: 'high',
      titleFallback: 'Có thể bỏ lỡ giao dịch',
      messageFallback: missingAmount && missingAmount > 0
        ? `Có khả năng bỏ sót khoảng ${formatCurrency(missingAmount)}. Bạn kiểm tra lại giúp nhé.`
        : 'Có khả năng app bỏ sót giao dịch, bạn kiểm tra lại giúp nhé.',
      context: {
        amountText: missingAmount ? formatCurrency(missingAmount) : undefined,
      },
      timestamp: Date.now(),
    });
    return;
  }

  if (!transaction) {return;}

  if (transaction.transactionType === 'income') {
    if (isSalaryDescription(transaction.description)) {
      pushGenerated({
        trigger: 'salary_received',
        severity: 'low',
        titleFallback: 'Lương về',
        messageFallback: `Lương đã về: ${formatCurrency(transaction.amount)}.`,
        context: {
          amountText: formatCurrency(transaction.amount),
          transactionName: transaction.description,
        },
        transactionId: transaction.id,
        timestamp: transaction.timestamp,
        monthKey: dayjs(transaction.timestamp).format('YYYY-MM'),
      });
      return;
    }

    pushGenerated({
      trigger: 'income_received',
      severity: 'low',
      titleFallback: 'Thu nhập mới',
      messageFallback: `Có khoản thu mới: ${formatCurrency(transaction.amount)}.`,
      context: {
        amountText: formatCurrency(transaction.amount),
        transactionName: transaction.description,
      },
      transactionId: transaction.id,
      timestamp: transaction.timestamp,
      monthKey: dayjs(transaction.timestamp).format('YYYY-MM'),
    });
    return;
  }

  // update streak base on expense day
  const spendDate = dayjs(transaction.timestamp).format('YYYY-MM-DD');
  phase2Storage.set(KEY_LAST_SPEND_DATE, spendDate);
};

export const runPhase2PeriodicSweep = async (): Promise<void> => {
  const state = useAppStore.getState();
  await state.loadTransactions();
  const refreshed = useAppStore.getState();
  const today = dayjs().format('YYYY-MM-DD');
  const now = dayjs();

  const todayExpenses = refreshed.transactions.filter(tx =>
    tx.transactionType === 'expense' && dayjs(tx.timestamp).format('YYYY-MM-DD') === today,
  );

  if (now.hour() >= 20 && todayExpenses.length === 0) {
    const lastNoSpend = phase2Storage.getString(KEY_LAST_NO_SPEND);
    if (lastNoSpend !== today) {
      phase2Storage.set(KEY_LAST_NO_SPEND, today);
      const prevStreak = phase2Storage.getNumber(KEY_STREAK_DAYS) || 0;
      const nextStreak = prevStreak + 1;
      phase2Storage.set(KEY_STREAK_DAYS, nextStreak);

      pushGenerated({
        trigger: 'no_spend_day',
        severity: 'low',
        titleFallback: 'Ngày không tiêu',
        messageFallback: 'Hôm nay bạn không có khoản chi nào. Rất tốt.',
        context: {},
        monthKey: now.format('YYYY-MM'),
      });

      if (nextStreak >= 3) {
        pushGenerated({
          trigger: 'saving_streak',
          severity: nextStreak >= 7 ? 'high' : 'medium',
          titleFallback: 'Chuỗi tiết chế',
          messageFallback: `Bạn đang có chuỗi ${nextStreak} ngày kiểm soát tốt.`,
          context: {count: nextStreak},
          monthKey: now.format('YYYY-MM'),
        });
      }
    }
  } else if (todayExpenses.length > 0) {
    phase2Storage.set(KEY_STREAK_DAYS, 0);
  }

  if (now.hour() >= 21) {
    const eodKey = `${today}`;
    const lastEod = phase2Storage.getString(KEY_LAST_EOD);
    if (lastEod !== eodKey) {
      phase2Storage.set(KEY_LAST_EOD, eodKey);
      const total = todayExpenses.reduce((sum, tx) => sum + tx.amount, 0);
      pushGenerated({
        trigger: 'end_of_day_summary',
        severity: total > 800_000 ? 'high' : total > 300_000 ? 'medium' : 'low',
        titleFallback: 'Tổng kết cuối ngày',
        messageFallback: `Hôm nay bạn đã chi ${formatCurrency(total)}.`,
        context: {amountText: formatCurrency(total)},
        monthKey: now.format('YYYY-MM'),
      });
    }
  }

  if (now.date() >= 25) {
    const monthKey = now.format('YYYY-MM');
    const lastEom = phase2Storage.getString(KEY_LAST_EOM);
    if (lastEom !== monthKey) {
      phase2Storage.set(KEY_LAST_EOM, monthKey);
      pushGenerated({
        trigger: 'end_of_month_warning',
        severity: 'high',
        titleFallback: 'Nhắc cuối tháng',
        messageFallback: 'Cuối tháng rồi, giữ chặt các khoản linh tinh nhé.',
        context: {},
        monthKey,
      });
    }
  }
};
