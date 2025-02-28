import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { insertBudgetSchema, type InsertBudget } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, InfoIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/shared/Header";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useBudgets } from "@/hooks/use-budgets";

interface BudgetItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total?: number;
}

interface BudgetFormData {
  services: BudgetItem[];
  materials: BudgetItem[];
  date: string;
  clientName: string;
  clientAddress: string;
  clientCity: string;
  clientContact: string;
  workLocation: string;
  serviceType: string;
  laborCost: string;
  totalCost: string;
}

function FieldLabel({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <div className="flex items-center gap-2">
      <span>{label}</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            type="button"
            onClick={(e) => e.preventDefault()}
            className="hover:cursor-help"
          >
            <InfoIcon className="h-4 w-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="max-w-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export default function NewBudget() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { createBudget } = useBudgets();

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(insertBudgetSchema),
    defaultValues: {
      clientName: "",
      clientAddress: "",
      clientCity: "",
      clientContact: "",
      workLocation: "",
      serviceType: "",
      date: new Date().toISOString().split('T')[0],
      services: [],
      materials: [],
      laborCost: "0",
      totalCost: "0",
    },
  });

  const services = useFieldArray({
    name: "services",
    control: form.control,
  });

  const materials = useFieldArray({
    name: "materials",
    control: form.control,
  });

  const createBudgetMutation = useMutation({
    mutationFn: async (data: BudgetFormData) => {
      await createBudget(data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Orçamento criado com sucesso.",
      });
      setLocation("/budgets");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro!",
        description: "Erro ao criar orçamento. Tente novamente.",
      });
      console.error("Erro ao criar orçamento:", error);
    },
  });

  const calculateTotals = (data: BudgetFormData) => {
    const servicesTotal = data.services?.reduce(
      (sum: number, item: BudgetItem) => sum + (item.quantity * item.unitPrice),
      0
    ) || 0;

    const materialsTotal = data.materials?.reduce(
      (sum: number, item: BudgetItem) => sum + (item.quantity * item.unitPrice),
      0
    ) || 0;

    return { servicesTotal, materialsTotal };
  };

  const onSubmit = (data: BudgetFormData) => {
    const { servicesTotal, materialsTotal } = calculateTotals(data);

    const budgetData = {
      ...data,
      services: data.services.map(service => ({
        ...service,
        total: service.quantity * service.unitPrice
      })),
      materials: data.materials.map(material => ({
        ...material,
        total: material.quantity * material.unitPrice
      })),
      totalCost: String(servicesTotal + materialsTotal + Number(data.laborCost))
    };

    createBudgetMutation.mutate(budgetData);
  };

  const formatDate = (date: Date) => {
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Novo Orçamento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="clientName">Nome do Cliente</Label>
                    <Input
                      id="clientName"
                      {...form.register("clientName")}
                      className="mt-1"
                    />
                    {form.formState.errors.clientName && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.clientName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="clientAddress">Endereço</Label>
                    <Input
                      id="clientAddress"
                      {...form.register("clientAddress")}
                      className="mt-1"
                    />
                    {form.formState.errors.clientAddress && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.clientAddress.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="clientCity">Cidade</Label>
                    <Input
                      id="clientCity"
                      {...form.register("clientCity")}
                      className="mt-1"
                    />
                    {form.formState.errors.clientCity && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.clientCity.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="clientContact">Contato</Label>
                    <Input
                      id="clientContact"
                      {...form.register("clientContact")}
                      className="mt-1"
                    />
                    {form.formState.errors.clientContact && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.clientContact.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="workLocation">Local da Obra</Label>
                    <Input
                      id="workLocation"
                      {...form.register("workLocation")}
                      className="mt-1"
                    />
                    {form.formState.errors.workLocation && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.workLocation.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="serviceType">Tipo de Serviço</Label>
                    <Input
                      id="serviceType"
                      {...form.register("serviceType")}
                      className="mt-1"
                    />
                    {form.formState.errors.serviceType && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.serviceType.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="date">Data</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal mt-1",
                            !form.watch("date") && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.watch("date") ? format(new Date(form.watch("date")), "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={form.watch("date") ? new Date(form.watch("date")) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              form.setValue("date", date.toISOString());
                            }
                          }}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label>Serviços</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => services.append({ name: "", quantity: 0, unitPrice: 0, total: 0 })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Serviço
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {services.fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start bg-gray-50 p-4 rounded-lg">
                        <div className="sm:col-span-6">
                          <Label htmlFor={`services.${index}.name`}>Nome</Label>
                          <Input
                            id={`services.${index}.name`}
                            {...form.register(`services.${index}.name`)}
                            className="mt-1"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label htmlFor={`services.${index}.quantity`}>Quantidade</Label>
                          <Input
                            id={`services.${index}.quantity`}
                            type="number"
                            {...form.register(`services.${index}.quantity`, { valueAsNumber: true })}
                            className="mt-1"
                            onChange={(e) => {
                              const quantity = parseFloat(e.target.value);
                              form.setValue(`services.${index}.quantity`, quantity);
                              form.setValue(`services.${index}.total`, quantity * form.watch(`services.${index}.unitPrice`));
                            }}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label htmlFor={`services.${index}.unitPrice`}>Preço Un.</Label>
                          <Input
                            id={`services.${index}.unitPrice`}
                            type="number"
                            step="0.01"
                            {...form.register(`services.${index}.unitPrice`, { valueAsNumber: true })}
                            className="mt-1"
                            onChange={(e) => {
                              const unitPrice = parseFloat(e.target.value);
                              form.setValue(`services.${index}.unitPrice`, unitPrice);
                              form.setValue(`services.${index}.total`, form.watch(`services.${index}.quantity`) * unitPrice);
                            }}
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <Label>Total</Label>
                          <p className="mt-2 text-sm font-medium">
                            R$ {(form.watch(`services.${index}.total`) || 0).toFixed(2)}
                          </p>
                        </div>
                        <div className="sm:col-span-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 mt-6"
                            onClick={() => services.remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label>Materiais</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => materials.append({ name: "", quantity: 0, unitPrice: 0, total: 0 })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Material
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {materials.fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start bg-gray-50 p-4 rounded-lg">
                        <div className="sm:col-span-6">
                          <Label htmlFor={`materials.${index}.name`}>Nome</Label>
                          <Input
                            id={`materials.${index}.name`}
                            {...form.register(`materials.${index}.name`)}
                            className="mt-1"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label htmlFor={`materials.${index}.quantity`}>Quantidade</Label>
                          <Input
                            id={`materials.${index}.quantity`}
                            type="number"
                            {...form.register(`materials.${index}.quantity`, { valueAsNumber: true })}
                            className="mt-1"
                            onChange={(e) => {
                              const quantity = parseFloat(e.target.value);
                              form.setValue(`materials.${index}.quantity`, quantity);
                              form.setValue(`materials.${index}.total`, quantity * form.watch(`materials.${index}.unitPrice`));
                            }}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label htmlFor={`materials.${index}.unitPrice`}>Preço Un.</Label>
                          <Input
                            id={`materials.${index}.unitPrice`}
                            type="number"
                            step="0.01"
                            {...form.register(`materials.${index}.unitPrice`, { valueAsNumber: true })}
                            className="mt-1"
                            onChange={(e) => {
                              const unitPrice = parseFloat(e.target.value);
                              form.setValue(`materials.${index}.unitPrice`, unitPrice);
                              form.setValue(`materials.${index}.total`, form.watch(`materials.${index}.quantity`) * unitPrice);
                            }}
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <Label>Total</Label>
                          <p className="mt-2 text-sm font-medium">
                            R$ {(form.watch(`materials.${index}.total`) || 0).toFixed(2)}
                          </p>
                        </div>
                        <div className="sm:col-span-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 mt-6"
                            onClick={() => materials.remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="laborCost">Mão de Obra</Label>
                    <Input
                      id="laborCost"
                      type="number"
                      step="0.01"
                      {...form.register("laborCost")}
                      className="mt-1"
                      onChange={(e) => {
                        const laborCost = parseFloat(e.target.value);
                        form.setValue("laborCost", laborCost.toString());
                      }}
                    />
                  </div>
                  <div>
                    <Label>Total do Orçamento</Label>
                    <p className="mt-2 text-lg font-bold">
                      {(() => {
                        const totals = calculateTotals(form.watch());
                        return `R$ ${totals.servicesTotal + totals.materialsTotal + Number(form.watch("laborCost"))}`;
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/budgets")}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createBudgetMutation.isPending}
                >
                  {createBudgetMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Criar Orçamento
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}