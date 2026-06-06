import {create} from 'zustand';
import type {Session} from '@supabase/supabase-js';
import {getSupabaseClient, isSupabaseConfigured} from './supabaseClient';

interface AuthState {
  session: Session | null;
  isInitializing: boolean;
  isSubmitting: boolean;
  error: string | null;
  info: string | null;
  initialize: () => Promise<void>;
  sendEmailOtp: (email: string) => Promise<void>;
  verifyEmailOtp: (email: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isInitializing: true,
  isSubmitting: false,
  error: null,
  info: null,

  initialize: async () => {
    if (!isSupabaseConfigured()) {
      set({
        session: null,
        isInitializing: false,
        error: 'Thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY.',
      });
      return;
    }

    const supabase = getSupabaseClient();
    const {data, error} = await supabase.auth.getSession();
    set({
      session: data.session,
      isInitializing: false,
      error: error?.message || null,
    });

    supabase.auth.onAuthStateChange((_event, nextSession) => {
      set({session: nextSession, error: null});
    });
  },

  sendEmailOtp: async (email: string) => {
    set({isSubmitting: true, error: null, info: null});
    try {
      const {error} = await getSupabaseClient().auth.signInWithOtp({
        email,
        options: {shouldCreateUser: true},
      });
      if (error) {
        throw error;
      }
      set({info: 'Mã đăng nhập đã được gửi tới email của bạn.'});
    } catch (error) {
      set({error: error instanceof Error ? error.message : 'Không gửi được mã đăng nhập.'});
    } finally {
      set({isSubmitting: false});
    }
  },

  verifyEmailOtp: async (email: string, token: string) => {
    set({isSubmitting: true, error: null});
    try {
      const {data, error} = await getSupabaseClient().auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      if (error) {
        throw error;
      }
      set({session: data.session, info: null});
    } catch (error) {
      set({error: error instanceof Error ? error.message : 'Mã đăng nhập không hợp lệ.'});
    } finally {
      set({isSubmitting: false});
    }
  },

  signOut: async () => {
    if (isSupabaseConfigured()) {
      await getSupabaseClient().auth.signOut();
    }
    set({session: null, error: null, info: null});
  },
}));

export const getAccessToken = (): string | null =>
  useAuthStore.getState().session?.access_token || null;
