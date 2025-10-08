/**
 * 🔌 USE OFFLINE HOOK
 *
 * Hook principal para gestión de modo offline
 * - Estado de conexión
 * - Cola de operaciones
 * - Sincronización
 * - Caché
 */

import { backgroundSync } from '@/services/background/backgroundSync';
import { emergencyQueue } from '@/services/background/emergencyQueue';
import { offlineStorage } from '@/services/storage/offlineStorage';
import { secureStorage } from '@/services/storage/secureStorage';
import { useOfflineStore } from '@/store/offlineStore';
import type { QueuedOperationType } from '@/types/offline';
import { useCallback, useEffect } from 'react';

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useOffline() {
  const store = useOfflineStore();

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const init = async () => {
      console.log('[useOffline] Inicializando...');

      // Inicializar store (carga cola, verifica conexión)
      await store.initialize();

      // Inicializar background sync
      await backgroundSync.initialize();
    };

    init();

    // Cleanup al desmontar
    return () => {
      if (cleanup) cleanup();
      backgroundSync.cleanup();
    };
  }, []);

  // ==========================================================================
  // OPERACIONES DE COLA
  // ==========================================================================

  /**
   * Encolar operación para sincronización posterior
   */
  const enqueueOperation = useCallback(
    async (
      type: QueuedOperationType,
      payload: Record<string, any>,
      priority: 'low' | 'medium' | 'high' = 'medium'
    ) => {
      const result = await emergencyQueue.enqueue(type, payload, priority);

      if (result.success) {
        await store.loadQueue();
        console.log(`[useOffline] Operación encolada: ${type}`);
        return { success: true, id: result.data };
      } else {
        console.error('[useOffline] Error encolando operación:', result.error);
        return { success: false, error: result.error };
      }
    },
    [store]
  );

  /**
   * Eliminar operación de la cola
   */
  const removeOperation = useCallback(
    async (operationId: string) => {
      const result = await emergencyQueue.remove(operationId);

      if (result.success) {
        await store.loadQueue();
        console.log(`[useOffline] Operación eliminada: ${operationId}`);
      }

      return result;
    },
    [store]
  );

  /**
   * Limpiar operaciones completadas
   */
  const pruneQueue = useCallback(async () => {
    const result = await emergencyQueue.prune();

    if (result.success) {
      await store.loadQueue();
      console.log(`[useOffline] Cola limpiada: ${result.data} operaciones eliminadas`);
    }

    return result;
  }, [store]);

  /**
   * Limpiar toda la cola
   */
  const clearQueue = useCallback(async () => {
    const result = await emergencyQueue.clear();

    if (result.success) {
      store.clearQueue();
      console.log('[useOffline] Cola completamente limpiada');
    }

    return result;
  }, [store]);

  // ==========================================================================
  // SINCRONIZACIÓN
  // ==========================================================================

  /**
   * Sincronizar cola manualmente
   */
  const syncNow = useCallback(async () => {
    if (!store.isOnline) {
      console.warn('[useOffline] No se puede sincronizar sin conexión');
      return { success: false, error: 'Sin conexión a internet' };
    }

    await store.syncQueue();
    return { success: true };
  }, [store]);

  /**
   * Habilitar/deshabilitar auto-sync
   */
  const setAutoSync = useCallback(
    (enabled: boolean) => {
      store.setAutoSync(enabled);
    },
    [store]
  );

  /**
   * Configurar intervalo de sincronización
   */
  const setSyncInterval = useCallback(
    (seconds: number) => {
      store.setSyncInterval(seconds);
    },
    [store]
  );

  // ==========================================================================
  // CACHÉ
  // ==========================================================================

  /**
   * Guardar datos en caché
   */
  const saveToCache = useCallback(
    async <T = any>(key: string, data: T) => {
      // Mapear keys genéricos a tipos específicos
      const cacheKey = key as any; // Cast necesario para tipos dinámicos
      const result = await offlineStorage.set(cacheKey, data);

      if (result.success) {
        await store.updateCacheSize();
      }

      return result;
    },
    [store]
  );

  /**
   * Obtener datos de caché
   */
  const getFromCache = useCallback(
    async <T = any>(key: string) => {
      const cacheKey = key as any;
      return await offlineStorage.get<T>(cacheKey);
    },
    []
  );

  /**
   * Limpiar caché completo
   */
  const clearCache = useCallback(async () => {
    await store.clearCache();
  }, [store]);

  /**
   * Habilitar/deshabilitar caché
   */
  const toggleCache = useCallback(
    (enabled: boolean) => {
      store.toggleCache(enabled);
    },
    [store]
  );

  // ==========================================================================
  // STORAGE SEGURO
  // ==========================================================================

  /**
   * Guardar dato seguro
   */
  const saveSecure = useCallback(
    async (key: string, value: string) => {
      return await secureStorage.setItem(key, value);
    },
    []
  );

  /**
   * Obtener dato seguro
   */
  const getSecure = useCallback(
    async (key: string) => {
      return await secureStorage.getItem(key);
    },
    []
  );

  /**
   * Eliminar dato seguro
   */
  const removeSecure = useCallback(
    async (key: string) => {
      return await secureStorage.removeItem(key);
    },
    []
  );

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  /**
   * Verificar conexión manualmente
   */
  const checkConnection = useCallback(async () => {
    return await store.checkConnection();
  }, [store]);

  /**
   * Registrar handler para tipo de operación
   */
  const registerHandler = useCallback(
    (type: QueuedOperationType, handler: (payload: any) => Promise<void>) => {
      emergencyQueue.registerHandler(type, handler);
    },
    []
  );

  /**
   * Obtener estadísticas de la cola
   */
  const getQueueStats = useCallback(() => {
    return emergencyQueue.getStats();
  }, []);

  /**
   * Obtener información de debug
   */
  const getDebugInfo = useCallback(async () => {
    const [queueDebug, syncDebug, cacheDebug, secureDebug] = await Promise.all([
      emergencyQueue.getDebugInfo(),
      backgroundSync.getDebugInfo(),
      offlineStorage.getDebugInfo(),
      secureStorage.getDebugInfo(),
    ]);

    return {
      queue: queueDebug,
      sync: syncDebug,
      cache: cacheDebug,
      secure: secureDebug,
      store: {
        isOnline: store.isOnline,
        isConnected: store.isConnected,
        syncInfo: store.syncInfo,
        cacheEnabled: store.cacheEnabled,
        cacheSize: store.cacheSize,
        autoSync: store.autoSync,
      },
    };
  }, [store]);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // Estado
    isOnline: store.isOnline,
    isConnected: store.isConnected,
    queue: store.queue,
    syncInfo: store.syncInfo,
    cacheEnabled: store.cacheEnabled,
    cacheSize: store.cacheSize,
    autoSync: store.autoSync,
    syncInterval: store.syncInterval,

    // Cola
    enqueueOperation,
    removeOperation,
    pruneQueue,
    clearQueue,
    registerHandler,
    getQueueStats,

    // Sincronización
    syncNow,
    setAutoSync,
    setSyncInterval,

    // Caché
    saveToCache,
    getFromCache,
    clearCache,
    toggleCache,

    // Storage seguro
    saveSecure,
    getSecure,
    removeSecure,

    // Utilidades
    checkConnection,
    getDebugInfo,
  };
}
