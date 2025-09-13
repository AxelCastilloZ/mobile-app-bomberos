
import { apiService } from './api.service';
import { storageService } from './storage.service';

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

  async submitEmergencyReport(report: EmergencyReport): Promise<EmergencyResponse> {
    try {
      console.log('EmergencyService: Enviando reporte...');
      
      // Verificar si el servidor está disponible
      const serverAvailable = await apiService.isServerAvailable();
      
      if (serverAvailable) {
        // Enviar al servidor
        const response = await apiService.post<EmergencyResponse>('/app-mobile/emergency/report', {
          ...report,
          timestamp: report.timestamp.toISOString(),
        });

        console.log('EmergencyService: Reporte enviado exitosamente');
        
        // Remover de reportes pendientes si existía
        if (report.id) {
          await this.removePendingReport(report.id);
        }

        return response;
      } else {
        // Guardar localmente
        console.log('EmergencyService: Servidor no disponible, guardando localmente');
        
        const reportWithId = {
          ...report,
          id: report.id || this.generateReportId(report),
          status: 'pending' as const,
        };
        
        await this.savePendingReport(reportWithId);
        
        return {
          reportId: reportWithId.id,
          status: 'saved_locally',
          message: 'Reporte guardado localmente. Se enviará cuando haya conexión.',
        };
      }
    } catch (error) {
      console.error('EmergencyService: Error enviando reporte:', error);
      
      // Si falla el envío, guardar localmente
      const reportWithId = {
        ...report,
        id: report.id || this.generateReportId(report),
        status: 'pending' as const,
      };
      
      await this.savePendingReport(reportWithId);
      
      throw new Error('No se pudo enviar el reporte. Se guardó localmente para envío posterior.');
    }
  }

  async getReportHistory(): Promise<EmergencyReport[]> {
    try {
      const serverAvailable = await apiService.isServerAvailable();
      
      if (serverAvailable) {
        return await apiService.get<EmergencyReport[]>('/app-mobile/emergency/reports/my-history');
      } else {
        // Devolver reportes locales
        return await this.getLocalReports();
      }
    } catch (error) {
      console.warn('EmergencyService: Error obteniendo historial, usando cache local:', error);
      return await this.getLocalReports();
    }
  }

  async getPublicReports(): Promise<EmergencyReport[]> {
    try {
      const serverAvailable = await apiService.isServerAvailable();
      
      if (!serverAvailable) {
        return [];
      }

      return await apiService.get<EmergencyReport[]>('/app-mobile/emergency/reports/public');
    } catch (error) {
      console.warn('EmergencyService: Error obteniendo reportes públicos:', error);
      return [];
    }
  }

  async getReportStatus(reportId: string): Promise<EmergencyResponse | null> {
    try {
      const serverAvailable = await apiService.isServerAvailable();
      
      if (!serverAvailable) {
        return null;
      }

      return await apiService.get<EmergencyResponse>(`/app-mobile/emergency/reports/${reportId}/status`);
    } catch (error) {
      console.warn('EmergencyService: Error obteniendo estado del reporte:', error);
      return null;
    }
  }

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
        console.warn(`EmergencyService: Error reenviando reporte ${report.id}:`, error);
      }
    }

    console.log(`EmergencyService: Retry completado - ${success} exitosos, ${failed} fallidos`);
    return { success, failed };
  }

  async getPendingReports(): Promise<EmergencyReport[]> {
    try {
      const reports = await storageService.get<EmergencyReport[]>(this.STORAGE_KEY);
      if (!reports) return [];

      // Convertir timestamps a Date objects
      return reports.map(report => ({
        ...report,
        timestamp: new Date(report.timestamp),
      }));
    } catch (error) {
      console.error('EmergencyService: Error obteniendo reportes pendientes:', error);
      return [];
    }
  }

  private async savePendingReport(report: EmergencyReport): Promise<void> {
    try {
      const pending = await this.getPendingReports();
      const updated = [...pending, report];
      
      await storageService.set(this.STORAGE_KEY, updated);
      console.log('EmergencyService: Reporte guardado localmente:', report.id);
    } catch (error) {
      console.error('EmergencyService: Error guardando reporte pendiente:', error);
    }
  }

  private async removePendingReport(reportId: string): Promise<void> {
    try {
      const pending = await this.getPendingReports();
      const filtered = pending.filter(report => report.id !== reportId);
      
      await storageService.set(this.STORAGE_KEY, filtered);
      console.log('EmergencyService: Reporte pendiente eliminado:', reportId);
    } catch (error) {
      console.error('EmergencyService: Error eliminando reporte pendiente:', error);
    }
  }

  private async getLocalReports(): Promise<EmergencyReport[]> {
    try {
      const pending = await this.getPendingReports();
      
      // Devolver los últimos 10 reportes ordenados por fecha
      return pending
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
    } catch (error) {
      console.error('EmergencyService: Error obteniendo reportes locales:', error);
      return [];
    }
  }

  private generateReportId(report: EmergencyReport): string {
    const timestamp = report.timestamp.getTime();
    const random = Math.random().toString(36).substring(2, 8);
    return `ER-${timestamp}-${random}`;
  }

  async cleanOldReports(): Promise<void> {
    try {
      const pending = await this.getPendingReports();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const filtered = pending.filter(
        report => new Date(report.timestamp) > thirtyDaysAgo
      );

      await storageService.set(this.STORAGE_KEY, filtered);
      console.log('EmergencyService: Reportes antiguos limpiados');
    } catch (error) {
      console.error('EmergencyService: Error limpiando reportes antiguos:', error);
    }
  }

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
      console.error('EmergencyService: Error obteniendo estadísticas:', error);
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