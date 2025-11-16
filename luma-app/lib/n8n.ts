import axios from 'axios';

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
    session_id: string;
    processing_time_ms: number;
    tools_used: string[];
    model: string;
  };
}

const n8nWebhookBaseUrl = getEnvVar('EXPO_PUBLIC_N8N_WEBHOOK_URL');

export const n8nClient = {
  async sendMessage(payload: LumaMessagePayload): Promise<LumaResponse> {
    try {
      const { data } = await axios.post<LumaResponse>(
        `${n8nWebhookBaseUrl}/webhook/luma-chat-enhanced`,
        payload,
        {
          timeout: 30_000,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!data.success) {
        throw new Error('Resposta do n8n indicou falha');
      }

      return data;
    } catch (error) {
      console.error('N8N API Error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response:', error.response?.data);
        console.error('Status:', error.response?.status);
      }
      throw new Error('Falha ao comunicar com Luma');
    }
  },
};

