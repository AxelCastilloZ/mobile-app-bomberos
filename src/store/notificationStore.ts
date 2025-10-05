/**
 * Store de Notificaciones con Persistencia
 * Módulo 2 - Nosara Emergency App
 */

import { create } from 'zustand';
import { DEFAULT_NOTIFICATION_SETTINGS } from '../constants/notifications';
import { notificationStorage } from '../services/storage/notificationStorage'; // ← NUEVO
import {
  Notification,
  NotificationPermissions,
  NotificationPriority,
  NotificationSettings,
  NotificationStats,
  NotificationStatus,
  NotificationType,
} from '../types/notifications';

interface NotificationState {
  // Estado de permisos
  permissions: NotificationPermissions | null;
  permissionsChecked: boolean;

  // Configuración de usuario
  settings: NotificationSettings;

  // Notificaciones
  notifications: Notification[];
  unreadCount: number;

  // Estado del sistema
  isInitialized: boolean;
  pushToken: string | null;

  // Estadísticas
  stats: NotificationStats;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Acciones - Permisos
  setPermissions: (permissions: NotificationPermissions) => void;
  setPermissionsChecked: (checked: boolean) => void;

  // Acciones - Configuración
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  toggleNotifications: (enabled: boolean) => void;
  toggleSound: (enabled: boolean) => void;
  toggleVibration: (enabled: boolean) => void;
  toggleCriticalAlerts: (enabled: boolean) => void;
  togglePriority: (priority: NotificationPriority, enabled: boolean) => void;
  toggleType: (type: NotificationType, enabled: boolean) => void;
  updateQuietHours: (config: NotificationSettings['quietHours']) => void;

  // Acciones - Notificaciones
  addNotification: (notification: Notification) => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  dismissAll: () => void;
  confirmNotification: (id: string) => void;

  // Acciones - Sistema
  setInitialized: (initialized: boolean) => void;
  setPushToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // ← NUEVO: Persistencia
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;

  // Selectores
  getNotificationById: (id: string) => Notification | undefined;
  getNotificationsByPriority: (priority: NotificationPriority) => Notification[];
  getNotificationsByType: (type: NotificationType) => Notification[];
  getUnreadNotifications: () => Notification[];
  getPendingNotifications: () => Notification[];
  getNotificationsRequiringConfirmation: () => Notification[];

  // Utilidades
  updateStats: () => void;
  clearAll: () => void;
  reset: () => void;
}

const initialStats: NotificationStats = {
  total: 0,
  pending: 0,
  delivered: 0,
  read: 0,
  dismissed: 0,
  byPriority: {
    [NotificationPriority.CRITICAL]: 0,
    [NotificationPriority.HIGH]: 0,
    [NotificationPriority.NORMAL]: 0,
    [NotificationPriority.LOW]: 0,
  },
  byType: {
    [NotificationType.NEW_EMERGENCY]: 0,
    [NotificationType.EMERGENCY_UPDATE]: 0,
    [NotificationType.EMERGENCY_ASSIGNED]: 0,
    [NotificationType.EMERGENCY_RESOLVED]: 0,
    [NotificationType.STATUS_CHANGE]: 0,
    [NotificationType.NEW_REPORT]: 0,
    [NotificationType.UNIT_ASSIGNED]: 0,
    [NotificationType.SYSTEM]: 0,
  },
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  // Estado inicial
  permissions: null,
  permissionsChecked: false,
  settings: DEFAULT_NOTIFICATION_SETTINGS,
  notifications: [],
  unreadCount: 0,
  isInitialized: false,
  pushToken: null,
  stats: initialStats,
  isLoading: false,
  error: null,

  // ← NUEVO: Cargar desde storage
  loadFromStorage: async () => {
    try {
      set({ isLoading: true, error: null });

      const [notifications, settings] = await Promise.all([
        notificationStorage.loadNotifications(),
        notificationStorage.loadSettings(),
      ]);

      // Calcular unreadCount desde las notificaciones cargadas
      const unreadCount = notifications.filter(
        (n) => n.status === NotificationStatus.DELIVERED
      ).length;

      set({
        notifications,
        settings: settings || get().settings,
        unreadCount,
        isLoading: false,
      });

      // Actualizar estadísticas después de cargar
      get().updateStats();

      console.log('Estado cargado desde storage');
    } catch (error) {
      console.error('Error cargando desde storage:', error);
      set({
        error: error instanceof Error ? error.message : 'Error desconocido',
        isLoading: false,
      });
    }
  },

  // ← NUEVO: Guardar en storage (método auxiliar)
  saveToStorage: async () => {
    try {
      await Promise.all([
        notificationStorage.saveNotifications(get().notifications),
        notificationStorage.saveSettings(get().settings),
      ]);
    } catch (error) {
      console.error('Error guardando en storage:', error);
    }
  },

  // Acciones - Permisos
  setPermissions: (permissions) => {
    set({ permissions });
  },

  setPermissionsChecked: (checked) => {
    set({ permissionsChecked: checked });
  },

  // Acciones - Configuración
  updateSettings: (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    }));
    get().saveToStorage(); // ← NUEVO: Guardar después de actualizar
  },

  toggleNotifications: (enabled) => {
    set((state) => ({
      settings: { ...state.settings, enabled },
    }));
    get().saveToStorage(); // ← NUEVO
  },

  toggleSound: (enabled) => {
    set((state) => ({
      settings: { ...state.settings, soundEnabled: enabled },
    }));
    get().saveToStorage(); // ← NUEVO
  },

  toggleVibration: (enabled) => {
    set((state) => ({
      settings: { ...state.settings, vibrationEnabled: enabled },
    }));
    get().saveToStorage(); // ← NUEVO
  },

  toggleCriticalAlerts: (enabled) => {
    set((state) => ({
      settings: { ...state.settings, criticalAlertsEnabled: enabled },
    }));
    get().saveToStorage(); // ← NUEVO
  },

  togglePriority: (priority, enabled) => {
    set((state) => ({
      settings: {
        ...state.settings,
        priorities: {
          ...state.settings.priorities,
          [priority]: enabled,
        },
      },
    }));
    get().saveToStorage(); // ← NUEVO
  },

  toggleType: (type, enabled) => {
    set((state) => ({
      settings: {
        ...state.settings,
        types: {
          ...state.settings.types,
          [type]: enabled,
        },
      },
    }));
    get().saveToStorage(); // ← NUEVO
  },

  updateQuietHours: (config) => {
    set((state) => ({
      settings: {
        ...state.settings,
        quietHours: config,
      },
    }));
    get().saveToStorage(); // ← NUEVO
  },

  // Acciones - Notificaciones
  addNotification: (notification) => {
    set((state) => {
      const notifications = [notification, ...state.notifications];
      const unreadCount =
        notification.status === NotificationStatus.DELIVERED
          ? state.unreadCount + 1
          : state.unreadCount;

      return { notifications, unreadCount };
    });
    get().updateStats();
    get().saveToStorage(); // ← NUEVO
  },

  updateNotification: (id, updates) => {
    set((state) => ({
      notifications: state.notifications.map((notif) =>
        notif.id === id ? { ...notif, ...updates } : notif
      ),
    }));
    get().updateStats();
    get().saveToStorage(); // ← NUEVO
  },

  removeNotification: (id) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      const notifications = state.notifications.filter((n) => n.id !== id);
      const unreadCount =
        notification?.status === NotificationStatus.DELIVERED
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount;

      return { notifications, unreadCount };
    });
    get().updateStats();
    get().saveToStorage(); // ← NUEVO
  },

  markAsRead: (id) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      const wasUnread = notification?.status === NotificationStatus.DELIVERED;

      return {
        notifications: state.notifications.map((notif) =>
          notif.id === id
            ? {
                ...notif,
                status: NotificationStatus.READ,
                readAt: new Date(),
              }
            : notif
        ),
        unreadCount: wasUnread
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      };
    });
    get().updateStats();
    get().saveToStorage(); // ← NUEVO
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((notif) =>
        notif.status === NotificationStatus.DELIVERED
          ? {
              ...notif,
              status: NotificationStatus.READ,
              readAt: new Date(),
            }
          : notif
      ),
      unreadCount: 0,
    }));
    get().updateStats();
    get().saveToStorage(); // ← NUEVO
  },

  dismissNotification: (id) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      const wasUnread = notification?.status === NotificationStatus.DELIVERED;

      return {
        notifications: state.notifications.map((notif) =>
          notif.id === id
            ? {
                ...notif,
                status: NotificationStatus.DISMISSED,
                dismissedAt: new Date(),
              }
            : notif
        ),
        unreadCount: wasUnread
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      };
    });
    get().updateStats();
    get().saveToStorage(); // ← NUEVO
  },

  dismissAll: () => {
    set((state) => ({
      notifications: state.notifications.map((notif) => ({
        ...notif,
        status: NotificationStatus.DISMISSED,
        dismissedAt: new Date(),
      })),
      unreadCount: 0,
    }));
    get().updateStats();
    get().saveToStorage(); // ← NUEVO
  },

  confirmNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.map((notif) =>
        notif.id === id
          ? {
              ...notif,
              status: NotificationStatus.READ,
              readAt: new Date(),
              confirmedAt: new Date(),
            }
          : notif
      ),
    }));
    get().updateStats();
    get().saveToStorage(); // ← NUEVO
  },

  // Acciones - Sistema
  setInitialized: (initialized) => {
    set({ isInitialized: initialized });
  },

  setPushToken: (token) => {
    set({ pushToken: token });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error });
  },

  // Selectores
  getNotificationById: (id) => {
    return get().notifications.find((n) => n.id === id);
  },

  getNotificationsByPriority: (priority) => {
    return get().notifications.filter((n) => n.config.priority === priority);
  },

  getNotificationsByType: (type) => {
    return get().notifications.filter((n) => n.config.type === type);
  },

  getUnreadNotifications: () => {
    return get().notifications.filter(
      (n) => n.status === NotificationStatus.DELIVERED
    );
  },

  getPendingNotifications: () => {
    return get().notifications.filter(
      (n) => n.status === NotificationStatus.PENDING
    );
  },

  getNotificationsRequiringConfirmation: () => {
    return get().notifications.filter(
      (n) =>
        n.config.requiresConfirmation &&
        n.status !== NotificationStatus.READ &&
        !n.confirmedAt
    );
  },

  // Utilidades
  updateStats: () => {
    const notifications = get().notifications;

    const stats: NotificationStats = {
      total: notifications.length,
      pending: notifications.filter((n) => n.status === NotificationStatus.PENDING)
        .length,
      delivered: notifications.filter(
        (n) => n.status === NotificationStatus.DELIVERED
      ).length,
      read: notifications.filter((n) => n.status === NotificationStatus.READ)
        .length,
      dismissed: notifications.filter(
        (n) => n.status === NotificationStatus.DISMISSED
      ).length,
      byPriority: {
        [NotificationPriority.CRITICAL]: notifications.filter(
          (n) => n.config.priority === NotificationPriority.CRITICAL
        ).length,
        [NotificationPriority.HIGH]: notifications.filter(
          (n) => n.config.priority === NotificationPriority.HIGH
        ).length,
        [NotificationPriority.NORMAL]: notifications.filter(
          (n) => n.config.priority === NotificationPriority.NORMAL
        ).length,
        [NotificationPriority.LOW]: notifications.filter(
          (n) => n.config.priority === NotificationPriority.LOW
        ).length,
      },
      byType: {
        [NotificationType.NEW_EMERGENCY]: notifications.filter(
          (n) => n.config.type === NotificationType.NEW_EMERGENCY
        ).length,
        [NotificationType.EMERGENCY_UPDATE]: notifications.filter(
          (n) => n.config.type === NotificationType.EMERGENCY_UPDATE
        ).length,
        [NotificationType.EMERGENCY_ASSIGNED]: notifications.filter(
          (n) => n.config.type === NotificationType.EMERGENCY_ASSIGNED
        ).length,
        [NotificationType.EMERGENCY_RESOLVED]: notifications.filter(
          (n) => n.config.type === NotificationType.EMERGENCY_RESOLVED
        ).length,
        [NotificationType.STATUS_CHANGE]: notifications.filter(
          (n) => n.config.type === NotificationType.STATUS_CHANGE
        ).length,
        [NotificationType.NEW_REPORT]: notifications.filter(
          (n) => n.config.type === NotificationType.NEW_REPORT
        ).length,
        [NotificationType.UNIT_ASSIGNED]: notifications.filter(
          (n) => n.config.type === NotificationType.UNIT_ASSIGNED
        ).length,
        [NotificationType.SYSTEM]: notifications.filter(
          (n) => n.config.type === NotificationType.SYSTEM
        ).length,
      },
    };

    set({ stats });
  },

  clearAll: () => {
    set({
      notifications: [],
      unreadCount: 0,
      stats: initialStats,
    });
    notificationStorage.clearNotifications(); // ← NUEVO
  },

  reset: () => {
    set({
      permissions: null,
      permissionsChecked: false,
      settings: DEFAULT_NOTIFICATION_SETTINGS,
      notifications: [],
      unreadCount: 0,
      isInitialized: false,
      pushToken: null,
      stats: initialStats,
      isLoading: false,
      error: null,
    });
    notificationStorage.clearAll(); // ← NUEVO
  },
}));
