import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { CONNECTION_STATUS, SOCKET_EVENTS } from '../constants/websocket';
import { socketClient } from '../services/realtime/socketClient';

interface SimpleRealtimeStore {
  connection: {
    status: string;
    connectedAt?: number;
    lastHeartbeat?: number;
    reconnectAttempts: number;
    error?: string;
  };
  isInitialized: boolean;
  emergencies: any[];
  units: any[];
  isLoading: boolean;
  error?: string;
  lastSync: number;

  connect: () => Promise<void>;
  disconnect: () => void;
  setConnection: (connection: any) => void;
  setEmergencies: (emergencies: any[]) => void;
  addEmergency: (emergency: any) => void;
  updateEmergency: (id: string, updates: any) => void;
  removeEmergency: (id: string) => void;
  setUnits: (units: any[]) => void;
  updateUnit: (id: string, updates: any) => void;
  setLoading: (loading: boolean) => void;
  setError: (error?: string) => void;
  resetStore: () => void;
}

const initialStoreState = {
  connection: {
    status: CONNECTION_STATUS.DISCONNECTED,
    reconnectAttempts: 0,
    connectedAt: undefined,
    lastHeartbeat: undefined,
    error: undefined,
  },
  isInitialized: false,
  emergencies: [],
  units: [],
  isLoading: false,
  error: undefined,
  lastSync: 0,
};

export const useRealtimeStore = create<SimpleRealtimeStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialStoreState,

    connect: async (): Promise<void> => {
      const { connection } = get();

      if (connection.status === CONNECTION_STATUS.CONNECTED) {
        console.log('Ya conectado al WebSocket');
        return;
      }

      set({ isLoading: true, error: undefined });

      try {
        await socketClient.connect();
        setupSocketListeners();

        set({
          connection: {
            ...connection,
            status: CONNECTION_STATUS.CONNECTED,
            connectedAt: Date.now(),
            reconnectAttempts: 0
          },
          isInitialized: true,
          isLoading: false,
          lastSync: Date.now()
        });

        console.log('Realtime store conectado exitosamente');
        await requestInitialData();

      } catch (error) {
        console.error('Error conectando realtime store:', error);
        set({
          connection: {
            ...connection,
            status: CONNECTION_STATUS.ERROR,
            error: error instanceof Error ? error.message : 'Error desconocido'
          },
          isLoading: false,
          error: error instanceof Error ? error.message : 'Error de conexión'
        });
      }
    },

    disconnect: (): void => {
      socketClient.disconnect();

      set({
        connection: {
          status: CONNECTION_STATUS.DISCONNECTED,
          reconnectAttempts: 0,
        },
        isInitialized: false,
        error: undefined,
      });

      console.log('Realtime store desconectado');
    },

    setConnection: (connection: any): void => {
      set({ connection });
    },

    setEmergencies: (emergencies: any[]): void => {
      set({
        emergencies: emergencies.sort((a, b) => b.createdAt - a.createdAt),
        lastSync: Date.now()
      });
    },

    addEmergency: (emergency: any): void => {
      const { emergencies } = get();

      if (emergencies.find(e => e.id === emergency.id)) {
        console.log('Emergencia ya existe:', emergency.id);
        return;
      }

      set({
        emergencies: [emergency, ...emergencies].sort((a, b) => b.createdAt - a.createdAt),
        lastSync: Date.now()
      });

      console.log('Nueva emergencia agregada:', emergency.id);
    },

    updateEmergency: (id: string, updates: any): void => {
      const { emergencies } = get();

      const updatedEmergencies = emergencies.map(emergency =>
        emergency.id === id
          ? { ...emergency, ...updates, updatedAt: Date.now() }
          : emergency
      );

      set({
        emergencies: updatedEmergencies.sort((a, b) => b.createdAt - a.createdAt),
        lastSync: Date.now()
      });

      console.log('Emergencia actualizada:', id);
    },

    removeEmergency: (id: string): void => {
      const { emergencies } = get();

      set({
        emergencies: emergencies.filter(e => e.id !== id),
        lastSync: Date.now()
      });

      console.log('Emergencia removida:', id);
    },

    setUnits: (units: any[]): void => {
      set({
        units: units.sort((a, b) => a.code.localeCompare(b.code)),
        lastSync: Date.now()
      });
    },

    updateUnit: (id: string, updates: any): void => {
      const { units } = get();

      const updatedUnits = units.map(unit =>
        unit.id === id
          ? { ...unit, ...updates, lastUpdate: Date.now() }
          : unit
      );

      set({
        units: updatedUnits.sort((a, b) => a.code.localeCompare(b.code)),
        lastSync: Date.now()
      });

      console.log('Unidad actualizada:', id);
    },

    setLoading: (loading: boolean): void => {
      set({ isLoading: loading });
    },

    setError: (error?: string): void => {
      set({ error });
    },

    resetStore: (): void => {
      set(initialStoreState);
      console.log('Realtime store reseteado');
    },
  }))
);

const setupSocketListeners = (): void => {
  const store = useRealtimeStore.getState();

  socketClient.on('connection_status_changed', (status: string) => {
    store.setConnection({
      ...store.connection,
      status: status,
      lastHeartbeat: status === CONNECTION_STATUS.CONNECTED ? Date.now() : store.connection.lastHeartbeat,
    });
  });

  socketClient.on(SOCKET_EVENTS.EMERGENCY_CREATED, (data: any) => {
    store.addEmergency(data.emergency);
  });

  socketClient.on(SOCKET_EVENTS.EMERGENCY_UPDATED, (data: any) => {
    store.updateEmergency(data.emergencyId, data.changes);
  });

  socketClient.on(SOCKET_EVENTS.EMERGENCY_ASSIGNED, (data: any) => {
    store.updateEmergency(data.emergencyId, {
      assignedUnits: data.unitIds,
      status: 'assigned'
    });
  });

  socketClient.on(SOCKET_EVENTS.EMERGENCY_CLOSED, (data: any) => {
    store.updateEmergency(data.emergencyId, {
      status: 'resolved'
    });
  });

  socketClient.on(SOCKET_EVENTS.UNIT_LOCATION_UPDATE, (data: any) => {
    store.updateUnit(data.unitId, {
      location: data.location,
      status: data.status
    });
  });

  socketClient.on(SOCKET_EVENTS.HEARTBEAT_RESPONSE, () => {
    store.setConnection({
      ...store.connection,
      lastHeartbeat: Date.now(),
    });
  });

  console.log('Socket listeners configurados');
};

const requestInitialData = async (): Promise<void> => {
  try {
    console.log('Solicitando datos iniciales...');

    socketClient.emit('request_active_emergencies');
    socketClient.emit('request_units_status');
    socketClient.emit('request_stats');

  } catch (error) {
    console.error('Error solicitando datos iniciales:', error);
  }
};

export const useConnection = () => useRealtimeStore(state => state.connection);
export const useEmergencies = () => useRealtimeStore(state => state.emergencies);
export const useUnits = () => useRealtimeStore(state => state.units);
export const useIsConnected = () => useRealtimeStore(state =>
  state.connection.status === CONNECTION_STATUS.CONNECTED
);
export const useActiveEmergencies = () => useRealtimeStore(state =>
  state.emergencies.filter(e => e.status !== 'resolved' && e.status !== 'cancelled')
);
