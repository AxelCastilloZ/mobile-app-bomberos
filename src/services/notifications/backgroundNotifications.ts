/**
 * Servicio de Notificaciones en Background
 * Módulo 2 - Nosara Emergency App
 */

import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { NotificationConfig } from '../../types/notifications';
import { pushNotificationService } from './pushNotifications';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';

interface QueuedNotification {
  id: string;
  config: NotificationConfig;
  timestamp: number;
  retries: number;
}

class BackgroundNotificationService {
  private notificationQueue: QueuedNotification[] = [];
  private isProcessing: boolean = false;
  private maxQueueSize: number = 50;
  private maxRetries: number = 3;

  async initialize(): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        await this.registerBackgroundTask();
      }

      console.log('Servicio de notificaciones en background inicializado');
    } catch (error) {
      console.error('Error inicializando notificaciones en background:', error);
    }
  }

  private async registerBackgroundTask(): Promise<void> {
    try {
      TaskManager.defineTask(
        BACKGROUND_NOTIFICATION_TASK,
        async ({ data, error }: any) => {
          if (error) {
            console.error('Error en tarea background:', error);
            return;
          }

          console.log('Tarea background ejecutada:', data);

          if (data?.notification) {
            await this.handleBackgroundNotification(data.notification);
          }
        }
      );

      const isRegistered = await TaskManager.isTaskRegisteredAsync(
        BACKGROUND_NOTIFICATION_TASK
      );

      if (!isRegistered) {
        console.log('Tarea en background registrada');
      }
    } catch (error) {
      console.error('Error registrando tarea background:', error);
    }
  }

  private async handleBackgroundNotification(notification: any): Promise<void> {
    try {
      console.log('Notificación en background:', notification);

      const badge = await Notifications.getBadgeCountAsync();
      await Notifications.setBadgeCountAsync(badge + 1);

    } catch (error) {
      console.error('Error manejando notificación en background:', error);
    }
  }

  async queueNotification(config: NotificationConfig): Promise<string> {
    try {
      const id = `queued-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const queuedNotification: QueuedNotification = {
        id,
        config,
        timestamp: Date.now(),
        retries: 0,
      };

      if (this.notificationQueue.length >= this.maxQueueSize) {
        this.notificationQueue.shift();
        console.warn('Cola llena, removiendo notificación más antigua');
      }

      this.notificationQueue.push(queuedNotification);
      console.log(`Notificación agregada a cola: ${id}`);

      if (!this.isProcessing) {
        await this.processQueue();
      }

      return id;
    } catch (error) {
      console.error('Error agregando notificación a cola:', error);
      throw error;
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.notificationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.notificationQueue.length > 0) {
        const notification = this.notificationQueue[0];

        try {
          await pushNotificationService.sendLocalNotification(notification.config);

          this.notificationQueue.shift();
          console.log(`Notificación procesada: ${notification.id}`);

        } catch (error) {
          console.error(`Error procesando notificación ${notification.id}:`, error);

          notification.retries++;

          if (notification.retries >= this.maxRetries) {
            this.notificationQueue.shift();
            console.warn(`Máximo de reintentos para: ${notification.id}`);
          } else {
            this.notificationQueue.shift();
            this.notificationQueue.push(notification);
          }
        }

        await this.delay(500);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  async scheduleNotification(
    config: NotificationConfig,
    trigger: Notifications.SchedulableNotificationTriggerInput
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: config.title,
          body: config.body,
          data: config.data as any,
          sound: config.sound !== 'none' ? 'default' : undefined,
          badge: config.badge,
          categoryIdentifier: config.categoryId,
        },
        trigger,
      });

      console.log('Notificación programada:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error programando notificación:', error);
      throw error;
    }
  }

  async cancelScheduledNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Notificación programada cancelada:', notificationId);
    } catch (error) {
      console.error('Error cancelando notificación programada:', error);
    }
  }

  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error obteniendo notificaciones programadas:', error);
      return [];
    }
  }

  async cancelAllScheduledNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Todas las notificaciones programadas canceladas');
    } catch (error) {
      console.error('Error cancelando notificaciones programadas:', error);
    }
  }

  getQueueSize(): number {
    return this.notificationQueue.length;
  }

  clearQueue(): void {
    this.notificationQueue = [];
    console.log('Cola de notificaciones limpiada');
  }

  getQueuedNotifications(): QueuedNotification[] {
    return [...this.notificationQueue];
  }

  isProcessingQueue(): boolean {
    return this.isProcessing;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup(): Promise<void> {
    try {
      this.clearQueue();
      this.isProcessing = false;

      if (Platform.OS === 'android') {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(
          BACKGROUND_NOTIFICATION_TASK
        );

        if (isRegistered) {
          await TaskManager.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
          console.log('Tarea en background desregistrada');
        }
      }

      console.log('Servicio de notificaciones en background limpiado');
    } catch (error) {
      console.error('Error limpiando servicio background:', error);
    }
  }
}

export const backgroundNotificationService = new BackgroundNotificationService();
