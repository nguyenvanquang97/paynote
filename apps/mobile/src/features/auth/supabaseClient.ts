import {createClient, type SupabaseClient} from '@supabase/supabase-js';
import {createMMKV} from 'react-native-mmkv';
import {getSupabaseAnonKeyFromEnv, getSupabaseUrlFromEnv} from '../../config/env';

const storage = createMMKV({id: 'paynote-auth'});

const authStorage = {
  getItem: (key: string) => storage.getString(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.remove(key),
};

let client: SupabaseClient | null = null;

export const isSupabaseConfigured = (): boolean =>
  getSupabaseUrlFromEnv().length > 0 && getSupabaseAnonKeyFromEnv().length > 0;

export const getSupabaseClient = (): SupabaseClient => {
  if (client) {
    return client;
  }

  const supabaseUrl = getSupabaseUrlFromEnv();
  const supabaseAnonKey = getSupabaseAnonKeyFromEnv();
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  }

  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: authStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  return client;
};
