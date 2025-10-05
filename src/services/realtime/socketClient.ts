import { io, Socket } from 'socket.io-client';
import { CONNECTION_STATUS, SOCKET_EVENTS, WEBSOCKET_CONFIG } from '../../constants/websocket';

export class SocketClient {
  private socket: Socket | null = null;
  private connectionStatus: string = CONNECTION_STATUS.DISCONNECTED;
  private reconnectAttempts: number = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.setupEventListeners();
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.setConnectionStatus(CONNECTION_STATUS.CONNECTING);
      console.log('Conectando a WebSocket:', WEBSOCKET_CONFIG.URL);

      this.socket = io(WEBSOCKET_CONFIG.URL, {
        transports: ['websocket'],
        timeout: WEBSOCKET_CONFIG.CONNECTION_TIMEOUT,
        forceNew: true,
        reconnection: false,
      });

      this.connectionTimeout = setTimeout(() => {
        reject(new Error('Timeout al conectar con el servidor'));
      }, WEBSOCKET_CONFIG.CONNECTION_TIMEOUT);

      this.socket.on(SOCKET_EVENTS.CONNECT, () => {
        this.clearConnectionTimeout();
        this.setConnectionStatus(CONNECTION_STATUS.CONNECTED);
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        console.log('WebSocket conectado');
        resolve();
      });

      this.socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
        this.clearConnectionTimeout();
        this.setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
        this.stopHeartbeat();
        console.log('WebSocket desconectado:', reason);

        if (reason === 'io server disconnect') {
          return;
        }

        this.handleReconnection();
      });

      this.socket.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
        this.clearConnectionTimeout();
        this.setConnectionStatus(CONNECTION_STATUS.ERROR);
        console.error('Error de conexión WebSocket:', error);
        reject(error);
        this.handleReconnection();
      });

      this.socket.on(SOCKET_EVENTS.HEARTBEAT_RESPONSE, () => {
        console.log('Heartbeat recibido');
      });
    });
  }

  disconnect(): void {
    console.log('Desconectando WebSocket...');

    this.clearConnectionTimeout();
    this.stopHeartbeat();
    this.setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.reconnectAttempts = 0;
    console.log('WebSocket desconectado');
  }

  emit(event: string, data?: any): void {
    if (!this.socket?.connected) {
      console.warn('No se puede enviar evento, WebSocket no conectado:', event);
      return;
    }

    console.log('Enviando evento:', event, data);
    this.socket.emit(event, data);
  }

  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);

    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  off(event: string, callback?: Function): void {
    if (callback) {
      const listeners = this.eventListeners.get(event) || [];
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
      this.socket?.off(event, callback as any);
    } else {
      this.eventListeners.delete(event);
      this.socket?.off(event);
    }
  }

  getConnectionStatus(): string {
    return this.connectionStatus;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  private setConnectionStatus(status: string): void {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      this.emitToListeners('connection_status_changed', status);
    }
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts >= WEBSOCKET_CONFIG.RECONNECT_ATTEMPTS) {
      console.error('Máximo de intentos de reconexión alcanzado');
      this.setConnectionStatus(CONNECTION_STATUS.ERROR);
      return;
    }

    this.reconnectAttempts++;
    this.setConnectionStatus(CONNECTION_STATUS.RECONNECTING);

    const delay = Math.min(
      WEBSOCKET_CONFIG.RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts - 1),
      WEBSOCKET_CONFIG.MAX_RECONNECT_DELAY
    );

    console.log(`Reintentando conexión (${this.reconnectAttempts}/${WEBSOCKET_CONFIG.RECONNECT_ATTEMPTS}) en ${delay}ms`);

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Error en reconexión:', error);
      });
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        console.log('Enviando heartbeat');
        this.emit(SOCKET_EVENTS.HEARTBEAT, { timestamp: Date.now() });
      }
    }, WEBSOCKET_CONFIG.HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private clearConnectionTimeout(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  private setupEventListeners(): void {
    // Setup básico
  }

  private emitToListeners(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error en listener:', error);
      }
    });
  }
}

export const socketClient = new SocketClient();
