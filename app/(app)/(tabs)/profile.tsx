// app/(app)/(tabs)/profile.tsx
import { authService } from '@/services/auth';
import { useAuthStore } from '@/store/authStore';
import { isStaff } from '@/types/auth';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const handleLogout = async () => {
    await authService.logout();
  };

  // ========== SIN USUARIO (no ha hecho ningún reporte aún) ==========
  if (!user) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />

        <View style={styles.guestHeader}>
          <View style={styles.guestAvatar}>
            <Text style={styles.guestAvatarText}>👤</Text>
          </View>
          <Text style={styles.guestTitle}>¡Bienvenido!</Text>
          <Text style={styles.guestSubtitle}>
            Aún no tienes una sesión activa
          </Text>
        </View>

        <View style={styles.guestContent}>
          {/* Login para bomberos/personal */}
          <View style={styles.staffSection}>
            <Text style={styles.staffTitle}>¿Eres personal de bomberos?</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Ciudadanos</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>💡 ¿Sabías que?</Text>
            <Text style={styles.infoText}>
              Puedes reportar emergencias sin necesidad de crear una cuenta.
            </Text>
            <Text style={styles.infoTextSmall}>
              Al hacer tu primer reporte, se creará automáticamente un perfil anónimo para ti.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ========== USUARIO ANÓNIMO ==========
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
          <Text style={styles.name}>{user.username || 'Usuario'}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Usuario Anónimo</Text>
          </View>
        </View>

        <ScrollView style={styles.content}>
          {/* Opción para completar perfil */}
          <View style={styles.upgradeBox}>
            <Text style={styles.upgradeIcon}>✨</Text>
            <Text style={styles.upgradeTitle}>Completa tu Perfil</Text>
            <Text style={styles.upgradeText}>
              Registra tus datos para acceder a más funciones y recibir actualizaciones de tus reportes
            </Text>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => router.push('/(auth)/complete-profile')}
            >
              <Text style={styles.upgradeButtonText}>Completar Perfil</Text>
            </TouchableOpacity>
          </View>

          {/* Login para bomberos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>¿Eres personal de bomberos?</Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            </TouchableOpacity>
          </View>

          {/* Info del usuario */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>ID de Usuario</Text>
              <Text style={styles.infoValue}>{user.id}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Nombre</Text>
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

  // ========== USUARIO REGISTRADO (Ciudadano o Bombero) ==========
  const userIsStaff = isStaff(user);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={[styles.avatar, userIsStaff && styles.avatarStaff]}>
          <Text style={styles.avatarText}>
            {user.username?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.name}>{user.username || 'Usuario'}</Text>
        <Text style={styles.email}>{user.email || 'Sin correo'}</Text>
        {userIsStaff && (
          <View style={styles.staffBadge}>
            <Text style={styles.staffBadgeText}>🚒 Personal de Bomberos</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* Panel de Control - Solo para staff */}
        {userIsStaff && (
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
                  Gestionar informes y estadísticas
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Información de cuenta */}
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
            <Text style={styles.infoValue}>{user.email || 'No registrado'}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Tipo de Cuenta</Text>
            <Text style={styles.infoValue}>
              {userIsStaff ? 'Personal de Bomberos' : 'Ciudadano Registrado'}
            </Text>
          </View>

          {user.roles && user.roles.length > 0 && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Roles</Text>
              <Text style={styles.infoValue}>{user.roles.join(', ')}</Text>
            </View>
          )}
        </View>

        {/* Cerrar Sesión */}
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
  // Header
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
  avatarStaff: {
    backgroundColor: '#28a745',
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
  staffBadge: {
    backgroundColor: '#d4edda',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#28a745',
  },
  staffBadgeText: {
    fontSize: 12,
    color: '#155724',
    fontWeight: '600',
  },
  // Content
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
    maxWidth: '60%',
    textAlign: 'right',
  },
  // Buttons
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
  loginButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#dc3545',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '600',
  },
  // Guest
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
    fontSize: 40,
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
  // Staff Section
  staffSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  staffTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
  // Info Box
  infoBox: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1565c0',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1565c0',
    marginBottom: 8,
  },
  infoTextSmall: {
    fontSize: 12,
    color: '#1976d2',
    fontStyle: 'italic',
  },
  // Upgrade Box
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
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
  // Informes Button
  informesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#28a745',
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
    color: '#28a745',
    fontWeight: 'bold',
  },
});
