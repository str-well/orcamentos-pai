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
import { apiRequest, queryClient } from "@/lib/queryClient";
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

  const { data: budgets, isLoading } = useQuery<Budget[]>({
    queryKey: ["/api/budgets"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number;
      status: "approved" | "rejected";
    }) => {
      const res = await apiRequest("PUT", `/api/budgets/${id}/status`, {
        status,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Success",
        description: "Budget status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generatePDF = async (budget: Budget) => {
    try {
      const response = await fetch(`/api/budgets/${budget.id}/pdf`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orcamento-${budget.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o PDF",
        variant: "destructive",
      });
    }
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
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
    const matchesSearch =
      budget.clientName.toLowerCase().includes(search.toLowerCase()) ||
      budget.clientCity.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !statusFilter || budget.status === statusFilter;

    const budgetDate = new Date(budget.createdAt);
    const matchesDateRange = (!dateFilter.from || budgetDate >= dateFilter.from) &&
      (!dateFilter.to || budgetDate <= dateFilter.to);

    return matchesSearch && matchesStatus && matchesDateRange;
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
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
                          <td className="py-2">{budget.clientName}</td>
                          <td className="py-2">
                            {formatDateTime(budget.createdAt)}
                          </td>
                          <td className="py-2">{budget.clientCity}</td>
                          <td className="py-2">R$ {budget.totalCost}</td>
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
              <DialogContent className="max-w-3xl">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold">Orçamento #{selectedBudget.id}</h2>
                      <p className="text-sm text-gray-500">
                        Criado em {formatDateTime(selectedBudget.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">Status: {
                        selectedBudget.status === 'pending' ? 'Pendente' :
                          selectedBudget.status === 'approved' ? 'Aprovado' : 'Rejeitado'
                      }</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Dados do Cliente</h3>
                      <p>Nome: {selectedBudget.clientName}</p>
                      <p>Endereço: {selectedBudget.clientAddress}</p>
                      <p>Cidade: {selectedBudget.clientCity}</p>
                      <p>Contato: {selectedBudget.clientContact}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Dados do Serviço</h3>
                      <p>Local: {selectedBudget.workLocation}</p>
                      <p>Tipo: {selectedBudget.serviceType}</p>
                      <p>Data: {new Date(selectedBudget.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>

                  {selectedBudget.services.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Serviços</h3>
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Serviço</th>
                            <th className="text-right py-2">Qtd</th>
                            <th className="text-right py-2">Preço Un.</th>
                            <th className="text-right py-2">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedBudget.services.map((service, index) => (
                            <tr key={index} className="border-b">
                              <td className="py-2">{service.name}</td>
                              <td className="text-right py-2">{service.quantity}</td>
                              <td className="text-right py-2">R$ {service.unitPrice}</td>
                              <td className="text-right py-2">R$ {service.total}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {selectedBudget.materials.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Materiais</h3>
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Material</th>
                            <th className="text-right py-2">Qtd</th>
                            <th className="text-right py-2">Preço Un.</th>
                            <th className="text-right py-2">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedBudget.materials.map((material, index) => (
                            <tr key={index} className="border-b">
                              <td className="py-2">{material.name}</td>
                              <td className="text-right py-2">{material.quantity}</td>
                              <td className="text-right py-2">R$ {material.unitPrice}</td>
                              <td className="text-right py-2">R$ {material.total}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="text-right space-y-1">
                    <p>Mão de Obra: R$ {selectedBudget.laborCost}</p>
                    <p className="text-lg font-bold">Total: R$ {selectedBudget.totalCost}</p>
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