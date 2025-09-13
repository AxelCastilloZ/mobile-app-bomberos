
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

import { useAuth } from '../../hooks/useAuth';
import { TabNavigator } from './TabNavigator';
import { EmergencyScreen } from '../../screens/EmergencyScreen';
import { LoginScreen } from '../../screens/LoginScreen';


export type RootStackParamList = {
  Main: undefined;
  Emergency: undefined;
  Login: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { isLoading } = useAuth();


  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D32F2F" />
        <Text style={styles.loadingText}>Inicializando aplicación...</Text>
        <Text style={styles.loadingSubtext}>
          Verificando conectividad y sesión
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Navegación principal con tabs */}
        <Stack.Screen 
          name="Main" 
          component={TabNavigator}
        />
        
        {/* Pantalla de emergencia como modal */}
        <Stack.Screen 
          name="Emergency" 
          component={EmergencyScreen}
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'Reporte de Emergencia',
            headerStyle: {
              backgroundColor: '#D32F2F',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        
        {/* Pantalla de login como modal */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
});