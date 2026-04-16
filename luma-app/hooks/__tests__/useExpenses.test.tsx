import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { useExpenses } from '@/hooks/useExpenses';
import { supabaseTest } from '@/test/supabase-test-registry';

jest.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (s: { user: { id: string } | null }) => unknown) =>
    selector({ user: { id: 'u1' } }),
}));

jest.mock('@/hooks/useUserRole', () => ({
  useCanAccessFinances: jest.fn(() => true),
}));

jest.mock('@/services/rag.service', () => ({
  RAGService: { addDocument: jest.fn().mockResolvedValue(null) },
}));
jest.mock('@/hooks/useNotifications', () => ({
  notifyNewExpense: jest.fn().mockResolvedValue(undefined),
}));

const expenseRow = {
  id: 'e1',
  house_id: 'h1',
  category_id: null,
  created_by_id: 'u1',
  amount: '5.00',
  description: 'X',
  expense_date: '2025-01-01',
  receipt_url: null,
  is_recurring: false,
  recurrence_period: null,
  is_paid: false,
  paid_at: null,
  notes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  category: null,
  splits: [],
  created_by: null,
};

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { Wrapper };
}

describe('useExpenses', () => {
  beforeEach(() => {
    supabaseTest.reset();
  });

  test('carrega despesas quando pode acessar finanças', async () => {
    supabaseTest.setNextResult([expenseRow], null);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useExpenses('h1'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]?.description).toBe('X');
  });
});
