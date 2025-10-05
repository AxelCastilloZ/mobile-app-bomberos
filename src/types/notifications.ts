/**
 * Tipos para el Sistema de Notificaciones
 * Módulo 2 - Nosara Emergency App
 */

// Prioridades de notificación
export enum NotificationPriority {
  CRITICAL = 'critical', // Emergencias - override DND
  HIGH = 'high',         // Actualizaciones importantes
  NORMAL = 'normal',     // Notificaciones estándar
  LOW = 'low'           // Informativas
}

// Tipos de notificación
export enum NotificationType {
  NEW_EMERGENCY = 'new_emergency',
  EMERGENCY_UPDATE = 'emergency_update',
  EMERGENCY_ASSIGNED = 'emergency_assigned',
  EMERGENCY_RESOLVED = 'emergency_resolved',
  STATUS_CHANGE = 'status_change',
  NEW_REPORT = 'new_report',
  UNIT_ASSIGNED = 'unit_assigned',
  SYSTEM = 'system'
}

// Categorías de sonido
export enum SoundCategory {
  EMERGENCY_ALARM = 'emergency_alarm',
  EMERGENCY_UPDATE = 'emergency_update',
  NEW_REPORT = 'new_report',
  STATUS_CHANGE = 'status_change',
  NONE = 'none'
}

// Patrones de vibración
export enum VibrationPattern {
  CRITICAL = 'critical',      // Vibración continua
  URGENT = 'urgent',          // Patrón urgente
  STANDARD = 'standard',      // Patrón estándar
  SUBTLE = 'subtle',          // Vibración sutil
  NONE = 'none'
}

// Estado de notificación
export enum NotificationStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  READ = 'read',
  DISMISSED = 'dismissed',
  EXPIRED = 'expired'
}

// Datos de notificación
export interface NotificationData {
  emergencyId?: string;
  reportId?: string;
  unitId?: string;
  priority?: string;
  type?: string;
  status?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  metadata?: Record<string, any>;
}

// Configuración de notificación
export interface NotificationConfig {
  title: string;
  body: string;
  data: NotificationData;
  priority: NotificationPriority;
  type: NotificationType;
  sound: SoundCategory;
  vibration: VibrationPattern;
  categoryId?: string;
  badge?: number;
  requiresConfirmation?: boolean; // Para notificaciones críticas
  expiresAt?: Date;
  actionButtons?: NotificationAction[];
}

// Acción de notificación
export interface NotificationAction {
  id: string;
  title: string;
  icon?: string;
  destructive?: boolean;
  authenticationRequired?: boolean;
}

// Notificación completa
export interface Notification {
  id: string;
  config: NotificationConfig;
  status: NotificationStatus;
  createdAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  dismissedAt?: Date;
  confirmedAt?: Date;
}

// Configuración de permisos
export interface NotificationPermissions {
  granted: boolean;
  ios?: {
    status: 'granted' | 'denied' | 'undetermined';
    allowsAlert: boolean;
    allowsBadge: boolean;
    allowsSound: boolean;
    allowsCriticalAlerts: boolean;
  };
  android?: {
    status: 'granted' | 'denied';
  };
}

// Configuración de usuario
export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  criticalAlertsEnabled: boolean;
  badgeEnabled: boolean;
  priorities: {
    [NotificationPriority.CRITICAL]: boolean;
    [NotificationPriority.HIGH]: boolean;
    [NotificationPriority.NORMAL]: boolean;
    [NotificationPriority.LOW]: boolean;
  };
  types: {
    [key in NotificationType]: boolean;
  };
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;   // HH:mm
    allowCritical: boolean;
  };
}

// Estadísticas de notificaciones
export interface NotificationStats {
  total: number;
  pending: number;
  delivered: number;
  read: number;
  dismissed: number;
  byPriority: Record<NotificationPriority, number>;
  byType: Record<NotificationType, number>;
}



export type NotificationRecord = Notification;
