import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import type { Expense, ExpenseCategory, ExpenseSplit, User } from '@/types/models';
import { RAGService } from '@/services/rag.service';

type ExpenseRow = Database['public']['Tables']['expenses']['Row'];
type ExpenseInsert = Database['public']['Tables']['expenses']['Insert'];
type ExpenseUpdate = Database['public']['Tables']['expenses']['Update'];
type ExpenseCategoryRow = Database['public']['Tables']['expense_categories']['Row'];
type ExpenseSplitRow = Database['public']['Tables']['expense_splits']['Row'];
type ExpenseSplitRowWithUser = ExpenseSplitRow & { user: UserRow | null };
type ExpenseSplitInsert = Database['public']['Tables']['expense_splits']['Insert'];
type UserRow = Database['public']['Tables']['users']['Row'];

interface ExpenseRowWithRelations extends ExpenseRow {
  category: ExpenseCategoryRow | null;
  splits: ExpenseSplitRowWithUser[] | null;
  created_by: UserRow | null;
}

const mapCategory = (category: ExpenseCategoryRow | null): ExpenseCategory | null => {
  if (!category) {
    return null;
  }

  return {
    id: category.id,
    houseId: category.house_id,
    name: category.name,
    icon: category.icon ?? null,
    color: category.color ?? null,
    createdAt: category.created_at,
  };
};

const mapUser = (user: UserRow | null): User | null => {
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    email: user.email ?? '',
    name: (user.name as string | undefined) ?? null,
    avatarUrl: (user.avatar_url as string | undefined) ?? null,
    phone: user.phone ?? null,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    lastLoginAt: user.last_login_at ?? null,
  };
};

const mapSplit = (split: ExpenseSplitRowWithUser): ExpenseSplit => ({
  id: split.id,
  expenseId: split.expense_id,
  userId: split.user_id,
  amount: split.amount,
  isPaid: split.is_paid,
  user: mapUser(split.user ?? null),
});

const mapExpense = (expense: ExpenseRowWithRelations): Expense => ({
  id: expense.id,
  houseId: expense.house_id,
  categoryId: expense.category_id,
  createdById: expense.created_by_id,
  amount: expense.amount,
  description: expense.description,
  expenseDate: expense.expense_date,
  receiptUrl: expense.receipt_url ?? null,
  isRecurring: expense.is_recurring,
  recurrencePeriod: expense.recurrence_period ?? null,
  isPaid: expense.is_paid,
  paidAt: expense.paid_at ?? null,
  notes: expense.notes ?? null,
  createdAt: expense.created_at,
  updatedAt: expense.updated_at,
  category: mapCategory(expense.category ?? null),
  splits: (expense.splits ?? []).map((split) => mapSplit(split)),
  createdBy: mapUser(expense.created_by ?? null),
});

export interface ExpenseSplitInput {
  userId: string;
  amount: number;
  isPaid?: boolean;
}

export interface SaveExpenseInput {
  id?: string;
  houseId: string;
  categoryId: string | null;
  createdById: string;
  amount: number;
  description: string;
  expenseDate: string;
  isRecurring?: boolean;
  recurrencePeriod?: string | null;
  isPaid: boolean;
  notes?: string | null;
  receiptUrl?: string | null;
  splits: ExpenseSplitInput[];
}

const decimalString = (value: number) => value.toFixed(2);

const buildExpenseInsert = (input: SaveExpenseInput): ExpenseInsert => ({
  house_id: input.houseId,
  category_id: input.categoryId,
  created_by_id: input.createdById,
  amount: decimalString(input.amount),
  description: input.description.trim(),
  expense_date: input.expenseDate,
  receipt_url: input.receiptUrl ?? null,
  is_recurring: Boolean(input.isRecurring),
  recurrence_period: input.recurrencePeriod ?? null,
  is_paid: input.isPaid,
  paid_at: input.isPaid ? new Date().toISOString() : null,
  notes: input.notes ?? null,
});

const buildSplitInserts = (expenseId: string, splits: ExpenseSplitInput[]): ExpenseSplitInsert[] =>
  splits.map((split) => ({
    expense_id: expenseId,
    user_id: split.userId,
    amount: decimalString(split.amount),
    is_paid: split.isPaid ?? false,
  }));

export type { ExpenseInsert, ExpenseUpdate };

export const expenseService = {
  async getById(id: string, houseId: string): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .select(
        '*, category:expense_categories(*), splits:expense_splits(*, user:users(id,email,name,avatar_url,phone,created_at,updated_at,last_login_at)), created_by:users!expenses_created_by_id_fkey(id,email,name,avatar_url,phone,created_at,updated_at,last_login_at)',
      )
      .eq('id', id)
      .eq('house_id', houseId)
      .single();

    if (error || !data) {
      throw error ?? new Error('Despesa não encontrada');
    }

    return mapExpense(data as ExpenseRowWithRelations);
  },

  async getAll(houseId: string): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select(
        '*, category:expense_categories(*), splits:expense_splits(*, user:users(id,email,name,avatar_url,phone,created_at,updated_at,last_login_at)), created_by:users!expenses_created_by_id_fkey(id,email,name,avatar_url,phone,created_at,updated_at,last_login_at)',
      )
      .eq('house_id', houseId)
      .order('expense_date', { ascending: false });

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as ExpenseRowWithRelations[];
    return rows.map((item) => mapExpense(item));
  },

  async create(input: SaveExpenseInput): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .insert(buildExpenseInsert(input))
      .select(
        '*, category:expense_categories(*), splits:expense_splits(*, user:users(id,email,name,avatar_url,phone,created_at,updated_at,last_login_at)), created_by:users!expenses_created_by_id_fkey(id,email,name,avatar_url,phone,created_at,updated_at,last_login_at)',
      )
      .single();

    if (error || !data) {
      throw error ?? new Error('Falha ao criar despesa');
    }

    const expenseRow = data as ExpenseRowWithRelations;

    if (input.splits.length > 0) {
      const splitsPayload = buildSplitInserts(expenseRow.id, input.splits);
      const { error: splitsError } = await supabase.from('expense_splits').insert(splitsPayload);
      if (splitsError) {
        throw splitsError;
      }
    }

    const expense = await expenseService.getById(expenseRow.id, input.houseId);

    // Indexar despesa no RAG (async, não bloqueia)
    RAGService.addDocument({
      house_id: input.houseId,
      content: `Despesa: ${expense.description}. Valor: R$ ${expense.amount}. Data: ${new Date(expense.expenseDate).toLocaleDateString('pt-BR')}.`,
      doc_type: 'expense',
      metadata: {
        id: expense.id,
        amount: expense.amount,
        category: expense.category?.name ?? undefined,
      },
    }).catch((err) => console.warn('[Expense] Falha ao indexar no RAG', err));

    // Enviar notificação para outros membros da casa (async)
    if (input.splits && input.splits.length > 0) {
      const { notifyNewExpense } = await import('@/hooks/useNotifications');
      // Notificar apenas membros que não são o criador
      const otherMembers = input.splits.filter((split) => split.userId !== input.created_by_id);
      otherMembers.forEach((split) => {
        notifyNewExpense(expense.id, expense.description, Number(expense.amount), split.userId).catch((err) =>
          console.warn('[Expense] Falha ao enviar notificação', err)
        );
      });
    }

    return expense;
  },

  async update(id: string, input: SaveExpenseInput): Promise<Expense> {
    const baseUpdate: ExpenseUpdate = {
      ...buildExpenseInsert(input),
      paid_at: input.isPaid ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from('expenses')
      .update(baseUpdate)
      .eq('id', id)
      .select(
        '*, category:expense_categories(*), splits:expense_splits(*, user:users(id,email,name,avatar_url,phone,created_at,updated_at,last_login_at)), created_by:users!expenses_created_by_id_fkey(id,email,name,avatar_url,phone,created_at,updated_at,last_login_at)',
      )
      .single();

    if (error || !data) {
      throw error ?? new Error('Falha ao atualizar despesa');
    }

    const expenseRow = data as ExpenseRowWithRelations;

    await supabase.from('expense_splits').delete().eq('expense_id', id);

    if (input.splits.length > 0) {
      const splitsPayload = buildSplitInserts(id, input.splits);
      const { error: splitsError } = await supabase.from('expense_splits').insert(splitsPayload);
      if (splitsError) {
        throw splitsError;
      }
    }

    return expenseService.getById(expenseRow.id, input.houseId);
  },

  async remove(id: string, houseId: string): Promise<void> {
    const { error } = await supabase.from('expenses').delete().eq('id', id).eq('house_id', houseId);

    if (error) {
      throw error;
    }

    await supabase.from('expense_splits').delete().eq('expense_id', id);
  },

  async togglePaid(id: string, isPaid: boolean, houseId: string): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .update({
        is_paid: isPaid,
        paid_at: isPaid ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .eq('house_id', houseId)
      .select(
        '*, category:expense_categories(*), splits:expense_splits(*, user:users(id,email,name,avatar_url,phone,created_at,updated_at,last_login_at)), created_by:users!expenses_created_by_id_fkey(id,email,name,avatar_url,phone,created_at,updated_at,last_login_at)',
      )
      .single();

    if (error || !data) {
      throw error ?? new Error('Falha ao atualizar status de pagamento');
    }

    return expenseService.getById((data as ExpenseRowWithRelations).id, houseId);
  },
};

