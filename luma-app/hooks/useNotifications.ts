import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';

export const useNotifications = (userId: string | null | undefined, options?: { isRead?: boolean; limit?: number }) => {
  return useQuery({
    queryKey: ['notifications', userId, options],
    queryFn: () => {
      if (!userId) {
        return Promise.resolve([]);
      }
      return notificationService.getAll(userId, options);
    },
    enabled: Boolean(userId),
  });
};

export const useUnreadNotificationCount = (userId: string | null | undefined) => {
  return useQuery({
    queryKey: ['notifications', 'unreadCount', userId],
    queryFn: () => {
      if (!userId) {
        return Promise.resolve(0);
      }
      return notificationService.getUnreadCount(userId);
    },
    enabled: Boolean(userId),
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });
};

export const useCreateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', data.userId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount', data.userId] });
    },
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', data.userId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount', data.userId] });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount', userId] });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

