import { createContext, useContext, ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User } from "@shared/schema";

interface AuthMutationVariables {
  path: string;
  data: {
    username: string;
    password: string;
  };
}

interface AuthContextType {
  user: User | null | undefined;
  isLoading: boolean;
  loginMutation: ReturnType<typeof useMutation>;
  registerMutation: ReturnType<typeof useMutation>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "auth/user");
        return res.json();
      } catch (error) {
        if (error instanceof Response && error.status === 401) {
          return null;
        }
        throw error;
      }
    }
  });

  const loginMutation = useMutation({
    mutationFn: async (variables: AuthMutationVariables) => {
      const res = await apiRequest("POST", variables.path, variables.data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (variables: AuthMutationVariables) => {
      const res = await apiRequest("POST", variables.path, variables.data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const contextValue: AuthContextType = {
    user,
    isLoading,
    loginMutation,
    registerMutation,
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