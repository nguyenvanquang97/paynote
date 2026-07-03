import {detectCategoryContext} from './notificationCategory';
import {formatNotificationTemplate} from './formatNotificationTemplate';
import {
  commitShownTemplate,
  ensureNotificationMemoryToday,
  loadNotificationMemory,
  saveNotificationMemory,
} from './notificationMemory';
import {pickNotificationTemplate} from './pickNotificationTemplate';
import {severityFromBudgetThreshold, triggerFromBudgetThreshold} from './notificationRules';
import {TRIGGER_DEFINITIONS} from './notificationTriggers';
import type {
  NotificationCategoryContext,
  NotificationEscalationTier,
  NotificationIntensity,
  NotificationPersona,
  NotificationSeverity,
  NotificationTemplateContext,
  NotificationTrigger,
} from './notificationTypes';

interface GenerateInput {
  trigger: NotificationTrigger;
  persona: NotificationPersona;
  categoryLabel?: string;
  categoryContext?: NotificationCategoryContext;
  context: NotificationTemplateContext;
  severity?: NotificationSeverity;
  intensity?: NotificationIntensity;
  allowStrongLanguage?: boolean;
  markShown?: boolean;
}

export interface GeneratedNotification {
  title: string;
  message: string;
  trigger: NotificationTrigger;
  severity: NotificationSeverity;
  persona: NotificationPersona;
  categoryContext: NotificationCategoryContext;
  escalationTier: NotificationEscalationTier;
  templateId?: string;
  templateOrigin?: 'plan' | 'generated' | 'native';
  scoreMeta?: string;
}

const DEFAULT_TITLE: Record<NotificationTrigger, string> = Object.fromEntries(
  Object.entries(TRIGGER_DEFINITIONS).map(([k, v]) => [k, v.title]),
) as Record<NotificationTrigger, string>;

const defaultSeverityForTrigger = (trigger: NotificationTrigger): NotificationSeverity => {
  switch (trigger) {
    case 'budget_50': return 'low';
    case 'budget_80': return 'medium';
    case 'budget_100': return 'high';
    case 'budget_120': return 'critical';
    case 'large_transaction': return 'high';
    case 'late_night_spending': return 'high';
    case 'repeat_category_today': return 'medium';
    case 'repeat_category_week': return 'medium';
    case 'salary_received': return 'low';
    case 'income_received': return 'low';
    case 'no_spend_day': return 'low';
    case 'saving_streak': return 'medium';
    case 'duplicate_transaction': return 'low';
    case 'missed_transaction': return 'high';
    case 'end_of_day_summary': return 'medium';
    case 'end_of_month_warning': return 'high';
    default: return 'low';
  }
};

const getOpeningPhrase = (message: string): string => message
  .trim()
  .toLowerCase()
  .replace(/[^\p{L}\p{N}\s]/gu, '')
  .split(/\s+/)
  .slice(0, 3)
  .join(' ');

const deriveEscalationTier = (
  trigger: NotificationTrigger,
  severity: NotificationSeverity,
  memoryCount: number,
  velocity: number,
  recoveryStreak: number,
  intensity: NotificationIntensity,
): NotificationEscalationTier => {
  const intensityBoost = intensity === 'sharp' ? 1 : intensity === 'soft' ? -1 : 0;
  const velocityBoost = velocity >= 6 ? 2 : velocity >= 3 ? 1 : 0;
  const recoveryReduce = recoveryStreak >= 3 ? 1 : 0;
  if (trigger === 'budget_120' || severity === 'critical') {return 4;}
  if (trigger === 'budget_100' || severity === 'high') {
    const raw = 2 + intensityBoost + velocityBoost - recoveryReduce + (memoryCount >= 6 ? 2 : memoryCount >= 3 ? 1 : 0);
    return Math.max(1, Math.min(4, raw)) as NotificationEscalationTier;
  }
  if (trigger === 'late_night_spending' || trigger === 'repeat_category_today' || trigger === 'repeat_category_week') {
    const raw = 1 + intensityBoost + velocityBoost - recoveryReduce + (memoryCount >= 6 ? 3 : memoryCount >= 4 ? 2 : memoryCount >= 2 ? 1 : 0);
    return Math.max(1, Math.min(4, raw)) as NotificationEscalationTier;
  }
  if (severity === 'medium') {
    const raw = 1 + intensityBoost + velocityBoost - recoveryReduce + (memoryCount >= 5 ? 2 : memoryCount >= 3 ? 1 : 0);
    return Math.max(1, Math.min(4, raw)) as NotificationEscalationTier;
  }
  const raw = 1 + intensityBoost + velocityBoost - recoveryReduce + (memoryCount >= 8 ? 3 : memoryCount >= 6 ? 2 : memoryCount >= 3 ? 1 : 0);
  return Math.max(1, Math.min(4, raw)) as NotificationEscalationTier;
};

export const generateNotificationMessage = (input: GenerateInput): GeneratedNotification | null => {
  const now = Date.now();
  const categoryContext = input.categoryContext || detectCategoryContext(input.categoryLabel);
  const severity = input.severity || defaultSeverityForTrigger(input.trigger);

  const memory = ensureNotificationMemoryToday(loadNotificationMemory());
  const memoryCount = memory.warningCountByCategory[categoryContext] || 0;
  const velocity = memory.violationVelocityByCategory[categoryContext] || 0;
  const recoveryStreak = memory.recoveryStreakByCategory[categoryContext] || 0;
  const intensity = input.intensity || 'normal';
  const escalationTier = deriveEscalationTier(input.trigger, severity, memoryCount, velocity, recoveryStreak, intensity);
  const picked = pickNotificationTemplate({
    trigger: input.trigger,
    persona: input.persona,
    severity,
    escalationTier,
    intensity,
    categoryContext,
    context: input.context,
    memory,
    now,
    allowStrongLanguage: input.allowStrongLanguage,
  });

  if (!picked) {
    return null;
  }

  const message = formatNotificationTemplate(picked.body, input.context);

  if (input.markShown !== false) {
    const openingPhrase = getOpeningPhrase(message);
    const next = commitShownTemplate(memory, {
      templateId: picked.id,
      text: message,
      openingPhrase,
      trigger: input.trigger,
      categoryContext,
      now,
    });
    saveNotificationMemory(next);
  }

  return {
    title: picked.title || DEFAULT_TITLE[input.trigger],
    message,
    trigger: input.trigger,
    severity,
    persona: input.persona,
    categoryContext,
    escalationTier,
    templateId: picked.id,
    templateOrigin: picked.origin,
    scoreMeta: `ctx=${categoryContext};tier=${escalationTier};sev=${severity};vel=${velocity};rec=${recoveryStreak};int=${intensity};origin=${picked.origin || 'unknown'}`,
  };
};

export const budgetTriggerFromThreshold = (threshold: 50 | 80 | 100 | 120): NotificationTrigger =>
  triggerFromBudgetThreshold(threshold);

export const budgetSeverityFromThreshold = (threshold: 50 | 80 | 100 | 120): NotificationSeverity =>
  severityFromBudgetThreshold(threshold);
