
import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationService, NotificationData, EmergencyNotification } from '../services/notification.service';

export interface NotificationState {
  isInitialized: boolean;
  hasPermission: boolean;
  expoPushToken: string | null;
  lastNotification: Notifications.Notification | null;
  error: string | null;
}

export const useNotifications = () => {
  const [state, setState] = useState<NotificationState>({
    isInitialized: false,
    hasPermission: false,
    expoPushToken: null,
    lastNotification: null,
    error: null,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeNotifications();
    
    
    return () => {
      notificationService.cleanup();
    };
  }, []);

  const initializeNotifications = async () => {
    try {
      setIsLoading(true);
      setState(prev => ({ ...prev, error: null }));

      const initialized = await notificationService.initialize();
      const hasPermission = await notificationService.areNotificationsEnabled();
      const expoPushToken = notificationService.getExpoPushToken();

      setState(prev => ({
        ...prev,
        isInitialized: initialized,
        hasPermission,
        expoPushToken,
      }));

      console.log('useNotifications: Inicialización completada', {
        initialized,
        hasPermission,
        expoPushToken: !!expoPushToken,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('useNotifications: Error en inicialización:', error);
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
    } finally {
      setIsLoading(false);
    }
  };

 
  const sendLocalNotification = useCallback(async (notification: NotificationData): Promise<string | null> => {
    try {
      if (!state.isInitialized) {
        throw new Error('Servicio de notificaciones no inicializado');
      }

      const notificationId = await notificationService.sendLocalNotification(notification);
      console.log('useNotifications: Notificación local enviada:', notificationId);
      return notificationId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error enviando notificación';
      console.error('useNotifications: Error enviando notificación local:', error);
      setState(prev => ({ ...prev, error: errorMessage }));
      return null;
    }
  }, [state.isInitialized]);

  // Enviar notificación de emergencia
  const sendEmergencyNotification = useCallback(async (notification: EmergencyNotification): Promise<string | null> => {
    try {
      if (!state.isInitialized) {
        throw new Error('Servicio de notificaciones no inicializado');
      }

      const notificationId = await notificationService.sendEmergencyNotification(notification);
      console.log('useNotifications: Notificación de emergencia enviada:', notificationId);
      return notificationId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error enviando notificación de emergencia';
      console.error('useNotifications: Error enviando notificación de emergencia:', error);
      setState(prev => ({ ...prev, error: errorMessage }));
      return null;
    }
  }, [state.isInitialized]);

  
  const scheduleNotification = useCallback(async (
    notification: NotificationData,
    trigger: any
  ): Promise<string | null> => {
    try {
      if (!state.isInitialized) {
        throw new Error('Servicio de notificaciones no inicializado');
      }

      const notificationId = await notificationService.scheduleNotification(notification, trigger);
      console.log('useNotifications: Notificación programada:', notificationId);
      return notificationId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error programando notificación';
      console.error('useNotifications: Error programando notificación:', error);
      setState(prev => ({ ...prev, error: errorMessage }));
      return null;
    }
  }, [state.isInitialized]);

 
  const cancelNotification = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      await notificationService.cancelNotification(notificationId);
      return true;
    } catch (error) {
      console.error('useNotifications: Error cancelando notificación:', error);
      return false;
    }
  }, []);

  
  const cancelAllNotifications = useCallback(async (): Promise<boolean> => {
    try {
      await notificationService.cancelAllNotifications();
      return true;
    } catch (error) {
      console.error('useNotifications: Error cancelando todas las notificaciones:', error);
      return false;
    }
  }, []);

  
  const clearBadge = useCallback(async (): Promise<void> => {
    try {
      await notificationService.clearBadge();
    } catch (error) {
      console.error('useNotifications: Error limpiando badge:', error);
    }
  }, []);


  const getScheduledNotifications = useCallback(async (): Promise<Notifications.NotificationRequest[]> => {
    try {
      return await notificationService.getScheduledNotifications();
    } catch (error) {
      console.error('useNotifications: Error obteniendo notificaciones programadas:', error);
      return [];
    }
  }, []);

  
  const reinitialize = useCallback(async (): Promise<void> => {
    await initializeNotifications();
  }, []);

  
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  
  const checkPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const hasPermission = await notificationService.areNotificationsEnabled();
      setState(prev => ({ ...prev, hasPermission }));
      return hasPermission;
    } catch (error) {
      console.error('useNotifications: Error verificando permisos:', error);
      return false;
    }
  }, []);

 

  // Notificar nueva emergencia recibida
  const notifyEmergencyReceived = useCallback(async (reportId: string, emergencyType: string): Promise<void> => {
    try {
      await notificationService.notifyEmergencyReceived(reportId, emergencyType);
    } catch (error) {
      console.error('useNotifications: Error notificando emergencia recibida:', error);
    }
  }, []);

  // Notificar actualización de estado de reporte
  const notifyReportStatusUpdate = useCallback(async (reportId: string, newStatus: string): Promise<void> => {
    try {
      await notificationService.notifyReportStatusUpdate(reportId, newStatus);
    } catch (error) {
      console.error('useNotifications: Error notificando actualización de reporte:', error);
    }
  }, []);

  // Notificar alerta al personal
  const notifyPersonnelAlert = useCallback(async (message: string, priority: 'high' | 'max' = 'high'): Promise<void> => {
    try {
      await notificationService.notifyPersonnelAlert(message, priority);
    } catch (error) {
      console.error('useNotifications: Error notificando alerta al personal:', error);
    }
  }, []);

  
  const scheduleSimpleReminder = useCallback(async (
    title: string, 
    body: string, 
    dateTime: Date
  ): Promise<string | null> => {
    try {
      return await scheduleNotification({
        title,
        body,
        data: { type: 'reminder' },
        priority: 'default',
      }, { date: dateTime });
    } catch (error) {
      console.error('useNotifications: Error programando recordatorio:', error);
      return null;
    }
  }, [scheduleNotification]);

  
  const sendTestNotification = useCallback(async (): Promise<void> => {
    await sendLocalNotification({
      title: 'Test de Notificaciones',
      body: 'Las notificaciones están funcionando correctamente',
      data: {
        type: 'test',
      },
      priority: 'default',
    });
  }, [sendLocalNotification]);

  return {
    
    ...state,
    isLoading,

    // Métodos básicos
    sendLocalNotification,
    sendEmergencyNotification,
    scheduleNotification,
    cancelNotification,
    cancelAllNotifications,
    clearBadge,
    getScheduledNotifications,

    
    reinitialize,
    clearError,
    checkPermissions,
    sendTestNotification,

    // Métodos específicos de bomberos
    notifyEmergencyReceived,
    notifyReportStatusUpdate,
    notifyPersonnelAlert,
    scheduleSimpleReminder,

    
    canSendNotifications: state.isInitialized && state.hasPermission,
    needsPermission: state.isInitialized && !state.hasPermission,
  };
};