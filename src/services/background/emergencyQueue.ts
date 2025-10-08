/**
 * 📋 EMERGENCY QUEUE SERVICE
 *
 * Gestión de cola de operaciones offline
 * - Encolar operaciones cuando no hay conexión
 * - Sincronizar automáticamente cuando vuelve la conexión
 * - Reintentos automáticos con backoff exponencial
 * - Priorización de operaciones
 */

import type {
    QueuedOperation,
    QueuedOperationType,
    StorageResult
} from '@/types/offline';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

// ============================================================================
// CONSTANTES
// ============================================================================

const QUEUE_KEY = '@nosara_queue:operations';
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 3000, 5000]; // Backoff exponencial en ms

// ============================================================================
// TIPOS INTERNOS
// ============================================================================

type OperationHandler = (payload: any) => Promise<void>;

interface QueueConfig {
  maxRetries: number;
  retryDelays: number[];
  autoPrune: boolean; // Limpiar operaciones completadas automáticamente
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

class EmergencyQueueService {
  private static instance: EmergencyQueueService;
  private queue: QueuedOperation[] = [];
  private handlers: Map<QueuedOperationType, OperationHandler> = new Map();
  private isProcessing: boolean = false;
  private config: QueueConfig = {
    maxRetries: MAX_RETRIES,
    retryDelays: RETRY_DELAYS,
    autoPrune: true,
  };

  private constructor() {
    this.loadQueue();
  }

  public static getInstance(): EmergencyQueueService {
    if (!EmergencyQueueService.instance) {
      EmergencyQueueService.instance = new EmergencyQueueService();
    }
    return EmergencyQueueService.instance;
  }

  // ==========================================================================
  // GESTIÓN DE COLA
  // ==========================================================================

  /**
   * Agregar operación a la cola
   */
  async enqueue(
    type: QueuedOperationType,
    payload: Record<string, any>,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<StorageResult<string>> {
    try {
      const operation: QueuedOperation = {
        id: uuid.v4() as string,
        type,
        payload,
        timestamp: Date.now(),
        retries: 0,
        maxRetries: this.config.maxRetries,
        priority,
        status: 'pending',
      };

      this.queue.push(operation);
      await this.saveQueue();

      console.log(`[Queue] ✅ Operación encolada: ${type} (ID: ${operation.id})`);
      return { success: true, data: operation.id };
    } catch (error) {
      console.error('[Queue] Error encolando operación:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Obtener todas las operaciones
   */
  getAll(): QueuedOperation[] {
    return [...this.queue];
  }

  /**
   * Obtener operaciones por estado
   */
  getByStatus(status: QueuedOperation['status']): QueuedOperation[] {
    return this.queue.filter(op => op.status === status);
  }

  /**
   * Obtener operaciones pendientes ordenadas por prioridad
   */
  getPending(): QueuedOperation[] {
    const priorityOrder = { high: 3, medium: 2, low: 1 };

    return this.queue
      .filter(op => op.status === 'pending')
      .sort((a, b) => {
        // Primero por prioridad
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // Luego por timestamp (más antiguo primero)
        return a.timestamp - b.timestamp;
      });
  }

  /**
   * Obtener operación por ID
   */
  getById(id: string): QueuedOperation | undefined {
    return this.queue.find(op => op.id === id);
  }

  /**
   * Eliminar operación por ID
   */
  async remove(id: string): Promise<StorageResult<void>> {
    try {
      const index = this.queue.findIndex(op => op.id === id);

      if (index === -1) {
        return {
          success: false,
          error: 'Operación no encontrada',
        };
      }

      this.queue.splice(index, 1);
      await this.saveQueue();

      console.log(`[Queue] ✅ Operación eliminada: ${id}`);
      return { success: true, data: undefined };
    } catch (error) {
      console.error('[Queue] Error eliminando operación:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Limpiar operaciones completadas
   */
  async prune(): Promise<StorageResult<number>> {
    try {
      const initialCount = this.queue.length;
      this.queue = this.queue.filter(op => op.status !== 'success');
      await this.saveQueue();

      const prunedCount = initialCount - this.queue.length;
      console.log(`[Queue] 🗑️ Limpieza completada: ${prunedCount} operaciones eliminadas`);

      return { success: true, data: prunedCount };
    } catch (error) {
      console.error('[Queue] Error en limpieza:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Limpiar toda la cola
   */
  async clear(): Promise<StorageResult<void>> {
    try {
      this.queue = [];
      await this.saveQueue();
      console.log('[Queue] ✅ Cola limpiada completamente');
      return { success: true, data: undefined };
    } catch (error) {
      console.error('[Queue] Error limpiando cola:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  // ==========================================================================
  // PROCESAMIENTO DE COLA
  // ==========================================================================

  /**
   * Registrar handler para un tipo de operación
   */
  registerHandler(type: QueuedOperationType, handler: OperationHandler): void {
    this.handlers.set(type, handler);
    console.log(`[Queue] 📌 Handler registrado: ${type}`);
  }

  /**
   * Procesar toda la cola
   */
 /**
 * Procesar toda la cola
 */
async processQueue(): Promise<StorageResult<{
  processed: number;
  succeeded: number;
  failed: number;
}>> {
  if (this.isProcessing) {
    console.warn('[Queue] ⚠️ Cola ya está siendo procesada, esperando...');
    return {
      success: false,
      error: 'Cola ya está siendo procesada',
    };
  }

  this.isProcessing = true;
  console.log('[Queue] 🔄 Iniciando procesamiento de cola...');

  const stats = {
    processed: 0,
    succeeded: 0,
    failed: 0,
  };

  try {
    const pending = this.getPending();

    if (pending.length === 0) {
      console.log('[Queue] ℹ️ No hay operaciones pendientes');
      return { success: true, data: stats };
    }

    for (const operation of pending) {
      const result = await this.processOperation(operation);
      stats.processed++;

      if (result.success) {
        stats.succeeded++;
      } else {
        stats.failed++;
      }
    }

    // Auto-limpieza si está habilitada
    if (this.config.autoPrune) {
      await this.prune();
    }

    console.log('[Queue] ✅ Procesamiento completado:', stats);
    return { success: true, data: stats };
  } catch (error) {
    console.error('[Queue] Error procesando cola:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  } finally {
    // IMPORTANTE: Siempre liberar el flag
    this.isProcessing = false;
  }
}

  /**
   * Procesar una operación individual
   */
  private async processOperation(operation: QueuedOperation): Promise<StorageResult<void>> {
    const handler = this.handlers.get(operation.type);

    if (!handler) {
      console.warn(`[Queue] ⚠️ No hay handler para: ${operation.type}`);
      operation.status = 'failed';
      await this.saveQueue();
      return {
        success: false,
        error: `No hay handler registrado para ${operation.type}`,
      };
    }

    operation.status = 'processing';
    await this.saveQueue();

    try {
      console.log(`[Queue] 🔄 Procesando: ${operation.type} (${operation.id})`);
      await handler(operation.payload);

      operation.status = 'success';
      await this.saveQueue();

      console.log(`[Queue] ✅ Operación exitosa: ${operation.id}`);
      return { success: true, data: undefined };
    } catch (error) {
      console.error(`[Queue] ❌ Error en operación ${operation.id}:`, error);

      operation.retries++;

      if (operation.retries >= operation.maxRetries) {
        operation.status = 'failed';
        console.error(`[Queue] 💀 Operación fallida definitivamente: ${operation.id}`);
      } else {
        operation.status = 'pending';
        const delay = this.config.retryDelays[operation.retries - 1] || 5000;
        console.log(`[Queue] 🔄 Reintento ${operation.retries}/${operation.maxRetries} en ${delay}ms`);

        // Programar reintento
        setTimeout(() => this.processOperation(operation), delay);
      }

      await this.saveQueue();

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  // ==========================================================================
  // PERSISTENCIA
  // ==========================================================================

  /**
   * Cargar cola desde AsyncStorage
   */
  private async loadQueue(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(QUEUE_KEY);
      if (data) {
        this.queue = JSON.parse(data);
        console.log(`[Queue] ✅ Cola cargada: ${this.queue.length} operaciones`);
      }
    } catch (error) {
      console.error('[Queue] Error cargando cola:', error);
      this.queue = [];
    }
  }

  /**
   * Guardar cola en AsyncStorage
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('[Queue] Error guardando cola:', error);
    }
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  /**
   * Obtener estadísticas de la cola
   */
  getStats() {
    const stats = {
      total: this.queue.length,
      pending: 0,
      processing: 0,
      success: 0,
      failed: 0,
      byPriority: {
        high: 0,
        medium: 0,
        low: 0,
      },
      byType: {} as Record<string, number>,
    };

    this.queue.forEach(op => {
      stats[op.status]++;
      stats.byPriority[op.priority]++;
      stats.byType[op.type] = (stats.byType[op.type] || 0) + 1;
    });

    return stats;
  }

  /**
   * Configurar cola
   */
  setConfig(config: Partial<QueueConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[Queue] ⚙️ Configuración actualizada:', this.config);
  }

  /**
   * Obtener información de debug
   */
  getDebugInfo() {
    return {
      isProcessing: this.isProcessing,
      queueLength: this.queue.length,
      handlers: Array.from(this.handlers.keys()),
      config: this.config,
      stats: this.getStats(),
    };
  }
}

// ============================================================================
// EXPORTAR INSTANCIA SINGLETON
// ============================================================================

export const emergencyQueue = EmergencyQueueService.getInstance();
