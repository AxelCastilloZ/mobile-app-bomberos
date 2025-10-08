import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function Index() {
  const router = useRouter();
  const { loadSession } = useAuthStore();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Cargar sesión guardada (si existe)
      await loadSession();

      // Siempre ir a la app principal (no requiere auth)
      setTimeout(() => {
        router.replace('/(app)/(tabs)');
      }, 500);
    } catch (error) {
      console.error('Error loading session:', error);
      // Ir a tabs de todas formas
      router.replace('/(app)/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#dc3545" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
