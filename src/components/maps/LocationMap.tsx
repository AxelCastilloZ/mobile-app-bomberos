import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useMapNavigation } from '../../hooks/useMapNavigation';
import { Coordinates } from '../../types/location';

interface LocationMapProps {
  coordinates: Coordinates;
  title?: string;
  description?: string;
  showNavigationButton?: boolean;
  height?: number;
}

export default function LocationMap({
  coordinates,
  title = 'Ubicación',
  description,
  showNavigationButton = true,
  height = 300,
}: LocationMapProps) {
  const { showNavigationOptions } = useMapNavigation();

  const region = {
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    latitudeDelta: 0.01, // Zoom level
    longitudeDelta: 0.01,
  };

  const handleNavigate = () => {
    showNavigationOptions(coordinates, title);
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={[styles.map, { height }]}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton
      >
        <Marker
          coordinate={{
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
          }}
          title={title}
          description={description}
          pinColor="red"
        />
      </MapView>

      {showNavigationButton && (
        <TouchableOpacity
          style={styles.navigationButton}
          onPress={handleNavigate}
          activeOpacity={0.8}
        >
          <Text style={styles.navigationButtonText}>🧭 Navegar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  map: {
    width: '100%',
    borderRadius: 12,
  },
  navigationButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  navigationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
