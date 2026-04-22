import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import {
  useExpenseCategories,
  useCreateExpenseCategory,
  useUpdateExpenseCategory,
  useDeleteExpenseCategory,
} from '@/hooks/useExpenseCategories';
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

const categoryRow = {
  id: 'cat-1',
  house_id: 'h1',
  name: 'Alimentação',
  icon: '🍔',
  color: '#FF5733',
  created_at: new Date().toISOString(),
};

describe('useExpenseCategories', () => {
  beforeEach(() => {
    supabaseTest.reset();
  });

  test('retorna categorias quando houseId definido', async () => {
    supabaseTest.setNextResult([categoryRow], null);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useExpenseCategories('h1'), { wrapper: Wrapper });
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].name).toBe('Alimentação');
  });

  test('desabilita query sem houseId', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useExpenseCategories(null), { wrapper: Wrapper });
    
    expect(result.current.fetchStatus).toBe('idle');
  });

  test('retorna lista vazia quando não há categorias', async () => {
    supabaseTest.setNextResult([], null);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useExpenseCategories('h1'), { wrapper: Wrapper });
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(0);
  });
});

describe('useCreateExpenseCategory', () => {
  beforeEach(() => {
    supabaseTest.reset();
  });

  test('invalida expense-categories após criar', async () => {
    supabaseTest.setNextResult(categoryRow, null);
    const { Wrapper, client } = createWrapper();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    
    const { result } = renderHook(() => useCreateExpenseCategory('h1'), { wrapper: Wrapper });
    
    await result.current.mutateAsync('Nova Categoria');
    
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['expense-categories', 'h1'] });
  });

  test('lança erro quando houseId não definido', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateExpenseCategory(null), { wrapper: Wrapper });
    
    await expect(result.current.mutateAsync('Categoria')).rejects.toThrow('Casa não definida');
  });
});

describe('useUpdateExpenseCategory', () => {
  beforeEach(() => {
    supabaseTest.reset();
  });

  test('invalida expense-categories após atualizar', async () => {
    supabaseTest.setNextResult({ ...categoryRow, name: 'Atualizado' }, null);
    const { Wrapper, client } = createWrapper();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    
    const { result } = renderHook(() => useUpdateExpenseCategory('h1'), { wrapper: Wrapper });
    
    await result.current.mutateAsync({ id: 'cat-1', name: 'Atualizado' });
    
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['expense-categories', 'h1'] });
  });
});

describe('useDeleteExpenseCategory', () => {
  beforeEach(() => {
    supabaseTest.reset();
  });

  test('invalida expense-categories e expenses após deletar', async () => {
    supabaseTest.setNextResult(null, null);
    const { Wrapper, client } = createWrapper();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    
    const { result } = renderHook(() => useDeleteExpenseCategory('h1'), { wrapper: Wrapper });
    
    await result.current.mutateAsync('cat-1');
    
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['expense-categories', 'h1'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['expenses', 'h1'] });
  });
});
