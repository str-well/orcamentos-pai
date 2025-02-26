import { supabase } from './supabase';
import type { Budget, InsertBudget } from '@shared/schema';

export const budgetsApi = {
  create: async (budget: InsertBudget) => {
    // Pegar o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('budgets')
      .insert({
        user_id: user.id, // Adicionar o user_id
        client_name: budget.clientName,
        client_address: budget.clientAddress,
        client_city: budget.clientCity,
        client_contact: budget.clientContact,
        work_location: budget.workLocation,
        service_type: budget.serviceType,
        date: budget.date,
        services: budget.services,
        materials: budget.materials,
        labor_cost: budget.laborCost,
        total_cost: budget.totalCost
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  list: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id); // Filtrar por user_id

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