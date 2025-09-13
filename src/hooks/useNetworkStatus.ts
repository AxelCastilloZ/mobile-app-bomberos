
import { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import type { NetInfoState } from '@react-native-community/netinfo';
import { apiService } from '../services/api.service';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
  isWifi: boolean;
  isCellular: boolean;
  isServerReachable: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  lastChecked: Date | null;
}

export interface NetworkEvent {
  timestamp: Date;
  event: 'connected' | 'disconnected' | 'server_available' | 'server_unavailable';
  details: string;
}

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: false,
    isInternetReachable: null,
    type: null,
    isWifi: false,
    isCellular: false,
    isServerReachable: false,
    connectionQuality: 'offline',
    lastChecked: null,
  });

  const [networkEvents, setNetworkEvents] = useState<NetworkEvent[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    
    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);
    
    
    checkNetworkStatus();
    
    
    const serverCheckInterval = setInterval(() => {
      if (networkStatus.isConnected) {
        checkServerStatus();
      }
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(serverCheckInterval);
    };
  }, []);

  const handleNetworkChange = (state: NetInfoState) => {
    const isConnected = state.isConnected ?? false;
    const isWifi = state.type === 'wifi';
    const isCellular = state.type === 'cellular';
    
    const newStatus: NetworkStatus = {
      isConnected,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      isWifi,
      isCellular,
      isServerReachable: networkStatus.isServerReachable, 
      connectionQuality: determineConnectionQuality(state),
      lastChecked: new Date(),
    };

    setNetworkStatus(prevStatus => {
      
      if (prevStatus.isConnected !== isConnected) {
        addNetworkEvent({
          timestamp: new Date(),
          event: isConnected ? 'connected' : 'disconnected',
          details: `${state.type} - ${isConnected ? 'Conectado' : 'Desconectado'}`,
        });
      }

      return newStatus;
    });

    
    if (isConnected && !networkStatus.isConnected) {
      checkServerStatus();
    }
  };

  const determineConnectionQuality = (state: NetInfoState): 'excellent' | 'good' | 'poor' | 'offline' => {
    if (!state.isConnected) {
      return 'offline';
    }

    if (state.type === 'wifi') {
      return 'excellent';
    }

    if (state.type === 'cellular') {
      
      if (state.isInternetReachable === true) {
        return 'good';
      } else if (state.isInternetReachable === false) {
        return 'poor';
      } else {
        return 'good'; 
      }
    }

    return 'good';
  };

  const checkNetworkStatus = useCallback(async () => {
    try {
      setIsChecking(true);
      const state = await NetInfo.fetch();
      handleNetworkChange(state);
      
      if (state.isConnected) {
        await checkServerStatus();
      }
    } catch (error) {
      console.error('useNetworkStatus: Error verificando red:', error);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const checkServerStatus = useCallback(async () => {
    try {
      const isServerAvailable = await apiService.isServerAvailable();
      
      setNetworkStatus(prevStatus => {
        
        if (prevStatus.isServerReachable !== isServerAvailable) {
          addNetworkEvent({
            timestamp: new Date(),
            event: isServerAvailable ? 'server_available' : 'server_unavailable',
            details: isServerAvailable ? 'Servidor disponible' : 'Servidor no disponible',
          });
        }

        return {
          ...prevStatus,
          isServerReachable: isServerAvailable,
          lastChecked: new Date(),
        };
      });

      return isServerAvailable;
    } catch (error) {
      console.error('useNetworkStatus: Error verificando servidor:', error);
      
      setNetworkStatus(prevStatus => ({
        ...prevStatus,
        isServerReachable: false,
        lastChecked: new Date(),
      }));

      return false;
    }
  }, []);

  const addNetworkEvent = (event: NetworkEvent) => {
    setNetworkEvents(prevEvents => {
      const newEvents = [event, ...prevEvents];
      
      return newEvents.slice(0, 50);
    });
  };

  const testConnection = useCallback(async (): Promise<{
    network: boolean;
    internet: boolean;
    server: boolean;
    responseTime?: number;
  }> => {
    try {
      setIsChecking(true);

      
      const networkState = await NetInfo.fetch();
      const networkAvailable = networkState.isConnected ?? false;

      if (!networkAvailable) {
        return {
          network: false,
          internet: false,
          server: false,
        };
      }

      
      const internetAvailable = networkState.isInternetReachable ?? false;

      if (!internetAvailable) {
        return {
          network: true,
          internet: false,
          server: false,
        };
      }

      
      const startTime = Date.now();
      const serverAvailable = await apiService.isServerAvailable();
      const responseTime = Date.now() - startTime;

      return {
        network: true,
        internet: true,
        server: serverAvailable,
        responseTime: serverAvailable ? responseTime : undefined,
      };
    } catch (error) {
      console.error('useNetworkStatus: Error en test de conexión:', error);
      return {
        network: false,
        internet: false,
        server: false,
      };
    } finally {
      setIsChecking(false);
    }
  }, []);

  const getConnectionStatusText = useCallback((): string => {
    if (!networkStatus.isConnected) {
      return 'Sin conexión a red';
    }

    if (networkStatus.isInternetReachable === false) {
      return 'Sin acceso a Internet';
    }

    if (!networkStatus.isServerReachable) {
      return 'Servidor no disponible';
    }

    const connectionType = networkStatus.isWifi ? 'WiFi' : 
                          networkStatus.isCellular ? 'Datos móviles' : 
                          networkStatus.type || 'Desconocido';
    
    return `Conectado vía ${connectionType}`;
  }, [networkStatus]);

  const getConnectionIcon = useCallback((): string => {
    if (!networkStatus.isConnected) {
      return 'wifi-off';
    }

    if (!networkStatus.isServerReachable) {
      return 'server-off';
    }

    switch (networkStatus.connectionQuality) {
      case 'excellent':
        return 'wifi';
      case 'good':
        return networkStatus.isCellular ? 'signal-cellular-3' : 'wifi';
      case 'poor':
        return networkStatus.isCellular ? 'signal-cellular-1' : 'wifi-strength-1';
      default:
        return 'wifi-off';
    }
  }, [networkStatus]);

  const getConnectionColor = useCallback((): string => {
    if (!networkStatus.isConnected) {
      return '#F44336'; 
    }

    if (!networkStatus.isServerReachable) {
      return '#FF9800'; 
    }

    switch (networkStatus.connectionQuality) {
      case 'excellent':
        return '#4CAF50';
      case 'good':
        return '#4CAF50'; 
      case 'poor':
        return '#FF9800'; 
      default:
        return '#F44336';
    }
  }, [networkStatus]);

  const clearNetworkEvents = useCallback(() => {
    setNetworkEvents([]);
  }, []);

  const getRecentEvents = useCallback((count: number = 10): NetworkEvent[] => {
    return networkEvents.slice(0, count);
  }, [networkEvents]);

  const isOnline = networkStatus.isConnected && 
                  networkStatus.isInternetReachable !== false;
  
  const isFullyOperational = isOnline && networkStatus.isServerReachable;

  return {
    // Estado de red
    ...networkStatus,
    
    
    isOnline,
    isFullyOperational,
    isOffline: !isOnline,
    needsServerConnection: isOnline && !networkStatus.isServerReachable,
    
   
    networkEvents,
    hasRecentEvents: networkEvents.length > 0,
    
    
    isChecking,
    
    // Métodos
    checkNetworkStatus,
    checkServerStatus,
    testConnection,
    clearNetworkEvents,
    getRecentEvents,
    
    
    getConnectionStatusText,
    getConnectionIcon,
    getConnectionColor,
    
 
    refresh: checkNetworkStatus,
  };
};