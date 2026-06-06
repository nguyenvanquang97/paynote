export type TransactionType = 'income' | 'expense';

export interface ParsedTransaction {
  amount: number;
  balanceAfter?: number | null;
  description?: string | null;
  transactionType: TransactionType;
  timestamp: number;
  rawText: string;
}

export interface Transaction extends ParsedTransaction {
  id: string;
  bank: string;
  category?: string | null;
  isSuspectedGap: boolean;
  createdAt: number;
  dedupeKey?: string | null;
}

export interface CreateTransactionDto extends ParsedTransaction {
  bank: string;
  category?: string | null;
}

export interface UpdateTransactionDto {
  amount?: number;
  transactionType?: TransactionType;
  description?: string | null;
  category?: string | null;
  timestamp?: number;
  isSuspectedGap?: boolean;
}

export interface TransactionListQuery {
  limit?: number;
  offset?: number;
  startDate?: number;
  endDate?: number;
}

export interface MonthlyStats {
  totalIncome: number;
  totalExpense: number;
}

export interface CategoryStatsItem {
  category: string;
  total: number;
  count: number;
}

export interface CustomCategory {
  id: string;
  name: string;
  icon: string;
  keywords: string[];
}

export interface CategoryBudget {
  categoryId: string;
  monthKey: string;
  limit: number;
  spent?: number;
  updatedAt: number;
}

export interface InAppNotificationItem {
  id: string;
  type: 'budget_alert' | 'periodic_reminder';
  title: string;
  message: string;
  createdAt: number;
  isRead: boolean;
  metadata?: Record<string, unknown>;
}

export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiChatRequest {
  model?: string;
  messages: AiChatMessage[];
}

export interface AiChatResponse {
  content: string;
  provider: 'gemini';
}

const normalizeText = (input?: string | null): string =>
  (input || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const normalizeAmount = (value?: number | null): string =>
  typeof value === 'number' && Number.isFinite(value) ? value.toFixed(2) : '';

export const generateTransactionDedupeKey = (
  bank: string,
  amount: number,
  timestamp: number,
  transactionType: TransactionType,
  description?: string | null,
  balanceAfter?: number | null,
  rawText?: string | null,
): string => {
  const roundedTimestampByMinute = Math.floor(timestamp / 60000) * 60000;
  return [
    normalizeText(bank),
    transactionType,
    normalizeAmount(amount),
    normalizeAmount(balanceAfter),
    String(roundedTimestampByMinute),
    normalizeText(description),
    normalizeText(rawText),
  ].join('|');
};
