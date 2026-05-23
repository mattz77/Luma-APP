import * as Crypto from 'expo-crypto';
import axios, { AxiosError } from 'axios';

import { N8N_WEBHOOK_URL, N8N_HMAC_SECRET } from '@/lib/env';

interface LumaMessagePayload {
  house_id: string;
  user_id: string;
  message: string;
  is_minor?: boolean;
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

const n8nWebhookBaseUrl = N8N_WEBHOOK_URL;
const n8nHmacSecret = N8N_HMAC_SECRET;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function buildHmacHeaders(body: object): Promise<Record<string, string>> {
  const timestamp = Math.floor(Date.now() / 1000);
  const sigPayload = `${timestamp}.${JSON.stringify(body)}`;
  const signature = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${n8nHmacSecret}${sigPayload}`,
  );
  return {
    'X-Luma-Signature': signature,
    'X-Luma-Timestamp': timestamp.toString(),
  };
}

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
        is_minor: payload.is_minor ?? false, // gating de gamificação no orquestrador
      },
    };

    const url = `${n8nWebhookBaseUrl}/webhook/luma-orchestrator`;
    const maxAttempts = 1; // Desabilitar retry - idempotência no n8n

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const hmacHeaders = await buildHmacHeaders(body);
        const { data } = await axios.post<LumaResponse>(url, body, {
          timeout: 60_000, // Aumentado para 60s (workflow pode levar ~30s)
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': messageId, // Header para rastreamento
            ...hmacHeaders,
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
        const shouldRetry = (isTimeout || status === 429 || (status !== null && status >= 500)) && attempt < maxAttempts;

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

