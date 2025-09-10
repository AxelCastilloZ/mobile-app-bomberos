import React, { useState } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { Dialog, Portal, TextInput, Button, Text } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';

interface LoginModalProps {
  visible: boolean;
  onDismiss: () => void;
  onLoginSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ 
  visible, 
  onDismiss, 
  onLoginSuccess 
}) => {
  const { login, isLoading, clearError } = useAuth();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  const handleLogin = async () => {
    console.log('🔵 LoginModal: handleLogin iniciado');
    console.log('📝 LoginModal: Estado actual de credentials:', credentials);
    console.log('📝 LoginModal: Credenciales que VOY A ENVIAR:', {
      username: credentials.username.trim(),
      password: '***masked***',
      passwordLength: credentials.password?.length,
      originalUsername: credentials.username // sin trim
    });

    if (!credentials.username.trim() || !credentials.password) {
      console.log('❌ LoginModal: Validación fallida - campos vacíos');
      Alert.alert('Error', 'Por favor ingresa usuario y contraseña');
      return;
    }

    try {
      console.log('🚀 LoginModal: Iniciando proceso de login...');
      clearError();
      
      const loginData = {
        username: credentials.username.trim(),
        password: credentials.password
      };
      
      console.log('📡 LoginModal: Objeto que se pasa a login():', {
        username: loginData.username,
        passwordLength: loginData.password.length
      });
      
      await login(loginData);
      
      console.log('✅ LoginModal: Login exitoso');
      
      // Limpiar formulario
      setCredentials({ username: '', password: '' });
      
      Alert.alert(
        'Login Exitoso', 
        'Bienvenido al sistema',
        [{ text: 'Continuar', onPress: onLoginSuccess }]
      );
    } catch (error) {
      console.log('💥 LoginModal: Error capturado:', error);
      const errorMessage = error instanceof Error ? error.message : 'Credenciales incorrectas';
      Alert.alert('Error de Login', errorMessage);
    }
  };

  const handleCancel = () => {
    console.log('🔴 LoginModal: Cancelando login');
    setCredentials({ username: '', password: '' });
    clearError();
    onDismiss();
  };

  console.log('🎭 LoginModal: Renderizando - visible:', visible, 'credentials:', {
    username: credentials.username,
    passwordLength: credentials.password.length
  });

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleCancel}>
        <Dialog.Title>Acceso de Personal</Dialog.Title>
        
        <Dialog.Content>
          <TextInput
            label="Usuario o Email"
            value={credentials.username}
            onChangeText={(text) => {
              console.log('📝 LoginModal: Username cambió a:', text);
              setCredentials(prev => ({ ...prev, username: text }));
            }}
            mode="outlined"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={styles.input}
            disabled={isLoading}
          />
          
          <TextInput
            label="Contraseña"
            value={credentials.password}
            onChangeText={(text) => {
              console.log('📝 LoginModal: Password cambió, length:', text.length);
              setCredentials(prev => ({ ...prev, password: text }));
            }}
            mode="outlined"
            secureTextEntry
            style={styles.input}
            disabled={isLoading}
          />
          
          <Text style={styles.infoText}>
            Solo personal autorizado puede acceder a las funciones administrativas
          </Text>
        </Dialog.Content>
        
        <Dialog.Actions>
          <Button 
            onPress={handleCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          
          <Button 
            mode="contained"
            onPress={() => {
              console.log('🔘 LoginModal: Botón Ingresar presionado');
              console.log('🔘 LoginModal: Credentials justo antes de handleLogin:', credentials);
              handleLogin();
            }}
            disabled={isLoading || !credentials.username.trim() || !credentials.password}
            loading={isLoading}
          >
            Ingresar
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  input: {
    marginBottom: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
});