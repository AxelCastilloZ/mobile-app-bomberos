// src/screens/LoginScreen.tsx - Actualizado para Expo Router
import React from 'react';
import { router } from 'expo-router';
import { LoginModal } from '../components/auth/LoginModal';

export const LoginScreen: React.FC = () => {
  const handleDismiss = () => {
    router.back();
  };

  const handleLoginSuccess = () => {
    router.back();
  };

  return (
    <LoginModal
      visible={true}
      onDismiss={handleDismiss}
      onLoginSuccess={handleLoginSuccess}
    />
  );
};