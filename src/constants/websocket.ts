import Constants from 'expo-constants';

export const WEBSOCKET_CONFIG = {
  URL: Constants.expoConfig?.extra?.wsEndpoint ||
       (__DEV__ ? 'ws://192.168.100.115:3000' : 'wss://api.bomberos-nosara.cr'),

  HEARTBEAT_INTERVAL: 10000,
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 1000,
  MAX_RECONNECT_DELAY: 30000,

  CONNECTION_TIMEOUT: 15000,
  RESPONSE_TIMEOUT: 5000,
} as const;

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  RECONNECT: 'reconnect',
  RECONNECT_ERROR: 'reconnect_error',

  EMERGENCY_CREATED: 'emergency_created',
  EMERGENCY_UPDATED: 'emergency_status_updated',
  EMERGENCY_ASSIGNED: 'emergency_assigned',
  EMERGENCY_CLOSED: 'emergency_closed',

  HEARTBEAT: 'heartbeat',
  HEARTBEAT_RESPONSE: 'heartbeat_response',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',

  LOCATION_UPDATE: 'location_update',
  UNIT_LOCATION_UPDATE: 'unit_location_update',
} as const;

export const CONNECTION_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
} as const;

export const EMERGENCY_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled',
} as const;

export const UNIT_STATUS = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  OFFLINE: 'offline',
  EN_ROUTE: 'en_route',
} as const;

export type ConnectionStatus = typeof CONNECTION_STATUS[keyof typeof CONNECTION_STATUS];
export type EmergencyStatus = typeof EMERGENCY_STATUS[keyof typeof EMERGENCY_STATUS];
export type UnitStatus = typeof UNIT_STATUS[keyof typeof UNIT_STATUS];
export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
