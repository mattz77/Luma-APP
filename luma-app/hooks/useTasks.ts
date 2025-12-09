import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { taskService } from '@/services/task.service';

export const useTasks = (houseId: string | null | undefined) => {
  return useQuery({
    queryKey: ['tasks', houseId],
    queryFn: () => {
      if (!houseId) {
        return Promise.resolve([]);
      }
      return taskService.getAll(houseId);
    },
    enabled: Boolean(houseId),
  });
};

export const useTask = (taskId: string | null | undefined, houseId: string | null | undefined) => {
  return useQuery({
    queryKey: ['task', taskId, houseId],
    queryFn: () => {
      if (!taskId || !houseId) {
        return Promise.resolve(null);
      }
      return taskService.getById(taskId, houseId);
    },
    enabled: Boolean(taskId && houseId),
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskService.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', data.houseId] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Parameters<typeof taskService.update>[1];
    }) => {
      const houseScopedUpdates = updates as Parameters<typeof taskService.update>[1] & { house_id?: string };
      if (!houseScopedUpdates.house_id && !(houseScopedUpdates as { houseId?: string }).houseId) {
        throw new Error('house_id é obrigatório para atualizar tarefa');
      }
      return taskService.update(id, houseScopedUpdates);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', data.houseId] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, houseId }: { id: string; houseId: string }) => taskService.remove(id, houseId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.houseId] });
    },
  });
};

