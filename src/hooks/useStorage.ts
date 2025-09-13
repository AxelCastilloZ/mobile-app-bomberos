import { useState, useCallback } from 'react';
import { storageService } from '../services/storage.service';

export const useStorage = () => {
  const [isLoading, setIsLoading] = useState(false);

  const secureGet = useCallback(async <T = string>(key: string): Promise<T | null> => {
    setIsLoading(true);
    try {
      const value = await storageService.getSecure(key);
      return value as T | null;
    } catch (error) {
      console.error('Error getting secure data:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const secureSet = useCallback(async (key: string, value: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      await storageService.setSecure(key, value);
      return true;
    } catch (error) {
      console.error('Error setting secure data:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const get = useCallback(async <T = any>(key: string): Promise<T | null> => {
    setIsLoading(true);
    try {
      return await storageService.get<T>(key);
    } catch (error) {
      console.error('Error getting data:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const set = useCallback(async (key: string, value: any): Promise<boolean> => {
    setIsLoading(true);
    try {
      await storageService.set(key, value);
      return true;
    } catch (error) {
      console.error('Error setting data:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const remove = useCallback(async (key: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      await storageService.delete(key);
      return true;
    } catch (error) {
      console.error('Error removing data:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearAll = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      await storageService.clearAllData();
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    // Métodos de storage seguro
    secureGet,
    secureSet,
    // Métodos de storage normal
    get,
    set,
    remove,
    clearAll,
    // Métodos específicos para la app
    getAuthToken: () => storageService.getAuthToken(),
    saveAuthToken: (token: string) => storageService.saveAuthToken(token),
    getUserPreferences: <T = any>() => storageService.getUserPreferences<T>(),
    saveUserPreferences: (prefs: any) => storageService.saveUserPreferences(prefs),
    getEmergencyReports: <T = any>() => storageService.getEmergencyReports<T>(),
    saveEmergencyReports: (reports: any[]) => storageService.saveEmergencyReports(reports),
  };
};