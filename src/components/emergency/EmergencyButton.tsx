import React, { useState, useRef } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PRESS_DURATION } from '../../utils/constants';

interface EmergencyButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

export const EmergencyButton: React.FC<EmergencyButtonProps> = ({ 
  onPress, 
  disabled = false 
}) => {
  const [pressing, setPressing] = useState(false);
  const pressAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  const startPress = () => {
    if (disabled) return;
    
    setPressing(true);
    
    // Animación de escala
    Animated.spring(scaleAnimation, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();

    // Animación de progreso circular
    Animated.timing(pressAnimation, {
      toValue: 1,
      duration: PRESS_DURATION,
      useNativeDriver: false,
    }).start();

    // Timer para activar la acción
    pressTimer.current = setTimeout(() => {
      onPress();
      resetAnimation();
    }, PRESS_DURATION);
  };

  const endPress = () => {
    if (!pressing) return;
    
    resetAnimation();
  };

  const resetAnimation = () => {
    setPressing(false);
    
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }

    // Reset animaciones
    Animated.parallel([
      Animated.spring(scaleAnimation, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(pressAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      })
    ]).start();
  };

  const progressRotation = pressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.buttonContainer,
          { transform: [{ scale: scaleAnimation }] }
        ]}
      >
        {/* Círculo de progreso */}
        {pressing && (
          <Animated.View
            style={[
              styles.progressCircle,
              {
                transform: [{ rotate: progressRotation }],
              },
            ]}
          >
            <View style={styles.progressIndicator} />
          </Animated.View>
        )}

        <Pressable
          style={[
            styles.button,
            disabled && styles.buttonDisabled,
            pressing && styles.buttonPressing
          ]}
          onPressIn={startPress}
          onPressOut={endPress}
          disabled={disabled}
        >
          <MaterialCommunityIcons 
            name="fire-truck" 
            size={80} 
            color={disabled ? '#CCCCCC' : '#FFFFFF'} 
          />
          <Text style={[
            styles.buttonText,
            disabled && styles.buttonTextDisabled
          ]}>
            EMERGENCIA
          </Text>
        </Pressable>
      </Animated.View>

      <Text style={styles.instructionText}>
        {pressing 
          ? 'Mantén presionado para activar...'
          : `Mantén presionado ${PRESS_DURATION/1000} segundos`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: '#FF1744',
    zIndex: 1,
  },
  progressIndicator: {
    width: 8,
    height: 8,
    backgroundColor: '#FF1744',
    borderRadius: 4,
    position: 'absolute',
    top: -6,
    left: '50%',
    marginLeft: -4,
  },
  button: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
    elevation: 2,
    shadowOpacity: 0.1,
  },
  buttonPressing: {
    backgroundColor: '#B71C1C',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  buttonTextDisabled: {
    color: '#999999',
  },
  instructionText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});