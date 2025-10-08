/**
 * 🔄 TIPOS PARA MÓDULO 4: OFFLINE & BACKGROUND
 *
 * Define todas las interfaces y tipos para:
 * - Cola de sincronización offline
 * - Storage seguro
 * - Caché de datos
 * - Sincronización en background
 */

// ============================================================================
// OPERACIONES EN COLA (QueuedOperation)
// ============================================================================

/**
 * Tipos de operaciones que se pueden encolar cuando no hay conexión
 */
export type QueuedOperationType =
  | 'UPDATE_REPORT_STATUS'    // Actualizar estado de reporte
  | 'UPDATE_PROFILE'           // Actualizar perfil de usuario
  | 'MARK_NOTIFICATION_READ';  // Marcar notificación como leída

/**
 * Estructura de una operación en cola
 */
export interface QueuedOperation {
  id: string;                           // UUID único
  type: QueuedOperationType;            // Tipo de operación
  payload: Record<string, any>;         // Datos de la operación
  timestamp: number;                    // Cuándo se creó
  retries: number;                      // Intentos de sincronización
  maxRetries: number;                   // Máximo de reintentos
  priority: 'low' | 'medium' | 'high';  // Prioridad de ejecución
  status: 'pending' | 'processing' | 'success' | 'failed'; // Estado
}

// ============================================================================
// DATOS EN CACHÉ (CachedData)
// ============================================================================

/**
 * Tipos de datos que se pueden cachear offline
 */
export type CachedDataType =
  | 'active_emergencies'   // Emergencias activas
  | 'user_reports'         // Reportes del usuario
  | 'user_profile'         // Perfil del usuario
  | 'app_config'           // Configuración de la app
  | 'emergency_types';     // Catálogo de tipos de emergencia

/**
 * Estructura de datos cacheados
 */
export interface CachedData<T = any> {
  key: CachedDataType;      // Tipo de dato
  data: T;                  // Datos reales
  timestamp: number;        // Cuándo se cacheó
  expiresAt?: number;       // Cuándo expira (opcional)
  version: string;          // Versión del dato (para invalidación)
}

// ============================================================================
// DATOS SEGUROS (SecureStorage)
// ============================================================================

/**
 * Tipos de datos sensibles almacenados en SecureStore
 */
export type SecureDataType =
  | 'auth_token'           // JWT de autenticación
  | 'refresh_token'        // Token de refresco
  | 'user_credentials'     // Usuario/contraseña
  | 'api_keys';            // API keys privadas

/**
 * Estructura para credenciales de usuario
 */
export interface UserCredentials {
  username: string;
  password: string;
  rememberMe: boolean;
}

/**
 * Estructura para tokens de autenticación
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// ============================================================================
// ESTADO DE SINCRONIZACIÓN
// ============================================================================

/**
 * Estado de la sincronización
 */
export type SyncStatus =
  | 'idle'          // Sin actividad
  | 'syncing'       // Sincronizando
  | 'success'       // Exitoso
  | 'error';        // Error

/**
 * Información de sincronización
 */
export interface SyncInfo {
  status: SyncStatus;
  lastSyncAt?: number;          // Última sincronización exitosa
  pendingOperations: number;    // Operaciones pendientes
  failedOperations: number;     // Operaciones fallidas
  error?: string;               // Mensaje de error (si hay)
}

// ============================================================================
// ESTADO OFFLINE
// ============================================================================

/**
 * Estado completo del modo offline
 */
export interface OfflineState {
  // Estado de conexión
  isOnline: boolean;
  isConnected: boolean; // Redundancia con realtimeStore

  // Cola de operaciones
  queue: QueuedOperation[];

  // Información de sincronización
  syncInfo: SyncInfo;

  // Caché activo
  cacheEnabled: boolean;
  cacheSize: number; // Bytes usados

  // Configuración
  autoSync: boolean;
  syncInterval: number; // Segundos entre sync automático
}

// ============================================================================
// CONFIGURACIÓN DE STORAGE
// ============================================================================

/**
 * Opciones para operaciones de storage
 */
export interface StorageOptions {
  encrypt?: boolean;        // Encriptar dato
  expiresIn?: number;       // TTL en segundos
  compress?: boolean;       // Comprimir dato (para grandes volúmenes)
}

/**
 * Configuración de caché
 */
export interface CacheConfig {
  maxSize: number;          // Tamaño máximo en bytes
  defaultTTL: number;       // TTL por defecto en segundos
  evictionPolicy: 'LRU' | 'LFU' | 'FIFO'; // Política de desalojo
}

// ============================================================================
// EVENTOS DE SINCRONIZACIÓN
// ============================================================================

/**
 * Eventos que se emiten durante la sincronización
 */
export type SyncEvent =
  | 'sync_started'
  | 'sync_progress'
  | 'sync_completed'
  | 'sync_failed'
  | 'operation_queued'
  | 'operation_synced'
  | 'operation_failed';

/**
 * Payload de eventos de sincronización
 */
export interface SyncEventPayload {
  event: SyncEvent;
  timestamp: number;
  data?: any;
  error?: string;
}

// ============================================================================
// UTILIDADES DE TIPOS
// ============================================================================

/**
 * Resultado de operaciones async con manejo de errores
 */
export type StorageResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Callback para listeners de sincronización
 */
export type SyncEventListener = (payload: SyncEventPayload) => void;
