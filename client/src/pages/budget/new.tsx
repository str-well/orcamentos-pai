import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { insertBudgetSchema } from "@shared/schema";
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

export default function NewBudget() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm({
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
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/budgets", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Success",
        description: "Budget created successfully",
      });
      setLocation("/budgets");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const calculateTotals = (data: any) => {
    const servicesTotal = data.services.reduce(
      (sum: number, item: any) => sum + (item.quantity * item.unitPrice || 0),
      0
    );
    const materialsTotal = data.materials.reduce(
      (sum: number, item: any) => sum + (item.quantity * item.unitPrice || 0),
      0
    );
    const laborCost = parseFloat(data.laborCost) || 0;
    return {
      ...data,
      services: data.services.map((s: any) => ({
        ...s,
        total: (s.quantity * s.unitPrice) || 0,
      })),
      materials: data.materials.map((m: any) => ({
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
          <CardTitle>Create New Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((data) => {
              createBudgetMutation.mutate(calculateTotals(data));
            })}
            className="space-y-8"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input {...form.register("clientName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientContact">Contact Info</Label>
                <Input {...form.register("clientContact")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientAddress">Address</Label>
                <Input {...form.register("clientAddress")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientCity">City</Label>
                <Input {...form.register("clientCity")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workLocation">Work Location</Label>
                <Select
                  onValueChange={(value) =>
                    form.setValue("workLocation", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceType">Service Type</Label>
                <Select
                  onValueChange={(value) =>
                    form.setValue("serviceType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="construction">Construction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Services</Label>
              <div className="space-y-4">
                {services.fields.map((field, index) => (
                  <div key={field.id} className="flex gap-4">
                    <Input
                      {...form.register(`services.${index}.name`)}
                      placeholder="Service name"
                    />
                    <Input
                      {...form.register(`services.${index}.quantity`)}
                      type="number"
                      placeholder="Quantity"
                    />
                    <Input
                      {...form.register(`services.${index}.unitPrice`)}
                      type="number"
                      placeholder="Unit price"
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
                  Add Service
                </Button>
              </div>
            </div>

            <div>
              <Label>Materials</Label>
              <div className="space-y-4">
                {materials.fields.map((field, index) => (
                  <div key={field.id} className="flex gap-4">
                    <Input
                      {...form.register(`materials.${index}.name`)}
                      placeholder="Material name"
                    />
                    <Input
                      {...form.register(`materials.${index}.quantity`)}
                      type="number"
                      placeholder="Quantity"
                    />
                    <Input
                      {...form.register(`materials.${index}.unitPrice`)}
                      type="number"
                      placeholder="Unit price"
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
                  Add Material
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="laborCost">Labor Cost</Label>
              <Input
                {...form.register("laborCost")}
                type="number"
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/budgets")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createBudgetMutation.isPending}
              >
                {createBudgetMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Budget
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
