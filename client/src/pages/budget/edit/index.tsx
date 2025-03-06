import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Budget } from "@shared/schema";
import { Header } from "@/components/shared/Header";
import { BudgetForm } from "@/components/budget/BudgetForm";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast.tsx";
import { queryClient } from "@/lib/query-client";
import { PageTransition } from "@/components/shared/PageTransition";

export default function EditBudget({ params }: { params: { budgetId: string } }) {
    const [, setLocation] = useLocation();
    const budgetId = parseInt(params.budgetId, 10);
    console.log('ID do orçamento:', params.budgetId);

    // Validar se o id é um número válido
    if (isNaN(budgetId)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-lg text-muted-foreground">ID do orçamento inválido</p>
            </div>
        );
    }

    // Buscar o orçamento
    const { data: budget, isLoading } = useQuery({
        queryKey: ['budget', budgetId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('budgets')
                .select('*')
                .eq('id', budgetId)
                .single();

            if (error) throw error;

            console.log('Dados brutos do banco:', data);
            console.log('Materials:', data.materials);
            console.log('Services:', data.services);

            // Garantir que os arrays existam e os números sejam convertidos
            const processedData = {
                ...data,
                materials: Array.isArray(data.materials) ? data.materials : [],
                services: Array.isArray(data.services) ? data.services : [],
                labor_cost: Number(data.labor_cost),
                total_cost: Number(data.total_cost)
            };

            console.log('Dados processados:', processedData);

            return processedData as Budget;
        },
    });

    // Mutation para atualizar o orçamento
    const updateBudgetMutation = useMutation({
        mutationFn: async (updatedBudget: Budget) => {
            // Remover o id do objeto para evitar erro de IDENTITY COLUMN
            const { id, created_at, ...budgetToUpdate } = updatedBudget;

            const { error } = await supabase
                .from('budgets')
                .update(budgetToUpdate)
                .eq('id', budgetId)
                .single();

            if (error) throw error;
            return updatedBudget;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budgets'] });
            queryClient.invalidateQueries({ queryKey: ['budget', budgetId] });
            toast({
                title: "Sucesso",
                description: "Orçamento atualizado com sucesso",
            });
            setLocation('/budgets');
        },
        onError: (error: Error) => {
            toast({
                title: "Erro",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-border" />
            </div>
        );
    }

    if (!budget) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-lg text-muted-foreground">Orçamento não encontrado</p>
            </div>
        );
    }

    return (
        <PageTransition>
            <div className="min-h-screen bg-gray-50">
                <Header />
                <main className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold">Editar Orçamento #{budget.id}</h1>
                    </div>

                    <BudgetForm
                        initialData={budget}
                        onSubmit={(data) => {
                            updateBudgetMutation.mutate({
                                ...budget,
                                ...data,
                            });
                        }}
                        isLoading={updateBudgetMutation.isPending}
                    />
                </main>
            </div>
        </PageTransition>
    );
} 