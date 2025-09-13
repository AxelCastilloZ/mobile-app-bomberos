// src/screens/HomeScreen.tsx - Actualizado para Expo Router
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Platform, Linking } from 'react-native';
import { Text, ActivityIndicator, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Device from 'expo-device';
import * as Haptics from 'expo-haptics';

import { EmergencyButton } from '../components/emergency/EmergencyButton';
import { useLocation } from '../hooks/useLocation';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api.service';
import { emergencyService } from '../services/emergency.service';
import { PHONE_NUMBERS, EMERGENCY_TYPES } from '../utils/constants';

export const HomeScreen: React.FC = () => {
  const { 
    location, 
    isLoading: locationLoading, 
    error: locationError, 
    refreshLocation, 
    getLocationString, 
    getLocationAccuracy,
    hasGoodAccuracy 
  } = useLocation();
  
  const { user } = useAuth();
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    checkServerStatus();
    emergencyService.cleanOldReports().catch(console.warn);
  }, []);

  const checkServerStatus = async () => {
    try {
      setServerStatus('checking');
      const isOnline = await apiService.isServerAvailable();
      setServerStatus(isOnline ? 'online' : 'offline');
    } catch (error) {
      console.warn('Error verificando servidor:', error);
      setServerStatus('offline');
    }
  };

  const handleEmergencyButtonPress = () => {
    if (!location) {
      Alert.alert(
        'Ubicación Requerida',
        'No se pudo obtener tu ubicación. ¿Deseas continuar sin ubicación precisa?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Reintentar Ubicación', 
            onPress: () => {
              refreshLocation();
              setTimeout(() => {
                if (location) {
                  proceedWithEmergency();
                }
              }, 2000);
            }
          },
          { text: 'Continuar Sin Ubicación', onPress: proceedWithEmergency },
        ]
      );
      return;
    }

    if (!hasGoodAccuracy()) {
      Alert.alert(
        'Ubicación Imprecisa',
        `Tu ubicación tiene una precisión de ${location?.coords.accuracy?.toFixed(0)}m. ¿Deseas mejorar la precisión?`,
        [
          { text: 'Continuar Así', onPress: proceedWithEmergency },
          { 
            text: 'Mejorar Precisión', 
            onPress: () => {
              refreshLocation();
              setTimeout(proceedWithEmergency, 3000);
            }
          },
        ]
      );
      return;
    }

    proceedWithEmergency();
  };

  const proceedWithEmergency = () => {
    try {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      // Navegar a la pantalla de emergencia usando Expo Router
      router.push('/emergency');
    } catch (error) {
      console.error('Error navegando a emergencia:', error);
      Alert.alert('Error', 'No se pudo abrir la pantalla de emergencia');
    }
  };

  const retryConnection = async () => {
    await checkServerStatus();
    if (serverStatus === 'online') {
      try {
        const result = await emergencyService.retryPendingReports();
        if (result.success > 0) {
          Alert.alert(
            'Conexión Restaurada',
            `Se enviaron ${result.success} reportes pendientes al servidor.`
          );
        }
      } catch (error) {
        console.warn('Error en retry de reportes:', error);
      }
    }
  };

  const handleRefreshLocation = () => {
    refreshLocation();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <MaterialCommunityIcons name="fire-truck" size={48} color="#D32F2F" />
        <Text style={styles.title}>Bomberos Nosara</Text>
        <Text style={styles.subtitle}>Sistema de Emergencias</Text>
        {user && (
          <Text style={styles.welcomeText}>Bienvenido, {user.username}</Text>
        )}
      </View>

      {/* Estado de conectividad */}
      <View style={styles.connectivityContainer}>
        <View style={styles.connectivityItem}>
          {serverStatus === 'checking' ? (
            <>
              <ActivityIndicator size="small" color="#FF8800" />
              <Text style={styles.connectivityText}>Verificando servidor...</Text>
            </>
          ) : serverStatus === 'online' ? (
            <>
              <MaterialCommunityIcons name="wifi" size={20} color="#4CAF50" />
              <Text style={[styles.connectivityText, { color: '#4CAF50' }]}>
                Conectado al servidor
              </Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="wifi-off" size={20} color="#F57C00" />
              <Text style={[styles.connectivityText, { color: '#F57C00' }]}>
                Modo offline
              </Text>
              <Button mode="text" onPress={retryConnection} compact>
                Reintentar
              </Button>
            </>
          )}
        </View>
      </View>

      {/* Estado de ubicación */}
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
            <Button mode="text" onPress={handleRefreshLocation} compact>
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

      {/* Botón de emergencia */}
      <View style={styles.emergencyContainer}>
        <EmergencyButton onPress={handleEmergencyButtonPress} />
        <Text style={styles.emergencyText}>
          Presiona solo en caso de emergencia real
        </Text>
      </View>

      {/* Números de emergencia */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Números de Emergencia:</Text>
        <Text 
          style={styles.phoneNumber}
          onPress={() => Linking.openURL(`tel:${PHONE_NUMBERS.EMERGENCY}`)}
        >
          🚨 Emergencias: {PHONE_NUMBERS.EMERGENCY}
        </Text>
        <Text 
          style={styles.phoneNumber}
          onPress={() => Linking.openURL(`tel:${PHONE_NUMBERS.STATION}`)}
        >
          🚒 Estación: {PHONE_NUMBERS.STATION}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
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
  welcomeText: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 8,
    fontWeight: '500',
  },
  connectivityContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  connectivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectivityText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
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
    textDecorationLine: 'underline',
  },
});