import React, { useRef, useEffect, useState } from 'react';
import { View, TouchableWithoutFeedback, Animated, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface EmergencyButtonProps {
  onPress: () => void;
  holdDuration?: number;
}

export const EmergencyButton: React.FC<EmergencyButtonProps> = ({ 
  onPress, 
  holdDuration = 3000 
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    // Subtle rotation animation
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    );

    if (!isHolding) {
      pulseAnimation.start();
    } else {
      pulseAnimation.stop();
    }
    
    rotateAnimation.start();

    return () => {
      pulseAnimation.stop();
      rotateAnimation.stop();
    };
  }, [pulseAnim, rotateAnim, isHolding]);

  const startHold = () => {
    console.log('Iniciando hold...');
    setIsHolding(true);
    setProgress(0);
    
    
    try {
      if (Haptics.impactAsync) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.log('Haptics no disponible');
    }

    
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 150,
      useNativeDriver: true,
    }).start();

    
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: holdDuration,
      useNativeDriver: false, 
    }).start();

   
    const startTime = Date.now();
    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(elapsed / holdDuration, 1);
      setProgress(newProgress);
    }, 50);

    
    holdTimerRef.current = setTimeout(() => {
      completeHold();
    }, holdDuration);
  };

  const cancelHold = () => {
    console.log('Cancelando hold...');
    setIsHolding(false);
    setProgress(0);

   
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      })
    ]).start();
  };

  const completeHold = () => {
    console.log('Completando hold...');
    
    
    try {
      if (Haptics.notificationAsync) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.log('Haptics no disponible');
    }

    
    setIsHolding(false);
    setProgress(0);

    
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      })
    ]).start();

    
    onPress();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  
  const progressAngle = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {}
      <View style={styles.outerRing} />
      
      {}
      <Animated.View 
        style={[
          styles.middleRing,
          {
            transform: [{ rotate }]
          }
        ]}
      />
      
      {}
      {isHolding && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground} />
          <View style={styles.progressBarContainer}>
            <Animated.View 
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                }
              ]} 
            />
          </View>
        </View>
      )}
      
      {}
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            transform: [
              { scale: isHolding ? scaleAnim : pulseAnim }
            ]
          }
        ]}
      >
        <TouchableWithoutFeedback
          onPressIn={startHold}
          onPressOut={cancelHold}
        >
          <View
            style={[
              styles.button,
              isHolding && styles.buttonHolding
            ]}
          >
            <MaterialCommunityIcons 
              name="fire" 
              size={60} 
              color="#FFFFFF" 
            />
            <Text style={styles.buttonText}>
              {isHolding ? 'MANTENGA PRESIONADO...' : 'EMERGENCIA'}
            </Text>
            {isHolding && (
              <Text style={styles.progressText}>
                {Math.round(progress * 100)}%
              </Text>
            )}
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Instruction text */}
      <Text style={styles.instructionText}>
        {isHolding ? 
          `Mantenga presionado ${Math.ceil((holdDuration - progress * holdDuration) / 1000)}s más` :
          `Mantenga presionado por ${holdDuration / 1000} segundos`
        }
      </Text>
    </View>
  );
};

const { width } = Dimensions.get('window');
const buttonSize = Math.min(width * 0.6, 250);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: buttonSize + 100,
    width: buttonSize + 60,
  },
  outerRing: {
    position: 'absolute',
    width: buttonSize + 40,
    height: buttonSize + 40,
    borderRadius: (buttonSize + 40) / 2,
    borderWidth: 2,
    borderColor: '#FFCDD2',
    backgroundColor: 'transparent',
  },
  middleRing: {
    position: 'absolute',
    width: buttonSize + 20,
    height: buttonSize + 20,
    borderRadius: (buttonSize + 20) / 2,
    borderWidth: 1,
    borderColor: '#EF5350',
    backgroundColor: 'transparent',
  },
  progressContainer: {
    position: 'absolute',
    width: buttonSize + 30,
    height: buttonSize + 30,
    borderRadius: (buttonSize + 30) / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: (buttonSize + 30) / 2,
    borderWidth: 4,
    borderColor: '#FFCDD2',
    backgroundColor: 'transparent',
  },
  progressBarContainer: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: buttonSize + 34,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFCDD2',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  buttonContainer: {
    width: buttonSize,
    height: buttonSize,
    borderRadius: buttonSize / 2,
  },
  button: {
    width: '100%',
    height: '100%',
    borderRadius: buttonSize / 2,
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
    shadowRadius: 4.65,
  },
  buttonHolding: {
    backgroundColor: '#B71C1C', 
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.9,
  },
  instructionText: {
    position: 'absolute',
    bottom: 0,
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
});