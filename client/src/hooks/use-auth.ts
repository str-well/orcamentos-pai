import React, { createContext, useContext, ReactNode } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabaseAuth } from './use-supabase-auth';

interface AuthContextType {
  user: any;
  loginMutation: any;
  registerMutation: any;
  logoutMutation: any;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, signIn, signUp, signOut } = useSupabaseAuth();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const { error } = await signIn(data.username, data.password);
      if (error) throw error;
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const { error } = await signUp(data.username, data.password);
      if (error) throw error;
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await signOut();
    },
    onSuccess: () => {
      queryClient.clear();
    }
  });

  const value = {
    user,
    loginMutation,
    registerMutation,
    logoutMutation
  };

  return React.createElement(
    AuthContext.Provider,
    { value },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 