import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type NotificationRow = Database['public']['Tables']['notifications']['Row'];
type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];

export interface Notification {
  id: string;
  houseId: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

const mapNotification = (notification: NotificationRow): Notification => ({
  id: notification.id,
  houseId: notification.house_id,
  userId: notification.user_id,
  title: notification.title,
  body: notification.body,
  type: notification.type,
  isRead: notification.is_read,
  metadata: notification.metadata as Record<string, unknown> | null,
  createdAt: notification.created_at,
});

export const notificationService = {
  async getAll(
    userId: string,
    houseId: string,
    options?: { isRead?: boolean; limit?: number },
  ): Promise<Notification[]> {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('house_id', houseId)
      .order('created_at', { ascending: false });

    if (options?.isRead !== undefined) {
      query = query.eq('is_read', options.isRead);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return (data ?? []).map((notification) => mapNotification(notification));
  },

  async getUnreadCount(userId: string, houseId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('house_id', houseId)
      .eq('is_read', false);

    if (error) {
      throw error;
    }

    return count ?? 0;
  },

  async create(notification: NotificationInsert): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();

    if (error || !data) {
      throw error ?? new Error('Falha ao criar notificação');
    }

    return mapNotification(data);
  },

  async markAsRead(id: string, houseId: string): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('house_id', houseId)
      .select()
      .single();

    if (error || !data) {
      throw error ?? new Error('Falha ao marcar notificação como lida');
    }

    return mapNotification(data);
  },

  async markAllAsRead(userId: string, houseId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('house_id', houseId)
      .eq('is_read', false);

    if (error) {
      throw error;
    }
  },

  async remove(id: string, houseId: string): Promise<void> {
    const { error } = await supabase.from('notifications').delete().eq('id', id).eq('house_id', houseId);

    if (error) {
      throw error;
    }
  },
};

