import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api.service';

export interface EmergencyReport {
  id?: string;
  type: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null;
  timestamp: Date;
  deviceInfo: {
    deviceName: string;
    platform: string;
    osVersion: string;
  };
  status?: 'pending' | 'sent' | 'acknowledged' | 'resolved';
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface EmergencyResponse {
  reportId: string;
  status: string;
  estimatedArrival?: string;
  assignedUnit?: string;
  message?: string;
}

class EmergencyService {
  private readonly STORAGE_KEY = 'pending_emergency_reports';

  /**
   * Envía un reporte de emergencia al servidor
   */
  async submitEmergencyReport(report: EmergencyReport): Promise<EmergencyResponse> {
    try {
      // Intentar enviar al servidor primero
      const response = await apiService.post<EmergencyResponse>('/emergency/report', {
        ...report,
        timestamp: report.timestamp.toISOString(),
      });

      // Si el envío fue exitoso, eliminar de reportes pendientes locales
      await this.removePendingReport(report.id || this.generateReportId(report));

      return response;
    } catch (error) {
      console.warn('Error enviando reporte al servidor, guardando localmente:', error);
      
      // Guardar localmente si falla el envío
      const reportWithId = {
        ...report,
        id: report.id || this.generateReportId(report),
        status: 'pending' as const,
      };
      
      await this.savePendingReport(reportWithId);
      
      // Retornar respuesta simulada para continuar el flujo
      return {
        reportId: reportWithId.id,
        status: 'saved_locally',
        message: 'Reporte guardado localmente. Se enviará cuando haya conexión.',
      };
    }
  }

  /**
   * Obtiene el historial de reportes del usuario
   */
  async getReportHistory(): Promise<EmergencyReport[]> {
    try {
      return await apiService.get<EmergencyReport[]>('/emergency/reports/my-history');
    } catch (error) {
      console.warn('Error obteniendo historial del servidor, usando cache local:', error);
      return await this.getLocalReports();
    }
  }

  /**
   * Obtiene reportes públicos para el mapa
   */
  async getPublicReports(): Promise<EmergencyReport[]> {
    try {
      return await apiService.get<EmergencyReport[]>('/emergency/reports/public');
    } catch (error) {
      console.warn('Error obteniendo reportes públicos:', error);
      return [];
    }
  }

  /**
   * Verifica el estado de un reporte específico
   */
  async getReportStatus(reportId: string): Promise<EmergencyResponse | null> {
    try {
      return await apiService.get<EmergencyResponse>(`/emergency/reports/${reportId}/status`);
    } catch (error) {
      console.warn('Error obteniendo estado del reporte:', error);
      return null;
    }
  }

  /**
   * Reintenta enviar reportes pendientes
   */
  async retryPendingReports(): Promise<{ success: number; failed: number }> {
    const pendingReports = await this.getPendingReports();
    let success = 0;
    let failed = 0;

    for (const report of pendingReports) {
      try {
        await this.submitEmergencyReport(report);
        success++;
      } catch (error) {
        failed++;
        console.warn(`Error reenviando reporte ${report.id}:`, error);
      }
    }

    return { success, failed };
  }

  /**
   * Obtiene reportes pendientes de envío
   */
  async getPendingReports(): Promise<EmergencyReport[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const reports = JSON.parse(stored) as EmergencyReport[];
      
      // Convertir timestamps de string a Date
      return reports.map(report => ({
        ...report,
        timestamp: new Date(report.timestamp),
      }));
    } catch (error) {
      console.error('Error obteniendo reportes pendientes:', error);
      return [];
    }
  }

  /**
   * Guarda un reporte pendiente localmente
   */
  private async savePendingReport(report: EmergencyReport): Promise<void> {
    try {
      const pending = await this.getPendingReports();
      const updated = [...pending, report];
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error guardando reporte pendiente:', error);
    }
  }

  /**
   * Elimina un reporte pendiente
   */
  private async removePendingReport(reportId: string): Promise<void> {
    try {
      const pending = await this.getPendingReports();
      const filtered = pending.filter(report => report.id !== reportId);
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error eliminando reporte pendiente:', error);
    }
  }

  /**
   * Obtiene reportes guardados localmente
   */
  private async getLocalReports(): Promise<EmergencyReport[]> {
    try {
      const pending = await this.getPendingReports();
      
      // Retornar solo los últimos 10 reportes para no sobrecargar
      return pending
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
    } catch (error) {
      console.error('Error obteniendo reportes locales:', error);
      return [];
    }
  }

  /**
   * Genera un ID único para el reporte
   */
  private generateReportId(report: EmergencyReport): string {
    const timestamp = report.timestamp.getTime();
    const random = Math.random().toString(36).substring(2, 8);
    return `ER-${timestamp}-${random}`;
  }

  /**
   * Limpia reportes antiguos (más de 30 días)
   */
  async cleanOldReports(): Promise<void> {
    try {
      const pending = await this.getPendingReports();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const filtered = pending.filter(
        report => new Date(report.timestamp) > thirtyDaysAgo
      );

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error limpiando reportes antiguos:', error);
    }
  }

  /**
   * Obtiene estadísticas de reportes
   */
  async getReportStats(): Promise<{
    total: number;
    pending: number;
    thisMonth: number;
    byType: Record<string, number>;
  }> {
    try {
      const reports = await this.getLocalReports();
      const pending = await this.getPendingReports();
      
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const thisMonthReports = reports.filter(
        report => new Date(report.timestamp) >= thisMonth
      );

      const byType = reports.reduce((acc, report) => {
        acc[report.type] = (acc[report.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        total: reports.length,
        pending: pending.length,
        thisMonth: thisMonthReports.length,
        byType,
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        total: 0,
        pending: 0,
        thisMonth: 0,
        byType: {},
      };
    }
  }
}

export const emergencyService = new EmergencyService();