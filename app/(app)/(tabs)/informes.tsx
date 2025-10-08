import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function InformesScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  // Si no está autenticado, mostrar mensaje
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.lockContainer}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.lockTitle}>Sección Protegida</Text>
          <Text style={styles.lockSubtitle}>
            Esta sección es solo para bomberos autorizados
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/(app)/(tabs)/profile')}
          >
            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>📊 Informes</Text>
        <Text style={styles.subtitle}>Panel de Control - Bomberos</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.welcomeText}>
          Bienvenido, {user?.username}
        </Text>
        <Text style={styles.infoText}>
          Sección de informes y estadísticas (próximamente)
        </Text>

        <TouchableOpacity
          style={styles.card}
          onPress={() => Alert.alert('Próximamente', 'Estadísticas de emergencias')}
        >
          <Text style={styles.cardIcon}>📈</Text>
          <Text style={styles.cardTitle}>Estadísticas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => Alert.alert('Próximamente', 'Reportes mensuales')}
        >
          <Text style={styles.cardIcon}>📅</Text>
          <Text style={styles.cardTitle}>Reportes Mensuales</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => Alert.alert('Próximamente', 'Análisis de datos')}
        >
          <Text style={styles.cardIcon}>📊</Text>
          <Text style={styles.cardTitle}>Análisis</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  lockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  lockIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  lockTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  lockSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
