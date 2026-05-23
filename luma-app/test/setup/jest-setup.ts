// Mock lib/env before any store/service imports it — avoids assertEnv() throw in CI
jest.mock('@/lib/env', () => ({
  SUPABASE_URL: 'https://test-project.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
  N8N_WEBHOOK_URL: 'https://test-n8n.example.com/webhook/test',
  N8N_HMAC_SECRET: 'test-hmac-secret',
  N8N_JWT_SECRET: 'test-jwt-secret',
  INTEGRITY_VERIFY_URL: 'https://test-integrity.example.com',
  SUPABASE_REDIRECT_URL: 'https://test-app.example.com',
}));

jest.mock('@/lib/supabase', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { supabaseTest } = require('../supabase-test-registry');
  return { supabase: supabaseTest.client };
});

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  Link: ({ children }: { children: unknown }) => children,
  Redirect: () => null,
  Stack: { Screen: 'Screen' },
  Tabs: { Screen: 'Screen' },
}));

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('expo-font');
