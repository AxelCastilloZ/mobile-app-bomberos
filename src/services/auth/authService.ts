import { useAuthStore } from '../../store/authStore';
import {
    AnonymousData,
    AuthResponse,
    CompleteProfileData,
    DeviceLoginData,
    LoginCredentials,
    RegisterData,
} from '../../types/auth';
import { apiClient, ApiResponse } from '../api/apiClient';

export class AuthService {
  private readonly endpoints = {
    anonymous: '/mobile/auth/anonymous',
    device: '/mobile/auth/device',
    register: '/mobile/auth/register',
    login: '/mobile/auth/login',
    completeProfile: '/mobile/auth/complete-profile',
  };

  /**
   * Crear usuario anónimo
   */
  async createAnonymous(data: AnonymousData): Promise<ApiResponse<AuthResponse>> {
    console.log('[AuthService] Creando usuario anónimo...');

    const response = await apiClient.post<AuthResponse>(
      this.endpoints.anonymous,
      data
    );

    if (response.data) {
      await useAuthStore.getState().setAuth(
        response.data.access_token,
        response.data.user
      );
      console.log('[AuthService] Usuario anónimo creado y autenticado');
    }

    return response;
  }

  /**
   * Login con deviceId
   */
  async loginWithDevice(data: DeviceLoginData): Promise<ApiResponse<AuthResponse>> {
    console.log('[AuthService] Login con dispositivo...');

    const response = await apiClient.post<AuthResponse>(
      this.endpoints.device,
      data
    );

    if (response.data) {
      await useAuthStore.getState().setAuth(
        response.data.access_token,
        response.data.user
      );
      console.log('[AuthService] Login con dispositivo exitoso');
    }

    return response;
  }

  /**
   * Registro de ciudadano
   */
  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    console.log('[AuthService] Registrando ciudadano...');

    const response = await apiClient.post<AuthResponse>(
      this.endpoints.register,
      data
    );

    if (response.data) {
      await useAuthStore.getState().setAuth(
        response.data.access_token,
        response.data.user
      );
      console.log('[AuthService] Registro exitoso');
    }

    return response;
  }

  /**
   * Login de ciudadano (email/password)
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    console.log('[AuthService] Login de ciudadano...');

    const response = await apiClient.post<AuthResponse>(
      this.endpoints.login,
      credentials
    );

    if (response.data) {
      await useAuthStore.getState().setAuth(
        response.data.access_token,
        response.data.user
      );
      console.log('[AuthService] Login exitoso');
    }

    return response;
  }

  /**
   * Completar perfil (anónimo → ciudadano)
   */
  async completeProfile(data: CompleteProfileData): Promise<ApiResponse<AuthResponse>> {
    console.log('[AuthService] Completando perfil...');

    const response = await apiClient.post<AuthResponse>(
      this.endpoints.completeProfile,
      data
    );

    if (response.data) {
      await useAuthStore.getState().setAuth(
        response.data.access_token,
        response.data.user
      );
      console.log('[AuthService] Perfil completado');
    }

    return response;
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    console.log('[AuthService] Cerrando sesión...');
    await useAuthStore.getState().logout();
    console.log('[AuthService] Sesión cerrada');
  }

  /**
   * Verificar si hay sesión activa
   */
  isAuthenticated(): boolean {
    return useAuthStore.getState().isAuthenticated;
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser() {
    return useAuthStore.getState().user;
  }

  /**
   * Obtener token actual
   */
  getToken(): string | null {
    return useAuthStore.getState().token;
  }
}

export const authService = new AuthService();
