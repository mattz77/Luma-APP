import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-native';

import { useRealtimeTasks } from '@/hooks/useRealtimeTasks';
import { supabaseTest } from '@/test/supabase-test-registry';

describe('useRealtimeTasks', () => {
  beforeEach(() => {
    supabaseTest.reset();
  });

  test('não inscreve channel sem houseId', () => {
    const client = new QueryClient();
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    renderHook(() => useRealtimeTasks(null), { wrapper: Wrapper });
    expect(supabaseTest.channelMocks.channel).not.toHaveBeenCalled();
  });

  test('inscreve postgres_changes em tasks com filtro house_id', () => {
    const client = new QueryClient();
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const onMock = jest.fn().mockReturnValue({ subscribe: jest.fn() });
    supabaseTest.channelMocks.channel.mockReturnValue({
      on: onMock,
      subscribe: jest.fn(),
    });
    renderHook(() => useRealtimeTasks('house-x'), { wrapper: Wrapper });
    expect(supabaseTest.channelMocks.channel).toHaveBeenCalledWith('tasks:house-x');
    expect(onMock).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        table: 'tasks',
        filter: 'house_id=eq.house-x',
      }),
      expect.any(Function),
    );
  });
});
