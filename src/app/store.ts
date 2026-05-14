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

      set({totalIncome, totalExpense, categoryStats});
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
        set({customCategories: JSON.parse(data)});
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

  resetData: async () => {
    await deleteAllTransactions();
    storage.remove('custom_categories');
    set({
      transactions: [],
      totalIncome: 0,
      totalExpense: 0,
      categoryStats: [],
      customCategories: {},
    });
  },
}));
