import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';

export const useNotifications = (
  userId: string | null | undefined,
  houseId: string | null | undefined,
  options?: { isRead?: boolean; limit?: number },
) => {
  return useQuery({
    queryKey: ['notifications', userId, houseId, options],
    queryFn: () => {
      if (!userId || !houseId) {
        return Promise.resolve([]);
      }
      return notificationService.getAll(userId, houseId, options);
    },
    enabled: Boolean(userId && houseId),
  });
};

export const useUnreadNotificationCount = (
  userId: string | null | undefined,
  houseId: string | null | undefined,
) => {
  return useQuery({
    queryKey: ['notifications', 'unreadCount', userId, houseId],
    queryFn: () => {
      if (!userId || !houseId) {
        return Promise.resolve(0);
      }
      return notificationService.getUnreadCount(userId, houseId);
    },
    enabled: Boolean(userId && houseId),
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });
};

export const useCreateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', data.userId, data.houseId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount', data.userId, data.houseId] });
    },
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, houseId }: { id: string; houseId: string }) => notificationService.markAsRead(id, houseId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', data.userId, variables.houseId] });
      queryClient.invalidateQueries({
        queryKey: ['notifications', 'unreadCount', data.userId, variables.houseId],
      });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, houseId }: { userId: string; houseId: string }) =>
      notificationService.markAllAsRead(userId, houseId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', variables.userId, variables.houseId] });
      queryClient.invalidateQueries({
        queryKey: ['notifications', 'unreadCount', variables.userId, variables.houseId],
      });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, houseId }: { id: string; houseId: string }) => notificationService.remove(id, houseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

