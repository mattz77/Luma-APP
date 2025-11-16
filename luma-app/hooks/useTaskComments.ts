import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { taskCommentService } from '@/services/taskComment.service';

export const useTaskComments = (taskId: string | null | undefined) => {
  return useQuery({
    queryKey: ['taskComments', taskId],
    queryFn: () => {
      if (!taskId) {
        return Promise.resolve([]);
      }
      return taskCommentService.getByTask(taskId);
    },
    enabled: Boolean(taskId),
  });
};

export const useCreateTaskComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskCommentService.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['taskComments', data.taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useDeleteTaskComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskCommentService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskComments'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

