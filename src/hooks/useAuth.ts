
import { useState, useEffect, useCallback } from 'react';
import { authService, User, LoginCredentials } from '../services/auth.service';

export interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    isLoggedIn: false,
    user: null,
    isLoading: true,
    error: null,
  });

  
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        await authService.initialize();
        
        setState({
          isLoggedIn: authService.isAuthenticated(),
          user: authService.getCurrentUser(),
          isLoading: false,
          error: null,
        });
        
      } catch (error) {
        console.error('useAuth: Error en inicialización:', error);
        setState({
          isLoggedIn: false,
          user: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Error de inicialización',
        });
      }
    };

    initializeAuth();
  }, []);

  
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await authService.login(credentials);
      
      setState({
        isLoggedIn: true,
        user: response.user,
        isLoading: false,
        error: null,
      });

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error de autenticación';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      throw new Error(errorMessage);
    }
  }, []);

  
  const logout = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      await authService.logout();
      
      setState({
        isLoggedIn: false,
        user: null,
        isLoading: false,
        error: null,
      });

    } catch (error) {
      console.error('useAuth: Error en logout:', error);
      
      setState({
        isLoggedIn: false,
        user: null,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  
  const refreshToken = useCallback(async () => {
    try {
      await authService.refreshToken();
      
      setState(prev => ({
        ...prev,
        user: authService.getCurrentUser(),
        error: null,
      }));
      
    } catch (error) {
      console.error('useAuth: Error refrescando token:', error);
      
      await logout();
    }
  }, [logout]);

  
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await authService.changePassword(currentPassword, newPassword);
      
      setState(prev => ({ ...prev, isLoading: false, error: null }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error cambiando contraseña';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      throw new Error(errorMessage);
    }
  }, []);

  
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  
  const hasRole = useCallback((role: string): boolean => {
    return authService.hasRole(role);
  }, []);

  const hasAnyRole = useCallback((roles: string[]): boolean => {
    return authService.hasAnyRole(roles);
  }, []);

  const isSuperUser = useCallback((): boolean => {
    return authService.isSuperUser();
  }, []);

  const isAdmin = useCallback((): boolean => {
    return authService.isAdmin();
  }, []);

  const isPersonalBomberil = useCallback((): boolean => {
    return authService.isPersonalBomberil();
  }, []);

  const isVoluntario = useCallback((): boolean => {
    return authService.isVoluntario();
  }, []);

  const hasAdminAccess = useCallback((): boolean => {
    return authService.hasAdminAccess();
  }, []);

  // Validar token
  const validateToken = useCallback(async (): Promise<boolean> => {
    try {
      const isValid = await authService.validateToken();
      if (!isValid && state.isLoggedIn) {
        await logout();
      }
      return isValid;
    } catch (error) {
      console.error('useAuth: Error validando token:', error);
      return false;
    }
  }, [state.isLoggedIn, logout]);

  
  const getSessionInfo = useCallback(async () => {
    try {
      return await authService.getSessionInfo();
    } catch (error) {
      console.error('useAuth: Error obteniendo info de sesión:', error);
      return null;
    }
  }, []);

  return {
    
    isLoggedIn: state.isLoggedIn,
    user: state.user,
    isLoading: state.isLoading,
    error: state.error,

    
    login,
    logout,
    refreshToken,
    changePassword,

    
    clearError,
    validateToken,
    getSessionInfo,

  
    hasRole,
    hasAnyRole,
    isSuperUser,
    isAdmin,
    isPersonalBomberil,
    isVoluntario,
    hasAdminAccess,

    
    token: authService.getToken(),
  };
};