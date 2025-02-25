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
import { Loader2, FileText, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function BudgetList() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

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
    // This is a simplified PDF generation
    // In a real app, you'd want to use a proper PDF library
    const content = `
      Budget for ${budget.clientName}
      Address: ${budget.clientAddress}, ${budget.clientCity}
      Contact: ${budget.clientContact}
      
      Services:
      ${budget.services
        .map(
          (s) =>
            `${s.name}: ${s.quantity} x $${s.unitPrice} = $${s.total}`
        )
        .join("\n")}
      
      Materials:
      ${budget.materials
        .map(
          (m) =>
            `${m.name}: ${m.quantity} x $${m.unitPrice} = $${m.total}`
        )
        .join("\n")}
      
      Labor Cost: $${budget.laborCost}
      Total Cost: $${budget.totalCost}
    `;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `budget-${budget.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Budgets</h1>
          <Button asChild>
            <Link href="/budgets/new">
              <Plus className="h-4 w-4 mr-2" />
              New Budget
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>All Budgets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <Input
                placeholder="Search by client or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
              <Select
                onValueChange={(value) =>
                  setStatusFilter(value === "all" ? null : value)
                }
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Client</th>
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Location</th>
                    <th className="text-left py-2">Total</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBudgets?.map((budget) => (
                    <tr key={budget.id} className="border-b">
                      <td className="py-2">{budget.clientName}</td>
                      <td className="py-2">
                        {new Date(budget.date).toLocaleDateString()}
                      </td>
                      <td className="py-2">{budget.clientCity}</td>
                      <td className="py-2">${budget.totalCost}</td>
                      <td className="py-2 capitalize">{budget.status}</td>
                      <td className="py-2">
                        <div className="flex gap-2">
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
                                Approve
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
                                Reject
                              </Button>
                            </>
                          )}
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
    </div>
  );
}