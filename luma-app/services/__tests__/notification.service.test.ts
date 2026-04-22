import { notificationService } from '@/services/notification.service';
import { supabaseTest } from '@/test/supabase-test-registry';

const baseNotification = {
  id: 'notif-1',
  house_id: 'house-1',
  user_id: 'user-1',
  title: 'Teste',
  body: 'Corpo da notificação',
  type: 'task_reminder',
  is_read: false,
  metadata: null,
  created_at: new Date().toISOString(),
};

describe('notificationService', () => {
  beforeEach(() => {
    supabaseTest.reset();
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    test('retorna lista de notificações filtrada por user_id e house_id', async () => {
      supabaseTest.setNextResult([baseNotification], null);
      
      const result = await notificationService.getAll('user-1', 'house-1');
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('notif-1');
      expect(result[0].title).toBe('Teste');
      expect(result[0].isRead).toBe(false);
      
      const query = supabaseTest.lastQuery;
      expect(query?.table).toBe('notifications');
      expect(query?.operation).toBe('select');
      expect(query?.eqs).toEqual(
        expect.arrayContaining([
          { column: 'user_id', value: 'user-1', op: 'eq' },
          { column: 'house_id', value: 'house-1', op: 'eq' },
        ]),
      );
    });

    test('filtra por isRead quando informado', async () => {
      supabaseTest.setNextResult([], null);
      
      await notificationService.getAll('user-1', 'house-1', { isRead: false });
      
      const query = supabaseTest.lastQuery;
      expect(query?.eqs).toEqual(
        expect.arrayContaining([
          { column: 'is_read', value: false, op: 'eq' },
        ]),
      );
    });

    test('retorna lista vazia quando não há notificações', async () => {
      supabaseTest.setNextResult([], null);
      
      const result = await notificationService.getAll('user-1', 'house-1');
      
      expect(result).toHaveLength(0);
    });

    test('propaga erro do Supabase', async () => {
      const error = { code: 'PGRST500', message: 'Database error' };
      supabaseTest.setNextResult(null, error);
      
      await expect(notificationService.getAll('user-1', 'house-1')).rejects.toEqual(error);
    });
  });

  describe('getUnreadCount', () => {
    test('retorna contagem de notificações não lidas', async () => {
      supabaseTest.setNextResult(null, null, 5);
      
      const result = await notificationService.getUnreadCount('user-1', 'house-1');
      
      expect(result).toBe(5);
      
      const query = supabaseTest.lastQuery;
      expect(query?.table).toBe('notifications');
      expect(query?.eqs).toEqual(
        expect.arrayContaining([
          { column: 'user_id', value: 'user-1', op: 'eq' },
          { column: 'house_id', value: 'house-1', op: 'eq' },
          { column: 'is_read', value: false, op: 'eq' },
        ]),
      );
    });

    test('retorna 0 quando não há notificações não lidas', async () => {
      supabaseTest.setNextResult(null, null, 0);
      
      const result = await notificationService.getUnreadCount('user-1', 'house-1');
      
      expect(result).toBe(0);
    });

    test('propaga erro do Supabase', async () => {
      const error = { code: 'PGRST500', message: 'Database error' };
      supabaseTest.setNextResult(null, error);
      
      await expect(notificationService.getUnreadCount('user-1', 'house-1')).rejects.toEqual(error);
    });
  });

  describe('create', () => {
    test('cria notificação com payload completo', async () => {
      const createdNotification = { ...baseNotification };
      supabaseTest.setNextResult(createdNotification, null);
      
      const result = await notificationService.create({
        house_id: 'house-1',
        user_id: 'user-1',
        title: 'Teste',
        body: 'Corpo da notificação',
        type: 'task_reminder',
      });
      
      expect(result.id).toBe('notif-1');
      expect(result.houseId).toBe('house-1');
      expect(result.userId).toBe('user-1');
      
      const query = supabaseTest.queries.find(q => q.operation === 'insert');
      expect(query?.table).toBe('notifications');
    });

    test('lança erro quando insert falha', async () => {
      const error = { code: 'PGRST500', message: 'Insert failed' };
      supabaseTest.setNextResult(null, error);
      
      await expect(
        notificationService.create({
          house_id: 'house-1',
          user_id: 'user-1',
          title: 'Teste',
          body: 'Corpo',
          type: 'info',
        }),
      ).rejects.toEqual(error);
    });

    test('lança erro quando data é null', async () => {
      supabaseTest.setNextResult(null, null);
      
      await expect(
        notificationService.create({
          house_id: 'house-1',
          user_id: 'user-1',
          title: 'Teste',
          body: 'Corpo',
          type: 'info',
        }),
      ).rejects.toThrow('Falha ao criar notificação');
    });
  });

  describe('markAsRead', () => {
    test('marca notificação como lida', async () => {
      const updatedNotification = { ...baseNotification, is_read: true };
      supabaseTest.setNextResult(updatedNotification, null);
      
      const result = await notificationService.markAsRead('notif-1', 'house-1');
      
      expect(result.isRead).toBe(true);
      
      const query = supabaseTest.lastQuery;
      expect(query?.operation).toBe('update');
      expect(query?.updatePayload).toEqual({ is_read: true });
      expect(query?.eqs).toEqual(
        expect.arrayContaining([
          { column: 'id', value: 'notif-1', op: 'eq' },
          { column: 'house_id', value: 'house-1', op: 'eq' },
        ]),
      );
    });

    test('lança erro quando notificação não existe', async () => {
      supabaseTest.setNextResult(null, null);
      
      await expect(
        notificationService.markAsRead('notif-inexistente', 'house-1'),
      ).rejects.toThrow('Falha ao marcar notificação como lida');
    });
  });

  describe('markAllAsRead', () => {
    test('marca todas as notificações não lidas como lidas', async () => {
      supabaseTest.setNextResult(null, null);
      
      await notificationService.markAllAsRead('user-1', 'house-1');
      
      const query = supabaseTest.lastQuery;
      expect(query?.operation).toBe('update');
      expect(query?.updatePayload).toEqual({ is_read: true });
      expect(query?.eqs).toEqual(
        expect.arrayContaining([
          { column: 'user_id', value: 'user-1', op: 'eq' },
          { column: 'house_id', value: 'house-1', op: 'eq' },
          { column: 'is_read', value: false, op: 'eq' },
        ]),
      );
    });

    test('propaga erro do Supabase', async () => {
      const error = { code: 'PGRST500', message: 'Update failed' };
      supabaseTest.setNextResult(null, error);
      
      await expect(notificationService.markAllAsRead('user-1', 'house-1')).rejects.toEqual(error);
    });
  });

  describe('remove', () => {
    test('deleta notificação por id e house_id', async () => {
      supabaseTest.setNextResult(null, null);
      
      await notificationService.remove('notif-1', 'house-1');
      
      const query = supabaseTest.lastQuery;
      expect(query?.operation).toBe('delete');
      expect(query?.table).toBe('notifications');
      expect(query?.eqs).toEqual(
        expect.arrayContaining([
          { column: 'id', value: 'notif-1', op: 'eq' },
          { column: 'house_id', value: 'house-1', op: 'eq' },
        ]),
      );
    });

    test('propaga erro do Supabase', async () => {
      const error = { code: 'PGRST500', message: 'Delete failed' };
      supabaseTest.setNextResult(null, error);
      
      await expect(notificationService.remove('notif-1', 'house-1')).rejects.toEqual(error);
    });
  });
});
