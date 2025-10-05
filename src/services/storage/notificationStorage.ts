/**
 * Servicio de Persistencia de Notificaciones
 * Módulo 2 - Nosara Emergency App
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationRecord } from '../../types/notifications';

const STORAGE_KEYS = {
  NOTIFICATIONS: '@nosara_emergency:notifications',
  SETTINGS: '@nosara_emergency:notification_settings',
};

class NotificationStorageService {
  /**
   * Guarda todas las notificaciones
   */
  async saveNotifications(notifications: NotificationRecord[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(notifications);
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, jsonValue);
      console.log(`${notifications.length} notificaciones guardadas`);
    } catch (error) {
      console.error('Error guardando notificaciones:', error);
      throw error;
    }
  }

  /**
   * Carga todas las notificaciones
   */
  async loadNotifications(): Promise<NotificationRecord[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);

      if (jsonValue === null) {
        console.log('No hay notificaciones guardadas');
        return [];
      }

      const notifications = JSON.parse(jsonValue);
      console.log(`${notifications.length} notificaciones cargadas`);
      return notifications;
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
      return [];
    }
  }

  /**
   * Guarda configuración de notificaciones
   */
  async saveSettings(settings: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(settings);
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, jsonValue);
      console.log('Configuración guardada');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      throw error;
    }
  }

  /**
   * Carga configuración de notificaciones
   */
  async loadSettings(): Promise<any | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);

      if (jsonValue === null) {
        console.log('No hay configuración guardada');
        return null;
      }

      const settings = JSON.parse(jsonValue);
      console.log('Configuración cargada');
      return settings;
    } catch (error) {
      console.error('Error cargando configuración:', error);
      return null;
    }
  }

  /**
   * Limpia todas las notificaciones guardadas
   */
  async clearNotifications(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
      console.log('Notificaciones limpiadas del storage');
    } catch (error) {
      console.error('Error limpiando notificaciones:', error);
      throw error;
    }
  }

  /**
   * Limpia toda la configuración
   */
  async clearSettings(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SETTINGS);
      console.log('Configuración limpiada del storage');
    } catch (error) {
      console.error('Error limpiando configuración:', error);
      throw error;
    }
  }

  /**
   * Limpia todo el storage de notificaciones
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.NOTIFICATIONS,
        STORAGE_KEYS.SETTINGS,
      ]);
      console.log('Todo el storage de notificaciones limpiado');
    } catch (error) {
      console.error('Error limpiando storage:', error);
      throw error;
    }
  }

  /**
   * Obtiene el tamaño del storage (para debug)
   */
  async getStorageSize(): Promise<{ notifications: number; settings: number }> {
    try {
      const notifData = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      const settingsData = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);

      return {
        notifications: notifData ? notifData.length : 0,
        settings: settingsData ? settingsData.length : 0,
      };
    } catch (error) {
      console.error('Error obteniendo tamaño del storage:', error);
      return { notifications: 0, settings: 0 };
    }
  }
}

// Exportar instancia singleton
export const notificationStorage = new NotificationStorageService();
