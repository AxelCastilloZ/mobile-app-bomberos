import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface LocationError {
  code: string;
  message: string;
  timestamp: number;
}

export const useLocation = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<LocationError | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  
  const watchSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    getLocationPermission();
    
    // Cleanup function
    return () => {
      stopWatching();
    };
  }, []);

  const createError = (code: string, message: string): LocationError => ({
    code,
    message,
    timestamp: Date.now()
  });

  const getLocationPermission = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Verificar si los servicios de ubicación están habilitados
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setError(createError('SERVICES_DISABLED', 
          'Los servicios de ubicación están deshabilitados en el dispositivo. ' +
          'Por favor habilítalos en Configuración > Ubicación.'));
        setIsLoading(false);
        return false;
      }

      // Solicitar permisos de ubicación
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError(createError('PERMISSION_DENIED',
          'Permisos de ubicación denegados. La app necesita acceso a la ubicación ' +
          'para reportar emergencias con precisión.'));
        setIsLoading(false);
        return false;
      }

      // Obtener ubicación actual
      await getCurrentLocation();
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido obteniendo permisos';
      setError(createError('PERMISSION_ERROR', `Error obteniendo permisos: ${errorMessage}`));
      console.error('Error obteniendo permisos de ubicación:', err);
      setIsLoading(false);
      return false;
    }
  };

  const getCurrentLocation = async (highAccuracy: boolean = true) => {
    try {
      setIsLoading(true);
      setError(null);

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
      });

      setLocation(currentLocation);
      setLastUpdate(Date.now());
      console.log('Ubicación obtenida:', {
        coords: currentLocation.coords,
        accuracy: currentLocation.coords.accuracy
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido obteniendo ubicación';
      setError(createError('LOCATION_ERROR', `Error obteniendo ubicación: ${errorMessage}`));
      console.error('Error obteniendo ubicación:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const startWatching = async (options?: {
    accuracy?: Location.Accuracy;
    timeInterval?: number;
    distanceInterval?: number;
  }) => {
    try {
      if (isWatching) return;

      const hasPermission = await getLocationPermission();
      if (!hasPermission) return;

      setIsWatching(true);

      watchSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: options?.accuracy || Location.Accuracy.High,
          timeInterval: options?.timeInterval || 10000, // 10 segundos
          distanceInterval: options?.distanceInterval || 10, // 10 metros
        },
        (newLocation) => {
          setLocation(newLocation);
          setLastUpdate(Date.now());
          console.log('Ubicación actualizada:', newLocation.coords);
        }
      );

      console.log('Monitoreo de ubicación iniciado');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error iniciando monitoreo';
      setError(createError('WATCH_ERROR', `Error iniciando monitoreo: ${errorMessage}`));
      console.error('Error iniciando watch:', err);
      setIsWatching(false);
    }
  };

  const stopWatching = () => {
    if (watchSubscription.current) {
      watchSubscription.current.remove();
      watchSubscription.current = null;
      setIsWatching(false);
      console.log('Monitoreo de ubicación detenido');
    }
  };

  const refreshLocation = async (highAccuracy: boolean = true) => {
    await getCurrentLocation(highAccuracy);
  };

  const getLocationString = (): string => {
    if (!location) return 'Ubicación no disponible';
    
    const { latitude, longitude } = location.coords;
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  };

  const getLocationAccuracy = (): string => {
    if (!location?.coords.accuracy) return 'Precisión desconocida';
    
    const accuracy = Math.round(location.coords.accuracy);
    if (accuracy < 5) return `Excelente (±${accuracy}m)`;
    if (accuracy < 10) return `Alta precisión (±${accuracy}m)`;
    if (accuracy < 50) return `Buena precisión (±${accuracy}m)`;
    if (accuracy < 100) return `Precisión moderada (±${accuracy}m)`;
    return `Baja precisión (±${accuracy}m)`;
  };

  const getLocationForEmergency = (): LocationData | null => {
    if (!location) return null;

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy || undefined,
      altitude: location.coords.altitude || undefined,
      altitudeAccuracy: location.coords.altitudeAccuracy || undefined,
      heading: location.coords.heading || undefined,
      speed: location.coords.speed || undefined,
      timestamp: location.timestamp,
    };
  };

  const getAddressFromCoords = async (lat?: number, lng?: number): Promise<string> => {
    try {
      const latitude = lat || location?.coords.latitude;
      const longitude = lng || location?.coords.longitude;

      if (!latitude || !longitude) {
        throw new Error('Coordenadas no disponibles');
      }

      const address = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      if (address && address.length > 0) {
        const addr = address[0];
        const parts = [
          addr.name,
          addr.street,
          addr.city,
          addr.region,
          addr.country
        ].filter(Boolean);
        
        return parts.join(', ') || 'Dirección no disponible';
      }

      return 'Dirección no encontrada';
    } catch (err) {
      console.error('Error obteniendo dirección:', err);
      return 'Error obteniendo dirección';
    }
  };

  const isLocationStale = (maxAgeMs: number = 300000): boolean => {
    // 5 minutos por defecto
    if (!lastUpdate) return true;
    return (Date.now() - lastUpdate) > maxAgeMs;
  };

  const getLocationAge = (): string => {
    if (!lastUpdate) return 'Nunca';
    
    const ageMs = Date.now() - lastUpdate;
    const ageSeconds = Math.floor(ageMs / 1000);
    const ageMinutes = Math.floor(ageSeconds / 60);
    
    if (ageSeconds < 60) return `${ageSeconds}s atrás`;
    if (ageMinutes < 60) return `${ageMinutes}m atrás`;
    return `${Math.floor(ageMinutes / 60)}h atrás`;
  };

  const hasGoodAccuracy = (threshold: number = 50): boolean => {
    if (!location?.coords.accuracy) return false;
    return location.coords.accuracy <= threshold;
  };

  const clearError = () => {
    setError(null);
  };

  return {
    // Estado básico
    location,
    isLoading,
    error,
    isWatching,
    lastUpdate,

    // Acciones principales
    getCurrentLocation,
    refreshLocation,
    startWatching,
    stopWatching,
    clearError,

    // Funciones de utilidad para mostrar
    getLocationString,
    getLocationAccuracy,
    getLocationAge,

    // Funciones para emergencias
    getLocationForEmergency,
    getAddressFromCoords,

    // Funciones de validación
    isLocationStale,
    hasGoodAccuracy,

    // Funciones legacy (mantener compatibilidad)
    retry: getLocationPermission,
    refresh: refreshLocation,
  };
};