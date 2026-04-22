import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-native';

import { useRealtimeConversations } from '@/hooks/useRealtimeConversations';
import { supabaseTest } from '@/test/supabase-test-registry';

describe('useRealtimeConversations', () => {
  beforeEach(() => {
    supabaseTest.reset();
  });

  test('não inscreve channel sem houseId', () => {
    const client = new QueryClient();
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    renderHook(() => useRealtimeConversations(undefined), { wrapper: Wrapper });

    expect(supabaseTest.channelMocks.channel).not.toHaveBeenCalled();
  });

  test('inscreve postgres_changes em conversations com filtro house_id', () => {
    const client = new QueryClient();
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const subscribeMock = jest.fn().mockReturnValue({ unsubscribe: jest.fn() });
    const onMock = jest.fn().mockReturnValue({ subscribe: subscribeMock });

    supabaseTest.channelMocks.channel.mockReturnValue({
      on: onMock,
      subscribe: jest.fn(),
    });

    renderHook(() => useRealtimeConversations('house-conv'), { wrapper: Wrapper });

    expect(supabaseTest.channelMocks.channel).toHaveBeenCalledWith('conversations:house-conv');
    expect(onMock).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        table: 'conversations',
        filter: 'house_id=eq.house-conv',
      }),
      expect.any(Function),
    );
    expect(subscribeMock).toHaveBeenCalled();
  });

  test('invalida query conversations ao receber evento realtime', () => {
    const client = new QueryClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    let callback: ((payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE' }) => void) | undefined;
    const onMock = jest.fn().mockImplementation((_event, _opts, cb) => {
      callback = cb;
      return { subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }) };
    });

    supabaseTest.channelMocks.channel.mockReturnValue({
      on: onMock,
      subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
    });

    renderHook(() => useRealtimeConversations('house-conv'), { wrapper: Wrapper });

    callback?.({ eventType: 'INSERT' });
    callback?.({ eventType: 'UPDATE' });
    callback?.({ eventType: 'DELETE' });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['conversations', 'house-conv'] });
    expect(invalidateSpy).toHaveBeenCalledTimes(3);
  });

  test('remove channel no cleanup', () => {
    const client = new QueryClient();
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const channelRef = { unsubscribe: jest.fn() };
    const onMock = jest.fn().mockReturnValue({
      subscribe: jest.fn().mockReturnValue(channelRef),
    });

    supabaseTest.channelMocks.channel.mockReturnValue({
      on: onMock,
      subscribe: jest.fn().mockReturnValue(channelRef),
    });

    const { unmount } = renderHook(() => useRealtimeConversations('house-conv'), { wrapper: Wrapper });
    unmount();

    expect(supabaseTest.channelMocks.removeChannel).toHaveBeenCalledWith(channelRef);
  });
});
