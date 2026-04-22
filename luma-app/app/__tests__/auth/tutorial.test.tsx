import React from 'react';
import { render, screen } from '@testing-library/react-native';

import TutorialScreen from '@/app/(auth)/tutorial';

jest.mock('expo-router', () => {
  const ReactLib = require('react');
  return {
    useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
    useLocalSearchParams: () => ({}),
    Link: ({ children }: { children: React.ReactNode }) => children,
    Redirect: () => ReactLib.createElement(ReactLib.Fragment, null),
    Stack: { Screen: 'Screen' },
    Tabs: { Screen: 'Screen' },
  };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      user: { id: 'u1', email: 'test@example.com' },
    }),
}));

describe('TutorialScreen (smoke)', () => {
  test('renderiza sem crash e mostra primeiro passo', () => {
    render(<TutorialScreen />);

    expect(screen.getByText('Conheça a Luma')).toBeTruthy();
    expect(screen.getByText('Próximo')).toBeTruthy();
  });
});
