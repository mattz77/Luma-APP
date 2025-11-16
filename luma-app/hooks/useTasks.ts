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
    }) => taskService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', data.houseId] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, houseId }: { id: string; houseId: string }) => taskService.remove(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.houseId] });
    },
  });
};

