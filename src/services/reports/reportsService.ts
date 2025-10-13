import {
    CreateReportData,
    EmergencyReport,
    ReportFilters,
    UpdateReportData,
} from '../../types/reports';
import { apiClient, ApiResponse } from '../api/apiClient';

/**
 * Servicio para manejo de reportes de emergencia
 */
export class ReportsService {
  private readonly endpoints = {
    createAuthenticated: '/emergency-reports',        // ✅ Con JWT
    createAnonymous: '/emergency-reports/anonymous',  // ✅ Sin JWT
    myReports: '/emergency-reports/my-reports',
    active: '/emergency-reports/active',
    byId: (id: number) => `/emergency-reports/${id}/public`,
    complete: (id: number) => `/emergency-reports/${id}/complete`,
    update: (id: number) => `/emergency-reports/${id}`,
  };

  /**
   * Crear reporte de emergencia
   * - Si tiene mobileUserId → usa endpoint anónimo (/anonymous)
   * - Si NO tiene mobileUserId → usa endpoint autenticado (/) con JWT
   */
  async createReport(data: CreateReportData): Promise<ApiResponse<EmergencyReport>> {
    console.log('🟡 [ReportsService] Creando reporte...');
    console.log('🟡 [ReportsService] Type:', data.type);
    console.log('🟡 [ReportsService] Coords:', {
      lat: data.latitud,
      lng: data.longitud,
    });

    // Validación explícita de coordenadas
    if (!data.latitud || !data.longitud) {
      console.error('❌ [ReportsService] Faltan coordenadas');
      return {
        error: 'Se requiere ubicación para crear el reporte',
        statusCode: 400,
      };
    }

    // ✅ LÓGICA INTELIGENTE: Decidir qué endpoint usar
    let endpoint: string;

    if (data.mobileUserId) {
      // Usuario anónimo - Endpoint sin autenticación
      endpoint = this.endpoints.createAnonymous;
      console.log('📱 [ReportsService] Usando endpoint ANÓNIMO');
    } else {
      // Usuario autenticado - Endpoint con JWT
      endpoint = this.endpoints.createAuthenticated;
      console.log('🔐 [ReportsService] Usando endpoint AUTENTICADO (requiere JWT)');
    }

    const response = await apiClient.post<EmergencyReport>(endpoint, data);

    if (response.data) {
      console.log('✅ [ReportsService] Reporte creado:', response.data.id);
    } else {
      console.error('❌ [ReportsService] Error:', response.error);
    }

    return response;
  }

  /**
   * Obtener mis reportes (requiere auth)
   */
  async getMyReports(filters?: ReportFilters): Promise<ApiResponse<EmergencyReport[]>> {
    console.log('🟡 [ReportsService] Obteniendo mis reportes...');

    const response = await apiClient.get<EmergencyReport[]>(
      this.endpoints.myReports,
      { params: filters }
    );

    if (response.data) {
      console.log('✅ [ReportsService] Reportes encontrados:', response.data.length);
    }

    return response;
  }

  /**
   * Obtener reportes activos (público)
   */
  async getActiveReports(filters?: ReportFilters): Promise<ApiResponse<EmergencyReport[]>> {
    console.log('🟡 [ReportsService] Obteniendo reportes activos...');

    const response = await apiClient.get<EmergencyReport[]>(
      this.endpoints.active,
      { params: filters }
    );

    if (response.data) {
      console.log('✅ [ReportsService] Reportes activos:', response.data.length);
    }

    return response;
  }

  /**
   * Obtener reporte por ID (público)
   */
  async getReportById(id: number): Promise<ApiResponse<EmergencyReport>> {
    console.log('🟡 [ReportsService] Obteniendo reporte:', id);

    const response = await apiClient.get<EmergencyReport>(
      this.endpoints.byId(id)
    );

    if (response.data) {
      console.log('✅ [ReportsService] Reporte obtenido:', response.data.id);
    }

    return response;
  }

  /**
   * Obtener reporte completo con detalles (requiere auth bombero)
   */
  async getCompleteReport(id: number): Promise<ApiResponse<EmergencyReport>> {
    console.log('🟡 [ReportsService] Obteniendo reporte completo:', id);

    const response = await apiClient.get<EmergencyReport>(
      this.endpoints.complete(id)
    );

    return response;
  }

  /**
   * Actualizar reporte (admin/bombero)
   */
  async updateReport(
    id: number,
    data: UpdateReportData
  ): Promise<ApiResponse<EmergencyReport>> {
    console.log('🟡 [ReportsService] Actualizando reporte:', id);

    const response = await apiClient.patch<EmergencyReport>(
      this.endpoints.update(id),
      data
    );

    if (response.data) {
      console.log('✅ [ReportsService] Reporte actualizado:', response.data.id);
    }

    return response;
  }
}

export const reportsService = new ReportsService();
