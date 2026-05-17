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

export type AIAnswerCard =
  | {
      type: 'summary';
      title: string;
      value: number;
      subtitle?: string;
    }
  | {
      type: 'category_breakdown';
      items: Array<{
        label: string;
        amount: number;
        percentage: number;
      }>;
    }
  | {
      type: 'transactions';
      items: Array<{
        id: string;
        amount: number;
        title: string;
        date: string;
      }>;
    }
  | {
      type: 'warning';
      title: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
    };

export type AIChatMessage = {
  id: string;
  role: AIChatRole;
  content: string;
  createdAt: number;
  status?: 'sending' | 'success' | 'error';
  metadata?: {
    intent?: AIIntent;
    source?: 'local' | 'llm' | 'fallback';
    cards?: AIAnswerCard[];
  };
};

export const createAIChatMessageId = (): string =>
  `ai_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
