import { Switch, Route, useParams } from "wouter";
import { queryClient } from "./lib/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/use-toast.tsx";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import NewBudget from "@/pages/budget/new";
import BudgetList from "@/pages/budget/list";
import EditBudget from "@/pages/budget/edit";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute
        path="/budgets/edit/:budgetId"
        component={() => {
          const params = useParams();
          return <EditBudget params={params} />;
        }}
      />
      <ProtectedRoute path="/budgets/new" component={NewBudget} />
      <ProtectedRoute path="/budgets" component={BudgetList} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
