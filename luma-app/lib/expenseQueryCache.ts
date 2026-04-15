import type { QueryClient } from '@tanstack/react-query';

/** Invalida lista e remove cache do detalhe após exclusão de despesa (useDeleteExpense). */
export const invalidateExpenseCachesAfterDelete = (
  queryClient: QueryClient,
  variables: { id: string; houseId: string },
): void => {
  queryClient.invalidateQueries({ queryKey: ['expenses', variables.houseId] });
  queryClient.removeQueries({ queryKey: ['expense', variables.id, variables.houseId] });
};
