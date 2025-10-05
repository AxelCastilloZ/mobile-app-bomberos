import { useCallback, useEffect } from 'react';
import geocodingService from '../services/location/geocoding';
import locationService from '../services/location/locationService';
import { useLocationStore } from '../store/locationStore';
import { LocationOptions, UserLocation } from '../types/location';

/**
 * Hook principal para manejo de geolocalización
 */
export const useLocation = () => {
  const {
    currentLocation,
    isLoading,
    isEnabled,
    hasPermission,
    permissionStatus,
    isWatching,
    error,
    lastUpdate,
    setLoading,
    setPermission,
    setServiceState,
    setCurrentLocation,
    setWatching,
    updateLocation,
    setError,
  } = useLocationStore();

  /**
   * Inicializa el servicio de ubicación
   */
  const initialize = useCallback(async () => {
    try {
      setLoading(true);
      const serviceState = await locationService.getServiceState();
      setServiceState(serviceState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize location service');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setServiceState, setError]);

  /**
   * Solicita permisos de ubicación
   */
  const requestPermission = useCallback(async () => {
    try {
      setLoading(true);
      const status = await locationService.requestPermissions();
      setPermission(status);

      // Actualizar estado del GPS
      const isEnabled = await locationService.isLocationEnabled();
      setServiceState({ isEnabled });

      return status === 'granted';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request permissions');
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setPermission, setServiceState, setError]);

  /**
   * Obtiene la ubicación actual
   */
  const getCurrentLocation = useCallback(
    async (options?: LocationOptions): Promise<UserLocation | null> => {
      try {
        setLoading(true);
        setError(null);

        const location = await locationService.getCurrentLocation(options);

        if (location) {
          // Obtener dirección si es posible
          const geocodeResult = await geocodingService.reverseGeocode(
            location.coordinates
          );

          const fullLocation: UserLocation = {
            ...location,
            address: geocodeResult.success ? geocodeResult.address : undefined,
          };

          setCurrentLocation(fullLocation);
          return fullLocation;
        }

        return null;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setCurrentLocation, setError]
  );

  /**
   * Inicia el seguimiento de ubicación
   */
  const startWatching = useCallback(
    async (options?: LocationOptions) => {
      try {
        setError(null);

        await locationService.startWatchingLocation(
          async (location) => {
            // Obtener dirección
            const geocodeResult = await geocodingService.reverseGeocode(
              location.coordinates
            );

            const fullLocation: UserLocation = {
              ...location,
              address: geocodeResult.success ? geocodeResult.address : undefined,
            };

            updateLocation(fullLocation);
          },
          options
        );

        setWatching(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start watching location');
        setWatching(false);
      }
    },
    [updateLocation, setWatching, setError]
  );

  /**
   * Detiene el seguimiento de ubicación
   */
  const stopWatching = useCallback(async () => {
    try {
      await locationService.stopWatchingLocation();
      setWatching(false);
    } catch (err) {
      console.error('Error stopping location watch:', err);
    }
  }, [setWatching]);

  /**
   * Abre la configuración de ubicación del dispositivo
   */
  const openSettings = useCallback(async () => {
    try {
      await locationService.openLocationSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open settings');
    }
  }, [setError]);

  /**
   * Refresca el estado del servicio
   */
  const refresh = useCallback(async () => {
    await initialize();
    if (hasPermission && isEnabled) {
      await getCurrentLocation();
    }
  }, [initialize, hasPermission, isEnabled, getCurrentLocation]);

  /**
   * Calcula distancia desde ubicación actual a unas coordenadas
   */
  const getDistanceFrom = useCallback(
    (latitude: number, longitude: number): number | null => {
      if (!currentLocation) return null;

      return locationService.calculateDistance(
        currentLocation.coordinates,
        { latitude, longitude }
      );
    },
    [currentLocation]
  );

  /**
   * Formatea distancia en texto legible
   */
  const formatDistance = useCallback(
    (latitude: number, longitude: number): string | null => {
      const distance = getDistanceFrom(latitude, longitude);
      if (distance === null) return null;

      return locationService.formatDistance(distance);
    },
    [getDistanceFrom]
  );

  // Auto-inicializar al montar el hook
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (isWatching) {
        stopWatching();
      }
    };
  }, [isWatching, stopWatching]);

  return {
    // Estado
    currentLocation,
    isLoading,
    isEnabled,
    hasPermission,
    permissionStatus,
    isWatching,
    error,
    lastUpdate,

    // Acciones
    requestPermission,
    getCurrentLocation,
    startWatching,
    stopWatching,
    openSettings,
    refresh,

    // Utilidades
    getDistanceFrom,
    formatDistance,
  };
};
