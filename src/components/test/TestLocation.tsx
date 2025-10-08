import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocation } from '../../hooks/useLocation';
import { useMapNavigation } from '../../hooks/useMapNavigation';
// import LocationMap from '../maps/LocationMap'; // Comentado hasta hacer dev build

export default function TestLocation() {
  const {
    currentLocation,
    isLoading,
    isEnabled,
    hasPermission,
    permissionStatus,
    isWatching,
    error,
    lastUpdate,
    requestPermission,
    getCurrentLocation,
    startWatching,
    stopWatching,
    openSettings,
    refresh,
    formatDistance,
  } = useLocation();

  const { showNavigationOptions } = useMapNavigation();

  // Coordenadas de ejemplo para calcular distancia (centro de Nosara)
  const NOSARA_CENTER = {
    latitude: 9.9819,
    longitude: -85.6531,
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    Alert.alert(
      'Permisos',
      granted ? '✅ Permisos otorgados' : '❌ Permisos denegados'
    );
  };

  const handleGetLocation = async () => {
    const location = await getCurrentLocation();
    if (location) {
      Alert.alert('✅ Ubicación obtenida', 'Revisa los detalles abajo');
    }
  };

  const handleToggleWatching = async () => {
    if (isWatching) {
      await stopWatching();
      Alert.alert('🛑 Seguimiento detenido');
    } else {
      await startWatching();
      Alert.alert('▶️ Seguimiento iniciado', 'La ubicación se actualizará automáticamente');
    }
  };

  const renderStatusBadge = (label: string, value: boolean, color: string) => (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{label}: {value ? '✅' : '❌'}</Text>
    </View>
  );

  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleTimeString('es-CR');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🧪 Test de Geolocalización</Text>

      {/* Estado del Servicio */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Estado del Servicio</Text>

        <View style={styles.badgeContainer}>
          {renderStatusBadge('GPS Habilitado', isEnabled, isEnabled ? '#10b981' : '#ef4444')}
          {renderStatusBadge('Permisos', hasPermission, hasPermission ? '#10b981' : '#ef4444')}
          {renderStatusBadge('Seguimiento', isWatching, isWatching ? '#3b82f6' : '#6b7280')}
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Estado de permisos:</Text>
          <Text style={styles.value}>{permissionStatus}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Última actualización:</Text>
          <Text style={styles.value}>{formatTimestamp(lastUpdate)}</Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>❌ {error}</Text>
          </View>
        )}
      </View>

      {/* Controles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎛️ Controles</Text>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleRequestPermission}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {hasPermission ? '✅ Permisos otorgados' : '🔐 Solicitar Permisos'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.successButton]}
          onPress={handleGetLocation}
          disabled={isLoading || !hasPermission}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '⏳ Obteniendo...' : '📍 Obtener Ubicación Actual'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, isWatching ? styles.dangerButton : styles.infoButton]}
          onPress={handleToggleWatching}
          disabled={isLoading || !hasPermission}
        >
          <Text style={styles.buttonText}>
            {isWatching ? '🛑 Detener Seguimiento' : '▶️ Iniciar Seguimiento'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={refresh}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>🔄 Refrescar Estado</Text>
        </TouchableOpacity>

        {!isEnabled && (
          <TouchableOpacity
            style={[styles.button, styles.warningButton]}
            onPress={openSettings}
          >
            <Text style={styles.buttonText}>⚙️ Abrir Configuración GPS</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Navegación Externa */}
      {currentLocation && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧭 Navegación</Text>
          <TouchableOpacity
            style={[styles.button, styles.navigationButton]}
            onPress={() => showNavigationOptions(
              currentLocation.coordinates,
              currentLocation.address?.formatted || 'Mi ubicación'
            )}
          >
            <Text style={styles.buttonText}>📍 Abrir en Google Maps / Waze</Text>
          </TouchableOpacity>
          <Text style={styles.infoText}>
            Abrirá las apps de navegación instaladas en tu dispositivo
          </Text>
        </View>
      )}

      {/* Mapa - Comentado hasta hacer dev build */}
      {/* {currentLocation && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗺️ Mapa</Text>
          <LocationMap
            coordinates={currentLocation.coordinates}
            title="Mi ubicación actual"
            description={currentLocation.address?.formatted}
            height={250}
          />
        </View>
      )} */}

      {/* Datos de Ubicación */}
      {currentLocation && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Ubicación Actual</Text>

          <View style={styles.dataBox}>
            <Text style={styles.dataTitle}>Coordenadas</Text>
            <Text style={styles.dataValue}>
              Lat: {currentLocation.coordinates.latitude.toFixed(6)}
            </Text>
            <Text style={styles.dataValue}>
              Lng: {currentLocation.coordinates.longitude.toFixed(6)}
            </Text>
            {currentLocation.coordinates.altitude && (
              <Text style={styles.dataValue}>
                Alt: {currentLocation.coordinates.altitude.toFixed(1)}m
              </Text>
            )}
            {currentLocation.coordinates.accuracy && (
              <Text style={styles.dataValue}>
                Precisión: ±{currentLocation.coordinates.accuracy.toFixed(1)}m
              </Text>
            )}
          </View>

          {currentLocation.address && (
            <View style={styles.dataBox}>
              <Text style={styles.dataTitle}>Dirección</Text>
              {currentLocation.address.formatted && (
                <Text style={styles.dataValue}>{currentLocation.address.formatted}</Text>
              )}
              {currentLocation.address.street && (
                <Text style={styles.dataValue}>Calle: {currentLocation.address.street}</Text>
              )}
              {currentLocation.address.city && (
                <Text style={styles.dataValue}>Ciudad: {currentLocation.address.city}</Text>
              )}
              {currentLocation.address.region && (
                <Text style={styles.dataValue}>Región: {currentLocation.address.region}</Text>
              )}
              {currentLocation.address.country && (
                <Text style={styles.dataValue}>País: {currentLocation.address.country}</Text>
              )}
            </View>
          )}

          <View style={styles.dataBox}>
            <Text style={styles.dataTitle}>Distancia al centro de Nosara</Text>
            <Text style={styles.dataValue}>
              {formatDistance(NOSARA_CENTER.latitude, NOSARA_CENTER.longitude) || 'N/A'}
            </Text>
          </View>
        </View>
      )}

      {/* Instrucciones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📖 Instrucciones</Text>
        <Text style={styles.instruction}>1. Solicita permisos de ubicación</Text>
        <Text style={styles.instruction}>2. Obtén tu ubicación actual</Text>
        <Text style={styles.instruction}>3. Opcional: Inicia seguimiento para ver actualizaciones automáticas</Text>
        <Text style={styles.instruction}>4. Verifica que se muestre la dirección</Text>
        <Text style={styles.instruction}>5. Revisa la distancia al centro de Nosara</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
  },
  value: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 14,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  successButton: {
    backgroundColor: '#10b981',
  },
  dangerButton: {
    backgroundColor: '#ef4444',
  },
  infoButton: {
    backgroundColor: '#6366f1',
  },
  secondaryButton: {
    backgroundColor: '#6b7280',
  },
  warningButton: {
    backgroundColor: '#f59e0b',
  },
  navigationButton: {
    backgroundColor: '#2563eb',
  },
  infoText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dataBox: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  dataTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  dataValue: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  instruction: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 6,
  },
});
