
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Button, Card, ActivityIndicator, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';

import { useLocation } from '../hooks/useLocation';
import { emergencyService } from '../services/emergency.service';
import { EMERGENCY_TYPES } from '../utils/constants';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;


const NOSARA_REGION: Region = {
  latitude: 9.9762,
  longitude: -85.6532,
  latitudeDelta: LATITUDE_DELTA,
  longitudeDelta: LONGITUDE_DELTA,
};


interface EmergencyReport {
  id: string;
  type: string;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: Date;
  status?: string;
  priority?: string;
}

export const MapScreen: React.FC = () => {
  const { location, isLoading: locationLoading, refreshLocation } = useLocation();
  const [emergencies, setEmergencies] = useState<EmergencyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyReport | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>(NOSARA_REGION);

  useEffect(() => {
    loadEmergencies();
    
   
    if (location) {
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    }
  }, [location]);

  const loadEmergencies = async () => {
    try {
      setLoading(true);
      const reports = await emergencyService.getPublicReports();
      
      
      const validReports: EmergencyReport[] = reports
        .filter(report => 
          report.location && 
          report.location.latitude && 
          report.location.longitude &&
          typeof report.location.latitude === 'number' &&
          typeof report.location.longitude === 'number'
        )
        .map(report => ({
          id: report.id || `${Date.now()}_${Math.random()}`,
          type: report.type || 'unknown',
          location: {
            latitude: report.location!.latitude,
            longitude: report.location!.longitude,
          },
          timestamp: typeof report.timestamp === 'string' ? new Date(report.timestamp) : report.timestamp,
          status: report.status,
          priority: report.priority,
        }));
      
      setEmergencies(validReports);
    } catch (error) {
      console.error('Error cargando emergencias en mapa:', error);
      setEmergencies([]);
    } finally {
      setLoading(false);
    }
  };

  const getEmergencyTypeInfo = (typeId: string) => {
    return EMERGENCY_TYPES.find(t => t.id === typeId) || {
      label: typeId || 'Desconocido',
      icon: 'alert',
      color: '#666'
    };
  };

  const getMarkerColor = (emergency: EmergencyReport) => {
    const typeInfo = getEmergencyTypeInfo(emergency.type);
    
   
    switch (emergency.status) {
      case 'resolved':
        return '#4CAF50'; 
      case 'in_progress':
        return '#FF9800'; 
      case 'acknowledged':
        return '#2196F3'; 
      default:
        return typeInfo.color; 
    }
  };

  const centerOnUserLocation = () => {
    if (location) {
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: LATITUDE_DELTA / 4, 
        longitudeDelta: LONGITUDE_DELTA / 4,
      });
    } else {
      refreshLocation();
    }
  };

  const centerOnNosara = () => {
    setMapRegion(NOSARA_REGION);
  };

  const handleMarkerPress = (emergency: EmergencyReport) => {
    setSelectedEmergency(emergency);
  };

  const closeEmergencyDetail = () => {
    setSelectedEmergency(null);
  };

  if (loading && emergencies.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D32F2F" />
        <Text style={styles.loadingText}>Cargando mapa de emergencias...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Mapa */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
      >
        {/* Marcadores de emergencias */}
        {emergencies.map((emergency) => {
          const typeInfo = getEmergencyTypeInfo(emergency.type);
          const markerColor = getMarkerColor(emergency);
          
          return (
            <Marker
              key={emergency.id}
              coordinate={{
                latitude: emergency.location.latitude,
                longitude: emergency.location.longitude,
              }}
              title={typeInfo.label}
              description={`Estado: ${emergency.status || 'Pendiente'}`}
              pinColor={markerColor}
              onPress={() => handleMarkerPress(emergency)}
            >
              <View style={[styles.customMarker, { backgroundColor: markerColor }]}>
                <MaterialCommunityIcons 
                  name={typeInfo.icon as any} 
                  size={20} 
                  color="#FFFFFF" 
                />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Controles del mapa */}
      <View style={styles.mapControls}>
        <Button
          mode="contained"
          icon="crosshairs-gps"
          onPress={centerOnUserLocation}
          style={styles.controlButton}
          disabled={locationLoading}
          loading={locationLoading}
        >
          Mi Ubicación
        </Button>
        
        <Button
          mode="outlined"
          icon="map-marker"
          onPress={centerOnNosara}
          style={styles.controlButton}
        >
          Nosara
        </Button>
        
        <Button
          mode="outlined"
          icon="refresh"
          onPress={loadEmergencies}
          style={styles.controlButton}
          loading={loading}
        >
          Actualizar
        </Button>
      </View>

      {/* Información de emergencias activas */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          Emergencias activas: {emergencies.filter(e => e.status !== 'resolved').length}
        </Text>
        <Text style={styles.statsText}>
          Total en mapa: {emergencies.length}
        </Text>
      </View>

      {/* Modal de detalle de emergencia */}
      {selectedEmergency && (
        <View style={styles.emergencyDetail}>
          <Card style={styles.detailCard}>
            <Card.Content>
              <View style={styles.detailHeader}>
                <View style={styles.emergencyInfo}>
                  <MaterialCommunityIcons 
                    name={getEmergencyTypeInfo(selectedEmergency.type).icon as any}
                    size={24}
                    color={getMarkerColor(selectedEmergency)}
                  />
                  <Text variant="titleMedium" style={styles.emergencyTitle}>
                    {getEmergencyTypeInfo(selectedEmergency.type).label}
                  </Text>
                </View>
                
                <Button
                  mode="text"
                  icon="close"
                  onPress={closeEmergencyDetail}
                  compact
                >
                  Cerrar
                </Button>
              </View>

              <View style={styles.detailContent}>
                {selectedEmergency.status && (
                  <Chip 
                    mode="flat" 
                    style={[styles.statusChip, { backgroundColor: `${getMarkerColor(selectedEmergency)}20` }]}
                    textStyle={{ color: getMarkerColor(selectedEmergency) }}
                  >
                    {selectedEmergency.status}
                  </Chip>
                )}

                <Text variant="bodySmall" style={styles.detailText}>
                  📅 {new Date(selectedEmergency.timestamp).toLocaleString()}
                </Text>
                
                <Text variant="bodySmall" style={styles.detailText}>
                  📍 {selectedEmergency.location.latitude.toFixed(6)}, {selectedEmergency.location.longitude.toFixed(6)}
                </Text>

                {selectedEmergency.priority && (
                  <Text variant="bodySmall" style={styles.detailText}>
                    🚨 Prioridad: {selectedEmergency.priority}
                  </Text>
                )}
              </View>
            </Card.Content>
          </Card>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  mapControls: {
    position: 'absolute',
    top: 50,
    right: 16,
    gap: 8,
  },
  controlButton: {
    minWidth: 120,
  },
  statsContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 8,
    elevation: 4,
  },
  statsText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  emergencyDetail: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  detailCard: {
    elevation: 8,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  emergencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emergencyTitle: {
    fontWeight: 'bold',
  },
  detailContent: {
    gap: 8,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  detailText: {
    color: '#666',
  },
});