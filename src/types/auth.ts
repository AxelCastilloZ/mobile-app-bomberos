export interface MobileUser {
  id: number;
  username: string;
  email?: string;
  isAnonymous: boolean;
  deviceId?: string;
}

export interface AuthState {
  user: MobileUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  username: string; // Cambiado de email a username
  password: string;
}

export interface RegisterData {
  username: string;
  email?: string; // Opcional
  password: string;
  phoneNumber?: string; // Nuevo: datos personales
  fullName?: string; // Nuevo: datos personales
  deviceId?: string;
  deviceInfo?: any;
}

export interface CompleteProfileData {
  username: string;
  email?: string;
  password: string;
  phoneNumber?: string;
  fullName?: string;
}

export interface AuthResponse {
  access_token: string;
  user: MobileUser;
}

export interface AnonymousData {
  deviceId: string;
  deviceInfo?: any;
}

export interface DeviceLoginData {
  deviceId: string;
}
