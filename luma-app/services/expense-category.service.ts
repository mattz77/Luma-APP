import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import type { ExpenseCategory } from '@/types/models';

type ExpenseCategoryRow = Database['public']['Tables']['expense_categories']['Row'];
type ExpenseCategoryInsert = Database['public']['Tables']['expense_categories']['Insert'];
type ExpenseCategoryUpdate = Database['public']['Tables']['expense_categories']['Update'];

const mapCategory = (row: ExpenseCategoryRow): ExpenseCategory => ({
  id: row.id,
  houseId: row.house_id,
  name: row.name,
  icon: row.icon ?? null,
  color: row.color ?? null,
  createdAt: row.created_at,
});

export const expenseCategoryService = {
  async list(houseId: string): Promise<ExpenseCategory[]> {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('house_id', houseId)
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map((item) => mapCategory(item as ExpenseCategoryRow));
  },

  async create(input: {
    houseId: string;
    name: string;
    icon?: string | null;
    color?: string | null;
  }): Promise<ExpenseCategory> {
    const payload: ExpenseCategoryInsert = {
      house_id: input.houseId,
      name: input.name.trim(),
      icon: input.icon ?? null,
      color: input.color ?? null,
    };

    const { data, error } = await supabase.from('expense_categories').insert(payload).select().single();

    if (error || !data) {
      throw error ?? new Error('Não foi possível criar categoria');
    }

    return mapCategory(data as ExpenseCategoryRow);
  },

  async update(id: string, updates: { name?: string; icon?: string | null; color?: string | null }) {
    const payload: ExpenseCategoryUpdate = {
      name: updates.name?.trim(),
      icon: updates.icon ?? null,
      color: updates.color ?? null,
    };

    const { data, error } = await supabase
      .from('expense_categories')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw error ?? new Error('Não foi possível atualizar categoria');
    }

    return mapCategory(data as ExpenseCategoryRow);
  },

  async remove(id: string) {
    const { error } = await supabase.from('expense_categories').delete().eq('id', id);

    if (error) {
      throw error;
    }
  },
};

