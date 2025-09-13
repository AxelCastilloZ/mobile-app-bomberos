// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      // Usa screenLayout para aplicar un fondo global a todas las tabs
      screenLayout={(props) => (
        <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>{props.children}</View>
      )}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#D32F2F',
        tabBarInactiveTintColor: '#9E9E9E',
        tabBarLabelStyle: { fontSize: 12 },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E0E0E0',
          height: Platform.OS === 'ios' ? 60 + insets.bottom : 60,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen name="index"   options={{ title: 'Inicio' }} />
      <Tabs.Screen name="reports" options={{ title: 'Reportes' }} />
      <Tabs.Screen name="map"     options={{ title: 'Mapa' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
      <Tabs.Screen name="admin"   options={{ title: 'Admin' }} />
    </Tabs>
  );
}
