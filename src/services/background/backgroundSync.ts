/**
 * 🔄 BACKGROUND SYNC SERVICE
 *
 * Sincronización automática en background
 * - Sincronización periódica cuando hay conexión
 * - Background fetch (preparado para development build)
 * - Listeners de eventos de red
 * - Retry automático con estrategia exponencial
 */

import NetInfo from '@react-native-community/netinfo';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { emergencyQueue } from './emergencyQueue';

// ============================================================================
// CONSTANTES
// ============================================================================

const BACKGROUND_SYNC_TASK = 'BACKGROUND_SYNC_TASK';
const DEFAULT_INTERVAL = 15 * 60; // 15 minutos en segundos
const MIN_INTERVAL = 15 * 60; // Mínimo permitido por iOS/Android

// ============================================================================
// TIPOS
// ============================================================================

interface SyncConfig {
  enabled: boolean;
  interval: number; // Segundos
  minimumFetch: number; // Segundos mínimos entre fetches
  stopOnTerminate: boolean; // Detener cuando app se cierra
}

interface SyncResult {
  success: boolean;
  operationsProcessed: number;
  operationsSucceeded: number;
  operationsFailed: number;
  timestamp: number;
}

// ============================================================================
// TASK MANAGER - BACKGROUND TASK
// ============================================================================

/**
 * Definir tarea de background
 * NOTA: Requiere development build, no funciona en Expo Go
 */
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    console.log('[BackgroundSync] 🔄 Ejecutando tarea de background...');

    // Verificar conexión
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      console.log('[BackgroundSync] ⚠️ Sin conexión, se omite sincronización');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Procesar cola
    const result = await emergencyQueue.processQueue();

    if (result.success) {
      const { succeeded, failed } = result.data;
      console.log(`[BackgroundSync] ✅ Sincronización completada: ${succeeded} ok, ${failed} fallos`);

      if (succeeded > 0) {
        return BackgroundFetch.BackgroundFetchResult.NewData;
      }
      return BackgroundFetch.BackgroundFetchResult.NoData;
    } else {
      console.error('[BackgroundSync] ❌ Error en sincronización:', result.error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  } catch (error) {
    console.error('[BackgroundSync] ❌ Error en tarea de background:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

class BackgroundSyncService {
  private static instance: BackgroundSyncService;
  private config: SyncConfig = {
    enabled: false, // Deshabilitado por defecto (requiere dev build)
    interval: DEFAULT_INTERVAL,
    minimumFetch: MIN_INTERVAL,
    stopOnTerminate: false,
  };
  private isRegistered: boolean = false;
  private netInfoUnsubscribe?: () => void;
  private syncInterval?: NodeJS.Timeout;

  private constructor() {
    // Singleton
  }

  public static getInstance(): BackgroundSyncService {
    if (!BackgroundSyncService.instance) {
      BackgroundSyncService.instance = new BackgroundSyncService();
    }
    return BackgroundSyncService.instance;
  }

  // ==========================================================================
  // INICIALIZACIÓN Y REGISTRO
  // ==========================================================================

  /**
   * Inicializar servicio de background sync
   * NOTA: Background fetch requiere development build
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('[BackgroundSync] 🚀 Inicializando...');

      // Verificar si background fetch está disponible
      const isAvailable = await this.isBackgroundFetchAvailable();

      if (!isAvailable) {
        console.warn('[BackgroundSync] ⚠️ Background fetch no disponible (requiere development build)');
        // Usar sincronización manual con NetInfo como fallback
        this.setupManualSync();
        return false;
      }

      // Verificar estado del registro
      const status: BackgroundFetch.BackgroundFetchStatus | null = await BackgroundFetch.getStatusAsync();
      if (status !== null) {
        console.log('[BackgroundSync] 📊 Estado de background fetch:', this.getStatusName(status));
      }

      // Configurar listeners de red como backup
      this.setupNetworkListeners();

      return true;
    } catch (error) {
      console.error('[BackgroundSync] ❌ Error inicializando:', error);
      // Fallback a sincronización manual
      this.setupManualSync();
      return false;
    }
  }

  /**
   * Registrar tarea de background
   */
  async register(): Promise<boolean> {
    try {
      if (this.isRegistered) {
        console.log('[BackgroundSync] ℹ️ Ya está registrado');
        return true;
      }

      const isAvailable = await this.isBackgroundFetchAvailable();
      if (!isAvailable) {
        console.warn('[BackgroundSync] ⚠️ No se puede registrar, background fetch no disponible');
        return false;
      }

      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: this.config.interval,
        stopOnTerminate: this.config.stopOnTerminate,
        startOnBoot: true,
      });

      this.isRegistered = true;
      this.config.enabled = true;
      console.log('[BackgroundSync] ✅ Tarea registrada correctamente');
      return true;
    } catch (error) {
      console.error('[BackgroundSync] ❌ Error registrando tarea:', error);
      return false;
    }
  }

  /**
   * Desregistrar tarea de background
   */
  async unregister(): Promise<boolean> {
    try {
      if (!this.isRegistered) {
        console.log('[BackgroundSync] ℹ️ No hay tarea registrada');
        return true;
      }

      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
      this.isRegistered = false;
      this.config.enabled = false;
      console.log('[BackgroundSync] ✅ Tarea desregistrada');
      return true;
    } catch (error) {
      console.error('[BackgroundSync] ❌ Error desregistrando tarea:', error);
      return false;
    }
  }

  // ==========================================================================
  // SINCRONIZACIÓN MANUAL (FALLBACK)
  // ==========================================================================

  /**
   * Configurar sincronización manual con listeners de red
   * Usado cuando background fetch no está disponible (Expo Go)
   */
  private setupManualSync(): void {
    console.log('[BackgroundSync] 🔧 Configurando sincronización manual...');

    // Limpiar intervalo anterior si existe
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Sincronización periódica cada X minutos
    this.syncInterval = setInterval(async () => {
      const netState = await NetInfo.fetch();
      if (netState.isConnected && netState.isInternetReachable) {
        await this.syncNow();
      }
    }, this.config.interval * 1000);

    console.log('[BackgroundSync] ✅ Sincronización manual configurada');
  }

  /**
   * Configurar listeners de cambios de red
   */
  private setupNetworkListeners(): void {
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
    }

    this.netInfoUnsubscribe = NetInfo.addEventListener(async (state) => {
      // Solo sincronizar cuando la conexión cambia a online
      if (state.isConnected && state.isInternetReachable) {
        console.log('[BackgroundSync] 📡 Conexión restaurada, sincronizando...');
        await this.syncNow();
      }
    });

    console.log('[BackgroundSync] 📡 Listeners de red configurados');
  }

  /**
   * Ejecutar sincronización inmediata
   */
  async syncNow(): Promise<SyncResult> {
    try {
      console.log('[BackgroundSync] 🔄 Sincronización manual iniciada...');

      const result = await emergencyQueue.processQueue();

      if (result.success) {
        const syncResult: SyncResult = {
          success: true,
          operationsProcessed: result.data.processed,
          operationsSucceeded: result.data.succeeded,
          operationsFailed: result.data.failed,
          timestamp: Date.now(),
        };

        console.log('[BackgroundSync] ✅ Sincronización completada:', syncResult);
        return syncResult;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[BackgroundSync] ❌ Error en sincronización:', error);
      return {
        success: false,
        operationsProcessed: 0,
        operationsSucceeded: 0,
        operationsFailed: 0,
        timestamp: Date.now(),
      };
    }
  }

  // ==========================================================================
  // CONFIGURACIÓN
  // ==========================================================================

  /**
   * Actualizar configuración
   */
  async updateConfig(config: Partial<SyncConfig>): Promise<void> {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...config };

    // Si el intervalo cambió, re-registrar
    if (oldConfig.interval !== this.config.interval && this.isRegistered) {
      await this.unregister();
      await this.register();
    }

    console.log('[BackgroundSync] ⚙️ Configuración actualizada:', this.config);
  }

  /**
   * Habilitar/deshabilitar sync
   */
  async setEnabled(enabled: boolean): Promise<boolean> {
    if (enabled) {
      return await this.register();
    } else {
      return await this.unregister();
    }
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  /**
   * Verificar si background fetch está disponible
   */
  private async isBackgroundFetchAvailable(): Promise<boolean> {
    try {
      const status = await BackgroundFetch.getStatusAsync();
      return status !== null && status !== BackgroundFetch.BackgroundFetchStatus.Restricted;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtener nombre legible del status
   */
  private getStatusName(status: BackgroundFetch.BackgroundFetchStatus | null): string {
    if (status === null) return 'Unknown';

    switch (status) {
      case BackgroundFetch.BackgroundFetchStatus.Restricted:
        return 'Restricted';
      case BackgroundFetch.BackgroundFetchStatus.Denied:
        return 'Denied';
      case BackgroundFetch.BackgroundFetchStatus.Available:
        return 'Available';
      default:
        return 'Unknown';
    }
  }

  /**
   * Obtener información de debug
   */
  async getDebugInfo() {
    const isAvailable = await this.isBackgroundFetchAvailable();
    const status: BackgroundFetch.BackgroundFetchStatus | null = isAvailable
      ? await BackgroundFetch.getStatusAsync()
      : null;
    const queueStats = emergencyQueue.getStats();

    return {
      isRegistered: this.isRegistered,
      isAvailable,
      status: this.getStatusName(status),
      config: this.config,
      queueStats,
      hasNetworkListener: !!this.netInfoUnsubscribe,
      hasManualSync: !!this.syncInterval,
    };
  }

  /**
   * Cleanup (llamar al cerrar la app o desmontar)
   */
  async cleanup(): Promise<void> {
    console.log('[BackgroundSync] 🧹 Limpiando...');

    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = undefined;
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }

    await this.unregister();
    console.log('[BackgroundSync] ✅ Cleanup completado');
  }
}

// ============================================================================
// EXPORTAR INSTANCIA SINGLETON
// ============================================================================

export const backgroundSync = BackgroundSyncService.getInstance();
