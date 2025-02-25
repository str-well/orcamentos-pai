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
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type BudgetFormData = Omit<InsertBudget, 'services' | 'materials'> & {
  services: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total?: number;
  }>;
  materials: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total?: number;
  }>;
};

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
      date: new Date().toISOString(),
      services: [],
      materials: [],
      laborCost: 0,
      totalCost: 0,
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
      const res = await apiRequest("POST", "/api/budgets", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Sucesso",
        description: "Orçamento criado com sucesso",
      });
      setLocation("/budgets");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
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
    const laborCost = parseFloat(data.laborCost.toString()) || 0;

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
      totalCost: servicesTotal + materialsTotal + laborCost,
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Orçamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((data) => {
              const formattedData = calculateTotals(data);
              console.log('Submitting data:', formattedData);
              createBudgetMutation.mutate(formattedData);
            })}
            className="space-y-8"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nome do Cliente</Label>
                <Input {...form.register("clientName")} />
                {form.formState.errors.clientName && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.clientName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientContact">Contato</Label>
                <Input {...form.register("clientContact")} />
                {form.formState.errors.clientContact && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.clientContact.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientAddress">Endereço</Label>
                <Input {...form.register("clientAddress")} />
                {form.formState.errors.clientAddress && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.clientAddress.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientCity">Cidade</Label>
                <Input {...form.register("clientCity")} />
                {form.formState.errors.clientCity && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.clientCity.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="workLocation">Local do Trabalho</Label>
                <Select
                  onValueChange={(value) =>
                    form.setValue("workLocation", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de local" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartamento</SelectItem>
                    <SelectItem value="house">Casa</SelectItem>
                    <SelectItem value="commercial">Comercial</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.workLocation && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.workLocation.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceType">Tipo de Serviço</Label>
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
            </div>

            <div>
              <Label>Serviços</Label>
              <div className="space-y-4">
                {services.fields.map((field, index) => (
                  <div key={field.id} className="flex gap-4">
                    <Input
                      {...form.register(`services.${index}.name` as const)}
                      placeholder="Nome do serviço"
                    />
                    <Input
                      {...form.register(`services.${index}.quantity` as const, {
                        valueAsNumber: true,
                      })}
                      type="number"
                      placeholder="Quantidade"
                    />
                    <Input
                      {...form.register(`services.${index}.unitPrice` as const, {
                        valueAsNumber: true,
                      })}
                      type="number"
                      placeholder="Preço unitário"
                    />
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
                  <div key={field.id} className="flex gap-4">
                    <Input
                      {...form.register(`materials.${index}.name` as const)}
                      placeholder="Nome do material"
                    />
                    <Input
                      {...form.register(`materials.${index}.quantity` as const, {
                        valueAsNumber: true,
                      })}
                      type="number"
                      placeholder="Quantidade"
                    />
                    <Input
                      {...form.register(`materials.${index}.unitPrice` as const, {
                        valueAsNumber: true,
                      })}
                      type="number"
                      placeholder="Preço unitário"
                    />
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

            <div className="space-y-2">
              <Label htmlFor="laborCost">Custo de Mão de Obra</Label>
              <Input
                {...form.register("laborCost", {
                  valueAsNumber: true,
                })}
                type="number"
              />
              {form.formState.errors.laborCost && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.laborCost.message}
                </p>
              )}
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
    </div>
  );
}