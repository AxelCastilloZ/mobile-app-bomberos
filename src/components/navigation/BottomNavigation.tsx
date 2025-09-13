import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface BottomNavigationProps {
  isLoggedIn: boolean;
  onNavigate: (screen: string) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  isLoggedIn,
  onNavigate,
}) => {
  const navigationItems = [
    {
      key: 'home',
      icon: 'home',
      label: 'Inicio',
      color: '#D32F2F',
    },
    {
      key: 'reports-public',
      icon: 'map-marker-alert',
      label: 'Reportes',
      color: '#FF8800',
    },
    {
      key: 'reports-admin',
      icon: 'shield-account',
      label: 'Admin',
      color: '#2196F3',
    },
    {
      key: 'login',
      icon: isLoggedIn ? 'logout' : 'login',
      label: isLoggedIn ? 'Salir' : 'Login',
      color: isLoggedIn ? '#F44336' : '#4CAF50',
    },
  ];

  return (
    <View style={styles.container}>
      {navigationItems.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={styles.navItem}
          onPress={() => onNavigate(item.key)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={item.icon as any}
            size={24}
            color={item.color}
          />
          <Text style={[styles.navLabel, { color: item.color }]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});