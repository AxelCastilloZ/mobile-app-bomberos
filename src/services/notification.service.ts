
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { storageService } from './storage.service';

// Configurar el comportamiento de las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: boolean;
  // En el contenido se esperan strings, no AndroidImportance
  priority?: 'min' | 'low' | 'default' | 'high' | 'max';
  categoryId?: string;
}

export interface EmergencyNotification extends NotificationData {
  emergencyType: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  reportId: string;
  priority: 'high' | 'max';
}

class NotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;

  async initialize(): Promise<boolean> {
    try {
      console.log('NotificationService: Inicializando...');

      // Verificar si es un dispositivo físico
      if (!Device.isDevice) {
        console.warn('NotificationService: Las notificaciones push solo funcionan en dispositivos físicos');
        return false;
      }

      // Configurar canales de notificación para Android
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      // Solicitar permisos
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('NotificationService: Permisos de notificación denegados');
        return false;
      }

      // Obtener token de push
      await this.registerForPushNotifications();

      // Configurar listeners
      this.setupNotificationListeners();

      console.log('NotificationService: Inicialización completada');
      return true;
    } catch (error) {
      console.error('NotificationService: Error en inicialización:', error);
      return false;
    }
  }

  private async setupAndroidChannels(): Promise<void> {
    // Canal para emergencias (prioridad alta)
    await Notifications.setNotificationChannelAsync('emergency', {
      name: 'Emergencias',
      description: 'Notificaciones de emergencias críticas',
      importance: Notifications.AndroidImportance.MAX, // canales sí usan Importance
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#D32F2F',
      sound: 'emergency_alert.wav', // Archivo de sonido personalizado
      enableLights: true,
      enableVibrate: true,
    });

    // Canal para reportes generales
    await Notifications.setNotificationChannelAsync('reports', {
      name: 'Reportes',
      description: 'Actualizaciones de reportes de emergencia',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250],
      lightColor: '#2196F3',
      enableLights: true,
      enableVibrate: true,
    });

    // Canal para información general
    await Notifications.setNotificationChannelAsync('general', {
      name: 'General',
      description: 'Notificaciones generales de la aplicación',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: '#4CAF50',
    });
  }

  private async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('NotificationService: Permisos de notificación denegados');
        return false;
      }

      console.log('NotificationService: Permisos de notificación concedidos');
      return true;
    } catch (error) {
      console.error('NotificationService: Error solicitando permisos:', error);
      return false;
    }
  }

  private async registerForPushNotifications(): Promise<void> {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });

      this.expoPushToken = token.data;
      console.log('NotificationService: Token de push obtenido:', this.expoPushToken);

      // Guardar token localmente
      await storageService.set('expo_push_token', this.expoPushToken);

      // TODO: Enviar token al servidor para asociarlo con el usuario
      // await this.sendTokenToServer(this.expoPushToken);
    } catch (error) {
      console.error('NotificationService: Error obteniendo token de push:', error);
    }
  }

  private setupNotificationListeners(): void {
    // Listener para notificaciones recibidas cuando la app está abierta
    this.notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('NotificationService: Notificación recibida:', notification);
      this.handleNotificationReceived(notification);
    });

    // Listener para cuando el usuario toca una notificación
    this.responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('NotificationService: Respuesta a notificación:', response);
      this.handleNotificationResponse(response);
    });
  }

  private handleNotificationReceived(notification: Notifications.Notification): void {
    const { data } = notification.request.content;

    // Procesar según el tipo de notificación
    if ((data as any)?.type === 'emergency') {
      this.handleEmergencyNotification(data);
    } else if ((data as any)?.type === 'report_update') {
      this.handleReportUpdateNotification(data);
    }
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { data } = response.notification.request.content;

    // Navegar a la pantalla apropiada según el tipo de notificación
    if ((data as any)?.type === 'emergency') {
      console.log('NotificationService: Navegar a emergencia:', (data as any).reportId);
    } else if ((data as any)?.type === 'report_update') {
      console.log('NotificationService: Navegar a reporte:', (data as any).reportId);
    }
  }

  private handleEmergencyNotification(data: any): void {
    console.log('NotificationService: Procesando notificación de emergencia:', data);
  }

  private handleReportUpdateNotification(data: any): void {
    console.log('NotificationService: Procesando actualización de reporte:', data);
  }

  // Normaliza la prioridad a los strings esperados por NotificationContentInput
  private mapPriority(
    priority?: NotificationData['priority']
  ): Notifications.NotificationContentInput['priority'] {
    switch (priority) {
      case 'min':
      case 'low':
      case 'high':
      case 'max':
        return priority;
      default:
        return 'default';
    }
  }

  // Método público para enviar notificaciones locales
  async sendLocalNotification(notification: NotificationData): Promise<string | null> {
    try {
      const { title, body, data, sound, priority, categoryId } = notification;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: sound !== false,
          priority: this.mapPriority(priority),
          categoryIdentifier: categoryId,
        },
        trigger: null, // Enviar inmediatamente
      });

      console.log('NotificationService: Notificación local enviada:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('NotificationService: Error enviando notificación local:', error);
      return null;
    }
  }

  // Método específico para notificaciones de emergencia
  async sendEmergencyNotification(notification: EmergencyNotification): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: {
            type: 'emergency',
            emergencyType: notification.emergencyType,
            location: notification.location,
            reportId: notification.reportId,
            ...notification.data,
          },
          sound: true,
          priority: 'max', // string válido para el contenido
          categoryIdentifier: 'emergency',
        },
        trigger: null,
      });

      console.log('NotificationService: Notificación de emergencia enviada:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('NotificationService: Error enviando notificación de emergencia:', error);
      return null;
    }
  }

  
  async scheduleNotification(
    notification: NotificationData,
    trigger: Notifications.NotificationTriggerInput
  ): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.sound !== false,
          priority: this.mapPriority(notification.priority),
        },
        trigger,
      });

      console.log('NotificationService: Notificación programada:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('NotificationService: Error programando notificación:', error);
      return null;
    }
  }

  // Cancelar notificación programada
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('NotificationService: Notificación cancelada:', notificationId);
    } catch (error) {
      console.error('NotificationService: Error cancelando notificación:', error);
    }
  }

 
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('NotificationService: Todas las notificaciones canceladas');
    } catch (error) {
      console.error('NotificationService: Error cancelando todas las notificaciones:', error);
    }
  }

 
  async clearBadge(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('NotificationService: Error limpiando badge:', error);
    }
  }

  // Obtener notificaciones programadas
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('NotificationService: Error obteniendo notificaciones programadas:', error);
      return [];
    }
  }

 
  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  // Verificar si las notificaciones están habilitadas
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('NotificationService: Error verificando permisos:', error);
      return false;
    }
  }

 
  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }

    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }

    console.log('NotificationService: Cleanup completado');
  }

  
  async notifyEmergencyReceived(reportId: string, emergencyType: string): Promise<void> {
    await this.sendEmergencyNotification({
      title: 'Nueva Emergencia',
      body: `Se reportó una emergencia de tipo: ${emergencyType}`,
      emergencyType,
      reportId,
      priority: 'max',
    });
  }

  async notifyReportStatusUpdate(reportId: string, newStatus: string): Promise<void> {
    await this.sendLocalNotification({
      title: 'Actualización de Reporte',
      body: `Tu reporte ha cambiado a estado: ${newStatus}`,
      data: {
        type: 'report_update',
        reportId,
        newStatus,
      },
      priority: 'high',
      categoryId: 'reports',
    });
  }

  async notifyPersonnelAlert(message: string, priority: 'high' | 'max' = 'high'): Promise<void> {
    await this.sendLocalNotification({
      title: 'Alerta de Personal',
      body: message,
      data: {
        type: 'personnel_alert',
      },
      priority,
      categoryId: 'emergency',
    });
  }

  async notifyMaintenanceReminder(): Promise<void> {
    await this.sendLocalNotification({
      title: 'Recordatorio de Mantenimiento',
      body: 'Es hora de revisar el equipo de emergencias',
      data: {
        type: 'maintenance',
      },
      priority: 'default',
      categoryId: 'general',
    });
  }
}

export const notificationService = new NotificationService();
