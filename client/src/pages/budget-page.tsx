import { useBudgets } from '@/hooks/use-budgets';

export default function BudgetPage() {
    const { createBudget } = useBudgets();

    const handleSubmit = async (data: InsertBudget) => {
        try {
            await createBudget(data);
            // Mostrar mensagem de sucesso, redirecionar, etc.
        } catch (error) {
            console.error('Erro ao criar orçamento:', error);
            // Mostrar mensagem de erro
        }
    };

    // ... resto do código
} 