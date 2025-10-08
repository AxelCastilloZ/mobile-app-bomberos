/**
 * 💾 OFFLINE STORAGE SERVICE
 *
 * Gestión de caché de datos para modo offline usando AsyncStorage
 * - Emergencias activas
 * - Reportes del usuario
 * - Perfil de usuario
 * - Configuración de la app
 * - Control de expiración (TTL)
 */

import type {
    CacheConfig,
    CachedData,
    CachedDataType,
    StorageResult
} from '@/types/offline';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// CONSTANTES
// ============================================================================

const CACHE_PREFIX = '@nosara_cache:';

const CACHE_KEYS = {
  ACTIVE_EMERGENCIES: `${CACHE_PREFIX}active_emergencies`,
  USER_REPORTS: `${CACHE_PREFIX}user_reports`,
  USER_PROFILE: `${CACHE_PREFIX}user_profile`,
  APP_CONFIG: `${CACHE_PREFIX}app_config`,
  EMERGENCY_TYPES: `${CACHE_PREFIX}emergency_types`,
  CACHE_METADATA: `${CACHE_PREFIX}metadata`,
} as const;

// TTL por defecto (en segundos)
const DEFAULT_TTL = {
  active_emergencies: 300,    // 5 minutos
  user_reports: 3600,         // 1 hora
  user_profile: 86400,        // 24 horas
  app_config: 604800,         // 7 días
  emergency_types: 604800,    // 7 días
} as const;

// Configuración por defecto
const DEFAULT_CONFIG: CacheConfig = {
  maxSize: 10 * 1024 * 1024,  // 10 MB
  defaultTTL: 3600,            // 1 hora
  evictionPolicy: 'LRU',       // Least Recently Used
};

// ============================================================================
// INTERFACES INTERNAS
// ============================================================================

interface CacheMetadata {
  totalSize: number;
  itemCount: number;
  lastAccess: Record<string, number>; // Para política LRU
  accessCount: Record<string, number>; // Para política LFU
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

class OfflineStorageService {
  private static instance: OfflineStorageService;
  private config: CacheConfig = DEFAULT_CONFIG;
  private metadata: CacheMetadata = {
    totalSize: 0,
    itemCount: 0,
    lastAccess: {},
    accessCount: {},
  };

  private constructor() {
    this.loadMetadata();
  }

  public static getInstance(): OfflineStorageService {
    if (!OfflineStorageService.instance) {
      OfflineStorageService.instance = new OfflineStorageService();
    }
    return OfflineStorageService.instance;
  }

  // ==========================================================================
  // MÉTODOS PRINCIPALES DE CACHÉ
  // ==========================================================================

  /**
   * Guardar datos en caché
   */
  async set<T = any>(
    type: CachedDataType,
    data: T,
    options?: { ttl?: number; version?: string }
  ): Promise<StorageResult<void>> {
    try {
      const key = this.getKeyForType(type);
      const ttl = options?.ttl || DEFAULT_TTL[type] || this.config.defaultTTL;

      const cachedData: CachedData<T> = {
        key: type,
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + (ttl * 1000),
        version: options?.version || '1.0.0',
      };

      const serialized = JSON.stringify(cachedData);
      const dataSize = new Blob([serialized]).size;

      // Verificar tamaño máximo
      if (dataSize > this.config.maxSize) {
        return {
          success: false,
          error: `Dato excede el tamaño máximo (${dataSize} > ${this.config.maxSize})`,
        };
      }

      // Eviction si es necesario
      if (this.metadata.totalSize + dataSize > this.config.maxSize) {
        await this.evict(dataSize);
      }

      // Guardar dato
      await AsyncStorage.setItem(key, serialized);

      // Actualizar metadata
      this.metadata.totalSize += dataSize;
      this.metadata.itemCount += 1;
      this.metadata.lastAccess[key] = Date.now();
      this.metadata.accessCount[key] = (this.metadata.accessCount[key] || 0) + 1;
      await this.saveMetadata();

      console.log(`[OfflineStorage] ✅ Dato guardado: ${type} (${dataSize} bytes)`);
      return { success: true, data: undefined };
    } catch (error) {
      console.error('[OfflineStorage] Error guardando:', type, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Obtener datos de caché
   */
  async get<T = any>(type: CachedDataType): Promise<StorageResult<T | null>> {
    try {
      const key = this.getKeyForType(type);
      const serialized = await AsyncStorage.getItem(key);

      if (!serialized) {
        return { success: true, data: null };
      }

      const cachedData: CachedData<T> = JSON.parse(serialized);

      // Verificar expiración
      if (cachedData.expiresAt && Date.now() > cachedData.expiresAt) {
        console.log(`[OfflineStorage] ⚠️ Dato expirado: ${type}`);
        await this.remove(type);
        return { success: true, data: null };
      }

      // Actualizar metadata de acceso
      this.metadata.lastAccess[key] = Date.now();
      this.metadata.accessCount[key] = (this.metadata.accessCount[key] || 0) + 1;
      await this.saveMetadata();

      console.log(`[OfflineStorage] ✅ Dato obtenido: ${type}`);
      return { success: true, data: cachedData.data };
    } catch (error) {
      console.error('[OfflineStorage] Error obteniendo:', type, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Eliminar dato de caché
   */
  async remove(type: CachedDataType): Promise<StorageResult<void>> {
    try {
      const key = this.getKeyForType(type);
      const serialized = await AsyncStorage.getItem(key);

      if (serialized) {
        const dataSize = new Blob([serialized]).size;
        await AsyncStorage.removeItem(key);

        // Actualizar metadata
        this.metadata.totalSize -= dataSize;
        this.metadata.itemCount -= 1;
        delete this.metadata.lastAccess[key];
        delete this.metadata.accessCount[key];
        await this.saveMetadata();

        console.log(`[OfflineStorage] ✅ Dato eliminado: ${type}`);
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error('[OfflineStorage] Error eliminando:', type, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Limpiar toda la caché
   */
  async clear(): Promise<StorageResult<void>> {
    try {
      const keys = Object.values(CACHE_KEYS).filter(k => k !== CACHE_KEYS.CACHE_METADATA);
      await AsyncStorage.multiRemove(keys);

      // Resetear metadata
      this.metadata = {
        totalSize: 0,
        itemCount: 0,
        lastAccess: {},
        accessCount: {},
      };
      await this.saveMetadata();

      console.log('[OfflineStorage] ✅ Caché limpiada');
      return { success: true, data: undefined };
    } catch (error) {
      console.error('[OfflineStorage] Error limpiando caché:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  // ==========================================================================
  // MÉTODOS ESPECÍFICOS POR TIPO DE DATO
  // ==========================================================================

  /**
   * Guardar emergencias activas
   */
  async setActiveEmergencies(emergencies: any[]): Promise<StorageResult<void>> {
    return this.set('active_emergencies', emergencies, { ttl: 300 }); // 5 min
  }

  /**
   * Obtener emergencias activas
   */
  async getActiveEmergencies(): Promise<StorageResult<any[] | null>> {
    return this.get('active_emergencies');
  }

  /**
   * Guardar reportes del usuario
   */
  async setUserReports(reports: any[]): Promise<StorageResult<void>> {
    return this.set('user_reports', reports, { ttl: 3600 }); // 1 hora
  }

  /**
   * Obtener reportes del usuario
   */
  async getUserReports(): Promise<StorageResult<any[] | null>> {
    return this.get('user_reports');
  }

  /**
   * Guardar perfil de usuario
   */
  async setUserProfile(profile: any): Promise<StorageResult<void>> {
    return this.set('user_profile', profile, { ttl: 86400 }); // 24 horas
  }

  /**
   * Obtener perfil de usuario
   */
  async getUserProfile(): Promise<StorageResult<any | null>> {
    return this.get('user_profile');
  }

  /**
   * Guardar configuración de app
   */
  async setAppConfig(config: any): Promise<StorageResult<void>> {
    return this.set('app_config', config, { ttl: 604800 }); // 7 días
  }

  /**
   * Obtener configuración de app
   */
  async getAppConfig(): Promise<StorageResult<any | null>> {
    return this.get('app_config');
  }

  /**
   * Guardar tipos de emergencia (catálogo)
   */
  async setEmergencyTypes(types: any[]): Promise<StorageResult<void>> {
    return this.set('emergency_types', types, { ttl: 604800 }); // 7 días
  }

  /**
   * Obtener tipos de emergencia
   */
  async getEmergencyTypes(): Promise<StorageResult<any[] | null>> {
    return this.get('emergency_types');
  }

  // ==========================================================================
  // GESTIÓN DE METADATA Y EVICTION
  // ==========================================================================

  /**
   * Cargar metadata desde AsyncStorage
   */
  private async loadMetadata(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(CACHE_KEYS.CACHE_METADATA);
      if (data) {
        this.metadata = JSON.parse(data);
      }
    } catch (error) {
      console.error('[OfflineStorage] Error cargando metadata:', error);
    }
  }

  /**
   * Guardar metadata en AsyncStorage
   */
  private async saveMetadata(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        CACHE_KEYS.CACHE_METADATA,
        JSON.stringify(this.metadata)
      );
    } catch (error) {
      console.error('[OfflineStorage] Error guardando metadata:', error);
    }
  }

  /**
   * Política de eviction (desalojo de caché)
   */
  private async evict(requiredSpace: number): Promise<void> {
    console.log(`[OfflineStorage] 🗑️ Eviction necesaria: ${requiredSpace} bytes`);

    const keys = Object.entries(this.metadata.lastAccess)
      .sort(([, a], [, b]) => {
        if (this.config.evictionPolicy === 'LRU') {
          return a - b; // Menos reciente primero
        } else if (this.config.evictionPolicy === 'LFU') {
          const accessA = this.metadata.accessCount[a] || 0;
          const accessB = this.metadata.accessCount[b] || 0;
          return accessA - accessB; // Menos frecuente primero
        }
        return 0; // FIFO
      })
      .map(([key]) => key);

    let freedSpace = 0;

    for (const key of keys) {
      if (freedSpace >= requiredSpace) break;

      const serialized = await AsyncStorage.getItem(key);
      if (serialized) {
        const dataSize = new Blob([serialized]).size;
        await AsyncStorage.removeItem(key);
        freedSpace += dataSize;
        console.log(`[OfflineStorage] 🗑️ Eliminado: ${key} (${dataSize} bytes)`);
      }
    }

    console.log(`[OfflineStorage] ✅ Eviction completada: ${freedSpace} bytes liberados`);
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  /**
   * Obtener key de AsyncStorage para un tipo
   */
  private getKeyForType(type: CachedDataType): string {
    const keyMap: Record<CachedDataType, string> = {
      active_emergencies: CACHE_KEYS.ACTIVE_EMERGENCIES,
      user_reports: CACHE_KEYS.USER_REPORTS,
      user_profile: CACHE_KEYS.USER_PROFILE,
      app_config: CACHE_KEYS.APP_CONFIG,
      emergency_types: CACHE_KEYS.EMERGENCY_TYPES,
    };
    return keyMap[type];
  }

  /**
   * Obtener información de debug
   */
  async getDebugInfo() {
    return {
      totalSize: this.metadata.totalSize,
      itemCount: this.metadata.itemCount,
      maxSize: this.config.maxSize,
      usagePercent: (this.metadata.totalSize / this.config.maxSize) * 100,
      evictionPolicy: this.config.evictionPolicy,
      items: this.metadata.lastAccess,
    };
  }

  /**
   * Configurar caché
   */
  setConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[OfflineStorage] ⚙️ Configuración actualizada:', this.config);
  }
}

// ============================================================================
// EXPORTAR INSTANCIA SINGLETON
// ============================================================================

export const offlineStorage = OfflineStorageService.getInstance();
