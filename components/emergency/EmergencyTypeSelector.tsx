import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EMERGENCY_TYPES } from '../../utils/constants';

interface EmergencyTypeSelectorProps {
  onTypeSelect: (type: typeof EMERGENCY_TYPES[0]) => void;
  onCancel: () => void;
}

export const EmergencyTypeSelector: React.FC<EmergencyTypeSelectorProps> = ({
  onTypeSelect,
  onCancel,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="alert" size={40} color="#FF1744" />
        <Text variant="headlineMedium" style={styles.title}>
          Tipo de Emergencia
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Selecciona el tipo específico:
        </Text>
      </View>

      <View style={styles.emergencyGrid}>
        {EMERGENCY_TYPES.map((type) => (
          <Card 
            key={type.id} 
            style={[styles.emergencyCard, { borderColor: type.color }]}
            onPress={() => onTypeSelect(type)}
          >
            <Card.Content style={styles.emergencyContent}>
              <MaterialCommunityIcons
                name={type.icon as any}
                size={48}
                color={type.color}
              />
              <Text variant="titleMedium" style={styles.emergencyLabel}>
                {type.label}
              </Text>
            </Card.Content>
          </Card>
        ))}
      </View>

      <Button 
        mode="outlined" 
        onPress={onCancel}
        style={styles.cancelButton}
      >
        Cancelar
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontWeight: 'bold',
    color: '#FF1744',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 8,
    textAlign: 'center',
  },
  emergencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  emergencyCard: {
    width: '47%',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
  },
  emergencyContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emergencyLabel: {
    marginTop: 12,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 30,
  },
});