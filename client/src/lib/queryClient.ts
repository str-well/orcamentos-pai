import { QueryClient, QueryFunction } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      const errorData = await res.text();
      errorMessage = errorData || errorMessage;
    } catch (e) {
      console.error('Error parsing error response:', e);
    }
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest(method: string, path: string, data?: any) {
  // Mapeamento de endpoints
  const endpoints = {
    'register': 'auth/v1/signup',
    'login': 'auth/v1/token?grant_type=password',
    'logout': 'auth/v1/logout',
    // Adicione outros endpoints conforme necessário
  };

  const finalPath = endpoints[path] || path;
  
  const response = await fetch(`${API_URL}/${finalPath}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'include',
    mode: 'cors'
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Erro na requisição');
  }

  return response;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error('Query function error:', error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: 1,
      retryDelay: 1000,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});