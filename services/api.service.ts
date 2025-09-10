// services/api.service.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  statusCode?: number;
}

class ApiService {
  private baseURL: string;
  private authToken: string | null = null;

 constructor() {
  this.baseURL = __DEV__ 
    ? 'http://10.0.2.2:3000' // ✅ Sin /api
    : 'https://tu-backend-production.com';
}

  /**
   * Configurar token de autenticación
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Remover token de autenticación
   */
  removeAuthToken(): void {
    this.authToken = null;
  }

  /**
   * Obtener headers por defecto
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Agregar Authorization header si hay token
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Realizar request HTTP
   */
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    console.log(`API Request: ${config.method || 'GET'} ${url}`);

    try {
      const response = await fetch(url, config);
      
      // Log de respuesta para debug
      console.log(`API Response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        // Manejar errores específicos
        if (response.status === 401) {
          // Token expirado o inválido
          this.removeAuthToken();
          await AsyncStorage.removeItem('@bomberos_auth_token');
          throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }

        if (response.status === 403) {
          throw new Error('No tienes permisos para realizar esta acción.');
        }

        if (response.status === 404) {
          throw new Error('Recurso no encontrado.');
        }

        if (response.status >= 500) {
          throw new Error('Error del servidor. Intenta nuevamente más tarde.');
        }

        // Intentar obtener mensaje de error del servidor
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || `Error ${response.status}`);
        } catch {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
      }

      // Verificar si la respuesta tiene contenido JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        // Si no es JSON, devolver texto o respuesta vacía
        const text = await response.text();
        return (text ? text : {}) as T;
      }

    } catch (error) {
      if (error instanceof Error) {
        console.error(`API Error: ${error.message}`);
        throw error;
      } else {
        console.error('API Error desconocido:', error);
        throw new Error('Error de conexión. Verifica tu conexión a internet.');
      }
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Health check simple
   */
async healthCheck(): Promise<boolean> {
  try {
    await this.get('/app-mobile/health'); // ✅ Ruta correcta
    return true;
  } catch (error) {
    console.warn('Health check failed:', error);
    return false;
  }
}

  /**
   * Upload de archivos (para futuras funcionalidades)
   */
  async uploadFile(endpoint: string, file: FormData): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {};
    
    // Solo agregar Authorization, no Content-Type para FormData
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: file,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  /**
   * Obtener URL base (útil para imágenes, etc.)
   */
  getBaseURL(): string {
    return this.baseURL;
  }
}

export const apiService = new ApiService();