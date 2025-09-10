
import { useState, useEffect } from 'react';
import { authService, LoginCredentials, User } from '../services/auth.service';

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      await authService.initialize();
      
      const isAuthenticated = authService.isAuthenticated();
      const currentUser = authService.getCurrentUser();
      
      setIsLoggedIn(isAuthenticated);
      setUser(currentUser);
      
      console.log('Auth initialized:', { isAuthenticated, user: currentUser });
    } catch (error) {
      console.error('Error inicializando auth:', error);
      setError('Error inicializando autenticación');
      setIsLoggedIn(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Iniciando login...');
      console.log('🎯 useAuth.login: Credenciales recibidas:', {
        username: credentials.username,
        passwordLength: credentials.password?.length
      });
      
      const result = await authService.login(credentials);
      
      setIsLoggedIn(true);
      setUser(result.user || null);
      
      console.log('Login exitoso:', result.user);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error de login';
      console.error('Error en login:', errorMessage);
      setError(errorMessage);
      setIsLoggedIn(false);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      
      setIsLoggedIn(false);
      setUser(null);
      setError(null);
      
      console.log('Logout completado');
    } catch (error) {
      console.error('Error en logout:', error);
      
      setIsLoggedIn(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await authService.changePassword(currentPassword, newPassword);
      console.log('Contraseña cambiada exitosamente');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error cambiando contraseña';
      console.error('Error cambiando contraseña:', errorMessage);
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserData = async () => {
    try {
      if (!authService.isAuthenticated()) return;
      
      const userData = await authService.fetchUserProfile();
      setUser(userData);
    } catch (error) {
      console.error('Error refrescando datos de usuario:', error);
      
      await logout();
    }
  };

  const clearError = () => {
    setError(null);
  };


  const hasRole = (role: string): boolean => {
    return authService.hasRole(role);
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return authService.hasAnyRole(roles);
  };

  const isSuperUser = (): boolean => {
    return authService.hasRole('SUPERUSER');
  };

  const isAdmin = (): boolean => {
    return authService.hasAnyRole(['ADMIN', 'SUPERUSER']);
  };

  const isPersonalBomberil = (): boolean => {
    return authService.hasAnyRole(['PERSONAL_BOMBERIL', 'ADMIN', 'SUPERUSER']);
  };

  const isVoluntario = (): boolean => {
    return authService.hasRole('VOLUNTARIO');
  };

  
  const hasAdminAccess = (): boolean => {
    return authService.hasAnyRole(['PERSONAL_BOMBERIL', 'ADMIN', 'SUPERUSER']);
  };

  return {
    
    isLoggedIn,
    isLoading,
    user,
    error,
    
    
    login,
    logout,
    changePassword,
    refreshUserData,
    clearError,
    
    
    hasRole,
    hasAnyRole,
    hasAdminAccess,
    isSuperUser,
    isAdmin,
    isPersonalBomberil,
    isVoluntario,
    
    // Datos de usuario
    username: user?.username,
    email: user?.email,
    roles: user?.roles || [],
  };
};