// Configuración general de la aplicación
export const APP_CONFIG = {
  NAME: 'Nosara Emergency',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: 'soporte@bomberos-nosara.cr',
} as const;

// Configuración de desarrollo vs producción
export const ENV_CONFIG = {
  IS_DEV: __DEV__,
  API_BASE_URL: __DEV__ 
    ? 'http://192.168.1.100:3000/api' 
    : 'https://api.bomberos-nosara.cr/api',
} as const;