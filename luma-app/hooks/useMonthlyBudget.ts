import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { budgetService } from '@/services/budget.service';

export const useMonthlyBudget = (houseId: string | null | undefined, month: string) => {
  return useQuery({
    queryKey: ['monthlyBudget', houseId, month],
    queryFn: () => {
      if (!houseId) {
        return Promise.resolve(null);
      }
      return budgetService.getByMonth(houseId, month);
    },
    enabled: Boolean(houseId && month),
  });
};

export const useBudgetLimit = (houseId: string | null | undefined) => {
  return useQuery({
    queryKey: ['budgetLimit', houseId],
    queryFn: () => {
      if (!houseId) {
        return Promise.resolve(null);
      }
      return budgetService.getDefault(houseId);
    },
    enabled: Boolean(houseId),
  });
};

export const useMonthlyBudgets = (houseId: string | null | undefined) => {
  return useQuery({
    queryKey: ['monthlyBudgets', houseId],
    queryFn: () => {
      if (!houseId) {
        return Promise.resolve([]);
      }
      return budgetService.getAll(houseId);
    },
    enabled: Boolean(houseId),
  });
};

export const useUpsertMonthlyBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: budgetService.upsert,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['monthlyBudget', data.houseId, data.month] });
      queryClient.invalidateQueries({ queryKey: ['monthlyBudgets', data.houseId] });
    },
  });
};

export const useDeleteMonthlyBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: budgetService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyBudgets'] });
    },
  });
};

export const useUpsertBudgetLimit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ houseId, amount }: { houseId: string; amount: number }) =>
      budgetService.upsertDefault(houseId, amount),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['budgetLimit', data.houseId] });
    },
  });
};

