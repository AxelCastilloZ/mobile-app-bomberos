// app/_layout.tsx
import { useLocation } from '@/hooks/useLocation';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';

function AppInitializer({ onReady }: { onReady: () => void }) {
  const {
    requestPermission,
    getCurrentLocation,
    startWatching,
    hasPermission,
  } = useLocation();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // ========== 1. CARGAR SESIÓN EXISTENTE (si hay) ==========
      console.log('🔐 [RootLayout] Cargando sesión guardada...');
      await useAuthStore.getState().loadSession();

      const { user } = useAuthStore.getState();

      if (user) {
        console.log('👤 [RootLayout] Sesión recuperada:', {
          id: user.id,
          isAnonymous: user.isAnonymous,
        });
      } else {
        console.log('👤 [RootLayout] No hay sesión guardada (se creará al reportar)');
      }

      // ========== 2. UBICACIÓN ==========
      console.log('📍 [RootLayout] Inicializando ubicación...');

      if (!hasPermission) {
        console.log('📍 [RootLayout] Solicitando permisos...');
        const granted = await requestPermission();

        if (!granted) {
          console.warn('⚠️ [RootLayout] Permisos de ubicación denegados');
          Alert.alert(
            'Ubicación Deshabilitada',
            'Para reportar emergencias con precisión, habilita los permisos de ubicación en la configuración.',
            [{ text: 'Entendido' }]
          );
        }
      }

      if (hasPermission) {
        console.log('📍 [RootLayout] Obteniendo ubicación inicial...');
        const location = await getCurrentLocation();

        if (location) {
          console.log('✅ [RootLayout] Ubicación obtenida:', {
            lat: location.coordinates.latitude,
            lng: location.coordinates.longitude,
          });

          console.log('📍 [RootLayout] Iniciando tracking...');
          await startWatching();
          console.log('✅ [RootLayout] Tracking iniciado');
        }
      }

    } catch (error) {
      console.error('❌ [RootLayout] Error en inicialización:', error);
    } finally {
      console.log('✅ [RootLayout] App lista');
      onReady();
    }
  };

  return null;
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#E53E3E" />
        <AppInitializer onReady={() => setIsReady(true)} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
