/**
 * Estado de un reporte de emergencia
 */
export type ReportStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

/**
 * Tipos de emergencia soportados
 */
export type EmergencyType = 'FIRE' | 'ACCIDENT' | 'MEDICAL' | 'RESCUE' | 'OTHER';

/**
 * Reporte de emergencia completo (desde backend)
 * IMPORTANTE: Backend usa latitud/longitud en español
 */
export interface EmergencyReport {
  id: number;
  type: string;
  description?: string;
  latitud: number;   // ✅ Español (backend)
  longitud: number;  // ✅ Español (backend)
  address?: string;
  status: ReportStatus;
  mobileUserId: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Datos para crear un nuevo reporte
 * IMPORTANTE: Backend requiere latitud/longitud en español
 */
export interface CreateReportData {
  type: string;
  latitud: number;
  longitud: number;
  mobileUserId?: number; // ✅ Agregar esto
}

/**
 * Datos para actualizar un reporte (admin/bombero)
 */
export interface UpdateReportData {
  status?: ReportStatus;
  description?: string;
  notes?: string;
}

/**
 * Filtros para búsqueda de reportes
 */
export interface ReportFilters {
  status?: ReportStatus;
  type?: EmergencyType;
  startDate?: string;
  endDate?: string;
}

/**
 * Estadísticas de reportes
 */
export interface ReportStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  closed: number;
}
