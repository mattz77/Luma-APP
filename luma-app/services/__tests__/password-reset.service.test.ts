import { passwordResetService } from '@/services/password-reset.service';
import { supabaseTest } from '@/test/supabase-test-registry';

describe('passwordResetService', () => {
  beforeEach(() => {
    supabaseTest.reset();
  });

  test('requestResetCode chama edge function com email normalizado', async () => {
    supabaseTest.registerFunctionInvoke('password-reset-request-code', async (body) => {
      const payload = body as { email?: string };
      expect(payload.email).toBe('user@luma.app');
      return { data: { success: true }, error: null };
    });

    await passwordResetService.requestResetCode('  USER@LUMA.APP ');

    expect(supabaseTest.client.functions.invoke).toHaveBeenCalledWith(
      'password-reset-request-code',
      expect.objectContaining({
        body: expect.objectContaining({ email: 'user@luma.app' }),
      }),
    );
  });

  test('verifyResetCode retorna token quando código é válido', async () => {
    supabaseTest.registerFunctionInvoke('password-reset-verify-code', async (body) => {
      const payload = body as { email?: string; code?: string };
      expect(payload.email).toBe('user@luma.app');
      expect(payload.code).toBe('123456');
      return {
        data: { success: true, verificationToken: 'token-123' },
        error: null,
      };
    });

    const token = await passwordResetService.verifyResetCode('user@luma.app', '123-456');
    expect(token).toBe('token-123');
  });

  test('finalizePasswordReset envia payload completo', async () => {
    supabaseTest.registerFunctionInvoke('password-reset-finalize', async (body) => {
      const payload = body as {
        email?: string;
        code?: string;
        newPassword?: string;
        verificationToken?: string;
      };

      expect(payload).toEqual({
        email: 'user@luma.app',
        code: '123456',
        newPassword: 'NovaSenha123',
        verificationToken: 'token-123',
      });

      return { data: { success: true }, error: null };
    });

    await passwordResetService.finalizePasswordReset({
      email: 'user@luma.app',
      code: '123456',
      newPassword: 'NovaSenha123',
      verificationToken: 'token-123',
    });
  });
});

