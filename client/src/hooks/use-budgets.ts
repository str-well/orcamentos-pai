import { useQuery, useMutation } from "@tanstack/react-query";
import { Budget } from "@shared/schema";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/query-client";
import { useToast } from "@/hooks/use-toast";

export function useBudgets() {
    const { toast } = useToast();

    const { data: budgets = [], isLoading } = useQuery({
        queryKey: ["budgets"],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const { data, error } = await supabase
                .from("budgets")
                .select("*")
                .eq("user_id", session?.user?.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as Budget[];
        },
    });

    const createBudget = async (budget: Omit<Budget, "id" | "created_at">) => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
            throw new Error("Usuário não autenticado");
        }

        // Validar campos obrigatórios
        const requiredFields = [
            'client_name',
            'client_address',
            'client_city',
            'client_contact',
            'work_location',
            'service_type',
            'date'
        ];

        const missingFields = requiredFields.filter(field => !budget[field as keyof typeof budget]);
        
        if (missingFields.length > 0) {
            throw new Error(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
        }

        // Converter camelCase para snake_case
        const formattedBudget = {
            client_name: budget.client_name,
            client_address: budget.client_address,
            client_city: budget.client_city,
            client_contact: budget.client_contact,
            work_location: budget.work_location,
            service_type: budget.service_type,
            date: budget.date,
            services: budget.services || [],
            materials: budget.materials || [],
            labor_cost: budget.labor_cost,
            labor_cost_with_materials: budget.labor_cost_with_materials,
            total_cost: budget.total_cost,
            user_id: session.user.id,
            status: "pending",
        };

        console.log('Dados formatados para envio:', formattedBudget);

        const { data, error } = await supabase
            .from("budgets")
            .insert([formattedBudget])
            .select()
            .single();

        if (error) {
            console.error('Erro ao criar orçamento:', error);
            toast({
                title: "Erro",
                description: "Erro ao criar orçamento",
                variant: "destructive",
            });
            throw error;
        }

        queryClient.setQueryData(["budgets"], (old: Budget[] | undefined) => {
            if (!old) return [data];
            return [data, ...old];
        });

        return data;
    };

    const deleteBudget = async (id: number) => {
        const { error } = await supabase
            .from("budgets")
            .delete()
            .eq("id", id);

        if (error) {
            toast({
                title: "Erro",
                description: "Erro ao excluir orçamento",
                variant: "destructive",
            });
            return;
        }

        queryClient.setQueryData(["budgets"], (old: Budget[] | undefined) => {
            if (!old) return [];
            return old.filter((budget) => budget.id !== id);
        });

        toast({
            title: "Sucesso",
            description: "Orçamento excluído com sucesso",
        });
    };

    const updateBudgetStatus = async (id: number, status: "approved" | "rejected") => {
        const { data: { session } } = await supabase.auth.getSession();

        const res = await fetch(`https://dbxabmijgyxuazvdelpx.supabase.co/functions/v1/update-budget-status/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({ status }),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Falha ao atualizar status');
        }

        const data = await res.json();

        // Atualizar o cache imediatamente
        queryClient.setQueryData(["budgets"], (old: Budget[] | undefined) => {
            if (!old) return [];
            return old.map(budget => 
                budget.id === id 
                    ? { ...budget, status: status }
                    : budget
            );
        });

        return data;
    };

    return {
        budgets,
        isLoading,
        deleteBudget,
        updateBudgetStatus,
        createBudget,
    };
} 