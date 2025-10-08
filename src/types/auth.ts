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
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  deviceId?: string;
  deviceInfo?: any;
}

export interface CompleteProfileData {
  email: string;
  password: string;
  username: string;
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
