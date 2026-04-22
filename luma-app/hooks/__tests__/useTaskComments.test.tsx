import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { useTaskComments, useCreateTaskComment, useDeleteTaskComment } from '@/hooks/useTaskComments';
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

const commentRow = {
  id: 'comment-1',
  task_id: 'task-1',
  user_id: 'user-1',
  content: 'Comentário de teste',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  user: {
    id: 'user-1',
    email: 'user@example.com',
    name: 'João',
    avatar_url: null,
  },
};

describe('useTaskComments', () => {
  beforeEach(() => {
    supabaseTest.reset();
  });

  test('retorna comentários quando taskId definido', async () => {
    supabaseTest.setNextResult([commentRow], null);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTaskComments('task-1'), { wrapper: Wrapper });
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].content).toBe('Comentário de teste');
  });

  test('desabilita query sem taskId', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTaskComments(null), { wrapper: Wrapper });
    
    expect(result.current.fetchStatus).toBe('idle');
  });

  test('retorna lista vazia quando não há comentários', async () => {
    supabaseTest.setNextResult([], null);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTaskComments('task-1'), { wrapper: Wrapper });
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(0);
  });
});

describe('useCreateTaskComment', () => {
  beforeEach(() => {
    supabaseTest.reset();
  });

  test('invalida taskComments e tasks após criar', async () => {
    supabaseTest.setNextResult(commentRow, null);
    const { Wrapper, client } = createWrapper();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    
    const { result } = renderHook(() => useCreateTaskComment(), { wrapper: Wrapper });
    
    await result.current.mutateAsync({
      task_id: 'task-1',
      user_id: 'user-1',
      content: 'Novo comentário',
    });
    
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['taskComments', 'task-1'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['tasks'] });
  });
});

describe('useDeleteTaskComment', () => {
  beforeEach(() => {
    supabaseTest.reset();
  });

  test('invalida taskComments e tasks após deletar', async () => {
    supabaseTest.setNextResult(null, null);
    const { Wrapper, client } = createWrapper();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    
    const { result } = renderHook(() => useDeleteTaskComment(), { wrapper: Wrapper });
    
    await result.current.mutateAsync('comment-1');
    
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['taskComments'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['tasks'] });
  });
});
