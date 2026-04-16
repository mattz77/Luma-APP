import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { useTasks, useCreateTask } from '@/hooks/useTasks';
import { supabaseTest } from '@/test/supabase-test-registry';

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { Wrapper, client };
}

const taskRow = {
  id: 't1',
  house_id: 'h1',
  created_by_id: 'u1',
  assigned_to_id: null,
  title: 'X',
  description: null,
  status: 'pending',
  priority: 'medium',
  due_date: null,
  completed_at: null,
  is_recurring: false,
  recurrence: null,
  tags: null,
  points: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  assignee: null,
  creator: null,
};

jest.mock('@/services/rag.service', () => ({
  RAGService: { addDocument: jest.fn().mockResolvedValue(null) },
}));
jest.mock('@/hooks/useNotifications', () => ({
  scheduleTaskReminder: jest.fn().mockResolvedValue(undefined),
}));

describe('useTasks', () => {
  beforeEach(() => {
    supabaseTest.reset();
  });

  test('retorna lista quando houseId definido', async () => {
    supabaseTest.setNextResult([taskRow], null);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTasks('h1'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]?.id).toBe('t1');
  });

  test('desabilita query sem houseId', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTasks(null), { wrapper: Wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });

  test('useCreateTask invalida tasks após sucesso', async () => {
    supabaseTest.setNextResult({ ...taskRow }, null);
    const { Wrapper, client } = createWrapper();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useCreateTask(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.mutateAsync).toBeDefined());
    await result.current.mutateAsync({
      house_id: 'h1',
      created_by_id: 'u1',
      title: 'Nova',
      description: null,
      status: 'pending',
      priority: 'medium',
      due_date: null,
      assigned_to_id: null,
      is_recurring: false,
      recurrence: null,
      tags: null,
      points: null,
    } as Parameters<typeof result.current.mutateAsync>[0]);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['tasks', 'h1'] });
  });
});
