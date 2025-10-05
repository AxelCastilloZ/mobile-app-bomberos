import * as Location from 'expo-location';

/**
 * Coordenadas geográficas básicas
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
}

/**
 * Dirección formateada (geocoding reverso)
 */
export interface Address {
  street?: string;
  city?: string;
  region?: string; // Estado/Provincia
  country?: string;
  postalCode?: string;
  name?: string; // Nombre del lugar
  formatted?: string; // Dirección completa formateada
}

/**
 * Ubicación completa con coordenadas y dirección
 */
export interface UserLocation {
  coordinates: Coordinates;
  address?: Address;
  timestamp: number;
}

/**
 * Estado de permisos de ubicación
 */
export type LocationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'undetermined';

/**
 * Estado del servicio de ubicación
 */
export interface LocationServiceState {
  isLoading: boolean;
  isEnabled: boolean; // GPS del dispositivo activado
  hasPermission: boolean;
  permissionStatus: LocationPermissionStatus;
  error: string | null;
}

/**
 * Configuración para obtener ubicación
 */
export interface LocationOptions {
  accuracy?: Location.LocationAccuracy;
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/**
 * Ubicación de un reporte/incidente
 */
export interface ReportLocation {
  id: string;
  coordinates: Coordinates;
  address?: Address;
  reportedAt: number;
  type?: 'fire' | 'medical' | 'police' | 'other';
}

/**
 * Resultado de geocoding reverso
 */
export interface GeocodingResult {
  success: boolean;
  address?: Address;
  error?: string;
}

/**
 * Opciones de geocoding
 */
export interface GeocodingOptions {
  useGoogleMaps?: boolean; // Si false, usa Expo
  language?: string;
}
