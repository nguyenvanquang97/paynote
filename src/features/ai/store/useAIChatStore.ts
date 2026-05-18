import {create} from 'zustand';
import {createMMKV} from 'react-native-mmkv';
import type {AIAction, AIActionButton, AIAnswerCard, AIChatMessage, AIChatRole, AIIntent} from '../types/aiChat.types';

const storage = createMMKV();
const STORAGE_KEY = 'ai_chat_messages_v1';
const MAX_MESSAGES = 200;

const VALID_ROLES = new Set<AIChatRole>(['user', 'assistant', 'system']);
const VALID_STATUS = new Set(['sending', 'success', 'error']);
const VALID_INTENTS = new Set<AIIntent>([
  'spending_summary',
  'category_breakdown',
  'period_compare',
  'abnormal_spending',
  'duplicate_check',
  'missed_transaction_check',
  'saving_advice',
  'unknown',
]);
const VALID_CARD_TYPES = new Set<AIAnswerCard['type']>([
  'summary',
  'category_breakdown',
  'transactions',
  'warning',
]);

const sanitizeAction = (value: unknown): AIAction | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Partial<AIAction>;
  if (raw.type === 'open_transaction' && typeof (raw as any).transactionId === 'string') {
    return {
      type: 'open_transaction',
      transactionId: (raw as any).transactionId,
    };
  }

  if (raw.type === 'mark_duplicate' && Array.isArray((raw as any).transactionIds)) {
    const transactionIds = (raw as any).transactionIds.filter((item: unknown) => typeof item === 'string');
    if (transactionIds.length > 0) {
      return {
        type: 'mark_duplicate',
        transactionIds,
      };
    }
  }

  if (raw.type === 'ignore_duplicate' && Array.isArray((raw as any).transactionIds)) {
    const transactionIds = (raw as any).transactionIds.filter((item: unknown) => typeof item === 'string');
    if (transactionIds.length > 0) {
      return {
        type: 'ignore_duplicate',
        transactionIds,
      };
    }
  }

  if (raw.type === 'open_import') {
    return {type: 'open_import'};
  }

  if (raw.type === 'view_gap_warnings') {
    return {type: 'view_gap_warnings'};
  }

  if (
    raw.type === 'set_budget' &&
    typeof (raw as any).categoryId === 'string' &&
    typeof (raw as any).amount === 'number'
  ) {
    return {
      type: 'set_budget',
      categoryId: (raw as any).categoryId,
      amount: (raw as any).amount,
    };
  }

  return null;
};

const sanitizeActionButtons = (value: unknown): AIActionButton[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const actions = value
    .filter(item => item && typeof item === 'object')
    .map((item): AIActionButton | null => {
      const raw = item as Partial<AIActionButton>;
      if (typeof raw.label !== 'string') {
        return null;
      }
      const action = sanitizeAction(raw.action);
      if (!action) {
        return null;
      }
      const tone = raw.tone === 'default' || raw.tone === 'primary' || raw.tone === 'danger'
        ? raw.tone
        : undefined;
      return {
        label: raw.label,
        tone,
        action,
      };
    })
    .filter((item): item is AIActionButton => item !== null);

  return actions.length > 0 ? actions : undefined;
};

const sanitizeCards = (value: unknown): AIAnswerCard[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const cards = value
    .map((item): AIAnswerCard | null => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const card = item as AIAnswerCard;
      if (!VALID_CARD_TYPES.has(card.type)) {
        return null;
      }

      if (card.type === 'summary') {
        if (typeof card.title !== 'string' || typeof card.value !== 'number') {
          return null;
        }
        return {
          type: 'summary',
          title: card.title,
          value: card.value,
          subtitle: typeof card.subtitle === 'string' ? card.subtitle : undefined,
        };
      }

      if (card.type === 'category_breakdown') {
        if (!Array.isArray(card.items)) {
          return null;
        }
        const items = card.items
          .filter(row => row && typeof row === 'object')
          .map(row => ({
            label: typeof row.label === 'string' ? row.label : '',
            amount: typeof row.amount === 'number' ? row.amount : 0,
            percentage: typeof row.percentage === 'number' ? row.percentage : 0,
          }))
          .filter(row => row.label.length > 0);
        return {
          type: 'category_breakdown',
          items,
        };
      }

      if (card.type === 'transactions') {
        if (!Array.isArray(card.items)) {
          return null;
        }
        const items = card.items
          .filter(row => row && typeof row === 'object')
          .map(row => ({
            id: typeof row.id === 'string' ? row.id : '',
            amount: typeof row.amount === 'number' ? row.amount : 0,
            title: typeof row.title === 'string' ? row.title : '',
            date: typeof row.date === 'string' ? row.date : '',
          }))
          .filter(row => row.id && row.title);
        return {
          type: 'transactions',
          items,
        };
      }

      if (
        typeof (card as any).title !== 'string' ||
        typeof (card as any).description !== 'string' ||
        !['low', 'medium', 'high'].includes(String((card as any).severity))
      ) {
        return null;
      }
      return {
        type: 'warning',
        title: (card as any).title,
        description: (card as any).description,
        severity: (card as any).severity,
        actions: sanitizeActionButtons((card as any).actions),
      };
    })
    .filter((item): item is AIAnswerCard => item !== null);

  return cards.length > 0 ? cards : undefined;
};

const sanitizeMessage = (value: unknown): AIChatMessage | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Partial<AIChatMessage>;
  if (typeof raw.id !== 'string' || typeof raw.content !== 'string') {
    return null;
  }
  if (!VALID_ROLES.has(raw.role as AIChatRole)) {
    return null;
  }
  if (typeof raw.createdAt !== 'number' || !Number.isFinite(raw.createdAt)) {
    return null;
  }

  const status = typeof raw.status === 'string' && VALID_STATUS.has(raw.status)
    ? raw.status
    : undefined;

  const metadata = raw.metadata && typeof raw.metadata === 'object'
    ? {
        intent: typeof raw.metadata.intent === 'string' && VALID_INTENTS.has(raw.metadata.intent as AIIntent)
          ? raw.metadata.intent as AIIntent
          : undefined,
        source: raw.metadata.source === 'local' || raw.metadata.source === 'llm' || raw.metadata.source === 'fallback'
          ? raw.metadata.source
          : undefined,
        cards: sanitizeCards(raw.metadata.cards),
      }
    : undefined;

  return {
    id: raw.id,
    role: raw.role as AIChatRole,
    content: raw.content,
    createdAt: raw.createdAt,
    status,
    metadata,
  };
};

const loadPersistedMessages = (): AIChatMessage[] => {
  try {
    const raw = storage.getString(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(sanitizeMessage)
      .filter((item): item is AIChatMessage => item !== null)
      .slice(-MAX_MESSAGES);
  } catch {
    return [];
  }
};

const persistMessages = (messages: AIChatMessage[]) => {
  const bounded = messages.slice(-MAX_MESSAGES);
  storage.set(STORAGE_KEY, JSON.stringify(bounded));
};

type AIChatState = {
  messages: AIChatMessage[];
  isLoading: boolean;
  loadMessages: () => void;
  setLoading: (loading: boolean) => void;
  addMessage: (message: AIChatMessage) => void;
  updateMessage: (id: string, patch: Partial<AIChatMessage>) => void;
  clearMessages: () => void;
};

export const useAIChatStore = create<AIChatState>((set) => ({
  messages: loadPersistedMessages(),
  isLoading: false,
  loadMessages: () => {
    set({messages: loadPersistedMessages()});
  },
  setLoading: (loading) => {
    set({isLoading: loading});
  },
  addMessage: (message) => {
    set(state => {
      const next = [...state.messages, message].slice(-MAX_MESSAGES);
      persistMessages(next);
      return {messages: next};
    });
  },
  updateMessage: (id, patch) => {
    set(state => {
      const next = state.messages.map(message =>
        message.id === id
          ? {
              ...message,
              ...patch,
              id: message.id,
              role: message.role,
              createdAt: message.createdAt,
            }
          : message,
      );
      persistMessages(next);
      return {messages: next};
    });
  },
  clearMessages: () => {
    storage.remove(STORAGE_KEY);
    set({messages: []});
  },
}));
