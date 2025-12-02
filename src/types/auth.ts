// src/types/auth.ts

export enum RoleEnum {
  SUPERUSER = 'SUPERUSER',
  ADMIN = 'ADMIN',
  PERSONAL_BOMBERIL = 'PERSONAL_BOMBERIL',
  VOLUNTARIO = 'VOLUNTARIO',
  CITIZEN = 'CITIZEN',
}

export interface MobileUser {
  id: number;
  username: string;
  email?: string;
  isAnonymous: boolean;
  deviceId?: string;
  roles?: RoleEnum[];
}

// Helper para verificar roles fácilmente
export const hasRole = (user: MobileUser | null, role: RoleEnum): boolean => {
  if (!user || !user.roles) return false;
  return user.roles.includes(role);
};

// Verifica si es personal autorizado (puede ver informes y modificar reportes)
export const isStaff = (user: MobileUser | null): boolean => {
  if (!user || !user.roles) return false;
  return user.roles.some(role =>
    [RoleEnum.SUPERUSER, RoleEnum.ADMIN, RoleEnum.PERSONAL_BOMBERIL].includes(role)
  );
};

export const canModifyReports = (user: MobileUser | null): boolean => {
  return isStaff(user);
};

export interface AuthState {
  user: MobileUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface CompleteProfileData {
  username: string;
  email: string;
  password: string;
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
