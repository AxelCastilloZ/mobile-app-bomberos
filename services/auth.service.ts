// services/auth.service.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api.service';

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
  user: User; // Ahora es requerido, no opcional
}

const AUTH_TOKEN_KEY = '@bomberos_auth_token';
const USER_DATA_KEY = '@bomberos_user_data';

class AuthService {
  private currentUser: User | null = null;
  private authToken: string | null = null;

  /**
   * Inicializar el servicio de autenticación
   * Cargar token y datos del usuario desde AsyncStorage
   */
  async initialize(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const userData = await AsyncStorage.getItem(USER_DATA_KEY);

      if (token && userData) {
        this.authToken = token;
        this.currentUser = JSON.parse(userData);
        
        // Configurar el token en apiService para requests automáticos
        apiService.setAuthToken(token);
        
        // Verificar si el token sigue siendo válido
        const isValid = await this.validateToken();
        if (!isValid) {
          await this.logout();
        }
      }
    } catch (error) {
      console.error('Error inicializando AuthService:', error);
      await this.logout(); // Limpiar datos corruptos
    }
  }

  /**
   * Login con el backend de NestJS
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('Intentando login con:', credentials.username);
      
      const response = await apiService.post<AuthResponse>('/auth/login', {
        username: credentials.username,
        password: credentials.password,
      });

      if (response.access_token) {
        // Guardar token
        this.authToken = response.access_token;
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.access_token);
        
        // Configurar token para requests futuros
        apiService.setAuthToken(response.access_token);
        
        // Obtener datos del usuario desde el token o hacer un request adicional
        const userData = await this.fetchUserProfile();
        this.currentUser = userData;
        
        // Guardar datos del usuario
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
        
        console.log('Login exitoso para:', userData.username);
        return { access_token: response.access_token, user: userData };
      } else {
        throw new Error('No se recibió token de acceso');
      }
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  /**
   * Obtener perfil del usuario autenticado
   */
  async fetchUserProfile(): Promise<User> {
    try {
      // Si tu backend tiene un endpoint /auth/profile o similar
      const response = await apiService.get<User>('/auth/profile');
      return response;
    } catch (error) {
      // Si no hay endpoint de perfil, decodificar del JWT
      return this.decodeTokenPayload();
    }
  }

  /**
   * Decodificar payload del JWT (sin verificar firma - solo para datos básicos)
   */
  private decodeTokenPayload(): User {
    if (!this.authToken) {
      throw new Error('No hay token disponible');
    }

    try {
      const payload = this.authToken.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      
      return {
        id: decoded.sub,
        username: decoded.username,
        email: decoded.email || '',
        roles: decoded.roles || []
      };
    } catch (error) {
      throw new Error('Error decodificando token');
    }
  }

  /**
   * Validar si el token actual sigue siendo válido
   */
  async validateToken(): Promise<boolean> {
    if (!this.authToken) return false;

    try {
      // Hacer un request simple para verificar el token
      await apiService.get('/auth/validate'); // O cualquier endpoint protegido
      return true;
    } catch (error) {
      console.log('Token inválido o expirado');
      return false;
    }
  }

  /**
   * Logout y limpiar datos
   */
  async logout(): Promise<void> {
    try {
      // Limpiar AsyncStorage
      await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY]);
      
      // Limpiar memoria
      this.authToken = null;
      this.currentUser = null;
      
      // Limpiar token del apiService
      apiService.removeAuthToken();
      
      console.log('Logout completado');
    } catch (error) {
      console.error('Error en logout:', error);
    }
  }

  /**
   * Verificar si el usuario está logueado
   */
  isAuthenticated(): boolean {
    return this.authToken !== null && this.currentUser !== null;
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Obtener token actual
   */
  getToken(): string | null {
    return this.authToken;
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.roles.includes(role);
  }

  /**
   * Verificar si el usuario tiene alguno de los roles especificados
   */
  hasAnyRole(roles: string[]): boolean {
    if (!this.currentUser) return false;
    return roles.some(role => this.currentUser!.roles.includes(role));
  }

  /**
   * Verificar si es SUPERUSER
   */
  isSuperUser(): boolean {
    return this.hasRole('SUPERUSER');
  }

  /**
   * Verificar si es ADMIN o SUPERUSER
   */
  isAdmin(): boolean {
    return this.hasAnyRole(['ADMIN', 'SUPERUSER']);
  }

  /**
   * Verificar si es PERSONAL_BOMBERIL (personal autorizado)  
   */
  isPersonalBomberil(): boolean {
    return this.hasAnyRole(['PERSONAL_BOMBERIL', 'ADMIN', 'SUPERUSER']);
  }

  /**
   * Verificar si es VOLUNTARIO
   */
  isVoluntario(): boolean {
    return this.hasRole('VOLUNTARIO');
  }

  /**
   * Verificar si tiene acceso administrativo (las funciones principales de la app)
   */
  hasAdminAccess(): boolean {
    return this.hasAnyRole(['PERSONAL_BOMBERIL', 'ADMIN', 'SUPERUSER']);
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await apiService.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      throw error;
    }
  }

  /**
   * Refrescar token (si tu backend lo soporta)
   */
  async refreshToken(): Promise<void> {
    try {
      const response = await apiService.post<AuthResponse>('/auth/refresh');
      if (response.access_token) {
        this.authToken = response.access_token;
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.access_token);
        apiService.setAuthToken(response.access_token);
      }
    } catch (error) {
      console.error('Error refrescando token:', error);
      // Si falla el refresh, hacer logout
      await this.logout();
      throw error;
    }
  }
}

export const authService = new AuthService();