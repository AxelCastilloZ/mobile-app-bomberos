/**
 * Servicio Principal de Push Notifications
 * Módulo 2 - Nosara Emergency App
 */

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
    NOTIFICATION_CATEGORIES,
    NOTIFICATION_CHANNELS,
} from '../../constants/notifications';
import {
    NotificationConfig,
    NotificationPermissions,
    NotificationPriority,
} from '../../types/notifications';
import { soundManager } from './soundManager';
import { vibrationService } from './vibrationPatterns';

// Configurar el handler de notificaciones - sin tipado estricto
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  } as any),
});

class PushNotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;
  private isInitialized: boolean = false;

  /**
   * Inicializa el servicio de notificaciones
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        return;
      }

      // Verificar si es dispositivo físico
      if (!Device.isDevice) {
        console.warn('Las notificaciones push solo funcionan en dispositivos físicos');
        return;
      }

      // Configurar canales de Android
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      // Configurar categorías de iOS
      if (Platform.OS === 'ios') {
        await this.setupIOSCategories();
      }

      // Solicitar permisos
      const permissions = await this.requestPermissions();
      if (!permissions.granted) {
        console.warn('Permisos de notificación no concedidos');
        return;
      }

      // Obtener token de Expo Push
      await this.registerForPushNotifications();

      // Configurar listeners
      this.setupListeners();

      // Inicializar sistema de sonido
      await soundManager.initialize();

      this.isInitialized = true;
      console.log('Servicio de notificaciones inicializado');
    } catch (error) {
      console.error('Error inicializando notificaciones:', error);
      throw error;
    }
  }

  /**
   * Configura los canales de notificación para Android
   */
  private async setupAndroidChannels(): Promise<void> {
    try {
      const channels = Object.values(NOTIFICATION_CHANNELS);

      for (const channel of channels) {
        await Notifications.setNotificationChannelAsync(channel.id, {
          name: channel.name,
          description: channel.description,
          importance: channel.importance as Notifications.AndroidImportance,
          sound: channel.sound ? 'default' : undefined,
          vibrationPattern: channel.vibration ? [0, 250, 250, 250] : undefined,
          lightColor: '#FF0000',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: channel.bypassDnd,
          showBadge: channel.badge,
        });
      }

      console.log('Canales de Android configurados');
    } catch (error) {
      console.error('Error configurando canales de Android:', error);
    }
  }

  /**
   * Configura las categorías de notificación para iOS
   */
  private async setupIOSCategories(): Promise<void> {
    try {
      const categories = Object.values(NOTIFICATION_CATEGORIES);

      for (const cat of categories) {
        await Notifications.setNotificationCategoryAsync(
          cat.id,
          cat.actions.map(action => ({
            identifier: action.id,
            buttonTitle: action.title,
            options: {
              isDestructive: action.destructive,
              isAuthenticationRequired: action.authenticationRequired,
              opensAppToForeground: true,
            },
          }))
        );
      }

      console.log('Categorías de iOS configuradas');
    } catch (error) {
      console.error('Error configurando categorías de iOS:', error);
    }
  }

  /**
   * Solicita permisos de notificación
   */
  async requestPermissions(): Promise<NotificationPermissions> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowCriticalAlerts: true,
          },
        });
        finalStatus = status;
      }

      const granted = finalStatus === 'granted';

      // Obtener detalles específicos de la plataforma
      const settings = await Notifications.getPermissionsAsync();

      const permissions: NotificationPermissions = {
        granted,
      };

      if (Platform.OS === 'ios') {
        permissions.ios = {
          status: finalStatus as 'granted' | 'denied' | 'undetermined',
          allowsAlert: settings.ios?.allowsAlert ?? false,
          allowsBadge: settings.ios?.allowsBadge ?? false,
          allowsSound: settings.ios?.allowsSound ?? false,
          allowsCriticalAlerts: settings.ios?.allowsCriticalAlerts ?? false,
        };
      } else if (Platform.OS === 'android') {
        permissions.android = {
          status: finalStatus as 'granted' | 'denied',
        };
      }

      return permissions;
    } catch (error) {
      console.error('Error solicitando permisos:', error);
      return { granted: false };
    }
  }

  /**
   * Registra el dispositivo para notificaciones push
   */
  private async registerForPushNotifications(): Promise<string | null> {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // TODO: Reemplazar con el projectId real
      });

      this.expoPushToken = token.data;
      console.log('Expo Push Token:', this.expoPushToken);

      return this.expoPushToken;
    } catch (error) {
      console.error('Error obteniendo push token:', error);
      return null;
    }
  }

  /**
   * Configura los listeners de notificaciones
   */
  private setupListeners(): void {
    // Listener para notificaciones recibidas
    this.notificationListener = Notifications.addNotificationReceivedListener(
      this.handleNotificationReceived
    );

    // Listener para respuestas a notificaciones
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      this.handleNotificationResponse
    );
  }

  /**
   * Maneja notificaciones recibidas
   */
  private handleNotificationReceived = async (notification: Notifications.Notification): Promise<void> => {
    console.log('Notificación recibida:', notification);

    const { data } = notification.request.content;
    const priority = data?.priority as NotificationPriority;

    // Vibración adicional para notificaciones críticas
    if (priority === NotificationPriority.CRITICAL) {
      await vibrationService.vibrateError();
    }
  };

  /**
   * Maneja respuestas a notificaciones (cuando el usuario toca la notificación)
   */
  private handleNotificationResponse = (response: Notifications.NotificationResponse): void => {
    console.log('Respuesta a notificación:', response);
  };

  /**
   * Envía una notificación local
   */
  async sendLocalNotification(config: NotificationConfig): Promise<string> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: config.title,
          body: config.body,
          data: config.data as any,
          sound: config.sound !== 'none' ? 'default' : undefined,
          badge: config.badge,
          categoryIdentifier: config.categoryId,
        },
        trigger: null,
      });

      // Reproducir sonido personalizado y vibración
      await this.playNotificationEffects(config);

      console.log('Notificación enviada:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error enviando notificación local:', error);
      throw error;
    }
  }

  /**
   * Reproduce efectos de sonido y vibración
   */
  private async playNotificationEffects(config: NotificationConfig): Promise<void> {
    try {
      if (config.sound) {
        await soundManager.playSound(config.sound);
      }

      if (config.vibration) {
        await vibrationService.vibrate(config.vibration);
      }
    } catch (error) {
      console.error('Error reproduciendo efectos:', error);
    }
  }

  /**
   * Cancela una notificación
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.dismissNotificationAsync(notificationId);
      console.log('Notificación cancelada:', notificationId);
    } catch (error) {
      console.error('Error cancelando notificación:', error);
    }
  }

  /**
   * Cancela todas las notificaciones
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      console.log('Todas las notificaciones canceladas');
    } catch (error) {
      console.error('Error cancelando notificaciones:', error);
    }
  }

  /**
   * Obtiene notificaciones presentadas
   */
  async getPresentedNotifications(): Promise<Notifications.Notification[]> {
    try {
      return await Notifications.getPresentedNotificationsAsync();
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      return [];
    }
  }

  /**
   * Actualiza el badge de la app
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error actualizando badge:', error);
    }
  }

  /**
   * Obtiene el token de push
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Limpia recursos
   */
  cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }

    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }

    soundManager.cleanup();
    this.isInitialized = false;
    console.log('Servicio de notificaciones limpiado');
  }
}

// Exportar instancia singleton
export const pushNotificationService = new PushNotificationService();
