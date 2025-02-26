import { supabase } from './supabase';
import type { Budget, InsertBudget } from '@shared/schema';

export const budgetsApi = {
  create: async (budget: InsertBudget) => {
    const { data, error } = await supabase
      .from('budgets')
      .insert(budget)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  list: async () => {
    const { data, error } = await supabase
      .from('budgets')
      .select('*');

    if (error) throw error;
    return data;
  },

  get: async (id: number) => {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  update: async (id: number, budget: Partial<Budget>) => {
    const { data, error } = await supabase
      .from('budgets')
      .update(budget)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  delete: async (id: number) => {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}; 