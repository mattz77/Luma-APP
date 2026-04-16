import { describe, expect, test } from '@jest/globals';
import type { Expense, Task } from '@/types/models';
import {
  filterExpensesByDashboardSearch,
  filterExpensesByGlobalSearch,
  filterTasksByDashboardSearch,
  filterTasksByGlobalSearch,
  normalizeDashboardSearchQuery,
} from './filterDashboardSearch';

const baseTask = (over: Partial<Task>): Task => ({
  id: 't1',
  houseId: 'h1',
  createdById: 'u1',
  assignedToId: null,
  title: 'Comprar leite',
  description: 'No mercado',
  status: 'PENDING',
  priority: 'MEDIUM',
  dueDate: null,
  completedAt: null,
  isRecurring: false,
  recurrence: null,
  tags: [],
  points: 0,
  createdAt: '',
  updatedAt: '',
  ...over,
});

const baseExpense = (over: Partial<Expense>): Expense => ({
  id: 'e1',
  houseId: 'h1',
  categoryId: null,
  createdById: 'u1',
  amount: '42.50',
  description: 'Almoço',
  expenseDate: '2026-04-15',
  receiptUrl: null,
  isRecurring: false,
  recurrencePeriod: null,
  isPaid: true,
  paidAt: null,
  notes: null,
  createdAt: '',
  updatedAt: '',
  ...over,
});

describe('normalizeDashboardSearchQuery', () => {
  test('remove espaços e minúsculas', () => {
    expect(normalizeDashboardSearchQuery('  AbC ')).toBe('abc');
  });
});

describe('filterTasksByDashboardSearch', () => {
  test('query vazia retorna lista vazia', () => {
    expect(filterTasksByDashboardSearch([baseTask({})], '   ')).toEqual([]);
  });

  test('match case-insensitive no título', () => {
    const tasks = [baseTask({ id: '1', title: 'Pagar CONTA' }), baseTask({ id: '2', title: 'Outro' })];
    expect(filterTasksByDashboardSearch(tasks, 'conta').map((t) => t.id)).toEqual(['1']);
  });

  test('match na descrição', () => {
    const tasks = [baseTask({ id: '1', title: 'X', description: 'referência banco' })];
    expect(filterTasksByDashboardSearch(tasks, 'BANCO').map((t) => t.id)).toEqual(['1']);
  });
});

describe('filterExpensesByDashboardSearch', () => {
  test('query vazia retorna lista vazia', () => {
    expect(filterExpensesByDashboardSearch([baseExpense({})], '')).toEqual([]);
  });

  test('match na descrição e categoria', () => {
    const expenses = [
      baseExpense({
        id: '1',
        description: 'Uber',
        category: { id: 'c', houseId: 'h1', name: 'Transporte', icon: null, color: null, createdAt: '' },
      }),
      baseExpense({
        id: '2',
        description: 'X',
        category: { id: 'c2', houseId: 'h1', name: 'Mercado', icon: null, color: null, createdAt: '' },
      }),
    ];
    expect(filterExpensesByDashboardSearch(expenses, 'mercado').map((e) => e.id)).toEqual(['2']);
    expect(filterExpensesByDashboardSearch(expenses, 'uber').map((e) => e.id)).toEqual(['1']);
  });
});

describe('filterTasksByGlobalSearch / filterExpensesByGlobalSearch (escopo)', () => {
  test('escopo expenses zera tarefas', () => {
    const tasks = [baseTask({ id: '1', title: 'leite' })];
    expect(filterTasksByGlobalSearch(tasks, 'leite', 'expenses')).toEqual([]);
  });

  test('escopo tasks zera despesas', () => {
    const expenses = [baseExpense({ id: '1', description: 'mercado' })];
    expect(filterExpensesByGlobalSearch(expenses, 'mercado', 'tasks')).toEqual([]);
  });

  test('escopo all mantém filtro por texto em ambos', () => {
    const tasks = [baseTask({ id: 't', title: 'x' })];
    const expenses = [baseExpense({ id: 'e', description: 'x' })];
    expect(filterTasksByGlobalSearch(tasks, 'x', 'all').map((t) => t.id)).toEqual(['t']);
    expect(filterExpensesByGlobalSearch(expenses, 'x', 'all').map((e) => e.id)).toEqual(['e']);
  });
});
