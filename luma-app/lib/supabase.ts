import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { getEnvVar } from '@/lib/utils';
import type { Database } from '@/types/supabase';

const supabaseUrl = getEnvVar('EXPO_PUBLIC_SUPABASE_URL');

/** Chave pública do projeto: publishable (`sb_publishable_…`) ou legado `anon` (JWT). */
const getSupabasePublicKey = (): string => {
  const publishable = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (publishable?.trim()) {
    return publishable.trim();
  }
  if (anon?.trim()) {
    return anon.trim();
  }
  throw new Error(
    'Defina EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ou EXPO_PUBLIC_SUPABASE_ANON_KEY no .env (veja env.example).',
  );
};

const supabasePublicKey = getSupabasePublicKey();

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
  createClient<Database>(supabaseUrl, supabasePublicKey, {
    auth: {
      ...(storage && { storage }),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: isWeb && typeof window !== 'undefined',
    },
  });

export const supabase = createSupabaseClient();

