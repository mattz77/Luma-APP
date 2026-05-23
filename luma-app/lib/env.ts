/**
 * Static env var references — babel-preset-expo inlines these at build time.
 *
 * IMPORTANT: `process.env.EXPO_PUBLIC_*` must be accessed with a LITERAL
 * dot-notation key (not bracket `process.env[var]`) for the Expo babel
 * plugin to replace them with their values during bundling.
 */

const assertEnv = (key: string, value: string | undefined): string => {
  if (value && value.length > 0) return value;
  throw new Error(
    `Variável de ambiente ausente: ${key}\n\n` +
      'Para corrigir:\n' +
      '1. Crie o arquivo luma-app/.env.local\n' +
      '2. Execute: .\\generate-secrets.ps1 (na raiz do projeto)\n' +
      `3. Ou adicione manualmente: ${key}=seu-valor-aqui\n` +
      '4. Reinicie o servidor: npx expo start --clear\n\n' +
      'Consulte env.example para ver todas as variáveis necessárias.',
  );
};

// Each var MUST be a direct `process.env.EXPO_PUBLIC_*` literal
// so babel can statically inline the value at build time.
export const SUPABASE_URL = assertEnv(
  'EXPO_PUBLIC_SUPABASE_URL',
  process.env.EXPO_PUBLIC_SUPABASE_URL,
);

export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

export const N8N_WEBHOOK_URL = assertEnv(
  'EXPO_PUBLIC_N8N_WEBHOOK_URL',
  process.env.EXPO_PUBLIC_N8N_WEBHOOK_URL,
);

export const N8N_HMAC_SECRET = assertEnv(
  'EXPO_PUBLIC_N8N_HMAC_SECRET',
  process.env.EXPO_PUBLIC_N8N_HMAC_SECRET,
);

export const N8N_JWT_SECRET =
  process.env.EXPO_PUBLIC_N8N_JWT_SECRET ?? '';

export const INTEGRITY_VERIFY_URL =
  process.env.EXPO_PUBLIC_INTEGRITY_VERIFY_URL ?? '';

export const SUPABASE_REDIRECT_URL =
  process.env.EXPO_PUBLIC_SUPABASE_REDIRECT_URL ?? '';
