/**
 * 🗄️ OFFLINE STORE (ZUSTAND)
 *
 * Estado global para modo offline y sincronización
 * - Estado de conexión
 * - Cola de operaciones
 * - Información de sincronización
 * - Configuración de caché
 */

import { emergencyQueue } from '@/services/background/emergencyQueue';
import { offlineStorage } from '@/services/storage/offlineStorage';
import type {
    OfflineState,
    QueuedOperation,
    SyncInfo
} from '@/types/offline';
import NetInfo from '@react-native-community/netinfo';
import { create } from 'zustand';

// ============================================================================
// ESTADO INICIAL
// ============================================================================

const initialSyncInfo: SyncInfo = {
  status: 'idle',
  lastSyncAt: undefined,
  pendingOperations: 0,
  failedOperations: 0,
  error: undefined,
};

const initialState: OfflineState = {
  isOnline: true,
  isConnected: true,
  queue: [],
  syncInfo: initialSyncInfo,
  cacheEnabled: true,
  cacheSize: 0,
  autoSync: true,
  syncInterval: 30, // 30 segundos
};

// ============================================================================
// INTERFACES DEL STORE
// ============================================================================

interface OfflineStore extends OfflineState {
  // Acciones de conexión
  setOnline: (isOnline: boolean) => void;
  setConnected: (isConnected: boolean) => void;
  checkConnection: () => Promise<boolean>;

  // Acciones de cola
  addToQueue: (operation: QueuedOperation) => void;
  removeFromQueue: (operationId: string) => void;
  updateQueueOperation: (operationId: string, updates: Partial<QueuedOperation>) => void;
  clearQueue: () => void;
  loadQueue: () => Promise<void>;

  // Acciones de sincronización
  startSync: () => Promise<void>;
  syncQueue: () => Promise<void>;
  updateSyncInfo: (info: Partial<SyncInfo>) => void;

  // Acciones de caché
  toggleCache: (enabled: boolean) => void;
  updateCacheSize: () => Promise<void>;
  clearCache: () => Promise<void>;

  // Configuración
  setAutoSync: (enabled: boolean) => void;
  setSyncInterval: (seconds: number) => void;

  // Inicialización
  initialize: () => Promise<void>;
}

// ============================================================================
// STORE
// ============================================================================

export const useOfflineStore = create<OfflineStore>((set, get) => ({
  ...initialState,

  // ==========================================================================
  // ACCIONES DE CONEXIÓN
  // ==========================================================================

  setOnline: (isOnline: boolean) => {
    set({ isOnline });
    console.log(`[OfflineStore] 📡 Estado online: ${isOnline}`);

    // Auto-sincronizar cuando vuelve la conexión
    if (isOnline && get().autoSync) {
      get().syncQueue();
    }
  },

  setConnected: (isConnected: boolean) => {
    set({ isConnected });
    console.log(`[OfflineStore] 🔌 Estado conectado: ${isConnected}`);
  },

  checkConnection: async () => {
    try {
      const state = await NetInfo.fetch();
      const isConnected = state.isConnected ?? false;
      const isOnline = state.isInternetReachable ?? false;

      set({ isOnline, isConnected });

      console.log(`[OfflineStore] 📊 Estado de conexión:`, {
        isConnected,
        isOnline,
        type: state.type,
      });

      return isOnline;
    } catch (error) {
      console.error('[OfflineStore] Error verificando conexión:', error);
      set({ isOnline: false, isConnected: false });
      return false;
    }
  },

  // ==========================================================================
  // ACCIONES DE COLA
  // ==========================================================================

  addToQueue: (operation: QueuedOperation) => {
    set(state => ({
      queue: [...state.queue, operation],
      syncInfo: {
        ...state.syncInfo,
        pendingOperations: state.syncInfo.pendingOperations + 1,
      },
    }));
    console.log(`[OfflineStore] ➕ Operación agregada a cola: ${operation.type}`);
  },

  removeFromQueue: (operationId: string) => {
    set(state => {
      const newQueue = state.queue.filter(op => op.id !== operationId);
      return {
        queue: newQueue,
        syncInfo: {
          ...state.syncInfo,
          pendingOperations: newQueue.filter(op => op.status === 'pending').length,
          failedOperations: newQueue.filter(op => op.status === 'failed').length,
        },
      };
    });
    console.log(`[OfflineStore] ➖ Operación eliminada de cola: ${operationId}`);
  },

  updateQueueOperation: (operationId: string, updates: Partial<QueuedOperation>) => {
    set(state => {
      const newQueue = state.queue.map(op =>
        op.id === operationId ? { ...op, ...updates } : op
      );
      return {
        queue: newQueue,
        syncInfo: {
          ...state.syncInfo,
          pendingOperations: newQueue.filter(op => op.status === 'pending').length,
          failedOperations: newQueue.filter(op => op.status === 'failed').length,
        },
      };
    });
    console.log(`[OfflineStore] 🔄 Operación actualizada: ${operationId}`);
  },

  clearQueue: () => {
    set({
      queue: [],
      syncInfo: {
        ...get().syncInfo,
        pendingOperations: 0,
        failedOperations: 0,
      },
    });
    console.log('[OfflineStore] 🗑️ Cola limpiada');
  },

  loadQueue: async () => {
    try {
      const operations = emergencyQueue.getAll();
      const stats = emergencyQueue.getStats();

      set({
        queue: operations,
        syncInfo: {
          ...get().syncInfo,
          pendingOperations: stats.pending,
          failedOperations: stats.failed,
        },
      });

      console.log(`[OfflineStore] ✅ Cola cargada: ${operations.length} operaciones`);
    } catch (error) {
      console.error('[OfflineStore] Error cargando cola:', error);
    }
  },

  // ==========================================================================
  // ACCIONES DE SINCRONIZACIÓN
  // ==========================================================================

  startSync: async () => {
    const { isOnline, syncInfo } = get();

    if (!isOnline) {
      console.warn('[OfflineStore] ⚠️ No se puede sincronizar sin conexión');
      return;
    }

    if (syncInfo.status === 'syncing') {
      console.warn('[OfflineStore] ⚠️ Sincronización ya en curso');
      return;
    }

    set(state => ({
      syncInfo: {
        ...state.syncInfo,
        status: 'syncing',
        error: undefined,
      },
    }));

    console.log('[OfflineStore] 🔄 Iniciando sincronización...');
  },

  syncQueue: async () => {
    const { queue, isOnline } = get();

    if (!isOnline) {
      console.warn('[OfflineStore] ⚠️ Sin conexión, no se puede sincronizar');
      return;
    }

    if (queue.length === 0) {
      console.log('[OfflineStore] ℹ️ No hay operaciones pendientes');
      return;
    }

    get().startSync();

    try {
      console.log(`[OfflineStore] 🔄 Sincronizando ${queue.length} operaciones...`);

      const result = await emergencyQueue.processQueue();

      if (result.success) {
        const { succeeded, failed } = result.data;

        // Recargar cola actualizada
        await get().loadQueue();

        set(state => ({
          syncInfo: {
            status: 'success',
            lastSyncAt: Date.now(),
            pendingOperations: state.queue.filter(op => op.status === 'pending').length,
            failedOperations: state.queue.filter(op => op.status === 'failed').length,
            error: undefined,
          },
        }));

        console.log(`[OfflineStore] ✅ Sincronización exitosa: ${succeeded} ok, ${failed} fallos`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      set(state => ({
        syncInfo: {
          ...state.syncInfo,
          status: 'error',
          error: errorMessage,
        },
      }));

      console.error('[OfflineStore] ❌ Error en sincronización:', errorMessage);
    }
  },

  updateSyncInfo: (info: Partial<SyncInfo>) => {
    set(state => ({
      syncInfo: {
        ...state.syncInfo,
        ...info,
      },
    }));
  },

  // ==========================================================================
  // ACCIONES DE CACHÉ
  // ==========================================================================

  toggleCache: (enabled: boolean) => {
    set({ cacheEnabled: enabled });
    console.log(`[OfflineStore] 💾 Caché ${enabled ? 'habilitado' : 'deshabilitado'}`);
  },

  updateCacheSize: async () => {
    try {
      const debugInfo = await offlineStorage.getDebugInfo();
      set({ cacheSize: debugInfo.totalSize });
      console.log(`[OfflineStore] 📊 Tamaño de caché: ${debugInfo.totalSize} bytes`);
    } catch (error) {
      console.error('[OfflineStore] Error actualizando tamaño de caché:', error);
    }
  },

  clearCache: async () => {
    try {
      await offlineStorage.clear();
      set({ cacheSize: 0 });
      console.log('[OfflineStore] ✅ Caché limpiado');
    } catch (error) {
      console.error('[OfflineStore] Error limpiando caché:', error);
    }
  },

  // ==========================================================================
  // CONFIGURACIÓN
  // ==========================================================================

  setAutoSync: (enabled: boolean) => {
    set({ autoSync: enabled });
    console.log(`[OfflineStore] ⚙️ Auto-sync ${enabled ? 'habilitado' : 'deshabilitado'}`);
  },

  setSyncInterval: (seconds: number) => {
    set({ syncInterval: seconds });
    console.log(`[OfflineStore] ⏱️ Intervalo de sync: ${seconds}s`);
  },

  // ==========================================================================
// INICIALIZACIÓN
// ==========================================================================

initialize: async () => {
  console.log('[OfflineStore] 🚀 Inicializando...');

  try {
    // 1. Verificar conexión inicial
    await get().checkConnection();

    // 2. Cargar cola desde AsyncStorage
    await get().loadQueue();

    // 3. Actualizar tamaño de caché
    await get().updateCacheSize();

    // 4. Configurar listener de NetInfo
    NetInfo.addEventListener(state => {
      const isConnected = state.isConnected ?? false;
      const isOnline = state.isInternetReachable ?? false;

      get().setOnline(isOnline);
      get().setConnected(isConnected);
    });

    console.log('[OfflineStore] ✅ Inicialización completada');
  } catch (error) {
    console.error('[OfflineStore] ❌ Error en inicialización:', error);
  }
},
}));

// ============================================================================
// SELECTORES ÚTILES
// ============================================================================

export const selectIsOnline = (state: OfflineStore) => state.isOnline;
export const selectPendingCount = (state: OfflineStore) => state.syncInfo.pendingOperations;
export const selectSyncStatus = (state: OfflineStore) => state.syncInfo.status;
export const selectCanSync = (state: OfflineStore) =>
  state.isOnline && state.syncInfo.pendingOperations > 0;
