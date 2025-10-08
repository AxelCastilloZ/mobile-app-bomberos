import { useCallback, useEffect, useState } from 'react';
import mapService from '../services/location/mapService';
import { Coordinates } from '../types/location';

/**
 * Hook para navegación con mapas externos
 */
export const useMapNavigation = () => {
  const [isGoogleMapsAvailable, setIsGoogleMapsAvailable] = useState(false);
  const [isWazeAvailable, setIsWazeAvailable] = useState(false);

  useEffect(() => {
    // Verificar apps disponibles
    const checkApps = async () => {
      const [googleMaps, waze] = await Promise.all([
        mapService.isAppAvailable('googlemaps'),
        mapService.isAppAvailable('waze'),
      ]);

      setIsGoogleMapsAvailable(googleMaps);
      setIsWazeAvailable(waze);
    };

    checkApps();
  }, []);

  /**
   * Navega con Google Maps
   */
  const navigateWithGoogleMaps = useCallback(
    async (coordinates: Coordinates, label?: string) => {
      await mapService.openGoogleMaps(coordinates, label);
    },
    []
  );

  /**
   * Navega con Waze
   */
  const navigateWithWaze = useCallback(
    async (coordinates: Coordinates) => {
      await mapService.openWaze(coordinates);
    },
    []
  );

  /**
   * Muestra menú de opciones
   */
  const showNavigationOptions = useCallback(
    (coordinates: Coordinates, label?: string) => {
      mapService.showNavigationOptions(coordinates, label);
    },
    []
  );

  /**
   * Obtiene URL para compartir
   */
  const getShareableUrl = useCallback(
    (coordinates: Coordinates, label?: string) => {
      return mapService.getShareableMapUrl(coordinates, label);
    },
    []
  );

  /**
   * Navega con ruta de múltiples puntos
   */
  const navigateWithRoute = useCallback(
    async (origin: Coordinates, destination: Coordinates, waypoints?: Coordinates[]) => {
      await mapService.openRouteWithMultiplePoints(origin, destination, waypoints);
    },
    []
  );

  return {
    // Estado
    isGoogleMapsAvailable,
    isWazeAvailable,

    // Acciones
    navigateWithGoogleMaps,
    navigateWithWaze,
    showNavigationOptions,
    getShareableUrl,
    navigateWithRoute,
  };
};
