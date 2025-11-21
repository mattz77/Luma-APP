import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type MonthlyBudgetRow = Database['public']['Tables']['monthly_budgets']['Row'];
type MonthlyBudgetInsert = Database['public']['Tables']['monthly_budgets']['Insert'];
type MonthlyBudgetUpdate = Database['public']['Tables']['monthly_budgets']['Update'];

export interface MonthlyBudget {
  id: string;
  houseId: string;
  month: string; // Format: 'YYYY-MM'
  amount: string;
  createdAt: string;
  updatedAt: string;
}

const mapBudget = (budget: MonthlyBudgetRow): MonthlyBudget => ({
  id: budget.id,
  houseId: budget.house_id,
  month: budget.month,
  amount: budget.amount.toString(),
  createdAt: budget.created_at,
  updatedAt: budget.updated_at,
});

export const budgetService = {
  async getByMonth(houseId: string, month: string): Promise<MonthlyBudget | null> {
    const { data, error } = await supabase
      .from('monthly_budgets')
      .select('*')
      .eq('house_id', houseId)
      .eq('month', month)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw error;
    }

    if (!data) {
      return null;
    }

    return mapBudget(data);
  },

  async getAll(houseId: string): Promise<MonthlyBudget[]> {
    const { data, error } = await supabase
      .from('monthly_budgets')
      .select('*')
      .eq('house_id', houseId)
      .order('month', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((budget) => mapBudget(budget));
  },

  async create(budget: MonthlyBudgetInsert): Promise<MonthlyBudget> {
    const { data, error } = await supabase
      .from('monthly_budgets')
      .insert(budget)
      .select()
      .single();

    if (error || !data) {
      throw error ?? new Error('Falha ao criar orçamento');
    }

    return mapBudget(data);
  },

  async update(id: string, updates: MonthlyBudgetUpdate): Promise<MonthlyBudget> {
    const { data, error } = await supabase
      .from('monthly_budgets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw error ?? new Error('Falha ao atualizar orçamento');
    }

    return mapBudget(data);
  },

  async upsert(budget: MonthlyBudgetInsert): Promise<MonthlyBudget> {
    const { data, error } = await supabase
      .from('monthly_budgets')
      .upsert(budget, { onConflict: 'house_id,month' })
      .select()
      .single();

    if (error || !data) {
      throw error ?? new Error('Falha ao salvar orçamento');
    }

    return mapBudget(data);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('monthly_budgets').delete().eq('id', id);

    if (error) {
      throw error;
    }
  },
};

