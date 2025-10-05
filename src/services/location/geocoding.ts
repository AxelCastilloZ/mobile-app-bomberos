import * as Location from 'expo-location';
import { Address, Coordinates, GeocodingOptions, GeocodingResult } from '../../types/location';

/**
 * Servicio para geocoding reverso (coordenadas → dirección)
 */
class GeocodingService {
  private static instance: GeocodingService;

  private constructor() {}

  static getInstance(): GeocodingService {
    if (!GeocodingService.instance) {
      GeocodingService.instance = new GeocodingService();
    }
    return GeocodingService.instance;
  }

  /**
   * Convierte coordenadas a dirección usando Expo Location
   */
  async reverseGeocode(
    coordinates: Coordinates,
    options?: GeocodingOptions
  ): Promise<GeocodingResult> {
    try {
      const { latitude, longitude } = coordinates;

      // Usar API de Expo Location
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (!addresses || addresses.length === 0) {
        return {
          success: false,
          error: 'No address found for these coordinates',
        };
      }

      const expoAddress = addresses[0];

      // Formatear dirección
      const address: Address = {
        street: expoAddress.street || expoAddress.name || undefined,
        city: expoAddress.city || expoAddress.subregion || undefined,
        region: expoAddress.region || undefined,
        country: expoAddress.country || undefined,
        postalCode: expoAddress.postalCode || undefined,
        name: expoAddress.name || undefined,
        formatted: this.formatAddress(expoAddress),
      };

      return {
        success: true,
        address,
      };
    } catch (error) {
      console.error('❌ Error in reverse geocoding:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Geocoding failed',
      };
    }
  }

  /**
   * Convierte dirección a coordenadas (geocoding forward)
   */
  async geocode(address: string): Promise<Coordinates | null> {
    try {
      const locations = await Location.geocodeAsync(address);

      if (!locations || locations.length === 0) {
        console.warn('⚠️ No coordinates found for address:', address);
        return null;
      }

      const location = locations[0];

      return {
        latitude: location.latitude,
        longitude: location.longitude,
        altitude: location.altitude,
        accuracy: location.accuracy,
      };
    } catch (error) {
      console.error('❌ Error in geocoding:', error);
      return null;
    }
  }

  /**
   * Formatea una dirección en texto legible
   */
  private formatAddress(expoAddress: Location.LocationGeocodedAddress): string {
    const parts: string[] = [];

    // Calle y número
    if (expoAddress.name) {
      parts.push(expoAddress.name);
    } else if (expoAddress.street) {
      parts.push(expoAddress.street);
    }

    // Ciudad
    if (expoAddress.city) {
      parts.push(expoAddress.city);
    } else if (expoAddress.subregion) {
      parts.push(expoAddress.subregion);
    }

    // Región/Estado
    if (expoAddress.region) {
      parts.push(expoAddress.region);
    }

    // País
    if (expoAddress.country) {
      parts.push(expoAddress.country);
    }

    return parts.join(', ') || 'Dirección desconocida';
  }

  /**
   * Obtiene dirección corta (solo calle y ciudad)
   */
  async getShortAddress(coordinates: Coordinates): Promise<string> {
    const result = await this.reverseGeocode(coordinates);

    if (!result.success || !result.address) {
      return 'Ubicación desconocida';
    }

    const { street, city } = result.address;

    if (street && city) {
      return `${street}, ${city}`;
    }

    if (street) return street;
    if (city) return city;

    return result.address.formatted || 'Ubicación desconocida';
  }

  /**
   * Verifica si las coordenadas están en Costa Rica
   */
  isInCostaRica(coordinates: Coordinates): boolean {
    const { latitude, longitude } = coordinates;

    // Límites aproximados de Costa Rica
    const CR_BOUNDS = {
      minLat: 8.0,
      maxLat: 11.5,
      minLng: -86.0,
      maxLng: -82.5,
    };

    return (
      latitude >= CR_BOUNDS.minLat &&
      latitude <= CR_BOUNDS.maxLat &&
      longitude >= CR_BOUNDS.minLng &&
      longitude <= CR_BOUNDS.maxLng
    );
  }

  /**
   * Verifica si las coordenadas están en la zona de Nosara
   */
  isInNosaraArea(coordinates: Coordinates): boolean {
    const { latitude, longitude } = coordinates;

    // Límites aproximados de Nosara, Guanacaste
    const NOSARA_BOUNDS = {
      minLat: 9.9,
      maxLat: 10.1,
      minLng: -85.7,
      maxLng: -85.5,
    };

    return (
      latitude >= NOSARA_BOUNDS.minLat &&
      latitude <= NOSARA_BOUNDS.maxLat &&
      longitude >= NOSARA_BOUNDS.minLng &&
      longitude <= NOSARA_BOUNDS.maxLng
    );
  }

  /**
   * Obtiene información de zona basada en coordenadas
   */
  async getLocationInfo(coordinates: Coordinates): Promise<{
    inCostaRica: boolean;
    inNosara: boolean;
    address?: Address;
  }> {
    const inCostaRica = this.isInCostaRica(coordinates);
    const inNosara = this.isInNosaraArea(coordinates);
    const geocodeResult = await this.reverseGeocode(coordinates);

    return {
      inCostaRica,
      inNosara,
      address: geocodeResult.success ? geocodeResult.address : undefined,
    };
  }
}

export default GeocodingService.getInstance();
