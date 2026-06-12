import {create} from 'zustand';
import {Linking} from 'react-native';
import type {Session} from '@supabase/supabase-js';
import {getSupabaseClient, isSupabaseConfigured} from './supabaseClient';
import {getAuthRedirectUrlFromEnv} from '../../config/env';

let authLinkingSubscription: ReturnType<typeof Linking.addEventListener> | null = null;

interface AuthState {
  session: Session | null;
  isInitializing: boolean;
  isSubmitting: boolean;
  error: string | null;
  info: string | null;
  initialize: () => Promise<void>;
  sendEmailOtp: (email: string) => Promise<void>;
  verifyEmailOtp: (email: string, token: string) => Promise<void>;
  handleAuthCallbackUrl: (url: string | null) => Promise<void>;
  signOut: () => Promise<void>;
}

const parseAuthParams = (url: string): Record<string, string> => {
  const params: Record<string, string> = {};
  const [, queryPart = ''] = url.split('?');
  const [query = '', fragment = ''] = queryPart.split('#');
  const hash = url.includes('#') ? url.slice(url.indexOf('#') + 1) : fragment;
  const rawParams = [query, hash].filter(Boolean).join('&');

  rawParams.split('&').forEach(part => {
    const [rawKey, rawValue = ''] = part.split('=');
    if (!rawKey) {return;}
    params[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue.replace(/\+/g, ' '));
  });

  return params;
};

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

    const initialUrl = await Linking.getInitialURL();
    await useAuthStore.getState().handleAuthCallbackUrl(initialUrl);
    authLinkingSubscription?.remove();
    authLinkingSubscription = Linking.addEventListener('url', ({url}) => {
      useAuthStore.getState().handleAuthCallbackUrl(url);
    });
  },

  sendEmailOtp: async (email: string) => {
    set({isSubmitting: true, error: null, info: null});
    try {
      const {error} = await getSupabaseClient().auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: getAuthRedirectUrlFromEnv(),
        },
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

  handleAuthCallbackUrl: async (url: string | null) => {
    if (!url || !isSupabaseConfigured()) {return;}

    const params = parseAuthParams(url);
    try {
      if (params.access_token && params.refresh_token) {
        const {data, error} = await getSupabaseClient().auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        if (error) {throw error;}
        set({session: data.session, error: null, info: null});
        return;
      }

      if (params.code) {
        const {data, error} = await getSupabaseClient().auth.exchangeCodeForSession(params.code);
        if (error) {throw error;}
        set({session: data.session, error: null, info: null});
      }
    } catch (error) {
      set({error: error instanceof Error ? error.message : 'Không xác thực được liên kết email.'});
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
