import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StorageOptions {
  secure?: boolean;
  requireAuthentication?: boolean;
  accessGroup?: string;
}

class StorageService {
  
  private readonly SECURE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_CREDENTIALS: 'user_credentials',
    BIOMETRIC_KEY: 'biometric_key',
  };


  private readonly ASYNC_KEYS = {
    USER_PREFERENCES: 'user_preferences',
    EMERGENCY_REPORTS: 'emergency_reports',
    APP_STATE: 'app_state',
    CONNECTIVITY_LOG: 'connectivity_log',
  };

  
  async setSecure(key: string, value: string, options?: StorageOptions): Promise<void> {
    try {
      const secureOptions: SecureStore.SecureStoreOptions = {};
      
      if (options?.requireAuthentication) {
        secureOptions.requireAuthentication = true;
        secureOptions.authenticationPrompt = 'Autentícate para acceder a los datos';
      }

      await SecureStore.setItemAsync(key, value, secureOptions);
      console.log(`Secure data saved for key: ${key}`);
    } catch (error) {
      console.error(`Error saving secure data for key ${key}:`, error);
      throw new Error(`Failed to save secure data: ${error}`);
    }
  }

  
  async getSecure(key: string, options?: StorageOptions): Promise<string | null> {
    try {
      const secureOptions: SecureStore.SecureStoreOptions = {};
      
      if (options?.requireAuthentication) {
        secureOptions.requireAuthentication = true;
        secureOptions.authenticationPrompt = 'Autentícate para acceder a los datos';
      }

      const value = await SecureStore.getItemAsync(key, secureOptions);
      return value;
    } catch (error) {
      console.error(`Error getting secure data for key ${key}:`, error);
      return null;
    }
  }

 
  async deleteSecure(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
      console.log(`Secure data deleted for key: ${key}`);
    } catch (error) {
      console.error(`Error deleting secure data for key ${key}:`, error);
    }
  }

  // Guardar datos no sensibles
  async set(key: string, value: any): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
      console.log(`Data saved for key: ${key}`);
    } catch (error) {
      console.error(`Error saving data for key ${key}:`, error);
      throw new Error(`Failed to save data: ${error}`);
    }
  }

  
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) return null;
      
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Error getting data for key ${key}:`, error);
      return null;
    }
  }

  
  async delete(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`Data deleted for key: ${key}`);
    } catch (error) {
      console.error(`Error deleting data for key ${key}:`, error);
    }
  }

 

  // Auth Token (seguro)
  async saveAuthToken(token: string): Promise<void> {
    await this.setSecure(this.SECURE_KEYS.AUTH_TOKEN, token);
  }

  async getAuthToken(): Promise<string | null> {
    return this.getSecure(this.SECURE_KEYS.AUTH_TOKEN);
  }

  async deleteAuthToken(): Promise<void> {
    await this.deleteSecure(this.SECURE_KEYS.AUTH_TOKEN);
  }

  // Refresh Token (seguro)
  async saveRefreshToken(token: string): Promise<void> {
    await this.setSecure(this.SECURE_KEYS.REFRESH_TOKEN, token);
  }

  async getRefreshToken(): Promise<string | null> {
    return this.getSecure(this.SECURE_KEYS.REFRESH_TOKEN);
  }

  async deleteRefreshToken(): Promise<void> {
    await this.deleteSecure(this.SECURE_KEYS.REFRESH_TOKEN);
  }

  // Credenciales de usuario (seguro)
  async saveUserCredentials(credentials: any): Promise<void> {
    const credentialsString = JSON.stringify(credentials);
    await this.setSecure(this.SECURE_KEYS.USER_CREDENTIALS, credentialsString);
  }

  async getUserCredentials<T = any>(): Promise<T | null> {
    const credentialsString = await this.getSecure(this.SECURE_KEYS.USER_CREDENTIALS);
    if (!credentialsString) return null;
    
    try {
      return JSON.parse(credentialsString) as T;
    } catch (error) {
      console.error('Error parsing user credentials:', error);
      return null;
    }
  }

  async deleteUserCredentials(): Promise<void> {
    await this.deleteSecure(this.SECURE_KEYS.USER_CREDENTIALS);
  }

 
  async saveEmergencyReports(reports: any[]): Promise<void> {
    await this.set(this.ASYNC_KEYS.EMERGENCY_REPORTS, reports);
  }

  async getEmergencyReports<T = any[]>(): Promise<T | null> {
    return this.get<T>(this.ASYNC_KEYS.EMERGENCY_REPORTS);
  }

  async deleteEmergencyReports(): Promise<void> {
    await this.delete(this.ASYNC_KEYS.EMERGENCY_REPORTS);
  }

 
  async saveUserPreferences(preferences: any): Promise<void> {
    await this.set(this.ASYNC_KEYS.USER_PREFERENCES, preferences);
  }

  async getUserPreferences<T = any>(): Promise<T | null> {
    return this.get<T>(this.ASYNC_KEYS.USER_PREFERENCES);
  }

 
  async saveAppState(state: any): Promise<void> {
    await this.set(this.ASYNC_KEYS.APP_STATE, {
      ...state,
      lastSaved: new Date().toISOString(),
    });
  }

  async getAppState<T = any>(): Promise<T | null> {
    return this.get<T>(this.ASYNC_KEYS.APP_STATE);
  }

  // Log de conectividad
  async saveConnectivityLog(log: any[]): Promise<void> {
    
    const trimmedLog = log.slice(-100);
    await this.set(this.ASYNC_KEYS.CONNECTIVITY_LOG, trimmedLog);
  }

  async getConnectivityLog<T = any[]>(): Promise<T | null> {
    return this.get<T>(this.ASYNC_KEYS.CONNECTIVITY_LOG);
  }

  
  async clearAllSecureData(): Promise<void> {
    const promises = Object.values(this.SECURE_KEYS).map(key => 
      this.deleteSecure(key).catch(error => 
        console.warn(`Failed to delete secure key ${key}:`, error)
      )
    );
    
    await Promise.all(promises);
    console.log('All secure data cleared');
  }

  async clearAllData(): Promise<void> {
    
    await this.clearAllSecureData();
    
   
    const promises = Object.values(this.ASYNC_KEYS).map(key => 
      this.delete(key).catch(error => 
        console.warn(`Failed to delete key ${key}:`, error)
      )
    );
    
    await Promise.all(promises);
    console.log('All data cleared');
  }

 
  async isSecureStoreAvailable(): Promise<boolean> {
    try {
      await SecureStore.isAvailableAsync();
      return true;
    } catch (error) {
      console.warn('SecureStore not available:', error);
      return false;
    }
  }
}

export const storageService = new StorageService();