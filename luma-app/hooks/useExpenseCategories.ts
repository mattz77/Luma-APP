import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { expenseCategoryService } from '@/services/expense-category.service';

export const useExpenseCategories = (houseId: string | null | undefined) =>
  useQuery({
    queryKey: ['expense-categories', houseId],
    enabled: Boolean(houseId),
    queryFn: () => {
      if (!houseId) {
        return Promise.resolve([]);
      }
      return expenseCategoryService.list(houseId);
    },
    staleTime: 1000 * 60,
  });

export const useCreateExpenseCategory = (houseId: string | null | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => {
      if (!houseId) {
        throw new Error('Casa não definida');
      }
      return expenseCategoryService.create({ houseId, name });
    },
    onSuccess: () => {
      if (houseId) {
        queryClient.invalidateQueries({ queryKey: ['expense-categories', houseId] });
      }
    },
  });
};

export const useUpdateExpenseCategory = (houseId: string | null | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      expenseCategoryService.update(id, { name }),
    onSuccess: () => {
      if (houseId) {
        queryClient.invalidateQueries({ queryKey: ['expense-categories', houseId] });
      }
    },
  });
};

export const useDeleteExpenseCategory = (houseId: string | null | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => expenseCategoryService.remove(id),
    onSuccess: () => {
      if (houseId) {
        queryClient.invalidateQueries({ queryKey: ['expense-categories', houseId] });
        queryClient.invalidateQueries({ queryKey: ['expenses', houseId] });
      }
    },
  });
};

