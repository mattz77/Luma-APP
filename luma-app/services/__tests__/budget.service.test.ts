import { budgetService } from '@/services/budget.service';
import { supabaseTest } from '@/test/supabase-test-registry';

describe('budgetService', () => {
  beforeEach(() => {
    supabaseTest.reset();
  });

  const row = {
    id: 'b1',
    house_id: 'h1',
    month: '2025-01',
    amount: '1000.00',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  test('getByMonth filtra house_id e month', async () => {
    supabaseTest.setNextResult(row, null);
    const r = await budgetService.getByMonth('h1', '2025-01');
    expect(r?.houseId).toBe('h1');
    expect(supabaseTest.lastQuery?.eqs).toEqual(
      expect.arrayContaining([
        { column: 'house_id', value: 'h1', op: 'eq' },
        { column: 'month', value: '2025-01', op: 'eq' },
      ]),
    );
  });

  test('getByMonth retorna null em PGRST116', async () => {
    supabaseTest.setNextResult(null, { code: 'PGRST116', message: 'none' });
    const r = await budgetService.getByMonth('h1', '2025-02');
    expect(r).toBeNull();
  });

  test('getAll filtra por house_id', async () => {
    supabaseTest.setNextResult([row], null);
    const list = await budgetService.getAll('h1');
    expect(list).toHaveLength(1);
    expect(supabaseTest.lastQuery?.table).toBe('monthly_budgets');
  });

  test('upsert encadeia select single', async () => {
    supabaseTest.setNextResult(row, null);
    await budgetService.upsert({ house_id: 'h1', month: 'default', amount: 500 });
    expect(supabaseTest.lastQuery?.operation).toBe('upsert');
  });

  test('remove deleta por id', async () => {
    supabaseTest.setNextResult(null, null);
    await budgetService.remove('b1');
    expect(supabaseTest.lastQuery?.operation).toBe('delete');
    expect(supabaseTest.lastQuery?.eqs.some((e) => e.column === 'id' && e.value === 'b1')).toBe(true);
  });

  describe('getDefault', () => {
    test('busca orçamento padrão com month = default', async () => {
      const defaultBudget = { ...row, month: 'default' };
      supabaseTest.setNextResult(defaultBudget, null);

      const result = await budgetService.getDefault('h1');

      expect(result?.month).toBe('default');
      expect(supabaseTest.lastQuery?.eqs).toEqual(
        expect.arrayContaining([
          { column: 'house_id', value: 'h1', op: 'eq' },
          { column: 'month', value: 'default', op: 'eq' },
        ]),
      );
    });

    test('retorna null quando não existe orçamento padrão', async () => {
      supabaseTest.setNextResult(null, null);

      const result = await budgetService.getDefault('h1');

      expect(result).toBeNull();
    });

    test('propaga erro do Supabase', async () => {
      const error = { code: 'PGRST500', message: 'Database error' };
      supabaseTest.setNextResult(null, error);

      await expect(budgetService.getDefault('h1')).rejects.toEqual(error);
    });
  });

  describe('create', () => {
    test('cria novo orçamento', async () => {
      supabaseTest.setNextResult(row, null);

      const result = await budgetService.create({
        house_id: 'h1',
        month: '2025-02',
        amount: 1500,
      });

      expect(result.houseId).toBe('h1');
      expect(result.month).toBe('2025-01');

      const insertQuery = supabaseTest.queries.find((q) => q.operation === 'insert');
      expect(insertQuery?.table).toBe('monthly_budgets');
    });

    test('propaga erro do Supabase', async () => {
      const error = { code: 'PGRST500', message: 'Insert failed' };
      supabaseTest.setNextResult(null, error);

      await expect(
        budgetService.create({ house_id: 'h1', month: '2025-02', amount: 1000 }),
      ).rejects.toEqual(error);
    });

    test('lança erro quando data é null', async () => {
      supabaseTest.setNextResult(null, null);

      await expect(
        budgetService.create({ house_id: 'h1', month: '2025-02', amount: 1000 }),
      ).rejects.toThrow('Falha ao criar orçamento');
    });
  });

  describe('update', () => {
    test('atualiza orçamento existente', async () => {
      const updatedBudget = { ...row, amount: '2000.00' };
      supabaseTest.setNextResult(updatedBudget, null);

      const result = await budgetService.update('b1', { amount: 2000 });

      expect(result.amount).toBe('2000.00');

      const updateQuery = supabaseTest.lastQuery;
      expect(updateQuery?.operation).toBe('update');
      expect(updateQuery?.eqs).toEqual(
        expect.arrayContaining([{ column: 'id', value: 'b1', op: 'eq' }]),
      );
    });

    test('propaga erro do Supabase', async () => {
      const error = { code: 'PGRST500', message: 'Update failed' };
      supabaseTest.setNextResult(null, error);

      await expect(budgetService.update('b1', { amount: 2000 })).rejects.toEqual(error);
    });

    test('lança erro quando orçamento não existe', async () => {
      supabaseTest.setNextResult(null, null);

      await expect(budgetService.update('b-inexistente', { amount: 2000 })).rejects.toThrow(
        'Falha ao atualizar orçamento',
      );
    });
  });

  describe('upsertDefault', () => {
    test('cria ou atualiza orçamento padrão', async () => {
      const defaultBudget = { ...row, month: 'default' };
      supabaseTest.setNextResult(defaultBudget, null);

      const result = await budgetService.upsertDefault('h1', 3000);

      expect(result.month).toBe('default');

      const upsertQuery = supabaseTest.lastQuery;
      expect(upsertQuery?.operation).toBe('upsert');
      expect(upsertQuery?.insertPayload).toEqual({
        house_id: 'h1',
        month: 'default',
        amount: 3000,
      });
    });
  });
});
