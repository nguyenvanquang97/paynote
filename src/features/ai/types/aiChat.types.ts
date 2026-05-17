export type AIIntent =
  | 'spending_summary'
  | 'category_breakdown'
  | 'period_compare'
  | 'abnormal_spending'
  | 'duplicate_check'
  | 'missed_transaction_check'
  | 'saving_advice'
  | 'unknown';

export type AIChatRole = 'user' | 'assistant' | 'system';

export type AIChatMessage = {
  id: string;
  role: AIChatRole;
  content: string;
  createdAt: number;
  status?: 'sending' | 'success' | 'error';
  metadata?: {
    intent?: AIIntent;
    source?: 'local' | 'llm' | 'fallback';
  };
};

export const createAIChatMessageId = (): string =>
  `ai_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
