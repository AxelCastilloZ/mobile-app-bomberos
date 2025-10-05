/**
 * Constantes del Sistema de Notificaciones
 * Módulo 2 - Nosara Emergency App
 */

import {
    NotificationAction,
    NotificationPriority,
    NotificationType,
    SoundCategory,
    VibrationPattern,
} from '../types/notifications';

// Configuración de canales (Android)
export const NOTIFICATION_CHANNELS = {
  CRITICAL: {
    id: 'critical-emergencies',
    name: 'Emergencias Críticas',
    description: 'Alertas de emergencias que requieren atención inmediata',
    importance: 5, // MAX
    sound: true,
    vibration: true,
    badge: true,
    bypassDnd: true,
  },
  HIGH: {
    id: 'high-priority',
    name: 'Alta Prioridad',
    description: 'Notificaciones importantes de emergencias',
    importance: 4, // HIGH
    sound: true,
    vibration: true,
    badge: true,
    bypassDnd: false,
  },
  NORMAL: {
    id: 'normal',
    name: 'Normal',
    description: 'Notificaciones generales del sistema',
    importance: 3, // DEFAULT
    sound: true,
    vibration: true,
    badge: true,
    bypassDnd: false,
  },
  LOW: {
    id: 'low-priority',
    name: 'Baja Prioridad',
    description: 'Notificaciones informativas',
    importance: 2, // LOW
    sound: false,
    vibration: false,
    badge: true,
    bypassDnd: false,
  },
} as const;

// Mapeo de prioridad a canal
export const PRIORITY_TO_CHANNEL = {
  [NotificationPriority.CRITICAL]: NOTIFICATION_CHANNELS.CRITICAL.id,
  [NotificationPriority.HIGH]: NOTIFICATION_CHANNELS.HIGH.id,
  [NotificationPriority.NORMAL]: NOTIFICATION_CHANNELS.NORMAL.id,
  [NotificationPriority.LOW]: NOTIFICATION_CHANNELS.LOW.id,
} as const;

// Mapeo de tipo de notificación a configuración
export const NOTIFICATION_TYPE_CONFIG = {
  [NotificationType.NEW_EMERGENCY]: {
    priority: NotificationPriority.CRITICAL,
    sound: SoundCategory.EMERGENCY_ALARM,
    vibration: VibrationPattern.CRITICAL,
    requiresConfirmation: true,
    categoryId: 'emergency',
  },
  [NotificationType.EMERGENCY_UPDATE]: {
    priority: NotificationPriority.HIGH,
    sound: SoundCategory.EMERGENCY_UPDATE,
    vibration: VibrationPattern.URGENT,
    requiresConfirmation: false,
    categoryId: 'emergency',
  },
  [NotificationType.EMERGENCY_ASSIGNED]: {
    priority: NotificationPriority.HIGH,
    sound: SoundCategory.EMERGENCY_UPDATE,
    vibration: VibrationPattern.URGENT,
    requiresConfirmation: true,
    categoryId: 'emergency',
  },
  [NotificationType.EMERGENCY_RESOLVED]: {
    priority: NotificationPriority.NORMAL,
    sound: SoundCategory.STATUS_CHANGE,
    vibration: VibrationPattern.STANDARD,
    requiresConfirmation: false,
    categoryId: 'status',
  },
  [NotificationType.STATUS_CHANGE]: {
    priority: NotificationPriority.NORMAL,
    sound: SoundCategory.STATUS_CHANGE,
    vibration: VibrationPattern.STANDARD,
    requiresConfirmation: false,
    categoryId: 'status',
  },
  [NotificationType.NEW_REPORT]: {
    priority: NotificationPriority.NORMAL,
    sound: SoundCategory.NEW_REPORT,
    vibration: VibrationPattern.STANDARD,
    requiresConfirmation: false,
    categoryId: 'report',
  },
  [NotificationType.UNIT_ASSIGNED]: {
    priority: NotificationPriority.HIGH,
    sound: SoundCategory.EMERGENCY_UPDATE,
    vibration: VibrationPattern.URGENT,
    requiresConfirmation: true,
    categoryId: 'emergency',
  },
  [NotificationType.SYSTEM]: {
    priority: NotificationPriority.LOW,
    sound: SoundCategory.NONE,
    vibration: VibrationPattern.NONE,
    requiresConfirmation: false,
    categoryId: 'system',
  },
} as const;

// Categorías de notificación (iOS)
export const NOTIFICATION_CATEGORIES = {
  emergency: {
    id: 'emergency',
    actions: [
      {
        id: 'view',
        title: 'Ver Detalles',
        icon: 'eye',
        destructive: false,
        authenticationRequired: false,
      },
      {
        id: 'confirm',
        title: 'Confirmar',
        icon: 'checkmark',
        destructive: false,
        authenticationRequired: true,
      },
    ] as NotificationAction[],
  },
  status: {
    id: 'status',
    actions: [
      {
        id: 'view',
        title: 'Ver',
        icon: 'eye',
        destructive: false,
        authenticationRequired: false,
      },
    ] as NotificationAction[],
  },
  report: {
    id: 'report',
    actions: [
      {
        id: 'view',
        title: 'Ver Reporte',
        icon: 'document',
        destructive: false,
        authenticationRequired: false,
      },
    ] as NotificationAction[],
  },
  system: {
    id: 'system',
    actions: [] as NotificationAction[],
  },
} as const;

// Configuración de tiempos
export const NOTIFICATION_TIMING = {
  // Tiempo de expiración por prioridad (en milisegundos)
  EXPIRATION: {
    [NotificationPriority.CRITICAL]: 0, // No expira hasta confirmar
    [NotificationPriority.HIGH]: 30 * 60 * 1000, // 30 minutos
    [NotificationPriority.NORMAL]: 60 * 60 * 1000, // 1 hora
    [NotificationPriority.LOW]: 24 * 60 * 60 * 1000, // 24 horas
  },
  // Intervalo de retry para notificaciones críticas no confirmadas
  RETRY_INTERVAL: 5 * 60 * 1000, // 5 minutos
  // Máximo número de reintentos
  MAX_RETRIES: 3,
} as const;

// Configuración de badges
export const BADGE_CONFIG = {
  enabled: true,
  showOnlyUnread: true,
  maxCount: 99,
} as const;

// Configuración por defecto del usuario
export const DEFAULT_NOTIFICATION_SETTINGS = {
  enabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  criticalAlertsEnabled: true,
  badgeEnabled: true,
  priorities: {
    [NotificationPriority.CRITICAL]: true,
    [NotificationPriority.HIGH]: true,
    [NotificationPriority.NORMAL]: true,
    [NotificationPriority.LOW]: true,
  },
  types: {
    [NotificationType.NEW_EMERGENCY]: true,
    [NotificationType.EMERGENCY_UPDATE]: true,
    [NotificationType.EMERGENCY_ASSIGNED]: true,
    [NotificationType.EMERGENCY_RESOLVED]: true,
    [NotificationType.STATUS_CHANGE]: true,
    [NotificationType.NEW_REPORT]: true,
    [NotificationType.UNIT_ASSIGNED]: true,
    [NotificationType.SYSTEM]: true,
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '07:00',
    allowCritical: true, // Siempre permitir críticas
  },
} as const;

// Textos de notificaciones por tipo
export const NOTIFICATION_TEMPLATES = {
  [NotificationType.NEW_EMERGENCY]: {
    title: '🚨 Nueva Emergencia',
    body: (location: string, priority: string) =>
      `Emergencia de ${priority} en ${location}`,
  },
  [NotificationType.EMERGENCY_UPDATE]: {
    title: '📢 Actualización de Emergencia',
    body: (id: string) => `La emergencia #${id} ha sido actualizada`,
  },
  [NotificationType.EMERGENCY_ASSIGNED]: {
    title: '👮 Unidad Asignada',
    body: (unit: string, id: string) =>
      `Unidad ${unit} asignada a emergencia #${id}`,
  },
  [NotificationType.EMERGENCY_RESOLVED]: {
    title: '✅ Emergencia Resuelta',
    body: (id: string) => `La emergencia #${id} ha sido resuelta`,
  },
  [NotificationType.STATUS_CHANGE]: {
    title: '🔄 Cambio de Estado',
    body: (id: string, status: string) =>
      `Emergencia #${id} ahora está: ${status}`,
  },
  [NotificationType.NEW_REPORT]: {
    title: '📝 Nuevo Reporte',
    body: (type: string, location: string) =>
      `Nuevo reporte de ${type} en ${location}`,
  },
  [NotificationType.UNIT_ASSIGNED]: {
    title: '🚓 Nueva Asignación',
    body: (id: string) => `Has sido asignado a la emergencia #${id}`,
  },
  [NotificationType.SYSTEM]: {
    title: 'ℹ️ Notificación del Sistema',
    body: (message: string) => message,
  },
} as const;
