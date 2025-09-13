
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';


import { HomeScreen } from '../../screens/HomeScreen';
import { ReportsScreen } from '../../screens/ReportsScreen';
import { AdminScreen } from '../../screens/AdminScreen';
import { MapScreen } from '../../screens/MapScreen';
import { ProfileScreen } from '../../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export const TabNavigator: React.FC = () => {
  const { hasAdminAccess } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Reports':
              iconName = 'map-marker-alert';
              break;
            case 'Map':
              iconName = 'map';
              break;
            case 'Admin':
              iconName = 'shield-account';
              break;
            case 'Profile':
              iconName = 'account';
              break;
            default:
              iconName = 'help-circle';
          }

          return (
            <MaterialCommunityIcons 
              name={iconName as any} 
              size={size} 
              color={color} 
            />
          );
        },
        tabBarActiveTintColor: '#D32F2F',
        tabBarInactiveTintColor: '#757575',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Inicio' }}
      />
      
      <Tab.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{ title: 'Reportes' }}
      />
      
      <Tab.Screen 
        name="Map" 
        component={MapScreen}
        options={{ title: 'Mapa' }}
      />
      
      {hasAdminAccess() && (
        <Tab.Screen 
          name="Admin" 
          component={AdminScreen}
          options={{ title: 'Admin' }}
        />
      )}
      
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
};