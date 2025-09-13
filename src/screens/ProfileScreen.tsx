
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, List, Switch, Divider, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '../hooks/useAuth';
import { useStorage } from '../hooks/useStorage';
import { emergencyService } from '../services/emergency.service';
import { apiService } from '../services/api.service';

interface UserStats {
  totalReports: number;
  pendingReports: number;
  thisMonthReports: number;
  reportsByType: Record<string, number>;
}

interface UserPreferences {
  notifications: boolean;
  locationSharing: boolean;
  emergencyAlerts: boolean;
  darkMode: boolean;
}

export const ProfileScreen: React.FC = () => {
  const { user, isLoggedIn, logout, changePassword } = useAuth();
  const { getUserPreferences, saveUserPreferences } = useStorage();
  
  const [stats, setStats] = useState<UserStats | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>({
    notifications: true,
    locationSharing: true,
    emergencyAlerts: true,
    darkMode: false,
  });
  const [loading, setLoading] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  // En la función loadUserData, reemplaza esta parte:
const loadUserData = async () => {
  try {
    setLoading(true);
    
    // Cargar estadísticas de reportes
    const reportStats = await emergencyService.getReportStats();
    
    // Convertir al formato esperado, proporcionando valores por defecto
    const userStats: UserStats = {
      totalReports: reportStats?.total || 0,
      pendingReports: reportStats?.pending || 0,
      thisMonthReports: reportStats?.thisMonth || 0,
      reportsByType: reportStats?.byType || {},
    };
    
    setStats(userStats);

   
  } catch (error) {
    console.error('Error cargando datos del usuario:', error);
 
    setStats({
      totalReports: 0,
      pendingReports: 0,
      thisMonthReports: 0,
      reportsByType: {},
    });
  } finally {
    setLoading(false);
  }
};

  const updatePreference = async (key: keyof UserPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    await saveUserPreferences(newPreferences);
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar la sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              Alert.alert('Sesión Cerrada', 'Has cerrado sesión exitosamente.');
            } catch (error) {
              Alert.alert('Error', 'Hubo un problema cerrando la sesión.');
            }
          },
        },
      ]
    );
  };

  const handleChangePassword = () => {
    Alert.prompt(
      'Cambiar Contraseña',
      'Ingresa tu contraseña actual:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          onPress: (currentPassword) => {
            if (currentPassword) {
              promptNewPassword(currentPassword);
            }
          },
        },
      ],
      'secure-text'
    );
  };

  const promptNewPassword = (currentPassword: string) => {
    Alert.prompt(
      'Nueva Contraseña',
      'Ingresa tu nueva contraseña:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cambiar',
          onPress: async (newPassword) => {
            if (newPassword && newPassword.length >= 6) {
              try {
                setChangingPassword(true);
                await changePassword(currentPassword, newPassword);
                Alert.alert('Éxito', 'Contraseña cambiada exitosamente.');
              } catch (error) {
                Alert.alert('Error', 'No se pudo cambiar la contraseña. Verifica tu contraseña actual.');
              } finally {
                setChangingPassword(false);
              }
            } else {
              Alert.alert('Error', 'La nueva contraseña debe tener al menos 6 caracteres.');
            }
          },
        },
      ],
      'secure-text'
    );
  };

  const showServerInfo = async () => {
    try {
      const connectionInfo = await apiService.testConnection();
      Alert.alert(
        'Información del Servidor',
        `URL: ${connectionInfo.url}\nEstado: ${connectionInfo.available ? 'Conectado' : 'Desconectado'}\n${connectionInfo.responseTime ? `Tiempo de respuesta: ${connectionInfo.responseTime}ms` : ''}\n${connectionInfo.error ? `Error: ${connectionInfo.error}` : ''}`
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener información del servidor.');
    }
  };

  const clearAppData = () => {
    Alert.alert(
      'Limpiar Datos',
      'Esto eliminará todos los datos locales de la aplicación. ¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { clearAll } = useStorage();
              await clearAll();
              Alert.alert('Datos Limpiados', 'Todos los datos locales han sido eliminados.');
            } catch (error) {
              Alert.alert('Error', 'No se pudieron limpiar todos los datos.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D32F2F" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header del perfil */}
      <Card style={styles.profileCard}>
        <Card.Content>
          <View style={styles.profileHeader}>
            <MaterialCommunityIcons 
              name={isLoggedIn ? "account-circle" : "account-outline"} 
              size={60} 
              color="#D32F2F" 
            />
            <View style={styles.profileInfo}>
              <Text variant="headlineSmall" style={styles.profileName}>
                {isLoggedIn ? user?.username : 'Usuario Anónimo'}
              </Text>
              <Text variant="bodyMedium" style={styles.profileEmail}>
                {isLoggedIn ? user?.email : 'No autenticado'}
              </Text>
              {isLoggedIn && user?.roles && (
                <Text variant="bodySmall" style={styles.profileRole}>
                  Roles: {user.roles.join(', ')}
                </Text>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Estadísticas de reportes */}
      {stats && (
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Mis Estadísticas
            </Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={styles.statNumber}>
                  {stats.totalReports}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Total Reportes
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={[styles.statNumber, { color: '#FF8800' }]}>
                  {stats.pendingReports}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Pendientes
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={[styles.statNumber, { color: '#4CAF50' }]}>
                  {stats.thisMonthReports}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Este Mes
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Configuraciones */}
      <Card style={styles.settingsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Configuraciones
          </Text>

          <List.Item
            title="Notificaciones"
            description="Recibir notificaciones de emergencias"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={() => (
              <Switch
                value={preferences.notifications}
                onValueChange={(value) => updatePreference('notifications', value)}
              />
            )}
          />

          <Divider />

          <List.Item
            title="Compartir Ubicación"
            description="Enviar ubicación en reportes de emergencia"
            left={(props) => <List.Icon {...props} icon="map-marker" />}
            right={() => (
              <Switch
                value={preferences.locationSharing}
                onValueChange={(value) => updatePreference('locationSharing', value)}
              />
            )}
          />

          <Divider />

          <List.Item
            title="Alertas de Emergencia"
            description="Recibir alertas de emergencias cercanas"
            left={(props) => <List.Icon {...props} icon="alert" />}
            right={() => (
              <Switch
                value={preferences.emergencyAlerts}
                onValueChange={(value) => updatePreference('emergencyAlerts', value)}
              />
            )}
          />

          <Divider />

          <List.Item
            title="Modo Oscuro"
            description="Usar tema oscuro en la aplicación"
            left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
            right={() => (
              <Switch
                value={preferences.darkMode}
                onValueChange={(value) => updatePreference('darkMode', value)}
              />
            )}
          />
        </Card.Content>
      </Card>

      {/* Acciones de cuenta */}
      {isLoggedIn && (
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Cuenta
            </Text>

            <Button
              mode="outlined"
              icon="lock-reset"
              onPress={handleChangePassword}
              style={styles.actionButton}
              loading={changingPassword}
              disabled={changingPassword}
            >
              Cambiar Contraseña
            </Button>

            <Button
              mode="outlined"
              icon="logout"
              onPress={handleLogout}
              style={styles.actionButton}
            >
              Cerrar Sesión
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Información de la aplicación */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Información
          </Text>

          <List.Item
            title="Versión de la App"
            description="1.0.0"
            left={(props) => <List.Icon {...props} icon="information" />}
          />

          <Divider />

          <List.Item
            title="Información del Servidor"
            description="Ver estado de conexión"
            left={(props) => <List.Icon {...props} icon="server" />}
            onPress={showServerInfo}
          />

          <Divider />

          <List.Item
            title="Limpiar Datos"
            description="Eliminar todos los datos locales"
            left={(props) => <List.Icon {...props} icon="delete-sweep" />}
            onPress={clearAppData}
          />
        </Card.Content>
      </Card>

      {/* Información de contacto */}
      <Card style={styles.contactCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Contacto de Emergencia
          </Text>
          
          <Text variant="bodyMedium" style={styles.contactText}>
            🚨 Emergencias: 911
          </Text>
          <Text variant="bodyMedium" style={styles.contactText}>
            🚒 Estación Bomberos: 2682-0012
          </Text>
          <Text variant="bodyMedium" style={styles.contactText}>
            🚓 Policía: 117
          </Text>
          <Text variant="bodyMedium" style={styles.contactText}>
            ⛑️ Cruz Roja: 128
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  profileCard: {
    marginBottom: 16,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontWeight: 'bold',
    color: '#D32F2F',
  },
  profileEmail: {
    color: '#666',
    marginTop: 4,
  },
  profileRole: {
    color: '#4CAF50',
    marginTop: 4,
    fontStyle: 'italic',
  },
  statsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
    color: '#D32F2F',
  },
  statLabel: {
    color: '#666',
    textAlign: 'center',
  },
  settingsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  actionsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  actionButton: {
    marginBottom: 8,
  },
  infoCard: {
    marginBottom: 16,
    elevation: 2,
  },
  contactCard: {
    marginBottom: 32,
    elevation: 2,
  },
  contactText: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '500',
  },
});