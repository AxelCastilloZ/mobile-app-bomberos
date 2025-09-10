import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, IconButton, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface BottomNavigationProps {
  isLoggedIn: boolean;
  onNavigate: (screen: string) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  isLoggedIn, 
  onNavigate 
}) => {
  return (
    <Surface style={styles.bottomNavigation} elevation={4}>
      <View style={styles.navContainer}>
        <View style={styles.navItem}>
          <IconButton
            icon="home"
            size={28}
            iconColor="#FFFFFF"
            onPress={() => onNavigate('home')}
            style={styles.navButton}
          />
          <Text variant="bodySmall" style={styles.navLabel}>
            Inicio
          </Text>
        </View>

        <View style={styles.navItem}>
          <IconButton
            icon="clipboard-list"
            size={28}
            iconColor="#FFFFFF"
            onPress={() => onNavigate('reports-public')}
            style={styles.navButton}
          />
          <Text variant="bodySmall" style={styles.navLabel}>
            Reportes
          </Text>
        </View>

        <View style={styles.navItem}>
          <IconButton
            icon="file-document-outline"
            size={28}
            iconColor={isLoggedIn ? "#FFFFFF" : "#FFFFFF80"}
            onPress={() => onNavigate('reports-admin')}
            style={[styles.navButton, !isLoggedIn && styles.disabledButton]}
          />
          <Text variant="bodySmall" style={[
            styles.navLabel,
            { opacity: isLoggedIn ? 1 : 0.5 }
          ]}>
            Informes
          </Text>
          {!isLoggedIn && (
            <MaterialCommunityIcons 
              name="lock" 
              size={14} 
              color="#FFFFFF" 
              style={styles.lockIcon}
            />
          )}
        </View>

        <View style={styles.navItem}>
          <IconButton
            icon={isLoggedIn ? "account-check" : "account-outline"}
            size={28}
            iconColor="#FFFFFF"
            onPress={() => onNavigate('login')}
            style={styles.navButton}
          />
          <Text variant="bodySmall" style={styles.navLabel}>
            {isLoggedIn ? 'Bombero' : 'Login'}
          </Text>
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  bottomNavigation: {
    backgroundColor: '#D32F2F',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    position: 'relative',
    flex: 1,
  },
  navButton: {
    margin: 0,
  },
  navLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: -4,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.5,
  },
  lockIcon: {
    position: 'absolute',
    top: 4,
    right: '30%',
  },
});