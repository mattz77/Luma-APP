import React from 'react';
import { render, screen } from '@testing-library/react-native';

import LoginScreen from '@/app/(auth)/login';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/hooks/useI18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

jest.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      user: null,
      loading: false,
      signIn: jest.fn(),
      signInWithGoogle: jest.fn(),
    }),
}));

jest.mock('@/components/auth/AuthBackground', () => ({
  AuthBackground: ({ children }: { children: React.ReactNode }) => {
    const ReactLib = require('react');
    const { View } = require('react-native');
    return ReactLib.createElement(View, null, children);
  },
}));

jest.mock('@/components/auth/AuthHeader', () => ({
  AuthHeader: () => null,
}));

jest.mock('@/components/auth/AuthInput', () => ({
  AuthInput: ({ placeholder, value, onChangeText }: { placeholder: string; value: string; onChangeText: (v: string) => void }) => {
    const ReactLib = require('react');
    const { TextInput } = require('react-native');
    return ReactLib.createElement(TextInput, { placeholder, value, onChangeText });
  },
}));

jest.mock('@/components/auth/AuthPrimaryButton', () => ({
  AuthPrimaryButton: ({ label }: { label: string }) => {
    const ReactLib = require('react');
    const { Text } = require('react-native');
    return ReactLib.createElement(Text, null, label);
  },
}));

jest.mock('@/components/auth/GoogleSignInButton', () => ({
  GoogleSignInButton: ({ label }: { label: string }) => {
    const ReactLib = require('react');
    const { Text } = require('react-native');
    return ReactLib.createElement(Text, null, label);
  },
}));

jest.mock('@/components/auth/AuthDivider', () => ({
  AuthDivider: ({ label }: { label: string }) => {
    const ReactLib = require('react');
    const { Text } = require('react-native');
    return ReactLib.createElement(Text, null, label);
  },
}));

jest.mock('@/components/ui/vstack', () => ({
  VStack: ({ children }: { children: React.ReactNode }) => {
    const ReactLib = require('react');
    const { View } = require('react-native');
    return ReactLib.createElement(View, null, children);
  },
}));
jest.mock('@/components/ui/hstack', () => ({
  HStack: ({ children }: { children: React.ReactNode }) => {
    const ReactLib = require('react');
    const { View } = require('react-native');
    return ReactLib.createElement(View, null, children);
  },
}));

describe('LoginScreen (smoke)', () => {
  test('renderiza sem crash e mostra elementos principais', () => {
    render(<LoginScreen />);

    expect(screen.getByText('auth.login.subtitle')).toBeTruthy();
    expect(screen.getByPlaceholderText('auth.login.email')).toBeTruthy();
    expect(screen.getByPlaceholderText('auth.login.password')).toBeTruthy();
    expect(screen.getByText('auth.login.button')).toBeTruthy();
  });
});
