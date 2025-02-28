import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 0,
      retry: 1,
      retryDelay: 1000,
      refetchOnMount: true
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});