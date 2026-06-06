import {
  budgetSeverityFromThreshold,
  budgetTriggerFromThreshold,
  generateNotificationMessage,
  normalizePersona,
  PERSONA_TO_LEGACY_TONE,
} from './notifications';

export type AiToneMode = 'gentle' | 'cute' | 'sarcastic_strong' | 'angry';
type Threshold = 50 | 80 | 100 | 120;

export interface RoastFallbackContext {
  categoryLabel: string;
  percent: number;
  spentText: string;
  limitText: string;
  threshold: Threshold;
  allowStrongLanguage?: boolean;
}

export const buildFallbackRoastMessage = (
  tone: AiToneMode,
  context: RoastFallbackContext,
): string => {
  const persona = normalizePersona(tone);
  const generated = generateNotificationMessage({
    trigger: budgetTriggerFromThreshold(context.threshold),
    persona,
    categoryLabel: context.categoryLabel,
    context: {
      categoryLabel: context.categoryLabel,
      percent: context.percent,
      spentText: context.spentText,
      limitText: context.limitText,
    },
    severity: budgetSeverityFromThreshold(context.threshold),
    intensity: 'normal',
    allowStrongLanguage: context.allowStrongLanguage,
  });

  if (generated?.message) {
    return generated.message;
  }

  // Hard fallback (should be rare if template pool exists)
  const legacyTone = PERSONA_TO_LEGACY_TONE[persona];
  if (legacyTone === 'gentle') {
    return `${context.categoryLabel} đã ${context.percent}%, mình giảm nhịp lại một chút nhé.`;
  }
  if (legacyTone === 'cute') {
    return `Ví bé thấy ${context.categoryLabel} ${context.percent}% rồi đó 🥹`;
  }
  if (legacyTone === 'angry') {
    return `${context.categoryLabel} đã ${context.percent}% rồi, dừng chi linh tinh ngay.`;
  }
  return `${context.categoryLabel} đã ${context.percent}%, đà này cuối tháng khá căng.`;
};
