jest.mock('@/lib/supabase', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { supabaseTest } = require('../supabase-test-registry');
  return { supabase: supabaseTest.client };
});

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  Link: 'Link',
  Stack: { Screen: 'Screen' },
  Tabs: { Screen: 'Screen' },
}));

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('expo-font');
