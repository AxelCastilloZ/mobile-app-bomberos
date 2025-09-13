import { Platform } from 'react-native';
import Constants from 'expo-constants';

export type Environment = 'development' | 'staging' | 'production';

interface EnvironmentConfig {
  API_BASE_URL: string;
  WS_BASE_URL: string;
  PROJECT_ID: string;
  DEBUG_MODE: boolean;
  ENABLE_LOGGING: boolean;
  SENTRY_DSN?: string;
  GOOGLE_MAPS_API_KEY?: string;
}

// Accesos a extra/.env (solo lo necesario)
const extra = (Constants.expoConfig?.extra ?? {}) as any;
const ENV = {
  API: process.env.EXPO_PUBLIC_API_BASE_URL as string | undefined,
  WS: process.env.EXPO_PUBLIC_WS_BASE_URL as string | undefined,
  PROJECT_ID: process.env.EXPO_PUBLIC_PROJECT_ID as string | undefined,
  SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN as string | undefined,
  GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string | undefined,
  DEBUG_MODE: process.env.EXPO_PUBLIC_DEBUG_MODE as string | undefined,          // 'true' | 'false'
  ENABLE_LOGGING: process.env.EXPO_PUBLIC_ENABLE_LOGGING as string | undefined,  // 'true' | 'false'
};

const getEnvironment = (): Environment => {
  if (__DEV__) {
    return 'development';
  }

  if (Constants.appOwnership === 'expo') {
    return 'development';
  }

  const channel = extra?.channel;
  if (channel === 'staging') {
    return 'staging';
  }

  return 'production';
};

const environmentConfigs: Record<Environment, EnvironmentConfig> = {
  development: {
    API_BASE_URL:
      ENV.API ??
      extra.apiBaseUrl ??
      (Platform.select({
        ios: 'http://localhost:3000',
        android: 'http://10.0.2.2:3000',
        default: 'http://192.168.100.115:3000',
      }) as string),

    WS_BASE_URL:
      ENV.WS ??
      extra.wsBaseUrl ??
      (Platform.select({
        ios: 'ws://localhost:3000',
        android: 'ws://10.0.2.2:3000',
        default: 'ws://192.168.100.115:3000',
      }) as string),

    PROJECT_ID: ENV.PROJECT_ID ?? extra.projectId ?? 'bomberos-nosara-dev',

    // Si la var existe, evalúa 'true'/'false'; si no, usa extra o tu default
    DEBUG_MODE:
      ENV.DEBUG_MODE !== undefined
        ? ENV.DEBUG_MODE.toLowerCase() === 'true'
        : (extra.debugMode ?? true),

    ENABLE_LOGGING:
      ENV.ENABLE_LOGGING !== undefined
        ? ENV.ENABLE_LOGGING.toLowerCase() === 'true'
        : (extra.enableLogging ?? true),

    SENTRY_DSN: ENV.SENTRY_DSN ?? extra.sentryDsn,
    GOOGLE_MAPS_API_KEY: ENV.GOOGLE_MAPS_API_KEY ?? extra.googleMapsApiKey,
  },

  staging: {
    API_BASE_URL: ENV.API ?? extra.apiBaseUrl ?? 'https://api-staging.bomberos-nosara.cr',
    WS_BASE_URL: ENV.WS ?? extra.wsBaseUrl ?? 'wss://api-staging.bomberos-nosara.cr',
    PROJECT_ID: ENV.PROJECT_ID ?? extra.projectId ?? 'bomberos-nosara-staging',
    DEBUG_MODE: true,
    ENABLE_LOGGING: true,
    SENTRY_DSN: ENV.SENTRY_DSN ?? extra.sentryDsn,
  },

  production: {
    API_BASE_URL: ENV.API ?? extra.apiBaseUrl ?? 'https://api.bomberos-nosara.cr',
    WS_BASE_URL: ENV.WS ?? extra.wsBaseUrl ?? 'wss://api.bomberos-nosara.cr',
    PROJECT_ID: ENV.PROJECT_ID ?? extra.projectId ?? 'bomberos-nosara-prod',
    DEBUG_MODE: false,
    ENABLE_LOGGING: false,
    SENTRY_DSN: ENV.SENTRY_DSN ?? extra.sentryDsn,
    GOOGLE_MAPS_API_KEY: ENV.GOOGLE_MAPS_API_KEY ?? extra.googleMapsApiKey,
  },
};

export const ENVIRONMENT = getEnvironment();
export const CONFIG = environmentConfigs[ENVIRONMENT];

export const API_ENDPOINTS = {
  BASE_URL: CONFIG.API_BASE_URL,
  WS_BASE_URL: CONFIG.WS_BASE_URL,

  HEALTH: '/health',

  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VALIDATE: '/auth/validate',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
  },

  EMERGENCY: {
    REPORT: '/app-mobile/emergency/report',
    REPORTS: '/app-mobile/emergency/reports',
    REPORTS_PUBLIC: '/app-mobile/emergency/reports/public',
    REPORTS_MY: '/app-mobile/emergency/reports/my',
    STATUS: '/app-mobile/emergency/status',
    UPDATE_STATUS: '/app-mobile/emergency/update-status',
  },

  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    REPORTS: '/admin/reports',
    USERS: '/admin/users',
    STATS: '/admin/stats',
  },

  NOTIFICATIONS: {
    REGISTER_TOKEN: '/notifications/register-token',
    UNREGISTER_TOKEN: '/notifications/unregister-token',
    SEND: '/notifications/send',
  },

  UPLOAD: {
    EMERGENCY_PHOTO: '/upload/emergency-photo',
    EMERGENCY_AUDIO: '/upload/emergency-audio',
    PROFILE_PHOTO: '/upload/profile-photo',
  },
} as const;

export const NETWORK_CONFIG = {
  REQUEST_TIMEOUT: 15000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  PING_INTERVAL: 30000,
  CONNECTION_CHECK_INTERVAL: 60000,
} as const;

export const LOCATION_CONFIG = {
  ACCURACY_THRESHOLD: 50, // metros
  MAX_AGE: 300000, // 5 minutos
  HIGH_ACCURACY_TIMEOUT: 15000, // 15 segundos
  LOW_ACCURACY_TIMEOUT: 5000, // 5 segundos
  BACKGROUND_LOCATION_TASK: 'background-location-task',
} as const;

// Configuración de notificaciones
export const NOTIFICATION_CONFIG = {
  EMERGENCY_CHANNEL_ID: 'emergency',
  REPORTS_CHANNEL_ID: 'reports',
  GENERAL_CHANNEL_ID: 'general',
  DEFAULT_SOUND: 'default',
  EMERGENCY_SOUND: 'emergency_alert.wav',
} as const;

// Configuración de almacenamiento
export const STORAGE_CONFIG = {
  MAX_REPORTS_CACHE: 100,
  CACHE_EXPIRY_TIME: 7 * 24 * 60 * 60 * 1000, // 7 días
  AUTO_CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 horas
  SECURE_STORAGE_PREFIX: 'bomberos_secure_',
  ASYNC_STORAGE_PREFIX: 'bomberos_',
} as const;

// URLs de servicios externos
export const EXTERNAL_SERVICES = {
  GOOGLE_MAPS_BASE: 'https://maps.googleapis.com/maps/api',
  EMERGENCY_HOTLINE: '911',
  STATION_PHONE: '2682-0012',
  POLICE_HOTLINE: '117',
  RED_CROSS_HOTLINE: '128',
} as const;

// Configuración de desarrollo
export const DEV_CONFIG = {
  SHOW_PERFORMANCE_MONITOR: CONFIG.DEBUG_MODE,
  ENABLE_FLIP: CONFIG.DEBUG_MODE,
  LOG_LEVEL: CONFIG.DEBUG_MODE ? 'debug' : 'error',
  MOCK_API_RESPONSES: false, // Cambiar a true para testing offline
  SIMULATE_SLOW_NETWORK: false,
} as const;

// Información de la aplicación
export const APP_INFO = {
  NAME: 'Bomberos Nosara',
  VERSION: Constants.expoConfig?.version || '1.0.0',
  BUILD_NUMBER:
    Constants.expoConfig?.android?.versionCode ||
    Constants.expoConfig?.ios?.buildNumber ||
    '1',
  BUNDLE_ID:
    Constants.expoConfig?.ios?.bundleIdentifier ||
    Constants.expoConfig?.android?.package ||
    'com.bomberos.nosara',
  PROJECT_ID: CONFIG.PROJECT_ID,
} as const;

// Configuración de colores y tema
export const THEME_CONFIG = {
  PRIMARY_COLOR: '#D32F2F',
  SECONDARY_COLOR: '#FFA726',
  ERROR_COLOR: '#FF1744',
  SUCCESS_COLOR: '#4CAF50',
  WARNING_COLOR: '#FF8800',
  INFO_COLOR: '#2196F3',
  BACKGROUND_COLOR: '#F5F5F5',
  SURFACE_COLOR: '#FFFFFF',
  TEXT_PRIMARY: '#212121',
  TEXT_SECONDARY: '#666666',
} as const;

// Configuración de emergencias
export const EMERGENCY_CONFIG = {
  BUTTON_PRESS_DURATION: 2000, // 2 segundos
  AUTO_LOCATION_TIMEOUT: 15000, // 15 segundos
  EMERGENCY_SOUND_DURATION: 5000, // 5 segundos
  MAX_RETRY_ATTEMPTS: 5,
  OFFLINE_STORAGE_LIMIT: 50, // máximo reportes offline
} as const;

// Validación de configuración en desarrollo
if (CONFIG.DEBUG_MODE) {
  console.log('🔧 Environment Config:', {
    environment: ENVIRONMENT,
    apiUrl: CONFIG.API_BASE_URL,
    wsUrl: CONFIG.WS_BASE_URL,
    projectId: CONFIG.PROJECT_ID,
    platform: Platform.OS,
  });
}

// Funciones de utilidad
export const isProduction = () => ENVIRONMENT === 'production';
export const isDevelopment = () => ENVIRONMENT === 'development';
export const isStaging = () => ENVIRONMENT === 'staging';

export const getApiUrl = (endpoint: string) => {
  return `${CONFIG.API_BASE_URL}${endpoint}`;
};

export const getWebSocketUrl = (endpoint: string = '') => {
  return `${CONFIG.WS_BASE_URL}${endpoint}`;
};

export const shouldEnableLogging = () => {
  return CONFIG.ENABLE_LOGGING || __DEV__;
};

export const getGoogleMapsApiKey = () => {
  return CONFIG.GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
};

export const EXPO_CONFIG = {
  PROJECT_ID: CONFIG.PROJECT_ID,
  OWNER: Constants.expoConfig?.owner || 'bomberos-nosara',
  SLUG: Constants.expoConfig?.slug || 'bomberos-nosara',
  SDK_VERSION: Constants.expoConfig?.sdkVersion || '49.0.0',
  PLATFORM: Platform.OS,
  IS_DEVICE: Constants.isDevice,
  DEVICE_NAME: Constants.deviceName,
} as const;
