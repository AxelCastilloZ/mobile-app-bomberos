import { useLocation } from '@/hooks/useLocation';
import { useCreateReport } from '@/hooks/useReports';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';
import { CreateReportData } from '@/types/reports';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { height } = Dimensions.get('window');
const HOLD_DURATION = 3000; // 3 segundos

type EmergencyType = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

const EMERGENCY_TYPES: EmergencyType[] = [
  { id: 'FIRE', name: 'Incendio', icon: '🔥', color: '#ff6b6b' },
  { id: 'ACCIDENT', name: 'Accidente', icon: '🚗', color: '#f59e0b' },
  { id: 'MEDICAL', name: 'Médica', icon: '🏥', color: '#ef4444' },
  { id: 'RESCUE', name: 'Rescate', icon: '🆘', color: '#8b5cf6' },
  { id: 'OTHER', name: 'Otra', icon: '⚡', color: '#6366f1' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { currentLocation } = useLocationStore();
  const { hasPermission, requestPermission, getCurrentLocation } = useLocation();
  const { mutateAsync: createReport, isPending: isCreatingReport } = useCreateReport();

  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const holdTimer = useRef<NodeJS.Timeout | null>(null);

  const handlePressIn = () => {
    setIsHolding(true);
    setProgress(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animar escala
    Animated.spring(scaleAnim, {
      toValue: 1.15,
      useNativeDriver: true,
      friction: 5,
    }).start();

    // Animar progreso
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: HOLD_DURATION,
      useNativeDriver: false,
    }).start();

    // Timer para actualizar progreso
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(elapsed / HOLD_DURATION, 1);
      setProgress(currentProgress);

      // Vibración a la mitad
      if (currentProgress >= 0.5 && currentProgress < 0.52) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      if (currentProgress >= 1) {
        clearInterval(interval);
      }
    }, 50);

    // Timer para completar
    holdTimer.current = setTimeout(() => {
      handleHoldComplete();
      clearInterval(interval);
    }, HOLD_DURATION);
  };

  const handlePressOut = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
    }

    setIsHolding(false);
    setProgress(0);
    progressAnim.setValue(0);

    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const handleHoldComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsHolding(false);
    setProgress(0);
    progressAnim.setValue(0);

    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

    setShowTypeModal(true);
  };

  const handleTypeSelected = async (type: EmergencyType) => {
    setShowTypeModal(false);

    Alert.alert(
      `Reportar ${type.name}`,
      '¿Confirmas que deseas enviar este reporte de emergencia?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'default',
          onPress: () => createEmergencyReport(type),
        },
      ]
    );
  };

  const createEmergencyReport = async (type: EmergencyType) => {
    try {
      // 🔹 PASO 1: Obtener ubicación (REQUERIDA)
      let location = currentLocation;

      // Si no hay ubicación en el store, intentar obtenerla ahora
      if (!location) {
        console.log('📍 No hay ubicación en store, obteniendo...');

        // Verificar permisos
        if (!hasPermission) {
          Alert.alert(
            'Ubicación Requerida',
            'Se necesita tu ubicación para reportar la emergencia. ¿Deseas habilitar los permisos?',
            [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Habilitar',
                onPress: async () => {
                  const granted = await requestPermission();
                  if (granted) {
                    // Reintentar después de obtener permisos
                    createEmergencyReport(type);
                  } else {
                    Alert.alert(
                      'Permisos Denegados',
                      'No se puede crear el reporte sin ubicación.'
                    );
                  }
                },
              },
            ]
          );
          return;
        }

        // Intentar obtener ubicación
        try {
          location = await getCurrentLocation();
        } catch (error) {
          console.error('❌ Error obteniendo ubicación:', error);
        }

        // Si aún no hay ubicación, no se puede continuar
        if (!location) {
          Alert.alert(
            'Error',
            'No se pudo obtener tu ubicación. Verifica que el GPS esté habilitado e intenta nuevamente.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      // 🔹 PASO 2: Crear el reporte CON ubicación
      console.log('📝 Creando reporte de tipo:', type.id);
      console.log('📍 Ubicación:', {
        lat: location.coordinates.latitude,
        lng: location.coordinates.longitude,
      });

      const reportData: CreateReportData = {
        type: type.id,
        latitud: location.coordinates.latitude,
        longitud: location.coordinates.longitude,
        ...(user?.isAnonymous && { mobileUserId: user.id }), // ✅ Solo si es anónimo
      };

      console.log('📤 Enviando reporte:', reportData);

      const reportResponse = await createReport(reportData);

      if (!reportResponse.data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      // 🔹 PASO 3: Feedback de éxito
      console.log('✅ Reporte creado exitosamente:', reportResponse.data.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const locationInfo = location.address?.formatted
        ? `\n📍 ${location.address.formatted}`
        : `\n📍 Lat: ${location.coordinates.latitude.toFixed(4)}, Lon: ${location.coordinates.longitude.toFixed(4)}`;

      Alert.alert(
        '✅ Reporte Enviado',
        `Tu reporte de ${type.name} ha sido enviado correctamente.${locationInfo}\n\nID: ${reportResponse.data.id}`,
        [
          {
            text: 'Ver Reportes',
            onPress: () => router.push('/(app)/(tabs)/reports'),
          },
          { text: 'OK' },
        ]
      );
    } catch (error) {
      console.error('❌ Error creando reporte:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      Alert.alert(
        'Error',
        'No se pudo enviar el reporte. Verifica tu conexión e intenta nuevamente.'
      );
    }
  };

  const progressRotation = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header minimalista */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {user?.username || 'Bienvenido'} 👋
        </Text>
        <Text style={styles.subtitle}>
          {user?.isAnonymous
            ? 'Usuario Anónimo'
            : isAuthenticated
            ? 'Ciudadano Registrado'
            : 'Sistema de Emergencias'}
        </Text>
        {/* Indicador de ubicación */}
        {currentLocation && (
          <Text style={styles.locationIndicator}>
            📍 {currentLocation.address?.city || currentLocation.address?.formatted || 'Ubicación detectada'}
          </Text>
        )}
      </View>

      {/* Botón centrado grande */}
      <View style={styles.mainContent}>
        <View style={styles.buttonContainer}>
          <Text style={styles.instruction}>
            {isHolding ? 'Mantén presionado...' : 'Mantén presionado'}
          </Text>

          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              activeOpacity={1}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={isCreatingReport}
            >
              <View style={styles.emergencyButton}>
                {/* Anillo de progreso */}
                {isHolding && (
                  <Animated.View
                    style={[
                      styles.progressRing,
                      { transform: [{ rotate: progressRotation }] },
                    ]}
                  >
                    <View style={styles.progressSegment} />
                  </Animated.View>
                )}

                {/* Contenido del botón */}
                <View style={styles.buttonContent}>
                  <Text style={styles.emergencyIcon}>🚨</Text>
                  <Text style={styles.emergencyTitle}>SOS</Text>
                  <Text style={styles.emergencySubtitle}>Emergencia</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Indicador de progreso textual */}
          {isHolding && (
            <Text style={styles.progressText}>
              {Math.round(progress * 100)}%
            </Text>
          )}
        </View>

        {/* Advertencia */}
        <View style={styles.warningBox}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Para emergencias críticas,{'\n'}llama directamente al 911
          </Text>
        </View>
      </View>

      {/* Modal de tipos */}
      <Modal
        visible={showTypeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tipo de Emergencia</Text>
            <Text style={styles.modalSubtitle}>Selecciona el tipo de reporte</Text>

            <View style={styles.typeGrid}>
              {EMERGENCY_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.typeCard, { borderColor: type.color }]}
                  onPress={() => handleTypeSelected(type)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.typeIcon}>{type.icon}</Text>
                  <Text style={styles.typeName}>{type.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowTypeModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Loading */}
      {isCreatingReport && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#dc3545" />
            <Text style={styles.loadingText}>Enviando reporte...</Text>
          </View>
        </View>
      )}
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  locationIndicator: {
    fontSize: 11,
    color: '#28a745',
    marginTop: 4,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  instruction: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
    fontWeight: '500',
  },
  emergencyButton: {
    width: 280,
    height: 280,
    backgroundColor: '#dc3545',
    borderRadius: 140,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#dc3545',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
    position: 'relative',
  },
  progressRing: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 8,
    borderColor: 'transparent',
    borderTopColor: '#fff',
    borderRightColor: '#fff',
  },
  progressSegment: {
    width: '100%',
    height: '100%',
  },
  buttonContent: {
    alignItems: 'center',
  },
  emergencyIcon: {
    fontSize: 80,
    marginBottom: 12,
  },
  emergencyTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  emergencySubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  progressText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    marginTop: 24,
  },
  warningBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffc107',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  warningIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  typeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  typeIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  typeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginTop: 16,
    fontWeight: '500',
  },
});
