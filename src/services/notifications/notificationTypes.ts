export type NotificationPersona =
  | 'advisor'
  | 'wallet_pet'
  | 'toxic_friend'
  | 'vietnamese_parent';

export type LegacyAiToneMode = 'gentle' | 'cute' | 'sarcastic_strong' | 'angry' | 'strict';

export type NotificationTrigger =
  | 'budget_50'
  | 'budget_80'
  | 'budget_100'
  | 'budget_120'
  | 'large_transaction'
  | 'repeat_category_today'
  | 'repeat_category_week'
  | 'late_night_spending'
  | 'bank_transaction_detected'
  | 'salary_received'
  | 'income_received'
  | 'no_spend_day'
  | 'saving_streak'
  | 'duplicate_transaction'
  | 'missed_transaction'
  | 'end_of_day_summary'
  | 'end_of_month_warning';

export type NotificationSeverity = 'low' | 'medium' | 'high' | 'critical';
export type NotificationEscalationTier = 1 | 2 | 3 | 4;
export type NotificationIntensity = 'soft' | 'normal' | 'sharp';

export type NotificationCategoryContext =
  | 'generic'
  | 'food'
  | 'cafe'
  | 'shopping'
  | 'transport'
  | 'rent'
  | 'bill'
  | 'entertainment'
  | 'health'
  | 'education'
  | 'salary'
  | 'saving';

export interface NotificationTemplateContext {
  categoryLabel?: string;
  amountText?: string;
  spentText?: string;
  limitText?: string;
  percent?: number;
  count?: number;
  daysLeft?: number;
  days?: number;
  transactionName?: string;
  bankName?: string;
  balanceText?: string;
}

export interface NotificationTemplate {
  id: string;
  trigger: NotificationTrigger;
  persona: NotificationPersona;
  severity: NotificationSeverity;
  tier?: NotificationEscalationTier;
  context: NotificationCategoryContext | 'any';
  title?: string;
  body: string;
  tags?: string[];
  intensity?: NotificationIntensity;
  origin?: 'plan' | 'generated' | 'native';
  planRef?: string;
}

export interface NotificationMemory {
  recentTemplateIds: string[];
  recentTexts: string[];
  lastOpeningPhrases: string[];
  lastShownAtByTemplateId: Record<string, number>;
  lastShownAtByTriggerCategory: Record<string, number>;
  countTodayByCategory: Record<string, number>;
  countTodayByTrigger: Record<string, number>;
  warningCountByCategory: Record<string, number>;
  violationVelocityByCategory: Record<string, number>;
  recoveryStreakByCategory: Record<string, number>;
  recentStructureHashes: string[];
  lastResetDate: string;
}
