import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { getEnvVar } from '@/lib/utils';
import type { Database } from '@/types/supabase';

const supabaseUrl = getEnvVar('EXPO_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY');

const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';
const webStorage = isWeb ? window.localStorage : undefined;

const createSupabaseClient = () =>
  createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: webStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: isWeb,
    },
  });

export const supabase = createSupabaseClient();

