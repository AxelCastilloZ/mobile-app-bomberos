import { useAuthStore } from '@/store/authStore';
import { Tabs, useRouter } from 'expo-router';
import { Text } from 'react-native';

export default function TabsLayout() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#dc3545',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reportes',
          tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
      {/* Informes oculto del navbar - se accede desde el perfil */}
      <Tabs.Screen
        name="informes"
        options={{
          href: null, // Ocultar del navbar
        }}
      />
    </Tabs>
  );
}

function TabBarIcon({ name, color }: { name: string; color: string }) {
  const icons: Record<string, string> = {
    home: '🏠',
    list: '📋',
    chart: '📊',
    user: '👤',
  };

  return <Text style={{ fontSize: 24 }}>{icons[name] || '•'}</Text>;
}
