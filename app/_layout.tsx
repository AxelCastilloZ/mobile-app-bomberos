import { Stack } from 'expo-router';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { theme } from '../src/utils/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style="light" backgroundColor={theme.colors.primary} />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: '#F5F5F5' },
            gestureEnabled: Platform.OS === 'ios',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="login"
            options={{
              presentation: 'fullScreenModal',
              headerShown: true,
              headerTitle: 'Iniciar Sesión',
              headerTitleStyle: { color: theme.colors.primary },
              contentStyle: { backgroundColor: '#FFFFFF' },
            }}
          />
          <Stack.Screen
            name="emergency"
            options={{
              presentation: 'fullScreenModal',
              headerShown: true,
              headerTitle: 'Reporte de Emergencia',
              headerTitleStyle: { color: '#FFFFFF' },
              headerStyle: { backgroundColor: '#D32F2F' },
              headerTintColor: '#FFFFFF',
              contentStyle: { backgroundColor: '#FFFFFF' },
            }}
          />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
