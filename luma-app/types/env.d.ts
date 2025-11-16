declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
    EXPO_PUBLIC_N8N_WEBHOOK_URL?: string;
    EXPO_PUBLIC_SUPABASE_REDIRECT_URL?: string;
    DATABASE_URL?: string;
    DIRECT_URL?: string;
  }
}

