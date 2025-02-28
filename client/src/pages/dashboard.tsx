import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Budget } from "@shared/schema";
import { Loader2, Plus, TrendingUp, DollarSign } from "lucide-react";
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

export default function Dashboard() {
  const { logoutMutation } = useAuth();

  const { data: budgets, isLoading } = useQuery<Budget[]>({
    queryKey: ["budgets"],
  });

  if (isLoading) {
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
    { name: "Pendente", value: totalPending },
    { name: "Aprovado", value: totalApproved },
    { name: "Rejeitado", value: totalRejected },
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
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" />
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
                  </tr>
                </thead>
                <tbody>
                  {budgets?.slice(0, 5).map((budget) => (
                    <tr key={budget.id} className="border-b">
                      <td className="py-2">{budget.client_name}</td>
                      <td className="py-2">
                        {new Date(budget.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-2">R$ {budget.total_cost}</td>
                      <td className="py-2 capitalize">
                        {budget.status === 'pending' ? 'Pendente' :
                          budget.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}