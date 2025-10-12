import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Caché por 5 minutos
      staleTime: 5 * 60 * 1000,
      // Mantener en caché por 10 minutos
      gcTime: 10 * 60 * 1000,
      // Reintentar 3 veces si falla
      retry: 3,
      // No refetch al volver a la ventana (mobile no tiene window focus)
      refetchOnWindowFocus: false,
      // Refetch cuando la red se reconecta
      refetchOnReconnect: true,
    },
    mutations: {
      // Reintentar 1 vez si falla
      retry: 1,
    },
  },
});
