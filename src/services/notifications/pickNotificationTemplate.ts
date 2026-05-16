import {NOTIFICATION_TEMPLATES} from './notificationTemplates';
import {COOLDOWN_BY_TRIGGER} from './notificationRules';
import {triggerCategoryKey} from './notificationMemory';
import type {
  NotificationCategoryContext,
  NotificationEscalationTier,
  NotificationIntensity,
  NotificationMemory,
  NotificationSeverity,
  NotificationTemplate,
  NotificationTemplateContext,
  NotificationTrigger,
  NotificationPersona,
} from './notificationTypes';

export interface PickTemplateInput {
  trigger: NotificationTrigger;
  persona: NotificationPersona;
  severity: NotificationSeverity;
  escalationTier: NotificationEscalationTier;
  intensity: NotificationIntensity;
  categoryContext: NotificationCategoryContext;
  context: NotificationTemplateContext;
  memory: NotificationMemory;
  now: number;
}

export const pickNotificationTemplate = (
  input: PickTemplateInput,
): NotificationTemplate | null => {
  const triggerCooldownKey = triggerCategoryKey(input.trigger, input.categoryContext);
  const lastTriggerAt = input.memory.lastShownAtByTriggerCategory[triggerCooldownKey];
  if (lastTriggerAt) {
    const cooldown = COOLDOWN_BY_TRIGGER[input.trigger] ?? 2 * 60 * 60 * 1000;
    if (input.now - lastTriggerAt < cooldown) {
      return null;
    }
  }

  const candidates = NOTIFICATION_TEMPLATES.filter(template => {
    if (template.trigger !== input.trigger) {return false;}
    if (template.persona !== input.persona) {return false;}
    return template.context === input.categoryContext || template.context === 'any' || template.context === 'generic';
  });
  const exactContextPool = candidates.filter(item => item.context === input.categoryContext);
  const contextPool = exactContextPool.length > 0 ? exactContextPool : candidates;

  const intensityPool = contextPool.filter(item => !item.intensity || item.intensity === input.intensity);
  const basePool = intensityPool.length > 0 ? intensityPool : contextPool;
  const tierPool = basePool.filter(item => item.tier === input.escalationTier);
  const severityPool = basePool.filter(item => item.severity === input.severity);
  const pool = tierPool.length > 0 ? tierPool : (severityPool.length > 0 ? severityPool : basePool);
  if (pool.length === 0) {return null;}

  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const freshPool = pool.filter(item => {
    if (input.memory.recentTemplateIds.includes(item.id)) {return false;}
    if (input.memory.recentTexts.includes(item.body.trim())) {return false;}
    const lastShown = input.memory.lastShownAtByTemplateId[item.id];
    return !lastShown || input.now - lastShown > sevenDays;
  });

  const finalPool = freshPool.length > 0 ? freshPool : pool;
  if (finalPool.length === 0) {return null;}

  const openingScore = (text: string): number => {
    const opening = text
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, '')
      .split(/\s+/)
      .slice(0, 3)
      .join(' ');
    if (!opening) {return 0;}
    return input.memory.lastOpeningPhrases.includes(opening) ? 1 : 0;
  };

  const scored = [...finalPool].sort((a, b) => {
    const aContextPenalty = a.context === input.categoryContext ? 0 : 1;
    const bContextPenalty = b.context === input.categoryContext ? 0 : 1;
    if (aContextPenalty !== bContextPenalty) {return aContextPenalty - bContextPenalty;}

    const aTierPenalty = Math.abs((a.tier || 1) - input.escalationTier);
    const bTierPenalty = Math.abs((b.tier || 1) - input.escalationTier);
    if (aTierPenalty !== bTierPenalty) {return aTierPenalty - bTierPenalty;}

    const aOriginPenalty = a.origin === 'plan' ? 0 : 1;
    const bOriginPenalty = b.origin === 'plan' ? 0 : 1;
    if (aOriginPenalty !== bOriginPenalty) {return aOriginPenalty - bOriginPenalty;}

    const aOpeningPenalty = openingScore(a.body) + (input.memory.recentStructureHashes.includes(a.body.slice(0, 18).toLowerCase()) ? 1 : 0);
    const bOpeningPenalty = openingScore(b.body) + (input.memory.recentStructureHashes.includes(b.body.slice(0, 18).toLowerCase()) ? 1 : 0);
    if (aOpeningPenalty !== bOpeningPenalty) {return aOpeningPenalty - bOpeningPenalty;}

    const aLast = input.memory.lastShownAtByTemplateId[a.id] || 0;
    const bLast = input.memory.lastShownAtByTemplateId[b.id] || 0;
    return aLast - bLast;
  });

  return scored[0] || null;
};
