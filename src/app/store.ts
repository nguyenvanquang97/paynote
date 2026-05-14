import {create} from 'zustand';
import type {Transaction} from '../shared/types';
import {
  getTransactions,
  getMonthlyStats,
  getCategoryStats,
  deleteAllTransactions,
} from '../database';
import dayjs from 'dayjs';
import {createMMKV} from 'react-native-mmkv';

const storage = createMMKV();

export interface Profile {
  name: string;
  avatarUrl: string;
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

export type BudgetMap = Record<string, CategoryBudget>;

export interface BudgetStatus {
  limit: number;
  spent: number;
  remaining: number;
  progress: number;
  isOver: boolean;
  exists: boolean;
}

export type BudgetAlertThreshold = 80 | 100 | 120;

export interface BudgetAlertRecord {
  triggeredAt: number;
  spent: number;
  limit: number;
}

export type BudgetAlertHistory = Record<string, BudgetAlertRecord>;

export interface InAppNotificationItem {
  id: string;
  type: 'budget_alert';
  title: string;
  message: string;
  categoryId?: string;
  monthKey?: string;
  threshold?: BudgetAlertThreshold;
  createdAt: number;
  isRead: boolean;
}

export type ThemeMode = 'light' | 'dark' | 'forest';

export const toMonthKey = (year: number, month: number): string =>
  `${year}-${String(month).padStart(2, '0')}`;

export const toBudgetKey = (monthKey: string, categoryId: string): string =>
  `${monthKey}:${categoryId}`;

export const toBudgetAlertKey = (
  monthKey: string,
  categoryId: string,
  threshold: BudgetAlertThreshold,
): string => `${monthKey}:${categoryId}:${threshold}`;

interface AppState {
  // Transactions
  transactions: Transaction[];
  isLoading: boolean;

  // Dashboard stats
  totalIncome: number;
  totalExpense: number;
  categoryStats: Array<{category: string; total: number; count: number}>;

  // Selected month
  selectedYear: number;
  selectedMonth: number;

  // Notification access
  hasNotificationAccess: boolean;

  // Custom Categories
  customCategories: Record<string, CustomCategory>;

  // Profile
  profile: Profile;
  // Budgets
  categoryBudgets: BudgetMap;
  favoriteCategories: string[];
  monthlyNotes: Record<string, string>;
  categoryExpenseByMonth: Record<string, Record<string, number>>;
  budgetAlertsEnabled: boolean;
  budgetAlertHistory: BudgetAlertHistory;
  inAppNotifications: InAppNotificationItem[];
  themeMode: ThemeMode;

  // Actions
  loadTransactions: () => Promise<void>;
  loadStats: () => Promise<void>;
  addTransaction: (transaction: Transaction) => void;
  setSelectedMonth: (year: number, month: number) => void;
  setNotificationAccess: (hasAccess: boolean) => void;
  loadCustomCategories: () => void;
  addCustomCategory: (category: CustomCategory) => void;
  deleteCustomCategory: (id: string) => void;
  updateCustomCategory: (category: CustomCategory) => void;
  loadProfile: () => void;
  setProfile: (profile: Profile) => void;
  loadCategoryBudgets: () => void;
  setCategoryBudget: (categoryId: string, monthKey: string, limit: number) => void;
  removeCategoryBudget: (categoryId: string, monthKey: string) => void;
  getBudgetStatus: (categoryId: string, year: number, month: number) => BudgetStatus;
  loadFavoriteCategories: () => void;
  setFavoriteCategories: (categories: string[]) => void;
  toggleFavoriteCategory: (categoryId: string) => void;
  loadMonthlyNotes: () => void;
  setMonthlyNote: (monthKey: string, note: string) => void;
  loadBudgetAlertsEnabled: () => void;
  setBudgetAlertsEnabled: (enabled: boolean) => void;
  loadBudgetAlertHistory: () => void;
  markBudgetAlertTriggered: (
    monthKey: string,
    categoryId: string,
    threshold: BudgetAlertThreshold,
    payload: {spent: number; limit: number},
  ) => void;
  hasBudgetAlertTriggered: (
    monthKey: string,
    categoryId: string,
    threshold: BudgetAlertThreshold,
  ) => boolean;
  clearBudgetAlertHistoryForMonth: (monthKey: string) => void;
  loadInAppNotifications: () => void;
  pushInAppNotification: (item: Omit<InAppNotificationItem, 'id' | 'createdAt' | 'isRead'>) => void;
  markInAppNotificationRead: (id: string) => void;
  markInAppNotificationUnread: (id: string) => void;
  markAllInAppNotificationsRead: () => void;
  deleteInAppNotification: (id: string) => void;
  clearInAppNotifications: () => void;
  loadThemeMode: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  resetData: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  transactions: [],
  isLoading: false,
  totalIncome: 0,
  totalExpense: 0,
  categoryStats: [],
  selectedYear: dayjs().year(),
  selectedMonth: dayjs().month() + 1,
  hasNotificationAccess: false,
  customCategories: {},
  profile: { name: 'Người dùng', avatarUrl: '' },
  categoryBudgets: {},
  favoriteCategories: [],
  monthlyNotes: {},
  categoryExpenseByMonth: {},
  budgetAlertsEnabled: true,
  budgetAlertHistory: {},
  inAppNotifications: [],
  themeMode: 'light',

  // Actions
  loadTransactions: async () => {
    set({isLoading: true});
    try {
      const transactions = await getTransactions(100);
      set({transactions, isLoading: false});
    } catch (error) {
      console.error('Failed to load transactions:', error);
      set({isLoading: false});
    }
  },

  loadStats: async () => {
    try {
      const {selectedYear, selectedMonth} = get();

      const {totalIncome, totalExpense} = await getMonthlyStats(
        selectedYear,
        selectedMonth,
      );

      const startDate = new Date(selectedYear, selectedMonth - 1, 1).getTime();
      const endDate = new Date(
        selectedYear,
        selectedMonth,
        0,
        23,
        59,
        59,
        999,
      ).getTime();

      const categoryStats = await getCategoryStats(startDate, endDate);
      const monthKey = toMonthKey(selectedYear, selectedMonth);
      const categoryExpenseMap = Object.fromEntries(
        categoryStats.map(item => [item.category, item.total]),
      ) as Record<string, number>;

      set(state => ({
        totalIncome,
        totalExpense,
        categoryStats,
        categoryExpenseByMonth: {
          ...state.categoryExpenseByMonth,
          [monthKey]: categoryExpenseMap,
        },
      }));
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  },

  addTransaction: (transaction: Transaction) => {
    set(state => ({
      transactions: [transaction, ...state.transactions],
    }));
  },

  setSelectedMonth: (year: number, month: number) => {
    set({selectedYear: year, selectedMonth: month});
    get().loadStats();
  },

  setNotificationAccess: (hasAccess: boolean) => {
    set({hasNotificationAccess: hasAccess});
  },

  loadCustomCategories: () => {
    const data = storage.getString('custom_categories');
    if (data) {
      try {
        const parsed = JSON.parse(data) as Record<string, CustomCategory>;
        const sanitized = Object.fromEntries(
          Object.entries(parsed || {}).filter(([, cat]) => {
            return Boolean(
              cat &&
              typeof cat.id === 'string' &&
              cat.id.trim().length > 0 &&
              typeof cat.name === 'string' &&
              cat.name.trim().length > 0 &&
              typeof cat.icon === 'string' &&
              cat.icon.trim().length > 0,
            );
          }),
        ) as Record<string, CustomCategory>;
        storage.set('custom_categories', JSON.stringify(sanitized));
        set({customCategories: sanitized});
      } catch (e) {
        console.error('Failed to parse custom categories', e);
      }
    }
  },

  addCustomCategory: (category: CustomCategory) => {
    set(state => {
      const newCategories = {...state.customCategories, [category.id]: category};
      storage.set('custom_categories', JSON.stringify(newCategories));
      return {customCategories: newCategories};
    });
  },

  deleteCustomCategory: (id: string) => {
    set(state => {
      const newCategories = {...state.customCategories};
      delete newCategories[id];
      storage.set('custom_categories', JSON.stringify(newCategories));
      return {customCategories: newCategories};
    });
  },

  updateCustomCategory: (category: CustomCategory) => {
    set(state => {
      const newCategories = {...state.customCategories, [category.id]: category};
      storage.set('custom_categories', JSON.stringify(newCategories));
      return {customCategories: newCategories};
    });
  },

  loadProfile: () => {
    const data = storage.getString('profile');
    if (data) {
      try {
        set({profile: JSON.parse(data)});
      } catch (e) {
        console.error('Failed to parse profile', e);
      }
    }
  },

  setProfile: (profile: Profile) => {
    storage.set('profile', JSON.stringify(profile));
    set({profile});
  },

  loadCategoryBudgets: () => {
    const data = storage.getString('category_budgets');
    if (!data) {return;}
    try {
      const parsed = JSON.parse(data) as BudgetMap;
      const sanitized = Object.fromEntries(
        Object.entries(parsed || {}).filter(([, item]) => {
          return Boolean(
            item &&
            typeof item.categoryId === 'string' &&
            item.categoryId.trim().length > 0 &&
            typeof item.monthKey === 'string' &&
            item.monthKey.trim().length > 0 &&
            typeof item.limit === 'number' &&
            item.limit > 0,
          );
        }),
      ) as BudgetMap;
      storage.set('category_budgets', JSON.stringify(sanitized));
      set({categoryBudgets: sanitized});
    } catch (e) {
      console.error('Failed to parse category budgets', e);
    }
  },

  setCategoryBudget: (categoryId: string, monthKey: string, limit: number) => {
    if (!categoryId || !monthKey || !Number.isFinite(limit) || limit <= 0) {return;}
    set(state => {
      const key = toBudgetKey(monthKey, categoryId);
      const nextBudgets: BudgetMap = {
        ...state.categoryBudgets,
        [key]: {
          categoryId,
          monthKey,
          limit,
          updatedAt: Date.now(),
        },
      };
      storage.set('category_budgets', JSON.stringify(nextBudgets));
      return {categoryBudgets: nextBudgets};
    });
  },

  removeCategoryBudget: (categoryId: string, monthKey: string) => {
    set(state => {
      const key = toBudgetKey(monthKey, categoryId);
      if (!state.categoryBudgets[key]) {return state;}
      const nextBudgets = {...state.categoryBudgets};
      delete nextBudgets[key];
      storage.set('category_budgets', JSON.stringify(nextBudgets));
      return {categoryBudgets: nextBudgets};
    });
  },

  getBudgetStatus: (categoryId: string, year: number, month: number) => {
    const state = get();
    const monthKey = toMonthKey(year, month);
    const budgetKey = toBudgetKey(monthKey, categoryId);
    const budget = state.categoryBudgets[budgetKey];
    const spent = state.categoryExpenseByMonth[monthKey]?.[categoryId] || 0;
    if (!budget) {
      return {
        limit: 0,
        spent,
        remaining: 0,
        progress: 0,
        isOver: false,
        exists: false,
      };
    }
    const remaining = budget.limit - spent;
    const progress = budget.limit > 0 ? Math.min(spent / budget.limit, 9.99) : 0;
    return {
      limit: budget.limit,
      spent,
      remaining,
      progress,
      isOver: spent > budget.limit,
      exists: true,
    };
  },

  loadFavoriteCategories: () => {
    const data = storage.getString('favorite_categories');
    if (!data) {return;}
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        set({favoriteCategories: parsed.filter(item => typeof item === 'string')});
      }
    } catch (e) {
      console.error('Failed to parse favorite categories', e);
    }
  },

  setFavoriteCategories: (categories: string[]) => {
    const sanitized = categories.filter(Boolean);
    storage.set('favorite_categories', JSON.stringify(sanitized));
    set({favoriteCategories: sanitized});
  },

  toggleFavoriteCategory: (categoryId: string) => {
    set(state => {
      const next = state.favoriteCategories.includes(categoryId)
        ? state.favoriteCategories.filter(item => item !== categoryId)
        : [...state.favoriteCategories, categoryId];
      storage.set('favorite_categories', JSON.stringify(next));
      return {favoriteCategories: next};
    });
  },

  loadMonthlyNotes: () => {
    const data = storage.getString('monthly_notes');
    if (!data) {return;}
    try {
      const parsed = JSON.parse(data) as Record<string, string>;
      const sanitized = Object.fromEntries(
        Object.entries(parsed || {}).filter(([k, v]) => typeof k === 'string' && typeof v === 'string'),
      );
      storage.set('monthly_notes', JSON.stringify(sanitized));
      set({monthlyNotes: sanitized});
    } catch (e) {
      console.error('Failed to parse monthly notes', e);
    }
  },

  setMonthlyNote: (monthKey: string, note: string) => {
    set(state => {
      const next = {...state.monthlyNotes};
      if (note.trim().length === 0) {
        delete next[monthKey];
      } else {
        next[monthKey] = note;
      }
      storage.set('monthly_notes', JSON.stringify(next));
      return {monthlyNotes: next};
    });
  },

  loadBudgetAlertsEnabled: () => {
    const data = storage.getBoolean('budget_alerts_enabled');
    if (typeof data === 'boolean') {
      set({budgetAlertsEnabled: data});
    }
  },

  setBudgetAlertsEnabled: (enabled: boolean) => {
    storage.set('budget_alerts_enabled', enabled);
    set({budgetAlertsEnabled: enabled});
  },

  loadBudgetAlertHistory: () => {
    const data = storage.getString('budget_alert_history');
    if (!data) {return;}
    try {
      const parsed = JSON.parse(data) as BudgetAlertHistory;
      const sanitized = Object.fromEntries(
        Object.entries(parsed || {}).filter(([, value]) =>
          Boolean(
            value &&
            typeof value.triggeredAt === 'number' &&
            typeof value.spent === 'number' &&
            typeof value.limit === 'number',
          ),
        ),
      ) as BudgetAlertHistory;
      storage.set('budget_alert_history', JSON.stringify(sanitized));
      set({budgetAlertHistory: sanitized});
    } catch (e) {
      console.error('Failed to parse budget alert history', e);
    }
  },

  markBudgetAlertTriggered: (monthKey, categoryId, threshold, payload) => {
    set(state => {
      const key = toBudgetAlertKey(monthKey, categoryId, threshold);
      const next: BudgetAlertHistory = {
        ...state.budgetAlertHistory,
        [key]: {
          triggeredAt: Date.now(),
          spent: payload.spent,
          limit: payload.limit,
        },
      };
      storage.set('budget_alert_history', JSON.stringify(next));
      return {budgetAlertHistory: next};
    });
  },

  hasBudgetAlertTriggered: (monthKey, categoryId, threshold) => {
    const key = toBudgetAlertKey(monthKey, categoryId, threshold);
    return Boolean(get().budgetAlertHistory[key]);
  },

  clearBudgetAlertHistoryForMonth: (monthKey) => {
    set(state => {
      const next = Object.fromEntries(
        Object.entries(state.budgetAlertHistory).filter(([k]) => !k.startsWith(`${monthKey}:`)),
      ) as BudgetAlertHistory;
      storage.set('budget_alert_history', JSON.stringify(next));
      return {budgetAlertHistory: next};
    });
  },

  loadInAppNotifications: () => {
    const data = storage.getString('in_app_notifications');
    if (!data) {return;}
    try {
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {return;}
      const sanitized = parsed.filter(item =>
        item &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.message === 'string' &&
        typeof item.createdAt === 'number' &&
        typeof item.isRead === 'boolean',
      ) as InAppNotificationItem[];
      set({inAppNotifications: sanitized.slice(0, 100)});
      storage.set('in_app_notifications', JSON.stringify(sanitized.slice(0, 100)));
    } catch (e) {
      console.error('Failed to parse in-app notifications', e);
    }
  },

  pushInAppNotification: (item) => {
    set(state => {
      const next: InAppNotificationItem[] = [
        {
          ...item,
          id: `notif_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
          createdAt: Date.now(),
          isRead: false,
        },
        ...state.inAppNotifications,
      ].slice(0, 100);
      storage.set('in_app_notifications', JSON.stringify(next));
      return {inAppNotifications: next};
    });
  },

  markInAppNotificationRead: (id) => {
    set(state => {
      const next = state.inAppNotifications.map(item =>
        item.id === id ? {...item, isRead: true} : item,
      );
      storage.set('in_app_notifications', JSON.stringify(next));
      return {inAppNotifications: next};
    });
  },

  markInAppNotificationUnread: (id) => {
    set(state => {
      const next = state.inAppNotifications.map(item =>
        item.id === id ? {...item, isRead: false} : item,
      );
      storage.set('in_app_notifications', JSON.stringify(next));
      return {inAppNotifications: next};
    });
  },

  markAllInAppNotificationsRead: () => {
    set(state => {
      const next = state.inAppNotifications.map(item => ({...item, isRead: true}));
      storage.set('in_app_notifications', JSON.stringify(next));
      return {inAppNotifications: next};
    });
  },

  deleteInAppNotification: (id) => {
    set(state => {
      const next = state.inAppNotifications.filter(item => item.id !== id);
      storage.set('in_app_notifications', JSON.stringify(next));
      return {inAppNotifications: next};
    });
  },

  clearInAppNotifications: () => {
    storage.remove('in_app_notifications');
    set({inAppNotifications: []});
  },

  loadThemeMode: () => {
    const raw = storage.getString('theme_mode');
    if (!raw) {return;}
    if (raw === 'light' || raw === 'dark' || raw === 'forest') {
      set({themeMode: raw});
    }
  },

  setThemeMode: (mode) => {
    storage.set('theme_mode', mode);
    set({themeMode: mode});
  },

  resetData: async () => {
    await deleteAllTransactions();
    storage.remove('custom_categories');
    storage.remove('category_budgets');
    storage.remove('favorite_categories');
    storage.remove('monthly_notes');
    storage.remove('budget_alert_history');
    storage.remove('budget_alerts_enabled');
    storage.remove('in_app_notifications');
    storage.remove('theme_mode');
    set({
      transactions: [],
      totalIncome: 0,
      totalExpense: 0,
      categoryStats: [],
      customCategories: {},
      categoryBudgets: {},
      favoriteCategories: [],
      monthlyNotes: {},
      categoryExpenseByMonth: {},
      budgetAlertsEnabled: true,
      budgetAlertHistory: {},
      inAppNotifications: [],
      themeMode: 'light',
    });
  },
}));
