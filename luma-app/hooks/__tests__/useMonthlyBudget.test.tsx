import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import {
  useMonthlyBudget,
  useBudgetLimit,
  useMonthlyBudgets,
  useUpsertMonthlyBudget,
  useUpsertBudgetLimit,
} from '@/hooks/useMonthlyBudget';
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

const budgetRow = {
  id: 'b1',
  house_id: 'h1',
  month: '2025-01',
  amount: '1500.00',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('useMonthlyBudget', () => {
  beforeEach(() => {
    supabaseTest.reset();
  });

  test('retorna orçamento quando houseId e month definidos', async () => {
    supabaseTest.setNextResult(budgetRow, null);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useMonthlyBudget('h1', '2025-01'), { wrapper: Wrapper });
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.month).toBe('2025-01');
  });

  test('retorna null quando houseId não definido', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useMonthlyBudget(null, '2025-01'), { wrapper: Wrapper });
    
    expect(result.current.fetchStatus).toBe('idle');
  });

  test('desabilita query sem month', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useMonthlyBudget('h1', ''), { wrapper: Wrapper });
    
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useBudgetLimit', () => {
  beforeEach(() => {
    supabaseTest.reset();
  });

  test('retorna limite padrão quando houseId definido', async () => {
    supabaseTest.setNextResult({ ...budgetRow, month: 'default' }, null);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useBudgetLimit('h1'), { wrapper: Wrapper });
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.month).toBe('default');
  });

  test('retorna null quando houseId não definido', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useBudgetLimit(null), { wrapper: Wrapper });
    
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useMonthlyBudgets', () => {
  beforeEach(() => {
    supabaseTest.reset();
  });

  test('retorna lista de orçamentos quando houseId definido', async () => {
    supabaseTest.setNextResult([budgetRow], null);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useMonthlyBudgets('h1'), { wrapper: Wrapper });
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });

  test('retorna lista vazia quando houseId não definido', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useMonthlyBudgets(null), { wrapper: Wrapper });
    
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useUpsertMonthlyBudget', () => {
  beforeEach(() => {
    supabaseTest.reset();
  });

  test('invalida queries após sucesso', async () => {
    supabaseTest.setNextResult(budgetRow, null);
    const { Wrapper, client } = createWrapper();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    
    const { result } = renderHook(() => useUpsertMonthlyBudget(), { wrapper: Wrapper });
    
    await result.current.mutateAsync({
      house_id: 'h1',
      month: '2025-01',
      amount: 2000,
    });
    
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['monthlyBudget', 'h1', '2025-01'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['monthlyBudgets', 'h1'] });
  });
});

describe('useUpsertBudgetLimit', () => {
  beforeEach(() => {
    supabaseTest.reset();
  });

  test('invalida budgetLimit após sucesso', async () => {
    supabaseTest.setNextResult({ ...budgetRow, month: 'default' }, null);
    const { Wrapper, client } = createWrapper();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    
    const { result } = renderHook(() => useUpsertBudgetLimit(), { wrapper: Wrapper });
    
    await result.current.mutateAsync({ houseId: 'h1', amount: 3000 });
    
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['budgetLimit', 'h1'] });
  });
});
