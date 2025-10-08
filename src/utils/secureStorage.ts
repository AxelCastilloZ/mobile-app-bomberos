import * as SecureStore from 'expo-secure-store';

/**
 * Secure Storage Helper
 * Wrapper para expo-secure-store con mejor manejo de errores
 */
export const secureStorage = {
  /**
   * Guardar un valor de forma segura
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`[SecureStorage] Error saving ${key}:`, error);
      throw error;
    }
  },

  /**
   * Leer un valor seguro
   */
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`[SecureStorage] Error reading ${key}:`, error);
      return null;
    }
  },

  /**
   * Eliminar un valor
   */
  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`[SecureStorage] Error deleting ${key}:`, error);
      throw error;
    }
  },

  /**
   * Guardar objeto (JSON)
   */
  async setObject<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await SecureStore.setItemAsync(key, jsonValue);
    } catch (error) {
      console.error(`[SecureStorage] Error saving object ${key}:`, error);
      throw error;
    }
  },

  /**
   * Leer objeto (JSON)
   */
  async getObject<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await SecureStore.getItemAsync(key);
      return jsonValue ? (JSON.parse(jsonValue) as T) : null;
    } catch (error) {
      console.error(`[SecureStorage] Error reading object ${key}:`, error);
      return null;
    }
  },

  /**
   * Limpiar múltiples keys
   */
  async clearKeys(keys: string[]): Promise<void> {
    try {
      await Promise.all(keys.map((key) => SecureStore.deleteItemAsync(key)));
    } catch (error) {
      console.error('[SecureStorage] Error clearing keys:', error);
      throw error;
    }
  },
};

/**
 * Keys constantes para evitar typos
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  AUTH_USER: 'auth_user',
  DEVICE_ID: 'device_id',
} as const;
