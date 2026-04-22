import React from 'react';
import { render, screen } from '@testing-library/react-native';

import VerifyEmailScreen from '@/app/(auth)/verify-email';
import { supabaseTest } from '@/test/supabase-test-registry';

jest.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      user: { id: 'u1', email: 'test@example.com' },
    }),
}));

describe('VerifyEmailScreen (smoke)', () => {
  beforeEach(() => {
    supabaseTest.reset();
    (supabaseTest.authMock.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'u1', email: 'test@example.com', email_confirmed_at: null } },
      error: null,
    });
    (supabaseTest.authMock.onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
  });

  test('renderiza sem crash e mostra conteúdo principal', () => {
    render(<VerifyEmailScreen />);

    expect(screen.getByText('Verifique seu e-mail')).toBeTruthy();
    expect(screen.getByText('seu e-mail')).toBeTruthy();
    expect(screen.getByText('Reenviar email')).toBeTruthy();
    expect(screen.getByText('Voltar para login')).toBeTruthy();
  });
});
