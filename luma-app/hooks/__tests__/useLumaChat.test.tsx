import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react-native';

import { useLumaChat } from '@/hooks/useLumaChat';
import { RAGService } from '@/services/rag.service';
import { n8nClient } from '@/lib/n8n';

jest.mock('@/lib/n8n', () => ({
  n8nClient: {
    sendMessage: jest.fn(),
  },
}));

jest.mock('@/services/rag.service', () => ({
  RAGService: {
    hybridSearch: jest.fn(),
    addDocument: jest.fn().mockResolvedValue(null),
  },
}));

function wrapperFactory() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { Wrapper };
}

describe('useLumaChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (RAGService.hybridSearch as jest.Mock).mockResolvedValue([]);
    (n8nClient.sendMessage as jest.Mock).mockResolvedValue({
      success: true,
      response: 'Resposta',
    });
  });

  test('envia mensagem com house_id e user_id', async () => {
    const { Wrapper } = wrapperFactory();
    const { result } = renderHook(() => useLumaChat('h1', 'u1'), { wrapper: Wrapper });
    await act(async () => {
      await result.current.mutateAsync('Olá Luma');
    });
    expect(RAGService.hybridSearch).toHaveBeenCalledWith(
      expect.objectContaining({ house_id: 'h1', query: 'Olá Luma' }),
    );
    expect(n8nClient.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        house_id: 'h1',
        user_id: 'u1',
        message: 'Olá Luma',
      }),
    );
  });

  test('falha sem houseId', async () => {
    const { Wrapper } = wrapperFactory();
    const { result } = renderHook(() => useLumaChat(null, 'u1'), { wrapper: Wrapper });
    await expect(result.current.mutateAsync('x')).rejects.toThrow(/houseId/);
  });
});
