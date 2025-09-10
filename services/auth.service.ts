
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
  user: User; 
}

const AUTH_TOKEN_KEY = '@bomberos_auth_token';
const USER_DATA_KEY = '@bomberos_user_data';

class AuthService {
  private currentUser: User | null = null;
  private authToken: string | null = null;

 
  async initialize(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const userData = await AsyncStorage.getItem(USER_DATA_KEY);

      if (token && userData) {
        this.authToken = token;
        this.currentUser = JSON.parse(userData);
        
        
        apiService.setAuthToken(token);
        
        
        const isValid = await this.validateToken();
        if (!isValid) {
          await this.logout();
        }
      }
    } catch (error) {
      console.error('Error inicializando AuthService:', error);
      await this.logout();
    }
  }

 
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('Intentando login con:', credentials.username);
      
      const response = await apiService.post<AuthResponse>('/auth/login', {
        username: credentials.username,
        password: credentials.password,
      });

      if (response.access_token) {
        
        this.authToken = response.access_token;
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.access_token);
        
        
        apiService.setAuthToken(response.access_token);
        
        
        const userData = await this.fetchUserProfile();
        this.currentUser = userData;
        
      
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

 
  async fetchUserProfile(): Promise<User> {
    try {
     
      const response = await apiService.get<User>('/auth/profile');
      return response;
    } catch (error) {
      
      return this.decodeTokenPayload();
    }
  }

 
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

 
  async validateToken(): Promise<boolean> {
    if (!this.authToken) return false;

    try {
     
      await apiService.get('/auth/validate'); 
      return true;
    } catch (error) {
      console.log('Token inválido o expirado');
      return false;
    }
  }

  
  async logout(): Promise<void> {
    try {
      
      await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY]);
      
 
      this.authToken = null;
      this.currentUser = null;
      
      
      apiService.removeAuthToken();
      
      console.log('Logout completado');
    } catch (error) {
      console.error('Error en logout:', error);
    }
  }

  
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
    if (!this.currentUser) return false;
    return this.currentUser.roles.includes(role);
  }

 
  hasAnyRole(roles: string[]): boolean {
    if (!this.currentUser) return false;
    return roles.some(role => this.currentUser!.roles.includes(role));
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
      
      await this.logout();
      throw error;
    }
  }
}

export const authService = new AuthService();