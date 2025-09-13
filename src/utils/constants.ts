export interface EmergencyType {
  id: string;
  label: string;
  icon: string;
  color: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export const EMERGENCY_TYPES: EmergencyType[] = [
  { 
    id: 'fire', 
    label: 'Incendio', 
    icon: 'fire', 
    color: '#FF4444',
    priority: 'critical'
  },
  { 
    id: 'medical', 
    label: 'Médica', 
    icon: 'medical-bag', 
    color: '#4CAF50',
    priority: 'high'
  },
  { 
    id: 'accident', 
    label: 'Accidente', 
    icon: 'car-crash', 
    color: '#FF8800',
    priority: 'high'
  },
  { 
    id: 'rescue', 
    label: 'Rescate', 
    icon: 'account-heart', 
    color: '#2196F3',
    priority: 'medium'
  },
];

// Duración del botón de emergencia (en milisegundos)
export const PRESS_DURATION = 2000;

// Números de teléfono importantes
export const PHONE_NUMBERS = {
  EMERGENCY: '911',
  STATION: '2682-0012',
  POLICE: '117',
  RED_CROSS: '128',
};

// Configuración de ubicación
export const LOCATION_CONFIG = {
  ACCURACY_THRESHOLD: 50, // metros
  MAX_AGE: 300000, // 5 minutos
  HIGH_ACCURACY_TIMEOUT: 15000, // 15 segundos
  LOW_ACCURACY_TIMEOUT: 5000, // 5 segundos
};

// Roles de usuario
export const USER_ROLES = {
  SUPERUSER: 'SUPERUSER',
  ADMIN: 'ADMIN',
  PERSONAL_BOMBERIL: 'PERSONAL_BOMBERIL',
  VOLUNTARIO: 'VOLUNTARIO',
  CITIZEN: 'CITIZEN',
} as const;

// Estados de reportes de emergencia
export const EMERGENCY_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  ACKNOWLEDGED: 'acknowledged',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled',
} as const;

// Colores del tema
export const THEME_COLORS = {
  PRIMARY: '#D32F2F',
  SECONDARY: '#FFA726',
  ERROR: '#FF1744',
  SUCCESS: '#4CAF50',
  WARNING: '#FF8800',
  INFO: '#2196F3',
  BACKGROUND: '#F5F5F5',
  SURFACE: '#FFFFFF',
  TEXT_PRIMARY: '#212121',
  TEXT_SECONDARY: '#666666',
} as const;

// URLs de API
export const API_ENDPOINTS = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
  HEALTH: '/health',
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
    VALIDATE: '/auth/validate',
    REFRESH: '/auth/refresh',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  EMERGENCY: {
    REPORT: '/app-mobile/emergency/report',
    REPORTS: '/app-mobile/emergency/reports',
    STATUS: '/app-mobile/emergency/status',
  },
} as const;

// Configuración de almacenamiento
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_CREDENTIALS: 'user_credentials',
  USER_PREFERENCES: 'user_preferences',
  EMERGENCY_REPORTS: 'emergency_reports',
  APP_STATE: 'app_state',
} as const;

// Configuración de la aplicación
export const APP_CONFIG = {
  NAME: 'Bomberos Nosara',
  VERSION: '1.0.0',
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  REQUEST_TIMEOUT: 15000,
  LOCATION_UPDATE_INTERVAL: 10000,
  LOCATION_UPDATE_DISTANCE: 10,
} as const;


export const SUPPORTED_PLATFORMS = ['ios', 'android'] as const;


export const NOTIFICATION_CONFIG = {
  EMERGENCY_CHANNEL_ID: 'emergency',
  GENERAL_CHANNEL_ID: 'general',
  PRIORITY: 'high',
} as const;