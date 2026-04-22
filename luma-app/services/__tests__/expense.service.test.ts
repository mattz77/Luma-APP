import { expenseService } from '@/services/expense.service';
import { supabaseTest } from '@/test/supabase-test-registry';

jest.mock('@/services/rag.service', () => ({
  RAGService: {
    addDocument: jest.fn(() => Promise.resolve(null)),
  },
}));

jest.mock('@/hooks/useNotifications', () => ({
  notifyNewExpense: jest.fn(() => Promise.resolve(undefined)),
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

  describe('create', () => {
    const createInput = {
      houseId: 'h1',
      categoryId: 'cat1',
      createdById: 'u1',
      amount: 100.50,
      description: 'Almoço',
      expenseDate: '2025-01-20',
      isPaid: false,
      splits: [
        { userId: 'u1', amount: 50.25, isPaid: false },
        { userId: 'u2', amount: 50.25, isPaid: false },
      ],
    };

    test('propaga erro ao inserir expense', async () => {
      const error = { code: 'PGRST500', message: 'Insert failed' };
      supabaseTest.setNextResult(null, error);

      await expect(expenseService.create(createInput)).rejects.toEqual(error);
    });

    test('propaga erro ao inserir splits', async () => {
      const splitsError = { code: 'PGRST500', message: 'Splits insert failed' };
      supabaseTest.enqueueResults(
        { data: expenseRow, error: null },
        { data: null, error: splitsError },
      );

      await expect(expenseService.create(createInput)).rejects.toEqual(splitsError);
    });

    test('lança erro quando data é null', async () => {
      supabaseTest.setNextResult(null, null);

      await expect(expenseService.create(createInput)).rejects.toThrow('Falha ao criar despesa');
    });

    test('insere na tabela expenses', async () => {
      supabaseTest.setNextResult(null, { code: 'test', message: 'Expected error for test' });
      
      try {
        await expenseService.create({ ...createInput, splits: [] });
      } catch {
        // Expected to fail
      }

      const insertQuery = supabaseTest.queries.find((q) => q.operation === 'insert');
      expect(insertQuery?.table).toBe('expenses');
      expect(insertQuery?.insertPayload).toEqual(
        expect.objectContaining({
          house_id: 'h1',
          description: 'Almoço',
        }),
      );
    });
  });

  describe('update', () => {
    const updateInput = {
      houseId: 'h1',
      categoryId: 'cat1',
      createdById: 'u1',
      amount: 200.00,
      description: 'Jantar atualizado',
      expenseDate: '2025-01-21',
      isPaid: true,
      splits: [{ userId: 'u1', amount: 200.00, isPaid: true }],
    };

    test('propaga erro do update', async () => {
      const error = { code: 'PGRST500', message: 'Update failed' };
      supabaseTest.setNextResult(null, error);

      await expect(expenseService.update('e1', updateInput)).rejects.toEqual(error);
    });

    test('lança erro quando data é null no update', async () => {
      supabaseTest.setNextResult(null, null);

      await expect(expenseService.update('e1', updateInput)).rejects.toThrow(
        'Falha ao atualizar despesa',
      );
    });

    test('faz update na tabela expenses com id correto', async () => {
      supabaseTest.setNextResult(null, { code: 'test', message: 'Expected error' });
      
      try {
        await expenseService.update('e1', updateInput);
      } catch {
        // Expected to fail
      }

      const updateQuery = supabaseTest.queries.find((q) => q.operation === 'update');
      expect(updateQuery?.table).toBe('expenses');
      expect(updateQuery?.eqs).toEqual(
        expect.arrayContaining([{ column: 'id', value: 'e1', op: 'eq' }]),
      );
    });
  });

  describe('togglePaid', () => {
    test('marca despesa como paga', async () => {
      const paidExpense = { ...expenseRow, is_paid: true, paid_at: new Date().toISOString() };
      supabaseTest.enqueueResults(
        { data: paidExpense, error: null },
        { data: paidExpense, error: null },
      );

      const result = await expenseService.togglePaid('e1', true, 'h1');

      expect(result.isPaid).toBe(true);

      const updateQuery = supabaseTest.queries.find((q) => q.operation === 'update');
      expect(updateQuery?.table).toBe('expenses');
      expect(updateQuery?.updatePayload).toEqual(
        expect.objectContaining({ is_paid: true }),
      );
      expect(updateQuery?.eqs).toEqual(
        expect.arrayContaining([
          { column: 'id', value: 'e1', op: 'eq' },
          { column: 'house_id', value: 'h1', op: 'eq' },
        ]),
      );
    });

    test('desmarca despesa como paga', async () => {
      const unpaidExpense = { ...expenseRow, is_paid: false, paid_at: null };
      supabaseTest.enqueueResults(
        { data: unpaidExpense, error: null },
        { data: unpaidExpense, error: null },
      );

      const result = await expenseService.togglePaid('e1', false, 'h1');

      expect(result.isPaid).toBe(false);

      const updateQuery = supabaseTest.queries.find((q) => q.operation === 'update');
      expect(updateQuery?.updatePayload).toEqual(
        expect.objectContaining({ is_paid: false, paid_at: null }),
      );
    });

    test('propaga erro do toggle', async () => {
      const error = { code: 'PGRST500', message: 'Toggle failed' };
      supabaseTest.setNextResult(null, error);

      await expect(expenseService.togglePaid('e1', true, 'h1')).rejects.toEqual(error);
    });

    test('lança erro quando despesa não existe', async () => {
      supabaseTest.enqueueResults(
        { data: expenseRow, error: null },
        { data: null, error: null },
      );

      await expect(expenseService.togglePaid('e1', true, 'h1')).rejects.toThrow(
        'Despesa não encontrada após atualizar pagamento',
      );
    });
  });
});
