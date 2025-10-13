import { useLocation } from '@/hooks/useLocation';
import { queryClient } from '@/lib/queryClient';
import { authService } from '@/services/auth';
import { useAuthStore } from '@/store/authStore';
import { QueryClientProvider } from '@tanstack/react-query';
import * as Device from 'expo-device';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Alert } from 'react-native';

function LocationInitializer() {
  const {
    requestPermission,
    getCurrentLocation,
    startWatching,
    hasPermission,
    permissionStatus,
  } = useLocation();

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    try {
      console.log('📍 [RootLayout] Inicializando ubicación...');

      // 1. Verificar/Solicitar permisos
      if (!hasPermission) {
        console.log('📍 [RootLayout] Solicitando permisos...');
        const granted = await requestPermission();

        if (!granted) {
          console.warn('⚠️ [RootLayout] Permisos de ubicación denegados');
          // No bloquear la app, solo advertir
          Alert.alert(
            'Ubicación Deshabilitada',
            'Para reportar emergencias con precisión, habilita los permisos de ubicación en la configuración.',
            [{ text: 'Entendido' }]
          );
          return;
        }
      }

      // 2. Obtener ubicación inicial
      console.log('📍 [RootLayout] Obteniendo ubicación inicial...');
      const location = await getCurrentLocation();

      if (location) {
        console.log('✅ [RootLayout] Ubicación inicial obtenida:', {
          lat: location.coordinates.latitude,
          lng: location.coordinates.longitude,
        });

        // 3. Iniciar tracking en background (actualización continua)
        console.log('📍 [RootLayout] Iniciando tracking...');
        await startWatching();
        console.log('✅ [RootLayout] Tracking iniciado');
      }
    } catch (error) {
      console.error('❌ [RootLayout] Error inicializando ubicación:', error);
      // No bloquear la app por errores de ubicación
    }
  };

  return null; // Este componente no renderiza nada
}

function AnonymousUserInitializer() {
  useEffect(() => {
    initializeAnonymousUser();
  }, []);

  const initializeAnonymousUser = async () => {
    const { isAuthenticated, user } = useAuthStore.getState();

    // Si NO está autenticado Y NO tiene usuario → Crear anónimo
    if (!isAuthenticated && !user) {
      console.log('🔄 [RootLayout] Inicializando usuario anónimo...');

      try {
        const deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const deviceInfo = {
          modelName: Device.modelName || 'Unknown',
          osName: Device.osName || 'Unknown',
          osVersion: Device.osVersion || 'Unknown',
          brand: Device.brand || 'Unknown',
        };

        const response = await authService.createAnonymous({
          deviceId,
          deviceInfo,
        });

        if (response.data) {
          console.log('✅ [RootLayout] Usuario anónimo creado:', response.data.user.id);
          console.log('✅ [RootLayout] isAnonymous:', response.data.user.isAnonymous);
        } else {
          console.error('❌ [RootLayout] Error creando usuario anónimo:', response.error);
        }
      } catch (error) {
        console.error('❌ [RootLayout] Excepción creando usuario anónimo:', error);
      }
    } else if (user) {
      console.log('👤 [RootLayout] Usuario ya existe:', user.id, '- isAnonymous:', user.isAnonymous);
    }
  };

  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Inicializar usuario anónimo al montar la app */}
      <AnonymousUserInitializer />

      {/* Inicializar ubicación al montar la app */}
      <LocationInitializer />

      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
