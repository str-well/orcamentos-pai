import { createContext, useContext, ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null | undefined;
  isLoading: boolean;
  loginMutation: ReturnType<typeof useMutation>;
  registerMutation: ReturnType<typeof useMutation>;
  logoutMutation: ReturnType<typeof useMutation>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    staleTime: 0, // Sempre buscar dados frescos
    refetchOnMount: true // Recarregar ao montar
  });

  const loginMutation = useMutation({
    mutationFn: async ({ data }: { data: { username: string; password: string } }) => {
      const { data: result, error } = await supabase.auth.signInWithPassword({
        email: data.username,
        password: data.password,
      });
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (variables: { path: string; data: { username: string; password: string } }) => {
      const { data: result, error } = await supabase.auth.signUp({
        email: variables.data.username,
        password: variables.data.password,
      });
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await supabase.auth.signOut();
    },
    onSuccess: () => {
      queryClient.clear();
    }
  });

  const contextValue: AuthContextType = {
    user,
    isLoading,
    loginMutation,
    registerMutation,
    logoutMutation
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 