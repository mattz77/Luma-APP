import axios, { AxiosError } from 'axios';

jest.mock('axios');
jest.mock('@/lib/utils', () => ({
  getEnvVar: jest.fn(() => 'https://n8n.example.com'),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('n8nClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
  });

  describe('sendMessage', () => {
    test('envia mensagem com payload correto', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          success: true,
          response: 'Olá! Como posso ajudar?',
          metadata: { session_id: 'abc123' },
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { n8nClient } = require('../n8n');
      const result = await n8nClient.sendMessage({
        house_id: 'house-1',
        user_id: 'user-1',
        message: 'Olá Luma!',
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://n8n.example.com/webhook/luma-chat-enhanced',
        expect.objectContaining({
          house_id: 'house-1',
          user_id: 'user-1',
          message: 'Olá Luma!',
          context: expect.objectContaining({
            message_id: expect.any(String),
          }),
        }),
        expect.objectContaining({
          timeout: 60_000,
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );

      expect(result).toEqual({
        success: true,
        response: 'Olá! Como posso ajudar?',
        metadata: { session_id: 'abc123' },
      });
    });

    test('inclui context adicional no payload', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { success: true, response: 'OK' },
      });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { n8nClient } = require('../n8n');
      await n8nClient.sendMessage({
        house_id: 'house-1',
        user_id: 'user-1',
        message: 'Teste',
        context: { extra_data: 'value' },
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          context: expect.objectContaining({
            extra_data: 'value',
            message_id: expect.any(String),
          }),
        }),
        expect.any(Object),
      );
    });

    test('lança erro quando success é false', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { success: false, response: '' },
      });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { n8nClient } = require('../n8n');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(
        n8nClient.sendMessage({
          house_id: 'house-1',
          user_id: 'user-1',
          message: 'Teste',
        }),
      ).rejects.toThrow('N8N_GENERIC_ERROR');

      consoleSpy.mockRestore();
    });

    test('lança N8N_TIMEOUT para timeout de conexão', async () => {
      const axiosError = new Error('timeout') as AxiosError;
      axiosError.code = 'ECONNABORTED';
      axiosError.message = 'timeout of 60000ms exceeded';
      axiosError.response = undefined;
      mockedAxios.post.mockRejectedValue(axiosError);

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { n8nClient } = require('../n8n');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(
        n8nClient.sendMessage({
          house_id: 'house-1',
          user_id: 'user-1',
          message: 'Teste',
        }),
      ).rejects.toThrow('N8N_TIMEOUT');

      consoleSpy.mockRestore();
    });

    test('lança N8N_RATE_LIMIT para status 429', async () => {
      const axiosError = new Error('rate limit') as AxiosError;
      axiosError.code = '';
      axiosError.message = 'Request failed';
      axiosError.response = { status: 429, data: {}, headers: {}, statusText: 'Too Many Requests', config: {} as AxiosError['config'] };
      mockedAxios.post.mockRejectedValue(axiosError);

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { n8nClient } = require('../n8n');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(
        n8nClient.sendMessage({
          house_id: 'house-1',
          user_id: 'user-1',
          message: 'Teste',
        }),
      ).rejects.toThrow('N8N_RATE_LIMIT');

      consoleSpy.mockRestore();
    });

    test('lança N8N_GENERIC_ERROR para outros erros', async () => {
      const axiosError = new Error('network error') as AxiosError;
      axiosError.code = '';
      axiosError.message = 'Network Error';
      axiosError.response = { status: 400, data: {}, headers: {}, statusText: 'Bad Request', config: {} as AxiosError['config'] };
      mockedAxios.post.mockRejectedValue(axiosError);

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { n8nClient } = require('../n8n');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(
        n8nClient.sendMessage({
          house_id: 'house-1',
          user_id: 'user-1',
          message: 'Teste',
        }),
      ).rejects.toThrow('N8N_GENERIC_ERROR');

      consoleSpy.mockRestore();
    });

    test('gera message_id único para cada chamada', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { success: true, response: 'OK' },
      });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { n8nClient } = require('../n8n');

      await n8nClient.sendMessage({
        house_id: 'house-1',
        user_id: 'user-1',
        message: 'Teste 1',
      });

      await n8nClient.sendMessage({
        house_id: 'house-1',
        user_id: 'user-1',
        message: 'Teste 2',
      });

      const call1 = mockedAxios.post.mock.calls[0][1] as { context: { message_id: string } };
      const call2 = mockedAxios.post.mock.calls[1][1] as { context: { message_id: string } };

      expect(call1.context.message_id).not.toBe(call2.context.message_id);
    });
  });
});
