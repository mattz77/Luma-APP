import axios, { AxiosError } from 'axios';

import { getEnvVar } from '@/lib/utils';

interface LumaMessagePayload {
  house_id: string;
  user_id: string;
  message: string;
  context?: Record<string, unknown>;
}

interface LumaResponse {
  success: boolean;
  response: string;
  metadata?: {
    session_id?: string;
    processing_time_ms?: number;
    tools_used?: string[];
    model?: string;
    parsed?: unknown;
  };
}

const n8nWebhookBaseUrl = getEnvVar('EXPO_PUBLIC_N8N_WEBHOOK_URL');
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const n8nClient = {
  async sendMessage(payload: LumaMessagePayload): Promise<LumaResponse> {
    // Gerar ID único para prevenir processamento duplicado
    const messageId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const body = {
      house_id: payload.house_id,
      user_id: payload.user_id,
      message: payload.message,
      context: {
        ...(payload.context ?? {}),
        message_id: messageId, // ID único para idempotência
      },
    };

    const url = `${n8nWebhookBaseUrl}/webhook/luma-chat-enhanced`;
    const maxAttempts = 1; // Desabilitar retry - idempotência no n8n

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { data } = await axios.post<LumaResponse>(url, body, {
          timeout: 60_000, // Aumentado para 60s (workflow pode levar ~30s)
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': messageId, // Header para rastreamento
          },
          // Desabilitar retry automático do axios
          validateStatus: (status) => status < 500, // Não lançar erro para 4xx
        });

        if (!data.success) {
          throw new Error('Resposta do n8n indicou falha');
        }

        return data;
      } catch (error) {
        const axiosError = error as AxiosError;
        const isTimeout = axiosError.code === 'ECONNABORTED';
        const status = axiosError.response?.status ?? null;
        const shouldRetry = (isTimeout || status === 429 || status >= 500) && attempt < maxAttempts;

        if (!shouldRetry) {
          console.error('N8N API Error:', axiosError.message, { status });
          if (axios.isAxiosError(axiosError)) {
            console.error('Response:', axiosError.response?.data);
          }
          if (isTimeout) {
            throw new Error('N8N_TIMEOUT');
          }
          if (status === 429) {
            throw new Error('N8N_RATE_LIMIT');
          }
          throw new Error('N8N_GENERIC_ERROR');
        }

        const backoffMs = 500 * attempt * attempt;
        await sleep(backoffMs);
      }
    }

    throw new Error('N8N_GENERIC_ERROR');
  },
};

