import { useAuthStore } from '@/store/authStore';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE_URL = 'http://192.168.100.5:3000';
const REQUEST_TIMEOUT = 10000;

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

export class ApiClient {
  private client: AxiosInstance;

  constructor(baseUrl: string = API_BASE_URL, timeout: number = REQUEST_TIMEOUT) {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - Agregar token automáticamente
    this.client.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().token;

        if (token && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - Manejo centralizado de errores
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[API] Success ${response.status}:`, response.data);
        return response;
      },
      async (error: AxiosError) => {
        if (error.response) {
          const status = error.response.status;
          console.error(`[API] Error ${status}:`, error.response.data);

          // Auto-logout en 401 (token inválido/expirado)
          if (status === 401) {
            console.warn('[API] Token inválido - cerrando sesión...');
            await useAuthStore.getState().logout();
          }
        } else if (error.request) {
          console.error('[API] No response:', error.message);
        } else {
          console.error('[API] Error:', error.message);
        }

        return Promise.reject(error);
      }
    );
  }

  private handleError(error: any): ApiResponse {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;

      // Timeout
      if (axiosError.code === 'ECONNABORTED') {
        return {
          error: 'Timeout: La solicitud tardó demasiado',
          statusCode: 408,
        };
      }

      // Error de red
      if (!axiosError.response) {
        return {
          error: 'Error de red. Verifica tu conexión y que el servidor esté corriendo.',
          statusCode: 0,
        };
      }

      // Error del servidor
      const response = axiosError.response;
      return {
        error: response.data?.message || `Error ${response.status}`,
        statusCode: response.status,
      };
    }

    // Error desconocido
    return {
      error: error.message || 'Error desconocido',
    };
  }

  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get<T>(endpoint, config);
      return {
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async post<T>(
    endpoint: string,
    body?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<T>(endpoint, body, config);
      return {
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async put<T>(
    endpoint: string,
    body?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put<T>(endpoint, body, config);
      return {
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async patch<T>(
    endpoint: string,
    body?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch<T>(endpoint, body, config);
      return {
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete<T>(
    endpoint: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete<T>(endpoint, config);
      return {
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Cancelar request específico
   */
  createCancelToken() {
    return axios.CancelToken.source();
  }

  /**
   * Verificar si fue cancelado
   */
  isCancel(error: any): boolean {
    return axios.isCancel(error);
  }

  /**
   * Cambiar base URL
   */
  setBaseUrl(url: string): void {
    this.client.defaults.baseURL = url;
  }

  /**
   * Obtener base URL
   */
  getBaseUrl(): string {
    return this.client.defaults.baseURL || '';
  }

  /**
   * Obtener instancia de Axios (para casos avanzados)
   */
  getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();
