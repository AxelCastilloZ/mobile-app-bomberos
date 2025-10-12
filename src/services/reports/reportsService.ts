import { apiClient, ApiResponse } from '../api/apiClient';

// Types
export interface EmergencyReport {
  id: number;
  type: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  mobileUserId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportData {
  type: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

export class ReportsService {
  private readonly endpoints = {
    create: '/emergency-reports',
    myReports: '/emergency-reports/my-reports',
    active: '/emergency-reports/active',
    byId: (id: number) => `/emergency-reports/${id}/public`,
    complete: (id: number) => `/emergency-reports/${id}/complete`,
  };

  /**
   * Crear reporte de emergencia
   */
  async createReport(data: CreateReportData): Promise<ApiResponse<EmergencyReport>> {
    console.log('🟡 [ReportsService] createReport llamado');
    console.log('🟡 [ReportsService] Data:', JSON.stringify(data, null, 2));
    console.log('🟡 [ReportsService] Endpoint:', this.endpoints.create);

    const response = await apiClient.post<EmergencyReport>(
      this.endpoints.create,
      data
    );

    console.log('🟡 [ReportsService] Respuesta:', JSON.stringify(response, null, 2));

    if (response.data) {
      console.log('🟡 [ReportsService] Reporte creado exitosamente:', response.data.id);
    } else {
      console.error('🟡 [ReportsService] Error en response:', response.error);
    }

    return response;
  }

  /**
   * Obtener mis reportes (requiere auth)
   */
  async getMyReports(): Promise<ApiResponse<EmergencyReport[]>> {
    console.log('[ReportsService] Obteniendo mis reportes...');

    const response = await apiClient.get<EmergencyReport[]>(
      this.endpoints.myReports
    );

    if (response.data) {
      console.log('[ReportsService] Reportes encontrados:', response.data.length);
    }

    return response;
  }

  /**
   * Obtener reportes activos (público)
   */
  async getActiveReports(): Promise<ApiResponse<EmergencyReport[]>> {
    console.log('[ReportsService] Obteniendo reportes activos...');

    const response = await apiClient.get<EmergencyReport[]>(
      this.endpoints.active
    );

    if (response.data) {
      console.log('[ReportsService] Reportes activos:', response.data.length);
    }

    return response;
  }

  /**
   * Obtener reporte por ID (público)
   */
  async getReportById(id: number): Promise<ApiResponse<EmergencyReport>> {
    console.log('[ReportsService] Obteniendo reporte:', id);

    const response = await apiClient.get<EmergencyReport>(
      this.endpoints.byId(id)
    );

    return response;
  }

  /**
   * Obtener reporte completo con detalles (requiere auth bombero)
   */
  async getCompleteReport(id: number): Promise<ApiResponse<EmergencyReport>> {
    console.log('[ReportsService] Obteniendo reporte completo:', id);

    const response = await apiClient.get<EmergencyReport>(
      this.endpoints.complete(id)
    );

    return response;
  }
}

export const reportsService = new ReportsService();
