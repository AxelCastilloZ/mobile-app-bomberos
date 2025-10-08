/**
 * 🧪 TEST OFFLINE COMPONENT
 *
 * Componente para probar funcionalidades del Módulo 4
 * - Estado de conexión
 * - Cola de operaciones
 * - Sincronización
 * - Caché
 * - Storage seguro
 */

import { useOffline } from '@/hooks/useOffline';
import { emergencyQueue } from '@/services/background/emergencyQueue';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// ============================================================================
// REGISTRAR HANDLERS DE PRUEBA
// ============================================================================

// Handler para UPDATE_REPORT_STATUS
emergencyQueue.registerHandler('UPDATE_REPORT_STATUS', async (payload) => {
  console.log('[TEST] 🔄 Procesando UPDATE_REPORT_STATUS:', payload);

  // Simular llamada API
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('[TEST] ✅ Reporte actualizado:', payload.reportId, 'Estado:', payload.status);
  // Aquí irá la llamada real al backend cuando esté implementado
  // await api.updateReportStatus(payload.reportId, payload.status);
});

// Handler para UPDATE_PROFILE
emergencyQueue.registerHandler('UPDATE_PROFILE', async (payload) => {
  console.log('[TEST] 🔄 Procesando UPDATE_PROFILE:', payload);
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('[TEST] ✅ Perfil actualizado');
  // await api.updateProfile(payload);
});

// Handler para MARK_NOTIFICATION_READ
emergencyQueue.registerHandler('MARK_NOTIFICATION_READ', async (payload) => {
  console.log('[TEST] 🔄 Procesando MARK_NOTIFICATION_READ:', payload);
  await new Promise(resolve => setTimeout(resolve, 300));
  console.log('[TEST] ✅ Notificación marcada como leída');
  // await api.markNotificationRead(payload.notificationId);
});

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function TestOffline() {
  const offline = useOffline();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Actualizar debug info cada 2 segundos
  useEffect(() => {
    const interval = setInterval(async () => {
      const info = await offline.getDebugInfo();
      setDebugInfo(info);
    }, 2000);

    return () => clearInterval(interval);
  }, [offline]);

  // ==========================================================================
  // HANDLERS DE PRUEBA
  // ==========================================================================

  const handleTestEnqueue = async () => {
    setLoading(true);
    const result = await offline.enqueueOperation(
      'UPDATE_REPORT_STATUS',
      { reportId: '123', status: 'in_progress' },
      'high'
    );

    Alert.alert(
      result.success ? 'Éxito' : 'Error',
      result.success
        ? `Operación encolada: ${result.id}`
        : `Error: ${result.error}`
    );
    setLoading(false);
  };

  const handleTestSync = async () => {
    setLoading(true);
    const result = await offline.syncNow();

    Alert.alert(
      result.success ? 'Sincronización Completa' : 'Error',
      result.success
        ? 'Cola sincronizada correctamente'
        : `Error: ${result.error}`
    );
    setLoading(false);
  };

  const handleTestCache = async () => {
    setLoading(true);

    // Guardar en caché
    const saveResult = await offline.saveToCache('test_data', {
      timestamp: Date.now(),
      message: 'Test de caché offline',
    });

    if (saveResult.success) {
      // Leer de caché
      const getResult = await offline.getFromCache('test_data');

      Alert.alert(
        'Caché Test',
        getResult.success
          ? `Dato guardado y leído: ${JSON.stringify(getResult.data, null, 2)}`
          : `Error leyendo: ${getResult.error}`
      );
    } else {
      Alert.alert('Error', `No se pudo guardar: ${saveResult.error}`);
    }

    setLoading(false);
  };

  const handleTestSecure = async () => {
    setLoading(true);

    // Guardar en secure storage
    const saveResult = await offline.saveSecure('test_token', 'test_jwt_token_12345');

    if (saveResult.success) {
      // Leer de secure storage
      const getResult = await offline.getSecure('test_token');

      Alert.alert(
        'Secure Storage Test',
        getResult.success
          ? `Token guardado y leído: ${getResult.data}`
          : `Error leyendo: ${getResult.error}`
      );
    } else {
      Alert.alert('Error', `No se pudo guardar: ${saveResult.error}`);
    }

    setLoading(false);
  };

  const handleClearQueue = async () => {
    Alert.alert(
      'Confirmar',
      '¿Limpiar toda la cola?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            await offline.clearQueue();
            setLoading(false);
          },
        },
      ]
    );
  };

  const handlePruneQueue = async () => {
    setLoading(true);
    const result = await offline.pruneQueue();

    Alert.alert(
      'Limpieza Completada',
      result.success
        ? `${result.data} operaciones completadas eliminadas`
        : `Error: ${result.error}`
    );
    setLoading(false);
  };

  const handleCheckConnection = async () => {
    setLoading(true);
    const isOnline = await offline.checkConnection();

    Alert.alert(
      'Estado de Conexión',
      isOnline ? 'Conectado a internet' : 'Sin conexión'
    );
    setLoading(false);
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  const queueStats = offline.getQueueStats();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Test Offline & Background</Text>

      {/* Estado de Conexión */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estado de Conexión</Text>
        <View style={styles.statusRow}>
          <Text>Internet: </Text>
          <Text style={offline.isOnline ? styles.online : styles.offline}>
            {offline.isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text>Conectado: </Text>
          <Text style={offline.isConnected ? styles.online : styles.offline}>
            {offline.isConnected ? 'Sí' : 'No'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={handleCheckConnection}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Verificar Conexión</Text>
        </TouchableOpacity>
      </View>

      {/* Cola de Operaciones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cola de Operaciones</Text>
        <Text>Total: {queueStats.total}</Text>
        <Text>Pendientes: {queueStats.pending}</Text>
        <Text>Procesando: {queueStats.processing}</Text>
        <Text>Exitosas: {queueStats.success}</Text>
        <Text>Fallidas: {queueStats.failed}</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSmall]}
            onPress={handleTestEnqueue}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Encolar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSmall]}
            onPress={handlePruneQueue}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Limpiar Completadas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSmall, styles.buttonDanger]}
            onPress={handleClearQueue}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Limpiar Todo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sincronización */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sincronización</Text>
        <View style={styles.statusRow}>
          <Text>Estado: </Text>
          <Text style={styles.status}>{offline.syncInfo.status}</Text>
        </View>
        <Text>Última sync: {
          offline.syncInfo.lastSyncAt
            ? new Date(offline.syncInfo.lastSyncAt).toLocaleTimeString()
            : 'Nunca'
        }</Text>
        <Text>Auto-sync: {offline.autoSync ? 'Habilitado' : 'Deshabilitado'}</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSmall]}
            onPress={handleTestSync}
            disabled={loading || !offline.isOnline}
          >
            <Text style={styles.buttonText}>Sincronizar Ahora</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSmall]}
            onPress={() => offline.setAutoSync(!offline.autoSync)}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {offline.autoSync ? 'Deshabilitar' : 'Habilitar'} Auto-sync
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Caché */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Caché</Text>
        <Text>Estado: {offline.cacheEnabled ? 'Habilitado' : 'Deshabilitado'}</Text>
        <Text>Tamaño: {(offline.cacheSize / 1024).toFixed(2)} KB</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSmall]}
            onPress={handleTestCache}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test Caché</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSmall]}
            onPress={() => offline.toggleCache(!offline.cacheEnabled)}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {offline.cacheEnabled ? 'Deshabilitar' : 'Habilitar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSmall, styles.buttonDanger]}
            onPress={offline.clearCache}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Limpiar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Storage Seguro */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage Seguro</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={handleTestSecure}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Secure Storage</Text>
        </TouchableOpacity>
      </View>

      {/* Debug Info */}
      {debugInfo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug Info</Text>
          <ScrollView style={styles.debugBox}>
            <Text style={styles.debugText}>
              {JSON.stringify(debugInfo, null, 2)}
            </Text>
          </ScrollView>
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#dc2626" />
        </View>
      )}
    </ScrollView>
  );
}

// ==========================================================================
// ESTILOS
// ==========================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  online: {
    color: '#16a34a',
    fontWeight: '600',
  },
  offline: {
    color: '#dc2626',
    fontWeight: '600',
  },
  status: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  button: {
    backgroundColor: '#dc2626',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonSmall: {
    flex: 1,
    marginHorizontal: 4,
  },
  buttonDanger: {
    backgroundColor: '#991b1b',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  debugBox: {
    backgroundColor: '#1f2937',
    padding: 12,
    borderRadius: 8,
    maxHeight: 300,
  },
  debugText: {
    color: '#10b981',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
