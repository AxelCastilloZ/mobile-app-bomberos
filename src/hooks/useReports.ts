import { reportsService } from '@/services/reports';
import { CreateReportData, ReportFilters, UpdateReportData } from '@/types/reports';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Query Keys
export const reportKeys = {
  all: ['reports'] as const,
  myReports: (filters?: ReportFilters) =>
    [...reportKeys.all, 'my', filters] as const,
  active: (filters?: ReportFilters) =>
    [...reportKeys.all, 'active', filters] as const,
  detail: (id: number) =>
    [...reportKeys.all, 'detail', id] as const,
};

/**
 * Hook para crear un reporte de emergencia
 * IMPORTANTE: Requiere latitud y longitud (español - backend)
 */
export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateReportData) => {
      console.log('🔵 [useCreateReport] Iniciando creación de reporte');
      console.log('🔵 [useCreateReport] Type:', data.type);
      console.log('🔵 [useCreateReport] Coords:', {
        lat: data.latitud,
        lng: data.longitud,
      });

      // Validación antes de enviar
      if (!data.latitud || !data.longitud) {
        throw new Error('Se requiere ubicación para crear el reporte');
      }

      const response = await reportsService.createReport(data);

      if (!response.data) {
        throw new Error(response.error || 'Error creando reporte');
      }

      console.log('✅ [useCreateReport] Reporte creado:', response.data.id);
      return response;
    },
    onSuccess: (response) => {
      console.log('🟢 [useCreateReport] onSuccess ejecutado');

      // Invalidar caché para actualizar listas
      queryClient.invalidateQueries({ queryKey: reportKeys.all });

      console.log('✅ Caché actualizado');
    },
    onError: (error) => {
      console.error('🔴 [useCreateReport] Error:', error);
    },
  });
}

/**
 * Hook para obtener mis reportes (requiere auth)
 */
export function useMyReports(filters?: ReportFilters) {
  return useQuery({
    queryKey: reportKeys.myReports(filters),
    queryFn: async () => {
      console.log('🔵 [useMyReports] Obteniendo reportes...');

      const response = await reportsService.getMyReports(filters);

      if (!response.data) {
        throw new Error(response.error || 'Error obteniendo reportes');
      }

      console.log('✅ [useMyReports] Reportes obtenidos:', response.data.length);
      return response.data;
    },
    // Solo hacer query si hay usuario autenticado
    enabled: true,
  });
}

/**
 * Hook para obtener reportes activos (público)
 */
export function useActiveReports(filters?: ReportFilters) {
  return useQuery({
    queryKey: reportKeys.active(filters),
    queryFn: async () => {
      console.log('🔵 [useActiveReports] Obteniendo reportes activos...');

      const response = await reportsService.getActiveReports(filters);

      if (!response.data) {
        throw new Error(response.error || 'Error obteniendo reportes activos');
      }

      console.log('✅ [useActiveReports] Reportes activos:', response.data.length);
      return response.data;
    },
    // Refetch cada 30 segundos (reportes en tiempo real)
    refetchInterval: 30000,
  });
}

/**
 * Hook para obtener un reporte por ID (público)
 */
export function useReportById(id: number) {
  return useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: async () => {
      console.log('🔵 [useReportById] Obteniendo reporte:', id);

      const response = await reportsService.getReportById(id);

      if (!response.data) {
        throw new Error(response.error || 'Reporte no encontrado');
      }

      console.log('✅ [useReportById] Reporte obtenido:', response.data.id);
      return response.data;
    },
    enabled: !!id, // Solo hacer query si hay ID válido
  });
}

/**
 * Hook para actualizar un reporte (admin/bombero)
 */
export function useUpdateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateReportData }) => {
      console.log('🔵 [useUpdateReport] Actualizando reporte:', id);

      const response = await reportsService.updateReport(id, data);

      if (!response.data) {
        throw new Error(response.error || 'Error actualizando reporte');
      }

      console.log('✅ [useUpdateReport] Reporte actualizado:', response.data.id);
      return response;
    },
    onSuccess: (response, variables) => {
      console.log('🟢 [useUpdateReport] onSuccess ejecutado');

      // Invalidar caché del reporte específico y listas
      queryClient.invalidateQueries({ queryKey: reportKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: reportKeys.all });

      console.log('✅ Caché actualizado');
    },
    onError: (error) => {
      console.error('🔴 [useUpdateReport] Error:', error);
    },
  });
}
