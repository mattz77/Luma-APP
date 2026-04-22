import { supabase } from '@/lib/supabase';

interface PasswordResetResponse {
  success: boolean;
  message?: string;
}

interface VerifyResetCodeResponse extends PasswordResetResponse {
  verificationToken?: string;
}

const GENERIC_ERROR_MESSAGE = 'Não foi possível concluir a operação de recuperação de senha.';

const assertSuccess = (response: PasswordResetResponse | VerifyResetCodeResponse) => {
  if (!response?.success) {
    throw new Error(response?.message || GENERIC_ERROR_MESSAGE);
  }
};

export const passwordResetService = {
  async requestResetCode(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.functions.invoke<PasswordResetResponse>(
      'password-reset-request-code',
      {
        body: { email: normalizedEmail },
      },
    );

    if (error) {
      throw new Error(error.message || GENERIC_ERROR_MESSAGE);
    }

    assertSuccess(data ?? { success: false });
  },

  async verifyResetCode(email: string, code: string): Promise<string> {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.replace(/\D/g, '').slice(0, 6);

    const { data, error } = await supabase.functions.invoke<VerifyResetCodeResponse>(
      'password-reset-verify-code',
      {
        body: {
          email: normalizedEmail,
          code: normalizedCode,
        },
      },
    );

    if (error) {
      throw new Error(error.message || GENERIC_ERROR_MESSAGE);
    }

    assertSuccess(data ?? { success: false });

    if (!data?.verificationToken) {
      throw new Error(GENERIC_ERROR_MESSAGE);
    }

    return data.verificationToken;
  },

  async finalizePasswordReset(params: {
    email: string;
    code: string;
    newPassword: string;
    verificationToken: string;
  }): Promise<void> {
    const { email, code, newPassword, verificationToken } = params;
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.replace(/\D/g, '').slice(0, 6);

    const { data, error } = await supabase.functions.invoke<PasswordResetResponse>(
      'password-reset-finalize',
      {
        body: {
          email: normalizedEmail,
          code: normalizedCode,
          newPassword,
          verificationToken,
        },
      },
    );

    if (error) {
      throw new Error(error.message || GENERIC_ERROR_MESSAGE);
    }

    assertSuccess(data ?? { success: false });
  },
};

