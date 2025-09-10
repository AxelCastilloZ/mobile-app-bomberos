import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button, Card, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onCancel }) => {
  const { login, isLoading, error, clearError } = useAuth();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  const handleLogin = async () => {
    if (!credentials.username || !credentials.password) {
      Alert.alert('Error', 'Por favor ingresa usuario y contraseña');
      return;
    }

    try {
      clearError();
      await login({
        username: credentials.username.trim(),
        password: credentials.password
      });
      
      Alert.alert(
        'Login Exitoso', 
        'Bienvenido al sistema de emergencias',
        [{ text: 'Continuar', onPress: onLoginSuccess }]
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error de autenticación';
      Alert.alert('Error de Login', errorMessage);
    }
  };

  const handleUsernameChange = (text: string) => {
    setCredentials(prev => ({ ...prev, username: text }));
    if (error) clearError();
  };

  const handlePasswordChange = (text: string) => {
    setCredentials(prev => ({ ...prev, password: text }));
    if (error) clearError();
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <MaterialCommunityIcons name="shield-account" size={48} color="#D32F2F" />
            <Text style={styles.title}>Acceso de Personal</Text>
            <Text style={styles.subtitle}>Sistema de Emergencias Bomberos Nosara</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Usuario o Email"
              value={credentials.username}
              onChangeText={handleUsernameChange}
              mode="outlined"
              left={<TextInput.Icon icon="account" />}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              style={styles.input}
              error={!!error}
            />

            <TextInput
              label="Contraseña"
              value={credentials.password}
              onChangeText={handlePasswordChange}
              mode="outlined"
              left={<TextInput.Icon icon="lock" />}
              secureTextEntry
              style={styles.input}
              error={!!error}
            />

            {error && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={20} color="#D32F2F" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={onCancel}
              style={styles.cancelButton}
              disabled={isLoading}
            >
              Cancelar
            </Button>

            <Button
              mode="contained"
              onPress={handleLogin}
              style={styles.loginButton}
              disabled={isLoading || !credentials.username || !credentials.password}
              loading={isLoading}
            >
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </View>

          <View style={styles.info}>
            <Text style={styles.infoText}>
              Solo personal autorizado puede acceder a las funciones administrativas
            </Text>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  card: {
    elevation: 8,
    borderRadius: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  form: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    color: '#D32F2F',
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  loginButton: {
    flex: 1,
    backgroundColor: '#D32F2F',
  },
  info: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
});