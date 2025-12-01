import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { getEnvVar } from '@/lib/utils';
import type { Database } from '@/types/supabase';

const supabaseUrl = getEnvVar('EXPO_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY');

const isWeb = Platform.OS === 'web';

// Storage configuration - importação condicional para evitar erro SSR no web
const getStorage = () => {
  if (isWeb) {
    // No web, usa localStorage se disponível
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    return undefined;
  }
  
  // No mobile, usa AsyncStorage (importação dinâmica para evitar erro SSR)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return AsyncStorage;
  } catch (error) {
    console.warn('[Supabase] AsyncStorage não disponível, usando storage padrão');
    return undefined;
  }
};

const storage = getStorage();

const createSupabaseClient = () =>
  createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      ...(storage && { storage }),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: isWeb && typeof window !== 'undefined',
    },
  });

export const supabase = createSupabaseClient();

