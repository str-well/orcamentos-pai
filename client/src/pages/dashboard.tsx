import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Budget } from "@shared/schema";
import { Loader2, Plus, TrendingUp, DollarSign, Eye, Printer, MoreVertical, Pencil, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Link } from "wouter";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Legend
} from "recharts";
import { Header } from "@/components/shared/Header";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useCallback } from "react";
import { useBudgetPdf } from "@/hooks/use-budget-pdf";
import { useBudgetPreview } from "@/hooks/use-budget-preview";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast.tsx";
import { queryClient } from "@/lib/query-client";

export default function Dashboard() {
  const { logoutMutation } = useAuth();

  // Primeiro, buscar o usuário autenticado
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  // Depois, buscar os orçamentos usando o ID do usuário
  const { data: budgets, isLoading: isLoadingBudgets } = useQuery({
    queryKey: ['budgets', userData?.id],
    queryFn: async () => {
      if (!userData?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userData.id);

      if (error) throw error;
      return data as Budget[];
    },
    enabled: !!userData?.id // Só executa quando tivermos o ID do usuário
  });

  const { openPreview, selectedBudget, closePreview } = useBudgetPreview();
  const { generatePdf, isGenerating } = useBudgetPdf();

  // Adicione essa mutation para atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number;
      status: "approved" | "rejected";
    }) => {
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

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast({
        title: "Sucesso",
        description: "Status do orçamento atualizado com sucesso",
      });
    },
  });

  // Adicione essa mutation para deletar
  const deleteBudgetMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast({
        title: "Sucesso",
        description: "Orçamento excluído com sucesso",
      });
    },
  });

  if (isLoadingUser || isLoadingBudgets) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  const totalPending = budgets?.filter((b) => b.status === "pending").length || 0;
  const totalApproved = budgets?.filter((b) => b.status === "approved").length || 0;
  const totalRejected = budgets?.filter((b) => b.status === "rejected").length || 0;

  const chartData = [
    { name: "Pendente", quantidade: totalPending },
    { name: "Aprovado", quantidade: totalApproved },
    { name: "Rejeitado", quantidade: totalRejected },
  ];

  // Cálculo do faturamento mensal e anual
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const approvedBudgets = budgets?.filter(b => b.status === "approved") || [];

  const monthlyRevenue = approvedBudgets
    .filter(b => {
      const budgetDate = new Date(b.date);
      return budgetDate.getMonth() === currentMonth &&
        budgetDate.getFullYear() === currentYear;
    })
    .reduce((total, budget) => total + parseFloat(budget.total_cost), 0);

  const yearlyRevenue = approvedBudgets
    .filter(b => new Date(b.date).getFullYear() === currentYear)
    .reduce((total, budget) => total + parseFloat(budget.total_cost), 0);

  // Dados para o gráfico de linha
  const monthlyBudgetCounts = budgets?.reduce((acc, budget) => {
    const date = new Date(budget.created_at);
    const monthYear = format(date, 'MMM/yy', { locale: ptBR });

    acc[monthYear] = (acc[monthYear] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const lineChartData = Object.entries(monthlyBudgetCounts || {})
    .map(([month, count]) => ({
      month,
      quantidade: count
    }))
    .sort((a, b) => {
      const [monthA, yearA] = a.month.split('/');
      const [monthB, yearB] = b.month.split('/');
      return new Date(`${monthA}/01/${yearA}`).getTime() - new Date(`${monthB}/01/${yearB}`).getTime();
    });

  // Ordene os orçamentos por data de criação (mais recentes primeiro)
  const recentBudgets = [...(budgets || [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Orçamentos Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPending}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Orçamentos Aprovados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalApproved}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Orçamentos Rejeitados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalRejected}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Faturamento Mensal
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {monthlyRevenue.toLocaleString('pt-BR')}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Faturamento Anual
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {yearlyRevenue.toLocaleString('pt-BR')}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Status dos Orçamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip
                      formatter={(value, name) => [`${value} orçamentos`, 'Total']}
                      labelStyle={{ color: 'black' }}
                    />
                    <Bar dataKey="quantidade" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Evolução Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="quantidade"
                      name="Orçamentos"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Orçamentos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Cliente</th>
                    <th className="text-left py-2">Data</th>
                    <th className="text-left py-2">Total</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-right py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBudgets.map((budget) => (
                    <tr key={budget.id} className="border-b">
                      <td className="py-2">{budget.client_name}</td>
                      <td className="py-2">
                        {new Date(budget.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-2">
                        R$ {parseFloat(budget.total_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 capitalize">
                        {budget.status === 'pending' ? 'Pendente' :
                          budget.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openPreview(budget)}
                            className="h-8 w-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => generatePdf(budget)}
                            disabled={isGenerating}
                            className="h-8 w-8"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>

      <AnimatePresence>
        {selectedBudget && (
          <Dialog open={!!selectedBudget} onOpenChange={closePreview}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 sm:space-y-6"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">Orçamento #{selectedBudget.id}</h2>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Criado em {selectedBudget.created_at ? new Date(selectedBudget.created_at).toLocaleString('pt-BR') : 'Data não disponível'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm sm:text-base">Status: {
                      selectedBudget.status === 'pending' ? 'Pendente' :
                        selectedBudget.status === 'approved' ? 'Aprovado' : 'Rejeitado'
                    }</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h3 className="font-semibold mb-2 text-sm sm:text-base">Dados do Cliente</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Nome:</span> {selectedBudget.client_name}</p>
                      <p><span className="font-medium">Endereço:</span> {selectedBudget.client_address}</p>
                      <p><span className="font-medium">Cidade:</span> {selectedBudget.client_city}</p>
                      <p><span className="font-medium">Contato:</span> {selectedBudget.client_contact}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h3 className="font-semibold mb-2 text-sm sm:text-base">Dados do Serviço</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Local:</span> {selectedBudget.work_location}</p>
                      <p><span className="font-medium">Tipo:</span> {selectedBudget.service_type}</p>
                      <p><span className="font-medium">Data:</span> {new Date(selectedBudget.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </div>

                {selectedBudget?.services && selectedBudget.services.length > 0 && (
                  <div className="overflow-x-auto">
                    <h3 className="font-semibold mb-2 text-sm sm:text-base">Serviços</h3>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Serviço</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Qtd</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Preço Un.</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedBudget.services.map((service, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-sm">{service.name}</td>
                            <td className="px-3 py-2 text-sm text-right">{service.quantity}</td>
                            <td className="px-3 py-2 text-sm text-right">R$ {service.unitPrice.toFixed(2)}</td>
                            <td className="px-3 py-2 text-sm text-right">R$ {service.total.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedBudget?.materials && selectedBudget.materials.length > 0 && (
                  <div className="overflow-x-auto">
                    <h3 className="font-semibold mb-2 text-sm sm:text-base">Materiais</h3>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Material</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Qtd</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Preço Un.</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedBudget.materials.map((material, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-sm">{material.name}</td>
                            <td className="px-3 py-2 text-sm text-right">{material.quantity}</td>
                            <td className="px-3 py-2 text-sm text-right">R$ {material.unitPrice.toFixed(2)}</td>
                            <td className="px-3 py-2 text-sm text-right">R$ {material.total.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-right space-y-1">
                    <p className="text-sm"><span className="font-medium">Mão de Obra:</span> R$ {selectedBudget.labor_cost}</p>
                    <p className="text-base sm:text-lg font-bold">Total: R$ {selectedBudget.total_cost}</p>
                  </div>
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}