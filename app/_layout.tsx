import { authService } from '@/services/auth';
import { useAuthStore } from '@/store/authStore';
import * as Device from 'expo-device';
import { Stack } from 'expo-router';
import { useEffect } from 'react';

export default function RootLayout() {
  useEffect(() => {
    const initializeAnonymousUser = async () => {
      const { isAuthenticated, user } = useAuthStore.getState();

      // Si NO está autenticado Y NO tiene usuario → Crear anónimo
      if (!isAuthenticated && !user) {
        console.log('🔄 Inicializando usuario anónimo al inicio de la app...');

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
            console.log('✅ Usuario anónimo creado al inicio:', response.data.user.id);
            console.log('✅ isAnonymous:', response.data.user.isAnonymous);
          } else {
            console.error('❌ Error creando usuario anónimo:', response.error);
          }
        } catch (error) {
          console.error('❌ Excepción creando usuario anónimo:', error);
        }
      } else if (user) {
        console.log('👤 Usuario ya existe:', user.id, '- isAnonymous:', user.isAnonymous);
      }
    };

    initializeAnonymousUser();
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
