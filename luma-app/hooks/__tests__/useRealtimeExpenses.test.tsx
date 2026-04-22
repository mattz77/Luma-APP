import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-native';

import { useRealtimeExpenses } from '@/hooks/useRealtimeExpenses';
import { supabaseTest } from '@/test/supabase-test-registry';

describe('useRealtimeExpenses', () => {
  beforeEach(() => {
    supabaseTest.reset();
  });

  test('não inscreve channel sem houseId', () => {
    const client = new QueryClient();
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    renderHook(() => useRealtimeExpenses(null), { wrapper: Wrapper });

    expect(supabaseTest.channelMocks.channel).not.toHaveBeenCalled();
  });

  test('inscreve postgres_changes em expenses com filtro house_id', () => {
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

    renderHook(() => useRealtimeExpenses('house-exp'), { wrapper: Wrapper });

    expect(supabaseTest.channelMocks.channel).toHaveBeenCalledWith('expenses:house-exp');
    expect(onMock).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        table: 'expenses',
        filter: 'house_id=eq.house-exp',
      }),
      expect.any(Function),
    );
    expect(subscribeMock).toHaveBeenCalled();
  });

  test('invalida query expenses ao receber evento realtime', () => {
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

    renderHook(() => useRealtimeExpenses('house-exp'), { wrapper: Wrapper });

    callback?.({ eventType: 'INSERT' });
    callback?.({ eventType: 'UPDATE' });
    callback?.({ eventType: 'DELETE' });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['expenses', 'house-exp'] });
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

    const { unmount } = renderHook(() => useRealtimeExpenses('house-exp'), { wrapper: Wrapper });
    unmount();

    expect(supabaseTest.channelMocks.removeChannel).toHaveBeenCalledWith(channelRef);
  });
});
