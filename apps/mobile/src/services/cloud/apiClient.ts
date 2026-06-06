import type {
  CategoryStatsItem,
  CategoryBudget,
  CustomCategory,
  CreateTransactionDto,
  InAppNotificationItem,
  MonthlyStats,
  Transaction,
  TransactionListQuery,
  UpdateTransactionDto,
} from '@paynote/shared';
import {getPayNoteApiUrlFromEnv} from '../../config/env';
import {getAccessToken} from '../../features/auth/authStore';

const apiBaseUrl = (): string => getPayNoteApiUrlFromEnv().replace(/\/+$/, '');

const buildUrl = (path: string, query?: Record<string, unknown>): string => {
  const base = apiBaseUrl();
  if (!base) {
    throw new Error('Missing PAYNOTE_API_URL');
  }
  const url = new URL(path.replace(/^\/+/, ''), `${base}/`);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

export const hasCloudSession = (): boolean => Boolean(getAccessToken());

export const cloudRequest = async <T>(
  path: string,
  init: RequestInit = {},
  query?: Record<string, unknown>,
): Promise<T> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Missing authenticated session');
  }

  const response = await fetch(buildUrl(path, query), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`PAYNOTE_API_${response.status}${text ? `_${text}` : ''}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
};

export const cloudTransactionsApi = {
  list: (query: TransactionListQuery = {}) =>
    cloudRequest<Transaction[]>('/transactions', {}, query as Record<string, unknown>),
  create: (body: CreateTransactionDto) =>
    cloudRequest<Transaction | null>('/transactions', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  update: (id: string, body: UpdateTransactionDto) =>
    cloudRequest<Transaction>(`/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  remove: (id: string) =>
    cloudRequest<void>(`/transactions/${id}`, {method: 'DELETE'}),
  monthlyStats: (year: number, month: number) =>
    cloudRequest<MonthlyStats>('/transactions/stats/monthly', {}, {year, month}),
  categoryStats: (startDate: number, endDate: number) =>
    cloudRequest<CategoryStatsItem[]>('/transactions/stats/categories', {}, {startDate, endDate}),
};

export const cloudCategoriesApi = {
  list: () => cloudRequest<CustomCategory[]>('/categories'),
  upsert: (category: CustomCategory) =>
    cloudRequest<CustomCategory>(`/categories/${category.id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    }),
  remove: (id: string) => cloudRequest<void>(`/categories/${id}`, {method: 'DELETE'}),
  favorites: () => cloudRequest<string[]>('/categories/favorites'),
  setFavorites: (categoryIds: string[]) =>
    cloudRequest<string[]>('/categories/favorites/list', {
      method: 'PUT',
      body: JSON.stringify({categoryIds}),
    }),
};

export const cloudBudgetsApi = {
  list: (monthKey?: string) => cloudRequest<CategoryBudget[]>('/budgets', {}, {monthKey}),
  upsert: (budget: CategoryBudget) =>
    cloudRequest<CategoryBudget>('/budgets', {
      method: 'PUT',
      body: JSON.stringify(budget),
    }),
  remove: (monthKey: string, categoryId: string) =>
    cloudRequest<void>(`/budgets/${monthKey}/${categoryId}`, {method: 'DELETE'}),
  monthlyNotes: () => cloudRequest<Record<string, string>>('/budgets/monthly-notes'),
  setMonthlyNote: (monthKey: string, note: string) =>
    cloudRequest<Record<string, string>>(`/budgets/monthly-notes/${monthKey}`, {
      method: 'PUT',
      body: JSON.stringify({note}),
    }),
};

export const cloudNotificationsApi = {
  list: () => cloudRequest<InAppNotificationItem[]>('/notifications'),
  create: (item: Omit<InAppNotificationItem, 'id' | 'createdAt' | 'isRead'>) =>
    cloudRequest<InAppNotificationItem>('/notifications', {
      method: 'POST',
      body: JSON.stringify(item),
    }),
  markRead: (id: string, isRead: boolean) =>
    cloudRequest<void>(`/notifications/${id}/read`, {
      method: 'PATCH',
      body: JSON.stringify({isRead}),
    }),
  remove: (id: string) => cloudRequest<void>(`/notifications/${id}`, {method: 'DELETE'}),
  clear: () => cloudRequest<void>('/notifications', {method: 'DELETE'}),
};
