import { expenseService } from '@/services/expense.service';
import { supabaseTest } from '@/test/supabase-test-registry';

jest.mock('@/services/rag.service', () => ({
  RAGService: {
    addDocument: jest.fn().mockResolvedValue(null),
  },
}));

jest.mock('@/hooks/useNotifications', () => ({
  notifyNewExpense: jest.fn().mockResolvedValue(undefined),
}));

const expenseRow = {
  id: 'e1',
  house_id: 'h1',
  category_id: 'cat1',
  created_by_id: 'u1',
  amount: '10.00',
  description: 'Lanche',
  expense_date: '2025-01-15',
  receipt_url: null,
  is_recurring: false,
  recurrence_period: null,
  is_paid: true,
  paid_at: new Date().toISOString(),
  notes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  category: null,
  splits: [],
  created_by: null,
};

describe('expenseService', () => {
  beforeEach(() => {
    supabaseTest.reset();
    jest.clearAllMocks();
  });

  test('getById usa maybeSingle com id e house_id', async () => {
    supabaseTest.setNextResult(expenseRow, null);
    const e = await expenseService.getById('e1', 'h1');
    expect(e?.id).toBe('e1');
    expect(supabaseTest.lastQuery?.table).toBe('expenses');
    expect(supabaseTest.lastQuery?.eqs).toEqual(
      expect.arrayContaining([
        { column: 'id', value: 'e1', op: 'eq' },
        { column: 'house_id', value: 'h1', op: 'eq' },
      ]),
    );
  });

  test('getAll filtra house_id', async () => {
    supabaseTest.setNextResult([expenseRow], null);
    const list = await expenseService.getAll('h1');
    expect(list).toHaveLength(1);
    expect(supabaseTest.lastQuery?.eqs.some((x) => x.column === 'house_id' && x.value === 'h1')).toBe(true);
  });

  test('remove deleta expense e splits', async () => {
    supabaseTest.enqueueResults({ data: null, error: null }, { data: null, error: null });
    await expenseService.remove('e1', 'h1');
    const deletes = supabaseTest.queries.filter((q) => q.operation === 'delete');
    expect(deletes.length).toBeGreaterThanOrEqual(1);
    expect(deletes[0].eqs).toEqual(
      expect.arrayContaining([
        { column: 'id', value: 'e1', op: 'eq' },
        { column: 'house_id', value: 'h1', op: 'eq' },
      ]),
    );
  });
});
