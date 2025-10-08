/**
 * 🔐 SECURE STORAGE SERVICE
 *
 * Gestión de datos sensibles usando Expo SecureStore
 * - Tokens JWT
 * - Credenciales de usuario
 * - API Keys
 * - Encriptación nativa (iOS Keychain / Android Keystore)
 */

import type {
    AuthTokens,
    StorageResult,
    UserCredentials
} from '@/types/offline';
import * as SecureStore from 'expo-secure-store';

// ============================================================================
// CONSTANTES
// ============================================================================

const SECURE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_CREDENTIALS: 'user_credentials',
  API_KEYS: 'api_keys',
} as const;

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

class SecureStorageService {
  private static instance: SecureStorageService;

  private constructor() {
    // Singleton
  }

  public static getInstance(): SecureStorageService {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService();
    }
    return SecureStorageService.instance;
  }

  // ==========================================================================
  // MÉTODOS GENÉRICOS
  // ==========================================================================

  /**
   * Guardar dato seguro
   */
  async setItem(key: string, value: string): Promise<StorageResult<void>> {
    try {
      await SecureStore.setItemAsync(key, value);
      return { success: true, data: undefined };
    } catch (error) {
      console.error('[SecureStorage] Error guardando:', key, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtener dato seguro
   */
  async getItem(key: string): Promise<StorageResult<string | null>> {
    try {
      const value = await SecureStore.getItemAsync(key);
      return { success: true, data: value };
    } catch (error) {
      console.error('[SecureStorage] Error obteniendo:', key, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Eliminar dato seguro
   */
  async removeItem(key: string): Promise<StorageResult<void>> {
    try {
      await SecureStore.deleteItemAsync(key);
      return { success: true, data: undefined };
    } catch (error) {
      console.error('[SecureStorage] Error eliminando:', key, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Limpiar todo el storage seguro
   */
  async clear(): Promise<StorageResult<void>> {
    try {
      const keys = Object.values(SECURE_KEYS);
      await Promise.all(keys.map(key => SecureStore.deleteItemAsync(key)));
      console.log('[SecureStorage] ✅ Storage limpiado');
      return { success: true, data: undefined };
    } catch (error) {
      console.error('[SecureStorage] Error limpiando storage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  // ==========================================================================
  // TOKENS DE AUTENTICACIÓN
  // ==========================================================================

  /**
   * Guardar tokens de autenticación
   */
  async saveAuthTokens(tokens: AuthTokens): Promise<StorageResult<void>> {
    try {
      const tokenData = JSON.stringify(tokens);
      await SecureStore.setItemAsync(SECURE_KEYS.AUTH_TOKEN, tokenData);
      console.log('[SecureStorage] ✅ Tokens guardados');
      return { success: true, data: undefined };
    } catch (error) {
      console.error('[SecureStorage] Error guardando tokens:', error);
      return {
        success: false,
        error: 'No se pudieron guardar los tokens'
      };
    }
  }

  /**
   * Obtener tokens de autenticación
   */
  async getAuthTokens(): Promise<StorageResult<AuthTokens | null>> {
    try {
      const tokenData = await SecureStore.getItemAsync(SECURE_KEYS.AUTH_TOKEN);

      if (!tokenData) {
        return { success: true, data: null };
      }

      const tokens: AuthTokens = JSON.parse(tokenData);

      // Verificar si el token expiró
      if (tokens.expiresAt && Date.now() > tokens.expiresAt) {
        console.log('[SecureStorage] ⚠️ Token expirado');
        await this.removeAuthTokens();
        return { success: true, data: null };
      }

      return { success: true, data: tokens };
    } catch (error) {
      console.error('[SecureStorage] Error obteniendo tokens:', error);
      return {
        success: false,
        error: 'No se pudieron obtener los tokens'
      };
    }
  }

  /**
   * Eliminar tokens de autenticación
   */
  async removeAuthTokens(): Promise<StorageResult<void>> {
    return this.removeItem(SECURE_KEYS.AUTH_TOKEN);
  }

  /**
   * Verificar si hay tokens válidos
   */
  async hasValidTokens(): Promise<boolean> {
    const result = await this.getAuthTokens();
    return result.success && result.data !== null;
  }

  // ==========================================================================
  // CREDENCIALES DE USUARIO
  // ==========================================================================

  /**
   * Guardar credenciales de usuario
   */
  async saveCredentials(credentials: UserCredentials): Promise<StorageResult<void>> {
    try {
      const credData = JSON.stringify(credentials);
      await SecureStore.setItemAsync(SECURE_KEYS.USER_CREDENTIALS, credData);
      console.log('[SecureStorage] ✅ Credenciales guardadas');
      return { success: true, data: undefined };
    } catch (error) {
      console.error('[SecureStorage] Error guardando credenciales:', error);
      return {
        success: false,
        error: 'No se pudieron guardar las credenciales'
      };
    }
  }

  /**
   * Obtener credenciales de usuario
   */
  async getCredentials(): Promise<StorageResult<UserCredentials | null>> {
    try {
      const credData = await SecureStore.getItemAsync(SECURE_KEYS.USER_CREDENTIALS);

      if (!credData) {
        return { success: true, data: null };
      }

      const credentials: UserCredentials = JSON.parse(credData);
      return { success: true, data: credentials };
    } catch (error) {
      console.error('[SecureStorage] Error obteniendo credenciales:', error);
      return {
        success: false,
        error: 'No se pudieron obtener las credenciales'
      };
    }
  }

  /**
   * Eliminar credenciales
   */
  async removeCredentials(): Promise<StorageResult<void>> {
    return this.removeItem(SECURE_KEYS.USER_CREDENTIALS);
  }

  // ==========================================================================
  // API KEYS
  // ==========================================================================

  /**
   * Guardar API keys
   */
  async saveApiKeys(keys: Record<string, string>): Promise<StorageResult<void>> {
    try {
      const keysData = JSON.stringify(keys);
      await SecureStore.setItemAsync(SECURE_KEYS.API_KEYS, keysData);
      console.log('[SecureStorage] ✅ API Keys guardadas');
      return { success: true, data: undefined };
    } catch (error) {
      console.error('[SecureStorage] Error guardando API keys:', error);
      return {
        success: false,
        error: 'No se pudieron guardar las API keys'
      };
    }
  }

  /**
   * Obtener API keys
   */
  async getApiKeys(): Promise<StorageResult<Record<string, string> | null>> {
    try {
      const keysData = await SecureStore.getItemAsync(SECURE_KEYS.API_KEYS);

      if (!keysData) {
        return { success: true, data: null };
      }

      const keys: Record<string, string> = JSON.parse(keysData);
      return { success: true, data: keys };
    } catch (error) {
      console.error('[SecureStorage] Error obteniendo API keys:', error);
      return {
        success: false,
        error: 'No se pudieron obtener las API keys'
      };
    }
  }

  /**
   * Eliminar API keys
   */
  async removeApiKeys(): Promise<StorageResult<void>> {
    return this.removeItem(SECURE_KEYS.API_KEYS);
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  /**
   * Verificar si SecureStore está disponible
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Intenta una operación simple
      await SecureStore.setItemAsync('test_key', 'test_value');
      await SecureStore.deleteItemAsync('test_key');
      return true;
    } catch (error) {
      console.error('[SecureStorage] ⚠️ SecureStore no disponible:', error);
      return false;
    }
  }

  /**
   * Obtener información de debug
   */
  async getDebugInfo(): Promise<{
    hasTokens: boolean;
    hasCredentials: boolean;
    hasApiKeys: boolean;
    isAvailable: boolean;
  }> {
    const [tokens, credentials, apiKeys, available] = await Promise.all([
      this.getAuthTokens(),
      this.getCredentials(),
      this.getApiKeys(),
      this.isAvailable(),
    ]);

    return {
      hasTokens: tokens.success && tokens.data !== null,
      hasCredentials: credentials.success && credentials.data !== null,
      hasApiKeys: apiKeys.success && apiKeys.data !== null,
      isAvailable: available,
    };
  }
}

// ============================================================================
// EXPORTAR INSTANCIA SINGLETON
// ============================================================================

export const secureStorage = SecureStorageService.getInstance();
