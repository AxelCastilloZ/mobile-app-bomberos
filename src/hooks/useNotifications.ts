/**
 * Hook de Notificaciones
 * Módulo 2 - Nosara Emergency App
 */

import { useCallback, useEffect, useRef } from 'react';
import { backgroundNotificationService } from '../services/notifications/backgroundNotifications';
import { emergencyNotificationService } from '../services/notifications/emergencyNotifications';
import { pushNotificationService } from '../services/notifications/pushNotifications';
import { soundManager } from '../services/notifications/soundManager';
import { vibrationService } from '../services/notifications/vibrationPatterns';
import { useNotificationStore } from '../store/notificationStore';
import { EmergencyData, EmergencyStatus } from '../types';
import {
  Notification,
  NotificationConfig,
  NotificationPriority,
  NotificationSettings,
  NotificationStatus,
  SoundCategory,
  VibrationPattern,
} from '../types/notifications';

export const useNotifications = () => {
  const store = useNotificationStore();
  const initializingRef = useRef(false);

  const initialize = useCallback(async () => {
    if (initializingRef.current) {
      return;
    }

    try {
      initializingRef.current = true;
      store.setLoading(true);
      store.setError(null);

      await store.loadFromStorage();

      await pushNotificationService.initialize();
      await backgroundNotificationService.initialize();

      const permissions = await pushNotificationService.requestPermissions();
      store.setPermissions(permissions);
      store.setPermissionsChecked(true);

      const token = pushNotificationService.getPushToken();
      store.setPushToken(token);

      store.setInitialized(true);
      console.log('Sistema de notificaciones inicializado desde hook');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      store.setError(errorMessage);
      console.error('Error inicializando notificaciones:', error);
    } finally {
      store.setLoading(false);
      initializingRef.current = false;
    }
  }, [store]);

  const requestPermissions = useCallback(async () => {
    try {
      const permissions = await pushNotificationService.requestPermissions();
      store.setPermissions(permissions);
      store.setPermissionsChecked(true);
      return permissions;
    } catch (error) {
      console.error('Error solicitando permisos:', error);
      return { granted: false };
    }
  }, [store]);

  const sendNotification = useCallback(
    async (config: NotificationConfig) => {
      try {
        if (!store.settings.enabled) {
          console.warn('Notificaciones deshabilitadas');
          return null;
        }

        if (!store.settings.types[config.type]) {
          console.warn(`Tipo de notificación ${config.type} deshabilitado`);
          return null;
        }

        if (!store.settings.priorities[config.priority]) {
          console.warn(`Prioridad ${config.priority} deshabilitada`);
          return null;
        }

        if (isInQuietHours() && config.priority !== NotificationPriority.CRITICAL) {
          console.log('En horas silenciosas, notificación omitida');
          return null;
        }

        const notificationId = await pushNotificationService.sendLocalNotification(
          config
        );

        const notification: Notification = {
          id: notificationId,
          config,
          status: NotificationStatus.DELIVERED,
          createdAt: new Date(),
          deliveredAt: new Date(),
        };

        store.addNotification(notification);

        return notificationId;
      } catch (error) {
        console.error('Error enviando notificación:', error);
        throw error;
      }
    },
    [store]
  );

  const isInQuietHours = useCallback((): boolean => {
    const { quietHours } = store.settings;

    if (!quietHours || !quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    const { start, end } = quietHours;

    if (start > end) {
      return currentTime >= start || currentTime < end;
    }

    return currentTime >= start && currentTime < end;
  }, [store.settings]);

  const notifyNewEmergency = useCallback(
    async (emergency: EmergencyData) => {
      try {
        const notificationId = await emergencyNotificationService.notifyNewEmergency(
          emergency
        );
        console.log('Notificación de emergencia enviada:', notificationId);
        return notificationId;
      } catch (error) {
        console.error('Error notificando emergencia:', error);
        throw error;
      }
    },
    []
  );

  const notifyEmergencyUpdate = useCallback(
    async (emergency: EmergencyData, updateType: string) => {
      try {
        return await emergencyNotificationService.notifyEmergencyUpdate(
          emergency,
          updateType
        );
      } catch (error) {
        console.error('Error notificando actualización:', error);
        throw error;
      }
    },
    []
  );

  const notifyUnitAssigned = useCallback(
    async (emergency: EmergencyData, unitId: string, isForUnit: boolean = false) => {
      try {
        return await emergencyNotificationService.notifyUnitAssigned(
          emergency,
          unitId,
          isForUnit
        );
      } catch (error) {
        console.error('Error notificando asignación:', error);
        throw error;
      }
    },
    []
  );

  const notifyStatusChange = useCallback(
    async (
      emergency: EmergencyData,
      oldStatus: EmergencyStatus,
      newStatus: EmergencyStatus
    ) => {
      try {
        return await emergencyNotificationService.notifyStatusChange(
          emergency,
          oldStatus,
          newStatus
        );
      } catch (error) {
        console.error('Error notificando cambio de estado:', error);
        throw error;
      }
    },
    []
  );

  const notifyEmergencyResolved = useCallback(
    async (emergency: EmergencyData) => {
      try {
        return await emergencyNotificationService.notifyEmergencyResolved(
          emergency
        );
      } catch (error) {
        console.error('Error notificando resolución:', error);
        throw error;
      }
    },
    []
  );

  const confirmNotification = useCallback(
    (emergencyId: string) => {
      emergencyNotificationService.confirmNotification(emergencyId);
      store.confirmNotification(emergencyId);
    },
    [store]
  );

  const playSound = useCallback(async (category: SoundCategory) => {
    try {
      if (!store.settings.soundEnabled) {
        console.warn('Sonido deshabilitado');
        return;
      }
      await soundManager.playSound(category);
    } catch (error) {
      console.error('Error reproduciendo sonido:', error);
    }
  }, [store.settings.soundEnabled]);

  const stopSound = useCallback(async (category: SoundCategory) => {
    try {
      await soundManager.stopSound(category);
    } catch (error) {
      console.error('Error deteniendo sonido:', error);
    }
  }, []);

  const vibrate = useCallback(
    async (pattern: VibrationPattern) => {
      try {
        if (!store.settings.vibrationEnabled) {
          console.warn('Vibración deshabilitada');
          return;
        }
        await vibrationService.vibrate(pattern);
      } catch (error) {
        console.error('Error vibrando:', error);
      }
    },
    [store.settings.vibrationEnabled]
  );

  const cancelNotification = useCallback(
    async (notificationId: string) => {
      try {
        await pushNotificationService.cancelNotification(notificationId);
        store.removeNotification(notificationId);
      } catch (error) {
        console.error('Error cancelando notificación:', error);
      }
    },
    [store]
  );

  const cancelAllNotifications = useCallback(async () => {
    try {
      await pushNotificationService.cancelAllNotifications();
      store.clearAll();
    } catch (error) {
      console.error('Error cancelando todas las notificaciones:', error);
    }
  }, [store]);

  const updateBadge = useCallback(async (count: number) => {
    try {
      await pushNotificationService.setBadgeCount(count);
    } catch (error) {
      console.error('Error actualizando badge:', error);
    }
  }, []);

  const updateSettings = useCallback(
    (settings: Partial<NotificationSettings>) => {
      store.updateSettings(settings);
    },
    [store]
  );

  const cleanup = useCallback(() => {
    pushNotificationService.cleanup();
    emergencyNotificationService.cleanup();
    backgroundNotificationService.cleanup();
    soundManager.cleanup();
    store.reset();
  }, [store]);

  useEffect(() => {
    if (!store.isInitialized && !store.isLoading && !initializingRef.current) {
      initialize();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (store.settings.badgeEnabled) {
      updateBadge(store.unreadCount);
    }
  }, [store.unreadCount, store.settings.badgeEnabled, updateBadge]);

  return {
    permissions: store.permissions,
    permissionsChecked: store.permissionsChecked,
    settings: store.settings,
    notifications: store.notifications,
    unreadCount: store.unreadCount,
    isInitialized: store.isInitialized,
    pushToken: store.pushToken,
    stats: store.stats,
    isLoading: store.isLoading,
    error: store.error,

    initialize,
    requestPermissions,
    cleanup,

    sendNotification,
    notifyNewEmergency,
    notifyEmergencyUpdate,
    notifyUnitAssigned,
    notifyStatusChange,
    notifyEmergencyResolved,

    markAsRead: store.markAsRead,
    markAllAsRead: store.markAllAsRead,
    dismissNotification: store.dismissNotification,
    dismissAll: store.dismissAll,
    confirmNotification,
    cancelNotification,
    cancelAllNotifications,

    updateSettings,
    toggleNotifications: store.toggleNotifications,
    toggleSound: store.toggleSound,
    toggleVibration: store.toggleVibration,
    toggleCriticalAlerts: store.toggleCriticalAlerts,
    togglePriority: store.togglePriority,
    toggleType: store.toggleType,
    updateQuietHours: store.updateQuietHours,

    playSound,
    stopSound,
    vibrate,

    getNotificationById: store.getNotificationById,
    getNotificationsByPriority: store.getNotificationsByPriority,
    getNotificationsByType: store.getNotificationsByType,
    getUnreadNotifications: store.getUnreadNotifications,
    getPendingNotifications: store.getPendingNotifications,
    getNotificationsRequiringConfirmation:
      store.getNotificationsRequiringConfirmation,

    updateBadge,
    isInQuietHours,
  };
};
