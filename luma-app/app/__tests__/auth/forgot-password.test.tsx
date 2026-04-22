import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import ForgotPasswordScreen from '@/app/(auth)/forgot-password';
import { passwordResetService } from '@/services/password-reset.service';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/hooks/useI18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
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
  AuthInput: ({ placeholder, value, onChangeText, testID }: { placeholder: string; value: string; onChangeText: (v: string) => void; testID?: string }) => {
    const ReactLib = require('react');
    const { TextInput } = require('react-native');
    return ReactLib.createElement(TextInput, { placeholder, value, onChangeText, testID });
  },
}));

jest.mock('@/components/auth/AuthPrimaryButton', () => ({
  AuthPrimaryButton: ({ label, onPress, testID }: { label: string; onPress: () => void; testID?: string }) => {
    const ReactLib = require('react');
    const { Pressable, Text } = require('react-native');
    return ReactLib.createElement(
      Pressable,
      { onPress, testID },
      ReactLib.createElement(Text, null, label),
    );
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

jest.mock('@/services/password-reset.service', () => ({
  passwordResetService: {
    requestResetCode: jest.fn(),
    verifyResetCode: jest.fn(),
    finalizePasswordReset: jest.fn(),
  },
}));

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (passwordResetService.requestResetCode as jest.Mock).mockResolvedValue(undefined);
    (passwordResetService.verifyResetCode as jest.Mock).mockResolvedValue('token-valid');
    (passwordResetService.finalizePasswordReset as jest.Mock).mockResolvedValue(undefined);
  });

  test('renderiza passo 1 e envia código', async () => {
    render(<ForgotPasswordScreen />);

    fireEvent.changeText(screen.getByTestId('forgot-email'), 'user@luma.app');
    fireEvent.press(screen.getByTestId('forgot-submit'));

    await waitFor(() => {
      expect(passwordResetService.requestResetCode).toHaveBeenCalledWith('user@luma.app');
    });
    expect(screen.getByText('auth.forgotPassword.stepLabel 2/3')).toBeTruthy();
  });

  test('não avança quando código inválido', async () => {
    render(<ForgotPasswordScreen />);

    fireEvent.changeText(screen.getByTestId('forgot-email'), 'user@luma.app');
    fireEvent.press(screen.getByTestId('forgot-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('forgot-code')).toBeTruthy();
    });

    fireEvent.changeText(screen.getByTestId('forgot-code'), '123');
    fireEvent.press(screen.getByTestId('forgot-submit'));

    expect(passwordResetService.verifyResetCode).not.toHaveBeenCalled();
    expect(screen.getByText('auth.forgotPassword.stepLabel 2/3')).toBeTruthy();
  });

  test('avança para passo 3 quando código válido', async () => {
    render(<ForgotPasswordScreen />);

    fireEvent.changeText(screen.getByTestId('forgot-email'), 'user@luma.app');
    fireEvent.press(screen.getByTestId('forgot-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('forgot-code')).toBeTruthy();
    });

    fireEvent.changeText(screen.getByTestId('forgot-code'), '123456');
    fireEvent.press(screen.getByTestId('forgot-submit'));

    await waitFor(() => {
      expect(passwordResetService.verifyResetCode).toHaveBeenCalledWith('user@luma.app', '123456');
    });
    expect(screen.getByText('auth.forgotPassword.stepLabel 3/3')).toBeTruthy();
  });

  test('conclui reset com senha válida', async () => {
    render(<ForgotPasswordScreen />);

    fireEvent.changeText(screen.getByTestId('forgot-email'), 'user@luma.app');
    fireEvent.press(screen.getByTestId('forgot-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('forgot-code')).toBeTruthy();
    });

    fireEvent.changeText(screen.getByTestId('forgot-code'), '123456');
    fireEvent.press(screen.getByTestId('forgot-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('forgot-new-password')).toBeTruthy();
    });

    fireEvent.changeText(screen.getByTestId('forgot-new-password'), 'novaSenha123');
    fireEvent.changeText(screen.getByTestId('forgot-confirm-password'), 'novaSenha123');
    fireEvent.press(screen.getByTestId('forgot-submit'));

    await waitFor(() => {
      expect(passwordResetService.finalizePasswordReset).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@luma.app',
          code: '123456',
          newPassword: 'novaSenha123',
          verificationToken: 'token-valid',
        }),
      );
    });
  });
});
