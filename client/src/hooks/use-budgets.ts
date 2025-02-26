import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { budgetsApi } from '@/lib/supabase-api';
import type { Budget, InsertBudget } from '@shared/schema';

export function useBudgets() {
  const queryClient = useQueryClient();

  const budgetsQuery = useQuery({
    queryKey: ['budgets'],
    queryFn: () => budgetsApi.list()
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