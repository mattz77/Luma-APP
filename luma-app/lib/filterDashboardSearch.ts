import type { Expense, Task } from '@/types/models';

export type GlobalSearchScope = 'all' | 'tasks' | 'expenses';

export function normalizeDashboardSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function filterTasksByDashboardSearch(tasks: Task[], query: string): Task[] {
  const n = normalizeDashboardSearchQuery(query);
  if (!n) {
    return [];
  }
  return tasks.filter((t) => {
    const title = t.title.toLowerCase();
    const desc = (t.description ?? '').toLowerCase();
    return title.includes(n) || desc.includes(n);
  });
}

export function filterExpensesByDashboardSearch(expenses: Expense[], query: string): Expense[] {
  const n = normalizeDashboardSearchQuery(query);
  if (!n) {
    return [];
  }
  return expenses.filter((e) => {
    const desc = e.description.toLowerCase();
    const cat = (e.category?.name ?? '').toLowerCase();
    const amount = String(e.amount).toLowerCase();
    return desc.includes(n) || cat.includes(n) || amount.includes(n);
  });
}

/** Filtro por texto + escopo (modal de busca fora da Home). */
export function filterTasksByGlobalSearch(
  tasks: Task[],
  query: string,
  scope: GlobalSearchScope
): Task[] {
  if (scope === 'expenses') {
    return [];
  }
  return filterTasksByDashboardSearch(tasks, query);
}

export function filterExpensesByGlobalSearch(
  expenses: Expense[],
  query: string,
  scope: GlobalSearchScope
): Expense[] {
  if (scope === 'tasks') {
    return [];
  }
  return filterExpensesByDashboardSearch(expenses, query);
}
