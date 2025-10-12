import { CreateReportData, reportsService } from '@/services/reports';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Query Keys
export const reportKeys = {
  all: ['reports'] as const,
  myReports: () => [...reportKeys.all, 'my'] as const,
  active: () => [...reportKeys.all, 'active'] as const,
  detail: (id: number) => [...reportKeys.all, 'detail', id] as const,
};

/**
 * Hook para crear un reporte de emergencia
 */
export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateReportData) => {
      console.log('🔵 [useCreateReport] Hook llamado con data:', data);
      const response = await reportsService.createReport(data);
      console.log('🔵 [useCreateReport] Respuesta recibida:', response);
      return response;
    },
    onSuccess: (response) => {
      console.log('🟢 [useCreateReport] onSuccess ejecutado');
      if (response.data) {
        // Invalidar caché de mis reportes y reportes activos
        queryClient.invalidateQueries({ queryKey: reportKeys.myReports() });
        queryClient.invalidateQueries({ queryKey: reportKeys.active() });

        console.log('✅ Reporte creado y caché actualizado');
      }
    },
    onError: (error) => {
      console.error('🔴 [useCreateReport] onError ejecutado:', error);
    },
  });
}

/**
 * Hook para obtener mis reportes (requiere auth)
 */
export function useMyReports() {
  return useQuery({
    queryKey: reportKeys.myReports(),
    queryFn: async () => {
      const response = await reportsService.getMyReports();
      if (!response.data) {
        throw new Error(response.error || 'Error obteniendo reportes');
      }
      return response.data;
    },
    // Solo hacer query si hay usuario autenticado
    enabled: true,
  });
}

/**
 * Hook para obtener reportes activos (público)
 */
export function useActiveReports() {
  return useQuery({
    queryKey: reportKeys.active(),
    queryFn: async () => {
      const response = await reportsService.getActiveReports();
      if (!response.data) {
        throw new Error(response.error || 'Error obteniendo reportes activos');
      }
      return response.data;
    },
    // Refetch cada 30 segundos (reportes en tiempo real)
    refetchInterval: 30000,
  });
}

/**
 * Hook para obtener un reporte por ID
 */
export function useReportById(id: number) {
  return useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: async () => {
      const response = await reportsService.getReportById(id);
      if (!response.data) {
        throw new Error(response.error || 'Reporte no encontrado');
      }
      return response.data;
    },
    enabled: !!id, // Solo hacer query si hay ID
  });
}
