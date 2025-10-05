import * as Location from 'expo-location';
import {
    Coordinates,
    LocationOptions,
    LocationPermissionStatus,
    LocationServiceState,
    UserLocation,
} from '../../types/location';

/**
 * Servicio singleton para manejo de geolocalización
 */
class LocationService {
  private static instance: LocationService;
  private watchSubscription: Location.LocationSubscription | null = null;

  private constructor() {}

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Solicita permisos de ubicación (foreground)
   */
  async requestPermissions(): Promise<LocationPermissionStatus> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      switch (status) {
        case Location.PermissionStatus.GRANTED:
          return 'granted';
        case Location.PermissionStatus.DENIED:
          return 'denied';
        default:
          return 'undetermined';
      }
    } catch (error) {
      console.error('❌ Error requesting location permissions:', error);
      return 'denied';
    }
  }

  /**
   * Verifica el estado actual de los permisos
   */
  async checkPermissions(): Promise<LocationPermissionStatus> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();

      switch (status) {
        case Location.PermissionStatus.GRANTED:
          return 'granted';
        case Location.PermissionStatus.DENIED:
          return 'denied';
        default:
          return 'undetermined';
      }
    } catch (error) {
      console.error('❌ Error checking location permissions:', error);
      return 'undetermined';
    }
  }

  /**
   * Verifica si el GPS está habilitado en el dispositivo
   */
  async isLocationEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      console.error('❌ Error checking location services:', error);
      return false;
    }
  }

  /**
   * Obtiene el estado completo del servicio de ubicación
   */
  async getServiceState(): Promise<LocationServiceState> {
    try {
      const permissionStatus = await this.checkPermissions();
      const isEnabled = await this.isLocationEnabled();

      return {
        isLoading: false,
        isEnabled,
        hasPermission: permissionStatus === 'granted',
        permissionStatus,
        error: null,
      };
    } catch (error) {
      return {
        isLoading: false,
        isEnabled: false,
        hasPermission: false,
        permissionStatus: 'denied',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Obtiene la ubicación actual del usuario
   */
  async getCurrentLocation(options?: LocationOptions): Promise<UserLocation | null> {
    try {
      // Verificar permisos primero
      const permissionStatus = await this.checkPermissions();
      if (permissionStatus !== 'granted') {
        throw new Error('Location permission not granted');
      }

      // Verificar si GPS está habilitado
      const isEnabled = await this.isLocationEnabled();
      if (!isEnabled) {
        throw new Error('Location services are disabled');
      }

      // Obtener ubicación
      const location = await Location.getCurrentPositionAsync({
        accuracy: options?.accuracy || Location.Accuracy.Balanced,
        ...(options?.timeout && { timeout: options.timeout }),
        ...(options?.maximumAge && { maximumAge: options.maximumAge }),
      });

      const coordinates: Coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude,
        accuracy: location.coords.accuracy,
        altitudeAccuracy: location.coords.altitudeAccuracy,
        heading: location.coords.heading,
        speed: location.coords.speed,
      };

      return {
        coordinates,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('❌ Error getting current location:', error);
      throw error;
    }
  }

  /**
   * Inicia el seguimiento de ubicación (watch position)
   * Útil para actualizar ubicación mientras la app está abierta
   */
  async startWatchingLocation(
    callback: (location: UserLocation) => void,
    options?: LocationOptions
  ): Promise<void> {
    try {
      // Detener watching anterior si existe
      await this.stopWatchingLocation();

      const permissionStatus = await this.checkPermissions();
      if (permissionStatus !== 'granted') {
        throw new Error('Location permission not granted');
      }

      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: options?.accuracy || Location.Accuracy.Balanced,
          timeInterval: 10000, // Actualizar cada 10 segundos
          distanceInterval: 50, // O cada 50 metros
        },
        (location) => {
          const coordinates: Coordinates = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude,
            accuracy: location.coords.accuracy,
            altitudeAccuracy: location.coords.altitudeAccuracy,
            heading: location.coords.heading,
            speed: location.coords.speed,
          };

          callback({
            coordinates,
            timestamp: location.timestamp,
          });
        }
      );

      console.log('✅ Location watching started');
    } catch (error) {
      console.error('❌ Error starting location watch:', error);
      throw error;
    }
  }

  /**
   * Detiene el seguimiento de ubicación
   */
  async stopWatchingLocation(): Promise<void> {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
      console.log('✅ Location watching stopped');
    }
  }

  /**
   * Abre la configuración de ubicación del dispositivo
   */
  async openLocationSettings(): Promise<void> {
    try {
      // En iOS abre Settings, en Android abre Location Settings
      await Location.enableNetworkProviderAsync();
    } catch (error) {
      console.error('❌ Error opening location settings:', error);
      // Fallback: instrucciones al usuario
      throw new Error('Please enable location services in your device settings');
    }
  }

  /**
   * Calcula la distancia entre dos coordenadas (en metros)
   * Usa la fórmula de Haversine
   */
  calculateDistance(
    coord1: { latitude: number; longitude: number },
    coord2: { latitude: number; longitude: number }
  ): number {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = (coord1.latitude * Math.PI) / 180;
    const φ2 = (coord2.latitude * Math.PI) / 180;
    const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distancia en metros
  }

  /**
   * Formatea la distancia en texto legible
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }
}

export default LocationService.getInstance();
