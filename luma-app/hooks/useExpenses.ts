import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { expenseService, type SaveExpenseInput } from '@/services/expense.service';
import { useCanAccessFinances } from './useUserRole';
import { useAuthStore } from '@/stores/auth.store';

export const useExpenses = (houseId: string | null | undefined) => {
  const userId = useAuthStore((state) => state.user?.id);
  const canAccess = useCanAccessFinances(houseId, userId);

  return useQuery({
    queryKey: ['expenses', houseId],
    queryFn: () => {
      if (!houseId) {
        return Promise.resolve([]);
      }
      return expenseService.getAll(houseId);
    },
    enabled: Boolean(houseId && canAccess),
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveExpenseInput) => expenseService.create(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', variables.houseId] });
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SaveExpenseInput }) =>
      expenseService.update(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', data.houseId] });
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, houseId }: { id: string; houseId: string }) => expenseService.remove(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', variables.houseId] });
    },
  });
};

export const useToggleExpensePaid = (houseId: string | null | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isPaid }: { id: string; isPaid: boolean }) =>
      expenseService.togglePaid(id, isPaid),
    onSuccess: () => {
      if (houseId) {
        queryClient.invalidateQueries({ queryKey: ['expenses', houseId] });
      }
    },
  });
};

