// src/screens/AdminScreen.tsx - Actualizado para Expo Router
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Chip, ActivityIndicator, List, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '../hooks/useAuth';
import { emergencyService } from '../services/emergency.service';
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
  deviceInfo?: {
    deviceName: string;
    platform: string;
  };
}

interface AdminStats {
  totalReports: number;
  pendingReports: number;
  activeReports: number;
  resolvedToday: number;
  reportsByType: Record<string, number>;
  reportsByStatus: Record<string, number>;
}

export const AdminScreen: React.FC = () => {
  const { user, hasAdminAccess } = useAuth();
  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<EmergencyReport | null>(null);

  useEffect(() => {
    if (hasAdminAccess()) {
      loadAdminData();
    }
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      const allReports = await emergencyService.getPublicReports();
      
      const processedReports: EmergencyReport[] = allReports.map(report => ({
        id: report.id || `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: report.type || 'unknown',
        location: report.location || null,
        timestamp: typeof report.timestamp === 'string' ? new Date(report.timestamp) : 
                   report.timestamp instanceof Date ? report.timestamp : new Date(),
        status: report.status || 'pending',
        priority: report.priority || 'medium',
        deviceInfo: report.deviceInfo || undefined,
      }));
      
      setReports(processedReports);
      
      const adminStats = calculateStats(processedReports);
      setStats(adminStats);
      
    } catch (error) {
      console.error('Error cargando datos administrativos:', error);
      
      setReports([]);
      setStats({
        totalReports: 0,
        pendingReports: 0,
        activeReports: 0,
        resolvedToday: 0,
        reportsByType: {},
        reportsByStatus: {},
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (reports: EmergencyReport[]): AdminStats => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reportsByType: Record<string, number> = {};
    const reportsByStatus: Record<string, number> = {};
    
    let pendingReports = 0;
    let activeReports = 0;
    let resolvedToday = 0;

    reports.forEach(report => {
      reportsByType[report.type] = (reportsByType[report.type] || 0) + 1;
      
      const status = report.status || 'pending';
      reportsByStatus[status] = (reportsByStatus[status] || 0) + 1;
      
      if (status === 'pending') pendingReports++;
      if (status === 'in_progress' || status === 'acknowledged') activeReports++;
      if (status === 'resolved' && new Date(report.timestamp) >= today) resolvedToday++;
    });

    return {
      totalReports: reports.length,
      pendingReports,
      activeReports,
      resolvedToday,
      reportsByType,
      reportsByStatus,
    };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAdminData();
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

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'acknowledged': return 'Reconocido';
      case 'in_progress': return 'En Progreso';
      case 'resolved': return 'Resuelto';
      case 'cancelled': return 'Cancelado';
      default: return 'Desconocido';
    }
  };

  const handleReportPress = (report: EmergencyReport) => {
    setSelectedReport(report);
    console.log('Reporte seleccionado:', report);
  };

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      console.log(`Actualizando reporte ${reportId} a estado ${newStatus}`);
      
      setReports(prevReports => 
        prevReports.map(report => 
          report.id === reportId 
            ? { ...report, status: newStatus }
            : report
        )
      );
      
      const updatedReports = reports.map(report => 
        report.id === reportId 
          ? { ...report, status: newStatus }
          : report
      );
      setStats(calculateStats(updatedReports));
      
    } catch (error) {
      console.error('Error actualizando estado del reporte:', error);
    }
  };

  if (!hasAdminAccess()) {
    return (
      <View style={styles.accessDeniedContainer}>
        <MaterialCommunityIcons name="shield-off" size={64} color="#F44336" />
        <Text variant="headlineSmall" style={styles.accessDeniedText}>
          Acceso Restringido
        </Text>
        <Text variant="bodyMedium" style={styles.accessDeniedSubtext}>
          No tienes permisos para acceder al panel administrativo.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D32F2F" />
        <Text style={styles.loadingText}>Cargando panel administrativo...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header administrativo */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerContent}>
            <MaterialCommunityIcons name="shield-account" size={40} color="#D32F2F" />
            <View style={styles.headerText}>
              <Text variant="headlineSmall" style={styles.welcomeText}>
                Panel Administrativo
              </Text>
              <Text variant="bodyMedium" style={styles.userText}>
                Bienvenido, {user?.username || 'Usuario'}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Estadísticas generales */}
      {stats && (
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Resumen General
            </Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={styles.statNumber}>
                  {stats.totalReports}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Total Reportes
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={[styles.statNumber, { color: '#FF8800' }]}>
                  {stats.pendingReports}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Pendientes
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={[styles.statNumber, { color: '#2196F3' }]}>
                  {stats.activeReports}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Activos
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={[styles.statNumber, { color: '#4CAF50' }]}>
                  {stats.resolvedToday}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Resueltos Hoy
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Reportes por tipo */}
      {stats && Object.keys(stats.reportsByType).length > 0 && (
        <Card style={styles.typeStatsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Reportes por Tipo
            </Text>
            
            {Object.entries(stats.reportsByType).map(([typeId, count]) => {
              const typeInfo = getEmergencyTypeInfo(typeId);
              return (
                <View key={typeId} style={styles.typeStatRow}>
                  <View style={styles.typeInfo}>
                    <MaterialCommunityIcons 
                      name={typeInfo.icon as any} 
                      size={24} 
                      color={typeInfo.color} 
                    />
                    <Text variant="bodyMedium" style={styles.typeLabel}>
                      {typeInfo.label}
                    </Text>
                  </View>
                  <Chip mode="flat" style={{ backgroundColor: `${typeInfo.color}20` }}>
                    {count}
                  </Chip>
                </View>
              );
            })}
          </Card.Content>
        </Card>
      )}

      {/* Lista de reportes recientes */}
      <Card style={styles.reportsCard}>
        <Card.Content>
          <View style={styles.reportsHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Reportes Recientes
            </Text>
            <Button mode="outlined" icon="filter" compact>
              Filtrar
            </Button>
          </View>

          {reports.length > 0 ? (
            reports.slice(0, 10).map((report) => {
              const typeInfo = getEmergencyTypeInfo(report.type);
              const statusColor = getStatusColor(report.status);
              
              return (
                <View key={report.id}>
                  <List.Item
                    title={typeInfo.label}
                    description={`${new Date(report.timestamp).toLocaleString()}\n${report.location ? `${report.location.latitude.toFixed(4)}, ${report.location.longitude.toFixed(4)}` : 'Sin ubicación'}`}
                    left={(props) => (
                      <MaterialCommunityIcons 
                        {...props} 
                        name={typeInfo.icon as any} 
                        size={24} 
                        color={typeInfo.color} 
                      />
                    )}
                    right={() => (
                      <View style={styles.reportActions}>
                        <Chip 
                          mode="flat" 
                          textStyle={{ color: statusColor, fontSize: 12 }}
                          style={{ backgroundColor: `${statusColor}20` }}
                        >
                          {getStatusLabel(report.status)}
                        </Chip>
                      </View>
                    )}
                    onPress={() => handleReportPress(report)}
                  />
                  <Divider />
                </View>
              );
            })
          ) : (
            <View style={styles.emptyReportsContainer}>
              <MaterialCommunityIcons name="clipboard-text-off" size={48} color="#ccc" />
              <Text style={styles.emptyReportsText}>
                No hay reportes disponibles
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Acciones rápidas */}
      <Card style={styles.actionsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Acciones Rápidas
          </Text>
          
          <View style={styles.actionsGrid}>
            <Button
              mode="contained"
              icon="view-dashboard"
              style={styles.actionButton}
              onPress={() => console.log('Ver dashboard completo')}
            >
              Dashboard Completo
            </Button>
            
            <Button
              mode="outlined"
              icon="file-export"
              style={styles.actionButton}
              onPress={() => console.log('Exportar reportes')}
            >
              Exportar Reportes
            </Button>
            
            <Button
              mode="outlined"
              icon="account-group"
              style={styles.actionButton}
              onPress={() => console.log('Gestionar personal')}
            >
              Gestionar Personal
            </Button>
            
            <Button
              mode="outlined"
              icon="cog"
              style={styles.actionButton}
              onPress={() => console.log('Configuraciones')}
            >
              Configuraciones
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
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
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  accessDeniedText: {
    color: '#F44336',
    marginTop: 16,
    textAlign: 'center',
  },
  accessDeniedSubtext: {
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  headerCard: {
    marginBottom: 16,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerText: {
    flex: 1,
  },
  welcomeText: {
    fontWeight: 'bold',
    color: '#D32F2F',
  },
  userText: {
    color: '#666',
    marginTop: 4,
  },
  statsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
    color: '#D32F2F',
  },
  statLabel: {
    color: '#666',
    textAlign: 'center',
    fontSize: 12,
  },
  typeStatsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  typeStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeLabel: {
    fontWeight: '500',
  },
  reportsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  reportsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportActions: {
    justifyContent: 'center',
  },
  emptyReportsContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyReportsText: {
    marginTop: 16,
    color: '#999',
    fontSize: 16,
  },
  actionsCard: {
    marginBottom: 32,
    elevation: 2,
  },
  actionsGrid: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
});