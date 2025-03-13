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
        
        console.log('Budget recebido:', JSON.stringify(budget, null, 2));
        console.log('labor_cost_with_materials presente?', 'labor_cost_with_materials' in budget);
        
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

        // Criar uma cópia explícita do objeto budget para garantir que todos os campos sejam incluídos
        const budgetCopy = { ...budget };
        
        // Converter camelCase para snake_case e garantir que todos os campos sejam incluídos
        const formattedBudget = {
            client_name: budgetCopy.client_name,
            client_address: budgetCopy.client_address,
            client_city: budgetCopy.client_city,
            client_contact: budgetCopy.client_contact,
            work_location: budgetCopy.work_location,
            service_type: budgetCopy.service_type,
            date: budgetCopy.date,
            services: budgetCopy.services || [],
            materials: budgetCopy.materials || [],
            labor_cost: budgetCopy.labor_cost,
            // Garantir que o campo seja incluído mesmo que seja undefined
            labor_cost_with_materials: budgetCopy.labor_cost_with_materials,
            total_cost: budgetCopy.total_cost,
            user_id: session.user.id,
            status: "pending",
        };

        console.log('Dados formatados para envio:', JSON.stringify(formattedBudget, null, 2));
        console.log('labor_cost_with_materials incluído?', 'labor_cost_with_materials' in formattedBudget);
        console.log('Valor de labor_cost_with_materials:', formattedBudget.labor_cost_with_materials);

        // Teste direto com o campo explícito
        const insertData = {
            ...formattedBudget,
            labor_cost_with_materials: budgetCopy.labor_cost_with_materials
        };
        
        console.log('Dados finais para inserção:', JSON.stringify(insertData, null, 2));

        const { data, error } = await supabase
            .from("budgets")
            .insert([insertData])
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

    const checkTableStructure = async () => {
        try {
            const { data, error } = await supabase.rpc('get_table_structure', { table_name: 'budgets' });
            if (error) {
                console.error('Erro ao verificar estrutura da tabela:', error);
                return null;
            }
            console.log('Estrutura da tabela budgets:', data);
            return data;
        } catch (error) {
            console.error('Erro ao verificar estrutura da tabela:', error);
            return null;
        }
    };

    return {
        budgets,
        isLoading,
        deleteBudget,
        updateBudgetStatus,
        createBudget,
        checkTableStructure,
    };
} 