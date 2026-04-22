import { taskCommentService } from '@/services/taskComment.service';
import { supabaseTest } from '@/test/supabase-test-registry';

const baseUser = {
  id: 'user-1',
  name: 'João Silva',
  email: 'joao@example.com',
  avatar_url: 'https://example.com/avatar.jpg',
};

const baseComment = {
  id: 'comment-1',
  task_id: 'task-1',
  user_id: 'user-1',
  content: 'Comentário de teste',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  user: baseUser,
};

describe('taskCommentService', () => {
  beforeEach(() => {
    supabaseTest.reset();
    jest.clearAllMocks();
  });

  describe('getByTask', () => {
    test('retorna lista de comentários filtrada por task_id', async () => {
      supabaseTest.setNextResult([baseComment], null);
      
      const result = await taskCommentService.getByTask('task-1');
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('comment-1');
      expect(result[0].taskId).toBe('task-1');
      expect(result[0].content).toBe('Comentário de teste');
      expect(result[0].user?.name).toBe('João Silva');
      
      const query = supabaseTest.lastQuery;
      expect(query?.table).toBe('task_comments');
      expect(query?.operation).toBe('select');
      expect(query?.eqs).toEqual(
        expect.arrayContaining([
          { column: 'task_id', value: 'task-1', op: 'eq' },
        ]),
      );
    });

    test('retorna lista vazia quando tarefa não tem comentários', async () => {
      supabaseTest.setNextResult([], null);
      
      const result = await taskCommentService.getByTask('task-1');
      
      expect(result).toHaveLength(0);
    });

    test('mapeia comentário com user null', async () => {
      const commentWithoutUser = { ...baseComment, user: null };
      supabaseTest.setNextResult([commentWithoutUser], null);
      
      const result = await taskCommentService.getByTask('task-1');
      
      expect(result[0].user).toBeNull();
    });

    test('propaga erro do Supabase', async () => {
      const error = { code: 'PGRST500', message: 'Database error' };
      supabaseTest.setNextResult(null, error);
      
      await expect(taskCommentService.getByTask('task-1')).rejects.toEqual(error);
    });
  });

  describe('create', () => {
    test('cria comentário com user_id e task_id', async () => {
      supabaseTest.setNextResult(baseComment, null);
      
      const result = await taskCommentService.create({
        task_id: 'task-1',
        user_id: 'user-1',
        content: 'Novo comentário',
      });
      
      expect(result.id).toBe('comment-1');
      expect(result.taskId).toBe('task-1');
      expect(result.userId).toBe('user-1');
      expect(result.user?.name).toBe('João Silva');
      
      const query = supabaseTest.queries.find(q => q.operation === 'insert');
      expect(query?.table).toBe('task_comments');
    });

    test('lança erro quando insert falha', async () => {
      const error = { code: 'PGRST500', message: 'Insert failed' };
      supabaseTest.setNextResult(null, error);
      
      await expect(
        taskCommentService.create({
          task_id: 'task-1',
          user_id: 'user-1',
          content: 'Comentário',
        }),
      ).rejects.toEqual(error);
    });

    test('lança erro quando data é null', async () => {
      supabaseTest.setNextResult(null, null);
      
      await expect(
        taskCommentService.create({
          task_id: 'task-1',
          user_id: 'user-1',
          content: 'Comentário',
        }),
      ).rejects.toThrow('Falha ao criar comentário');
    });

    test('lança erro quando task_id é de tarefa inexistente (FK violation)', async () => {
      const error = { 
        code: '23503', 
        message: 'insert or update on table "task_comments" violates foreign key constraint' 
      };
      supabaseTest.setNextResult(null, error);
      
      await expect(
        taskCommentService.create({
          task_id: 'task-inexistente',
          user_id: 'user-1',
          content: 'Comentário',
        }),
      ).rejects.toEqual(error);
    });
  });

  describe('remove', () => {
    test('deleta comentário por id', async () => {
      supabaseTest.setNextResult(null, null);
      
      await taskCommentService.remove('comment-1');
      
      const query = supabaseTest.lastQuery;
      expect(query?.operation).toBe('delete');
      expect(query?.table).toBe('task_comments');
      expect(query?.eqs).toEqual(
        expect.arrayContaining([{ column: 'id', value: 'comment-1', op: 'eq' }]),
      );
    });

    test('propaga erro do Supabase', async () => {
      const error = { code: 'PGRST500', message: 'Delete failed' };
      supabaseTest.setNextResult(null, error);
      
      await expect(taskCommentService.remove('comment-1')).rejects.toEqual(error);
    });

    test('não lança erro ao tentar deletar comentário inexistente', async () => {
      supabaseTest.setNextResult(null, null);
      
      await expect(taskCommentService.remove('comment-inexistente')).resolves.not.toThrow();
    });
  });
});
