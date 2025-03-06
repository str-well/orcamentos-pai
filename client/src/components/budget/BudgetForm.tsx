import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Budget } from "@shared/schema";
import { useEffect } from "react";

interface BudgetFormProps {
    initialData?: Budget;
    onSubmit: (data: any) => void;
    isLoading?: boolean;
}

const budgetSchema = z.object({
    client_name: z.string().min(1, "Nome do cliente é obrigatório"),
    client_address: z.string().min(1, "Endereço é obrigatório"),
    client_city: z.string().min(1, "Cidade é obrigatória"),
    client_contact: z.string().min(1, "Contato é obrigatório"),
    work_location: z.string().min(1, "Local do serviço é obrigatório"),
    service_type: z.string().min(1, "Tipo de serviço é obrigatório"),
    date: z.string().min(1, "Data é obrigatória"),
    services: z.array(z.object({
        name: z.string().min(1, "Nome do serviço é obrigatório"),
        quantity: z.number().min(1, "Quantidade deve ser maior que 0"),
        unitPrice: z.number().min(0, "Preço unitário deve ser maior ou igual a 0"),
        total: z.number(),
    })),
    materials: z.array(z.object({
        name: z.string().min(1, "Nome do material é obrigatório"),
        quantity: z.number().min(1, "Quantidade deve ser maior que 0"),
        unitPrice: z.number().min(0, "Preço unitário deve ser maior ou igual a 0"),
        total: z.number(),
    })),
    labor_cost: z.number().min(0, "Custo de mão de obra deve ser maior ou igual a 0"),
    total_cost: z.number(),
    status: z.string().min(1, "Status é obrigatório"),
});

export function BudgetForm({ initialData, onSubmit, isLoading }: BudgetFormProps) {
    console.log('InitialData recebido no form:', initialData);

    const form = useForm<z.infer<typeof budgetSchema>>({
        resolver: zodResolver(budgetSchema),
        defaultValues: {
            client_name: initialData?.client_name || "",
            client_address: initialData?.client_address || "",
            client_city: initialData?.client_city || "",
            client_contact: initialData?.client_contact || "",
            work_location: initialData?.work_location || "",
            service_type: initialData?.service_type || "",
            date: initialData?.date || new Date().toISOString().split('T')[0],
            services: Array.isArray(initialData?.services) ? initialData.services.map(service => ({
                name: service.name,
                quantity: Number(service.quantity),
                unitPrice: Number(service.unitPrice),
                total: Number(service.total)
            })) : [],
            materials: Array.isArray(initialData?.materials) ? initialData.materials.map(material => ({
                name: material.name,
                quantity: Number(material.quantity),
                unitPrice: Number(material.unitPrice),
                total: Number(material.total)
            })) : [],
            labor_cost: Number(initialData?.labor_cost) || 0,
            total_cost: Number(initialData?.total_cost) || 0,
            status: initialData?.status || "pending",
        },
    });

    console.log('Valores padrão do form:', form.getValues());

    useEffect(() => {
        if (initialData) {
            calculateTotals();
        }
    }, [initialData]);

    const calculateTotals = () => {
        const services = form.getValues("services");
        const materials = form.getValues("materials");
        const laborCost = form.getValues("labor_cost") || 0;

        const servicesTotal = services.reduce((acc, service) =>
            acc + (service.quantity * service.unitPrice), 0);

        const materialsTotal = materials.reduce((acc, material) =>
            acc + (material.quantity * material.unitPrice), 0);

        const total = servicesTotal + materialsTotal + laborCost;
        form.setValue("total_cost", total);
    };

    const addService = () => {
        const services = form.getValues("services");
        form.setValue("services", [
            ...services,
            { name: "", quantity: 1, unitPrice: 0, total: 0 },
        ]);
    };

    const removeService = (index: number) => {
        const services = form.getValues("services");
        form.setValue("services", services.filter((_, i) => i !== index));
        calculateTotals();
    };

    const addMaterial = () => {
        const materials = form.getValues("materials");
        form.setValue("materials", [
            ...materials,
            { name: "", quantity: 1, unitPrice: 0, total: 0 },
        ]);
    };

    const removeMaterial = (index: number) => {
        const materials = form.getValues("materials");
        form.setValue("materials", materials.filter((_, i) => i !== index));
        calculateTotals();
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="client_name">Nome do Cliente</Label>
                            <Input
                                {...form.register("client_name")}
                                id="client_name"
                                placeholder="Nome completo"
                            />
                            {form.formState.errors.client_name && (
                                <p className="text-sm text-red-500">
                                    {form.formState.errors.client_name.message}
                                </p>
                            )}
                        </div>

                        {/* Adicione campos similares para os outros dados do cliente */}
                        {/* ... */}

                        <div className="col-span-full">
                            <h3 className="text-lg font-semibold mb-4">Serviços</h3>
                            <div className="space-y-4">
                                {form.watch("services")?.map((_, index) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                        <div>
                                            <Label>Nome do Serviço</Label>
                                            <Input
                                                {...form.register(`services.${index}.name`)}
                                                placeholder="Descrição do serviço"
                                            />
                                        </div>
                                        <div>
                                            <Label>Quantidade</Label>
                                            <Input
                                                type="number"
                                                {...form.register(`services.${index}.quantity`, {
                                                    valueAsNumber: true,
                                                    onChange: () => calculateTotals(),
                                                })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Preço Unitário</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                {...form.register(`services.${index}.unitPrice`, {
                                                    valueAsNumber: true,
                                                    onChange: () => calculateTotals(),
                                                })}
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeService(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" onClick={addService}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Adicionar Serviço
                                </Button>
                            </div>
                        </div>

                        {/* Seção de Materiais */}
                        <div className="col-span-full">
                            <Label>Materiais</Label>
                            <div className="space-y-4">
                                {form.watch("materials").map((_, index) => (
                                    <Card key={index}>
                                        <CardContent className="p-4">
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div>
                                                    <Label>Nome do Material</Label>
                                                    <Input
                                                        {...form.register(`materials.${index}.name`)}
                                                        placeholder="Ex: Tinta"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Quantidade</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        {...form.register(`materials.${index}.quantity`, {
                                                            valueAsNumber: true,
                                                            onChange: () => {
                                                                const materials = form.getValues("materials");
                                                                const quantity = materials[index].quantity;
                                                                const unitPrice = materials[index].unitPrice;
                                                                form.setValue(`materials.${index}.total`, quantity * unitPrice);
                                                                calculateTotals();
                                                            },
                                                        })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Preço Unitário</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        {...form.register(`materials.${index}.unitPrice`, {
                                                            valueAsNumber: true,
                                                            onChange: () => {
                                                                const materials = form.getValues("materials");
                                                                const quantity = materials[index].quantity;
                                                                const unitPrice = materials[index].unitPrice;
                                                                form.setValue(`materials.${index}.total`, quantity * unitPrice);
                                                                calculateTotals();
                                                            },
                                                        })}
                                                    />
                                                </div>
                                                <div className="flex items-end justify-between">
                                                    <div>
                                                        <Label>Total</Label>
                                                        <p className="text-lg font-semibold">
                                                            R$ {form.watch(`materials.${index}.total`).toFixed(2)}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            const materials = form.getValues("materials");
                                                            materials.splice(index, 1);
                                                            form.setValue("materials", materials);
                                                            calculateTotals();
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        const materials = form.getValues("materials");
                                        materials.push({
                                            name: "",
                                            quantity: 0,
                                            unitPrice: 0,
                                            total: 0,
                                        });
                                        form.setValue("materials", materials);
                                    }}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Adicionar Material
                                </Button>
                            </div>
                        </div>

                        <div className="col-span-full">
                            <div className="flex justify-end space-x-4 items-center">
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={form.watch("status")}
                                        onValueChange={(value) => form.setValue("status", value)}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Selecione o status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pendente</SelectItem>
                                            <SelectItem value="approved">Aprovado</SelectItem>
                                            <SelectItem value="rejected">Rejeitado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="labor_cost">Mão de Obra</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        {...form.register("labor_cost", {
                                            valueAsNumber: true,
                                            onChange: () => calculateTotals(),
                                        })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Total</Label>
                                    <p className="text-2xl font-bold">
                                        R$ {Number(form.watch("total_cost") || 0).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? "Atualizar Orçamento" : "Criar Orçamento"}
                </Button>
            </div>
        </form>
    );
} 