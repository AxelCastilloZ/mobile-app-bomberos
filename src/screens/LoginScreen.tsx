
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { LoginModal } from '../components/auth/LoginModal';
import type { RootStackNavigationProp } from '../types/navigation.types';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();

  const handleDismiss = () => {
    navigation.goBack();
  };

  const handleLoginSuccess = () => {
    navigation.goBack();
  };

  return (
    <LoginModal
      visible={true}
      onDismiss={handleDismiss}
      onLoginSuccess={handleLoginSuccess}
    />
  );
};