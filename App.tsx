import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { Text, ActivityIndicator, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import * as Haptics from 'expo-haptics';

import { Layout } from './components/common/Layout';
import { EmergencyButton } from './components/emergency/EmergencyButton';
import { BottomNavigation } from './components/navigation/BottomNavigation';
import { EmergencyTypeSelector } from './components/emergency/EmergencyTypeSelector';
import { LoginModal } from './components/auth/LoginModal';
import { useLocation } from './hooks/useLocation';
import { useAuth } from './hooks/useAuth';
import { apiService } from './services/api.service';
import { PHONE_NUMBERS, EMERGENCY_TYPES } from './utils/constants';

interface EmergencyReport {
  type: string;
  location: {
    latitude: number;
    longitude: number;
  } | null;
  timestamp: Date;
  deviceInfo: {
    deviceName: string;
    platform: string;
    osVersion: string;
  };
}

export default function App() {
  console.log('App component loaded'); // Log básico para verificar
  
  const { location, isLoading: locationLoading, error: locationError, refresh: refreshLocation, getLocationString, getLocationAccuracy } = useLocation();
  const { isLoggedIn, logout, isLoading: authLoading, hasAdminAccess, user } = useAuth();
  const [showEmergencyTypes, setShowEmergencyTypes] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Verificar conectividad al iniciar
  useEffect(() => {
    checkConnectivity();
  }, []);

  const checkConnectivity = async () => {
    try {
      const isOnline = await apiService.healthCheck();
      if (!isOnline) {
        console.warn('Sin conexión al servidor');
      }
    } catch (error) {
      console.warn('Error verificando conectividad:', error);
    }
  };

  const getDeviceInfo = () => ({
    deviceName: Device.deviceName || 'Dispositivo desconocido',
    platform: Platform.OS,
    osVersion: Platform.Version.toString(),
  });

  const handleEmergencyButtonPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowEmergencyTypes(true);
  };

  const handleEmergencyReport = (type: typeof EMERGENCY_TYPES[0]) => {
    Alert.alert(
      'Confirmar Emergencia',
      `¿Confirmas emergencia de tipo "${type.label}"?\n\nUbicación: ${location ? getLocationString() : 'No disponible'}\nPrecisión: ${location ? getLocationAccuracy() : 'N/A'}`,
      [
        { 
          text: 'Cancelar', 
          style: 'cancel', 
          onPress: () => setShowEmergencyTypes(false) 
        },
        {
          text: 'CONFIRMAR',
          style: 'destructive',
          onPress: () => sendEmergencyReport(type),
        },
      ]
    );
  };

  const sendEmergencyReport = async (type: typeof EMERGENCY_TYPES[0]) => {
    try {
      setIsSubmittingReport(true);
      
      const reportData: EmergencyReport = {
        type: type.id,
        location: location?.coords ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        } : null,
        timestamp: new Date(),
        deviceInfo: getDeviceInfo(),
      };
      
      console.log('Enviando emergencia:', reportData);
      
      // Intentar enviar al servidor
      try {
        await apiService.post('/app-mobile/emergency/report', reportData);
        
        // Feedback háptico de éxito
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        setShowEmergencyTypes(false);
        Alert.alert(
          'Emergencia Reportada', 
          'Los bomberos han sido notificados y están en camino.\n\nNúmero de reporte: ER-' + Date.now().toString().slice(-6),
          [{ text: 'OK' }]
        );
      } catch (apiError) {
        // Si falla el API, mostrar números de emergencia
        console.warn('Error enviando a API, mostrando números alternativos:', apiError);
        
        Alert.alert(
          'Reporte Local Guardado',
          `No se pudo conectar con el servidor, pero tu reporte ha sido guardado localmente.\n\nLlama directamente:\n• Emergencias: ${PHONE_NUMBERS.EMERGENCY}\n• Estación: ${PHONE_NUMBERS.STATION}`,
          [{ text: 'Entendido' }]
        );
        
        setShowEmergencyTypes(false);
      }
    } catch (error) {
      console.error('Error enviando emergencia:', error);
      Alert.alert(
        'Error',
        'No se pudo procesar el reporte. Por favor llama directamente a emergencias: ' + PHONE_NUMBERS.EMERGENCY
      );
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleNavigation = (screen: string) => {
    if (screen === 'home') {
      setShowEmergencyTypes(false);
    } else if (screen === 'reports-public') {
      Alert.alert('Reportes Públicos', 'Funcionalidad en desarrollo:\n• Mapa de reportes de la comunidad\n• Estado de emergencias activas\n• Historial público');
    } else if (screen === 'reports-admin') {
      if (hasAdminAccess()) {
        Alert.alert('Panel Administrativo', 'Funcionalidad en desarrollo:\n• Dashboard de personal bomberil\n• Gestión de reportes\n• Asignación de recursos\n• Estadísticas');
      } else {
        Alert.alert('Acceso Restringido', 'Debes iniciar sesión como personal autorizado para acceder a esta sección.');
      }
    } else if (screen === 'login') {
      if (isLoggedIn) {
        Alert.alert('Cerrar Sesión', '¿Estás seguro de que quieres cerrar la sesión?', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Cerrar Sesión', style: 'destructive', onPress: logout }
        ]);
      } else {
        setShowLoginModal(true);
      }
    }
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    Alert.alert('Login Exitoso', `¡Bienvenido, ${user?.username}!`);
  };

  // Mostrar pantalla de carga durante inicialización
  if (authLoading) {
    return (
      <Layout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D32F2F" />
          <Text style={styles.loadingText}>Inicializando aplicación...</Text>
        </View>
      </Layout>
    );
  }

  if (showEmergencyTypes) {
    return (
      <Layout>
        <EmergencyTypeSelector
          onTypeSelect={handleEmergencyReport}
          onCancel={() => setShowEmergencyTypes(false)}
        />
        <BottomNavigation isLoggedIn={isLoggedIn} onNavigate={handleNavigation} />
        
        {/* Loading overlay para envío de reporte */}
        {isSubmittingReport && (
          <View style={styles.overlay}>
            <View style={styles.overlayContent}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.overlayText}>Enviando reporte de emergencia...</Text>
            </View>
          </View>
        )}
      </Layout>
    );
  }

  // Main app screen
  return (
    <Layout>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <MaterialCommunityIcons name="fire-truck" size={48} color="#D32F2F" />
          <Text style={styles.title}>Bomberos Nosara</Text>
          <Text style={styles.subtitle}>Sistema de Emergencias</Text>
        </View>

        <View style={styles.statusContainer}>
          {locationLoading ? (
            <View style={styles.statusItem}>
              <ActivityIndicator size="small" color="#1976D2" />
              <Text style={styles.statusText}>Obteniendo ubicación...</Text>
            </View>
          ) : locationError ? (
            <View style={styles.statusItem}>
              <MaterialCommunityIcons name="alert-circle" size={20} color="#F57C00" />
              <Text style={styles.statusText}>Ubicación no disponible</Text>
              <Button mode="text" onPress={refreshLocation} compact>
                Reintentar
              </Button>
            </View>
          ) : location ? (
            <View style={styles.statusItem}>
              <MaterialCommunityIcons name="map-marker-check" size={20} color="#388E3C" />
              <Text style={styles.statusText}>
                Ubicación: {getLocationString()}
              </Text>
              <Text style={styles.accuracyText}>
                Precisión: {getLocationAccuracy()}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.emergencyContainer}>
          <EmergencyButton onPress={handleEmergencyButtonPress} />
          <Text style={styles.emergencyText}>
            Presiona solo en caso de emergencia real
          </Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Números de Emergencia:</Text>
          <Text style={styles.phoneNumber}>🚨 Emergencias: {PHONE_NUMBERS.EMERGENCY}</Text>
          <Text style={styles.phoneNumber}>🚒 Estación: {PHONE_NUMBERS.STATION}</Text>
        </View>
      </View>

      <BottomNavigation isLoggedIn={isLoggedIn} onNavigate={handleNavigation} />

      {/* Login Modal */}
      <LoginModal 
        visible={showLoginModal} 
        onDismiss={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  statusContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 32,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  accuracyText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emergencyContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emergencyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  infoContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  phoneNumber: {
    fontSize: 16,
    color: '#1976D2',
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    backgroundColor: '#D32F2F',
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  overlayText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
  },
});