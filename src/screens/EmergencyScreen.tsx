// src/screens/EmergencyScreen.tsx - Actualizado para Expo Router
import React, { useState } from 'react';
import { View, StyleSheet, Alert, Platform, Linking } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import * as Device from 'expo-device';
import * as Haptics from 'expo-haptics';

import { EmergencyTypeSelector } from '../components/emergency/EmergencyTypeSelector';
import { useLocation } from '../hooks/useLocation';
import { emergencyService } from '../services/emergency.service';
import { PHONE_NUMBERS, EMERGENCY_TYPES } from '../utils/constants';

export const EmergencyScreen: React.FC = () => {
  const { location, getLocationString, getLocationAccuracy } = useLocation();
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const getDeviceInfo = () => ({
    deviceName: Device.deviceName || 'Dispositivo desconocido',
    platform: Platform.OS,
    osVersion: Platform.Version.toString(),
  });

  const handleCancel = () => {
    router.back();
  };

  const handleEmergencyReport = (type: any) => {
    const locationString = location ? getLocationString() : 'No disponible';
    const accuracyString = location ? getLocationAccuracy() : 'N/A';

    Alert.alert(
      'Confirmar Emergencia',
      `¿Confirmas emergencia de tipo "${type.label}"?\n\n📍 Ubicación: ${locationString}\n🎯 Precisión: ${accuracyString}\n\n⚠️ Esta es una emergencia real`,
      [
        { 
          text: 'Cancelar', 
          style: 'cancel', 
          onPress: handleCancel 
        },
        {
          text: 'CONFIRMAR EMERGENCIA',
          style: 'destructive',
          onPress: () => sendEmergencyReport(type),
        },
      ]
    );
  };

  const sendEmergencyReport = async (type: any) => {
    try {
      setIsSubmittingReport(true);
      
      const reportData = {
        type: type.id,
        location: location?.coords ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || undefined,
        } : null,
        timestamp: new Date(),
        deviceInfo: getDeviceInfo(),
        priority: type.priority || 'high',
      };
      
      const response = await emergencyService.submitEmergencyReport(reportData);
      
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      router.back();
      
      let message = 'Los bomberos han sido notificados.';
      if (response.status === 'saved_locally') {
        message = 'Tu reporte se guardó localmente y se enviará cuando haya conexión.';
      } else {
        if (response.estimatedArrival) {
          message += `\n⏰ Tiempo estimado: ${response.estimatedArrival}`;
        }
        if (response.assignedUnit) {
          message += `\n🚒 Unidad asignada: ${response.assignedUnit}`;
        }
      }
      message += `\n📋 ID del reporte: ${response.reportId}`;

      Alert.alert(
        'Emergencia Reportada', 
        message,
        [
          { text: 'OK' },
          { 
            text: 'Llamar Directamente', 
            onPress: () => Linking.openURL(`tel:${PHONE_NUMBERS.EMERGENCY}`) 
          }
        ]
      );
        
    } catch (error) {
      console.error('Error enviando emergencia:', error);
      Alert.alert(
        'Error',
        'Hubo un problema enviando el reporte. Por favor llama directamente al 911.',
        [
          { text: 'Entendido' },
          { 
            text: 'Llamar Ahora', 
            onPress: () => Linking.openURL(`tel:${PHONE_NUMBERS.EMERGENCY}`) 
          }
        ]
      );
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <View style={styles.container}>
      <EmergencyTypeSelector
        onTypeSelect={handleEmergencyReport}
        onCancel={handleCancel}
      />
      
      {isSubmittingReport && (
        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.overlayText}>Enviando reporte de emergencia...</Text>
            <Text style={styles.overlaySubtext}>No cierres la aplicación</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  overlaySubtext: {
    color: '#FFCDD2',
    marginTop: 4,
    fontSize: 12,
  },
});