import { Alert, Linking, Platform } from 'react-native';
import { Coordinates } from '../../types/location';

/**
 * Servicio para navegación externa con Google Maps y Waze
 */
class MapService {
  private static instance: MapService;

  private constructor() {}

  static getInstance(): MapService {
    if (!MapService.instance) {
      MapService.instance = new MapService();
    }
    return MapService.instance;
  }

  /**
   * Abre Google Maps con navegación a las coordenadas
   */
  async openGoogleMaps(coordinates: Coordinates, label?: string): Promise<void> {
    const { latitude, longitude } = coordinates;
    const labelParam = label ? `&label=${encodeURIComponent(label)}` : '';

    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}${labelParam}`,
      android: `geo:0,0?q=${latitude},${longitude}(${encodeURIComponent(label || 'Ubicación')})`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    });

    try {
      const canOpen = await Linking.canOpenURL(url!);

      if (canOpen) {
        await Linking.openURL(url!);
      } else {
        // Fallback a URL web
        const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Error opening Google Maps:', error);
      Alert.alert('Error', 'No se pudo abrir Google Maps');
    }
  }

  /**
   * Abre Waze con navegación a las coordenadas
   */
  async openWaze(coordinates: Coordinates): Promise<void> {
    const { latitude, longitude } = coordinates;
    const url = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;

    try {
      const canOpen = await Linking.canOpenURL(url);

      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Waze no disponible',
          '¿Deseas instalar Waze?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Instalar',
              onPress: () => {
                const storeUrl = Platform.select({
                  ios: 'https://apps.apple.com/app/waze-navigation-live-traffic/id323229106',
                  android: 'https://play.google.com/store/apps/details?id=com.waze',
                });
                if (storeUrl) Linking.openURL(storeUrl);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error opening Waze:', error);
      Alert.alert('Error', 'No se pudo abrir Waze');
    }
  }

  /**
   * Muestra menú de opciones de navegación
   */
  showNavigationOptions(coordinates: Coordinates, label?: string): void {
    Alert.alert(
      'Navegar a ubicación',
      '¿Con qué app deseas navegar?',
      [
        {
          text: 'Google Maps',
          onPress: () => this.openGoogleMaps(coordinates, label),
        },
        {
          text: 'Waze',
          onPress: () => this.openWaze(coordinates),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  }

  /**
   * Verifica si una app de mapas está disponible
   */
  async isAppAvailable(app: 'googlemaps' | 'waze'): Promise<boolean> {
    const urls = {
      googlemaps: Platform.select({
        ios: 'maps://',
        android: 'geo:',
        default: 'https://maps.google.com',
      }),
      waze: 'waze://',
    };

    try {
      return await Linking.canOpenURL(urls[app]!);
    } catch {
      return false;
    }
  }

  /**
   * Obtiene URL de Google Maps para compartir
   */
  getShareableMapUrl(coordinates: Coordinates, label?: string): string {
    const { latitude, longitude } = coordinates;
    const labelParam = label ? `(${encodeURIComponent(label)})` : '';
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}${labelParam}`;
  }

  /**
   * Abre mapa con múltiples puntos (ruta)
   */
  async openRouteWithMultiplePoints(
    origin: Coordinates,
    destination: Coordinates,
    waypoints?: Coordinates[]
  ): Promise<void> {
    const { latitude: destLat, longitude: destLng } = destination;

    let url = `https://www.google.com/maps/dir/?api=1`;
    url += `&origin=${origin.latitude},${origin.longitude}`;
    url += `&destination=${destLat},${destLng}`;

    if (waypoints && waypoints.length > 0) {
      const waypointsStr = waypoints
        .map(wp => `${wp.latitude},${wp.longitude}`)
        .join('|');
      url += `&waypoints=${waypointsStr}`;
    }

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening route:', error);
      Alert.alert('Error', 'No se pudo abrir la ruta');
    }
  }
}

export default MapService.getInstance();
