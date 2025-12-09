import * as AppIntegrity from 'expo-app-integrity';

const integrityVerifyUrl = process.env.EXPO_PUBLIC_INTEGRITY_VERIFY_URL;

export interface IntegrityVerificationResult {
  token?: string;
  verified?: boolean;
}

/**
 * Obtém o token de integridade (se suportado) e envia para o backend validar.
 * Para web ou ambientes sem suporte, retorna gracefully sem erro.
 */
export const verifyAppIntegrity = async (): Promise<IntegrityVerificationResult> => {
  if (!AppIntegrity.isSupported()) {
    return { verified: false };
  }

  const tokenResponse = await AppIntegrity.getIntegrityToken();
  const token = tokenResponse.token;

  if (!token || !integrityVerifyUrl) {
    return { token, verified: false };
  }

  const response = await fetch(integrityVerifyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    return { token, verified: false };
  }

  return { token, verified: true };
};

