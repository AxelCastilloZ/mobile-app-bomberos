/**
 * Servicio de Notificaciones de Emergencia
 * Módulo 2 - Nosara Emergency App
 */

import {
    NOTIFICATION_TEMPLATES,
    NOTIFICATION_TIMING,
    NOTIFICATION_TYPE_CONFIG,
} from '../../constants/notifications';
import { EmergencyData, EmergencyPriority, EmergencyStatus } from '../../types';
import {
    NotificationConfig,
    NotificationData,
    NotificationType,
} from '../../types/notifications';
import { pushNotificationService } from './pushNotifications';

type Emergency = EmergencyData;

class EmergencyNotificationService {
  private pendingConfirmations: Map<string, NodeJS.Timeout> = new Map();

  async notifyNewEmergency(emergency: Emergency): Promise<string> {
    try {
      const config = this.buildNotificationConfig(
        NotificationType.NEW_EMERGENCY,
        emergency
      );

      const notificationId = await pushNotificationService.sendLocalNotification(config);

      if (config.requiresConfirmation) {
        this.scheduleConfirmationRetry(emergency.id, notificationId);
      }

      return notificationId;
    } catch (error) {
      console.error('Error notificando nueva emergencia:', error);
      throw error;
    }
  }

  async notifyEmergencyUpdate(emergency: Emergency, updateType: string): Promise<string> {
    try {
      const config = this.buildNotificationConfig(
        NotificationType.EMERGENCY_UPDATE,
        emergency,
        { updateType }
      );

      return await pushNotificationService.sendLocalNotification(config);
    } catch (error) {
      console.error('Error notificando actualización:', error);
      throw error;
    }
  }

  async notifyUnitAssigned(
    emergency: Emergency,
    unitId: string,
    isForUnit: boolean = false
  ): Promise<string> {
    try {
      const type = isForUnit
        ? NotificationType.UNIT_ASSIGNED
        : NotificationType.EMERGENCY_ASSIGNED;

      const config = this.buildNotificationConfig(type, emergency, { unitId });

      return await pushNotificationService.sendLocalNotification(config);
    } catch (error) {
      console.error('Error notificando asignación:', error);
      throw error;
    }
  }

  async notifyStatusChange(
    emergency: Emergency,
    oldStatus: EmergencyStatus,
    newStatus: EmergencyStatus
  ): Promise<string> {
    try {
      const type =
        newStatus === 'resolved'
          ? NotificationType.EMERGENCY_RESOLVED
          : NotificationType.STATUS_CHANGE;

      const config = this.buildNotificationConfig(type, emergency, {
        oldStatus,
        newStatus,
      });

      return await pushNotificationService.sendLocalNotification(config);
    } catch (error) {
      console.error('Error notificando cambio de estado:', error);
      throw error;
    }
  }

  async notifyEmergencyResolved(emergency: Emergency): Promise<string> {
    try {
      this.cancelConfirmationRetry(emergency.id);

      const config = this.buildNotificationConfig(
        NotificationType.EMERGENCY_RESOLVED,
        emergency
      );

      return await pushNotificationService.sendLocalNotification(config);
    } catch (error) {
      console.error('Error notificando resolución:', error);
      throw error;
    }
  }

  private buildNotificationConfig(
    type: NotificationType,
    emergency: Emergency,
    extraData?: Record<string, any>
  ): NotificationConfig {
    const typeConfig = NOTIFICATION_TYPE_CONFIG[type];
    const template = NOTIFICATION_TEMPLATES[type];

    const title = template.title;
    let body = '';

    switch (type) {
      case NotificationType.NEW_EMERGENCY:
        body = (template.body as any)(
          emergency.location.address || 'Ubicación desconocida',
          this.mapPriorityToText(emergency.priority)
        );
        break;

      case NotificationType.EMERGENCY_UPDATE:
        body = (template.body as any)(emergency.id);
        break;

      case NotificationType.EMERGENCY_ASSIGNED:
        body = (template.body as any)(extraData?.unitId || 'Unidad', emergency.id);
        break;

      case NotificationType.UNIT_ASSIGNED:
        body = (template.body as any)(emergency.id);
        break;

      case NotificationType.EMERGENCY_RESOLVED:
        body = (template.body as any)(emergency.id);
        break;

      case NotificationType.STATUS_CHANGE:
        body = (template.body as any)(
          emergency.id,
          this.mapStatusToText(extraData?.newStatus)
        );
        break;

      default:
        body = `Actualización sobre emergencia #${emergency.id}`;
    }

    const data: NotificationData = {
      emergencyId: emergency.id,
      priority: emergency.priority,
      type: emergency.type,
      status: emergency.status,
      location: {
        latitude: emergency.location.latitude,
        longitude: emergency.location.longitude,
      },
      metadata: {
        ...extraData,
        timestamp: new Date().toISOString(),
      },
    };

    const config: NotificationConfig = {
      title,
      body,
      data,
      priority: typeConfig.priority,
      type,
      sound: typeConfig.sound,
      vibration: typeConfig.vibration,
      categoryId: typeConfig.categoryId,
      requiresConfirmation: typeConfig.requiresConfirmation,
      badge: 1,
    };

    const expirationTime = NOTIFICATION_TIMING.EXPIRATION[config.priority];
    if (expirationTime > 0) {
      config.expiresAt = new Date(Date.now() + expirationTime);
    }

    return config;
  }

  private scheduleConfirmationRetry(emergencyId: string, notificationId: string): void {
    let retryCount = 0;

    const retry = async () => {
      if (retryCount >= NOTIFICATION_TIMING.MAX_RETRIES) {
        this.cancelConfirmationRetry(emergencyId);
        return;
      }

      console.log(`Reintento ${retryCount + 1} para emergencia ${emergencyId}`);

      retryCount++;

      const timeout = setTimeout(retry, NOTIFICATION_TIMING.RETRY_INTERVAL);
      this.pendingConfirmations.set(emergencyId, timeout);
    };

    const timeout = setTimeout(retry, NOTIFICATION_TIMING.RETRY_INTERVAL);
    this.pendingConfirmations.set(emergencyId, timeout);
  }

  private cancelConfirmationRetry(emergencyId: string): void {
    const timeout = this.pendingConfirmations.get(emergencyId);
    if (timeout) {
      clearTimeout(timeout);
      this.pendingConfirmations.delete(emergencyId);
      console.log(`Reintentos cancelados para emergencia ${emergencyId}`);
    }
  }

  confirmNotification(emergencyId: string): void {
    this.cancelConfirmationRetry(emergencyId);
    console.log(`Notificación confirmada para emergencia ${emergencyId}`);
  }

  getPendingConfirmations(): string[] {
    return Array.from(this.pendingConfirmations.keys());
  }

  private mapPriorityToText(priority: EmergencyPriority): string {
    const priorityMap: { [key: string]: string } = {
      'low': 'baja prioridad',
      'medium': 'prioridad media',
      'high': 'alta prioridad',
      'critical': 'PRIORIDAD CRÍTICA',
    };
    return priorityMap[priority] || 'prioridad desconocida';
  }

  private mapStatusToText(status?: EmergencyStatus): string {
    if (!status) return 'estado desconocido';

    const statusMap: { [key: string]: string } = {
      'pending': 'pendiente',
      'assigned': 'asignada',
      'in_progress': 'en progreso',
      'resolved': 'resuelta',
      'cancelled': 'cancelada',
    };
    return statusMap[status] || 'estado desconocido';
  }

  cleanup(): void {
    for (const timeout of this.pendingConfirmations.values()) {
      clearTimeout(timeout);
    }
    this.pendingConfirmations.clear();
    console.log('Servicio de notificaciones de emergencia limpiado');
  }
}

export const emergencyNotificationService = new EmergencyNotificationService();
