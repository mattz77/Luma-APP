import { describe, expect, test } from 'bun:test';
import {
  buildActivityFeed,
  buildDashboardActivityPreview,
  formatTaskFeedSubtitle,
  getTaskActivityDate,
} from './buildActivityFeed';
import type { Expense, Task, User } from '../types/models';

const baseUser = (over: Partial<User>): User => ({
  id: over.id ?? 'u1',
  email: over.email ?? 'a@b.com',
  name: over.name ?? 'Nome',
  avatarUrl: over.avatarUrl ?? null,
  phone: over.phone ?? null,
  createdAt: over.createdAt ?? '2026-01-01T00:00:00Z',
  updatedAt: over.updatedAt ?? '2026-01-01T00:00:00Z',
  lastLoginAt: over.lastLoginAt ?? null,
});

const task = (over: Partial<Task> & Pick<Task, 'id' | 'title' | 'status'>): Task => ({
  houseId: over.houseId ?? 'h1',
  createdById: over.createdById ?? 'c1',
  assignedToId: over.assignedToId ?? null,
  description: over.description ?? null,
  priority: over.priority ?? 'MEDIUM',
  dueDate: over.dueDate ?? null,
  completedAt: over.completedAt ?? null,
  isRecurring: over.isRecurring ?? false,
  recurrence: over.recurrence ?? null,
  tags: over.tags ?? [],
  points: over.points ?? 10,
  createdAt: over.createdAt ?? '2026-04-10T10:00:00Z',
  updatedAt: over.updatedAt ?? '2026-04-10T10:00:00Z',
  assignee: over.assignee,
  creator: over.creator,
  ...over,
});

const expense = (over: Partial<Expense> & Pick<Expense, 'id' | 'description' | 'amount'>): Expense => ({
  houseId: over.houseId ?? 'h1',
  categoryId: over.categoryId ?? null,
  createdById: over.createdById ?? 'u1',
  expenseDate: over.expenseDate ?? '2026-04-12',
  receiptUrl: over.receiptUrl ?? null,
  isRecurring: over.isRecurring ?? false,
  recurrencePeriod: over.recurrencePeriod ?? null,
  isPaid: over.isPaid ?? true,
  paidAt: over.paidAt ?? null,
  notes: over.notes ?? null,
  createdAt: over.createdAt ?? '2026-04-12T12:00:00Z',
  updatedAt: over.updatedAt ?? '2026-04-12T12:00:00Z',
  ...over,
});

describe('buildActivityFeed', () => {
  const ref = new Date(2026, 3, 15);

  test('inclui tarefa PENDING de outro membro no mês e ordena com despesas', () => {
    const maria = baseUser({ id: 'm1', name: 'Maria', avatarUrl: 'https://ex.com/m.png' });
    const pedro = baseUser({ id: 'p1', name: 'Pedro' });

    const tasks: Task[] = [
      task({
        id: 't-pend',
        title: 'Comprar leite',
        status: 'PENDING',
        updatedAt: '2026-04-14T15:00:00Z',
        assignee: maria,
        creator: pedro,
      }),
    ];

    const expenses: Expense[] = [
      expense({
        id: 'e1',
        description: 'Mercado',
        amount: '50.00',
        expenseDate: '2026-04-15',
      }),
    ];

    const rows = buildActivityFeed({
      expenses,
      tasks,
      referenceDate: ref,
    });

    const pend = rows.find((r) => r.id === 't-pend');
    expect(pend?.type).toBe('task');
    expect(pend?.subtitle).toContain('Pendente');
    expect(pend?.subtitle).toContain('Maria');
    expect(pend?.avatarUrl).toBe('https://ex.com/m.png');

    expect(rows[0]?.date.getTime()).toBeGreaterThanOrEqual(rows[1]?.date.getTime() ?? 0);
  });

  test('preview da home limita a 4 itens', () => {
    const tasks: Task[] = Array.from({ length: 6 }).map((_, i) =>
      task({
        id: `t${i}`,
        title: `T${i}`,
        status: 'PENDING',
        updatedAt: `2026-04-${10 + i}T12:00:00Z`,
      })
    );
    const preview = buildDashboardActivityPreview({
      expenses: [],
      tasks,
      referenceDate: ref,
    });
    expect(preview.length).toBe(4);
  });
});

describe('getTaskActivityDate', () => {
  test('COMPLETED usa completed_at quando existir', () => {
    const d = getTaskActivityDate(
      task({
        id: 'x',
        title: 'x',
        status: 'COMPLETED',
        completedAt: '2026-04-01T08:00:00Z',
        updatedAt: '2026-04-05T08:00:00Z',
      })
    );
    expect(d.toISOString().slice(0, 10)).toBe('2026-04-01');
  });
});

describe('formatTaskFeedSubtitle', () => {
  test('mostra criada por quando criador difere do responsável', () => {
    const sub = formatTaskFeedSubtitle(
      task({
        id: 'x',
        title: 'x',
        status: 'PENDING',
        assignee: baseUser({ id: 'a', name: 'Ana' }),
        creator: baseUser({ id: 'b', name: 'Beto' }),
      })
    );
    expect(sub).toContain('criada por');
    expect(sub).toContain('Beto');
  });
});
