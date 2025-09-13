
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Chip, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { emergencyService } from '../services/emergency.service';
import { useAuth } from '../hooks/useAuth';
import { EMERGENCY_TYPES } from '../utils/constants';


interface EmergencyReport {
  id: string;
  type: string;
  location: {
    latitude: number;
    longitude: number;
  } | null;
  timestamp: Date;
  status?: string;
  priority?: string;
}

export const ReportsScreen: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [myReports, setMyReports] = useState<EmergencyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'public' | 'my'>('public');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      
     
      const publicReportsRaw = await emergencyService.getPublicReports();
      
      
      const publicReports: EmergencyReport[] = publicReportsRaw.map(report => ({
        id: report.id || `${Date.now()}_${Math.random()}`,
        type: report.type || 'unknown',
        location: report.location || null,
        timestamp: typeof report.timestamp === 'string' ? new Date(report.timestamp) : report.timestamp,
        status: report.status,
        priority: report.priority,
      }));
      
      setReports(publicReports);

    
      if (user) {
        const userReportsRaw = await emergencyService.getReportHistory();
        
        const userReports: EmergencyReport[] = userReportsRaw.map(report => ({
          id: report.id || `${Date.now()}_${Math.random()}`,
          type: report.type || 'unknown',
          location: report.location || null,
          timestamp: typeof report.timestamp === 'string' ? new Date(report.timestamp) : report.timestamp,
          status: report.status,
          priority: report.priority,
        }));
        
        setMyReports(userReports);
      }
    } catch (error) {
      console.error('Error cargando reportes:', error);
      setReports([]);
      setMyReports([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const getEmergencyTypeInfo = (typeId: string) => {
    return EMERGENCY_TYPES.find(t => t.id === typeId) || {
      label: typeId,
      icon: 'alert',
      color: '#666'
    };
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return '#FF8800';
      case 'acknowledged': return '#2196F3';
      case 'in_progress': return '#FF9800';
      case 'resolved': return '#4CAF50';
      case 'cancelled': return '#757575';
      default: return '#666';
    }
  };

  const formatLocation = (location: { latitude: number; longitude: number } | null) => {
    if (!location) return 'Ubicación no disponible';
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  };

  const renderReport = (report: EmergencyReport) => {
    const typeInfo = getEmergencyTypeInfo(report.type);
    
    return (
      <Card key={report.id} style={styles.reportCard}>
        <Card.Content>
          <View style={styles.reportHeader}>
            <View style={styles.typeInfo}>
              <MaterialCommunityIcons 
                name={typeInfo.icon as any} 
                size={24} 
                color={typeInfo.color} 
              />
              <Text variant="titleMedium" style={styles.typeLabel}>
                {typeInfo.label}
              </Text>
            </View>
            
            {report.status && (
              <Chip 
                mode="flat" 
                textStyle={{ color: getStatusColor(report.status) }}
                style={{ backgroundColor: `${getStatusColor(report.status)}20` }}
              >
                {report.status}
              </Chip>
            )}
          </View>

          <View style={styles.reportDetails}>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="clock" size={16} color="#666" />
              <Text variant="bodySmall" style={styles.detailText}>
                {new Date(report.timestamp).toLocaleString()}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
              <Text variant="bodySmall" style={styles.detailText}>
                {formatLocation(report.location)}
              </Text>
            </View>

            {report.priority && (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="flag" size={16} color="#666" />
                <Text variant="bodySmall" style={styles.detailText}>
                  Prioridad: {report.priority}
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D32F2F" />
        <Text style={styles.loadingText}>Cargando reportes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Reportes de Emergencia
        </Text>
        
        <View style={styles.tabContainer}>
          <Button
            mode={activeTab === 'public' ? 'contained' : 'outlined'}
            onPress={() => setActiveTab('public')}
            style={styles.tabButton}
            compact
          >
            Públicos
          </Button>
          
          {user && (
            <Button
              mode={activeTab === 'my' ? 'contained' : 'outlined'}
              onPress={() => setActiveTab('my')}
              style={styles.tabButton}
              compact
            >
              Mis Reportes
            </Button>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'public' && (
          <>
            {reports.length > 0 ? (
              reports.map(renderReport)
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="map-marker-off" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No hay reportes públicos</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'my' && (
          <>
            {myReports.length > 0 ? (
              myReports.map(renderReport)
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="file-document-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No tienes reportes</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  reportCard: {
    marginBottom: 12,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeLabel: {
    fontWeight: 'bold',
  },
  reportDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    color: '#666',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    color: '#999',
    fontSize: 16,
  },
});