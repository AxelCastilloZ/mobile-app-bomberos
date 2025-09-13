
import { apiService } from './api.service';
import { storageService } from './storage.service';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  roles: string[];
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

class AuthService {
  private currentUser: User | null = null;
  private authToken: string | null = null;

  async initialize(): Promise<void> {
    try {
      console.log('AuthService: Inicializando...');
      
      
      const serverAvailable = await apiService.initialize();
      if (!serverAvailable) {
        console.warn('AuthService: Servidor no disponible, modo offline');
      }
      
      
      const token = await storageService.getAuthToken();
      const userData = await storageService.getUserCredentials<User>();

      if (token && userData) {
        this.authToken = token;
        this.currentUser = userData;
        apiService.setAuthToken(token);
        
        console.log('AuthService: Sesión cargada:', userData.username);
        
        
        if (serverAvailable) {
          try {
            const isValid = await this.validateToken();
            if (!isValid) {
              console.log('AuthService: Token inválido, limpiando sesión');
              await this.clearLocalSession();
            }
          } catch (error) {
            console.warn('AuthService: Error validando token:', error);
          }
        }
      }
    } catch (error) {
      console.error('AuthService: Error en inicialización:', error);
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('AuthService: Iniciando login para:', credentials.username);
      
      
      const serverAvailable = await apiService.isServerAvailable();
      if (!serverAvailable) {
        
        const detectedUrl = await apiService.autoDetectServer();
        if (detectedUrl) {
          apiService.updateBaseURL(detectedUrl);
        } else {
          throw new Error('No se puede conectar al servidor. Verifica que esté ejecutándose y que estés en la misma red.');
        }
      }

      
      const response = await apiService.post<AuthResponse>('/auth/login', {
        username: credentials.username,
        password: credentials.password,
      });

      if (!response.access_token) {
        throw new Error('No se recibió token de acceso');
      }

      
      await storageService.saveAuthToken(response.access_token);
      await storageService.saveUserCredentials(response.user);
      
      this.authToken = response.access_token;
      this.currentUser = response.user;
      apiService.setAuthToken(response.access_token);

      
      await storageService.saveUserPreferences({
        username: response.user.username,
        lastLogin: new Date().toISOString(),
        roles: response.user.roles,
      });

      console.log('AuthService: Login exitoso para:', response.user.username);
      return response;

    } catch (error) {
      console.error('AuthService: Error en login:', error);
      
      
      if (error instanceof Error) {
        if (error.message.includes('Network request failed') || 
            error.message.includes('No se puede conectar')) {
          throw new Error('No se puede conectar al servidor. Verifica tu conexión de red.');
        } else if (error.message.includes('401') || 
                   error.message.includes('No autorizado') || 
                   error.message.includes('Usuario no encontrado')) {
          throw new Error('Usuario o contraseña incorrectos');
        } else if (error.message.includes('timeout') || 
                   error.message.includes('AbortError')) {
          throw new Error('Conexión lenta. Inténtalo de nuevo.');
        } else if (error.message.includes('500')) {
          throw new Error('Error del servidor. Inténtalo más tarde.');
        }
      }
      
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      console.log('AuthService: Cerrando sesión...');
      
      // Notificar al servidor si está disponible
      if (this.authToken && await apiService.isServerAvailable()) {
        try {
          await apiService.post('/auth/logout');
        } catch (error) {
          console.warn('AuthService: Error notificando logout:', error);
        }
      }
      
      await this.clearLocalSession();
      console.log('AuthService: Logout completado');
      
    } catch (error) {
      console.error('AuthService: Error en logout:', error);
      // Asegurar limpieza local aunque falle
      await this.clearLocalSession();
    }
  }

  async validateToken(): Promise<boolean> {
    try {
      if (!this.authToken) return false;
      
      await apiService.get('/auth/validate');
      return true;
    } catch (error) {
      console.warn('AuthService: Token inválido:', error);
      return false;
    }
  }

  async refreshToken(): Promise<void> {
    try {
      if (!this.authToken) {
        throw new Error('No hay token para refrescar');
      }

      const response = await apiService.post<AuthResponse>('/auth/refresh');
      
      if (response.access_token) {
        await storageService.saveAuthToken(response.access_token);
        this.authToken = response.access_token;
        apiService.setAuthToken(response.access_token);
        
        if (response.user) {
          this.currentUser = response.user;
          await storageService.saveUserCredentials(response.user);
        }
      }
    } catch (error) {
      console.error('AuthService: Error refrescando token:', error);
      throw error;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Debes estar autenticado para cambiar la contraseña');
      }

      await apiService.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      console.log('AuthService: Contraseña cambiada exitosamente');
    } catch (error) {
      console.error('AuthService: Error cambiando contraseña:', error);
      throw error;
    }
  }

  // Limpiar sesión local
  private async clearLocalSession(): Promise<void> {
    await storageService.deleteAuthToken();
    await storageService.deleteUserCredentials();
    
    this.authToken = null;
    this.currentUser = null;
    apiService.removeAuthToken();
  }

  // Getters y verificaciones
  isAuthenticated(): boolean {
    return this.authToken !== null && this.currentUser !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getToken(): string | null {
    return this.authToken;
  }

  hasRole(role: string): boolean {
    return this.currentUser?.roles.includes(role) ?? false;
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  isSuperUser(): boolean {
    return this.hasRole('SUPERUSER');
  }

  isAdmin(): boolean {
    return this.hasAnyRole(['ADMIN', 'SUPERUSER']);
  }

  isPersonalBomberil(): boolean {
    return this.hasAnyRole(['PERSONAL_BOMBERIL', 'ADMIN', 'SUPERUSER']);
  }

  isVoluntario(): boolean {
    return this.hasRole('VOLUNTARIO');
  }

  hasAdminAccess(): boolean {
    return this.hasAnyRole(['PERSONAL_BOMBERIL', 'ADMIN', 'SUPERUSER']);
  }

  // Info de sesión
  async getSessionInfo(): Promise<{
    isAuthenticated: boolean;
    user: User | null;
    lastLogin?: string;
    serverAvailable: boolean;
  }> {
    const preferences = await storageService.getUserPreferences();
    const serverAvailable = await apiService.isServerAvailable();
    
    return {
      isAuthenticated: this.isAuthenticated(),
      user: this.currentUser,
      lastLogin: preferences?.lastLogin,
      serverAvailable,
    };
  }
}

export const authService = new AuthService();