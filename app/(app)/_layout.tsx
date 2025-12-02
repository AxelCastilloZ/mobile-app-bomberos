
import { useAuthStore } from '@/store/authStore';
import { Redirect, Stack } from 'expo-router';

export default function AppLayout() {
  const { user } = useAuthStore();

  // Si no hay usuario (algo falló en la inicialización),
  // redirigir al inicio para que se cree el anónimo
  if (!user) {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
