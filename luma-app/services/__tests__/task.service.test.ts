import { taskService } from '@/services/task.service';
import { supabaseTest } from '@/test/supabase-test-registry';

jest.mock('@/services/rag.service', () => ({
  RAGService: {
    addDocument: jest.fn().mockResolvedValue(null),
  },
}));

jest.mock('@/hooks/useNotifications', () => ({
  scheduleTaskReminder: jest.fn().mockResolvedValue(undefined),
}));

const baseRow = {
  id: 'task-1',
  house_id: 'house-1',
  created_by_id: 'user-1',
  assigned_to_id: null,
  title: 'Teste',
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

describe('taskService', () => {
  beforeEach(() => {
    supabaseTest.reset();
    jest.clearAllMocks();
  });

  test('getById aplica eq id e house_id', async () => {
    supabaseTest.setNextResult({ ...baseRow }, null);
    await taskService.getById('task-1', 'house-1');
    const q = supabaseTest.lastQuery;
    expect(q?.table).toBe('tasks');
    expect(q?.eqs).toEqual(
      expect.arrayContaining([
        { column: 'id', value: 'task-1', op: 'eq' },
        { column: 'house_id', value: 'house-1', op: 'eq' },
      ]),
    );
  });

  test('getById retorna null em PGRST116', async () => {
    supabaseTest.setNextResult(null, { code: 'PGRST116', message: 'no rows' });
    const result = await taskService.getById('x', 'house-1');
    expect(result).toBeNull();
  });

  test('getAll filtra por house_id', async () => {
    supabaseTest.setNextResult([{ ...baseRow }], null);
    const list = await taskService.getAll('house-1');
    expect(list).toHaveLength(1);
    expect(supabaseTest.lastQuery?.eqs.some((e) => e.column === 'house_id' && e.value === 'house-1')).toBe(
      true,
    );
  });

  test('create insere e retorna tarefa', async () => {
    supabaseTest.setNextResult({ ...baseRow }, null);
    const created = await taskService.create({
      house_id: 'house-1',
      created_by_id: 'user-1',
      title: 'Teste',
      description: null,
      status: 'pending',
      priority: 'medium',
      due_date: null,
      assigned_to_id: null,
      is_recurring: false,
      recurrence: null,
      tags: null,
      points: null,
    } as Parameters<typeof taskService.create>[0]);
    expect(created.id).toBe('task-1');
    expect(supabaseTest.queries.some((q) => q.operation === 'insert' && q.table === 'tasks')).toBe(true);
  });

  test('update aplica house_id quando informado', async () => {
    supabaseTest.setNextResult({ ...baseRow, title: 'Atualizado' }, null);
    await taskService.update('task-1', { title: 'Atualizado', house_id: 'house-1' });
    const q = supabaseTest.lastQuery;
    expect(q?.operation).toBe('update');
    expect(q?.eqs).toEqual(
      expect.arrayContaining([
        { column: 'id', value: 'task-1', op: 'eq' },
        { column: 'house_id', value: 'house-1', op: 'eq' },
      ]),
    );
  });

  test('remove aplica id e house_id', async () => {
    supabaseTest.setNextResult(null, null);
    await taskService.remove('task-1', 'house-1');
    const q = supabaseTest.lastQuery;
    expect(q?.operation).toBe('delete');
    expect(q?.eqs).toEqual(
      expect.arrayContaining([
        { column: 'id', value: 'task-1', op: 'eq' },
        { column: 'house_id', value: 'house-1', op: 'eq' },
      ]),
    );
  });
});
