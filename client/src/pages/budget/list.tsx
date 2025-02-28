import { Budget } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "wouter";
import { Loader2, FileText, Plus, Eye } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Header } from "@/components/shared/Header";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/shared/PageTransition";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Label } from "@/components/ui/label";
import { useBudgets } from "@/hooks/use-budgets";
import { supabase } from "@/lib/supabase";

export default function BudgetList() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [dateFilter, setDateFilter] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { budgets, isLoading, deleteBudget } = useBudgets();

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
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generatePDF = async (budget: Budget) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`https://dbxabmijgyxuazvdelpx.supabase.co/functions/v1/generate-budget-pdf/${budget.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro na geração do PDF:', errorData);
        throw new Error(errorData.error || 'Falha ao gerar PDF');
      }

      const data = await response.json();
      console.log('Resposta da geração do PDF:', data);

      // Verificar se a URL do PDF está disponível
      if (data.pdfUrl) {
        // Abrir o PDF em uma nova aba
        window.open(data.pdfUrl, '_blank');
      } else {
        throw new Error('URL do PDF não disponível');
      }
    } catch (error) {
      console.error('Erro detalhado:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível gerar o PDF",
        variant: "destructive",
      });
    }
  };

  const formatDateTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  const filteredBudgets = budgets?.filter((budget) => {
    const clientName = budget?.client_name?.toLowerCase() || '';
    const clientCity = budget?.client_city?.toLowerCase() || '';
    const searchLower = search.toLowerCase();

    const matchesSearch =
      clientName.includes(searchLower) ||
      clientCity.includes(searchLower);

    const matchesStatus = !statusFilter || budget.status === statusFilter;

    const budgetDate = new Date(budget.created_at);
    const matchesDateRange = (!dateFilter.from || budgetDate >= dateFilter.from) &&
      (!dateFilter.to || budgetDate <= dateFilter.to);

    return matchesSearch && matchesStatus && matchesDateRange;
  }).sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Todos os Orçamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6 items-end">
                <div className="space-y-2">
                  <Label>Buscar</Label>
                  <Input
                    placeholder="Buscar por cliente ou cidade..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    onValueChange={(value) =>
                      setStatusFilter(value === "all" ? null : value)
                    }
                  >
                    <SelectTrigger className="max-w-xs">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="approved">Aprovados</SelectItem>
                      <SelectItem value="rejected">Rejeitados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Período</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[150px] pl-3 text-left font-normal">
                          {dateFilter.from ? (
                            format(dateFilter.from, "dd/MM/yyyy")
                          ) : (
                            <span>De</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateFilter.from}
                          onSelect={(date) =>
                            setDateFilter((prev) => ({ ...prev, from: date }))
                          }
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[150px] pl-3 text-left font-normal">
                          {dateFilter.to ? (
                            format(dateFilter.to, "dd/MM/yyyy")
                          ) : (
                            <span>Até</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateFilter.to}
                          onSelect={(date) =>
                            setDateFilter((prev) => ({ ...prev, to: date }))
                          }
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="h-10"
                >
                  <ChevronsUpDown className="h-4 w-4" />
                </Button>

                {(dateFilter.from || dateFilter.to) && (
                  <Button
                    variant="ghost"
                    onClick={() => setDateFilter({ from: undefined, to: undefined })}
                    className="h-10"
                  >
                    Limpar Datas
                  </Button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Nº</th>
                      <th className="text-left py-2">Cliente</th>
                      <th className="text-left py-2">Data/Hora</th>
                      <th className="text-left py-2">Local</th>
                      <th className="text-left py-2">Total</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filteredBudgets?.map((budget) => (
                        <motion.tr
                          key={budget.id}
                          className="border-b"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          layout
                        >
                          <td className="py-2">#{budget.id}</td>
                          <td className="py-2">{budget.client_name}</td>
                          <td className="py-2">
                            {budget.created_at ? new Date(budget.created_at).toLocaleString('pt-BR') : 'Data não disponível'}
                          </td>
                          <td className="py-2">{budget.client_city}</td>
                          <td className="py-2">R$ {budget.total_cost}</td>
                          <td className="py-2 capitalize">
                            {budget.status === 'pending' ? 'Pendente' :
                              budget.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                          </td>
                          <td className="py-2">
                            <div className="flex gap-2">
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedBudget(budget)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </motion.div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => generatePDF(budget)}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              {budget.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      updateStatusMutation.mutate({
                                        id: budget.id,
                                        status: "approved",
                                      })
                                    }
                                  >
                                    Aprovar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                      updateStatusMutation.mutate({
                                        id: budget.id,
                                        status: "rejected",
                                      })
                                    }
                                  >
                                    Rejeitar
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>

        <AnimatePresence>
          {selectedBudget && (
            <Dialog open={!!selectedBudget} onOpenChange={() => setSelectedBudget(null)}>
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
                      <div className="min-w-full inline-block align-middle">
                        <div className="overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr className="bg-gray-50">
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500">Serviço</th>
                                <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500">Qtd</th>
                                <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500">Preço Un.</th>
                                <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500">Total</th>
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
                      </div>
                    </div>
                  )}

                  {selectedBudget?.materials && selectedBudget.materials.length > 0 && (
                    <div className="overflow-x-auto">
                      <h3 className="font-semibold mb-2 text-sm sm:text-base">Materiais</h3>
                      <div className="min-w-full inline-block align-middle">
                        <div className="overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr className="bg-gray-50">
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500">Material</th>
                                <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500">Qtd</th>
                                <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500">Preço Un.</th>
                                <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500">Total</th>
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
                      </div>
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
    </PageTransition>
  );
}