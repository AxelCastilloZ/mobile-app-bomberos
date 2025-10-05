// ========================================
// TIPOS CENTRALIZADOS PARA WEBSOCKET
// ========================================

// Re-exportar constantes
export {
    CONNECTION_STATUS,
    EMERGENCY_STATUS,
    SOCKET_EVENTS,
    UNIT_STATUS,
    WEBSOCKET_CONFIG
} from '../constants/websocket';

// ========================================
// TIPOS BÁSICOS
// ========================================

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
export type EmergencyStatus = 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled';
export type UnitStatus = 'available' | 'busy' | 'offline' | 'en_route';
export type EmergencyType = 'fire' | 'medical' | 'accident' | 'rescue' | 'hazmat' | 'flood' | 'other';
export type EmergencyPriority = 'low' | 'medium' | 'high' | 'critical';

// ========================================
// INTERFACES PRINCIPALES
// ========================================

export interface ConnectionInfo {
  status: ConnectionStatus;
  connectedAt?: number;
  lastHeartbeat?: number;
  reconnectAttempts: number;
  error?: string;
}

export interface EmergencyLocation {
  latitude: number;
  longitude: number;
  address?: string;
  landmark?: string;
  accuracy?: number;
}

export interface ReporterInfo {
  name?: string;
  phone?: string;
  isAnonymous: boolean;
}

export interface EmergencyData {
  id: string;
  type: EmergencyType;
  status: EmergencyStatus;
  priority: EmergencyPriority;
  description: string;
  location: EmergencyLocation;
  reportedBy: ReporterInfo;
  assignedUnits: string[];
  createdAt: number;
  updatedAt: number;
}

export interface UnitLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  timestamp: number;
}

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  contactInfo?: string;
}

export interface UnitData {
  id: string;
  code: string;
  name: string;
  type: string;
  status: UnitStatus;
  location?: UnitLocation;
  crew: CrewMember[];
  lastUpdate: number;
}

// ========================================
// EVENTOS WEBSOCKET
// ========================================

export interface EmergencyCreatedEvent {
  emergency: EmergencyData;
  alertLevel: 'normal' | 'urgent';
}

export interface EmergencyUpdatedEvent {
  emergencyId: string;
  changes: Partial<EmergencyData>;
  updatedBy: string;
  timestamp: number;
}

export interface UnitLocationUpdateEvent {
  unitId: string;
  location: UnitLocation;
  status?: UnitStatus;
}

// ========================================
// REQUESTS Y RESPONSES
// ========================================

export interface CreateEmergencyRequest {
  type: EmergencyType;
  priority: EmergencyPriority;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    landmark?: string;
  };
  reporter?: {
    name?: string;
    phone?: string;
  };
}

export interface UpdateEmergencyRequest {
  status?: EmergencyStatus;
  priority?: EmergencyPriority;
  description?: string;
  assignedUnits?: string[];
  notes?: string;
  updatedBy: string;
}

// ========================================
// HOOK TYPES
// ========================================

export interface UseRealtimeReturn {
  connection: ConnectionInfo;
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  hasError: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  emit: (event: string, data?: any) => void;
  reconnectAttempts: number;
  lastHeartbeat?: number;
  error?: string;
}

export interface UseEmergencyChannelReturn {
  emergencies: EmergencyData[];
  activeEmergencies: EmergencyData[];
  emergenciesByPriority: Record<string, EmergencyData[]>;
  emergenciesByType: Record<EmergencyType, EmergencyData[]>;
  stats: {
    total: number;
    active: number;
    pending: number;
    assigned: number;
    inProgress: number;
    resolved: number;
    critical: number;
  };
  isLoading: boolean;
  error?: string;
  isConnected: boolean;
  createEmergency: (request: CreateEmergencyRequest) => Promise<void>;
  updateEmergency: (id: string, updates: UpdateEmergencyRequest) => Promise<void>;
  assignUnits: (emergencyId: string, unitIds: string[]) => Promise<void>;
  changeStatus: (emergencyId: string, status: EmergencyStatus) => Promise<void>;
  changePriority: (emergencyId: string, priority: EmergencyPriority) => Promise<void>;
  resolveEmergency: (emergencyId: string) => Promise<void>;
  cancelEmergency: (emergencyId: string) => Promise<void>;
  getEmergencyById: (id: string) => EmergencyData | undefined;
}
