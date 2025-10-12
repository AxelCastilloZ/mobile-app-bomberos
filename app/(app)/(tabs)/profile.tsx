import { authService } from '@/services/auth';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const handleLogout = async () => {
    await authService.logout();
    // Recargar la misma pantalla para mostrar login
  };

  // Si NO está autenticado, mostrar opciones de login
  if (!isAuthenticated || !user) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />

        <View style={styles.guestHeader}>
          <View style={styles.guestAvatar}>
            <Text style={styles.guestAvatarText}>?</Text>
          </View>
          <Text style={styles.guestTitle}>¡Hola!</Text>
          <Text style={styles.guestSubtitle}>
            Inicia sesión o crea una cuenta
          </Text>
        </View>

        <View style={styles.guestContent}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.secondaryButtonText}>Crear Cuenta</Text>
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 Puedes reportar emergencias sin cuenta, pero al crear una podrás:
            </Text>
            <Text style={styles.bulletPoint}>• Ver historial de tus reportes</Text>
            <Text style={styles.bulletPoint}>• Recibir notificaciones de estado</Text>
            <Text style={styles.bulletPoint}>• Acceder a secciones especiales</Text>
          </View>
        </View>
      </View>
    );
  }

  // Si el usuario es ANÓNIMO, mostrar opción de completar perfil
  if (user.isAnonymous) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />

        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.username?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.name}>{user.username || 'Usuario Anónimo'}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Usuario Anónimo</Text>
          </View>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.upgradeBox}>
            <Text style={styles.upgradeIcon}>✨</Text>
            <Text style={styles.upgradeTitle}>Completa tu Perfil</Text>
            <Text style={styles.upgradeText}>
              Registra tu cuenta para acceder a todas las funciones
            </Text>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={styles.upgradeButtonText}>Completar Perfil</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>ID de Usuario</Text>
              <Text style={styles.infoValue}>{user.id}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Nombre de Usuario</Text>
              <Text style={styles.infoValue}>{user.username}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Tipo de Cuenta</Text>
              <Text style={styles.infoValue}>Anónimo</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Usuario REGISTRADO
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.username?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.name}>{user.username || 'Usuario'}</Text>
        <Text style={styles.email}>{user.email || 'Sin correo'}</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Botón Informes - Solo para bomberos/staff */}
        {!user.isAnonymous && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Panel de Control</Text>
            <TouchableOpacity
              style={styles.informesButton}
              onPress={() => router.push('/(app)/(tabs)/informes')}
            >
              <Text style={styles.informesIcon}>📊</Text>
              <View style={styles.informesTextContainer}>
                <Text style={styles.informesTitle}>Informes</Text>
                <Text style={styles.informesSubtitle}>
                  Gestionar informes detallados
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de Cuenta</Text>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>ID de Usuario</Text>
            <Text style={styles.infoValue}>{user.id}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Nombre de Usuario</Text>
            <Text style={styles.infoValue}>{user.username}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Correo Electrónico</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Tipo de Cuenta</Text>
            <Text style={styles.infoValue}>Registrado</Text>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>🚪 Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingBottom: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  badgeText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#dc3545',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '600',
  },
  guestHeader: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  guestAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  guestAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#999',
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  guestSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  guestContent: {
    flex: 1,
    padding: 20,
  },
  primaryButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#dc3545',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  secondaryButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#1565c0',
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#1565c0',
    marginLeft: 8,
    marginBottom: 4,
  },
  upgradeBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#ffc107',
  },
  upgradeIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  upgradeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  upgradeButton: {
    backgroundColor: '#ffc107',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  informesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  informesIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  informesTextContainer: {
    flex: 1,
  },
  informesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  informesSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  chevron: {
    fontSize: 24,
    color: '#dc3545',
    fontWeight: 'bold',
  },
});
