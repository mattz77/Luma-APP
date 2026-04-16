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
});
