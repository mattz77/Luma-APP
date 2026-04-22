import { expenseCategoryService } from '@/services/expense-category.service';
import { supabaseTest } from '@/test/supabase-test-registry';

const baseCategory = {
  id: 'cat-1',
  house_id: 'house-1',
  name: 'Alimentação',
  icon: '🍔',
  color: '#FF5733',
  created_at: new Date().toISOString(),
};

describe('expenseCategoryService', () => {
  beforeEach(() => {
    supabaseTest.reset();
    jest.clearAllMocks();
  });

  describe('list', () => {
    test('retorna lista de categorias filtrada por house_id', async () => {
      supabaseTest.setNextResult([baseCategory], null);
      
      const result = await expenseCategoryService.list('house-1');
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cat-1');
      expect(result[0].name).toBe('Alimentação');
      expect(result[0].icon).toBe('🍔');
      expect(result[0].color).toBe('#FF5733');
      
      const query = supabaseTest.lastQuery;
      expect(query?.table).toBe('expense_categories');
      expect(query?.operation).toBe('select');
      expect(query?.eqs).toEqual(
        expect.arrayContaining([
          { column: 'house_id', value: 'house-1', op: 'eq' },
        ]),
      );
    });

    test('retorna lista vazia quando não há categorias', async () => {
      supabaseTest.setNextResult([], null);
      
      const result = await expenseCategoryService.list('house-1');
      
      expect(result).toHaveLength(0);
    });

    test('mapeia categoria com icon e color null', async () => {
      const categoryWithNulls = { ...baseCategory, icon: null, color: null };
      supabaseTest.setNextResult([categoryWithNulls], null);
      
      const result = await expenseCategoryService.list('house-1');
      
      expect(result[0].icon).toBeNull();
      expect(result[0].color).toBeNull();
    });

    test('propaga erro do Supabase', async () => {
      const error = { code: 'PGRST500', message: 'Database error' };
      supabaseTest.setNextResult(null, error);
      
      await expect(expenseCategoryService.list('house-1')).rejects.toEqual(error);
    });
  });

  describe('create', () => {
    test('cria categoria com nome, icone e cor', async () => {
      supabaseTest.setNextResult(baseCategory, null);
      
      const result = await expenseCategoryService.create({
        houseId: 'house-1',
        name: 'Alimentação',
        icon: '🍔',
        color: '#FF5733',
      });
      
      expect(result.id).toBe('cat-1');
      expect(result.houseId).toBe('house-1');
      expect(result.name).toBe('Alimentação');
      
      const query = supabaseTest.queries.find(q => q.operation === 'insert');
      expect(query?.table).toBe('expense_categories');
      expect(query?.insertPayload).toEqual({
        house_id: 'house-1',
        name: 'Alimentação',
        icon: '🍔',
        color: '#FF5733',
      });
    });

    test('cria categoria sem icon e color (defaults para null)', async () => {
      const categoryWithNulls = { ...baseCategory, icon: null, color: null };
      supabaseTest.setNextResult(categoryWithNulls, null);
      
      const result = await expenseCategoryService.create({
        houseId: 'house-1',
        name: 'Transporte',
      });
      
      expect(result.icon).toBeNull();
      expect(result.color).toBeNull();
      
      const query = supabaseTest.queries.find(q => q.operation === 'insert');
      expect(query?.insertPayload).toEqual({
        house_id: 'house-1',
        name: 'Transporte',
        icon: null,
        color: null,
      });
    });

    test('faz trim no nome', async () => {
      supabaseTest.setNextResult(baseCategory, null);
      
      await expenseCategoryService.create({
        houseId: 'house-1',
        name: '  Alimentação  ',
      });
      
      const query = supabaseTest.queries.find(q => q.operation === 'insert');
      expect((query?.insertPayload as { name: string }).name).toBe('Alimentação');
    });

    test('lança erro quando insert falha', async () => {
      const error = { code: 'PGRST500', message: 'Insert failed' };
      supabaseTest.setNextResult(null, error);
      
      await expect(
        expenseCategoryService.create({
          houseId: 'house-1',
          name: 'Teste',
        }),
      ).rejects.toEqual(error);
    });

    test('lança erro quando data é null', async () => {
      supabaseTest.setNextResult(null, null);
      
      await expect(
        expenseCategoryService.create({
          houseId: 'house-1',
          name: 'Teste',
        }),
      ).rejects.toThrow('Não foi possível criar categoria');
    });
  });

  describe('update', () => {
    test('atualiza categoria com todos os campos', async () => {
      const updatedCategory = { ...baseCategory, name: 'Comida', icon: '🍕', color: '#00FF00' };
      supabaseTest.setNextResult(updatedCategory, null);
      
      const result = await expenseCategoryService.update('cat-1', {
        name: 'Comida',
        icon: '🍕',
        color: '#00FF00',
      });
      
      expect(result.name).toBe('Comida');
      expect(result.icon).toBe('🍕');
      expect(result.color).toBe('#00FF00');
      
      const query = supabaseTest.lastQuery;
      expect(query?.operation).toBe('update');
      expect(query?.eqs).toEqual(
        expect.arrayContaining([{ column: 'id', value: 'cat-1', op: 'eq' }]),
      );
    });

    test('faz trim no nome ao atualizar', async () => {
      supabaseTest.setNextResult(baseCategory, null);
      
      await expenseCategoryService.update('cat-1', {
        name: '  Comida Atualizada  ',
      });
      
      const query = supabaseTest.lastQuery;
      expect((query?.updatePayload as { name: string }).name).toBe('Comida Atualizada');
    });

    test('permite definir icon e color como null', async () => {
      const updatedCategory = { ...baseCategory, icon: null, color: null };
      supabaseTest.setNextResult(updatedCategory, null);
      
      await expenseCategoryService.update('cat-1', {
        icon: null,
        color: null,
      });
      
      const query = supabaseTest.lastQuery;
      expect(query?.updatePayload).toEqual({
        name: undefined,
        icon: null,
        color: null,
      });
    });

    test('lança erro quando categoria não existe', async () => {
      supabaseTest.setNextResult(null, null);
      
      await expect(
        expenseCategoryService.update('cat-inexistente', { name: 'Nova' }),
      ).rejects.toThrow('Não foi possível atualizar categoria');
    });

    test('propaga erro do Supabase', async () => {
      const error = { code: 'PGRST500', message: 'Update failed' };
      supabaseTest.setNextResult(null, error);
      
      await expect(
        expenseCategoryService.update('cat-1', { name: 'Nova' }),
      ).rejects.toEqual(error);
    });
  });

  describe('remove', () => {
    test('deleta categoria por id', async () => {
      supabaseTest.setNextResult(null, null);
      
      await expenseCategoryService.remove('cat-1');
      
      const query = supabaseTest.lastQuery;
      expect(query?.operation).toBe('delete');
      expect(query?.table).toBe('expense_categories');
      expect(query?.eqs).toEqual(
        expect.arrayContaining([{ column: 'id', value: 'cat-1', op: 'eq' }]),
      );
    });

    test('propaga erro do Supabase', async () => {
      const error = { code: 'PGRST500', message: 'Delete failed' };
      supabaseTest.setNextResult(null, error);
      
      await expect(expenseCategoryService.remove('cat-1')).rejects.toEqual(error);
    });
  });
});
