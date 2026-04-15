import { describe, expect, test } from 'bun:test';
import { QueryClient } from '@tanstack/react-query';

import { invalidateExpenseCachesAfterDelete } from './expenseQueryCache';

describe('invalidateExpenseCachesAfterDelete', () => {
  test('removeQueries elimina o cache do detalhe da despesa', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['expense', 'exp-1', 'house-1'], { id: 'exp-1' });

    invalidateExpenseCachesAfterDelete(queryClient, { id: 'exp-1', houseId: 'house-1' });

    expect(queryClient.getQueryData(['expense', 'exp-1', 'house-1'])).toBeUndefined();
  });
});
