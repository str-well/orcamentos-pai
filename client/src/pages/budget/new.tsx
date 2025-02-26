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
import { apiRequest, queryClient } from "@/lib/queryClient";
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

type BudgetFormData = Omit<InsertBudget, 'date'> & {
  date: string;
};

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
      const res = await apiRequest("POST", "http://localhost:5000/api/budgets", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Orçamento criado com sucesso.",
      });
      setLocation("/budgets");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro!",
        description: error.message || "Erro ao criar orçamento.",
      });
    },
  });

  const calculateTotals = (data: BudgetFormData): BudgetFormData => {
    const servicesTotal = data.services.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice || 0),
      0
    );
    const materialsTotal = data.materials.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice || 0),
      0
    );
    const laborCost = parseFloat(data.laborCost) || 0;

    return {
      ...data,
      services: data.services.map((s) => ({
        ...s,
        total: (s.quantity * s.unitPrice) || 0,
      })),
      materials: data.materials.map((m) => ({
        ...m,
        total: (m.quantity * m.unitPrice) || 0,
      })),
      laborCost: laborCost.toString(),
      totalCost: (servicesTotal + materialsTotal + laborCost).toString(),
    };
  };

  const onSubmit = async (data: BudgetFormData) => {
    console.log("Form submitted with data:", data);

    try {
      const withTotals = calculateTotals(data);
      console.log("Data with totals:", withTotals);

      const formattedData = {
        ...withTotals,
        date: new Date(data.date).toISOString(),
        services: withTotals.services.map(s => ({
          ...s,
          quantity: Number(s.quantity),
          unitPrice: Number(s.unitPrice)
        })),
        materials: withTotals.materials.map(m => ({
          ...m,
          quantity: Number(m.quantity),
          unitPrice: Number(m.unitPrice)
        }))
      };

      console.log("Sending data:", formattedData);
      await createBudgetMutation.mutateAsync(formattedData);
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar orçamento",
        variant: "destructive",
      });
    }
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome do Cliente</Label>
                  <Input {...form.register("clientName")} />
                  {form.formState.errors.clientName && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.clientName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Contato</Label>
                  <Input {...form.register("clientContact")} />
                  {form.formState.errors.clientContact && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.clientContact.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Input {...form.register("clientAddress")} />
                  {form.formState.errors.clientAddress && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.clientAddress.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input {...form.register("clientCity")} />
                  {form.formState.errors.clientCity && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.clientCity.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Local do Trabalho</Label>
                  <Input {...form.register("workLocation")} />
                  {form.formState.errors.workLocation && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.workLocation.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Serviço</Label>
                  <Select
                    onValueChange={(value) =>
                      form.setValue("serviceType", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electrical">Elétrica</SelectItem>
                      <SelectItem value="plumbing">Hidráulica</SelectItem>
                      <SelectItem value="construction">Construção</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.serviceType && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.serviceType.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.watch("date") && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch("date") ? (
                          formatDate(new Date(form.watch("date")))
                        ) : (
                          <span>Selecione uma data</span>
                        )}
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

              <div>
                <Label>Serviços</Label>
                <div className="space-y-4">
                  {services.fields.map((field, index) => (
                    <div key={field.id} className="space-y-2">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <FieldLabel
                            label="Nome do Serviço"
                            tooltip="Descreva o serviço a ser realizado"
                          />
                          <Input
                            {...form.register(`services.${index}.name` as const)}
                            placeholder="Ex: Instalação elétrica"
                          />
                        </div>
                        <div>
                          <FieldLabel
                            label="Quantidade"
                            tooltip="Quantidade de unidades ou horas do serviço"
                          />
                          <Input
                            {...form.register(`services.${index}.quantity` as const, {
                              valueAsNumber: true,
                            })}
                            type="number"
                            placeholder="Ex: 2"
                          />
                        </div>
                        <div>
                          <FieldLabel
                            label="Preço Unitário"
                            tooltip="Valor cobrado por unidade ou hora do serviço"
                          />
                          <Input
                            {...form.register(`services.${index}.unitPrice` as const, {
                              valueAsNumber: true,
                            })}
                            type="number"
                            placeholder="Ex: 150,00"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => services.remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      services.append({ name: "", quantity: 0, unitPrice: 0 })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Serviço
                  </Button>
                </div>
              </div>

              <div>
                <Label>Materiais</Label>
                <div className="space-y-4">
                  {materials.fields.map((field, index) => (
                    <div key={field.id} className="space-y-2">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <FieldLabel
                            label="Nome do Material"
                            tooltip="Especifique o material necessário"
                          />
                          <Input
                            {...form.register(`materials.${index}.name` as const)}
                            placeholder="Ex: Cabo elétrico 2.5mm"
                          />
                        </div>
                        <div>
                          <FieldLabel
                            label="Quantidade"
                            tooltip="Quantidade necessária do material"
                          />
                          <Input
                            {...form.register(`materials.${index}.quantity` as const, {
                              valueAsNumber: true,
                            })}
                            type="number"
                            placeholder="Ex: 100"
                          />
                        </div>
                        <div>
                          <FieldLabel
                            label="Preço Unitário"
                            tooltip="Valor por unidade do material"
                          />
                          <Input
                            {...form.register(`materials.${index}.unitPrice` as const, {
                              valueAsNumber: true,
                            })}
                            type="number"
                            placeholder="Ex: 2,50"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => materials.remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      materials.append({ name: "", quantity: 0, unitPrice: 0 })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Material
                  </Button>
                </div>
              </div>

              <div>
                <div className="space-y-2">
                  <FieldLabel
                    label="Mão de Obra"
                    tooltip="Valor total cobrado pela mão de obra do serviço"
                  />
                  <Input
                    {...form.register("laborCost")}
                    type="number"
                    placeholder="Ex: 500,00"
                  />
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