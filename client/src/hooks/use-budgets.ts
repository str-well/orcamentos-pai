import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { budgetsApi } from '@/lib/supabase-api';
import type { Budget, InsertBudget } from '@shared/schema';
import { supabase } from '@/lib/supabase';

export function useBudgets() {
  const queryClient = useQueryClient();

  const budgetsQuery = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) throw error;
      return data as Budget[];
    }
  });

  const createBudgetMutation = useMutation({
    mutationFn: (budget: InsertBudget) => budgetsApi.create(budget),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    }
  });

  const updateBudgetMutation = useMutation({
    mutationFn: ({ id, budget }: { id: number; budget: Partial<Budget> }) => 
      budgetsApi.update(id, budget),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    }
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: (id: number) => budgetsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    }
  });

  return {
    budgets: budgetsQuery.data ?? [],
    isLoading: budgetsQuery.isLoading,
    createBudget: createBudgetMutation.mutate,
    updateBudget: updateBudgetMutation.mutate,
    deleteBudget: deleteBudgetMutation.mutate
  };
} 