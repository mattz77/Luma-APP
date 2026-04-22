import React from 'react';
import { render, screen } from '@testing-library/react-native';

import OnboardingScreen from '@/app/(auth)/onboarding';

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

jest.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      user: { id: 'u1', email: 'test@example.com' },
    }),
}));

jest.mock('@/hooks/useHouses', () => ({
  useUserHouses: () => ({ data: [], isLoading: false }),
}));

describe('OnboardingScreen (smoke)', () => {
  test('renderiza sem crash e mostra CTA principal', () => {
    render(<OnboardingScreen />);

    expect(screen.getByText('Bem-vindo à Luma! ✨')).toBeTruthy();
    expect(screen.getByText('Gestão Financeira')).toBeTruthy();
    expect(screen.getByText('Tarefas Colaborativas')).toBeTruthy();
    expect(screen.getByText('Começar')).toBeTruthy();
  });
});
